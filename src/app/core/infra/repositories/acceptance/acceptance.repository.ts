/**
 * Acceptance Repository
 *
 * 驗收資料存取層
 * Acceptance data access layer
 *
 * Provides CRUD operations for the acceptances, acceptance_approvals,
 * and acceptance_attachments tables using Supabase client.
 *
 * @module core/infra/repositories/acceptance
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import {
  Acceptance,
  AcceptanceApproval,
  AcceptanceAttachment,
  AcceptanceWithDetails,
  AcceptanceQueryOptions,
  AcceptancePageResult,
  CreateAcceptanceRequest,
  UpdateAcceptanceRequest,
  AcceptanceDecisionRequest,
  AcceptanceStatus,
  AcceptanceDecision,
  generateAcceptanceCode,
  getStatusFromDecision
} from '../../types/acceptance';

@Injectable({
  providedIn: 'root'
})
export class AcceptanceRepository {
  private readonly supabase = inject(SupabaseService);

  // ============================================================================
  // Acceptance Query Methods
  // ============================================================================

  /**
   * 根據 ID 查詢驗收記錄
   * Find acceptance by ID
   */
  findById(id: string): Observable<Acceptance | null> {
    return from(this.supabase.client.from('acceptances').select('*').eq('id', id).is('deleted_at', null).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          console.error('[AcceptanceRepository] findById error:', error);
          return null;
        }
        return data as Acceptance;
      })
    );
  }

  /**
   * 根據 ID 查詢驗收記錄（含詳細資料）
   * Find acceptance by ID with details
   */
  findByIdWithDetails(id: string): Observable<AcceptanceWithDetails | null> {
    return from(
      this.supabase.client
        .from('acceptances')
        .select(
          `
          *,
          approvals:acceptance_approvals(*),
          attachments:acceptance_attachments(*),
          applicant:accounts!acceptances_applicant_id_fkey(id, name, avatar_url),
          reviewer:accounts!acceptances_reviewer_id_fkey(id, name, avatar_url),
          approver:accounts!acceptances_approver_id_fkey(id, name, avatar_url),
          qc_inspection:qc_inspections(id, inspection_code, title, status, pass_rate)
        `
        )
        .eq('id', id)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          console.error('[AcceptanceRepository] findByIdWithDetails error:', error);
          return null;
        }
        return data as AcceptanceWithDetails;
      })
    );
  }

  /**
   * 根據藍圖 ID 查詢驗收記錄
   * Find acceptances by blueprint ID
   */
  findByBlueprint(blueprintId: string): Observable<Acceptance[]> {
    return from(
      this.supabase.client
        .from('acceptances')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AcceptanceRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as Acceptance[];
      })
    );
  }

  /**
   * 根據任務 ID 查詢驗收記錄
   * Find acceptances by task ID
   */
  findByTask(taskId: string): Observable<Acceptance[]> {
    return from(
      this.supabase.client
        .from('acceptances')
        .select('*')
        .eq('task_id', taskId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AcceptanceRepository] findByTask error:', error);
          return [];
        }
        return (data || []) as Acceptance[];
      })
    );
  }

  /**
   * 根據品管檢查 ID 查詢驗收記錄
   * Find acceptances by QC inspection ID
   */
  findByQcInspection(qcInspectionId: string): Observable<Acceptance[]> {
    return from(
      this.supabase.client
        .from('acceptances')
        .select('*')
        .eq('qc_inspection_id', qcInspectionId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AcceptanceRepository] findByQcInspection error:', error);
          return [];
        }
        return (data || []) as Acceptance[];
      })
    );
  }

  /**
   * 根據查詢選項查詢驗收記錄
   * Find acceptances with query options
   */
  query(options: AcceptanceQueryOptions): Observable<AcceptancePageResult> {
    let query = this.supabase.client.from('acceptances').select('*', { count: 'exact' });

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.taskId) {
      query = query.eq('task_id', options.taskId);
    }

    if (options.qcInspectionId) {
      query = query.eq('qc_inspection_id', options.qcInspectionId);
    }

    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options.acceptanceType) {
      if (Array.isArray(options.acceptanceType)) {
        query = query.in('acceptance_type', options.acceptanceType);
      } else {
        query = query.eq('acceptance_type', options.acceptanceType);
      }
    }

    if (options.applicantId) {
      query = query.eq('applicant_id', options.applicantId);
    }

    if (options.reviewerId) {
      query = query.eq('reviewer_id', options.reviewerId);
    }

    if (options.approverId) {
      query = query.eq('approver_id', options.approverId);
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
          console.error('[AcceptanceRepository] query error:', error);
          return { data: [], total: 0, hasMore: false };
        }
        const total = count || 0;
        const limit = options.limit || 20;
        const offset = options.offset || 0;
        return {
          data: (data || []) as Acceptance[],
          total,
          hasMore: offset + limit < total
        };
      })
    );
  }

  // ============================================================================
  // Acceptance CRUD Methods
  // ============================================================================

  /**
   * 建立驗收記錄
   * Create a new acceptance
   */
  create(request: CreateAcceptanceRequest, createdBy: string): Observable<Acceptance | null> {
    return from(
      this.supabase.client
        .from('acceptances')
        .insert({
          blueprint_id: request.blueprint_id,
          task_id: request.task_id || null,
          qc_inspection_id: request.qc_inspection_id || null,
          acceptance_code: request.acceptance_code || generateAcceptanceCode(request.acceptance_type),
          title: request.title,
          description: request.description || null,
          acceptance_type: request.acceptance_type || 'interim',
          status: 'pending' as AcceptanceStatus,
          scope: request.scope || null,
          criteria: request.criteria || null,
          applicant_id: request.applicant_id || createdBy,
          reviewer_id: request.reviewer_id || null,
          approver_id: request.approver_id || null,
          applied_at: new Date().toISOString(),
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
          console.error('[AcceptanceRepository] create error:', error);
          return null;
        }
        return data as Acceptance;
      })
    );
  }

  /**
   * 更新驗收記錄
   * Update an acceptance
   */
  update(id: string, updates: UpdateAcceptanceRequest): Observable<Acceptance | null> {
    return from(
      this.supabase.client
        .from('acceptances')
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
          console.error('[AcceptanceRepository] update error:', error);
          return null;
        }
        return data as Acceptance;
      })
    );
  }

  /**
   * 更新驗收狀態
   * Update acceptance status
   */
  updateStatus(id: string, status: AcceptanceStatus): Observable<Acceptance | null> {
    return this.update(id, { status });
  }

  /**
   * 開始驗收流程
   * Start acceptance process
   */
  startAcceptance(id: string): Observable<Acceptance | null> {
    return this.update(id, {
      status: 'in_progress',
      acceptance_date: new Date().toISOString()
    } as UpdateAcceptanceRequest);
  }

  /**
   * 做出驗收決定
   * Make acceptance decision
   */
  makeDecision(id: string, request: AcceptanceDecisionRequest, decidedBy: string): Observable<Acceptance | null> {
    const status = getStatusFromDecision(request.decision);

    return from(
      this.supabase.client
        .from('acceptances')
        .update({
          status,
          decision: request.decision,
          decision_reason: request.decision_reason || null,
          conditions: request.conditions || null,
          approver_id: decidedBy,
          decided_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AcceptanceRepository] makeDecision error:', error);
          return null;
        }
        return data as Acceptance;
      })
    );
  }

  /**
   * 軟刪除驗收記錄
   * Soft delete an acceptance
   */
  softDelete(id: string): Observable<Acceptance | null> {
    return from(
      this.supabase.client
        .from('acceptances')
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
          console.error('[AcceptanceRepository] softDelete error:', error);
          return null;
        }
        return data as Acceptance;
      })
    );
  }

  // ============================================================================
  // Acceptance Approval Methods
  // ============================================================================

  /**
   * 根據驗收 ID 查詢審批記錄
   * Find approvals by acceptance ID
   */
  findApprovalsByAcceptance(acceptanceId: string): Observable<AcceptanceApproval[]> {
    return from(
      this.supabase.client
        .from('acceptance_approvals')
        .select('*')
        .eq('acceptance_id', acceptanceId)
        .order('approval_order', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AcceptanceRepository] findApprovalsByAcceptance error:', error);
          return [];
        }
        return (data || []) as AcceptanceApproval[];
      })
    );
  }

  /**
   * 建立審批記錄
   * Create an approval record
   */
  createApproval(
    acceptanceId: string,
    approverId: string,
    decision: AcceptanceDecision,
    comments?: string
  ): Observable<AcceptanceApproval | null> {
    return from(
      this.supabase.client
        .from('acceptance_approvals')
        .select('approval_order')
        .eq('acceptance_id', acceptanceId)
        .order('approval_order', { ascending: false })
        .limit(1)
    ).pipe(
      switchMap(({ data }) => {
        const nextOrder = (data?.[0]?.approval_order || 0) + 1;
        return from(
          this.supabase.client
            .from('acceptance_approvals')
            .insert({
              acceptance_id: acceptanceId,
              approver_id: approverId,
              decision,
              comments: comments || null,
              approval_order: nextOrder
            })
            .select()
            .single()
        ).pipe(
          map(({ data: approvalData, error }) => {
            if (error) {
              console.error('[AcceptanceRepository] createApproval error:', error);
              return null;
            }
            return approvalData as AcceptanceApproval;
          })
        );
      })
    );
  }

  // ============================================================================
  // Acceptance Attachment Methods
  // ============================================================================

  /**
   * 根據驗收 ID 查詢附件
   * Find attachments by acceptance ID
   */
  findAttachmentsByAcceptance(acceptanceId: string): Observable<AcceptanceAttachment[]> {
    return from(
      this.supabase.client
        .from('acceptance_attachments')
        .select('*')
        .eq('acceptance_id', acceptanceId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AcceptanceRepository] findAttachmentsByAcceptance error:', error);
          return [];
        }
        return (data || []) as AcceptanceAttachment[];
      })
    );
  }

  /**
   * 建立附件記錄
   * Create an attachment record
   */
  createAttachment(
    acceptanceId: string,
    fileName: string,
    filePath: string,
    uploadedBy: string,
    options: { fileSize?: number; mimeType?: string; caption?: string; documentType?: string } = {}
  ): Observable<AcceptanceAttachment | null> {
    return from(
      this.supabase.client
        .from('acceptance_attachments')
        .insert({
          acceptance_id: acceptanceId,
          file_name: fileName,
          file_path: filePath,
          file_size: options.fileSize || null,
          mime_type: options.mimeType || null,
          caption: options.caption || null,
          document_type: options.documentType || null,
          uploaded_by: uploadedBy
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[AcceptanceRepository] createAttachment error:', error);
          return null;
        }
        return data as AcceptanceAttachment;
      })
    );
  }

  /**
   * 刪除附件記錄
   * Delete an attachment record
   */
  deleteAttachment(id: string): Observable<boolean> {
    return from(this.supabase.client.from('acceptance_attachments').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[AcceptanceRepository] deleteAttachment error:', error);
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
   * 取得藍圖的驗收統計
   * Get acceptance statistics for a blueprint
   */
  getStatsByBlueprint(blueprintId: string): Observable<{
    total: number;
    passed: number;
    failed: number;
    pending: number;
    conditionallyPassed: number;
  }> {
    return from(this.supabase.client.from('acceptances').select('status').eq('blueprint_id', blueprintId).is('deleted_at', null)).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          console.error('[AcceptanceRepository] getStatsByBlueprint error:', error);
          return { total: 0, passed: 0, failed: 0, pending: 0, conditionallyPassed: 0 };
        }

        const total = data.length;
        const passed = data.filter(a => a.status === 'passed').length;
        const failed = data.filter(a => a.status === 'failed').length;
        const pending = data.filter(a => a.status === 'pending' || a.status === 'in_progress').length;
        const conditionallyPassed = data.filter(a => a.status === 'conditionally_passed').length;

        return { total, passed, failed, pending, conditionallyPassed };
      })
    );
  }
}
