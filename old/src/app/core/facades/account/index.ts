/**
 * Account Facades Module
 *
 * Exports all account-related facades (unified identity abstraction and business domains).
 * This includes workspace context, organization, team, bot facades for flat access.
 *
 * @module core/facades/account
 */

// Base facade
export * from './base-account-crud.facade';

// Workspace context facade (統一身份抽象)
export * from './workspace-context.facade';

// Business domain facades (業務域門面 - 扁平化導出)
export * from './user.facade';
export * from './bot.facade';
export * from './organization.facade';
export * from './team.facade';
