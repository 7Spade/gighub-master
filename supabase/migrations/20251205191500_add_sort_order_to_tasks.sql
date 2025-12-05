-- Migration: Add sort_order column to tasks table
-- Created: 2025-12-05T19:15:00Z
-- Description: Fix task creation failure by adding missing sort_order column
-- Reference: Context7 Supabase documentation for ALTER TABLE migrations
--
-- Issue: Task creation was failing with "column tasks.sort_order does not exist" error
-- The TaskRepository uses sort_order for hierarchical task ordering but the column was missing

-- Add sort_order column with default value 0
ALTER TABLE IF EXISTS public.tasks
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0 NOT NULL;

-- Create index for sort_order to optimize task ordering queries
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order 
ON public.tasks(blueprint_id, parent_id, sort_order);

-- Add comment for documentation
COMMENT ON COLUMN public.tasks.sort_order IS 'Sort order for displaying tasks in hierarchical view';
