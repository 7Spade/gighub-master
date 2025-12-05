/**
 * Audit Log Repository
 *
 * 審計日誌資料存取層 - 企業級不可變日誌存儲
 * Enterprise-grade immutable audit log storage
 *
 * Features:
 * - Append-only storage for immutability
 * - High throughput write operations
 * - Efficient query with multiple filters
 * - Evidence chain preservation
 *
 * @module core/infra/repositories/audit-log
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map, of } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import {
  AuditLog,
  CreateAuditLogRequest,
  AuditLogQueryOptions,
  AuditLogPageResult,
  AuditLogStats,
  AuditEntityType,
  AuditAction,
  AuditSeverity
} from '../../types/audit-log';

@Injectable({ providedIn: 'root' })
export class AuditLogRepository {
  private readonly supabase = inject(SupabaseService);

  // ============================================================================
  // Write Operations (Append-only)
  // ============================================================================

  /**
   * 建立審計日誌記錄 (不可變)
   * Create audit log entry (immutable append-only)
   * Uses RPC function to properly map auth.uid() to account_id
   */
  create(request: CreateAuditLogRequest): Observable<AuditLog | null> {
    return from(
      this.supabase.client.rpc('log_audit', {
        p_entity_type: request.entity_type,
        p_entity_id: request.entity_id,
        p_action: request.action,
        p_entity_name: request.entity_name ?? null,
        p_blueprint_id: request.blueprint_id ?? null,
        p_organization_id: request.organization_id ?? null,
        p_old_value: request.old_value ?? null,
        p_new_value: request.new_value ?? null,
        p_metadata: request.metadata ?? {},
        p_severity: request.severity ?? 'info'
      })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AuditLogRepository] create error:', error);
          return null;
        }
        // RPC returns the audit log ID
        if (data) {
          return { id: data as string } as AuditLog;
        }
        return null;
      })
    );
  }

  /**
   * 批次建立審計日誌
   * Batch create audit log entries
   * Uses multiple RPC calls to ensure proper auth.uid() to account_id mapping
   */
  createBatch(requests: CreateAuditLogRequest[]): Observable<AuditLog[]> {
    if (requests.length === 0) return of([]);

    // Use Promise.all to execute all RPC calls in parallel
    const rpcCalls = requests.map(req =>
      this.supabase.client.rpc('log_audit', {
        p_entity_type: req.entity_type,
        p_entity_id: req.entity_id,
        p_action: req.action,
        p_entity_name: req.entity_name ?? null,
        p_blueprint_id: req.blueprint_id ?? null,
        p_organization_id: req.organization_id ?? null,
        p_old_value: req.old_value ?? null,
        p_new_value: req.new_value ?? null,
        p_metadata: req.metadata ?? {},
        p_severity: req.severity ?? 'info'
      })
    );

    return from(Promise.all(rpcCalls)).pipe(
      map(results => {
        return results.filter(result => !result.error && result.data).map(result => ({ id: result.data as string }) as AuditLog);
      })
    );
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * 查詢審計日誌
   * Query audit logs with filters
   */
  query(options: AuditLogQueryOptions): Observable<AuditLogPageResult> {
    const page = options.page ?? 1;
    const pageSize = options.pageSize ?? 20;
    const offset = options.offset ?? (page - 1) * pageSize;
    const limit = options.limit ?? pageSize;

    let query = this.supabase.client.from('audit_logs').select('*', { count: 'exact' });

    // Apply filters
    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }
    if (options.organizationId) {
      query = query.eq('organization_id', options.organizationId);
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
    if (options.action) {
      if (Array.isArray(options.action)) {
        query = query.in('action', options.action);
      } else {
        query = query.eq('action', options.action);
      }
    }
    if (options.actorId) {
      query = query.eq('actor_id', options.actorId);
    }
    if (options.severity) {
      if (Array.isArray(options.severity)) {
        query = query.in('severity', options.severity);
      } else {
        query = query.eq('severity', options.severity);
      }
    }
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }
    if (options.search) {
      query = query.or(`entity_name.ilike.%${options.search}%,actor_name.ilike.%${options.search}%`);
    }

    // Apply sorting
    const orderBy = options.orderBy ?? 'created_at';
    const orderDirection = options.orderDirection ?? 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    return from(query).pipe(
      map(({ data, count, error }) => {
        if (error) {
          console.error('[AuditLogRepository] query error:', error);
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0
          };
        }
        const total = count ?? 0;
        return {
          data: (data || []) as AuditLog[],
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        };
      })
    );
  }

  /**
   * 根據 ID 查詢審計日誌
   * Find audit log by ID
   */
  findById(id: string): Observable<AuditLog | null> {
    return from(this.supabase.client.from('audit_logs').select('*').eq('id', id).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          console.error('[AuditLogRepository] findById error:', error);
          return null;
        }
        return data as AuditLog;
      })
    );
  }

  /**
   * 取得實體的審計歷史
   * Get entity audit history
   */
  getEntityHistory(entityType: AuditEntityType, entityId: string, limit = 50): Observable<AuditLog[]> {
    return from(
      this.supabase.client
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AuditLogRepository] getEntityHistory error:', error);
          return [];
        }
        return (data || []) as AuditLog[];
      })
    );
  }

  /**
   * 取得操作者的審計記錄
   * Get actor audit records
   */
  getActorHistory(actorId: string, limit = 50): Observable<AuditLog[]> {
    return from(
      this.supabase.client.from('audit_logs').select('*').eq('actor_id', actorId).order('created_at', { ascending: false }).limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AuditLogRepository] getActorHistory error:', error);
          return [];
        }
        return (data || []) as AuditLog[];
      })
    );
  }

  /**
   * 取得藍圖的審計日誌
   * Get blueprint audit logs
   */
  findByBlueprint(blueprintId: string, limit = 100): Observable<AuditLog[]> {
    return from(
      this.supabase.client
        .from('audit_logs')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AuditLogRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as AuditLog[];
      })
    );
  }

  // ============================================================================
  // Statistics Operations
  // ============================================================================

  /**
   * 取得審計日誌統計
   * Get audit log statistics
   */
  getStats(options: { blueprintId?: string; organizationId?: string; startDate?: string; endDate?: string }): Observable<AuditLogStats> {
    // Note: This would ideally use a stored procedure or RPC for complex aggregations
    // For now, we'll fetch and aggregate in-memory for simplicity
    let query = this.supabase.client.from('audit_logs').select('*');

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }
    if (options.organizationId) {
      query = query.eq('organization_id', options.organizationId);
    }
    if (options.startDate) {
      query = query.gte('created_at', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('created_at', options.endDate);
    }

    return from(query.limit(10000)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AuditLogRepository] getStats error:', error);
          return this.emptyStats();
        }

        const logs = (data || []) as AuditLog[];
        return this.calculateStats(logs);
      })
    );
  }

  private calculateStats(logs: AuditLog[]): AuditLogStats {
    const byAction: Record<AuditAction, number> = {} as Record<AuditAction, number>;
    const byEntityType: Record<AuditEntityType, number> = {} as Record<AuditEntityType, number>;
    const bySeverity: Record<AuditSeverity, number> = {} as Record<AuditSeverity, number>;
    const byDate = new Map<string, number>();
    const actorCounts = new Map<string, { name: string; count: number }>();

    for (const log of logs) {
      // By action
      byAction[log.action] = (byAction[log.action] || 0) + 1;

      // By entity type
      byEntityType[log.entity_type] = (byEntityType[log.entity_type] || 0) + 1;

      // By severity
      bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;

      // By date
      const date = log.created_at.split('T')[0];
      byDate.set(date, (byDate.get(date) || 0) + 1);

      // By actor
      if (log.actor_id) {
        const existing = actorCounts.get(log.actor_id);
        if (existing) {
          existing.count++;
        } else {
          actorCounts.set(log.actor_id, {
            name: log.actor_name || 'Unknown',
            count: 1
          });
        }
      }
    }

    const topActors = Array.from(actorCounts.entries())
      .map(([actor_id, data]) => ({
        actor_id,
        actor_name: data.name,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const byDateArray = Array.from(byDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      total_count: logs.length,
      by_action: byAction,
      by_entity_type: byEntityType,
      by_severity: bySeverity,
      by_date: byDateArray,
      top_actors: topActors
    };
  }

  private emptyStats(): AuditLogStats {
    return {
      total_count: 0,
      by_action: {} as Record<AuditAction, number>,
      by_entity_type: {} as Record<AuditEntityType, number>,
      by_severity: {} as Record<AuditSeverity, number>,
      by_date: [],
      top_actors: []
    };
  }
}
