-- Seed: Problems Data
-- Description: 問題管理模組種子資料
-- Features:
--   - Sample problems with various types and statuses
--   - Problem actions tracking lifecycle
--   - Problem comments for collaboration
--   - Attachments for evidence

-- ============================================================================
-- Note: This seed file requires the following tables to exist:
--   - blueprints
--   - accounts
--   - tasks
--   - qc_inspections
--   - acceptances
--   - problems
--   - problem_actions
--   - problem_comments
--   - problem_attachments
-- ============================================================================

-- ============================================================================
-- Sample Problems
-- ============================================================================

DO $$
DECLARE
  v_blueprint_id UUID;
  v_account_id UUID;
  v_account_id_2 UUID;
  v_problem_id_1 UUID;
  v_problem_id_2 UUID;
  v_problem_id_3 UUID;
  v_problem_id_4 UUID;
  v_problem_id_5 UUID;
  v_comment_id_1 UUID;
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
    -- Problem 1: Defect - Closed (with knowledge base)
    -- ========================================================================
    INSERT INTO problems (
      id,
      blueprint_id,
      problem_code,
      title,
      description,
      problem_type,
      source,
      status,
      priority,
      severity,
      impact_description,
      impact_cost,
      impact_schedule,
      risk_flag,
      location,
      area,
      reporter_id,
      assignee_id,
      verifier_id,
      reported_at,
      target_date,
      resolved_at,
      verified_at,
      closed_at,
      root_cause,
      resolution,
      prevention,
      notes,
      knowledge_base,
      knowledge_tags,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'PRB-2024-001',
      '一樓柱體混凝土蜂窩現象',
      '發現一樓 C2 柱混凝土澆置後出現蜂窩現象，面積約 30cm x 20cm',
      'defect',
      'qc_inspection',
      'closed',
      'high',
      'major',
      '結構強度可能受影響，需進行補強',
      25000.00,
      2,
      FALSE,
      '一樓 C2 柱',
      'A 區',
      v_account_id,
      v_account_id_2,
      v_account_id,
      NOW() - INTERVAL '14 days',
      CURRENT_DATE - INTERVAL '10 days',
      NOW() - INTERVAL '8 days',
      NOW() - INTERVAL '7 days',
      NOW() - INTERVAL '6 days',
      '混凝土澆置時振動不足，且模板接縫處有漏漿現象',
      '1. 清除鬆散混凝土 2. 植入化學錨栓 3. 以高強度修補砂漿修補 4. 養護七天',
      '1. 加強模板封堵 2. 增加振動棒作業次數 3. 現場監工加強巡視',
      '修補完成後經結構技師確認強度符合要求',
      TRUE,
      ARRAY['混凝土', '蜂窩', '修補', '結構'],
      v_account_id,
      NOW() - INTERVAL '14 days'
    )
    RETURNING id INTO v_problem_id_1;
    
    -- ========================================================================
    -- Problem 2: Safety issue - In Progress (High Risk)
    -- ========================================================================
    INSERT INTO problems (
      id,
      blueprint_id,
      problem_code,
      title,
      description,
      problem_type,
      source,
      status,
      priority,
      severity,
      impact_description,
      risk_flag,
      location,
      area,
      reporter_id,
      assignee_id,
      reported_at,
      target_date,
      notes,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'PRB-2024-002',
      '三樓施工架護欄鬆動',
      '三樓外牆施工架護欄連接件鬆動，有墜落風險',
      'safety',
      'self_report',
      'in_progress',
      'critical',
      'critical',
      '人員墜落風險，需立即處理',
      TRUE,
      '三樓外牆施工架',
      'B 區',
      v_account_id,
      v_account_id_2,
      NOW() - INTERVAL '1 day',
      CURRENT_DATE,
      '已暫停該區施工，等待安全補強',
      v_account_id,
      NOW() - INTERVAL '1 day'
    )
    RETURNING id INTO v_problem_id_2;
    
    -- ========================================================================
    -- Problem 3: Quality issue - Assigned
    -- ========================================================================
    INSERT INTO problems (
      id,
      blueprint_id,
      problem_code,
      title,
      description,
      problem_type,
      source,
      status,
      priority,
      severity,
      impact_description,
      impact_cost,
      location,
      area,
      reporter_id,
      assignee_id,
      reported_at,
      target_date,
      notes,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'PRB-2024-003',
      '灑水頭間距不符規範',
      '消防設備品管檢查發現灑水頭間距超過規範要求',
      'quality',
      'qc_inspection',
      'assigned',
      'high',
      'major',
      '無法通過消防檢查，需重新配置灑水頭位置',
      80000.00,
      '二樓辦公區',
      'C 區',
      v_account_id,
      v_account_id_2,
      NOW() - INTERVAL '3 days',
      CURRENT_DATE + INTERVAL '5 days',
      '已通知消防承包商進行整改',
      v_account_id,
      NOW() - INTERVAL '3 days'
    )
    RETURNING id INTO v_problem_id_3;
    
    -- ========================================================================
    -- Problem 4: Risk - Assessing
    -- ========================================================================
    INSERT INTO problems (
      id,
      blueprint_id,
      problem_code,
      title,
      description,
      problem_type,
      source,
      status,
      priority,
      severity,
      impact_description,
      impact_schedule,
      risk_flag,
      reporter_id,
      reported_at,
      notes,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'PRB-2024-004',
      '進口設備交期延遲風險',
      '空調主機進口設備因國際航運問題可能延遲二至三週',
      'risk',
      'self_report',
      'assessing',
      'medium',
      'major',
      '可能影響機電工程進度，需評估替代方案',
      21,
      TRUE,
      v_account_id,
      NOW() - INTERVAL '2 days',
      '正在評估影響範圍及可能的替代方案',
      v_account_id,
      NOW() - INTERVAL '2 days'
    )
    RETURNING id INTO v_problem_id_4;
    
    -- ========================================================================
    -- Problem 5: Improvement - Open
    -- ========================================================================
    INSERT INTO problems (
      id,
      blueprint_id,
      problem_code,
      title,
      description,
      problem_type,
      source,
      status,
      priority,
      severity,
      reporter_id,
      reported_at,
      notes,
      created_by,
      created_at
    ) VALUES (
      gen_random_uuid(),
      v_blueprint_id,
      'PRB-2024-005',
      '建議增設施工電梯',
      '目前施工電梯數量不足，建議增設一部以提升施工效率',
      'improvement',
      'self_report',
      'open',
      'low',
      'minor',
      v_account_id,
      NOW() - INTERVAL '5 days',
      '待工地主任評估可行性',
      v_account_id,
      NOW() - INTERVAL '5 days'
    )
    RETURNING id INTO v_problem_id_5;
    
    -- ========================================================================
    -- Problem Actions
    -- ========================================================================
    
    -- Actions for Problem 1 (full lifecycle)
    INSERT INTO problem_actions (
      problem_id,
      action_type,
      action_description,
      from_status,
      to_status,
      actor_id,
      created_at
    ) VALUES
    (
      v_problem_id_1,
      'create',
      '問題開立',
      NULL,
      'open',
      v_account_id,
      NOW() - INTERVAL '14 days'
    ),
    (
      v_problem_id_1,
      'assess',
      '評估問題嚴重程度，確認需進行補強修復',
      'open',
      'assessing',
      v_account_id,
      NOW() - INTERVAL '13 days'
    ),
    (
      v_problem_id_1,
      'assign',
      '分派給結構修補專責人員處理',
      'assessing',
      'assigned',
      v_account_id,
      NOW() - INTERVAL '12 days'
    ),
    (
      v_problem_id_1,
      'start',
      '開始進行修補作業',
      'assigned',
      'in_progress',
      v_account_id_2,
      NOW() - INTERVAL '11 days'
    ),
    (
      v_problem_id_1,
      'resolve',
      '修補作業完成，已完成養護',
      'in_progress',
      'resolved',
      v_account_id_2,
      NOW() - INTERVAL '8 days'
    ),
    (
      v_problem_id_1,
      'verify',
      '驗證修補強度符合要求',
      'resolved',
      'verifying',
      v_account_id,
      NOW() - INTERVAL '7 days'
    ),
    (
      v_problem_id_1,
      'close',
      '問題結案，納入知識庫',
      'verifying',
      'closed',
      v_account_id,
      NOW() - INTERVAL '6 days'
    );
    
    -- Actions for Problem 2 (in progress)
    INSERT INTO problem_actions (
      problem_id,
      action_type,
      action_description,
      from_status,
      to_status,
      actor_id,
      created_at
    ) VALUES
    (
      v_problem_id_2,
      'create',
      '發現安全問題，緊急回報',
      NULL,
      'open',
      v_account_id,
      NOW() - INTERVAL '1 day'
    ),
    (
      v_problem_id_2,
      'escalate',
      '高風險問題，立即暫停該區作業',
      'open',
      'assigned',
      v_account_id,
      NOW() - INTERVAL '1 day' + INTERVAL '1 hour'
    ),
    (
      v_problem_id_2,
      'start',
      '安全人員開始進行護欄補強作業',
      'assigned',
      'in_progress',
      v_account_id_2,
      NOW() - INTERVAL '12 hours'
    );
    
    -- Actions for Problem 3 (assigned)
    INSERT INTO problem_actions (
      problem_id,
      action_type,
      action_description,
      from_status,
      to_status,
      actor_id,
      created_at
    ) VALUES
    (
      v_problem_id_3,
      'create',
      '品管檢查發現問題',
      NULL,
      'open',
      v_account_id,
      NOW() - INTERVAL '3 days'
    ),
    (
      v_problem_id_3,
      'assess',
      '評估影響範圍及改善成本',
      'open',
      'assessing',
      v_account_id,
      NOW() - INTERVAL '2 days'
    ),
    (
      v_problem_id_3,
      'assign',
      '分派給消防承包商負責整改',
      'assessing',
      'assigned',
      v_account_id,
      NOW() - INTERVAL '1 day'
    );
    
    -- Actions for Problem 4 (assessing)
    INSERT INTO problem_actions (
      problem_id,
      action_type,
      action_description,
      from_status,
      to_status,
      actor_id,
      created_at
    ) VALUES
    (
      v_problem_id_4,
      'create',
      '發現潛在交期風險',
      NULL,
      'open',
      v_account_id,
      NOW() - INTERVAL '2 days'
    ),
    (
      v_problem_id_4,
      'assess',
      '正在評估影響範圍及替代方案',
      'open',
      'assessing',
      v_account_id,
      NOW() - INTERVAL '1 day'
    );
    
    -- ========================================================================
    -- Problem Comments
    -- ========================================================================
    
    -- Comments for Problem 1
    INSERT INTO problem_comments (
      id,
      problem_id,
      content,
      author_id,
      created_at
    ) VALUES
    (
      gen_random_uuid(),
      v_problem_id_1,
      '已拍照存證，蜂窩面積約 30cm x 20cm，深度約 3-5cm',
      v_account_id,
      NOW() - INTERVAL '14 days' + INTERVAL '1 hour'
    )
    RETURNING id INTO v_comment_id_1;
    
    INSERT INTO problem_comments (
      problem_id,
      parent_id,
      content,
      author_id,
      created_at
    ) VALUES
    (
      v_problem_id_1,
      v_comment_id_1,
      '收到，請先用粉筆標記範圍，我下午過去現場評估',
      v_account_id_2,
      NOW() - INTERVAL '14 days' + INTERVAL '2 hours'
    );
    
    INSERT INTO problem_comments (
      problem_id,
      content,
      author_id,
      created_at
    ) VALUES
    (
      v_problem_id_1,
      '修補砂漿已養護完成，今天會進行強度測試',
      v_account_id_2,
      NOW() - INTERVAL '8 days'
    ),
    (
      v_problem_id_1,
      '強度測試通過，可以進行驗證作業',
      v_account_id_2,
      NOW() - INTERVAL '7 days' + INTERVAL '2 hours'
    );
    
    -- Comments for Problem 2
    INSERT INTO problem_comments (
      problem_id,
      content,
      author_id,
      created_at
    ) VALUES
    (
      v_problem_id_2,
      '已設置警示帶並暫停該區作業，等待安全人員處理',
      v_account_id,
      NOW() - INTERVAL '1 day' + INTERVAL '30 minutes'
    ),
    (
      v_problem_id_2,
      '我已到現場，正在檢查所有連接件，預計今天下班前可完成補強',
      v_account_id_2,
      NOW() - INTERVAL '10 hours'
    );
    
    -- Comments for Problem 4
    INSERT INTO problem_comments (
      problem_id,
      content,
      author_id,
      created_at
    ) VALUES
    (
      v_problem_id_4,
      '已聯繫供應商確認最新交期資訊，預計明天回覆',
      v_account_id,
      NOW() - INTERVAL '1 day'
    );
    
    RAISE NOTICE 'Problems seed data inserted successfully';
  ELSE
    RAISE NOTICE 'Skipping problems seed: No blueprint or account found';
  END IF;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE problems IS '問題記錄表 - 管理問題生命週期';
COMMENT ON TABLE problem_actions IS '問題處置記錄表 - 記錄處置歷史';
COMMENT ON TABLE problem_comments IS '問題評論表 - 問題討論留言';
COMMENT ON TABLE problem_attachments IS '問題附件表 - 存放問題相關檔案';
