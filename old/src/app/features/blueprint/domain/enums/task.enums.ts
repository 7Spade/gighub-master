/**
 * Task Enums
 *
 * Enum definitions for Task business logic
 * Aligned with database schema: 20251129000001_create_multi_tenant_saas_schema.sql
 *
 * @module features/blueprint/domain/enums/task.enums
 */

/**
 * Task status enum (matches database enum)
 */
export enum TaskStatusEnum {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked'
}

/**
 * Task priority enum (matches database enum)
 */
export enum TaskPriorityEnum {
  LOWEST = 'lowest',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  HIGHEST = 'highest'
}
