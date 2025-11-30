/**
 * Bot Type Definitions
 *
 * 機器人相關類型定義（基礎設施層）
 * Bot-related type definitions (Infrastructure Layer)
 *
 * @module core/infra/types/account
 */

import { Database } from '../database.types';

/**
 * Bot entity type (from accounts table with type='Bot')
 */
export type Bot = Database['public']['Tables']['accounts']['Row'];
export type BotInsert = Database['public']['Tables']['accounts']['Insert'];
export type BotUpdate = Database['public']['Tables']['accounts']['Update'];

/**
 * 機器人查詢選項
 * Bot query options
 */
export interface BotQueryOptions {
  /** 按狀態過濾 | Filter by status */
  status?: 'active' | 'inactive' | 'suspended' | 'deleted';
  /** 是否包含已刪除的機器人 | Include deleted bots */
  includeDeleted?: boolean;
}
