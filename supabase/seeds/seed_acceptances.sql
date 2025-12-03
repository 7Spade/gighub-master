-- Seed: Acceptances Data
-- Description: 驗收模組種子資料
-- Features:
--   - Sample acceptance records for testing
--   - Approval workflow records
--   - Attachments for documentation

-- ============================================================================
-- Note: This seed file requires the following tables to exist:
--   - blueprints
--   - accounts
--   - tasks
--   - qc_inspections
--   - acceptances
--   - acceptance_approvals
--   - acceptance_attachments
-- ============================================================================

-- ============================================================================
-- Sample Acceptances
-- ============================================================================

DO $$
DECLARE
  v_blueprint_id UUID;
  v_account_id UUID;
  v_account_id_2 UUID;
  v_acceptance_id_1 UUID;
  v_acceptance_id_2 UUID;
  v_acceptance_id_3 UUID;
  v_acceptance_id_4 UUID;
BEGIN
  -- Try to get sample blueprints and accounts for seeding
  SELECT id INTO v_blueprint_id FROM blueprints LIMIT 1;
  SELECT id INTO v_account_id FROM accounts LIMIT 1;
  SELECT id INTO v_account_id_2 FROM accounts OFFSET 1 LIMIT 1;
  
  -- Fallback to first account if second doesn't exist
  IF v_account_id_2 IS NULL THEN
    v_account_id_2 := v_account_id;
  END IF;
  
  -- Only proceed if we have valid references
  IF v_blueprint_id IS NOT NULL AND v_account_id IS NOT NULL THEN
    
    -- ========================================================================
    -- Acceptance 1: Interim acceptance - Passed
    -- ========================================================================
    INSERT INTO acceptances (
      id,
      blueprint_id,
      acceptance_code,
      title,
      description,
      acceptance_type,
      status,
      scope,
      criteria,
      decision,
      decision_reason,
      applicant_id,
      reviewer_id,
      approver_id,
      applied_at,
      scheduled_date,
      acceptance_date,
      decided_at,
      notes,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'ACC-2024-001',
      '一樓結構工程期中驗收',
      '一樓結構體完成後之期中驗收作業',
      'interim',
      'passed',
      '一樓全區結構體，包含柱、梁、版',
      '1. 混凝土強度達標 2. 鋼筋配置符合圖說 3. 尺寸誤差在容許範圍內',
      'approve',
      '所有檢查項目均符合設計規範及施工標準',
      v_account_id,
      v_account_id_2,
      v_account_id_2,
      NOW() - INTERVAL '10 days',
      CURRENT_DATE - INTERVAL '7 days',
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '6 days',
      '驗收順利完成，可進行下一階段施工',
      v_account_id,
      NOW() - INTERVAL '10 days'
    )
    RETURNING id INTO v_acceptance_id_1;
    
    -- ========================================================================
    -- Acceptance 2: Stage acceptance - In Progress
    -- ========================================================================
    INSERT INTO acceptances (
      id,
      blueprint_id,
      acceptance_code,
      title,
      description,
      acceptance_type,
      status,
      scope,
      criteria,
      applicant_id,
      applied_at,
      scheduled_date,
      notes,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'ACC-2024-002',
      '二樓模板工程階段驗收',
      '二樓模板組立完成後之階段驗收',
      'stage',
      'in_progress',
      '二樓全區模板工程',
      '1. 模板支撐穩固 2. 垂直度符合規範 3. 平整度達標',
      v_account_id,
      NOW() - INTERVAL '2 days',
      CURRENT_DATE + INTERVAL '1 day',
      '等待品管檢查完成後進行驗收',
      v_account_id,
      NOW() - INTERVAL '3 days'
    )
    RETURNING id INTO v_acceptance_id_2;
    
    -- ========================================================================
    -- Acceptance 3: Final acceptance - Failed (Conditionally)
    -- ========================================================================
    INSERT INTO acceptances (
      id,
      blueprint_id,
      acceptance_code,
      title,
      description,
      acceptance_type,
      status,
      scope,
      criteria,
      decision,
      decision_reason,
      conditions,
      applicant_id,
      reviewer_id,
      approver_id,
      applied_at,
      scheduled_date,
      acceptance_date,
      decided_at,
      notes,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'ACC-2024-003',
      '消防設備工程最終驗收',
      '消防設備安裝完成後之最終驗收',
      'final',
      'failed',
      '全棟消防設備系統',
      '1. 符合消防法規 2. 設備功能正常 3. 標示清楚',
      'reject',
      '品管檢查發現多項不符，需進行整改後重新驗收',
      NULL,
      v_account_id,
      v_account_id_2,
      v_account_id_2,
      NOW() - INTERVAL '5 days',
      CURRENT_DATE - INTERVAL '2 days',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '2 days',
      '需完成整改並通過品管複查後重新申請驗收',
      v_account_id,
      NOW() - INTERVAL '5 days'
    )
    RETURNING id INTO v_acceptance_id_3;
    
    -- ========================================================================
    -- Acceptance 4: Partial acceptance - Conditionally Passed
    -- ========================================================================
    INSERT INTO acceptances (
      id,
      blueprint_id,
      acceptance_code,
      title,
      description,
      acceptance_type,
      status,
      scope,
      criteria,
      decision,
      decision_reason,
      conditions,
      applicant_id,
      reviewer_id,
      approver_id,
      applied_at,
      scheduled_date,
      acceptance_date,
      decided_at,
      notes,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'ACC-2024-004',
      '電氣管線工程部分驗收',
      '一至三樓電氣管線之部分驗收',
      'partial',
      'conditionally_passed',
      '一至三樓電氣管線及配電盤',
      '1. 管線配置正確 2. 接地良好 3. 絕緣電阻達標',
      'conditional',
      '大部分項目符合要求，但有輕微缺失需於一週內改善',
      '1. 二樓走廊管線需補強固定 2. 配電盤標示需更新 3. 接地線需重新連接',
      v_account_id,
      v_account_id_2,
      v_account_id_2,
      NOW() - INTERVAL '4 days',
      CURRENT_DATE - INTERVAL '1 day',
      NOW() - INTERVAL '1 day',
      NOW() - INTERVAL '1 day',
      '請於一週內完成條件項目並回報',
      v_account_id,
      NOW() - INTERVAL '4 days'
    )
    RETURNING id INTO v_acceptance_id_4;
    
    -- ========================================================================
    -- Acceptance Approvals
    -- ========================================================================
    
    -- Approvals for Acceptance 1 (passed)
    INSERT INTO acceptance_approvals (
      acceptance_id,
      approver_id,
      decision,
      comments,
      approval_order,
      approved_at
    ) VALUES
    (
      v_acceptance_id_1,
      v_account_id_2,
      'approve',
      '審核通過，所有項目符合要求',
      1,
      NOW() - INTERVAL '7 days'
    ),
    (
      v_acceptance_id_1,
      v_account_id_2,
      'approve',
      '核准通過，准予進行下一階段工程',
      2,
      NOW() - INTERVAL '6 days'
    );
    
    -- Approvals for Acceptance 3 (failed)
    INSERT INTO acceptance_approvals (
      acceptance_id,
      approver_id,
      decision,
      comments,
      approval_order,
      approved_at
    ) VALUES
    (
      v_acceptance_id_3,
      v_account_id_2,
      'reject',
      '品管檢查不通過，請先完成整改',
      1,
      NOW() - INTERVAL '2 days'
    );
    
    -- Approvals for Acceptance 4 (conditionally passed)
    INSERT INTO acceptance_approvals (
      acceptance_id,
      approver_id,
      decision,
      comments,
      approval_order,
      approved_at
    ) VALUES
    (
      v_acceptance_id_4,
      v_account_id_2,
      'conditional',
      '有條件通過，請於期限內完成條件項目',
      1,
      NOW() - INTERVAL '1 day'
    );
    
    RAISE NOTICE 'Acceptances seed data inserted successfully';
  ELSE
    RAISE NOTICE 'Skipping acceptances seed: No blueprint or account found';
  END IF;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE acceptances IS '驗收記錄表 - 記錄驗收流程';
COMMENT ON TABLE acceptance_approvals IS '驗收審批記錄表 - 記錄審批歷史';
COMMENT ON TABLE acceptance_attachments IS '驗收附件表 - 存放驗收相關文件';
