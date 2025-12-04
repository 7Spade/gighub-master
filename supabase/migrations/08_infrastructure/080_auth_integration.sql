-- ============================================================================
-- Migration: 080_auth_integration
-- Layer: 08_infrastructure
-- Description: Auth Integration (自動創建帳號觸發器)
-- Dependencies: 01_core/010_accounts
-- ============================================================================

-- ############################################################################
-- AUTO-CREATE ACCOUNT ON AUTH USER CREATION
-- ############################################################################

-- 當用戶在 auth.users 註冊時，自動在 accounts 表創建對應記錄
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.accounts (
    auth_user_id,
    type,
    name,
    email,
    avatar_url,
    metadata
  ) VALUES (
    NEW.id,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb)
  );
  RETURN NEW;
END;
$$;

-- 創建觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
