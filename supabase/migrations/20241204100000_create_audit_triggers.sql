-- ============================================================================
-- Migration: Create Audit Triggers
-- Description: 自動審計觸發器 - 記錄表操作至審計日誌
-- Created: 2024-12-04
-- 
-- Purpose:
--   - Auto-log CRUD operations on key tables to audit_logs
--   - Capture old/new values for change tracking
--   - Enable activity timeline in Blueprint Overview
-- ============================================================================

-- ============================================================================
-- Generic Audit Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_audit_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_entity_type audit_entity_type;
  v_entity_id UUID;
  v_entity_name TEXT;
  v_action audit_action;
  v_blueprint_id UUID;
  v_organization_id UUID;
  v_old_value JSONB;
  v_new_value JSONB;
  v_changes JSONB;
  v_actor_id UUID;
  v_actor_name TEXT;
BEGIN
  -- Get current user
  v_actor_id := COALESCE((select auth.uid()), '00000000-0000-0000-0000-000000000000'::UUID);
  SELECT name INTO v_actor_name FROM public.accounts WHERE id = v_actor_id;

  -- Determine entity type from table name (passed as TG_ARGV[0])
  v_entity_type := TG_ARGV[0]::audit_entity_type;

  -- Determine action
  CASE TG_OP
    WHEN 'INSERT' THEN v_action := 'create';
    WHEN 'UPDATE' THEN v_action := 'update';
    WHEN 'DELETE' THEN v_action := 'delete';
  END CASE;

  -- Extract entity_id, entity_name, blueprint_id based on operation
  IF TG_OP = 'DELETE' THEN
    v_entity_id := OLD.id;
    v_old_value := to_jsonb(OLD);
    v_new_value := NULL;
    
    -- Get entity name and blueprint_id from OLD record
    IF OLD ? 'title' THEN v_entity_name := OLD.title::TEXT;
    ELSIF OLD ? 'name' THEN v_entity_name := OLD.name::TEXT;
    END IF;
    
    IF OLD ? 'blueprint_id' THEN v_blueprint_id := OLD.blueprint_id;
    END IF;
    IF OLD ? 'organization_id' THEN v_organization_id := OLD.organization_id;
    END IF;
  ELSE
    v_entity_id := NEW.id;
    v_new_value := to_jsonb(NEW);
    
    IF TG_OP = 'UPDATE' THEN
      v_old_value := to_jsonb(OLD);
    END IF;
    
    -- Get entity name and blueprint_id from NEW record
    IF NEW ? 'title' THEN v_entity_name := NEW.title::TEXT;
    ELSIF NEW ? 'name' THEN v_entity_name := NEW.name::TEXT;
    END IF;
    
    IF NEW ? 'blueprint_id' THEN v_blueprint_id := NEW.blueprint_id;
    END IF;
    IF NEW ? 'organization_id' THEN v_organization_id := NEW.organization_id;
    END IF;
  END IF;

  -- Calculate changes for UPDATE
  IF TG_OP = 'UPDATE' AND v_old_value IS NOT NULL AND v_new_value IS NOT NULL THEN
    SELECT jsonb_object_agg(key, jsonb_build_object('old', v_old_value->key, 'new', v_new_value->key))
    INTO v_changes
    FROM jsonb_object_keys(v_new_value) AS key
    WHERE v_old_value->key IS DISTINCT FROM v_new_value->key
      AND key NOT IN ('updated_at', 'created_at');
  END IF;

  -- Skip if no actual changes (for UPDATE)
  IF TG_OP = 'UPDATE' AND (v_changes IS NULL OR v_changes = '{}'::jsonb) THEN
    RETURN NEW;
  END IF;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    blueprint_id,
    organization_id,
    entity_type,
    entity_id,
    entity_name,
    action,
    actor_id,
    actor_name,
    actor_type,
    severity,
    old_value,
    new_value,
    changes,
    metadata
  ) VALUES (
    v_blueprint_id,
    v_organization_id,
    v_entity_type,
    v_entity_id,
    v_entity_name,
    v_action,
    v_actor_id,
    v_actor_name,
    'user',
    'info',
    v_old_value,
    v_new_value,
    v_changes,
    jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
  );

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block the operation
    RAISE WARNING '[trigger_audit_log] Failed to log audit: % - %', SQLERRM, SQLSTATE;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
END;
$$;

-- ============================================================================
-- Create Audit Triggers for Key Tables
-- ============================================================================

-- Tasks audit trigger
DROP TRIGGER IF EXISTS audit_tasks_trigger ON tasks;
CREATE TRIGGER audit_tasks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log('task');

-- Blueprints audit trigger
DROP TRIGGER IF EXISTS audit_blueprints_trigger ON blueprints;
CREATE TRIGGER audit_blueprints_trigger
  AFTER INSERT OR UPDATE OR DELETE ON blueprints
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log('blueprint');

-- Blueprint members audit trigger
DROP TRIGGER IF EXISTS audit_blueprint_members_trigger ON blueprint_members;
CREATE TRIGGER audit_blueprint_members_trigger
  AFTER INSERT OR UPDATE OR DELETE ON blueprint_members
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log('team');

-- Contracts audit trigger
DROP TRIGGER IF EXISTS audit_contracts_trigger ON contracts;
CREATE TRIGGER audit_contracts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log('contract');

-- Expenses audit trigger
DROP TRIGGER IF EXISTS audit_expenses_trigger ON expenses;
CREATE TRIGGER audit_expenses_trigger
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log('payment');

-- Payment requests audit trigger
DROP TRIGGER IF EXISTS audit_payment_requests_trigger ON payment_requests;
CREATE TRIGGER audit_payment_requests_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log('payment');

-- Payments audit trigger
DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;
CREATE TRIGGER audit_payments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_audit_log('payment');

-- Diaries audit trigger (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'diaries' AND table_schema = 'public') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_diaries_trigger ON diaries';
    EXECUTE 'CREATE TRIGGER audit_diaries_trigger AFTER INSERT OR UPDATE OR DELETE ON diaries FOR EACH ROW EXECUTE FUNCTION trigger_audit_log(''diary'')';
  END IF;
END $$;

-- Issues audit trigger (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'issues' AND table_schema = 'public') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_issues_trigger ON issues';
    EXECUTE 'CREATE TRIGGER audit_issues_trigger AFTER INSERT OR UPDATE OR DELETE ON issues FOR EACH ROW EXECUTE FUNCTION trigger_audit_log(''issue'')';
  END IF;
END $$;

-- Checklists audit trigger (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklists' AND table_schema = 'public') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_checklists_trigger ON checklists';
    EXECUTE 'CREATE TRIGGER audit_checklists_trigger AFTER INSERT OR UPDATE OR DELETE ON checklists FOR EACH ROW EXECUTE FUNCTION trigger_audit_log(''checklist'')';
  END IF;
END $$;

-- Files audit trigger (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'files' AND table_schema = 'public') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS audit_files_trigger ON files';
    EXECUTE 'CREATE TRIGGER audit_files_trigger AFTER INSERT OR UPDATE OR DELETE ON files FOR EACH ROW EXECUTE FUNCTION trigger_audit_log(''file'')';
  END IF;
END $$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION trigger_audit_log IS '通用審計觸發器函數 - 自動記錄表操作至 audit_logs';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS audit_tasks_trigger ON tasks;
-- DROP TRIGGER IF EXISTS audit_blueprints_trigger ON blueprints;
-- DROP TRIGGER IF EXISTS audit_blueprint_members_trigger ON blueprint_members;
-- DROP TRIGGER IF EXISTS audit_contracts_trigger ON contracts;
-- DROP TRIGGER IF EXISTS audit_expenses_trigger ON expenses;
-- DROP TRIGGER IF EXISTS audit_payment_requests_trigger ON payment_requests;
-- DROP TRIGGER IF EXISTS audit_payments_trigger ON payments;
-- DROP TRIGGER IF EXISTS audit_diaries_trigger ON diaries;
-- DROP TRIGGER IF EXISTS audit_issues_trigger ON issues;
-- DROP TRIGGER IF EXISTS audit_checklists_trigger ON checklists;
-- DROP TRIGGER IF EXISTS audit_files_trigger ON files;
-- DROP FUNCTION IF EXISTS trigger_audit_log();
