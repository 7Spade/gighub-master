/**
 * Diary Models
 *
 * Business models for Diary module
 * Following vertical slice architecture
 *
 * @module features/blueprint/domain/models/diary.models
 */

import { Diary, DiaryWeather, DiaryViewModel, DiaryStatistics } from '../types';

/**
 * Diary Model (re-export from types with business context)
 */
export type DiaryModel = Diary;

/**
 * Diary summary for list display
 */
export interface DiarySummary {
  id: string;
  date: Date;
  title: string;
  summary?: string;
  weather: DiaryWeather;
  photoCount: number;
  issueCount: number;
  authorName?: string;
}

/**
 * Create diary request
 */
export interface CreateDiaryRequest {
  workspaceId: string;
  blueprintId: string;
  date: Date;
  weather?: DiaryWeather;
  temperature?: number;
  title: string;
  summary?: string;
  content: string;
  progressDescription?: string;
}

/**
 * Update diary request
 */
export interface UpdateDiaryRequest {
  weather?: DiaryWeather;
  temperature?: number;
  title?: string;
  summary?: string;
  content?: string;
  progressDescription?: string;
}

/**
 * Weather configuration
 */
export const WEATHER_CONFIG: Record<DiaryWeather, { icon: string; label: string; color: string }> = {
  sunny: { icon: 'sun', label: '晴天', color: '#faad14' },
  cloudy: { icon: 'cloud', label: '多雲', color: '#8c8c8c' },
  rainy: { icon: 'cloud-rain', label: '雨天', color: '#1890ff' },
  stormy: { icon: 'thunderstorm', label: '暴風雨', color: '#722ed1' },
  snowy: { icon: 'snow', label: '雪天', color: '#13c2c2' },
  foggy: { icon: 'fog', label: '霧天', color: '#595959' },
  unknown: { icon: 'question', label: '未知', color: '#d9d9d9' }
};

/**
 * Diary view model mapper
 */
export function mapDiaryToViewModel(diary: Diary): DiaryViewModel {
  const weatherConfig = WEATHER_CONFIG[diary.weather];
  const openIssues = diary.issues.filter(i => i.status === 'open' || i.status === 'in_progress');

  return {
    id: diary.id,
    date: diary.date,
    formattedDate: formatDate(diary.date),
    title: diary.title,
    summary: diary.summary || '',
    weather: diary.weather,
    weatherIcon: weatherConfig.icon,
    weatherLabel: weatherConfig.label,
    temperature: diary.temperature,
    photoCount: diary.photos.length,
    attachmentCount: diary.attachments.length,
    issueCount: diary.issues.length,
    openIssueCount: openIssues.length,
    authorName: diary.authorName || '',
    createdAt: diary.createdAt
  };
}

/**
 * Calculate diary statistics
 */
export function calculateDiaryStatistics(diaries: Diary[]): DiaryStatistics {
  const now = new Date();
  const thisMonth = diaries.filter(d => {
    const diaryDate = new Date(d.date);
    return diaryDate.getMonth() === now.getMonth() && diaryDate.getFullYear() === now.getFullYear();
  });

  const totalPhotos = diaries.reduce((sum, d) => sum + d.photos.length, 0);
  const totalOpenIssues = diaries.reduce((sum, d) => sum + d.issues.filter(i => i.status === 'open').length, 0);

  return {
    totalCount: diaries.length,
    thisMonthCount: thisMonth.length,
    averagePhotoCount: diaries.length > 0 ? totalPhotos / diaries.length : 0,
    openIssueCount: totalOpenIssues
  };
}

/**
 * Format date helper
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
