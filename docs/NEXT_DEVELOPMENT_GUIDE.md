# 📋 GigHub 下一步開發指南

> 基於專案現況分析的開發方向建議（已更新至最新進度）

**更新日期**: 2025-12-03

---

## 📊 專案現況總覽

### 功能完成度概覽

```
┌────────────────────────────────────────────────────────────────┐
│                        完成度評估                               │
├────────────────────────────────────────────────────────────────┤
│ 基礎層 (Foundation Layer)                                       │
│   ✅ 認證系統 (Supabase Auth)                 ████████████ 完成 │
│   ✅ 使用者管理                               ████████████ 完成 │
│   ✅ 組織管理                                 ████████████ 完成 │
│   🔶 Bot 管理                                 ██████░░░░░░ 50%  │
├────────────────────────────────────────────────────────────────┤
│ 容器層 (Container Layer)                                        │
│   ✅ 藍圖系統                                 ████████████ 完成 │
│   ✅ 藍圖成員管理                             ████████████ 完成 │
│   🔶 權限控制 (RBAC)                          ████████░░░░ 70%  │
│   🔴 事件總線                                 ░░░░░░░░░░░░ 0%   │
│   🔴 搜尋引擎                                 ░░░░░░░░░░░░ 0%   │
├────────────────────────────────────────────────────────────────┤
│ 業務層 (Business Layer)                                         │
│   ✅ 任務管理 (Task Module)                   ██████████░░ 85%  │
│   ✅ 財務管理 (Financial Module)              ████████░░░░ 70%  │
│   🔶 日誌管理 (Diary Module)                  ██░░░░░░░░░░ 15%  │
│   🔶 待辦事項 (Todo Module)                   ████░░░░░░░░ 35%  │
│   🔴 品質驗收 (Acceptance)                    ░░░░░░░░░░░░ 0%   │
│   🔴 檔案管理 (File Module)                   ░░░░░░░░░░░░ 0%   │
│   🔴 問題追蹤 (Issue Module)                  ░░░░░░░░░░░░ 0%   │
│   🔴 通知中心 (Notification)                  ░░░░░░░░░░░░ 0%   │
└────────────────────────────────────────────────────────────────┘
```

### 🎉 最新完成進度

以下模組已於近期完成重大更新：

| 模組 | 完成項目 | 狀態 |
|------|---------|------|
| **任務管理** | TaskRepository + TaskService 完整實作 | ✅ 85% |
| **藍圖管理** | BlueprintRepository + BlueprintService 完整實作 | ✅ 完成 |
| **財務管理** | FinancialRepository + FinancialService 完整實作 | ✅ 70% |
| **藍圖成員** | BlueprintMemberRepository 完整實作 | ✅ 完成 |
| **權限控制** | PermissionService 基礎實作 | 🔶 70% |

### 技術架構現況

| 層級 | 元件 | 狀態 | 說明 |
|------|------|------|------|
| **Repository 層** | TaskRepository | ✅ 完成 | 完整 CRUD + 查詢選項 |
| **Repository 層** | BlueprintRepository | ✅ 完成 | 完整 CRUD + 成員管理 |
| **Repository 層** | FinancialRepository | ✅ 完成 | 合約、費用、請款、付款管理 |
| **Repository 層** | DiaryRepository | 🔴 待建立 | 日誌資料存取層 |
| **Repository 層** | FileRepository | 🔴 待建立 | 檔案資料存取層 |
| **Service 層** | TaskService | ✅ 完成 | 使用 Signals + linkedSignal |
| **Service 層** | BlueprintService | ✅ 完成 | 完整業務邏輯 |
| **Service 層** | FinancialService | ✅ 完成 | 財務業務邏輯 |
| **UI 元件** | TasksComponent | ✅ 完成 | 樹狀/表格/看板視圖 |
| **UI 元件** | TaskEditDrawerComponent | ✅ 完成 | 任務編輯抽屜 |

---

## 🎯 開發優先級建議

基於專案現況分析，以下是建議的開發優先順序：

### 🔴 最高優先級 - 立即執行 (1-2 週)

#### 1. 施工日誌模組 (Diary Module) ⭐⭐⭐⭐⭐

**現況**：資料庫已設計完成，前端和服務層尚未實作

**待完成項目**：
1. **DiaryRepository** - 日誌資料存取層
2. **DiaryService** - 日誌業務邏輯（使用 Signals）
3. **日誌列表頁面** - `routes/blueprint/diary/diary-list/`
4. **日誌建立/編輯表單** - `routes/blueprint/diary/diary-form/`
5. **日誌條目管理** - 工作項目記錄
6. **天氣選擇器** - 基於 `weather_type` 枚舉

**已有資料表**：
- `diaries` - 日誌主表
- `diary_attachments` - 日誌附件

**為什麼優先**：
- 工地主任每日必用功能
- 法規要求的施工紀錄
- 資料庫結構已就緒
- 可參考 TaskModule 的架構模式

**建議檔案結構**：
```
src/app/
├── core/infra/repositories/diary/
│   ├── diary.repository.ts      ← 待建立
│   └── index.ts
├── shared/services/diary/
│   ├── diary.service.ts         ← 待建立
│   └── index.ts
└── routes/blueprint/diary/
    ├── diary-list/              ← 待建立
    ├── diary-form/              ← 待建立
    └── routes.ts                ← 待建立
```

---

### 🟠 高優先級 - 短期目標 (2-4 週)

#### 2. 檔案管理模組 (File Module) ⭐⭐⭐⭐

**現況**：資料庫結構已在 `seed.sql` 中設計，前端未開始

**待完成項目**：
1. **Supabase Storage 配置** - bucket 設定和權限
2. **FileRepository** - 資料存取層
3. **FileService** - 檔案業務邏輯
4. **檔案上傳元件** - 拖拉上傳 UI
5. **檔案預覽** - 圖片/PDF 預覽
6. **檔案分享** - `file_shares` 表整合

**已有資料表**：
- `files` - 檔案主表
- `file_shares` - 檔案分享

**依賴關係**：
- 日誌照片上傳需要此模組
- 任務附件需要此模組

#### 3. 任務模組完善 ⭐⭐⭐⭐

**現況**：核心功能已完成（85%），需完善細節

**待完成項目**：
1. **移除 mock 資料相關程式碼** - 清理 `generateMockTasks` 等已棄用方法
2. **任務附件功能** - 整合 `task_attachments` 資料表
3. **任務指派通知** - 整合通知系統
4. **任務評論功能** - 討論和留言（需新增 `task_comments` 表）
5. **拖曳排序** - 任務順序調整

---

### 🟡 中優先級 - 中期目標 (4-6 週)

#### 4. 權限控制完善 ⭐⭐⭐

**現況**：基礎 RBAC 已實現（70%），細粒度權限控制不完整

**待完成項目**：
1. **blueprint_roles 整合** - 自訂角色系統
2. **權限 Guard 強化** - 路由層權限控制
3. **UI 權限控制** - 按鈕/操作的條件顯示
4. **PermissionDirective** - 權限指令元件

#### 5. 問題追蹤模組 (Issue Module) ⭐⭐⭐

**現況**：資料表已設計 (`issues`, `issue_comments`)，前端未實現

**待完成項目**：
1. **IssueRepository** - 問題資料存取層
2. **IssueService** - 問題業務邏輯
3. **問題列表/詳情頁面** - UI 元件
4. **問題評論功能** - 討論留言

#### 6. 通知中心模組 ⭐⭐⭐

**現況**：資料表已設計 (`notifications`, `notification_preferences`)，前端未實現

**待完成項目**：
1. **NotificationRepository** - 通知資料存取層
2. **NotificationService** - 通知業務邏輯
3. **通知中心 UI** - 通知列表、未讀標記
4. **Supabase Realtime 整合** - 即時通知推送

---

### 🟢 一般優先級 - 長期目標 (6+ 週)

#### 7. 品質驗收模組 ⭐⭐

**現況**：資料表已設計 (`task_acceptances`, `checklists`, `checklist_items`)

**待建立**：
- 驗收清單系統
- 驗收流程管理
- 驗收報告產生

#### 8. 事件總線系統 ⭐⭐

**現況**：資料表已設計 (`events`, `event_subscriptions`)

**待建立**：
- 事件發布/訂閱機制
- 模組間通訊
- 自動化觸發器

#### 9. 搜尋引擎 ⭐

**現況**：資料表已設計 (`search_index`)

**待建立**：
- 全文檢索功能
- 搜尋結果頁面
- 搜尋建議

---

## 📁 現有目錄結構參考

### Repository 層（已完成）
```
src/app/core/infra/repositories/
├── account/
│   ├── account.repository.ts    ✅
│   └── index.ts
├── blueprint/
│   ├── blueprint.repository.ts  ✅
│   ├── blueprint-member.repository.ts ✅
│   └── index.ts
├── financial/
│   ├── financial.repository.ts  ✅
│   └── index.ts
├── task/
│   ├── task.repository.ts       ✅
│   └── index.ts
└── index.ts
```

### Service 層（已完成）
```
src/app/shared/services/
├── account/
│   └── account.service.ts       ✅
├── blueprint/
│   └── blueprint.service.ts     ✅
├── financial/
│   └── financial.service.ts     ✅
├── task/
│   └── task.service.ts          ✅
├── menu/
│   └── menu.service.ts          ✅
├── permission/
│   └── permission.service.ts    🔶
└── index.ts
```

### 路由頁面（部分完成）
```
src/app/routes/
├── blueprint/
│   ├── list/                    ✅ 藍圖列表
│   ├── create-blueprint/        ✅ 建立藍圖
│   ├── overview/                ✅ 藍圖總覽
│   ├── members/                 ✅ 成員管理
│   ├── tasks/                   ✅ 任務管理
│   │   ├── tasks.component.ts
│   │   └── task-edit-drawer.component.ts
│   ├── diary/                   🔴 待建立
│   ├── files/                   🔴 待建立
│   └── routes.ts
├── account/                     ✅
├── passport/                    ✅
└── ...
```

---

## 🔧 技術實作建議

### 1. DiaryRepository 參考實作

```typescript
// src/app/core/infra/repositories/diary/diary.repository.ts
import { Injectable, inject } from '@angular/core';
import { Observable, from, map } from 'rxjs';
import { SupabaseService } from '@core/supabase';

export interface Diary {
  id: string;
  blueprint_id: string;
  work_date: string;
  weather: string | null;
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
}

@Injectable({ providedIn: 'root' })
export class DiaryRepository {
  private readonly supabase = inject(SupabaseService);

  findByBlueprint(blueprintId: string): Observable<Diary[]> {
    return from(
      this.supabase.client
        .from('diaries')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null)
        .order('work_date', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as Diary[];
      })
    );
  }

  findByDate(blueprintId: string, date: string): Observable<Diary | null> {
    return from(
      this.supabase.client
        .from('diaries')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .eq('work_date', date)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) return null;
        return data as Diary;
      })
    );
  }

  create(diary: Partial<Diary>): Observable<Diary | null> {
    return from(
      this.supabase.client
        .from('diaries')
        .insert(diary)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] create error:', error);
          return null;
        }
        return data as Diary;
      })
    );
  }

  update(id: string, updates: Partial<Diary>): Observable<Diary | null> {
    return from(
      this.supabase.client
        .from('diaries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] update error:', error);
          return null;
        }
        return data as Diary;
      })
    );
  }
}
```

### 2. DiaryService 參考實作

```typescript
// src/app/shared/services/diary/diary.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { DiaryRepository, Diary } from '@core';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DiaryService {
  private readonly repo = inject(DiaryRepository);

  // State signals
  private diariesState = signal<Diary[]>([]);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Readonly signals
  readonly diaries = this.diariesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // Computed signals
  readonly diaryCount = computed(() => this.diariesState().length);
  readonly hasError = computed(() => this.errorState() !== null);

  async loadDiaries(blueprintId: string): Promise<Diary[]> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const diaries = await firstValueFrom(this.repo.findByBlueprint(blueprintId));
      this.diariesState.set(diaries);
      return diaries;
    } catch (err) {
      const message = err instanceof Error ? err.message : '載入日誌失敗';
      this.errorState.set(message);
      throw err;
    } finally {
      this.loadingState.set(false);
    }
  }

  async createDiary(diary: Partial<Diary>): Promise<Diary | null> {
    const newDiary = await firstValueFrom(this.repo.create(diary));
    if (newDiary) {
      this.diariesState.update(list => [newDiary, ...list]);
    }
    return newDiary;
  }

  async updateDiary(id: string, updates: Partial<Diary>): Promise<Diary | null> {
    const updated = await firstValueFrom(this.repo.update(id, updates));
    if (updated) {
      this.diariesState.update(list =>
        list.map(d => d.id === id ? updated : d)
      );
    }
    return updated;
  }
}
```

---

## 📝 立即行動清單

### 本週 (Week 1) - 日誌模組基礎建設

- [ ] **建立 DiaryRepository**
  ```bash
  # 建立目錄和檔案
  mkdir -p src/app/core/infra/repositories/diary
  touch src/app/core/infra/repositories/diary/diary.repository.ts
  touch src/app/core/infra/repositories/diary/index.ts
  ```
- [ ] **建立 DiaryService**
  ```bash
  mkdir -p src/app/shared/services/diary
  touch src/app/shared/services/diary/diary.service.ts
  touch src/app/shared/services/diary/index.ts
  ```
- [ ] **更新 core/index.ts** 導出 DiaryRepository
- [ ] **更新 shared/index.ts** 導出 DiaryService

### 下週 (Week 2) - 日誌模組 UI

- [ ] **建立日誌路由頁面**
  ```bash
  mkdir -p src/app/routes/blueprint/diary
  touch src/app/routes/blueprint/diary/diary-list.component.ts
  touch src/app/routes/blueprint/diary/diary-form.component.ts
  touch src/app/routes/blueprint/diary/routes.ts
  ```
- [ ] **更新藍圖路由** - 加入日誌模組路由
- [ ] **建立天氣選擇器元件** - 使用 `weather_type` 枚舉
- [ ] **日誌附件功能** - 整合 `diary_attachments` 表

### 第三週 (Week 3) - 檔案管理模組

- [ ] **配置 Supabase Storage** - 建立 bucket 和權限
- [ ] **建立 FileRepository** 資料存取層
- [ ] **建立 FileService** 業務邏輯
- [ ] **建立檔案上傳元件** - 拖拉上傳
- [ ] **整合到日誌附件** - 照片上傳功能

### 第四週 (Week 4) - 清理和優化

- [ ] **清理 TaskService mock 程式碼** - 移除已棄用方法
- [ ] **任務附件功能** - 整合 FileService
- [ ] **權限控制強化** - PermissionDirective
- [ ] **測試和文件更新**

---

## 🔄 版本狀態

### 當前版本

| 套件 | 版本 | 狀態 |
|------|------|------|
| @angular/core | 20.3.0 | ✅ 最新 |
| @delon/abc | 20.1.0 | ✅ 最新 |
| ng-zorro-antd | 20.4.3 | ✅ 最新 |
| @supabase/supabase-js | 2.86.0 | ✅ 最新 |
| TypeScript | 5.9.2 | ✅ 最新 |

### Angular 20 特性使用情況

| 特性 | 使用狀態 | 檔案範例 |
|------|---------|---------|
| `signal()`, `computed()` | ✅ 廣泛使用 | TaskService, BlueprintService |
| `linkedSignal()` | ✅ 已使用 | TaskService.selectedTask |
| `inject()` 函數 | ✅ 標準使用 | 所有 Service 和 Repository |
| `input()`, `output()` | ✅ 部分使用 | TaskEditDrawerComponent |
| `@if`, `@for`, `@switch` | ✅ 標準使用 | 所有 Component 模板 |
| `toSignal()`, `toObservable()` | 🔶 部分使用 | 可擴展使用 |

---

## 📚 相關文件

- [系統架構](GigHub_Architecture.md)
- [功能文件](features/README.md)
- [產品需求](prd/construction-site-management.md)
- [Supabase Schema](../seed.sql)
- [Angular 官方文檔](https://angular.dev)
- [ng-alain 文檔](https://ng-alain.com)
- [ng-zorro-antd 文檔](https://ng.ant.design)
- [Supabase 文檔](https://supabase.com/docs)

---

## 🎯 總結

基於專案最新分析，**建議的開發順序**為：

1. **📌 施工日誌模組** (最高優先) 
   - 核心業務需求
   - 資料庫結構已就緒
   - 可參考 TaskModule 架構

2. **📌 檔案管理模組** (高優先)
   - 支援日誌和任務附件
   - Supabase Storage 整合

3. **📌 任務模組完善** (高優先)
   - 清理 mock 程式碼
   - 附件和評論功能

4. **📌 權限控制完善** (中優先)
   - PermissionDirective
   - 細粒度存取控制

5. **其他模組** - 按需開發

### 🚀 立即開始的第一步

```bash
# 1. 建立 DiaryRepository
mkdir -p src/app/core/infra/repositories/diary

# 2. 建立 DiaryService  
mkdir -p src/app/shared/services/diary

# 3. 建立日誌頁面路由
mkdir -p src/app/routes/blueprint/diary
```

---

**最後更新**: 2025-12-03
**分析基準**: 專案最新程式碼狀態
