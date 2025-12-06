-- ============================================================================
-- Migration: Add Activity Logging Triggers
-- Description: 建立自動活動記錄觸發器 - 當實體被建立、更新或刪除時自動記錄
-- Category: Triggers - Activity Logging
-- ============================================================================

-- ============================================================================
-- Trigger Function: Log Activity for Entity Changes
-- ============================================================================

-- Generic trigger function for logging activities
CREATE OR REPLACE FUNCTION public.log_entity_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id UUID;
  v_auth_user_id UUID;
  v_activity_type public.activity_type;
  v_entity_type public.entity_type;
  v_blueprint_id UUID;
  v_entity_id UUID;
  v_old_value JSONB;
  v_new_value JSONB;
  v_metadata JSONB;
  v_summary TEXT;
BEGIN
  -- 1. Get current authenticated user
  v_auth_user_id := auth.uid();
  
  -- 2. Find corresponding account_id
  IF v_auth_user_id IS NOT NULL THEN
    SELECT id INTO v_actor_id
    FROM public.accounts
    WHERE auth_user_id = v_auth_user_id
      AND type = 'user'
      AND status != 'deleted'
    LIMIT 1;
  END IF;

  -- 3. Determine activity type based on operation
  IF TG_OP = 'INSERT' THEN
    v_activity_type := 'create'::public.activity_type;
    v_entity_id := NEW.id;
    v_new_value := to_jsonb(NEW);
    v_old_value := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_activity_type := 'update'::public.activity_type;
    v_entity_id := NEW.id;
    v_old_value := to_jsonb(OLD);
    v_new_value := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_activity_type := 'delete'::public.activity_type;
    v_entity_id := OLD.id;
    v_old_value := to_jsonb(OLD);
    v_new_value := NULL;
  END IF;

  -- 4. Determine entity type and blueprint_id based on table
  v_entity_type := TG_ARGV[0]::public.entity_type;
  
  -- Get blueprint_id from the record
  IF TG_OP = 'DELETE' THEN
    v_blueprint_id := OLD.blueprint_id;
  ELSE
    v_blueprint_id := NEW.blueprint_id;
  END IF;

  -- 5. Build summary for metadata
  IF TG_OP = 'INSERT' THEN
    v_summary := format('%s created', v_entity_type);
  ELSIF TG_OP = 'UPDATE' THEN
    v_summary := format('%s updated', v_entity_type);
  ELSIF TG_OP = 'DELETE' THEN
    v_summary := format('%s deleted', v_entity_type);
  END IF;

  -- 6. Build metadata with summary
  v_metadata := jsonb_build_object(
    'table_name', TG_TABLE_NAME,
    'operation', TG_OP,
    'summary', v_summary
  );

  -- 7. Insert activity record
  INSERT INTO public.activities (
    blueprint_id,
    entity_type,
    entity_id,
    activity_type,
    actor_id,
    summary,
    metadata,
    old_value,
    new_value
  )
  VALUES (
    v_blueprint_id,
    v_entity_type,
    v_entity_id,
    v_activity_type,
    v_actor_id,
    v_summary,
    v_metadata,
    v_old_value,
    v_new_value
  );

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the operation
    RAISE WARNING 'Activity logging failed: %', SQLERRM;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
END;
$$;

COMMENT ON FUNCTION public.log_entity_activity()
  IS '通用實體活動記錄觸發器函數 - 自動記錄 INSERT/UPDATE/DELETE 操作';

-- ============================================================================
-- Activity Logging Triggers for Key Entities
-- ============================================================================

-- Tasks - Log create, update, delete
CREATE TRIGGER log_tasks_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('task');

-- Blueprints - Log create, update (delete handled specially)
CREATE TRIGGER log_blueprints_activity
  AFTER INSERT OR UPDATE ON public.blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('blueprint');

-- Diaries - Log create, update, delete
CREATE TRIGGER log_diaries_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.diaries
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('diary');

-- Checklists - Log create, update, delete
CREATE TRIGGER log_checklists_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('checklist');

-- Issues - Log create, update, delete
CREATE TRIGGER log_issues_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('issue');

-- Files - Log create, update, delete
CREATE TRIGGER log_files_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('file');

-- Contracts - Log create, update, delete
CREATE TRIGGER log_contracts_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('contract');

-- Expenses - Log create, update, delete
CREATE TRIGGER log_expenses_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('expense');

-- Payment Requests - Log create, update, delete
CREATE TRIGGER log_payment_requests_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.payment_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('payment_request');

-- Payments - Log create, update, delete
CREATE TRIGGER log_payments_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('payment');

-- QC Inspections - Log create, update, delete
CREATE TRIGGER log_qc_inspections_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.qc_inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('qc_inspection');

-- Acceptances - Log create, update, delete
CREATE TRIGGER log_acceptances_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.acceptances
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('acceptance');

-- Problems - Log create, update, delete
CREATE TRIGGER log_problems_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.problems
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('problem');

-- Notifications - Log create (no update/delete logging needed)
CREATE TRIGGER log_notifications_activity
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.log_entity_activity('notification');
