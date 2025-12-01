/**
 * Diary Interface
 *
 * 施工日誌領域介面
 *
 * @module features/blueprint/domain/interfaces
 */

import { WeatherType } from '../enums';

/**
 * Diary - 施工日誌實體
 */
export interface Diary {
  id: string;
  blueprint_id: string;
  work_date: string;
  weather: WeatherType | null;
  temperature_min: number | null;
  temperature_max: number | null;
  work_hours: number | null;
  worker_count: number | null;
  summary: string | null;
  notes: string | null;
  status: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * DiaryAttachment - 日誌附件（施工照片）
 */
export interface DiaryAttachment {
  id: string;
  diary_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  caption: string | null;
  uploaded_by: string | null;
  created_at: string;
}

/**
 * CreateDiaryRequest - 建立日誌請求
 */
export interface CreateDiaryRequest {
  blueprint_id: string;
  work_date: string;
  weather?: WeatherType | null;
  temperature_min?: number | null;
  temperature_max?: number | null;
  work_hours?: number | null;
  worker_count?: number | null;
  summary?: string | null;
  notes?: string | null;
}

/**
 * UpdateDiaryRequest - 更新日誌請求
 */
export interface UpdateDiaryRequest {
  weather?: WeatherType | null;
  temperature_min?: number | null;
  temperature_max?: number | null;
  work_hours?: number | null;
  worker_count?: number | null;
  summary?: string | null;
  notes?: string | null;
}

/**
 * DiaryFilter - 日誌篩選條件
 */
export interface DiaryFilter {
  date_from?: string;
  date_to?: string;
  weather?: WeatherType[];
  status?: string[];
}
