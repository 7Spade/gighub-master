/**
 * Quality Control Service
 *
 * 品質控制服務 - 品管檢查管理
 * Quality Control service with Signals
 *
 * Features:
 * - QC inspection management
 * - Inspection item tracking
 * - Pass/fail statistics
 * - Integration with task and diary modules
 *
 * @module shared/services/qc
 */

import { Injectable, inject, computed, signal, DestroyRef } from '@angular/core';
import { LoggerService } from '../../../core/logger/logger.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SettingsService } from '@delon/theme';
import { Observable, catchError, of, tap, Subject, switchMap, forkJoin } from 'rxjs';

import { QcRepository } from '../../../core/infra/repositories/qc';
import {
  QcInspection,
  QcInspectionItem,
  QcInspectionAttachment,
  QcInspectionWithDetails,
  QcInspectionQueryOptions,
  CreateQcInspectionRequest,
  UpdateQcInspectionRequest,
  CreateQcInspectionItemRequest,
  UpdateQcInspectionItemRequest,
  QcInspectionStatus,
  QcItemStatus,
  QC_INSPECTION_STATUS_CONFIG,
  QC_INSPECTION_TYPE_CONFIG,
  QC_ITEM_STATUS_CONFIG,
  calculatePassRate,
  determineInspectionStatus
} from '../../../core/infra/types/qc';

/**
 * 品管狀態
 */
interface QcState {
  inspections: QcInspection[];
  selectedInspection: QcInspectionWithDetails | null;
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  currentBlueprintId: string | null;
  filters: QcInspectionQueryOptions;
}

const initialState: QcState = {
  inspections: [],
  selectedInspection: null,
  loading: false,
  error: null,
  hasMore: false,
  total: 0,
  currentBlueprintId: null,
  filters: {}
};

@Injectable({ providedIn: 'root' })
export class QcService {
  private readonly repository = inject(QcRepository);
  private readonly logger = inject(LoggerService);
  private readonly settings = inject(SettingsService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // State Management (Signals)
  // ============================================================================

  private readonly _state = signal<QcState>(initialState);

  // Public computed signals
  readonly inspections = computed(() => this._state().inspections);
  readonly selectedInspection = computed(() => this._state().selectedInspection);
  readonly loading = computed(() => this._state().loading);
  readonly error = computed(() => this._state().error);
  readonly hasMore = computed(() => this._state().hasMore);
  readonly total = computed(() => this._state().total);
  readonly isEmpty = computed(() => this._state().inspections.length === 0);
  readonly filters = computed(() => this._state().filters);
  readonly currentBlueprintId = computed(() => this._state().currentBlueprintId);

  // Derived computed signals
  readonly pendingInspections = computed(() => this.inspections().filter(i => i.status === 'pending' || i.status === 'in_progress'));

  readonly completedInspections = computed(() =>
    this.inspections().filter(i => i.status === 'passed' || i.status === 'failed' || i.status === 'conditionally_passed')
  );

  // Event subjects
  private readonly _inspectionCreated = new Subject<QcInspection>();
  private readonly _inspectionUpdated = new Subject<QcInspection>();
  private readonly _itemUpdated = new Subject<QcInspectionItem>();

  readonly inspectionCreated$ = this._inspectionCreated.asObservable();
  readonly inspectionUpdated$ = this._inspectionUpdated.asObservable();
  readonly itemUpdated$ = this._itemUpdated.asObservable();

  // ============================================================================
  // Inspection Operations
  // ============================================================================

  /**
   * 載入品管檢查列表
   * Load QC inspections
   */
  loadInspections(options: QcInspectionQueryOptions = {}): void {
    this.updateState({ loading: true, error: null, filters: options });

    this.repository
      .query(options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.updateState({
            inspections: result.data,
            total: result.total,
            hasMore: result.hasMore,
            loading: false
          });
        },
        error: error => {
          this.logger.error('QcService - Failed to load inspections', error);
          this.updateState({
            error: 'Failed to load inspections',
            loading: false
          });
        }
      });
  }

  /**
   * 載入藍圖的品管檢查
   * Load blueprint QC inspections
   */
  loadByBlueprint(blueprintId: string, options: Partial<QcInspectionQueryOptions> = {}): void {
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
        next: inspections => {
          this.updateState({
            inspections,
            loading: false
          });
        },
        error: error => {
          this.logger.error('QcService - Failed to load inspections by blueprint', error);
          this.updateState({
            error: 'Failed to load blueprint inspections',
            loading: false
          });
        }
      });
  }

  /**
   * 載入任務的品管檢查
   * Load task QC inspections
   */
  loadByTask(taskId: string): Observable<QcInspection[]> {
    return this.repository.findByTask(taskId);
  }

  /**
   * 選擇品管檢查（含詳細資料）
   * Select QC inspection with details
   */
  selectInspection(id: string): void {
    this.updateState({ loading: true, error: null });

    this.repository
      .findByIdWithDetails(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: inspection => {
          this.updateState({
            selectedInspection: inspection,
            loading: false
          });
        },
        error: error => {
          this.logger.error('QcService - Failed to select inspection', error);
          this.updateState({
            error: 'Failed to load inspection details',
            loading: false
          });
        }
      });
  }

  /**
   * 建立品管檢查
   * Create QC inspection
   */
  createInspection(request: CreateQcInspectionRequest): Observable<QcInspection | null> {
    const userId = this.settings.user?.['id'];
    if (!userId) {
      this.logger.error('QcService - No user ID for createInspection');
      return of(null);
    }

    return this.repository.create(request, userId).pipe(
      tap(inspection => {
        if (inspection) {
          this._inspectionCreated.next(inspection);
          // Add to current list
          this._state.update(state => ({
            ...state,
            inspections: [inspection, ...state.inspections],
            total: state.total + 1
          }));
        }
      }),
      catchError(error => {
        this.logger.error('QcService - Failed to create inspection', error);
        return of(null);
      })
    );
  }

  /**
   * 建立品管檢查（含項目）
   * Create QC inspection with items
   */
  createInspectionWithItems(
    request: CreateQcInspectionRequest,
    items: Array<Omit<CreateQcInspectionItemRequest, 'inspection_id'>>
  ): Observable<QcInspectionWithDetails | null> {
    return this.createInspection(request).pipe(
      switchMap(inspection => {
        if (!inspection) return of(null);

        if (items.length === 0) {
          return this.repository.findByIdWithDetails(inspection.id);
        }

        const itemRequests = items.map((item, index) => ({
          ...item,
          inspection_id: inspection.id,
          sort_order: item.sort_order ?? index
        }));

        return this.repository.createItemsBatch(itemRequests).pipe(switchMap(() => this.repository.findByIdWithDetails(inspection.id)));
      }),
      tap(inspection => {
        if (inspection) {
          this.updateState({
            selectedInspection: inspection,
            total: this._state().total + (items.length || 0)
          });
        }
      }),
      catchError(error => {
        this.logger.error('QcService - Failed to create inspection with items', error);
        return of(null);
      })
    );
  }

  /**
   * 更新品管檢查
   * Update QC inspection
   */
  updateInspection(id: string, updates: UpdateQcInspectionRequest): Observable<QcInspection | null> {
    return this.repository.update(id, updates).pipe(
      tap(inspection => {
        if (inspection) {
          this._inspectionUpdated.next(inspection);
          // Update in list
          this._state.update(state => ({
            ...state,
            inspections: state.inspections.map(i => (i.id === id ? inspection : i)),
            selectedInspection:
              state.selectedInspection?.id === id ? { ...state.selectedInspection, ...inspection } : state.selectedInspection
          }));
        }
      }),
      catchError(error => {
        this.logger.error('QcService - Failed to update inspection', error);
        return of(null);
      })
    );
  }

  /**
   * 開始品管檢查
   * Start QC inspection
   */
  startInspection(id: string): Observable<QcInspection | null> {
    return this.repository.updateStatus(id, 'in_progress');
  }

  /**
   * 完成品管檢查
   * Complete QC inspection
   */
  completeInspection(id: string): Observable<QcInspection | null> {
    // Get items to calculate pass/fail
    return this.repository.findItemsByInspection(id).pipe(
      switchMap(items => {
        const passedCount = items.filter(i => i.status === 'passed').length;
        const failedCount = items.filter(i => i.status === 'failed').length;
        const totalCount = items.filter(i => i.status !== 'na').length;
        const passRate = calculatePassRate(passedCount, totalCount);
        const hasFailedItems = failedCount > 0;
        const status = determineInspectionStatus(passRate, hasFailedItems);

        return this.repository.update(id, {
          status,
          inspection_date: new Date().toISOString()
        } as UpdateQcInspectionRequest);
      }),
      tap(inspection => {
        if (inspection) {
          this._inspectionUpdated.next(inspection);
        }
      }),
      catchError(error => {
        this.logger.error('QcService - Failed to complete inspection', error);
        return of(null);
      })
    );
  }

  /**
   * 刪除品管檢查
   * Delete QC inspection
   */
  deleteInspection(id: string): Observable<boolean> {
    return this.repository.softDelete(id).pipe(
      tap(result => {
        if (result) {
          this._state.update(state => ({
            ...state,
            inspections: state.inspections.filter(i => i.id !== id),
            total: state.total - 1,
            selectedInspection: state.selectedInspection?.id === id ? null : state.selectedInspection
          }));
        }
      }),
      map(() => true),
      catchError(error => {
        this.logger.error('QcService - Failed to delete inspection', error);
        return of(false);
      })
    );
  }

  // ============================================================================
  // Inspection Item Operations
  // ============================================================================

  /**
   * 載入檢查項目
   * Load inspection items
   */
  loadItems(inspectionId: string): Observable<QcInspectionItem[]> {
    return this.repository.findItemsByInspection(inspectionId);
  }

  /**
   * 建立檢查項目
   * Create inspection item
   */
  createItem(request: CreateQcInspectionItemRequest): Observable<QcInspectionItem | null> {
    return this.repository.createItem(request).pipe(
      tap(item => {
        if (item && this._state().selectedInspection?.id === request.inspection_id) {
          this._state.update(state => ({
            ...state,
            selectedInspection: state.selectedInspection
              ? {
                  ...state.selectedInspection,
                  items: [...(state.selectedInspection.items || []), item]
                }
              : null
          }));
        }
      }),
      catchError(error => {
        this.logger.error('QcService - Failed to create item', error);
        return of(null);
      })
    );
  }

  /**
   * 更新檢查項目
   * Update inspection item
   */
  updateItem(id: string, updates: UpdateQcInspectionItemRequest): Observable<QcInspectionItem | null> {
    const userId = this.settings.user?.['id'];

    return this.repository.updateItem(id, updates, userId).pipe(
      tap(item => {
        if (item) {
          this._itemUpdated.next(item);
          // Update in selected inspection
          this._state.update(state => ({
            ...state,
            selectedInspection: state.selectedInspection
              ? {
                  ...state.selectedInspection,
                  items: state.selectedInspection.items?.map(i => (i.id === id ? item : i))
                }
              : null
          }));
        }
      }),
      catchError(error => {
        this.logger.error('QcService - Failed to update item', error);
        return of(null);
      })
    );
  }

  /**
   * 檢查項目通過
   * Mark item as passed
   */
  passItem(id: string, actualValue?: string, notes?: string): Observable<QcInspectionItem | null> {
    return this.updateItem(id, {
      status: 'passed' as QcItemStatus,
      actual_value: actualValue,
      notes
    });
  }

  /**
   * 檢查項目不合格
   * Mark item as failed
   */
  failItem(id: string, actualValue?: string, deviation?: string, notes?: string): Observable<QcInspectionItem | null> {
    return this.updateItem(id, {
      status: 'failed' as QcItemStatus,
      actual_value: actualValue,
      deviation,
      notes
    });
  }

  /**
   * 刪除檢查項目
   * Delete inspection item
   */
  deleteItem(id: string): Observable<boolean> {
    return this.repository.deleteItem(id).pipe(
      tap(success => {
        if (success) {
          this._state.update(state => ({
            ...state,
            selectedInspection: state.selectedInspection
              ? {
                  ...state.selectedInspection,
                  items: state.selectedInspection.items?.filter(i => i.id !== id)
                }
              : null
          }));
        }
      }),
      catchError(error => {
        this.logger.error('QcService - Failed to delete item', error);
        return of(false);
      })
    );
  }

  // ============================================================================
  // Attachment Operations
  // ============================================================================

  /**
   * 上傳檢查附件
   * Upload inspection attachment
   */
  uploadAttachment(
    inspectionId: string | null,
    itemId: string | null,
    fileName: string,
    filePath: string,
    options: { fileSize?: number; mimeType?: string; caption?: string } = {}
  ): Observable<QcInspectionAttachment | null> {
    const userId = this.settings.user?.['id'];
    if (!userId) {
      this.logger.error('QcService - No user ID for uploadAttachment');
      return of(null);
    }

    return this.repository.createAttachment(inspectionId, itemId, fileName, filePath, userId, options).pipe(
      tap(attachment => {
        if (attachment && this._state().selectedInspection) {
          this._state.update(state => ({
            ...state,
            selectedInspection: state.selectedInspection
              ? {
                  ...state.selectedInspection,
                  attachments: [...(state.selectedInspection.attachments || []), attachment]
                }
              : null
          }));
        }
      }),
      catchError(error => {
        this.logger.error('QcService - Failed to upload attachment', error);
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
            selectedInspection: state.selectedInspection
              ? {
                  ...state.selectedInspection,
                  attachments: state.selectedInspection.attachments?.filter(a => a.id !== id)
                }
              : null
          }));
        }
      }),
      catchError(error => {
        this.logger.error(`QcService - Failed to delete attachment ${id}`, error);
        return of(false);
      })
    );
  }

  // ============================================================================
  // Statistics Operations
  // ============================================================================

  /**
   * 取得品管統計
   * Get QC statistics
   */
  getStats(blueprintId: string): Observable<{
    total: number;
    passed: number;
    failed: number;
    pending: number;
    avgPassRate: number;
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
    this.updateState({ selectedInspection: null });
  }

  /**
   * 重新載入
   * Reload
   */
  reload(): void {
    this.loadInspections(this._state().filters);
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
  getStatusConfig(status: QcInspectionStatus) {
    return QC_INSPECTION_STATUS_CONFIG[status];
  }

  /**
   * 取得類型配置
   * Get type configuration
   */
  getTypeConfig(type: string) {
    return QC_INSPECTION_TYPE_CONFIG[type as keyof typeof QC_INSPECTION_TYPE_CONFIG];
  }

  /**
   * 取得項目狀態配置
   * Get item status configuration
   */
  getItemStatusConfig(status: QcItemStatus) {
    return QC_ITEM_STATUS_CONFIG[status];
  }

  /**
   * 更新狀態
   * Update state
   */
  private updateState(partial: Partial<QcState>): void {
    this._state.update(state => ({ ...state, ...partial }));
  }
}

// Helper function for map operator
function map<T, R>(fn: (value: T) => R): (source: Observable<T>) => Observable<R> {
  return (source: Observable<T>) => source.pipe(switchMap(value => of(fn(value))));
}
