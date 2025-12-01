# Signals Store + Repository 生成 Prompt

> 生成符合專案規範的狀態管理 Store 與資料存取 Repository

---

## 🎯 用途

快速生成：

- Signals Store (狀態管理)
- Repository (資料存取層)
- 相關的 Interface 定義

---

## 📋 Prompt 模板

```
請為以下功能生成 Store 與 Repository：

## 功能名稱
[功能名稱]

## 資料表名稱
[Supabase 表名]

## 資料模型
[欄位定義]

## Store 需求
- 狀態: [列出需要管理的狀態]
- 計算屬性: [列出需要的 computed]
- 操作: [列出需要的方法]

## Repository 需求
- 查詢: [列出查詢方法]
- 建立: [建立方法需求]
- 更新: [更新方法需求]
- 刪除: [刪除方法需求]
```

---

## 📝 範例

### 輸入

```
## 功能名稱
diary (施工日誌)

## 資料表名稱
diaries

## 資料模型
- id: UUID
- blueprint_id: UUID
- title: string
- content: string (富文本)
- work_date: date
- weather: enum (sunny, cloudy, rainy, stormy)
- work_hours: number
- worker_count: number
- author_id: UUID
- status: enum (draft, submitted, approved)
- created_at: timestamp
- updated_at: timestamp

## Store 需求
- 狀態: 
  - diaries: 日誌列表
  - currentDiary: 當前選中的日誌
  - loading: 載入中狀態
  - error: 錯誤訊息
- 計算屬性:
  - diaryCount: 日誌數量
  - draftDiaries: 草稿日誌
  - submittedDiaries: 已提交日誌
- 操作:
  - loadDiaries(blueprintId): 載入藍圖的日誌
  - loadDiary(id): 載入單一日誌
  - createDiary(dto): 建立日誌
  - updateDiary(id, dto): 更新日誌
  - deleteDiary(id): 刪除日誌
  - submitDiary(id): 提交日誌

## Repository 需求
- 查詢: findByBlueprint, findById, findByDateRange
- 建立: 支援草稿與直接提交
- 更新: 支援內容更新與狀態變更
- 刪除: 軟刪除
```

### 輸出

#### 1. Interface 定義

```typescript
// domain/interfaces/diary.interface.ts
export interface Diary {
  id: string;
  blueprintId: string;
  title: string;
  content: string;
  workDate: Date;
  weather: DiaryWeather;
  workHours: number;
  workerCount: number;
  authorId: string;
  status: DiaryStatus;
  createdAt: Date;
  updatedAt: Date;
  // 關聯資料
  author?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
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
```

```typescript
// domain/enums/diary.enum.ts
export enum DiaryWeather {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  STORMY = 'stormy',
}

export enum DiaryStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
}
```

#### 2. Repository

```typescript
// data-access/repositories/diary.repository.ts
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core/services/supabase.service';
import { Diary, CreateDiaryDto, UpdateDiaryDto } from '../../domain/interfaces/diary.interface';
import { DiaryStatus } from '../../domain/enums/diary.enum';

@Injectable({ providedIn: 'root' })
export class DiaryRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE = 'diaries';

  /**
   * 查詢藍圖的所有日誌
   */
  async findByBlueprint(blueprintId: string): Promise<Diary[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        author:author_id(id, name, avatar_url)
      `)
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('work_date', { ascending: false });

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
        author:author_id(id, name, avatar_url)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return this.mapToDiary(data);
  }

  /**
   * 依日期範圍查詢
   */
  async findByDateRange(
    blueprintId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Diary[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .select(`
        *,
        author:author_id(id, name, avatar_url)
      `)
      .eq('blueprint_id', blueprintId)
      .gte('work_date', startDate.toISOString())
      .lte('work_date', endDate.toISOString())
      .is('deleted_at', null)
      .order('work_date', { ascending: false });

    if (error) throw error;
    return this.mapToDiaries(data ?? []);
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
        work_date: dto.workDate.toISOString(),
        weather: dto.weather,
        work_hours: dto.workHours,
        worker_count: dto.workerCount,
        author_id: await this.supabase.getUserAccountId(),
        status: dto.status ?? DiaryStatus.DRAFT,
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
    if (dto.workDate !== undefined) updateData.work_date = dto.workDate.toISOString();
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
   * 更新狀態
   */
  async updateStatus(id: string, status: DiaryStatus): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE)
      .update({
        status,
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
      authorId: row['author_id'] as string,
      status: row['status'] as DiaryStatus,
      createdAt: new Date(row['created_at'] as string),
      updatedAt: new Date(row['updated_at'] as string),
      author: row['author'] as Diary['author'],
    };
  }

  private mapToDiaries(rows: Record<string, unknown>[]): Diary[] {
    return rows.map(row => this.mapToDiary(row));
  }
}
```

#### 3. Store

```typescript
// data-access/stores/diary.store.ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { DiaryRepository } from '../repositories/diary.repository';
import { Diary, CreateDiaryDto, UpdateDiaryDto } from '../../domain/interfaces/diary.interface';
import { DiaryStatus } from '../../domain/enums/diary.enum';

@Injectable({ providedIn: 'root' })
export class DiaryStore {
  private readonly repository = inject(DiaryRepository);

  // 私有狀態
  private readonly _diaries = signal<Diary[]>([]);
  private readonly _currentDiary = signal<Diary | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // 公開唯讀狀態
  readonly diaries = this._diaries.asReadonly();
  readonly currentDiary = this._currentDiary.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

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

  /**
   * 載入藍圖的所有日誌
   */
  async loadDiaries(blueprintId: string): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const diaries = await this.repository.findByBlueprint(blueprintId);
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
      const updated = await this.repository.updateStatus(id, DiaryStatus.SUBMITTED);
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
  }
}
```

---

## 📚 參考資源

- [程式風格指南](../styleguide.md)
- [Supabase 文檔](https://supabase.com/docs)

---

**最後更新**: 2025-11-27
