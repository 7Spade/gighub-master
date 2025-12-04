-- ============================================================================
-- Migration: Create Documentation Comments
-- Description: PART 13 - 資料表與函數文件註解
-- Created: 2024-12-01
-- ============================================================================

-- 資料表註解
COMMENT ON TABLE accounts IS '帳號 - 認證與身分識別 (user/org/bot)';
COMMENT ON TABLE organizations IS '組織 - 組織層級管理';
COMMENT ON TABLE organization_members IS '組織成員 - 用戶與組織的多對多關聯';
COMMENT ON TABLE teams IS '團隊 - 組織內群組，用於授權和權限分發 (不是資產所有者)';
COMMENT ON TABLE team_members IS '團隊成員 - 用戶與團隊的多對多關聯';
COMMENT ON TABLE blueprints IS '藍圖/工作區 - 資產容器，Owner = User or Organization';
COMMENT ON TABLE blueprint_members IS '藍圖成員 - Blueprint-level access control (Members + Collaborators)';
COMMENT ON TABLE blueprint_team_roles IS '藍圖團隊授權 - Team permission injection (not ownership)';
COMMENT ON TABLE tasks IS '任務 - 施工工作項目';
COMMENT ON TABLE task_attachments IS '任務附件';
COMMENT ON TABLE diaries IS '施工日誌 - 每日施工記錄';
COMMENT ON TABLE diary_attachments IS '日誌附件/施工照片';
COMMENT ON TABLE checklists IS '檢查清單 - 驗收檢查項目列表';
COMMENT ON TABLE checklist_items IS '檢查項目 - 單一驗收項目';
COMMENT ON TABLE task_acceptances IS '品質驗收記錄';
COMMENT ON TABLE todos IS '待辦事項 - 個人待辦清單';
COMMENT ON TABLE issues IS '問題追蹤';
COMMENT ON TABLE issue_comments IS '問題評論';
COMMENT ON TABLE notifications IS '通知';

-- 私有函數註解
COMMENT ON FUNCTION private.get_user_account_id() IS '取得當前用戶 account_id (SECURITY DEFINER)';
COMMENT ON FUNCTION private.is_account_owner(UUID) IS '檢查用戶是否擁有該帳號';
COMMENT ON FUNCTION private.is_organization_member(UUID) IS '檢查用戶是否為組織成員';
COMMENT ON FUNCTION private.get_organization_role(UUID) IS '取得用戶在組織中的角色';
COMMENT ON FUNCTION private.is_organization_admin(UUID) IS '檢查用戶是否為組織 owner/admin';
COMMENT ON FUNCTION private.is_team_member(UUID) IS '檢查用戶是否為團隊成員';
COMMENT ON FUNCTION private.is_team_leader(UUID) IS '檢查用戶是否為團隊 leader';
COMMENT ON FUNCTION private.is_blueprint_owner(UUID) IS '檢查用戶是否為藍圖擁有者 (直接或透過組織)';
COMMENT ON FUNCTION private.has_blueprint_access(UUID) IS '檢查用戶是否有藍圖存取權';
COMMENT ON FUNCTION private.can_write_blueprint(UUID) IS '檢查用戶是否有藍圖寫入權';
COMMENT ON FUNCTION private.get_blueprint_business_role(UUID) IS '取得用戶在藍圖中的業務角色';

-- 公開函數註解
COMMENT ON FUNCTION public.update_updated_at() IS '觸發器函數 - 自動更新 updated_at';
COMMENT ON FUNCTION public.handle_new_user() IS 'Auth 觸發器 - 自動建立用戶帳號';
COMMENT ON FUNCTION public.create_organization(VARCHAR, VARCHAR, TEXT, VARCHAR) IS '建立組織 (SECURITY DEFINER) - 自動加入建立者為 owner';
COMMENT ON FUNCTION public.handle_new_organization() IS '組織觸發器 - 確保建立者被加入為 owner';
COMMENT ON FUNCTION public.create_team(UUID, VARCHAR, TEXT, JSONB) IS '建立團隊 (SECURITY DEFINER) - 需要組織 owner/admin 權限';
COMMENT ON FUNCTION public.create_blueprint(UUID, VARCHAR, VARCHAR, TEXT, TEXT, BOOLEAN, public.module_type[]) IS '建立藍圖 (SECURITY DEFINER) - 自動加入建立者為 maintainer';
COMMENT ON FUNCTION public.handle_new_blueprint() IS '藍圖觸發器 - 確保建立者被加入為 maintainer';

-- RBAC 相關資料表與函數註解
COMMENT ON TABLE blueprint_roles IS '藍圖角色定義 - Custom role definitions per blueprint for RBAC';
COMMENT ON COLUMN blueprint_roles.name IS '角色名稱（唯一鍵）- Role name (unique per blueprint)';
COMMENT ON COLUMN blueprint_roles.display_name IS '顯示名稱 - Display name for UI';
COMMENT ON COLUMN blueprint_roles.business_role IS '業務角色 - Maps to permission set';
COMMENT ON COLUMN blueprint_roles.permissions IS '自訂權限 JSON - Custom permissions override';
COMMENT ON COLUMN blueprint_roles.is_default IS '是否為預設角色 - Cannot be deleted';
COMMENT ON COLUMN blueprint_members.business_role IS '業務角色 - Business role for permission checking';
COMMENT ON COLUMN blueprint_members.custom_role_id IS '自訂角色 ID - Reference to custom role definition';
