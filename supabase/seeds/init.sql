-- ============================================================================
-- Seed Data and SECURITY DEFINER Functions
-- Purpose: Helper functions and triggers for organization/team management
-- Created: 2024-11-30
-- ============================================================================

-- ============================================================================
-- CREATE ORGANIZATION FUNCTION (SECURITY DEFINER)
-- Creates an organization account and organization record in a single transaction.
-- This function bypasses RLS policies to ensure atomic creation.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_organization(
  p_name VARCHAR(255),
  p_email VARCHAR(255) DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL,
  p_slug VARCHAR(100) DEFAULT NULL
)
RETURNS TABLE (
  account_id UUID,
  organization_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_org_account_id UUID;
  v_organization_id UUID;
  v_slug VARCHAR(100);
  v_auth_user_id UUID;
BEGIN
  -- 1. Get current user's auth_user_id
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 2. Get user's account_id
  SELECT id INTO v_user_account_id
  FROM public.accounts
  WHERE auth_user_id = v_auth_user_id
    AND type = 'user'
    AND status != 'deleted'
  LIMIT 1;

  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;

  -- 3. Generate slug if not provided
  IF p_slug IS NULL OR p_slug = '' THEN
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    -- Ensure slug is unique
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) LOOP
      v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;
  ELSE
    v_slug := p_slug;
  END IF;

  -- 4. Create organization account (auth_user_id = NULL for org accounts)
  INSERT INTO public.accounts (
    auth_user_id,
    type,
    name,
    email,
    avatar_url,
    status
  )
  VALUES (
    NULL,  -- Organization accounts don't need auth_user_id
    'org',
    p_name,
    p_email,
    p_avatar_url,
    'active'
  )
  RETURNING id INTO v_org_account_id;

  -- 5. Create organization record
  INSERT INTO public.organizations (
    account_id,
    name,
    slug,
    description,
    logo_url,
    created_by
  )
  VALUES (
    v_org_account_id,
    p_name,
    v_slug,
    NULL,
    p_avatar_url,
    v_user_account_id
  )
  RETURNING id INTO v_organization_id;

  -- 6. Add creator as owner (trigger will handle this, but we do it explicitly for clarity)
  INSERT INTO public.organization_members (organization_id, account_id, role)
  VALUES (v_organization_id, v_user_account_id, 'owner')
  ON CONFLICT (organization_id, account_id) DO NOTHING;

  -- 7. Return created IDs
  RETURN QUERY SELECT v_org_account_id, v_organization_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization(VARCHAR, VARCHAR, TEXT, VARCHAR) TO authenticated;

-- ============================================================================
-- AUTO-ADD ORGANIZATION CREATOR AS OWNER MEMBER
-- When an organization is created, automatically add the creator (created_by)
-- to organization_members with role = 'owner'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_account_id UUID;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    -- Try to treat created_by as a direct accounts.id first
    SELECT id INTO v_account_id FROM public.accounts WHERE id = NEW.created_by LIMIT 1;

    -- If not found, try interpreting created_by as auth_user_id
    IF v_account_id IS NULL THEN
      SELECT id INTO v_account_id FROM public.accounts WHERE auth_user_id = NEW.created_by LIMIT 1;
    END IF;

    -- Only insert if we resolved an accounts.id
    IF v_account_id IS NOT NULL THEN
      INSERT INTO public.organization_members (organization_id, account_id, role)
      VALUES (NEW.id, v_account_id, 'owner')
      ON CONFLICT (organization_id, account_id) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- ============================================================================
-- CREATE TEAM FUNCTION (SECURITY DEFINER)
-- Creates a team in an organization with proper permission checks.
-- This function bypasses RLS policies to ensure atomic creation.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_team(
  p_organization_id UUID,
  p_name VARCHAR(255),
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  team_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_team_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- 1. Get current user's auth_user_id
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 2. Get user's account_id
  SELECT id INTO v_user_account_id
  FROM public.accounts
  WHERE auth_user_id = v_auth_user_id
    AND type = 'user'
    AND status != 'deleted'
  LIMIT 1;

  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;

  -- 3. Verify user is organization admin/owner
  IF NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.accounts a ON a.id = om.account_id
    WHERE om.organization_id = p_organization_id
    AND a.auth_user_id = v_auth_user_id
    AND om.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'User is not an admin or owner of the organization';
  END IF;

  -- 4. Check if team name already exists in organization
  IF EXISTS (
    SELECT 1 FROM public.teams
    WHERE organization_id = p_organization_id
    AND name = p_name
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Team name already exists in this organization';
  END IF;

  -- 5. Create team
  INSERT INTO public.teams (
    organization_id,
    name,
    description,
    metadata
  )
  VALUES (
    p_organization_id,
    p_name,
    p_description,
    p_metadata
  )
  RETURNING id INTO v_team_id;

  -- 6. Add creator as team leader
  INSERT INTO public.team_members (team_id, account_id, role)
  VALUES (v_team_id, v_user_account_id, 'leader')
  ON CONFLICT (team_id, account_id) DO NOTHING;

  -- 7. Return created team ID
  RETURN QUERY SELECT v_team_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_team(UUID, VARCHAR, TEXT, JSONB) TO authenticated;

-- ============================================================================
-- CREATE BLUEPRINT FUNCTION (SECURITY DEFINER)
-- Creates a blueprint (workspace) with proper permission checks.
-- This function bypasses RLS policies to ensure atomic creation.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_blueprint(
  p_owner_id UUID,
  p_name VARCHAR(255),
  p_slug VARCHAR(100) DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_cover_url TEXT DEFAULT NULL,
  p_is_public BOOLEAN DEFAULT false,
  p_enabled_modules module_type[] DEFAULT ARRAY['tasks']::module_type[]
)
RETURNS TABLE (
  blueprint_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_account_id UUID;
  v_blueprint_id UUID;
  v_slug VARCHAR(100);
  v_auth_user_id UUID;
  v_owner_type public.account_type;
BEGIN
  -- 1. Get current user's auth_user_id
  v_auth_user_id := auth.uid();
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- 2. Get user's account_id
  SELECT id INTO v_user_account_id
  FROM public.accounts
  WHERE auth_user_id = v_auth_user_id
    AND type = 'user'
    AND status != 'deleted'
  LIMIT 1;

  IF v_user_account_id IS NULL THEN
    RAISE EXCEPTION 'User account not found';
  END IF;

  -- 3. Get owner account type and verify permissions
  SELECT type INTO v_owner_type
  FROM public.accounts
  WHERE id = p_owner_id
    AND status != 'deleted';

  IF v_owner_type IS NULL THEN
    RAISE EXCEPTION 'Owner account not found';
  END IF;

  -- 4. Verify user has permission to create blueprint for owner
  IF v_owner_type = 'user' THEN
    -- For user accounts, owner must be the current user
    IF p_owner_id != v_user_account_id THEN
      RAISE EXCEPTION 'User can only create blueprints for their own account';
    END IF;
  ELSIF v_owner_type = 'org' THEN
    -- For organization accounts, user must be admin/owner
    IF NOT EXISTS (
      SELECT 1 FROM public.organizations o
      JOIN public.organization_members om ON om.organization_id = o.id
      JOIN public.accounts a ON a.id = om.account_id
      WHERE o.account_id = p_owner_id
      AND a.auth_user_id = v_auth_user_id
      AND om.role IN ('owner', 'admin')
    ) THEN
      RAISE EXCEPTION 'User is not an admin or owner of the organization';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid owner account type';
  END IF;

  -- 5. Generate slug if not provided
  IF p_slug IS NULL OR p_slug = '' THEN
    v_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    -- Ensure slug is unique for the owner
    WHILE EXISTS (
      SELECT 1 FROM public.blueprints
      WHERE owner_id = p_owner_id
      AND slug = v_slug
      AND deleted_at IS NULL
    ) LOOP
      v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    END LOOP;
  ELSE
    v_slug := p_slug;
    -- Check if slug already exists for owner
    IF EXISTS (
      SELECT 1 FROM public.blueprints
      WHERE owner_id = p_owner_id
      AND slug = v_slug
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Blueprint slug already exists for this owner';
    END IF;
  END IF;

  -- 6. Create blueprint
  INSERT INTO public.blueprints (
    owner_id,
    name,
    slug,
    description,
    cover_url,
    is_public,
    status,
    enabled_modules,
    created_by
  )
  VALUES (
    p_owner_id,
    p_name,
    v_slug,
    p_description,
    p_cover_url,
    p_is_public,
    'active',
    p_enabled_modules,
    v_user_account_id
  )
  RETURNING id INTO v_blueprint_id;

  -- 7. Add creator as maintainer (trigger will also handle this, but we do it explicitly)
  INSERT INTO public.blueprint_members (blueprint_id, account_id, role, is_external)
  VALUES (v_blueprint_id, v_user_account_id, 'maintainer', false)
  ON CONFLICT (blueprint_id, account_id) DO NOTHING;

  -- 8. Return created blueprint ID
  RETURN QUERY SELECT v_blueprint_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_blueprint(UUID, VARCHAR, VARCHAR, TEXT, TEXT, BOOLEAN, module_type[]) TO authenticated;

-- ============================================================================
-- AUTO-ADD BLUEPRINT CREATOR AS MAINTAINER MEMBER
-- When a blueprint is created:
-- - If owner is a User (personal blueprint): creator is automatically maintainer
-- - If owner is an Organization: creator is automatically maintainer
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_blueprint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner_type public.account_type;
BEGIN
  -- Only add member if created_by is provided
  IF NEW.created_by IS NOT NULL THEN
    -- Get the owner account type
    SELECT type INTO v_owner_type
    FROM public.accounts
    WHERE id = NEW.owner_id;
    
    -- For both personal (user) and organization blueprints,
    -- add the creator as maintainer
    INSERT INTO public.blueprint_members (blueprint_id, account_id, role, is_external)
    VALUES (NEW.id, NEW.created_by, 'maintainer', false)
    ON CONFLICT (blueprint_id, account_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_blueprint_created ON public.blueprints;
CREATE TRIGGER on_blueprint_created
  AFTER INSERT ON public.blueprints
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_blueprint();

-- ============================================================================
-- COMMENTS/DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION public.create_organization IS 'Create organization with SECURITY DEFINER (bypasses RLS)';
COMMENT ON FUNCTION public.create_team IS 'Create team with SECURITY DEFINER (requires org admin/owner)';
COMMENT ON FUNCTION public.create_blueprint IS 'Create blueprint with SECURITY DEFINER (bypasses RLS)';
COMMENT ON FUNCTION public.handle_new_organization IS 'Auto-add organization creator to organization_members with role=owner';
COMMENT ON FUNCTION public.handle_new_blueprint IS 'Auto-add blueprint creator to blueprint_members with role=maintainer';
