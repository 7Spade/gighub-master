/**
 * Diary Store
 *
 * 施工日誌狀態管理（使用 Angular Signals）
 *
 * @module features/blueprint/data-access/stores
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { Diary, DiaryAttachment, CreateDiaryRequest, UpdateDiaryRequest, DiaryFilter } from '../../domain';
import { DiaryRepository } from '../repositories/diary.repository';

@Injectable({
  providedIn: 'root'
})
export class DiaryStore {
  private readonly repository = inject(DiaryRepository);

  // 私有狀態
  private readonly _diaries = signal<Diary[]>([]);
  private readonly _selectedDiary = signal<Diary | null>(null);
  private readonly _attachments = signal<DiaryAttachment[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filter = signal<DiaryFilter>({});

  // 公開唯讀狀態
  readonly diaries = this._diaries.asReadonly();
  readonly selectedDiary = this._selectedDiary.asReadonly();
  readonly attachments = this._attachments.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filter = this._filter.asReadonly();

  // 計算屬性
  readonly diaryCount = computed(() => this._diaries().length);

  readonly latestDiary = computed(() => {
    const diaries = this._diaries();
    return diaries.length > 0 ? diaries[0] : null;
  });

  readonly diariesByMonth = computed(() => {
    const diaries = this._diaries();
    const grouped = new Map<string, Diary[]>();

    diaries.forEach(diary => {
      const month = diary.work_date.substring(0, 7); // YYYY-MM
      if (!grouped.has(month)) {
        grouped.set(month, []);
      }
      grouped.get(month)!.push(diary);
    });

    return grouped;
  });

  readonly totalWorkHours = computed(() => {
    return this._diaries().reduce((sum, d) => sum + (d.work_hours || 0), 0);
  });

  readonly averageWorkerCount = computed(() => {
    const diaries = this._diaries().filter(d => d.worker_count !== null);
    if (diaries.length === 0) return 0;
    const total = diaries.reduce((sum, d) => sum + (d.worker_count || 0), 0);
    return Math.round(total / diaries.length);
  });

  /**
   * 載入藍圖的所有日誌
   */
  async loadDiaries(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const diaries = await this.repository.findByBlueprintId(blueprintId);
      this._diaries.set(diaries);
    } catch (error) {
      this._error.set('載入日誌失敗');
      console.error('[DiaryStore] loadDiaries error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 根據篩選條件載入日誌
   */
  async loadDiariesWithFilter(blueprintId: string, filter: DiaryFilter): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    this._filter.set(filter);

    try {
      const diaries = await this.repository.findByFilter(blueprintId, filter);
      this._diaries.set(diaries);
    } catch (error) {
      this._error.set('載入日誌失敗');
      console.error('[DiaryStore] loadDiariesWithFilter error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 選取日誌
   */
  async selectDiary(diaryId: string): Promise<void> {
    const diary = await this.repository.findById(diaryId);
    this._selectedDiary.set(diary);

    if (diary) {
      const attachments = await this.repository.findAttachments(diaryId);
      this._attachments.set(attachments);
    } else {
      this._attachments.set([]);
    }
  }

  /**
   * 清除選取
   */
  clearSelection(): void {
    this._selectedDiary.set(null);
    this._attachments.set([]);
  }

  /**
   * 建立日誌
   */
  async createDiary(request: CreateDiaryRequest): Promise<Diary> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const diary = await this.repository.create(request);
      this._diaries.update(diaries => [diary, ...diaries]);
      return diary;
    } catch (error) {
      this._error.set('建立日誌失敗');
      console.error('[DiaryStore] createDiary error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 更新日誌
   */
  async updateDiary(id: string, request: UpdateDiaryRequest): Promise<Diary> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const diary = await this.repository.update(id, request);
      this._diaries.update(diaries =>
        diaries.map(d => (d.id === id ? diary : d))
      );
      if (this._selectedDiary()?.id === id) {
        this._selectedDiary.set(diary);
      }
      return diary;
    } catch (error) {
      this._error.set('更新日誌失敗');
      console.error('[DiaryStore] updateDiary error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 刪除日誌
   */
  async deleteDiary(id: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      await this.repository.softDelete(id);
      this._diaries.update(diaries => diaries.filter(d => d.id !== id));
      if (this._selectedDiary()?.id === id) {
        this._selectedDiary.set(null);
        this._attachments.set([]);
      }
    } catch (error) {
      this._error.set('刪除日誌失敗');
      console.error('[DiaryStore] deleteDiary error:', error);
      throw error;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._diaries.set([]);
    this._selectedDiary.set(null);
    this._attachments.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._filter.set({});
  }
}
