-- Seed: QC Inspections Data
-- Description: 品管檢查模組種子資料
-- Features:
--   - Sample QC inspections for testing
--   - Inspection items with various statuses
--   - Attachments for evidence

-- ============================================================================
-- Note: This seed file requires the following tables to exist:
--   - blueprints
--   - accounts
--   - tasks
--   - diaries
--   - qc_inspections
--   - qc_inspection_items
--   - qc_inspection_attachments
-- ============================================================================

-- ============================================================================
-- Sample QC Inspections
-- ============================================================================

-- Insert sample QC inspections (requires existing blueprint_id and account_id)
-- These are template inserts - actual UUIDs should be replaced with valid references

DO $$
DECLARE
  v_blueprint_id UUID;
  v_account_id UUID;
  v_inspection_id_1 UUID;
  v_inspection_id_2 UUID;
  v_inspection_id_3 UUID;
  v_item_id_1 UUID;
  v_item_id_2 UUID;
  v_item_id_3 UUID;
BEGIN
  -- Try to get a sample blueprint and account for seeding
  SELECT id INTO v_blueprint_id FROM blueprints LIMIT 1;
  SELECT id INTO v_account_id FROM accounts LIMIT 1;
  
  -- Only proceed if we have valid references
  IF v_blueprint_id IS NOT NULL AND v_account_id IS NOT NULL THEN
    
    -- ========================================================================
    -- QC Inspection 1: Self-check - Passed
    -- ========================================================================
    INSERT INTO qc_inspections (
      id,
      blueprint_id,
      inspection_code,
      title,
      description,
      inspection_type,
      status,
      passed_count,
      failed_count,
      total_count,
      pass_rate,
      inspector_id,
      scheduled_date,
      inspection_date,
      notes,
      findings,
      recommendations,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'QC-2024-001',
      '一樓結構自主檢查',
      '一樓結構體完成後之自主品質檢查',
      'self_check',
      'passed',
      5,
      0,
      5,
      100.00,
      v_account_id,
      CURRENT_DATE - INTERVAL '7 days',
      NOW() - INTERVAL '6 days',
      '所有項目均符合規範要求',
      '無重大發現',
      '建議持續維持現有品質管控標準',
      v_account_id,
      NOW() - INTERVAL '7 days'
    )
    RETURNING id INTO v_inspection_id_1;
    
    -- ========================================================================
    -- QC Inspection 2: Supervisor check - In Progress
    -- ========================================================================
    INSERT INTO qc_inspections (
      id,
      blueprint_id,
      inspection_code,
      title,
      description,
      inspection_type,
      status,
      passed_count,
      failed_count,
      total_count,
      pass_rate,
      inspector_id,
      scheduled_date,
      notes,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'QC-2024-002',
      '二樓模板工程主管檢查',
      '二樓模板組立完成後之主管品質檢查',
      'supervisor_check',
      'in_progress',
      3,
      1,
      6,
      50.00,
      v_account_id,
      CURRENT_DATE,
      '檢查進行中，部分項目待複查',
      v_account_id,
      NOW() - INTERVAL '2 days'
    )
    RETURNING id INTO v_inspection_id_2;
    
    -- ========================================================================
    -- QC Inspection 3: Third-party check - Failed
    -- ========================================================================
    INSERT INTO qc_inspections (
      id,
      blueprint_id,
      inspection_code,
      title,
      description,
      inspection_type,
      status,
      passed_count,
      failed_count,
      total_count,
      pass_rate,
      inspector_id,
      scheduled_date,
      inspection_date,
      notes,
      findings,
      recommendations,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'QC-2024-003',
      '消防設備第三方檢查',
      '消防設備安裝完成後之第三方檢查',
      'third_party',
      'failed',
      2,
      3,
      5,
      40.00,
      v_account_id,
      CURRENT_DATE - INTERVAL '3 days',
      NOW() - INTERVAL '2 days',
      '多項消防設備安裝不符規範，需進行整改',
      '發現三項重大缺失：1. 灑水頭間距不足 2. 消防栓位置偏移 3. 警報系統接線錯誤',
      '建議立即進行整改並重新申請檢查',
      v_account_id,
      NOW() - INTERVAL '5 days'
    )
    RETURNING id INTO v_inspection_id_3;
    
    -- ========================================================================
    -- QC Inspection Items for Inspection 1
    -- ========================================================================
    INSERT INTO qc_inspection_items (
      id,
      inspection_id,
      item_code,
      title,
      description,
      standard,
      status,
      actual_value,
      expected_value,
      score,
      weight,
      sort_order,
      checked_at,
      checked_by
    ) VALUES
    (
      gen_random_uuid(),
      v_inspection_id_1,
      'QC-001-01',
      '柱鋼筋保護層厚度',
      '檢查柱鋼筋保護層厚度是否符合設計要求',
      '保護層厚度 ≥ 40mm',
      'passed',
      '45mm',
      '≥ 40mm',
      100.00,
      1.0,
      1,
      NOW() - INTERVAL '6 days',
      v_account_id
    ),
    (
      gen_random_uuid(),
      v_inspection_id_1,
      'QC-001-02',
      '梁鋼筋間距',
      '檢查梁主筋間距是否符合設計要求',
      '主筋間距 ≤ 150mm',
      'passed',
      '140mm',
      '≤ 150mm',
      100.00,
      1.0,
      2,
      NOW() - INTERVAL '6 days',
      v_account_id
    ),
    (
      gen_random_uuid(),
      v_inspection_id_1,
      'QC-001-03',
      '混凝土強度',
      '檢查混凝土抗壓強度是否達標',
      '28天抗壓強度 ≥ 280 kgf/cm²',
      'passed',
      '320 kgf/cm²',
      '≥ 280 kgf/cm²',
      100.00,
      1.5,
      3,
      NOW() - INTERVAL '6 days',
      v_account_id
    );
    
    -- ========================================================================
    -- QC Inspection Items for Inspection 2
    -- ========================================================================
    INSERT INTO qc_inspection_items (
      id,
      inspection_id,
      item_code,
      title,
      description,
      standard,
      status,
      actual_value,
      expected_value,
      deviation,
      score,
      weight,
      sort_order,
      checked_at,
      checked_by
    ) VALUES
    (
      gen_random_uuid(),
      v_inspection_id_2,
      'QC-002-01',
      '模板垂直度',
      '檢查模板垂直度偏差',
      '垂直度偏差 ≤ 3mm/m',
      'passed',
      '2mm/m',
      '≤ 3mm/m',
      NULL,
      100.00,
      1.0,
      1,
      NOW() - INTERVAL '1 day',
      v_account_id
    ),
    (
      gen_random_uuid(),
      v_inspection_id_2,
      'QC-002-02',
      '模板支撐間距',
      '檢查模板支撐間距是否符合規範',
      '支撐間距 ≤ 1200mm',
      'failed',
      '1350mm',
      '≤ 1200mm',
      '超出標準 150mm，需調整',
      0.00,
      1.0,
      2,
      NOW() - INTERVAL '1 day',
      v_account_id
    ),
    (
      gen_random_uuid(),
      v_inspection_id_2,
      'QC-002-03',
      '模板平整度',
      '檢查模板表面平整度',
      '平整度偏差 ≤ 5mm/2m',
      'pending',
      NULL,
      '≤ 5mm/2m',
      NULL,
      NULL,
      1.0,
      3,
      NULL,
      NULL
    );
    
    -- ========================================================================
    -- QC Inspection Items for Inspection 3
    -- ========================================================================
    INSERT INTO qc_inspection_items (
      id,
      inspection_id,
      item_code,
      title,
      description,
      standard,
      status,
      actual_value,
      expected_value,
      deviation,
      score,
      weight,
      sort_order,
      checked_at,
      checked_by
    ) VALUES
    (
      gen_random_uuid(),
      v_inspection_id_3,
      'QC-003-01',
      '灑水頭間距',
      '檢查自動灑水頭之間距',
      '間距 ≤ 2.1m',
      'failed',
      '2.5m',
      '≤ 2.1m',
      '超出標準 0.4m，需重新配置',
      0.00,
      1.5,
      1,
      NOW() - INTERVAL '2 days',
      v_account_id
    ),
    (
      gen_random_uuid(),
      v_inspection_id_3,
      'QC-003-02',
      '消防栓位置',
      '檢查消防栓安裝位置',
      '距離逃生門 ≤ 5m',
      'failed',
      '8m',
      '≤ 5m',
      '距離過遠，需移位',
      0.00,
      1.5,
      2,
      NOW() - INTERVAL '2 days',
      v_account_id
    ),
    (
      gen_random_uuid(),
      v_inspection_id_3,
      'QC-003-03',
      '警報系統接線',
      '檢查火災警報系統接線正確性',
      '符合電路圖設計',
      'failed',
      '接線錯誤',
      '符合電路圖設計',
      '多處接線與電路圖不符',
      0.00,
      2.0,
      3,
      NOW() - INTERVAL '2 days',
      v_account_id
    ),
    (
      gen_random_uuid(),
      v_inspection_id_3,
      'QC-003-04',
      '滅火器配置',
      '檢查滅火器配置數量與位置',
      '每 200m² 至少 1 具',
      'passed',
      '符合標準',
      '每 200m² 至少 1 具',
      NULL,
      100.00,
      1.0,
      4,
      NOW() - INTERVAL '2 days',
      v_account_id
    ),
    (
      gen_random_uuid(),
      v_inspection_id_3,
      'QC-003-05',
      '逃生指示燈',
      '檢查逃生指示燈安裝與亮度',
      '亮度 ≥ 1 cd/m²',
      'passed',
      '1.5 cd/m²',
      '≥ 1 cd/m²',
      NULL,
      100.00,
      1.0,
      5,
      NOW() - INTERVAL '2 days',
      v_account_id
    );
    
    RAISE NOTICE 'QC inspections seed data inserted successfully';
  ELSE
    RAISE NOTICE 'Skipping QC inspections seed: No blueprint or account found';
  END IF;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE qc_inspections IS '品管檢查表 - 記錄品質控制檢查';
COMMENT ON TABLE qc_inspection_items IS '品管檢查項目表 - 記錄檢查項目詳情';
COMMENT ON TABLE qc_inspection_attachments IS '品管檢查附件表 - 存放檢查相關圖片和文件';
