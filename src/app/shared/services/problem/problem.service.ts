/**
 * Problem Service
 *
 * 問題管理服務 - 問題生命週期管理
 * Problem management service with Signals
 *
 * Features:
 * - Problem lifecycle management
 * - Status transitions with validation
 * - Knowledge base management
 * - Statistics and reporting
 *
 * Problem Lifecycle:
 * Open → Assessing → Assigned → In Progress → Resolved → Verifying → Closed
 *
 * @module shared/services/problem
 */

import { Injectable, inject, computed, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '@delon/theme';
import { Observable, catchError, of, tap, Subject, map } from 'rxjs';

import { ProblemRepository } from '../../../core/infra/repositories/problem';
import {
  Problem,
  ProblemAction,
  ProblemComment,
  ProblemAttachment,
  ProblemWithDetails,
  ProblemQueryOptions,
  ProblemStats,
  CreateProblemRequest,
  UpdateProblemRequest,
  ProblemStatusChangeRequest,
  ProblemStatus,
  ProblemType,
  ProblemPriority,
  ProblemSeverity,
  PROBLEM_STATUS_CONFIG,
  PROBLEM_TYPE_CONFIG,
  PROBLEM_PRIORITY_CONFIG,
  PROBLEM_SEVERITY_CONFIG,
  PROBLEM_SOURCE_CONFIG,
  VALID_STATUS_TRANSITIONS,
  isProblemClosed,
  needsAction,
  isOverdue,
  calculateResolutionTime
} from '../../../core/infra/types/problem';

/**
 * 問題狀態
 */
interface ProblemState {
  problems: Problem[];
  selectedProblem: ProblemWithDetails | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  currentBlueprintId: string | null;
  filters: ProblemQueryOptions;
  stats: ProblemStats | null;
}

const initialState: ProblemState = {
  problems: [],
  selectedProblem: null,
  loading: false,
  error: null,
  hasMore: false,
  total: 0,
  currentBlueprintId: null,
  filters: {},
  stats: null
};

@Injectable({ providedIn: 'root' })
export class ProblemService {
  private readonly repository = inject(ProblemRepository);
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // State Management (Signals)
  // ============================================================================

  private readonly _state = signal<ProblemState>(initialState);

  // Public computed signals
  readonly problems = computed(() => this._state().problems);
  readonly selectedProblem = computed(() => this._state().selectedProblem);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly hasMore = computed(() => this._state().hasMore);
  readonly total = computed(() => this._state().total);
  readonly isEmpty = computed(() => this._state().problems.length === 0);
  readonly filters = computed(() => this._state().filters);
  readonly stats = computed(() => this._state().stats);

  // Derived computed signals
  readonly openProblems = computed(() => this.problems().filter(p => !isProblemClosed(p)));

  readonly criticalProblems = computed(() => this.problems().filter(p => p.priority === 'critical' && !isProblemClosed(p)));

  readonly highRiskProblems = computed(() => this.problems().filter(p => p.risk_flag && !isProblemClosed(p)));

  readonly overdueProblems = computed(() => this.problems().filter(p => isOverdue(p)));

  readonly myAssignedProblems = computed(() => {
    const userId = this.settings.user?.['id'];
    return this.problems().filter(p => p.assignee_id === userId && needsAction(p));
  });

  // Event subjects
  private readonly _problemCreated = new Subject<Problem>();
  private readonly _problemUpdated = new Subject<Problem>();
  private readonly _statusChanged = new Subject<{ problem: Problem; fromStatus: ProblemStatus; toStatus: ProblemStatus }>();
  private readonly _commentAdded = new Subject<ProblemComment>();

  readonly problemCreated$ = this._problemCreated.asObservable();
  readonly problemUpdated$ = this._problemUpdated.asObservable();
  readonly statusChanged$ = this._statusChanged.asObservable();
  readonly commentAdded$ = this._commentAdded.asObservable();

  // ============================================================================
  // Problem Operations
  // ============================================================================

  /**
   * 載入問題列表
   * Load problems
   */
  loadProblems(options: ProblemQueryOptions = {}): void {
    this.updateState({ loading: true, error: null, filters: options });

    this.repository
      .query(options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.updateState({
            problems: result.data,
            total: result.total,
            hasMore: result.hasMore,
            loading: false
          });
        },
        error: error => {
          console.error('[ProblemService] loadProblems error:', error);
          this.updateState({
            error: 'Failed to load problems',
            loading: false
          });
        }
      });
  }

  /**
   * 載入藍圖的問題
   * Load blueprint problems
   */
  loadByBlueprint(blueprintId: string, options: Partial<ProblemQueryOptions> = {}): void {
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
        next: problems => {
          this.updateState({
            problems,
            loading: false
          });
        },
        error: error => {
          console.error('[ProblemService] loadByBlueprint error:', error);
          this.updateState({
            error: 'Failed to load blueprint problems',
            loading: false
          });
        }
      });

    // Also load stats
    this.loadStats(blueprintId);
  }

  /**
   * 載入任務的問題
   * Load task problems
   */
  loadByTask(taskId: string): Observable<Problem[]> {
    return this.repository.findByTask(taskId);
  }

  /**
   * 載入品管檢查的問題
   * Load QC inspection problems
   */
  loadByQcInspection(qcInspectionId: string): Observable<Problem[]> {
    return this.repository.findByQcInspection(qcInspectionId);
  }

  /**
   * 載入驗收的問題
   * Load acceptance problems
   */
  loadByAcceptance(acceptanceId: string): Observable<Problem[]> {
    return this.repository.findByAcceptance(acceptanceId);
  }

  /**
   * 載入我負責的問題
   * Load my assigned problems
   */
  loadMyAssigned(): Observable<Problem[]> {
    const userId = this.settings.user?.['id'];
    if (!userId) return of([]);
    return this.repository.findByAssignee(userId);
  }

  /**
   * 載入高風險問題
   * Load high-risk problems
   */
  loadHighRisk(blueprintId: string): Observable<Problem[]> {
    return this.repository.findHighRisk(blueprintId);
  }

  /**
   * 選擇問題（含詳細資料）
   * Select problem with details
   */
  selectProblem(id: string): void {
    this.updateState({ loading: true, error: null });

    this.repository
      .findByIdWithDetails(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: problem => {
          this.updateState({
            selectedProblem: problem,
            loading: false
          });
        },
        error: error => {
          console.error('[ProblemService] selectProblem error:', error);
          this.updateState({
            error: 'Failed to load problem details',
            loading: false
          });
        }
      });
  }

  /**
   * 建立問題
   * Create problem
   */
  createProblem(request: CreateProblemRequest): Observable<Problem | null> {
    const userId = this.settings.user?.['id'];
    if (!userId) {
      console.error('[ProblemService] No user ID for createProblem');
      return of(null);
    }

    return this.repository.create(request, userId).pipe(
      tap(problem => {
        if (problem) {
          this._problemCreated.next(problem);
          this._state.update(state => ({
            ...state,
            problems: [problem, ...state.problems],
            total: state.total + 1
          }));
        }
      }),
      catchError(error => {
        console.error('[ProblemService] createProblem error:', error);
        return of(null);
      })
    );
  }

  /**
   * 更新問題
   * Update problem
   */
  updateProblem(id: string, updates: UpdateProblemRequest): Observable<Problem | null> {
    return this.repository.update(id, updates).pipe(
      tap(problem => {
        if (problem) {
          this._problemUpdated.next(problem);
          this._state.update(state => ({
            ...state,
            problems: state.problems.map(p => (p.id === id ? problem : p)),
            selectedProblem: state.selectedProblem?.id === id ? { ...state.selectedProblem, ...problem } : state.selectedProblem
          }));
        }
      }),
      catchError(error => {
        console.error('[ProblemService] updateProblem error:', error);
        return of(null);
      })
    );
  }

  /**
   * 變更問題狀態
   * Change problem status
   */
  changeStatus(id: string, request: ProblemStatusChangeRequest): Observable<Problem | null> {
    const userId = this.settings.user?.['id'];
    if (!userId) {
      console.error('[ProblemService] No user ID for changeStatus');
      return of(null);
    }

    // Get current status for event
    const currentProblem = this._state().problems.find(p => p.id === id);
    const fromStatus = currentProblem?.status || 'open';

    return this.repository.changeStatus(id, request, userId).pipe(
      tap(problem => {
        if (problem) {
          this._statusChanged.next({
            problem,
            fromStatus: fromStatus as ProblemStatus,
            toStatus: request.status
          });
          this._problemUpdated.next(problem);
          this._state.update(state => ({
            ...state,
            problems: state.problems.map(p => (p.id === id ? problem : p)),
            selectedProblem: state.selectedProblem?.id === id ? { ...state.selectedProblem, ...problem } : state.selectedProblem
          }));
        }
      }),
      catchError(error => {
        console.error('[ProblemService] changeStatus error:', error);
        return of(null);
      })
    );
  }

  // ============================================================================
  // Status Transition Helpers
  // ============================================================================

  /**
   * 開始評估
   * Start assessing
   */
  startAssessing(id: string, description: string): Observable<Problem | null> {
    return this.changeStatus(id, {
      status: 'assessing',
      action_description: description
    });
  }

  /**
   * 分派問題
   * Assign problem
   */
  assign(id: string, assigneeId: string, description: string): Observable<Problem | null> {
    return this.changeStatus(id, {
      status: 'assigned',
      action_description: description,
      assignee_id: assigneeId
    });
  }

  /**
   * 開始處理
   * Start working
   */
  startWorking(id: string, description: string): Observable<Problem | null> {
    return this.changeStatus(id, {
      status: 'in_progress',
      action_description: description
    });
  }

  /**
   * 解決問題
   * Resolve problem
   */
  resolve(id: string, rootCause: string, resolution: string, prevention?: string): Observable<Problem | null> {
    return this.changeStatus(id, {
      status: 'resolved',
      action_description: `Resolved: ${resolution}`,
      root_cause: rootCause,
      resolution,
      prevention
    });
  }

  /**
   * 開始驗證
   * Start verifying
   */
  startVerifying(id: string, verifierId: string, description: string): Observable<Problem | null> {
    return this.changeStatus(id, {
      status: 'verifying',
      action_description: description,
      verifier_id: verifierId
    });
  }

  /**
   * 關閉問題
   * Close problem
   */
  closeProblem(id: string, description: string): Observable<Problem | null> {
    return this.changeStatus(id, {
      status: 'closed',
      action_description: description
    });
  }

  /**
   * 取消問題
   * Cancel problem
   */
  cancelProblem(id: string, reason: string): Observable<Problem | null> {
    return this.changeStatus(id, {
      status: 'cancelled',
      action_description: `Cancelled: ${reason}`
    });
  }

  /**
   * 延期問題
   * Defer problem
   */
  deferProblem(id: string, reason: string): Observable<Problem | null> {
    return this.changeStatus(id, {
      status: 'deferred',
      action_description: `Deferred: ${reason}`
    });
  }

  /**
   * 刪除問題
   * Delete problem
   */
  deleteProblem(id: string): Observable<boolean> {
    return this.repository.softDelete(id).pipe(
      map(() => {
        this._state.update(state => ({
          ...state,
          problems: state.problems.filter(p => p.id !== id),
          total: state.total - 1,
          selectedProblem: state.selectedProblem?.id === id ? null : state.selectedProblem
        }));
        return true;
      }),
      catchError(error => {
        console.error('[ProblemService] deleteProblem error:', error);
        return of(false);
      })
    );
  }

  // ============================================================================
  // Comment Operations
  // ============================================================================

  /**
   * 取得評論
   * Get comments
   */
  getComments(problemId: string): Observable<ProblemComment[]> {
    return this.repository.findCommentsByProblem(problemId);
  }

  /**
   * 新增評論
   * Add comment
   */
  addComment(problemId: string, content: string, parentId?: string): Observable<ProblemComment | null> {
    const userId = this.settings.user?.['id'];
    if (!userId) {
      console.error('[ProblemService] No user ID for addComment');
      return of(null);
    }

    return this.repository.createComment(problemId, content, userId, parentId).pipe(
      tap(comment => {
        if (comment) {
          this._commentAdded.next(comment);
          if (this._state().selectedProblem?.id === problemId) {
            this._state.update(state => ({
              ...state,
              selectedProblem: state.selectedProblem
                ? {
                    ...state.selectedProblem,
                    comments: [...(state.selectedProblem.comments || []), comment]
                  }
                : null
            }));
          }
        }
      }),
      catchError(error => {
        console.error('[ProblemService] addComment error:', error);
        return of(null);
      })
    );
  }

  /**
   * 更新評論
   * Update comment
   */
  updateComment(id: string, content: string): Observable<ProblemComment | null> {
    return this.repository.updateComment(id, content).pipe(
      tap(comment => {
        if (comment && this._state().selectedProblem) {
          this._state.update(state => ({
            ...state,
            selectedProblem: state.selectedProblem
              ? {
                  ...state.selectedProblem,
                  comments: state.selectedProblem.comments?.map(c => (c.id === id ? comment : c))
                }
              : null
          }));
        }
      }),
      catchError(error => {
        console.error('[ProblemService] updateComment error:', error);
        return of(null);
      })
    );
  }

  /**
   * 刪除評論
   * Delete comment
   */
  deleteComment(id: string): Observable<boolean> {
    return this.repository.softDeleteComment(id).pipe(
      tap(success => {
        if (success) {
          this._state.update(state => ({
            ...state,
            selectedProblem: state.selectedProblem
              ? {
                  ...state.selectedProblem,
                  comments: state.selectedProblem.comments?.filter(c => c.id !== id)
                }
              : null
          }));
        }
      }),
      catchError(error => {
        console.error('[ProblemService] deleteComment error:', error);
        return of(false);
      })
    );
  }

  // ============================================================================
  // Attachment Operations
  // ============================================================================

  /**
   * 上傳問題附件
   * Upload problem attachment
   */
  uploadAttachment(
    problemId: string,
    fileName: string,
    filePath: string,
    options: { fileSize?: number; mimeType?: string; caption?: string; attachmentType?: string } = {}
  ): Observable<ProblemAttachment | null> {
    const userId = this.settings.user?.['id'];
    if (!userId) {
      console.error('[ProblemService] No user ID for uploadAttachment');
      return of(null);
    }

    return this.repository.createAttachment(problemId, fileName, filePath, userId, options).pipe(
      tap(attachment => {
        if (attachment && this._state().selectedProblem) {
          this._state.update(state => ({
            ...state,
            selectedProblem: state.selectedProblem
              ? {
                  ...state.selectedProblem,
                  attachments: [...(state.selectedProblem.attachments || []), attachment]
                }
              : null
          }));
        }
      }),
      catchError(error => {
        console.error('[ProblemService] uploadAttachment error:', error);
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
            selectedProblem: state.selectedProblem
              ? {
                  ...state.selectedProblem,
                  attachments: state.selectedProblem.attachments?.filter(a => a.id !== id)
                }
              : null
          }));
        }
      }),
      catchError(error => {
        console.error('[ProblemService] deleteAttachment error:', error);
        return of(false);
      })
    );
  }

  // ============================================================================
  // Statistics Operations
  // ============================================================================

  /**
   * 載入統計資料
   * Load statistics
   */
  loadStats(blueprintId: string): void {
    this.repository
      .getStatsByBlueprint(blueprintId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: stats => {
          this.updateState({ stats });
        },
        error: error => {
          console.error('[ProblemService] loadStats error:', error);
        }
      });
  }

  /**
   * 取得統計資料
   * Get statistics
   */
  getStats(blueprintId: string): Observable<ProblemStats> {
    return this.repository.getStatsByBlueprint(blueprintId);
  }

  // ============================================================================
  // Knowledge Base Operations
  // ============================================================================

  /**
   * 標記為知識庫
   * Mark as knowledge base
   */
  markAsKnowledgeBase(id: string, tags: string[]): Observable<Problem | null> {
    return this.updateProblem(id, {
      knowledge_base: true,
      knowledge_tags: tags
    });
  }

  /**
   * 取消知識庫標記
   * Unmark as knowledge base
   */
  unmarkAsKnowledgeBase(id: string): Observable<Problem | null> {
    return this.updateProblem(id, {
      knowledge_base: false,
      knowledge_tags: null
    });
  }

  /**
   * 查詢知識庫
   * Search knowledge base
   */
  searchKnowledgeBase(blueprintId?: string, tags?: string[]): Observable<Problem[]> {
    return this.repository.findKnowledgeBase(blueprintId, tags);
  }

  // ============================================================================
  // Selection & State
  // ============================================================================

  /**
   * 清除選擇
   * Clear selection
   */
  clearSelection(): void {
    this.updateState({ selectedProblem: null });
  }

  /**
   * 重新載入
   * Reload
   */
  reload(): void {
    this.loadProblems(this._state().filters);
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
  getStatusConfig(status: ProblemStatus) {
    return PROBLEM_STATUS_CONFIG[status];
  }

  /**
   * 取得類型配置
   * Get type configuration
   */
  getTypeConfig(type: ProblemType) {
    return PROBLEM_TYPE_CONFIG[type];
  }

  /**
   * 取得優先級配置
   * Get priority configuration
   */
  getPriorityConfig(priority: ProblemPriority) {
    return PROBLEM_PRIORITY_CONFIG[priority];
  }

  /**
   * 取得嚴重程度配置
   * Get severity configuration
   */
  getSeverityConfig(severity: ProblemSeverity) {
    return PROBLEM_SEVERITY_CONFIG[severity];
  }

  /**
   * 取得來源配置
   * Get source configuration
   */
  getSourceConfig(source: string) {
    return PROBLEM_SOURCE_CONFIG[source as keyof typeof PROBLEM_SOURCE_CONFIG];
  }

  /**
   * 取得有效的狀態轉換
   * Get valid status transitions
   */
  getValidTransitions(currentStatus: ProblemStatus): ProblemStatus[] {
    return VALID_STATUS_TRANSITIONS[currentStatus] || [];
  }

  /**
   * 檢查是否可以轉換狀態
   * Check if can transition to status
   */
  canTransitionTo(currentStatus: ProblemStatus, targetStatus: ProblemStatus): boolean {
    return this.getValidTransitions(currentStatus).includes(targetStatus);
  }

  /**
   * 計算問題處理時間
   * Calculate resolution time
   */
  getResolutionTime(problem: Problem): number | null {
    return calculateResolutionTime(problem);
  }

  /**
   * 檢查問題是否逾期
   * Check if problem is overdue
   */
  checkOverdue(problem: Problem): boolean {
    return isOverdue(problem);
  }

  /**
   * 更新狀態
   * Update state
   */
  private updateState(partial: Partial<ProblemState>): void {
    this._state.update(state => ({ ...state, ...partial }));
  }
}
