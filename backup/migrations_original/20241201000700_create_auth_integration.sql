-- ============================================================================
-- Migration: Create Auth Integration
-- Description: 建立認證整合 (Auth → Account 自動建立)
-- Created: 2024-12-01
-- ============================================================================

-- ############################################################################
-- PART 9: AUTH INTEGRATION (認證整合)
-- ############################################################################
-- 當 Supabase Auth 建立新用戶時，自動建立對應的 account

-- ----------------------------------------------------------------------------
-- handle_new_user()
-- 當 auth.users 新增記錄時，自動建立 accounts 記錄
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.accounts (auth_user_id, type, name, email, status)
  VALUES (
    NEW.id,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'active'
  );
  RETURN NEW;
END;
$$;

-- 建立觸發器
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
