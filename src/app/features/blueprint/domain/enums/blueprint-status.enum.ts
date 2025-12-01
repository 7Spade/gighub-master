/**
 * Blueprint Status Enum
 *
 * 藍圖狀態枚舉
 *
 * @module features/blueprint/domain/enums
 */

export enum BlueprintStatus {
  /** 草稿狀態 */
  DRAFT = 'draft',
  /** 活動狀態 */
  ACTIVE = 'active',
  /** 已歸檔 */
  ARCHIVED = 'archived',
  /** 已刪除 */
  DELETED = 'deleted'
}
