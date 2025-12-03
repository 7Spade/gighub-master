/**
 * Audit Log Service
 *
 * 審計日誌服務 - 企業級操作審計系統
 * Enterprise-grade audit log service with Signals
 *
 * Features:
 * - Immutable record management
 * - Automatic logging integration
 * - Real-time audit trail
 * - Comprehensive query capabilities
 *
 * @module shared/services/audit-log
 */

import { Injectable, inject, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, of, tap, Subject } from 'rxjs';

import {
  AuditLog,
  CreateAuditLogRequest,
  AuditLogQueryOptions,
  AuditLogPageResult,
  AuditLogStats,
  AuditEntityType,
  AuditAction,
  AuditSeverity,
  AuditMetadata,
  AuditContext,
  AuditChange,
  AUDIT_ACTION_CONFIG
} from '../../../core/infra/types/audit-log';
import { AuditLogRepository } from '../../../core/infra/repositories/audit-log';
import { SettingsService } from '@delon/theme';

/**
 * 審計日誌狀態
 */
interface AuditLogState {
  logs: AuditLog[];
  selectedLog: AuditLog | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: AuditLogQueryOptions;
  stats: AuditLogStats | null;
}

const initialState: AuditLogState = {
  logs: [],
  selectedLog: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  },
  filters: {},
  stats: null
};

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly repository = inject(AuditLogRepository);
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // State Management (Signals)
  // ============================================================================

  private readonly _state = signal<AuditLogState>(initialState);

  // Public computed signals
  readonly logs = computed(() => this._state().logs);
  readonly selectedLog = computed(() => this._state().selectedLog);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly pagination = computed(() => this._state().pagination);
  readonly filters = computed(() => this._state().filters);
  readonly stats = computed(() => this._state().stats);
  readonly isEmpty = computed(() => this._state().logs.length === 0);

  // Event subjects for cross-component communication
  private readonly _auditLogged = new Subject<AuditLog>();
  readonly auditLogged$ = this._auditLogged.asObservable();

  // ============================================================================
  // Logging Operations
  // ============================================================================

  /**
   * 記錄審計日誌
   * Log an audit entry
   */
  log(request: CreateAuditLogRequest): Observable<AuditLog | null> {
    return this.repository.create(request).pipe(
      tap(log => {
        if (log) {
          this._auditLogged.next(log);
        }
      }),
      catchError(error => {
        console.error('[AuditLogService] log error:', error);
        return of(null);
      })
    );
  }

  /**
   * 快速記錄審計日誌
   * Quick log with minimal parameters
   */
  quickLog(
    entityType: AuditEntityType,
    entityId: string,
    action: AuditAction,
    options: {
      entityName?: string;
      blueprintId?: string;
      organizationId?: string;
      oldValue?: Record<string, unknown>;
      newValue?: Record<string, unknown>;
      metadata?: AuditMetadata;
      severity?: AuditSeverity;
    } = {}
  ): Observable<AuditLog | null> {
    const user = this.settings.user;
    const request: CreateAuditLogRequest = {
      entity_type: entityType,
      entity_id: entityId,
      action,
      actor_id: user?.['id'] || 'system',
      actor_name: user?.['name'] || 'System',
      entity_name: options.entityName,
      blueprint_id: options.blueprintId,
      organization_id: options.organizationId,
      old_value: options.oldValue,
      new_value: options.newValue,
      metadata: options.metadata,
      severity: options.severity,
      context: this.buildContext()
    };

    return this.log(request);
  }

  /**
   * 記錄實體變更
   * Log entity changes with diff
   */
  logChanges<T extends Record<string, unknown>>(
    entityType: AuditEntityType,
    entityId: string,
    action: AuditAction,
    oldValue: T | null,
    newValue: T | null,
    options: {
      entityName?: string;
      blueprintId?: string;
      organizationId?: string;
      metadata?: AuditMetadata;
    } = {}
  ): Observable<AuditLog | null> {
    const changes = this.calculateChanges(oldValue, newValue);

    return this.quickLog(entityType, entityId, action, {
      ...options,
      oldValue: oldValue as Record<string, unknown> | undefined,
      newValue: newValue as Record<string, unknown> | undefined,
      metadata: {
        ...options.metadata,
        changes_summary: changes.map(c => `${c.field}: ${c.old_value} → ${c.new_value}`)
      }
    });
  }

  /**
   * 批次記錄審計日誌
   * Batch log audit entries
   */
  logBatch(requests: CreateAuditLogRequest[]): Observable<AuditLog[]> {
    return this.repository.createBatch(requests).pipe(
      tap(logs => {
        logs.forEach(log => this._auditLogged.next(log));
      }),
      catchError(error => {
        console.error('[AuditLogService] logBatch error:', error);
        return of([]);
      })
    );
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * 載入審計日誌
   * Load audit logs with filters
   */
  loadLogs(options: AuditLogQueryOptions = {}): void {
    this.updateState({ loading: true, error: null, filters: options });

    this.repository
      .query(options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.updateState({
            logs: result.data,
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
          console.error('[AuditLogService] loadLogs error:', error);
          this.updateState({
            error: 'Failed to load audit logs',
            loading: false
          });
        }
      });
  }

  /**
   * 載入更多日誌
   * Load more logs (pagination)
   */
  loadMore(): void {
    const { pagination, filters } = this._state();
    if (pagination.page >= pagination.totalPages) return;

    this.loadLogs({
      ...filters,
      page: pagination.page + 1,
      pageSize: pagination.pageSize
    });
  }

  /**
   * 重新載入日誌
   * Reload logs with current filters
   */
  reload(): void {
    this.loadLogs(this._state().filters);
  }

  /**
   * 根據 ID 載入日誌
   * Load log by ID
   */
  loadById(id: string): void {
    this.updateState({ loading: true, error: null });

    this.repository
      .findById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: log => {
          this.updateState({
            selectedLog: log,
            loading: false
          });
        },
        error: error => {
          console.error('[AuditLogService] loadById error:', error);
          this.updateState({
            error: 'Failed to load audit log',
            loading: false
          });
        }
      });
  }

  /**
   * 取得實體的審計歷史
   * Get entity audit history
   */
  getEntityHistory(entityType: AuditEntityType, entityId: string, limit = 50): Observable<AuditLog[]> {
    return this.repository.getEntityHistory(entityType, entityId, limit);
  }

  /**
   * 取得操作者的審計記錄
   * Get actor audit records
   */
  getActorHistory(actorId: string, limit = 50): Observable<AuditLog[]> {
    return this.repository.getActorHistory(actorId, limit);
  }

  /**
   * 取得藍圖的審計日誌
   * Get blueprint audit logs
   */
  getByBlueprint(blueprintId: string, limit = 100): Observable<AuditLog[]> {
    return this.repository.findByBlueprint(blueprintId, limit);
  }

  // ============================================================================
  // Statistics Operations
  // ============================================================================

  /**
   * 載入統計資料
   * Load statistics
   */
  loadStats(options: { blueprintId?: string; organizationId?: string; startDate?: string; endDate?: string } = {}): void {
    this.repository
      .getStats(options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: stats => {
          this.updateState({ stats });
        },
        error: error => {
          console.error('[AuditLogService] loadStats error:', error);
        }
      });
  }

  // ============================================================================
  // Selection & State
  // ============================================================================

  /**
   * 選擇日誌
   * Select a log
   */
  selectLog(log: AuditLog | null): void {
    this.updateState({ selectedLog: log });
  }

  /**
   * 清除選擇
   * Clear selection
   */
  clearSelection(): void {
    this.updateState({ selectedLog: null });
  }

  /**
   * 更新篩選條件
   * Update filters
   */
  updateFilters(filters: Partial<AuditLogQueryOptions>): void {
    const currentFilters = this._state().filters;
    this.loadLogs({ ...currentFilters, ...filters, page: 1 });
  }

  /**
   * 清除篩選條件
   * Clear filters
   */
  clearFilters(): void {
    this.loadLogs({});
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
   * 取得動作配置
   * Get action configuration
   */
  getActionConfig(action: AuditAction) {
    return AUDIT_ACTION_CONFIG[action];
  }

  /**
   * 計算變更
   * Calculate changes between old and new values
   */
  private calculateChanges<T extends Record<string, unknown>>(oldValue: T | null, newValue: T | null): AuditChange[] {
    if (!oldValue || !newValue) return [];

    const changes: AuditChange[] = [];
    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

    for (const key of allKeys) {
      const oldVal = oldValue[key];
      const newVal = newValue[key];

      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key,
          old_value: oldVal,
          new_value: newVal
        });
      }
    }

    return changes;
  }

  /**
   * 建構執行上下文
   * Build execution context
   */
  private buildContext(): AuditContext {
    return {
      route: typeof window !== 'undefined' ? window.location.pathname : undefined,
      session_id: this.settings.user?.['id'] ? `session_${this.settings.user['id']}` : undefined
    };
  }

  /**
   * 更新狀態
   * Update state
   */
  private updateState(partial: Partial<AuditLogState>): void {
    this._state.update(state => ({ ...state, ...partial }));
  }
}
