-- ============================================================================
-- Migration: 11 - Auth Integration
-- Description: 建立認證整合 (Auth → Account 自動建立)
-- Category: 11 - Auth Integration
-- 
-- 當 Supabase Auth 建立新用戶時，自動建立對應的 account
-- ============================================================================

-- handle_new_user()
-- 當 auth.users 新增記錄時，自動建立 accounts 記錄
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

-- 建立觸發器 (在 auth.users 上)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Documentation
COMMENT ON FUNCTION public.handle_new_user() 
  IS 'Auth 整合 - 自動建立 account 記錄，當 Supabase Auth 新增用戶時觸發';
