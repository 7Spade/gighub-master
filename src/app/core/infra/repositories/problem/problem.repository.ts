/**
 * Problem Repository
 *
 * 問題管理資料存取層
 * Problem management data access layer
 *
 * Provides CRUD operations for the problems, problem_actions,
 * problem_comments, and problem_attachments tables using Supabase client.
 *
 * @module core/infra/repositories/problem
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map, of, switchMap } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import { LoggerService } from '../../../logger';
import {
  Problem,
  ProblemAction,
  ProblemComment,
  ProblemAttachment,
  ProblemWithDetails,
  ProblemQueryOptions,
  ProblemPageResult,
  ProblemStats,
  CreateProblemRequest,
  UpdateProblemRequest,
  ProblemStatusChangeRequest,
  ProblemStatus,
  ProblemType,
  ProblemPriority,
  ProblemSeverity,
  generateProblemCode,
  isValidStatusTransition
} from '../../types/problem';

@Injectable({
  providedIn: 'root'
})
export class ProblemRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // Problem Query Methods
  // ============================================================================

  /**
   * 根據 ID 查詢問題
   * Find problem by ID
   */
  findById(id: string): Observable<Problem | null> {
    return from(this.supabase.client.from('problems').select('*').eq('id', id).is('deleted_at', null).single()).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          this.logger.error('[ProblemRepository] findById error:', error);
          return null;
        }
        return data as Problem;
      })
    );
  }

  /**
   * 根據 ID 查詢問題（含詳細資料）
   * Find problem by ID with details
   */
  findByIdWithDetails(id: string): Observable<ProblemWithDetails | null> {
    return from(
      this.supabase.client
        .from('problems')
        .select(
          `
          *,
          actions:problem_actions(*),
          comments:problem_comments(*),
          attachments:problem_attachments(*),
          reporter:accounts!problems_reporter_id_fkey(id, name, avatar_url),
          assignee:accounts!problems_assignee_id_fkey(id, name, avatar_url),
          verifier:accounts!problems_verifier_id_fkey(id, name, avatar_url)
        `
        )
        .eq('id', id)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          this.logger.error('[ProblemRepository] findByIdWithDetails error:', error);
          return null;
        }
        return data as ProblemWithDetails;
      })
    );
  }

  /**
   * 根據藍圖 ID 查詢問題
   * Find problems by blueprint ID
   */
  findByBlueprint(blueprintId: string): Observable<Problem[]> {
    return from(
      this.supabase.client
        .from('problems')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as Problem[];
      })
    );
  }

  /**
   * 根據任務 ID 查詢問題
   * Find problems by task ID
   */
  findByTask(taskId: string): Observable<Problem[]> {
    return from(
      this.supabase.client
        .from('problems')
        .select('*')
        .eq('task_id', taskId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findByTask error:', error);
          return [];
        }
        return (data || []) as Problem[];
      })
    );
  }

  /**
   * 根據品管檢查 ID 查詢問題
   * Find problems by QC inspection ID
   */
  findByQcInspection(qcInspectionId: string): Observable<Problem[]> {
    return from(
      this.supabase.client
        .from('problems')
        .select('*')
        .eq('qc_inspection_id', qcInspectionId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findByQcInspection error:', error);
          return [];
        }
        return (data || []) as Problem[];
      })
    );
  }

  /**
   * 根據驗收 ID 查詢問題
   * Find problems by acceptance ID
   */
  findByAcceptance(acceptanceId: string): Observable<Problem[]> {
    return from(
      this.supabase.client
        .from('problems')
        .select('*')
        .eq('acceptance_id', acceptanceId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findByAcceptance error:', error);
          return [];
        }
        return (data || []) as Problem[];
      })
    );
  }

  /**
   * 根據負責人查詢問題
   * Find problems by assignee
   */
  findByAssignee(assigneeId: string): Observable<Problem[]> {
    return from(
      this.supabase.client
        .from('problems')
        .select('*')
        .eq('assignee_id', assigneeId)
        .is('deleted_at', null)
        .not('status', 'in', '("closed","cancelled")')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findByAssignee error:', error);
          return [];
        }
        return (data || []) as Problem[];
      })
    );
  }

  /**
   * 查詢高風險問題
   * Find high-risk problems
   */
  findHighRisk(blueprintId: string): Observable<Problem[]> {
    return from(
      this.supabase.client
        .from('problems')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .eq('risk_flag', true)
        .is('deleted_at', null)
        .not('status', 'in', '("closed","cancelled")')
        .order('priority', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findHighRisk error:', error);
          return [];
        }
        return (data || []) as Problem[];
      })
    );
  }

  /**
   * 根據查詢選項查詢問題
   * Find problems with query options
   */
  query(options: ProblemQueryOptions): Observable<ProblemPageResult> {
    let query = this.supabase.client.from('problems').select('*', { count: 'exact' });

    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }

    if (options.taskId) {
      query = query.eq('task_id', options.taskId);
    }

    if (options.qcInspectionId) {
      query = query.eq('qc_inspection_id', options.qcInspectionId);
    }

    if (options.acceptanceId) {
      query = query.eq('acceptance_id', options.acceptanceId);
    }

    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }

    if (options.problemType) {
      if (Array.isArray(options.problemType)) {
        query = query.in('problem_type', options.problemType);
      } else {
        query = query.eq('problem_type', options.problemType);
      }
    }

    if (options.source) {
      if (Array.isArray(options.source)) {
        query = query.in('source', options.source);
      } else {
        query = query.eq('source', options.source);
      }
    }

    if (options.priority) {
      if (Array.isArray(options.priority)) {
        query = query.in('priority', options.priority);
      } else {
        query = query.eq('priority', options.priority);
      }
    }

    if (options.severity) {
      if (Array.isArray(options.severity)) {
        query = query.in('severity', options.severity);
      } else {
        query = query.eq('severity', options.severity);
      }
    }

    if (options.riskFlag !== undefined) {
      query = query.eq('risk_flag', options.riskFlag);
    }

    if (options.assigneeId) {
      query = query.eq('assignee_id', options.assigneeId);
    }

    if (options.reporterId) {
      query = query.eq('reporter_id', options.reporterId);
    }

    if (options.knowledgeBase !== undefined) {
      query = query.eq('knowledge_base', options.knowledgeBase);
    }

    if (options.startDate) {
      query = query.gte('reported_at', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('reported_at', options.endDate);
    }

    if (options.searchKeyword) {
      query = query.or(`title.ilike.%${options.searchKeyword}%,description.ilike.%${options.searchKeyword}%`);
    }

    if (!options.includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const orderBy = options.orderBy || 'created_at';
    const orderDirection = options.orderDirection === 'asc';
    query = query.order(orderBy, { ascending: orderDirection });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
    }

    return from(query).pipe(
      map(({ data, error, count }) => {
        if (error) {
          this.logger.error('[ProblemRepository] query error:', error);
          return { data: [], total: 0, hasMore: false };
        }
        const total = count || 0;
        const limit = options.limit || 20;
        const offset = options.offset || 0;
        return {
          data: (data || []) as Problem[],
          total,
          hasMore: offset + limit < total
        };
      })
    );
  }

  // ============================================================================
  // Problem CRUD Methods
  // ============================================================================

  /**
   * 建立問題
   * Create a new problem
   */
  create(request: CreateProblemRequest, createdBy: string): Observable<Problem | null> {
    return from(
      this.supabase.client
        .from('problems')
        .insert({
          blueprint_id: request.blueprint_id,
          task_id: request.task_id || null,
          qc_inspection_id: request.qc_inspection_id || null,
          acceptance_id: request.acceptance_id || null,
          qc_item_id: request.qc_item_id || null,
          problem_code: request.problem_code || generateProblemCode(request.problem_type),
          title: request.title,
          description: request.description || null,
          problem_type: request.problem_type || 'defect',
          source: request.source || 'self_report',
          status: 'open' as ProblemStatus,
          priority: request.priority || 'medium',
          severity: request.severity || 'minor',
          impact_description: request.impact_description || null,
          impact_cost: request.impact_cost || null,
          impact_schedule: request.impact_schedule || null,
          risk_flag: request.risk_flag || false,
          location: request.location || null,
          area: request.area || null,
          reporter_id: createdBy,
          assignee_id: request.assignee_id || null,
          target_date: request.target_date || null,
          notes: request.notes || null,
          metadata: request.metadata || null,
          created_by: createdBy
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] create error:', error);
          return null;
        }
        return data as Problem;
      })
    );
  }

  /**
   * 更新問題
   * Update a problem
   */
  update(id: string, updates: UpdateProblemRequest): Observable<Problem | null> {
    return from(
      this.supabase.client
        .from('problems')
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
          this.logger.error('[ProblemRepository] update error:', error);
          return null;
        }
        return data as Problem;
      })
    );
  }

  /**
   * 變更問題狀態
   * Change problem status
   */
  changeStatus(id: string, request: ProblemStatusChangeRequest, actorId: string): Observable<Problem | null> {
    // First get the current status
    return from(this.supabase.client.from('problems').select('status').eq('id', id).single()).pipe(
      switchMap(({ data: currentData, error: currentError }) => {
        if (currentError || !currentData) {
          this.logger.error('[ProblemRepository] changeStatus - get current error:', currentError);
          return of(null);
        }

        const fromStatus = currentData.status as ProblemStatus;
        const toStatus = request.status;

        // Validate transition
        if (!isValidStatusTransition(fromStatus, toStatus)) {
          this.logger.error(`[ProblemRepository] Invalid status transition: ${fromStatus} -> ${toStatus}`);
          return of(null);
        }

        // Build update data based on new status
        const updateData: Record<string, unknown> = {
          status: toStatus,
          updated_at: new Date().toISOString()
        };

        if (request.assignee_id !== undefined) {
          updateData['assignee_id'] = request.assignee_id;
        }

        if (request.verifier_id !== undefined) {
          updateData['verifier_id'] = request.verifier_id;
        }

        if (toStatus === 'resolved') {
          updateData['resolved_at'] = new Date().toISOString();
          if (request.root_cause) updateData['root_cause'] = request.root_cause;
          if (request.resolution) updateData['resolution'] = request.resolution;
          if (request.prevention) updateData['prevention'] = request.prevention;
        }

        if (toStatus === 'closed') {
          updateData['closed_at'] = new Date().toISOString();
          updateData['verified_at'] = new Date().toISOString();
        }

        // Update problem and create action record
        return from(
          Promise.all([
            this.supabase.client.from('problems').update(updateData).eq('id', id).select().single(),
            this.supabase.client.from('problem_actions').insert({
              problem_id: id,
              action_type: `status_change_${toStatus}`,
              action_description: request.action_description,
              from_status: fromStatus,
              to_status: toStatus,
              actor_id: actorId
            })
          ])
        ).pipe(
          map(([updateResult]) => {
            if (updateResult.error) {
              this.logger.error('[ProblemRepository] changeStatus - update error:', updateResult.error);
              return null;
            }
            return updateResult.data as Problem;
          })
        );
      })
    );
  }

  /**
   * 軟刪除問題
   * Soft delete a problem
   */
  softDelete(id: string): Observable<Problem | null> {
    return from(
      this.supabase.client
        .from('problems')
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
          this.logger.error('[ProblemRepository] softDelete error:', error);
          return null;
        }
        return data as Problem;
      })
    );
  }

  // ============================================================================
  // Problem Action Methods
  // ============================================================================

  /**
   * 根據問題 ID 查詢處置記錄
   * Find actions by problem ID
   */
  findActionsByProblem(problemId: string): Observable<ProblemAction[]> {
    return from(
      this.supabase.client.from('problem_actions').select('*').eq('problem_id', problemId).order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findActionsByProblem error:', error);
          return [];
        }
        return (data || []) as ProblemAction[];
      })
    );
  }

  /**
   * 建立處置記錄
   * Create an action record
   */
  createAction(
    problemId: string,
    actionType: string,
    actionDescription: string,
    actorId: string,
    fromStatus?: ProblemStatus,
    toStatus?: ProblemStatus
  ): Observable<ProblemAction | null> {
    return from(
      this.supabase.client
        .from('problem_actions')
        .insert({
          problem_id: problemId,
          action_type: actionType,
          action_description: actionDescription,
          from_status: fromStatus || null,
          to_status: toStatus || null,
          actor_id: actorId
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] createAction error:', error);
          return null;
        }
        return data as ProblemAction;
      })
    );
  }

  // ============================================================================
  // Problem Comment Methods
  // ============================================================================

  /**
   * 根據問題 ID 查詢評論
   * Find comments by problem ID
   */
  findCommentsByProblem(problemId: string): Observable<ProblemComment[]> {
    return from(
      this.supabase.client
        .from('problem_comments')
        .select('*')
        .eq('problem_id', problemId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findCommentsByProblem error:', error);
          return [];
        }
        return (data || []) as ProblemComment[];
      })
    );
  }

  /**
   * 建立評論
   * Create a comment
   */
  createComment(problemId: string, content: string, authorId: string, parentId?: string): Observable<ProblemComment | null> {
    return from(
      this.supabase.client
        .from('problem_comments')
        .insert({
          problem_id: problemId,
          parent_id: parentId || null,
          content,
          author_id: authorId
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] createComment error:', error);
          return null;
        }
        return data as ProblemComment;
      })
    );
  }

  /**
   * 更新評論
   * Update a comment
   */
  updateComment(id: string, content: string): Observable<ProblemComment | null> {
    return from(
      this.supabase.client
        .from('problem_comments')
        .update({
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] updateComment error:', error);
          return null;
        }
        return data as ProblemComment;
      })
    );
  }

  /**
   * 軟刪除評論
   * Soft delete a comment
   */
  softDeleteComment(id: string): Observable<boolean> {
    return from(
      this.supabase.client
        .from('problem_comments')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] softDeleteComment error:', error);
          return false;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // Problem Attachment Methods
  // ============================================================================

  /**
   * 根據問題 ID 查詢附件
   * Find attachments by problem ID
   */
  findAttachmentsByProblem(problemId: string): Observable<ProblemAttachment[]> {
    return from(
      this.supabase.client.from('problem_attachments').select('*').eq('problem_id', problemId).order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findAttachmentsByProblem error:', error);
          return [];
        }
        return (data || []) as ProblemAttachment[];
      })
    );
  }

  /**
   * 建立附件記錄
   * Create an attachment record
   */
  createAttachment(
    problemId: string,
    fileName: string,
    filePath: string,
    uploadedBy: string,
    options: { fileSize?: number; mimeType?: string; caption?: string; attachmentType?: string } = {}
  ): Observable<ProblemAttachment | null> {
    return from(
      this.supabase.client
        .from('problem_attachments')
        .insert({
          problem_id: problemId,
          file_name: fileName,
          file_path: filePath,
          file_size: options.fileSize || null,
          mime_type: options.mimeType || null,
          caption: options.caption || null,
          attachment_type: options.attachmentType || null,
          uploaded_by: uploadedBy
        })
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] createAttachment error:', error);
          return null;
        }
        return data as ProblemAttachment;
      })
    );
  }

  /**
   * 刪除附件記錄
   * Delete an attachment record
   */
  deleteAttachment(id: string): Observable<boolean> {
    return from(this.supabase.client.from('problem_attachments').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] deleteAttachment error:', error);
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
   * 取得藍圖的問題統計
   * Get problem statistics for a blueprint
   */
  getStatsByBlueprint(blueprintId: string): Observable<ProblemStats> {
    return from(
      this.supabase.client
        .from('problems')
        .select('status, problem_type, priority, severity, risk_flag, reported_at, resolved_at')
        .eq('blueprint_id', blueprintId)
        .is('deleted_at', null)
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          this.logger.error('[ProblemRepository] getStatsByBlueprint error:', error);
          return {
            total: 0,
            byStatus: {} as Record<ProblemStatus, number>,
            byType: {} as Record<ProblemType, number>,
            byPriority: {} as Record<ProblemPriority, number>,
            bySeverity: {} as Record<ProblemSeverity, number>,
            highRiskCount: 0,
            openCount: 0,
            resolvedCount: 0,
            closedCount: 0,
            avgResolutionTime: null
          };
        }

        const total = data.length;

        // Count by status
        const byStatus = data.reduce(
          (acc, p) => {
            acc[p.status as ProblemStatus] = (acc[p.status as ProblemStatus] || 0) + 1;
            return acc;
          },
          {} as Record<ProblemStatus, number>
        );

        // Count by type
        const byType = data.reduce(
          (acc, p) => {
            acc[p.problem_type as ProblemType] = (acc[p.problem_type as ProblemType] || 0) + 1;
            return acc;
          },
          {} as Record<ProblemType, number>
        );

        // Count by priority
        const byPriority = data.reduce(
          (acc, p) => {
            acc[p.priority as ProblemPriority] = (acc[p.priority as ProblemPriority] || 0) + 1;
            return acc;
          },
          {} as Record<ProblemPriority, number>
        );

        // Count by severity
        const bySeverity = data.reduce(
          (acc, p) => {
            acc[p.severity as ProblemSeverity] = (acc[p.severity as ProblemSeverity] || 0) + 1;
            return acc;
          },
          {} as Record<ProblemSeverity, number>
        );

        const highRiskCount = data.filter(p => p.risk_flag).length;
        const openCount = data.filter(p => !['closed', 'cancelled'].includes(p.status)).length;
        const resolvedCount = data.filter(p => p.status === 'resolved' || p.status === 'closed').length;
        const closedCount = data.filter(p => p.status === 'closed').length;

        // Calculate average resolution time
        const resolvedProblems = data.filter(p => p.resolved_at);
        let avgResolutionTime: number | null = null;
        if (resolvedProblems.length > 0) {
          const totalDays = resolvedProblems.reduce((sum, p) => {
            const reportedAt = new Date(p.reported_at);
            const resolvedAt = new Date(p.resolved_at);
            const days = Math.ceil((resolvedAt.getTime() - reportedAt.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0);
          avgResolutionTime = Math.round((totalDays / resolvedProblems.length) * 10) / 10;
        }

        return {
          total,
          byStatus,
          byType,
          byPriority,
          bySeverity,
          highRiskCount,
          openCount,
          resolvedCount,
          closedCount,
          avgResolutionTime
        };
      })
    );
  }

  /**
   * 查詢知識庫問題
   * Find knowledge base problems
   */
  findKnowledgeBase(blueprintId?: string, tags?: string[]): Observable<Problem[]> {
    let query = this.supabase.client.from('problems').select('*').eq('knowledge_base', true).is('deleted_at', null);

    if (blueprintId) {
      query = query.eq('blueprint_id', blueprintId);
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('knowledge_tags', tags);
    }

    return from(query.order('created_at', { ascending: false })).pipe(
      map(({ data, error }) => {
        if (error) {
          this.logger.error('[ProblemRepository] findKnowledgeBase error:', error);
          return [];
        }
        return (data || []) as Problem[];
      })
    );
  }
}
