/**
 * Timeline Repository
 *
 * 時間軸資料存取層 - 跨模組活動追蹤
 * Cross-module activity tracking data access layer
 *
 * Features:
 * - Temporal ordering of events
 * - Cross-module event aggregation
 * - Efficient time-range queries
 * - Realtime subscription support
 *
 * @module core/infra/repositories/timeline
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map, of, Subject } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { LoggerService } from '../../../logger';
import {
  Activity,
  ActivityWithActor,
  LogActivityRequest,
  ActivityQueryOptions,
  ActivityPageResult,
  ActivityType,
  TimelineEntityType
} from '../../types/timeline';

@Injectable({ providedIn: 'root' })
export class TimelineRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // Realtime subscription subject
  private readonly activitySubject = new Subject<Activity>();
  readonly activity$ = this.activitySubject.asObservable();

  // ============================================================================
  // Write Operations
  // ============================================================================

  /**
   * 記錄活動
   * Log an activity to the timeline
   * Uses RPC function to properly map auth.uid() to account_id
   */
  logActivity(request: LogActivityRequest): Observable<Activity | null> {
    return from(
      this.supabase.client.rpc('log_activity', {
        p_blueprint_id: request.blueprint_id,
        p_entity_type: request.entity_type,
        p_entity_id: request.entity_id,
        p_activity_type: request.activity_type,
        p_metadata: request.metadata ?? {},
        p_old_value: request.old_value ?? null,
        p_new_value: request.new_value ?? null
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TimelineRepository] logActivity error:', error);
          return null;
        }
        // RPC returns the activity ID, fetch the full activity record
        if (data) {
          return { id: data as string } as Activity;
        }
        return null;
      })
    );
  }

  /**
   * 使用資料庫函數記錄活動
   * Log activity using database function (for triggers)
   */
  logActivityViaRPC(
    blueprintId: string,
    entityType: TimelineEntityType,
    entityId: string,
    activityType: ActivityType,
    metadata: Record<string, unknown> = {},
    oldValue: Record<string, unknown> | null = null,
    newValue: Record<string, unknown> | null = null
  ): Observable<string | null> {
    return from(
      this.supabase.client.rpc('log_activity', {
        p_blueprint_id: blueprintId,
        p_entity_type: entityType,
        p_entity_id: entityId,
        p_activity_type: activityType,
        p_metadata: metadata,
        p_old_value: oldValue,
        p_new_value: newValue
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TimelineRepository] logActivityViaRPC error:', error);
          return null;
        }
        return data as string;
      })
    );
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * 查詢活動
   * Query activities with filters
   */
  query(options: ActivityQueryOptions): Observable<ActivityPageResult> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;
    const includeActor = options.includeActor ?? false;

    let query = this.supabase.client
      .from('activities')
      .select(includeActor ? '*, actor:accounts!activities_actor_id_fkey(id, name, avatar_url)' : '*', {
        count: 'exact'
      });

    // Apply filters
    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }
    if (options.entityType) {
      if (Array.isArray(options.entityType)) {
        query = query.in('entity_type', options.entityType);
      } else {
        query = query.eq('entity_type', options.entityType);
      }
    }
    if (options.entityId) {
      query = query.eq('entity_id', options.entityId);
    }
    if (options.activityType) {
      if (Array.isArray(options.activityType)) {
        query = query.in('activity_type', options.activityType);
      } else {
        query = query.eq('activity_type', options.activityType);
      }
    }
    if (options.actorId) {
      query = query.eq('actor_id', options.actorId);
    }
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    // Apply sorting
    const orderDirection = options.orderDirection ?? 'desc';
    query = query.order('created_at', { ascending: orderDirection === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    return from(query).pipe(
      map(({ data, count, error }) => {
        if (error) {
          this.logger.error('[TimelineRepository] query error:', error);
          return {
            data: [],
            total: 0,
            hasMore: false
          };
        }
        const total = count ?? 0;
        return {
          data: (data || []) as unknown as Array<Activity | ActivityWithActor>,
          total,
          hasMore: offset + limit < total
        };
      })
    );
  }

  /**
   * 根據 ID 查詢活動
   * Find activity by ID
   */
  findById(id: string, includeActor = false): Observable<Activity | ActivityWithActor | null> {
    return from(
      this.supabase.client
        .from('activities')
        .select(includeActor ? '*, actor:accounts!activities_actor_id_fkey(id, name, avatar_url)' : '*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          this.logger.error('[TimelineRepository] findById error:', error);
          return null;
        }
        return data as unknown as Activity | ActivityWithActor;
      })
    );
  }

  /**
   * 取得藍圖的活動時間軸
   * Get blueprint activity timeline
   */
  findByBlueprint(
    blueprintId: string,
    options: {
      limit?: number;
      offset?: number;
      entityType?: TimelineEntityType | TimelineEntityType[];
      includeActor?: boolean;
    } = {}
  ): Observable<Array<Activity | ActivityWithActor>> {
    const { limit = 50, offset = 0, entityType, includeActor = false } = options;

    let query = this.supabase.client
      .from('activities')
      .select(includeActor ? '*, actor:accounts!activities_actor_id_fkey(id, name, avatar_url)' : '*')
      .eq('blueprint_id', blueprintId)
      .order('created_at', { ascending: false });

    if (entityType) {
      if (Array.isArray(entityType)) {
        query = query.in('entity_type', entityType);
      } else {
        query = query.eq('entity_type', entityType);
      }
    }

    query = query.range(offset, offset + limit - 1);

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TimelineRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as unknown as Array<Activity | ActivityWithActor>;
      })
    );
  }

  /**
   * 取得實體的活動歷史
   * Get entity activity history
   */
  getEntityHistory(
    entityType: TimelineEntityType,
    entityId: string,
    options: { limit?: number; includeActor?: boolean } = {}
  ): Observable<Array<Activity | ActivityWithActor>> {
    const { limit = 50, includeActor = false } = options;

    return from(
      this.supabase.client
        .from('activities')
        .select(includeActor ? '*, actor:accounts!activities_actor_id_fkey(id, name, avatar_url)' : '*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TimelineRepository] getEntityHistory error:', error);
          return [];
        }
        return (data || []) as unknown as Array<Activity | ActivityWithActor>;
      })
    );
  }

  /**
   * 取得操作者的活動記錄
   * Get actor activity records
   */
  getActorHistory(actorId: string, options: { limit?: number; blueprintId?: string } = {}): Observable<Activity[]> {
    const { limit = 50, blueprintId } = options;

    let query = this.supabase.client
      .from('activities')
      .select('*')
      .eq('actor_id', actorId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (blueprintId) {
      query = query.eq('blueprint_id', blueprintId);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TimelineRepository] getActorHistory error:', error);
          return [];
        }
        return (data || []) as Activity[];
      })
    );
  }

  // ============================================================================
  // Realtime Subscription
  // ============================================================================

  /**
   * 訂閱藍圖的活動
   * Subscribe to blueprint activities in realtime
   */
  subscribeToBlueprint(blueprintId: string): void {
    this.supabase.client
      .channel(`activities:blueprint:${blueprintId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activities',
          filter: `blueprint_id=eq.${blueprintId}`
        },
        payload => {
          this.activitySubject.next(payload.new as Activity);
        }
      )
      .subscribe();
  }

  /**
   * 取消訂閱藍圖的活動
   * Unsubscribe from blueprint activities
   */
  unsubscribeFromBlueprint(blueprintId: string): void {
    this.supabase.client.channel(`activities:blueprint:${blueprintId}`).unsubscribe();
  }

  // ============================================================================
  // Aggregation Operations
  // ============================================================================

  /**
   * 取得活動統計
   * Get activity statistics
   */
  getActivityStats(
    blueprintId: string,
    options: { startDate?: string; endDate?: string } = {}
  ): Observable<{
    total: number;
    byType: Record<ActivityType, number>;
    byEntityType: Record<TimelineEntityType, number>;
    byDate: Array<{ date: string; count: number }>;
  }> {
    let query = this.supabase.client.from('activities').select('*').eq('blueprint_id', blueprintId);

    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    return from(query.limit(5000)).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[TimelineRepository] getActivityStats error:', error);
          return {
            total: 0,
            byType: {} as Record<ActivityType, number>,
            byEntityType: {} as Record<TimelineEntityType, number>,
            byDate: []
          };
        }

        const activities = (data || []) as Activity[];
        const byType: Record<ActivityType, number> = {} as Record<ActivityType, number>;
        const byEntityType: Record<TimelineEntityType, number> = {} as Record<TimelineEntityType, number>;
        const byDate = new Map<string, number>();

        for (const activity of activities) {
          byType[activity.activity_type] = (byType[activity.activity_type] || 0) + 1;
          byEntityType[activity.entity_type] = (byEntityType[activity.entity_type] || 0) + 1;

          const date = activity.created_at.split('T')[0];
          byDate.set(date, (byDate.get(date) || 0) + 1);
        }

        const byDateArray = Array.from(byDate.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));

        return {
          total: activities.length,
          byType,
          byEntityType,
          byDate: byDateArray
        };
      })
    );
  }
}
