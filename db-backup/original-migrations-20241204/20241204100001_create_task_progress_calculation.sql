-- ============================================================================
-- Migration: Task Progress Calculation
-- Description: 任務進度計算 - 自動計算父任務進度
-- Created: 2024-12-04
--
-- Purpose:
--   - Auto-calculate parent task progress based on children
--   - Support progress tracking for task hierarchies
--   - Trigger recalculation on child task completion_rate changes
-- ============================================================================

-- ============================================================================
-- Function: Calculate Task Progress
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_task_progress(p_task_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_child_count INTEGER;
  v_avg_progress INTEGER;
BEGIN
  -- Count children and calculate average progress
  SELECT 
    COUNT(*),
    COALESCE(ROUND(AVG(completion_rate)), 0)
  INTO v_child_count, v_avg_progress
  FROM tasks
  WHERE parent_id = p_task_id
    AND deleted_at IS NULL;

  -- If no children, return the task's own completion_rate
  IF v_child_count = 0 THEN
    RETURN (SELECT COALESCE(completion_rate, 0) FROM tasks WHERE id = p_task_id);
  END IF;

  RETURN v_avg_progress;
END;
$$;

-- ============================================================================
-- Trigger Function: Update Parent Progress
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_parent_task_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_parent_id UUID;
  v_new_progress INTEGER;
BEGIN
  -- Get parent_id
  IF TG_OP = 'DELETE' THEN
    v_parent_id := OLD.parent_id;
  ELSE
    v_parent_id := NEW.parent_id;
  END IF;

  -- If there's a parent, update its progress
  IF v_parent_id IS NOT NULL THEN
    v_new_progress := calculate_task_progress(v_parent_id);
    
    UPDATE tasks
    SET 
      completion_rate = v_new_progress,
      updated_at = NOW()
    WHERE id = v_parent_id
      AND completion_rate IS DISTINCT FROM v_new_progress;
  END IF;

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- ============================================================================
-- Create Progress Update Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS task_progress_update_trigger ON tasks;
CREATE TRIGGER task_progress_update_trigger
  AFTER INSERT OR UPDATE OF completion_rate, parent_id, deleted_at OR DELETE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_parent_task_progress();

-- ============================================================================
-- Function: Get Task Tree Progress
-- ============================================================================

CREATE OR REPLACE FUNCTION get_task_tree_progress(p_blueprint_id UUID)
RETURNS TABLE (
  total_tasks INTEGER,
  completed_tasks INTEGER,
  in_progress_tasks INTEGER,
  pending_tasks INTEGER,
  overall_progress INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_tasks,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS completed_tasks,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER AS in_progress_tasks,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_tasks,
    COALESCE(ROUND(AVG(completion_rate)), 0)::INTEGER AS overall_progress
  FROM tasks
  WHERE blueprint_id = p_blueprint_id
    AND deleted_at IS NULL;
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION calculate_task_progress IS '計算任務進度 - 基於子任務平均進度';
COMMENT ON FUNCTION trigger_update_parent_task_progress IS '觸發器函數 - 子任務變更時更新父任務進度';
COMMENT ON FUNCTION get_task_tree_progress IS '取得藍圖任務樹整體進度統計';

-- ============================================================================
-- DOWN (Rollback)
-- ============================================================================
-- DROP TRIGGER IF EXISTS task_progress_update_trigger ON tasks;
-- DROP FUNCTION IF EXISTS trigger_update_parent_task_progress();
-- DROP FUNCTION IF EXISTS calculate_task_progress(UUID);
-- DROP FUNCTION IF EXISTS get_task_tree_progress(UUID);
