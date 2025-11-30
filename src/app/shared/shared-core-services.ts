// ============================================
// 核心服務（Core Services）
// ============================================
// IMPORTANT: Core services that should be considered early in the app bootstrap
// (Supabase Auth must be wired before relying on @delon/auth TokenService)
//
// Integration order:
// 1) Supabase Auth integration (SupabaseAuthService)
// 2) @delon/auth (TokenService / DA_SERVICE_TOKEN)
// 3) Then @delon/* modules (acl, abc, form, cache, mock, theme, util, etc.)
// This ordering is important for authentication flow and token propagation.
//
// Note: Most services use `providedIn: 'root'` and don't need manual registration.
// This array is for services that require special provider configuration.

// ============================================
// 導出核心服務陣列
// ============================================
export const SHARED_CORE_SERVICES: any[] = [
  // 目前所有核心服務都使用 providedIn: 'root'
  // 如果需要手動註冊的服務，請在此處添加
];
