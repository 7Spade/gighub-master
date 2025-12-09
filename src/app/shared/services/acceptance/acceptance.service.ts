/**
 * Acceptance Service
 *
 * 驗收服務 - 驗收流程管理
 * Acceptance service with Signals
 *
 * Features:
 * - Acceptance workflow management
 * - Approval process
 * - Integration with QC module
 * - Audit trail
 *
 * @module shared/services/acceptance
 */

import { Injectable, inject, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '@delon/theme';
import { Observable, catchError, of, tap, Subject, switchMap, map } from 'rxjs';

import { AcceptanceRepository } from '../../../core/infra/repositories/acceptance';
import {
  Acceptance,
  AcceptanceApproval,
  AcceptanceAttachment,
  AcceptanceWithDetails,
  AcceptanceQueryOptions,
  CreateAcceptanceRequest,
  UpdateAcceptanceRequest,
  AcceptanceDecisionRequest,
  AcceptanceStatus,
  AcceptanceDecision,
  ACCEPTANCE_STATUS_CONFIG,
  ACCEPTANCE_TYPE_CONFIG,
  ACCEPTANCE_DECISION_CONFIG,
  isAcceptanceCompleted
} from '../../../core/infra/types/acceptance';
import { LoggerService } from '../../../core/logger/logger.service';

/**
 * 驗收狀態
 */
interface AcceptanceState {
  acceptances: Acceptance[];
  selectedAcceptance: AcceptanceWithDetails | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  currentBlueprintId: string | null;
  filters: AcceptanceQueryOptions;
}

const initialState: AcceptanceState = {
  acceptances: [],
  selectedAcceptance: null,
  loading: false,
  error: null,
  hasMore: false,
  total: 0,
  currentBlueprintId: null,
  filters: {}
};

@Injectable({ providedIn: 'root' })
export class AcceptanceService {
  private readonly repository = inject(AcceptanceRepository);
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // State Management (Signals)
  // ============================================================================

  private readonly _state = signal<AcceptanceState>(initialState);

  // Public computed signals
  readonly acceptances = computed(() => this._state().acceptances);
  readonly selectedAcceptance = computed(() => this._state().selectedAcceptance);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly hasMore = computed(() => this._state().hasMore);
  readonly total = computed(() => this._state().total);
  readonly isEmpty = computed(() => this._state().acceptances.length === 0);
  readonly filters = computed(() => this._state().filters);

  // Derived computed signals
  readonly pendingAcceptances = computed(() => this.acceptances().filter(a => a.status === 'pending' || a.status === 'in_progress'));

  readonly completedAcceptances = computed(() => this.acceptances().filter(a => isAcceptanceCompleted(a)));

  // Event subjects
  private readonly _acceptanceCreated = new Subject<Acceptance>();
  private readonly _acceptanceUpdated = new Subject<Acceptance>();
  private readonly _decisionMade = new Subject<{ acceptance: Acceptance; decision: AcceptanceDecision }>();

  readonly acceptanceCreated$ = this._acceptanceCreated.asObservable();
  readonly acceptanceUpdated$ = this._acceptanceUpdated.asObservable();
  readonly decisionMade$ = this._decisionMade.asObservable();

  // ============================================================================
  // Acceptance Operations
  // ============================================================================

  /**
   * 載入驗收記錄列表
   * Load acceptance records
   */
  loadAcceptances(options: AcceptanceQueryOptions = {}): void {
    this.updateState({ loading: true, error: null, filters: options });

    this.repository
      .query(options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.updateState({
            acceptances: result.data,
            total: result.total,
            hasMore: result.hasMore,
            loading: false
          });
        },
        error: error => {
          this.logger.error('AcceptanceService - Failed to load acceptances', error);
          this.updateState({
            error: 'Failed to load acceptances',
            loading: false
          });
        }
      });
  }

  /**
   * 載入藍圖的驗收記錄
   * Load blueprint acceptances
   */
  loadByBlueprint(blueprintId: string, options: Partial<AcceptanceQueryOptions> = {}): void {
    this.updateState({
      loading: true,
      error: null,
      currentBlueprintId: blueprintId,
      filters: { blueprintId, ...options }
    });

    this.repository
      .findByBlueprint(blueprintId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: acceptances => {
          this.updateState({
            acceptances,
            loading: false
          });
        },
        error: error => {
          this.logger.error('AcceptanceService - Failed to load acceptances by blueprint', error);
          this.updateState({
            error: 'Failed to load blueprint acceptances',
            loading: false
          });
        }
      });
  }

  /**
   * 載入任務的驗收記錄
   * Load task acceptances
   */
  loadByTask(taskId: string): Observable<Acceptance[]> {
    return this.repository.findByTask(taskId);
  }

  /**
   * 載入品管檢查的驗收記錄
   * Load QC inspection acceptances
   */
  loadByQcInspection(qcInspectionId: string): Observable<Acceptance[]> {
    return this.repository.findByQcInspection(qcInspectionId);
  }

  /**
   * 選擇驗收記錄（含詳細資料）
   * Select acceptance with details
   */
  selectAcceptance(id: string): void {
    this.updateState({ loading: true, error: null });

    this.repository
      .findByIdWithDetails(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: acceptance => {
          this.updateState({
            selectedAcceptance: acceptance,
            loading: false
          });
        },
        error: error => {
          this.logger.error('AcceptanceService - Failed to select acceptance', error);
          this.updateState({
            error: 'Failed to load acceptance details',
            loading: false
          });
        }
      });
  }

  /**
   * 建立驗收記錄
   * Create acceptance
   */
  createAcceptance(request: CreateAcceptanceRequest): Observable<Acceptance | null> {
    const userId = this.settings.user?.['id'];
    if (!userId) {
      this.logger.error('AcceptanceService', 'No user ID for createAcceptance', null, { request });
      return of(null);
    }

    return this.repository.create(request, userId).pipe(
      tap(acceptance => {
        if (acceptance) {
          this._acceptanceCreated.next(acceptance);
          this._state.update(state => ({
            ...state,
            acceptances: [acceptance, ...state.acceptances],
            total: state.total + 1
          }));
        }
      }),
      catchError(error => {
        this.logger.error('AcceptanceService', 'Failed to create acceptance', error, { request });
        return of(null);
      })
    );
  }

  /**
   * 更新驗收記錄
   * Update acceptance
   */
  updateAcceptance(id: string, updates: UpdateAcceptanceRequest): Observable<Acceptance | null> {
    return this.repository.update(id, updates).pipe(
      tap(acceptance => {
        if (acceptance) {
          this._acceptanceUpdated.next(acceptance);
          this._state.update(state => ({
            ...state,
            acceptances: state.acceptances.map(a => (a.id === id ? acceptance : a)),
            selectedAcceptance:
              state.selectedAcceptance?.id === id ? { ...state.selectedAcceptance, ...acceptance } : state.selectedAcceptance
          }));
        }
      }),
      catchError(error => {
        this.logger.error('AcceptanceService', 'Failed to update acceptance', error, { id, request });
        return of(null);
      })
    );
  }

  /**
   * 開始驗收流程
   * Start acceptance process
   */
  startAcceptance(id: string): Observable<Acceptance | null> {
    return this.repository.startAcceptance(id).pipe(
      tap(acceptance => {
        if (acceptance) {
          this._acceptanceUpdated.next(acceptance);
        }
      }),
      catchError(error => {
        this.logger.error('AcceptanceService', 'Failed to start acceptance', error, { id });
        return of(null);
      })
    );
  }

  /**
   * 做出驗收決定
   * Make acceptance decision
   */
  makeDecision(id: string, request: AcceptanceDecisionRequest): Observable<Acceptance | null> {
    const userId = this.settings.user?.['id'];
    if (!userId) {
      this.logger.error('AcceptanceService', 'No user ID for makeDecision', null, { request });
      return of(null);
    }

    return this.repository.makeDecision(id, request, userId).pipe(
      tap(acceptance => {
        if (acceptance) {
          this._decisionMade.next({ acceptance, decision: request.decision });
          this._acceptanceUpdated.next(acceptance);
          this._state.update(state => ({
            ...state,
            acceptances: state.acceptances.map(a => (a.id === id ? acceptance : a)),
            selectedAcceptance:
              state.selectedAcceptance?.id === id ? { ...state.selectedAcceptance, ...acceptance } : state.selectedAcceptance
          }));
        }
      }),
      catchError(error => {
        this.logger.error('AcceptanceService', 'Failed to make decision', error, { request });
        return of(null);
      })
    );
  }

  /**
   * 核准驗收
   * Approve acceptance
   */
  approve(id: string, reason?: string): Observable<Acceptance | null> {
    return this.makeDecision(id, {
      decision: 'approve',
      decision_reason: reason
    });
  }

  /**
   * 駁回驗收
   * Reject acceptance
   */
  reject(id: string, reason: string): Observable<Acceptance | null> {
    return this.makeDecision(id, {
      decision: 'reject',
      decision_reason: reason
    });
  }

  /**
   * 有條件核准
   * Conditionally approve
   */
  conditionalApprove(id: string, conditions: string): Observable<Acceptance | null> {
    return this.makeDecision(id, {
      decision: 'conditional',
      conditions
    });
  }

  /**
   * 延後驗收
   * Defer acceptance
   */
  defer(id: string, reason: string): Observable<Acceptance | null> {
    return this.makeDecision(id, {
      decision: 'defer',
      decision_reason: reason
    });
  }

  /**
   * 刪除驗收記錄
   * Delete acceptance
   */
  deleteAcceptance(id: string): Observable<boolean> {
    return this.repository.softDelete(id).pipe(
      map(() => {
        this._state.update(state => ({
          ...state,
          acceptances: state.acceptances.filter(a => a.id !== id),
          total: state.total - 1,
          selectedAcceptance: state.selectedAcceptance?.id === id ? null : state.selectedAcceptance
        }));
        return true;
      }),
      catchError(error => {
        this.logger.error('AcceptanceService', 'Failed to delete acceptance', error, { id });
        return of(false);
      })
    );
  }

  // ============================================================================
  // Approval Operations
  // ============================================================================

  /**
   * 取得審批記錄
   * Get approval records
   */
  getApprovals(acceptanceId: string): Observable<AcceptanceApproval[]> {
    return this.repository.findApprovalsByAcceptance(acceptanceId);
  }

  // ============================================================================
  // Attachment Operations
  // ============================================================================

  /**
   * 上傳驗收附件
   * Upload acceptance attachment
   */
  uploadAttachment(
    acceptanceId: string,
    fileName: string,
    filePath: string,
    options: { fileSize?: number; mimeType?: string; caption?: string; documentType?: string } = {}
  ): Observable<AcceptanceAttachment | null> {
    const userId = this.settings.user?.['id'];
    if (!userId) {
      this.logger.error('AcceptanceService', 'No user ID for uploadAttachment', null, { acceptanceId });
      return of(null);
    }

    return this.repository.createAttachment(acceptanceId, fileName, filePath, userId, options).pipe(
      tap(attachment => {
        if (attachment && this._state().selectedAcceptance) {
          this._state.update(state => ({
            ...state,
            selectedAcceptance: state.selectedAcceptance
              ? {
                  ...state.selectedAcceptance,
                  attachments: [...(state.selectedAcceptance.attachments || []), attachment]
                }
              : null
          }));
        }
      }),
      catchError(error => {
        this.logger.error('AcceptanceService', 'Failed to upload attachment', error, { acceptanceId });
        return of(null);
      })
    );
  }

  /**
   * 刪除附件
   * Delete attachment
   */
  deleteAttachment(id: string): Observable<boolean> {
    return this.repository.deleteAttachment(id).pipe(
      tap(success => {
        if (success) {
          this._state.update(state => ({
            ...state,
            selectedAcceptance: state.selectedAcceptance
              ? {
                  ...state.selectedAcceptance,
                  attachments: state.selectedAcceptance.attachments?.filter(a => a.id !== id)
                }
              : null
          }));
        }
      }),
      catchError(error => {
        this.logger.error('AcceptanceService', 'Failed to delete attachment', error, { attachmentId });
        return of(false);
      })
    );
  }

  // ============================================================================
  // Statistics Operations
  // ============================================================================

  /**
   * 取得驗收統計
   * Get acceptance statistics
   */
  getStats(blueprintId: string): Observable<{
    total: number;
    passed: number;
    failed: number;
    pending: number;
    conditionallyPassed: number;
  }> {
    return this.repository.getStatsByBlueprint(blueprintId);
  }

  // ============================================================================
  // Selection & State
  // ============================================================================

  /**
   * 清除選擇
   * Clear selection
   */
  clearSelection(): void {
    this.updateState({ selectedAcceptance: null });
  }

  /**
   * 重新載入
   * Reload
   */
  reload(): void {
    this.loadAcceptances(this._state().filters);
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
  getStatusConfig(status: AcceptanceStatus) {
    return ACCEPTANCE_STATUS_CONFIG[status];
  }

  /**
   * 取得類型配置
   * Get type configuration
   */
  getTypeConfig(type: string) {
    return ACCEPTANCE_TYPE_CONFIG[type as keyof typeof ACCEPTANCE_TYPE_CONFIG];
  }

  /**
   * 取得決定配置
   * Get decision configuration
   */
  getDecisionConfig(decision: AcceptanceDecision) {
    return ACCEPTANCE_DECISION_CONFIG[decision];
  }

  /**
   * 檢查是否可以做決定
   * Check if can make decision
   */
  canMakeDecision(acceptance: Acceptance): boolean {
    return acceptance.status === 'in_progress' && acceptance.decision === null;
  }

  /**
   * 更新狀態
   * Update state
   */
  private updateState(partial: Partial<AcceptanceState>): void {
    this._state.update(state => ({ ...state, ...partial }));
  }
}
