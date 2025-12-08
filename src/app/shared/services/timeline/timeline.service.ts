/**
 * Timeline Service
 *
 * 時間軸服務 - 跨模組活動追蹤
 * Cross-module activity tracking service with Signals
 *
 * Features:
 * - Temporal event ordering
 * - Cross-module aggregation
 * - Real-time subscription
 * - Timeline visualization support
 *
 * @module shared/services/timeline
 */

import { Injectable, inject, computed, signal, DestroyRef } from '@angular/core';
import { LoggerService } from '../../../core/logger/logger.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '@delon/theme';
import { formatDistanceToNow, format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Observable, catchError, of, tap, Subject, map } from 'rxjs';

import { TimelineRepository } from '../../../core/infra/repositories/timeline';
import {
  Activity,
  ActivityWithActor,
  LogActivityRequest,
  ActivityQueryOptions,
  ActivityType,
  TimelineEntityType,
  TimelineItem,
  ActivityMetadata,
  ACTIVITY_TYPE_CONFIG,
  TIMELINE_ENTITY_TYPE_CONFIG,
  activityToTimelineItem,
  groupTimelineByDate
} from '../../../core/infra/types/timeline';

/**
 * 時間軸狀態
 */
interface TimelineState {
  activities: Array<Activity | ActivityWithActor>;
  selectedActivity: Activity | ActivityWithActor | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  currentBlueprintId: string | null;
  filters: ActivityQueryOptions;
}

const initialState: TimelineState = {
  activities: [],
  selectedActivity: null,
  loading: false,
  error: null,
  hasMore: false,
  total: 0,
  currentBlueprintId: null,
  filters: {}
};

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private readonly repository = inject(TimelineRepository);
  private readonly logger = inject(LoggerService);
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // State Management (Signals)
  // ============================================================================

  private readonly _state = signal<TimelineState>(initialState);

  // Public computed signals
  readonly activities = computed(() => this._state().activities);
  readonly selectedActivity = computed(() => this._state().selectedActivity);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly hasMore = computed(() => this._state().hasMore);
  readonly total = computed(() => this._state().total);
  readonly isEmpty = computed(() => this._state().activities.length === 0);
  readonly filters = computed(() => this._state().filters);

  // Derived computed signals
  readonly timelineItems = computed(() => this.activities().map(a => this.toTimelineItem(a)));

  readonly timelineGroups = computed(() => groupTimelineByDate(this.timelineItems(), this.formatDate.bind(this)));

  // Real-time activity stream
  readonly realtimeActivity$ = this.repository.activity$;

  // Event subjects
  private readonly _activityLogged = new Subject<Activity>();
  readonly activityLogged$ = this._activityLogged.asObservable();

  constructor() {
    // Subscribe to realtime updates
    this.repository.activity$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(activity => {
      // Add new activity to the beginning of the list
      this._state.update(state => ({
        ...state,
        activities: [activity, ...state.activities],
        total: state.total + 1
      }));
      this._activityLogged.next(activity);
    });
  }

  // ============================================================================
  // Logging Operations
  // ============================================================================

  /**
   * 記錄活動
   * Log an activity
   */
  logActivity(request: LogActivityRequest): Observable<Activity | null> {
    return this.repository.logActivity(request).pipe(
      tap(activity => {
        if (activity) {
          this._activityLogged.next(activity);
        }
      }),
      catchError(error => {
        this.logger.error('TimelineService', 'Failed to log activity', error, { request });
        return of(null);
      })
    );
  }

  /**
   * 快速記錄活動
   * Quick log activity
   */
  quickLog(
    blueprintId: string,
    entityType: TimelineEntityType,
    entityId: string,
    activityType: ActivityType,
    options: {
      entityName?: string;
      description?: string;
      oldValue?: Record<string, unknown>;
      newValue?: Record<string, unknown>;
      relatedEntities?: Array<{ type: TimelineEntityType; id: string; name?: string }>;
      tags?: string[];
    } = {}
  ): Observable<Activity | null> {
    const user = this.settings.user;
    const metadata: ActivityMetadata = {
      entity_name: options.entityName,
      actor_name: user?.['name'],
      description: options.description,
      related_entities: options.relatedEntities,
      tags: options.tags
    };

    return this.logActivity({
      blueprint_id: blueprintId,
      entity_type: entityType,
      entity_id: entityId,
      activity_type: activityType,
      metadata,
      old_value: options.oldValue,
      new_value: options.newValue
    });
  }

  /**
   * 使用 RPC 記錄活動
   * Log activity via RPC
   */
  logViaRPC(
    blueprintId: string,
    entityType: TimelineEntityType,
    entityId: string,
    activityType: ActivityType,
    metadata: Record<string, unknown> = {},
    oldValue: Record<string, unknown> | null = null,
    newValue: Record<string, unknown> | null = null
  ): Observable<string | null> {
    return this.repository.logActivityViaRPC(blueprintId, entityType, entityId, activityType, metadata, oldValue, newValue);
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * 載入活動
   * Load activities with filters
   */
  loadActivities(options: ActivityQueryOptions = {}): void {
    this.updateState({ loading: true, error: null, filters: options });

    this.repository
      .query({ ...options, includeActor: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.updateState({
            activities: result.data,
            total: result.total,
            hasMore: result.hasMore,
            loading: false
          });
        },
        error: error => {
          this.logger.error('TimelineService', 'Failed to load activities', error, { options });
          this.updateState({
            error: 'Failed to load activities',
            loading: false
          });
        }
      });
  }

  /**
   * 載入藍圖的活動
   * Load blueprint activities
   */
  loadByBlueprint(blueprintId: string, options: { limit?: number; entityType?: TimelineEntityType | TimelineEntityType[] } = {}): void {
    this.updateState({
      loading: true,
      error: null,
      currentBlueprintId: blueprintId,
      filters: { blueprintId, ...options }
    });

    this.repository
      .findByBlueprint(blueprintId, { ...options, includeActor: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: activities => {
          this.updateState({
            activities,
            loading: false
          });
        },
        error: error => {
          this.logger.error('TimelineService', 'Failed to load activities by blueprint', error, { blueprintId, options });
          this.updateState({
            error: 'Failed to load blueprint activities',
            loading: false
          });
        }
      });
  }

  /**
   * 載入更多活動
   * Load more activities
   */
  loadMore(): void {
    if (!this._state().hasMore) return;

    const { filters, activities } = this._state();
    const newOffset = activities.length;

    this.repository
      .query({ ...filters, offset: newOffset, includeActor: true })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.updateState({
            activities: [...activities, ...result.data],
            hasMore: result.hasMore,
            total: result.total
          });
        },
        error: error => {
          this.logger.error('TimelineService', 'Failed to load more activities', error);
        }
      });
  }

  /**
   * 重新載入活動
   * Reload activities
   */
  reload(): void {
    this.loadActivities(this._state().filters);
  }

  /**
   * 取得實體的活動歷史
   * Get entity activity history
   */
  getEntityHistory(entityType: TimelineEntityType, entityId: string, options: { limit?: number } = {}): Observable<TimelineItem[]> {
    return this.repository
      .getEntityHistory(entityType, entityId, options)
      .pipe(map(activities => activities.map(a => this.toTimelineItem(a))));
  }

  /**
   * 取得操作者的活動記錄
   * Get actor activity records
   */
  getActorHistory(actorId: string, options: { limit?: number; blueprintId?: string } = {}): Observable<Activity[]> {
    return this.repository.getActorHistory(actorId, options);
  }

  // ============================================================================
  // Realtime Subscription
  // ============================================================================

  /**
   * 訂閱藍圖活動
   * Subscribe to blueprint activities
   */
  subscribeToBlueprintActivities(blueprintId: string): void {
    this.repository.subscribeToBlueprint(blueprintId);
    this.updateState({ currentBlueprintId: blueprintId });
  }

  /**
   * 取消訂閱藍圖活動
   * Unsubscribe from blueprint activities
   */
  unsubscribeFromBlueprintActivities(): void {
    const blueprintId = this._state().currentBlueprintId;
    if (blueprintId) {
      this.repository.unsubscribeFromBlueprint(blueprintId);
      this.updateState({ currentBlueprintId: null });
    }
  }

  // ============================================================================
  // Statistics Operations
  // ============================================================================

  /**
   * 取得活動統計
   * Get activity statistics
   */
  getStats(
    blueprintId: string,
    options: { startDate?: string; endDate?: string } = {}
  ): Observable<{
    total: number;
    byType: Record<ActivityType, number>;
    byEntityType: Record<TimelineEntityType, number>;
    byDate: Array<{ date: string; count: number }>;
  }> {
    return this.repository.getActivityStats(blueprintId, options);
  }

  // ============================================================================
  // Selection & State
  // ============================================================================

  /**
   * 選擇活動
   * Select an activity
   */
  selectActivity(activity: Activity | ActivityWithActor | null): void {
    this.updateState({ selectedActivity: activity });
  }

  /**
   * 清除選擇
   * Clear selection
   */
  clearSelection(): void {
    this.updateState({ selectedActivity: null });
  }

  /**
   * 更新篩選條件
   * Update filters
   */
  updateFilters(filters: Partial<ActivityQueryOptions>): void {
    const currentFilters = this._state().filters;
    this.loadActivities({ ...currentFilters, ...filters });
  }

  /**
   * 清除篩選條件
   * Clear filters
   */
  clearFilters(): void {
    this.loadActivities({});
  }

  /**
   * 重置狀態
   * Reset state
   */
  reset(): void {
    this.unsubscribeFromBlueprintActivities();
    this._state.set(initialState);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * 取得活動類型配置
   * Get activity type configuration
   */
  getActivityTypeConfig(type: ActivityType) {
    return ACTIVITY_TYPE_CONFIG[type];
  }

  /**
   * 取得實體類型配置
   * Get entity type configuration
   */
  getEntityTypeConfig(type: TimelineEntityType) {
    return TIMELINE_ENTITY_TYPE_CONFIG[type];
  }

  /**
   * 將活動轉換為時間軸項目
   * Convert activity to timeline item
   */
  private toTimelineItem(activity: Activity | ActivityWithActor): TimelineItem {
    return activityToTimelineItem(activity, this.formatTime.bind(this));
  }

  /**
   * 格式化時間
   * Format time
   */
  private formatTime(timestamp: string): string {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: zhTW });
    } catch {
      return timestamp;
    }
  }

  /**
   * 格式化日期
   * Format date
   */
  private formatDate(date: string): string {
    try {
      return format(new Date(date), 'yyyy年MM月dd日 (EEEE)', { locale: zhTW });
    } catch {
      return date;
    }
  }

  /**
   * 更新狀態
   * Update state
   */
  private updateState(partial: Partial<TimelineState>): void {
    this._state.update(state => ({ ...state, ...partial }));
  }
}
