/**
 * Quality Control Repository
 *
 * 品質控制資料存取層
 * Quality Control data access layer
 *
 * Provides CRUD operations for the qc_inspections, qc_inspection_items,
 * and qc_inspection_attachments tables using Supabase client.
 *
 * @module core/infra/repositories/qc
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { LoggerService } from '../../../logger';
import {
  QcInspection,
  QcInspectionItem,
  QcInspectionAttachment,
  QcInspectionWithDetails,
  QcInspectionQueryOptions,
  QcInspectionPageResult,
  CreateQcInspectionRequest,
  UpdateQcInspectionRequest,
  CreateQcInspectionItemRequest,
  UpdateQcInspectionItemRequest,
  QcInspectionStatus,
  QcItemStatus,
  generateInspectionCode,
  calculatePassRate
} from '../../types/qc';

@Injectable({
  providedIn: 'root'
})
export class QcRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // QC Inspection Query Methods
  // ============================================================================

  /**
   * 根據 ID 查詢品管檢查
   * Find QC inspection by ID
   */
  findById(id: string): Observable<QcInspection | null> {
    return from(this.supabase.client.from('qc_inspections').select('*').eq('id', id).is('deleted_at', null).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          this.logger.error('[QcRepository] findById error:', error);
          return null;
        }
        return data as QcInspection;
      })
    );
  }

  /**
   * 根據 ID 查詢品管檢查（含詳細資料）
   * Find QC inspection by ID with details
   */
  findByIdWithDetails(id: string): Observable<QcInspectionWithDetails | null> {
    return from(
      this.supabase.client
        .from('qc_inspections')
        .select(
          `
          *,
          items:qc_inspection_items(*),
          attachments:qc_inspection_attachments(*),
          inspector:accounts!qc_inspections_inspector_id_fkey(id, name, avatar_url),
          reviewer:accounts!qc_inspections_reviewer_id_fkey(id, name, avatar_url)
        `
        )
        .eq('id', id)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          this.logger.error('[QcRepository] findByIdWithDetails error:', error);
          return null;
        }
        return data as QcInspectionWithDetails;
      })
    );
  }

  /**
   * 根據藍圖 ID 查詢品管檢查
   * Find QC inspections by blueprint ID
   */
  findByBlueprint(blueprintId: string): Observable<QcInspection[]> {
    return from(
      this.supabase.client
        .from('qc_inspections')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as QcInspection[];
      })
    );
  }

  /**
   * 根據任務 ID 查詢品管檢查
   * Find QC inspections by task ID
   */
  findByTask(taskId: string): Observable<QcInspection[]> {
    return from(
      this.supabase.client
        .from('qc_inspections')
        .select('*')
        .eq('task_id', taskId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] findByTask error:', error);
          return [];
        }
        return (data || []) as QcInspection[];
      })
    );
  }

  /**
   * 根據查詢選項查詢品管檢查
   * Find QC inspections with query options
   */
  query(options: QcInspectionQueryOptions): Observable<QcInspectionPageResult> {
    let query = this.supabase.client.from('qc_inspections').select('*', { count: 'exact' });

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.taskId) {
      query = query.eq('task_id', options.taskId);
    }

    if (options.diaryId) {
      query = query.eq('diary_id', options.diaryId);
    }

    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options.inspectionType) {
      if (Array.isArray(options.inspectionType)) {
        query = query.in('inspection_type', options.inspectionType);
      } else {
        query = query.eq('inspection_type', options.inspectionType);
      }
    }

    if (options.inspectorId) {
      query = query.eq('inspector_id', options.inspectorId);
    }

    if (options.startDate) {
      query = query.gte('scheduled_date', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('scheduled_date', options.endDate);
    }

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const orderDirection = options.orderDirection === 'asc';
    query = query.order('created_at', { ascending: orderDirection });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    return from(query).pipe(
      map(({ data, error, count }) => {
        if (error) {
          this.logger.error('[QcRepository] query error:', error);
          return { data: [], total: 0, hasMore: false };
        }
        const total = count || 0;
        const limit = options.limit || 20;
        const offset = options.offset || 0;
        return {
          data: (data || []) as QcInspection[],
          total,
          hasMore: offset + limit < total
        };
      })
    );
  }

  // ============================================================================
  // QC Inspection CRUD Methods
  // ============================================================================

  /**
   * 建立品管檢查
   * Create a new QC inspection
   */
  create(request: CreateQcInspectionRequest, createdBy: string): Observable<QcInspection | null> {
    return from(
      this.supabase.client
        .from('qc_inspections')
        .insert({
          blueprint_id: request.blueprint_id,
          task_id: request.task_id || null,
          diary_id: request.diary_id || null,
          inspection_code: request.inspection_code || generateInspectionCode(),
          title: request.title,
          description: request.description || null,
          inspection_type: request.inspection_type || 'self_check',
          status: 'pending' as QcInspectionStatus,
          inspector_id: request.inspector_id || null,
          reviewer_id: request.reviewer_id || null,
          scheduled_date: request.scheduled_date || null,
          notes: request.notes || null,
          metadata: request.metadata || null,
          created_by: createdBy
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] create error:', error);
          return null;
        }
        return data as QcInspection;
      })
    );
  }

  /**
   * 更新品管檢查
   * Update a QC inspection
   */
  update(id: string, updates: UpdateQcInspectionRequest): Observable<QcInspection | null> {
    return from(
      this.supabase.client
        .from('qc_inspections')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] update error:', error);
          return null;
        }
        return data as QcInspection;
      })
    );
  }

  /**
   * 更新品管檢查狀態
   * Update QC inspection status
   */
  updateStatus(id: string, status: QcInspectionStatus): Observable<QcInspection | null> {
    const updates: UpdateQcInspectionRequest = { status };

    if (status === 'in_progress' || status === 'passed' || status === 'failed' || status === 'conditionally_passed') {
      (updates as Record<string, unknown>)['inspection_date'] = new Date().toISOString();
    }

    return this.update(id, updates);
  }

  /**
   * 完成檢查並更新統計
   * Complete inspection and update statistics
   */
  completeInspection(id: string, status: QcInspectionStatus): Observable<QcInspection | null> {
    return from(this.supabase.client.from('qc_inspection_items').select('status').eq('inspection_id', id)).pipe(
      switchMap(({ data: items }) => {
        const passedCount = items?.filter(i => i.status === 'passed').length || 0;
        const failedCount = items?.filter(i => i.status === 'failed').length || 0;
        const totalCount = items?.filter(i => i.status !== 'na').length || 0;
        const passRate = calculatePassRate(passedCount, totalCount);

        return from(
          this.supabase.client
            .from('qc_inspections')
            .update({
              status,
              passed_count: passedCount,
              failed_count: failedCount,
              total_count: totalCount,
              pass_rate: passRate,
              inspection_date: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single()
        ).pipe(
          map(({ data, error }) => {
            if (error) {
              this.logger.error('[QcRepository] completeInspection error:', error);
              return null;
            }
            return data as QcInspection;
          })
        );
      })
    );
  }

  /**
   * 軟刪除品管檢查
   * Soft delete a QC inspection
   */
  softDelete(id: string): Observable<QcInspection | null> {
    return from(
      this.supabase.client
        .from('qc_inspections')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] softDelete error:', error);
          return null;
        }
        return data as QcInspection;
      })
    );
  }

  // ============================================================================
  // QC Inspection Item Methods
  // ============================================================================

  /**
   * 根據檢查 ID 查詢項目
   * Find items by inspection ID
   */
  findItemsByInspection(inspectionId: string): Observable<QcInspectionItem[]> {
    return from(
      this.supabase.client
        .from('qc_inspection_items')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('sort_order', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] findItemsByInspection error:', error);
          return [];
        }
        return (data || []) as QcInspectionItem[];
      })
    );
  }

  /**
   * 建立檢查項目
   * Create an inspection item
   */
  createItem(request: CreateQcInspectionItemRequest): Observable<QcInspectionItem | null> {
    return from(
      this.supabase.client
        .from('qc_inspection_items')
        .insert({
          inspection_id: request.inspection_id,
          item_code: request.item_code || `ITEM-${Date.now().toString(36).toUpperCase()}`,
          title: request.title,
          description: request.description || null,
          standard: request.standard || null,
          status: 'pending' as QcItemStatus,
          expected_value: request.expected_value || null,
          weight: request.weight ?? 1.0,
          sort_order: request.sort_order ?? 0
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] createItem error:', error);
          return null;
        }
        return data as QcInspectionItem;
      })
    );
  }

  /**
   * 更新檢查項目
   * Update an inspection item
   */
  updateItem(id: string, updates: UpdateQcInspectionItemRequest, checkedBy?: string): Observable<QcInspectionItem | null> {
    const updateData: Record<string, unknown> = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.status && updates.status !== 'pending') {
      updateData['checked_at'] = new Date().toISOString();
      if (checkedBy) {
        updateData['checked_by'] = checkedBy;
      }
    }

    return from(this.supabase.client.from('qc_inspection_items').update(updateData).eq('id', id).select().single()).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] updateItem error:', error);
          return null;
        }
        return data as QcInspectionItem;
      })
    );
  }

  /**
   * 刪除檢查項目
   * Delete an inspection item
   */
  deleteItem(id: string): Observable<boolean> {
    return from(this.supabase.client.from('qc_inspection_items').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[QcRepository] deleteItem error:', error);
          return false;
        }
        return true;
      })
    );
  }

  /**
   * 批量建立檢查項目
   * Batch create inspection items
   */
  createItemsBatch(items: CreateQcInspectionItemRequest[]): Observable<QcInspectionItem[]> {
    const insertData = items.map((item, index) => ({
      inspection_id: item.inspection_id,
      item_code: item.item_code || `ITEM-${index + 1}`,
      title: item.title,
      description: item.description || null,
      standard: item.standard || null,
      status: 'pending' as QcItemStatus,
      expected_value: item.expected_value || null,
      weight: item.weight ?? 1.0,
      sort_order: item.sort_order ?? index
    }));

    return from(this.supabase.client.from('qc_inspection_items').insert(insertData).select()).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] createItemsBatch error:', error);
          return [];
        }
        return (data || []) as QcInspectionItem[];
      })
    );
  }

  // ============================================================================
  // QC Inspection Attachment Methods
  // ============================================================================

  /**
   * 根據檢查 ID 查詢附件
   * Find attachments by inspection ID
   */
  findAttachmentsByInspection(inspectionId: string): Observable<QcInspectionAttachment[]> {
    return from(
      this.supabase.client
        .from('qc_inspection_attachments')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] findAttachmentsByInspection error:', error);
          return [];
        }
        return (data || []) as QcInspectionAttachment[];
      })
    );
  }

  /**
   * 根據項目 ID 查詢附件
   * Find attachments by item ID
   */
  findAttachmentsByItem(itemId: string): Observable<QcInspectionAttachment[]> {
    return from(
      this.supabase.client.from('qc_inspection_attachments').select('*').eq('item_id', itemId).order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] findAttachmentsByItem error:', error);
          return [];
        }
        return (data || []) as QcInspectionAttachment[];
      })
    );
  }

  /**
   * 建立附件記錄
   * Create an attachment record
   */
  createAttachment(
    inspectionId: string | null,
    itemId: string | null,
    fileName: string,
    filePath: string,
    uploadedBy: string,
    options: { fileSize?: number; mimeType?: string; caption?: string } = {}
  ): Observable<QcInspectionAttachment | null> {
    return from(
      this.supabase.client
        .from('qc_inspection_attachments')
        .insert({
          inspection_id: inspectionId,
          item_id: itemId,
          file_name: fileName,
          file_path: filePath,
          file_size: options.fileSize || null,
          mime_type: options.mimeType || null,
          caption: options.caption || null,
          uploaded_by: uploadedBy
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[QcRepository] createAttachment error:', error);
          return null;
        }
        return data as QcInspectionAttachment;
      })
    );
  }

  /**
   * 刪除附件記錄
   * Delete an attachment record
   */
  deleteAttachment(id: string): Observable<boolean> {
    return from(this.supabase.client.from('qc_inspection_attachments').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[QcRepository] deleteAttachment error:', error);
          return false;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // Statistics Methods
  // ============================================================================

  /**
   * 取得藍圖的品管統計
   * Get QC statistics for a blueprint
   */
  getStatsByBlueprint(blueprintId: string): Observable<{
    total: number;
    passed: number;
    failed: number;
    pending: number;
    avgPassRate: number;
  }> {
    return from(
      this.supabase.client.from('qc_inspections').select('status, pass_rate').eq('blueprint_id', blueprintId).is('deleted_at', null)
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          this.logger.error('[QcRepository] getStatsByBlueprint error:', error);
          return { total: 0, passed: 0, failed: 0, pending: 0, avgPassRate: 0 };
        }

        const total = data.length;
        const passed = data.filter(i => i.status === 'passed').length;
        const failed = data.filter(i => i.status === 'failed').length;
        const pending = data.filter(i => i.status === 'pending' || i.status === 'in_progress').length;
        const avgPassRate = total > 0 ? data.reduce((sum, i) => sum + (i.pass_rate || 0), 0) / total : 0;

        return { total, passed, failed, pending, avgPassRate: Math.round(avgPassRate * 100) / 100 };
      })
    );
  }
}
