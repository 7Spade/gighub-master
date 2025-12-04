-- ============================================================================
-- Migration: Create Storage Configuration
-- Description: PART 17 - 儲存配置 (Storage Buckets & Policies)
-- Created: 2024-12-01
-- ============================================================================

-- PART 17: STORAGE CONFIGURATION (儲存配置)
-- ############################################################################

-- 建立儲存桶 (如果不存在)
-- 注意：這需要 Supabase Storage API，在 PostgreSQL 中通過 storage schema 操作

-- Blueprint 附件儲存桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blueprint-attachments',
  'blueprint-attachments',
  false,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 用戶頭像儲存桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 建立儲存政策
-- Blueprint 附件：只有藍圖成員可以存取
CREATE POLICY "blueprint_attachments_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'blueprint-attachments'
    AND (
      SELECT private.has_blueprint_access(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

CREATE POLICY "blueprint_attachments_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'blueprint-attachments'
    AND (
      SELECT private.has_blueprint_access(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

CREATE POLICY "blueprint_attachments_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'blueprint-attachments'
    AND (
      SELECT private.can_write_blueprint(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

CREATE POLICY "blueprint_attachments_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'blueprint-attachments'
    AND (
      SELECT private.can_write_blueprint(
        (storage.foldername(name))[1]::uuid
      )
    )
  );

-- 頭像：公開讀取，用戶只能修改自己的
CREATE POLICY "avatars_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

