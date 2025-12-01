# 日誌模組 Blueprint

> 施工日誌模組的標準實作模板

---

## 🎯 概述

施工日誌是工地管理的重要記錄模組，用於記錄每日施工狀況。

### 核心功能

- 日誌 CRUD（建立、讀取、更新、刪除）
- 日誌簽核流程（草稿 → 提交 → 核准）
- 天氣與工時記錄
- 日誌附件管理
- 日誌模板

---

## 📁 目錄結構

```
src/app/features/blueprint/
├── data-access/
│   ├── stores/
│   │   └── diary.store.ts
│   ├── services/
│   │   └── diary.service.ts
│   └── repositories/
│       └── diary.repository.ts
├── domain/
│   ├── enums/
│   │   ├── diary-status.enum.ts
│   │   └── diary-weather.enum.ts
│   └── interfaces/
│       └── diary.interface.ts
└── ui/
    └── diary/
        ├── diary-list/
        │   ├── diary-list.component.ts
        │   ├── diary-list.component.html
        │   └── diary-list.component.less
        ├── diary-detail/
        │   ├── diary-detail.component.ts
        │   ├── diary-detail.component.html
        │   └── diary-detail.component.less
        ├── diary-form-dialog/
        │   ├── diary-form-dialog.component.ts
        │   ├── diary-form-dialog.component.html
        │   └── diary-form-dialog.component.less
        └── diary-calendar/
            ├── diary-calendar.component.ts
            ├── diary-calendar.component.html
            └── diary-calendar.component.less
```

---

## 📋 Domain 層

### Enums

```typescript
// domain/enums/diary-status.enum.ts
export enum DiaryStatus {
  DRAFT = 'draft',         // 草稿
  SUBMITTED = 'submitted', // 已提交
  APPROVED = 'approved',   // 已核准
  REJECTED = 'rejected',   // 已退回
}

export const DIARY_STATUS_LABELS: Record<DiaryStatus, string> = {
  [DiaryStatus.DRAFT]: '草稿',
  [DiaryStatus.SUBMITTED]: '已提交',
  [DiaryStatus.APPROVED]: '已核准',
  [DiaryStatus.REJECTED]: '已退回',
};

export const DIARY_STATUS_COLORS: Record<DiaryStatus, string> = {
  [DiaryStatus.DRAFT]: 'default',
  [DiaryStatus.SUBMITTED]: 'processing',
  [DiaryStatus.APPROVED]: 'success',
  [DiaryStatus.REJECTED]: 'error',
};
```

```typescript
// domain/enums/diary-weather.enum.ts
export enum DiaryWeather {
  SUNNY = 'sunny',     // 晴天
  CLOUDY = 'cloudy',   // 多雲
  RAINY = 'rainy',     // 雨天
  STORMY = 'stormy',   // 暴風
  SNOWY = 'snowy',     // 雪天
  FOGGY = 'foggy',     // 霧天
}

export const DIARY_WEATHER_LABELS: Record<DiaryWeather, string> = {
  [DiaryWeather.SUNNY]: '晴天',
  [DiaryWeather.CLOUDY]: '多雲',
  [DiaryWeather.RAINY]: '雨天',
  [DiaryWeather.STORMY]: '暴風',
  [DiaryWeather.SNOWY]: '雪天',
  [DiaryWeather.FOGGY]: '霧天',
};

export const DIARY_WEATHER_ICONS: Record<DiaryWeather, string> = {
  [DiaryWeather.SUNNY]: '☀️',
  [DiaryWeather.CLOUDY]: '⛅',
  [DiaryWeather.RAINY]: '🌧️',
  [DiaryWeather.STORMY]: '⛈️',
  [DiaryWeather.SNOWY]: '❄️',
  [DiaryWeather.FOGGY]: '🌫️',
};
```

### Interface

```typescript
// domain/interfaces/diary.interface.ts
import { DiaryStatus } from '../enums/diary-status.enum';
import { DiaryWeather } from '../enums/diary-weather.enum';

export interface Diary {
  id: string;
  blueprintId: string;
  title: string;
  content: string;  // 富文本內容
  workDate: Date;
  weather: DiaryWeather;
  workHours: number;
  workerCount: number;
  status: DiaryStatus;

  // 關聯
  authorId: string;
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };

  // 簽核資訊
  submittedAt?: Date;
  approvedAt?: Date;
  approvedById?: string;
  approvedBy?: {
    id: string;
    name: string;
  };
  rejectReason?: string;

  // 附件
  attachments?: DiaryAttachment[];

  // 時間戳
  createdAt: Date;
  updatedAt: Date;
}

export interface DiaryAttachment {
  id: string;
  diaryId: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
  description?: string;
  sortOrder: number;
}

export interface CreateDiaryDto {
  blueprintId: string;
  title: string;
  content: string;
  workDate: Date;
  weather: DiaryWeather;
  workHours: number;
  workerCount: number;
  status?: DiaryStatus;
}

export interface UpdateDiaryDto {
  title?: string;
  content?: string;
  workDate?: Date;
  weather?: DiaryWeather;
  workHours?: number;
  workerCount?: number;
}

export interface DiaryFilter {
  startDate?: Date;
  endDate?: Date;
  status?: DiaryStatus;
  authorId?: string;
}
```

---

## 📦 Data Access 層

### Repository

```typescript
// data-access/repositories/diary.repository.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Diary, CreateDiaryDto, UpdateDiaryDto, DiaryFilter } from '../../domain/interfaces/diary.interface';
import { DiaryStatus } from '../../domain/enums/diary-status.enum';

@Injectable({ providedIn: 'root' })
export class DiaryRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'diaries';

  /**
   * 查詢藍圖的所有日誌
   */
  async findByBlueprint(blueprintId: string, filter?: DiaryFilter): Promise<Diary[]> {
    let query = this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        author:author_id(id, name, avatar_url),
        approved_by:approved_by_id(id, name)
      `)
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('work_date', { ascending: false });

    // 套用篩選條件
    if (filter?.startDate) {
      query = query.gte('work_date', filter.startDate.toISOString());
    }
    if (filter?.endDate) {
      query = query.lte('work_date', filter.endDate.toISOString());
    }
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    if (filter?.authorId) {
      query = query.eq('author_id', filter.authorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return this.mapToDiaries(data ?? []);
  }

  /**
   * 查詢單一日誌
   */
  async findById(id: string): Promise<Diary | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        author:author_id(id, name, avatar_url),
        approved_by:approved_by_id(id, name),
        attachments:diary_attachments(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapToDiary(data);
  }

  /**
   * 依日期查詢
   */
  async findByDate(blueprintId: string, date: Date): Promise<Diary | null> {
    const dateStr = date.toISOString().split('T')[0];
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        author:author_id(id, name, avatar_url)
      `)
      .eq('blueprint_id', blueprintId)
      .eq('work_date', dateStr)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapToDiary(data);
  }

  /**
   * 建立日誌
   */
  async create(dto: CreateDiaryDto): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .insert({
        blueprint_id: dto.blueprintId,
        title: dto.title,
        content: dto.content,
        work_date: dto.workDate.toISOString().split('T')[0],
        weather: dto.weather,
        work_hours: dto.workHours,
        worker_count: dto.workerCount,
        status: dto.status ?? DiaryStatus.DRAFT,
        author_id: await this.supabase.getUserAccountId(),
      })
      .select(`
        *,
        author:author_id(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return this.mapToDiary(data);
  }

  /**
   * 更新日誌
   */
  async update(id: string, dto: UpdateDiaryDto): Promise<Diary> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.workDate !== undefined) {
      updateData.work_date = dto.workDate.toISOString().split('T')[0];
    }
    if (dto.weather !== undefined) updateData.weather = dto.weather;
    if (dto.workHours !== undefined) updateData.work_hours = dto.workHours;
    if (dto.workerCount !== undefined) updateData.worker_count = dto.workerCount;

    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        author:author_id(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return this.mapToDiary(data);
  }

  /**
   * 提交日誌
   */
  async submit(id: string): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({
        status: DiaryStatus.SUBMITTED,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        author:author_id(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return this.mapToDiary(data);
  }

  /**
   * 核准日誌
   */
  async approve(id: string): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({
        status: DiaryStatus.APPROVED,
        approved_at: new Date().toISOString(),
        approved_by_id: await this.supabase.getUserAccountId(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        author:author_id(id, name, avatar_url),
        approved_by:approved_by_id(id, name)
      `)
      .single();

    if (error) throw error;
    return this.mapToDiary(data);
  }

  /**
   * 退回日誌
   */
  async reject(id: string, reason: string): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({
        status: DiaryStatus.REJECTED,
        reject_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`
        *,
        author:author_id(id, name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return this.mapToDiary(data);
  }

  /**
   * 軟刪除
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from(this.TABLE)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  }

  // 私有方法：資料映射
  private mapToDiary(row: Record<string, unknown>): Diary {
    return {
      id: row['id'] as string,
      blueprintId: row['blueprint_id'] as string,
      title: row['title'] as string,
      content: row['content'] as string,
      workDate: new Date(row['work_date'] as string),
      weather: row['weather'] as DiaryWeather,
      workHours: row['work_hours'] as number,
      workerCount: row['worker_count'] as number,
      status: row['status'] as DiaryStatus,
      authorId: row['author_id'] as string,
      author: row['author'] as Diary['author'],
      submittedAt: row['submitted_at'] ? new Date(row['submitted_at'] as string) : undefined,
      approvedAt: row['approved_at'] ? new Date(row['approved_at'] as string) : undefined,
      approvedById: row['approved_by_id'] as string | undefined,
      approvedBy: row['approved_by'] as Diary['approvedBy'],
      rejectReason: row['reject_reason'] as string | undefined,
      attachments: row['attachments'] as DiaryAttachment[] | undefined,
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
    };
  }

  private mapToDiaries(rows: Record<string, unknown>[]): Diary[] {
    return rows.map(row => this.mapToDiary(row));
  }
}
```

### Store

```typescript
// data-access/stores/diary.store.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { DiaryRepository } from '../repositories/diary.repository';
import { Diary, CreateDiaryDto, UpdateDiaryDto, DiaryFilter } from '../../domain/interfaces/diary.interface';
import { DiaryStatus } from '../../domain/enums/diary-status.enum';

@Injectable({ providedIn: 'root' })
export class DiaryStore {
  private readonly repository = inject(DiaryRepository);

  // 私有狀態
  private readonly _diaries = signal<Diary[]>([]);
  private readonly _currentDiary = signal<Diary | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filter = signal<DiaryFilter>({});

  // 公開唯讀狀態
  readonly diaries = this._diaries.asReadonly();
  readonly currentDiary = this._currentDiary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filter = this._filter.asReadonly();

  // 計算屬性
  readonly diaryCount = computed(() => this._diaries().length);

  readonly draftDiaries = computed(() =>
    this._diaries().filter(d => d.status === DiaryStatus.DRAFT)
  );

  readonly submittedDiaries = computed(() =>
    this._diaries().filter(d => d.status === DiaryStatus.SUBMITTED)
  );

  readonly approvedDiaries = computed(() =>
    this._diaries().filter(d => d.status === DiaryStatus.APPROVED)
  );

  readonly diariesByMonth = computed(() => {
    const byMonth = new Map<string, Diary[]>();
    this._diaries().forEach(diary => {
      const monthKey = diary.workDate.toISOString().substring(0, 7); // YYYY-MM
      const existing = byMonth.get(monthKey) ?? [];
      byMonth.set(monthKey, [...existing, diary]);
    });
    return byMonth;
  });

  /**
   * 載入藍圖的日誌
   */
  async loadDiaries(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const diaries = await this.repository.findByBlueprint(blueprintId, this._filter());
      this._diaries.set(diaries);
    } catch (error) {
      this._error.set('載入日誌失敗');
      console.error('[DiaryStore] loadDiaries error:', error);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 載入單一日誌
   */
  async loadDiary(id: string): Promise<Diary | null> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const diary = await this.repository.findById(id);
      this._currentDiary.set(diary);
      return diary;
    } catch (error) {
      this._error.set('載入日誌失敗');
      console.error('[DiaryStore] loadDiary error:', error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * 建立日誌
   */
  async createDiary(dto: CreateDiaryDto): Promise<Diary | null> {
    try {
      const diary = await this.repository.create(dto);
      this._diaries.update(diaries => [diary, ...diaries]);
      return diary;
    } catch (error) {
      this._error.set('建立日誌失敗');
      console.error('[DiaryStore] createDiary error:', error);
      return null;
    }
  }

  /**
   * 更新日誌
   */
  async updateDiary(id: string, dto: UpdateDiaryDto): Promise<boolean> {
    try {
      const updated = await this.repository.update(id, dto);
      this._diaries.update(diaries =>
        diaries.map(d => (d.id === id ? updated : d))
      );
      if (this._currentDiary()?.id === id) {
        this._currentDiary.set(updated);
      }
      return true;
    } catch (error) {
      this._error.set('更新日誌失敗');
      console.error('[DiaryStore] updateDiary error:', error);
      return false;
    }
  }

  /**
   * 提交日誌
   */
  async submitDiary(id: string): Promise<boolean> {
    try {
      const updated = await this.repository.submit(id);
      this._diaries.update(diaries =>
        diaries.map(d => (d.id === id ? updated : d))
      );
      if (this._currentDiary()?.id === id) {
        this._currentDiary.set(updated);
      }
      return true;
    } catch (error) {
      this._error.set('提交日誌失敗');
      console.error('[DiaryStore] submitDiary error:', error);
      return false;
    }
  }

  /**
   * 核准日誌
   */
  async approveDiary(id: string): Promise<boolean> {
    try {
      const updated = await this.repository.approve(id);
      this._diaries.update(diaries =>
        diaries.map(d => (d.id === id ? updated : d))
      );
      if (this._currentDiary()?.id === id) {
        this._currentDiary.set(updated);
      }
      return true;
    } catch (error) {
      this._error.set('核准日誌失敗');
      console.error('[DiaryStore] approveDiary error:', error);
      return false;
    }
  }

  /**
   * 退回日誌
   */
  async rejectDiary(id: string, reason: string): Promise<boolean> {
    try {
      const updated = await this.repository.reject(id, reason);
      this._diaries.update(diaries =>
        diaries.map(d => (d.id === id ? updated : d))
      );
      if (this._currentDiary()?.id === id) {
        this._currentDiary.set(updated);
      }
      return true;
    } catch (error) {
      this._error.set('退回日誌失敗');
      console.error('[DiaryStore] rejectDiary error:', error);
      return false;
    }
  }

  /**
   * 刪除日誌
   */
  async deleteDiary(id: string): Promise<boolean> {
    try {
      await this.repository.delete(id);
      this._diaries.update(diaries => diaries.filter(d => d.id !== id));
      if (this._currentDiary()?.id === id) {
        this._currentDiary.set(null);
      }
      return true;
    } catch (error) {
      this._error.set('刪除日誌失敗');
      console.error('[DiaryStore] deleteDiary error:', error);
      return false;
    }
  }

  /**
   * 設置篩選條件
   */
  setFilter(filter: DiaryFilter): void {
    this._filter.set(filter);
  }

  /**
   * 選擇日誌
   */
  selectDiary(diary: Diary | null): void {
    this._currentDiary.set(diary);
  }

  /**
   * 重置狀態
   */
  reset(): void {
    this._diaries.set([]);
    this._currentDiary.set(null);
    this._loading.set(false);
    this._error.set(null);
    this._filter.set({});
  }
}
```

---

## 📚 參考資源

- [系統架構設計圖](../../../docs/architecture/system-architecture.md)
- [PRD 日誌系統需求](../../../docs/prd/construction-site-management.md)
- [Feature 標準結構](./angular-feature.blueprint.md)

---

**最後更新**: 2025-11-27
