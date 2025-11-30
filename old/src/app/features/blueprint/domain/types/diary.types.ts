/**
 * Diary Types
 *
 * Type definitions for Diary Module (日誌模組)
 * Following vertical slice architecture and enterprise guidelines
 *
 * @module features/blueprint/domain/types/diary.types
 */

/**
 * Weather type for diary entries
 */
export type DiaryWeather = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | 'foggy' | 'unknown';

/**
 * Diary photo attachment
 */
export interface DiaryPhoto {
  readonly id: string;
  readonly url: string;
  readonly thumbnailUrl?: string;
  readonly caption?: string;
  readonly uploadedAt: Date;
  readonly uploadedBy: string;
}

/**
 * Diary general attachment
 */
export interface DiaryAttachment {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadedAt: Date;
  readonly uploadedBy: string;
}

/**
 * Diary issue record
 */
export interface DiaryIssue {
  readonly id: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly status: 'open' | 'in_progress' | 'resolved';
  readonly linkedTodoId?: string;
  readonly createdAt: Date;
}

/**
 * Diary entity
 */
export interface Diary {
  readonly id: string;
  readonly workspaceId: string;
  readonly blueprintId: string;

  // Date and time
  readonly date: Date;
  readonly weather: DiaryWeather;
  readonly temperature?: number;

  // Content
  readonly title: string;
  readonly summary?: string;
  readonly content: string;
  readonly progressDescription?: string;

  // Attachments
  readonly photos: DiaryPhoto[];
  readonly attachments: DiaryAttachment[];

  // Issues and todos
  readonly issues: DiaryIssue[];
  readonly linkedTodoIds: string[];

  // Author info
  readonly authorId: string;
  readonly authorName?: string;

  // Timestamps
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Diary insert type (for creation)
 */
export interface DiaryInsert {
  workspaceId: string;
  blueprintId: string;
  date: Date;
  weather?: DiaryWeather;
  temperature?: number;
  title: string;
  summary?: string;
  content: string;
  progressDescription?: string;
  authorId: string;
}

/**
 * Diary update type (for modifications)
 */
export interface DiaryUpdate {
  weather?: DiaryWeather;
  temperature?: number;
  title?: string;
  summary?: string;
  content?: string;
  progressDescription?: string;
}

/**
 * Diary view model for UI display
 */
export interface DiaryViewModel {
  readonly id: string;
  readonly date: Date;
  readonly formattedDate: string;
  readonly title: string;
  readonly summary: string;
  readonly weather: DiaryWeather;
  readonly weatherIcon: string;
  readonly weatherLabel: string;
  readonly temperature?: number;
  readonly photoCount: number;
  readonly attachmentCount: number;
  readonly issueCount: number;
  readonly openIssueCount: number;
  readonly authorName: string;
  readonly createdAt: Date;
}

/**
 * Diary filter options
 */
export interface DiaryFilterOptions {
  startDate?: Date;
  endDate?: Date;
  weather?: DiaryWeather;
  authorId?: string;
  searchTerm?: string;
}

/**
 * Diary statistics
 */
export interface DiaryStatistics {
  totalCount: number;
  thisMonthCount: number;
  averagePhotoCount: number;
  openIssueCount: number;
}

/**
 * Type guards
 */
export function isDiaryWeather(value: unknown): value is DiaryWeather {
  return typeof value === 'string' && ['sunny', 'cloudy', 'rainy', 'stormy', 'snowy', 'foggy', 'unknown'].includes(value);
}
