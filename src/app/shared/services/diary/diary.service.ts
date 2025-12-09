/**
 * Diary Service
 *
 * 施工日誌服務 - 現場證據紀錄系統
 * Construction diary service with Signals
 *
 * Features:
 * - Daily work logging
 * - Approval workflow management
 * - Statistics and reporting
 * - Attachment management
 *
 * @module shared/services/diary
 */

import { Injectable, inject, computed, signal, DestroyRef } from '@angular/core';
import { LoggerService } from '../../../core/logger/logger.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '@delon/theme';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { Observable, catchError, of, tap, Subject, switchMap } from 'rxjs';

import { DiaryRepository } from '../../../core/infra/repositories/diary';
import {
  Diary,
  DiaryWithDetails,
  DiaryAttachment,
  CreateDiaryRequest,
  UpdateDiaryRequest,
  AddDiaryAttachmentRequest,
  DiaryQueryOptions,
  DiaryStats,
  MonthlyDiarySummary,
  DiaryStatus,
  WeatherType,
  DIARY_STATUS_CONFIG,
  WEATHER_TYPE_CONFIG
} from '../../../core/infra/types/diary';
import { AuditLogService } from '../audit-log';
import { TimelineService } from '../timeline';

/**
 * 日誌日曆項目
 */
export interface DiaryCalendarItem {
  date: string;
  diary: Diary | null;
  hasData: boolean;
  isToday: boolean;
  isWeekend: boolean;
}

/**
 * 日誌狀態
 */
interface DiaryState {
  diaries: Array<Diary | DiaryWithDetails>;
  selectedDiary: DiaryWithDetails | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: DiaryQueryOptions;
  stats: DiaryStats | null;
  currentBlueprintId: string | null;
  calendarMonth: string | null;
  calendarItems: DiaryCalendarItem[];
}

const initialState: DiaryState = {
  diaries: [],
  selectedDiary: null,
  loading: false,
  saving: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  },
  filters: {},
  stats: null,
  currentBlueprintId: null,
  calendarMonth: null,
  calendarItems: []
};

@Injectable({ providedIn: 'root' })
export class DiaryService {
  private readonly repository = inject(DiaryRepository);
  private readonly logger = inject(LoggerService);
  private readonly timelineService = inject(TimelineService);
  private readonly auditLogService = inject(AuditLogService);
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // State Management (Signals)
  // ============================================================================

  private readonly _state = signal<DiaryState>(initialState);

  // Public computed signals
  readonly diaries = computed(() => this._state().diaries);
  readonly selectedDiary = computed(() => this._state().selectedDiary);
  readonly loading = computed(() => this._state().loading);
  readonly saving = computed(() => this._state().saving);
  readonly error = computed(() => this._state().error);
  readonly pagination = computed(() => this._state().pagination);
  readonly filters = computed(() => this._state().filters);
  readonly stats = computed(() => this._state().stats);
  readonly isEmpty = computed(() => this._state().diaries.length === 0);
  readonly calendarItems = computed(() => this._state().calendarItems);

  // Derived computed signals
  readonly draftDiaries = computed(() => this.diaries().filter(d => d.status === 'draft'));

  readonly submittedDiaries = computed(() => this.diaries().filter(d => d.status === 'submitted'));

  readonly approvedDiaries = computed(() => this.diaries().filter(d => d.status === 'approved'));

  // Event subjects
  private readonly _diaryCreated = new Subject<Diary>();
  readonly diaryCreated$ = this._diaryCreated.asObservable();

  private readonly _diaryUpdated = new Subject<Diary>();
  readonly diaryUpdated$ = this._diaryUpdated.asObservable();

  private readonly _diaryApproved = new Subject<Diary>();
  readonly diaryApproved$ = this._diaryApproved.asObservable();

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * 建立日誌
   * Create a new diary
   */
  create(request: CreateDiaryRequest): Observable<Diary | null> {
    this.updateState({ saving: true, error: null });

    return this.repository.create(request).pipe(
      tap(diary => {
        if (diary) {
          this._diaryCreated.next(diary);

          // Log activity
          this.timelineService
            .quickLog(request.blueprint_id, 'diary', diary.id, 'create', {
              entityName: `日誌 - ${request.work_date}`,
              description: `建立施工日誌 (${request.work_date})`
            })
            .subscribe();

          // Audit log
          this.auditLogService
            .quickLog('diary', diary.id, 'create', {
              entityName: `日誌 - ${request.work_date}`,
              blueprintId: request.blueprint_id,
              newValue: diary as unknown as Record<string, unknown>
            })
            .subscribe();
        }
        this.updateState({ saving: false });
      }),
      catchError(error => {
        this.logger.error('DiaryService', 'Failed to create diary', error, { request });
        this.updateState({ saving: false, error: 'Failed to create diary' });
        return of(null);
      })
    );
  }

  /**
   * 更新日誌
   * Update diary
   */
  update(id: string, request: UpdateDiaryRequest): Observable<Diary | null> {
    this.updateState({ saving: true, error: null });

    const oldDiary = this._state().selectedDiary;

    return this.repository.update(id, request).pipe(
      tap(diary => {
        if (diary) {
          this._diaryUpdated.next(diary);

          // Update list if present
          this._state.update(state => ({
            ...state,
            diaries: state.diaries.map(d => (d.id === id ? diary : d)),
            selectedDiary: state.selectedDiary?.id === id ? { ...state.selectedDiary, ...diary } : state.selectedDiary,
            saving: false
          }));

          // Log activity
          if (this._state().currentBlueprintId) {
            this.timelineService
              .quickLog(this._state().currentBlueprintId!, 'diary', diary.id, 'update', {
                entityName: `日誌 - ${diary.work_date}`,
                description: '更新施工日誌',
                oldValue: oldDiary as unknown as Record<string, unknown>,
                newValue: diary as unknown as Record<string, unknown>
              })
              .subscribe();
          }

          // Audit log
          this.auditLogService
            .logChanges(
              'diary',
              diary.id,
              'update',
              oldDiary as unknown as Record<string, unknown>,
              diary as unknown as Record<string, unknown>,
              {
                entityName: `日誌 - ${diary.work_date}`,
                blueprintId: diary.blueprint_id
              }
            )
            .subscribe();
        } else {
          this.updateState({ saving: false });
        }
      }),
      catchError(error => {
        this.logger.error('DiaryService', 'Failed to update diary', error, { id, request });
        this.updateState({ saving: false, error: 'Failed to update diary' });
        return of(null);
      })
    );
  }

  /**
   * 刪除日誌
   * Delete diary
   */
  delete(id: string): Observable<boolean> {
    return this.repository.delete(id).pipe(
      tap(success => {
        if (success) {
          this._state.update(state => ({
            ...state,
            diaries: state.diaries.filter(d => d.id !== id),
            selectedDiary: state.selectedDiary?.id === id ? null : state.selectedDiary
          }));

          // Audit log
          this.auditLogService.quickLog('diary', id, 'delete').subscribe();
        }
      }),
      catchError(error => {
        this.logger.error('DiaryService', 'Failed to delete diary', error, { id });
        return of(false);
      })
    );
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * 載入日誌列表
   * Load diaries with filters
   */
  loadDiaries(options: DiaryQueryOptions = {}): void {
    this.updateState({ loading: true, error: null, filters: options });

    this.repository
      .query({ ...options, includeDetails: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.updateState({
            diaries: result.data,
            pagination: {
              page: result.page,
              pageSize: result.pageSize,
              total: result.total,
              totalPages: result.totalPages
            },
            loading: false
          });
        },
        error: error => {
          this.logger.error('DiaryService', 'Failed to load diaries', error, { options });
          this.updateState({
            error: 'Failed to load diaries',
            loading: false
          });
        }
      });
  }

  /**
   * 載入藍圖的日誌
   * Load diaries by blueprint
   */
  loadByBlueprint(blueprintId: string, options: { limit?: number; status?: DiaryStatus } = {}): void {
    this.updateState({
      loading: true,
      error: null,
      currentBlueprintId: blueprintId,
      filters: { blueprintId, ...options }
    });

    this.repository
      .findByBlueprint(blueprintId, options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: diaries => {
          this.updateState({
            diaries,
            loading: false
          });
        },
        error: error => {
          this.logger.error('DiaryService', 'Failed to load diaries by blueprint', error, { blueprintId, options });
          this.updateState({
            error: 'Failed to load diaries',
            loading: false
          });
        }
      });
  }

  /**
   * 根據 ID 載入日誌
   * Load diary by ID
   */
  loadById(id: string): void {
    this.updateState({ loading: true, error: null });

    this.repository
      .findById(id, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: diary => {
          this.updateState({
            selectedDiary: diary as DiaryWithDetails,
            loading: false
          });
        },
        error: error => {
          this.logger.error('DiaryService', 'Failed to load diary by ID', error, { id });
          this.updateState({
            error: 'Failed to load diary',
            loading: false
          });
        }
      });
  }

  /**
   * 根據日期載入日誌
   * Load diary by date
   */
  loadByDate(blueprintId: string, workDate: string): void {
    this.updateState({ loading: true, error: null });

    this.repository
      .findByDate(blueprintId, workDate)
      .pipe(
        switchMap(diary => {
          if (diary) {
            return this.repository.findById(diary.id, true);
          }
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: diary => {
          this.updateState({
            selectedDiary: diary as DiaryWithDetails,
            loading: false
          });
        },
        error: error => {
          this.logger.error('DiaryService', 'Failed to load diary by date', error, { date });
          this.updateState({
            error: 'Failed to load diary',
            loading: false
          });
        }
      });
  }

  /**
   * 載入更多日誌
   * Load more diaries
   */
  loadMore(): void {
    const { pagination, filters } = this._state();
    if (pagination.page >= pagination.totalPages) return;

    this.loadDiaries({
      ...filters,
      offset: pagination.page * pagination.pageSize
    });
  }

  /**
   * 重新載入日誌
   * Reload diaries
   */
  reload(): void {
    this.loadDiaries(this._state().filters);
  }

  // ============================================================================
  // Approval Workflow
  // ============================================================================

  /**
   * 提交日誌
   * Submit diary for approval
   */
  submit(id: string): Observable<Diary | null> {
    this.updateState({ saving: true, error: null });

    return this.repository.submit(id).pipe(
      tap(diary => {
        if (diary) {
          this._diaryUpdated.next(diary);
          this.updateState({
            diaries: this._state().diaries.map(d => (d.id === id ? diary : d)),
            selectedDiary:
              this._state().selectedDiary?.id === id ? { ...this._state().selectedDiary, ...diary } : this._state().selectedDiary,
            saving: false
          });

          // Log activity
          if (this._state().currentBlueprintId) {
            this.timelineService
              .quickLog(this._state().currentBlueprintId!, 'diary', diary.id, 'status_change', {
                entityName: `日誌 - ${diary.work_date}`,
                description: '提交日誌待核准'
              })
              .subscribe();
          }

          // Audit log
          this.auditLogService
            .quickLog('diary', diary.id, 'status_change', {
              entityName: `日誌 - ${diary.work_date}`,
              blueprintId: diary.blueprint_id,
              metadata: { extra: { from_status: 'draft', to_status: 'submitted' } }
            })
            .subscribe();
        } else {
          this.updateState({ saving: false });
        }
      }),
      catchError(error => {
        this.logger.error('DiaryService', 'Failed to submit diary', error, { id });
        this.updateState({ saving: false, error: 'Failed to submit diary' });
        return of(null);
      })
    );
  }

  /**
   * 核准日誌
   * Approve diary
   */
  approve(id: string): Observable<Diary | null> {
    this.updateState({ saving: true, error: null });

    return this.repository.approve(id).pipe(
      tap(diary => {
        if (diary) {
          this._diaryApproved.next(diary);
          this.updateState({
            diaries: this._state().diaries.map(d => (d.id === id ? diary : d)),
            selectedDiary:
              this._state().selectedDiary?.id === id ? { ...this._state().selectedDiary, ...diary } : this._state().selectedDiary,
            saving: false
          });

          // Log activity
          if (this._state().currentBlueprintId) {
            this.timelineService
              .quickLog(this._state().currentBlueprintId!, 'diary', diary.id, 'approval', {
                entityName: `日誌 - ${diary.work_date}`,
                description: '核准施工日誌'
              })
              .subscribe();
          }

          // Audit log
          this.auditLogService
            .quickLog('diary', diary.id, 'approve', {
              entityName: `日誌 - ${diary.work_date}`,
              blueprintId: diary.blueprint_id
            })
            .subscribe();
        } else {
          this.updateState({ saving: false });
        }
      }),
      catchError(error => {
        this.logger.error('DiaryService', 'Failed to approve diary', error, { id });
        this.updateState({ saving: false, error: 'Failed to approve diary' });
        return of(null);
      })
    );
  }

  /**
   * 駁回日誌
   * Reject diary
   */
  reject(id: string, reason?: string): Observable<Diary | null> {
    this.updateState({ saving: true, error: null });

    return this.repository.reject(id, reason).pipe(
      tap(diary => {
        if (diary) {
          this._diaryUpdated.next(diary);
          this.updateState({
            diaries: this._state().diaries.map(d => (d.id === id ? diary : d)),
            selectedDiary:
              this._state().selectedDiary?.id === id ? { ...this._state().selectedDiary, ...diary } : this._state().selectedDiary,
            saving: false
          });

          // Log activity
          if (this._state().currentBlueprintId) {
            this.timelineService
              .quickLog(this._state().currentBlueprintId!, 'diary', diary.id, 'status_change', {
                entityName: `日誌 - ${diary.work_date}`,
                description: `駁回施工日誌: ${reason || '無說明'}`
              })
              .subscribe();
          }

          // Audit log
          this.auditLogService
            .quickLog('diary', diary.id, 'reject', {
              entityName: `日誌 - ${diary.work_date}`,
              blueprintId: diary.blueprint_id,
              metadata: { extra: { reason } }
            })
            .subscribe();
        } else {
          this.updateState({ saving: false });
        }
      }),
      catchError(error => {
        this.logger.error('DiaryService', 'Failed to reject diary', error, { id, reason });
        this.updateState({ saving: false, error: 'Failed to reject diary' });
        return of(null);
      })
    );
  }

  // ============================================================================
  // Attachment Operations
  // ============================================================================

  /**
   * 新增附件
   * Add attachment
   */
  addAttachment(request: AddDiaryAttachmentRequest): Observable<DiaryAttachment | null> {
    return this.repository.addAttachment(request).pipe(
      tap(attachment => {
        if (attachment && this._state().selectedDiary?.id === request.diary_id) {
          this._state.update(state => ({
            ...state,
            selectedDiary: state.selectedDiary
              ? {
                  ...state.selectedDiary,
                  attachments: [...(state.selectedDiary.attachments || []), attachment]
                }
              : null
          }));

          // Log activity
          if (this._state().currentBlueprintId) {
            this.timelineService
              .quickLog(this._state().currentBlueprintId!, 'diary', request.diary_id, 'attachment', {
                description: `上傳附件: ${request.file_name}`
              })
              .subscribe();
          }
        }
      }),
      catchError(error => {
        this.logger.error('DiaryService', 'Failed to add attachment', error, { diaryId, file });
        return of(null);
      })
    );
  }

  /**
   * 取得附件列表
   * Get attachments
   */
  getAttachments(diaryId: string): Observable<DiaryAttachment[]> {
    return this.repository.getAttachments(diaryId);
  }

  /**
   * 刪除附件
   * Delete attachment
   */
  deleteAttachment(id: string): Observable<boolean> {
    return this.repository.deleteAttachment(id).pipe(
      tap(success => {
        if (success && this._state().selectedDiary) {
          this._state.update(state => ({
            ...state,
            selectedDiary: state.selectedDiary
              ? {
                  ...state.selectedDiary,
                  attachments: (state.selectedDiary.attachments || []).filter(a => a.id !== id)
                }
              : null
          }));
        }
      }),
      catchError(error => {
        this.logger.error('DiaryService', 'Failed to delete attachment', error, { attachmentId });
        return of(false);
      })
    );
  }

  // ============================================================================
  // Statistics & Calendar
  // ============================================================================

  /**
   * 載入統計資料
   * Load statistics
   */
  loadStats(blueprintId: string): void {
    this.repository
      .getStats(blueprintId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: stats => {
          this.updateState({ stats });
        },
        error: error => {
          this.logger.error('DiaryService', 'Failed to load stats', error, { blueprintId, startDate, endDate });
        }
      });
  }

  /**
   * 取得月度摘要
   * Get monthly summary
   */
  getMonthlySummary(blueprintId: string, month: string): Observable<MonthlyDiarySummary> {
    return this.repository.getMonthlySummary(blueprintId, month);
  }

  /**
   * 載入日曆視圖
   * Load calendar view
   */
  loadCalendar(blueprintId: string, month: string): void {
    this.updateState({
      loading: true,
      calendarMonth: month,
      currentBlueprintId: blueprintId
    });

    const startDate = `${month}-01`;
    const endDate = format(endOfMonth(parseISO(startDate)), 'yyyy-MM-dd');

    this.repository
      .query({
        blueprintId,
        startDate,
        endDate,
        orderBy: 'work_date',
        orderDirection: 'asc',
        limit: 31
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          const calendarItems = this.buildCalendarItems(month, result.data);
          this.updateState({
            calendarItems,
            loading: false
          });
        },
        error: error => {
          this.logger.error('DiaryService', 'Failed to load calendar', error, { blueprintId, year, month });
          this.updateState({
            loading: false,
            error: 'Failed to load calendar'
          });
        }
      });
  }

  private buildCalendarItems(month: string, diaries: Diary[]): DiaryCalendarItem[] {
    const startDate = startOfMonth(parseISO(`${month}-01`));
    const endDate = endOfMonth(startDate);
    const today = new Date();

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const diaryMap = new Map(diaries.map(d => [d.work_date, d]));

    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const diary = diaryMap.get(dateStr) || null;
      return {
        date: dateStr,
        diary,
        hasData: !!diary,
        isToday: isSameDay(day, today),
        isWeekend: day.getDay() === 0 || day.getDay() === 6
      };
    });
  }

  // ============================================================================
  // Selection & State
  // ============================================================================

  /**
   * 選擇日誌
   * Select diary
   */
  selectDiary(diary: DiaryWithDetails | null): void {
    this.updateState({ selectedDiary: diary });
  }

  /**
   * 清除選擇
   * Clear selection
   */
  clearSelection(): void {
    this.updateState({ selectedDiary: null });
  }

  /**
   * 更新篩選條件
   * Update filters
   */
  updateFilters(filters: Partial<DiaryQueryOptions>): void {
    const currentFilters = this._state().filters;
    this.loadDiaries({ ...currentFilters, ...filters });
  }

  /**
   * 清除篩選條件
   * Clear filters
   */
  clearFilters(): void {
    this.loadDiaries({});
  }

  /**
   * 重置狀態
   * Reset state
   */
  reset(): void {
    this._state.set(initialState);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * 取得狀態配置
   * Get status configuration
   */
  getStatusConfig(status: DiaryStatus) {
    return DIARY_STATUS_CONFIG[status];
  }

  /**
   * 取得天氣配置
   * Get weather configuration
   */
  getWeatherConfig(weather: WeatherType) {
    return WEATHER_TYPE_CONFIG[weather];
  }

  /**
   * 檢查是否可編輯
   * Check if diary is editable
   */
  canEdit(diary: Diary): boolean {
    return DIARY_STATUS_CONFIG[diary.status].canEdit;
  }

  /**
   * 檢查是否可提交
   * Check if diary can be submitted
   */
  canSubmit(diary: Diary): boolean {
    return DIARY_STATUS_CONFIG[diary.status].canSubmit;
  }

  /**
   * 檢查是否可核准
   * Check if diary can be approved
   */
  canApprove(diary: Diary): boolean {
    return DIARY_STATUS_CONFIG[diary.status].canApprove;
  }

  /**
   * 更新狀態
   * Update state
   */
  private updateState(partial: Partial<DiaryState>): void {
    this._state.update(state => ({ ...state, ...partial }));
  }
}
