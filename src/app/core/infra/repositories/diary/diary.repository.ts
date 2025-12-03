/**
 * Diary Repository
 *
 * 施工日誌資料存取層 - 現場證據紀錄系統
 * Construction diary data access layer - Field evidence recording
 *
 * Features:
 * - Daily work logging
 * - Weather and environment tracking
 * - Worker attendance records
 * - Photo/attachment management
 * - Approval workflow support
 *
 * @module core/infra/repositories/diary
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map, of, forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { SupabaseService } from '../../../supabase/supabase.service';
import {
  Diary,
  DiaryWithDetails,
  DiaryAttachment,
  DiaryEntry,
  CreateDiaryRequest,
  UpdateDiaryRequest,
  AddDiaryAttachmentRequest,
  AddDiaryEntryRequest,
  DiaryQueryOptions,
  DiaryPageResult,
  DiaryStats,
  MonthlyDiarySummary,
  DiaryStatus,
  WeatherType
} from '../../types/diary';

@Injectable({ providedIn: 'root' })
export class DiaryRepository {
  private readonly supabase = inject(SupabaseService);

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  /**
   * 建立日誌
   * Create a new diary entry
   */
  create(request: CreateDiaryRequest): Observable<Diary | null> {
    const entry = {
      blueprint_id: request.blueprint_id,
      work_date: request.work_date,
      weather: request.weather ?? null,
      temperature_min: request.temperature_min ?? null,
      temperature_max: request.temperature_max ?? null,
      work_hours: request.work_hours ?? null,
      worker_count: request.worker_count ?? null,
      summary: request.summary ?? null,
      notes: request.notes ?? null,
      status: 'draft' as DiaryStatus,
      created_by: this.supabase.currentUser?.id ?? null
    };

    return from(
      this.supabase.client.from('diaries').insert(entry).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] create error:', error);
          return null;
        }
        return data as Diary;
      })
    );
  }

  /**
   * 更新日誌
   * Update an existing diary
   */
  update(id: string, request: UpdateDiaryRequest): Observable<Diary | null> {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (request.weather !== undefined) updates['weather'] = request.weather;
    if (request.temperature_min !== undefined) updates['temperature_min'] = request.temperature_min;
    if (request.temperature_max !== undefined) updates['temperature_max'] = request.temperature_max;
    if (request.work_hours !== undefined) updates['work_hours'] = request.work_hours;
    if (request.worker_count !== undefined) updates['worker_count'] = request.worker_count;
    if (request.summary !== undefined) updates['summary'] = request.summary;
    if (request.notes !== undefined) updates['notes'] = request.notes;
    if (request.status !== undefined) updates['status'] = request.status;

    return from(
      this.supabase.client.from('diaries').update(updates).eq('id', id).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] update error:', error);
          return null;
        }
        return data as Diary;
      })
    );
  }

  /**
   * 軟刪除日誌
   * Soft delete a diary
   */
  delete(id: string): Observable<boolean> {
    return from(
      this.supabase.client
        .from('diaries')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[DiaryRepository] delete error:', error);
          return false;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * 根據 ID 查詢日誌
   * Find diary by ID
   */
  findById(id: string, includeDetails = false): Observable<Diary | DiaryWithDetails | null> {
    if (includeDetails) {
      return this.findByIdWithDetails(id);
    }

    return from(
      this.supabase.client.from('diaries').select('*').eq('id', id).is('deleted_at', null).single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          console.error('[DiaryRepository] findById error:', error);
          return null;
        }
        return data as Diary;
      })
    );
  }

  /**
   * 根據 ID 查詢日誌 (含詳情)
   * Find diary by ID with details
   */
  private findByIdWithDetails(id: string): Observable<DiaryWithDetails | null> {
    return from(
      this.supabase.client
        .from('diaries')
        .select(
          `
          *,
          creator:accounts!diaries_created_by_fkey(id, name, avatar_url),
          approver:accounts!diaries_approved_by_fkey(id, name, avatar_url),
          attachments:diary_attachments(*)
        `
        )
        .eq('id', id)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          console.error('[DiaryRepository] findByIdWithDetails error:', error);
          return null;
        }
        return data as unknown as DiaryWithDetails;
      })
    );
  }

  /**
   * 根據日期查詢日誌
   * Find diary by date
   */
  findByDate(blueprintId: string, workDate: string): Observable<Diary | null> {
    return from(
      this.supabase.client
        .from('diaries')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .eq('work_date', workDate)
        .is('deleted_at', null)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          if (error.code === 'PGRST116') return null;
          console.error('[DiaryRepository] findByDate error:', error);
          return null;
        }
        return data as Diary;
      })
    );
  }

  /**
   * 查詢日誌列表
   * Query diaries with filters
   */
  query(options: DiaryQueryOptions): Observable<DiaryPageResult> {
    const page = options.limit && options.offset !== undefined ? Math.floor(options.offset / options.limit) + 1 : 1;
    const pageSize = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const includeDetails = options.includeDetails ?? false;

    let query = this.supabase.client.from('diaries').select(
      includeDetails
        ? `
            *,
            creator:accounts!diaries_created_by_fkey(id, name, avatar_url),
            attachments:diary_attachments(count)
          `
        : '*',
      { count: 'exact' }
    );

    // Apply filters
    if (options.blueprintId) {
      query = query.eq('blueprint_id', options.blueprintId);
    }
    if (options.status) {
      if (Array.isArray(options.status)) {
        query = query.in('status', options.status);
      } else {
        query = query.eq('status', options.status);
      }
    }
    if (options.startDate) {
      query = query.gte('work_date', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('work_date', options.endDate);
    }
    if (options.createdBy) {
      query = query.eq('created_by', options.createdBy);
    }
    if (options.weather) {
      if (Array.isArray(options.weather)) {
        query = query.in('weather', options.weather);
      } else {
        query = query.eq('weather', options.weather);
      }
    }
    if (options.search) {
      query = query.or(`summary.ilike.%${options.search}%,notes.ilike.%${options.search}%`);
    }

    // Exclude soft-deleted
    query = query.is('deleted_at', null);

    // Apply sorting
    const orderBy = options.orderBy ?? 'work_date';
    const orderDirection = options.orderDirection ?? 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    return from(query).pipe(
      map(({ data, count, error }) => {
        if (error) {
          console.error('[DiaryRepository] query error:', error);
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
          data: (data || []) as unknown as (Diary | DiaryWithDetails)[],
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        };
      })
    );
  }

  /**
   * 取得藍圖的日誌列表
   * Get diaries by blueprint
   */
  findByBlueprint(blueprintId: string, options: { limit?: number; status?: DiaryStatus } = {}): Observable<Diary[]> {
    const { limit = 50, status } = options;

    let query = this.supabase.client
      .from('diaries')
      .select('*')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('work_date', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    return from(query).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] findByBlueprint error:', error);
          return [];
        }
        return (data || []) as Diary[];
      })
    );
  }

  // ============================================================================
  // Approval Workflow
  // ============================================================================

  /**
   * 提交日誌
   * Submit diary for approval
   */
  submit(id: string): Observable<Diary | null> {
    return from(
      this.supabase.client
        .from('diaries')
        .update({
          status: 'submitted' as DiaryStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] submit error:', error);
          return null;
        }
        return data as Diary;
      })
    );
  }

  /**
   * 核准日誌
   * Approve diary
   */
  approve(id: string): Observable<Diary | null> {
    return from(
      this.supabase.client
        .from('diaries')
        .update({
          status: 'approved' as DiaryStatus,
          approved_by: this.supabase.currentUser?.id ?? null,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] approve error:', error);
          return null;
        }
        return data as Diary;
      })
    );
  }

  /**
   * 駁回日誌
   * Reject diary
   */
  reject(id: string, reason?: string): Observable<Diary | null> {
    return from(
      this.supabase.client
        .from('diaries')
        .update({
          status: 'rejected' as DiaryStatus,
          notes: reason ? `[駁回原因] ${reason}` : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] reject error:', error);
          return null;
        }
        return data as Diary;
      })
    );
  }

  // ============================================================================
  // Attachment Operations
  // ============================================================================

  /**
   * 新增附件
   * Add attachment to diary
   */
  addAttachment(request: AddDiaryAttachmentRequest): Observable<DiaryAttachment | null> {
    const entry = {
      diary_id: request.diary_id,
      file_name: request.file_name,
      file_path: request.file_path,
      file_size: request.file_size ?? null,
      mime_type: request.mime_type ?? null,
      caption: request.caption ?? null,
      uploaded_by: this.supabase.currentUser?.id ?? null
    };

    return from(
      this.supabase.client.from('diary_attachments').insert(entry).select().single()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] addAttachment error:', error);
          return null;
        }
        return data as DiaryAttachment;
      })
    );
  }

  /**
   * 取得日誌附件
   * Get diary attachments
   */
  getAttachments(diaryId: string): Observable<DiaryAttachment[]> {
    return from(
      this.supabase.client
        .from('diary_attachments')
        .select('*')
        .eq('diary_id', diaryId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] getAttachments error:', error);
          return [];
        }
        return (data || []) as DiaryAttachment[];
      })
    );
  }

  /**
   * 刪除附件
   * Delete attachment
   */
  deleteAttachment(id: string): Observable<boolean> {
    return from(this.supabase.client.from('diary_attachments').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[DiaryRepository] deleteAttachment error:', error);
          return false;
        }
        return true;
      })
    );
  }

  // ============================================================================
  // Statistics Operations
  // ============================================================================

  /**
   * 取得日誌統計
   * Get diary statistics
   */
  getStats(blueprintId: string): Observable<DiaryStats> {
    return from(
      this.supabase.client.from('diaries').select('*').eq('blueprint_id', blueprintId).is('deleted_at', null)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] getStats error:', error);
          return this.emptyStats();
        }

        const diaries = (data || []) as Diary[];
        return this.calculateStats(diaries);
      })
    );
  }

  /**
   * 取得月度摘要
   * Get monthly summary
   */
  getMonthlySummary(blueprintId: string, month: string): Observable<MonthlyDiarySummary> {
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;

    return from(
      this.supabase.client
        .from('diaries')
        .select('*')
        .eq('blueprint_id', blueprintId)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .is('deleted_at', null)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[DiaryRepository] getMonthlySummary error:', error);
          return this.emptyMonthlySummary(month);
        }

        const diaries = (data || []) as Diary[];
        return this.calculateMonthlySummary(month, diaries);
      })
    );
  }

  private calculateStats(diaries: Diary[]): DiaryStats {
    const stats: DiaryStats = {
      total_count: diaries.length,
      draft_count: 0,
      submitted_count: 0,
      approved_count: 0,
      rejected_count: 0,
      total_work_hours: 0,
      total_worker_count: 0,
      avg_daily_hours: 0,
      avg_daily_workers: 0
    };

    for (const diary of diaries) {
      switch (diary.status) {
        case 'draft':
          stats.draft_count++;
          break;
        case 'submitted':
          stats.submitted_count++;
          break;
        case 'approved':
          stats.approved_count++;
          break;
        case 'rejected':
          stats.rejected_count++;
          break;
      }

      if (diary.work_hours) {
        stats.total_work_hours += Number(diary.work_hours);
      }
      if (diary.worker_count) {
        stats.total_worker_count += diary.worker_count;
      }
    }

    if (diaries.length > 0) {
      stats.avg_daily_hours = stats.total_work_hours / diaries.length;
      stats.avg_daily_workers = stats.total_worker_count / diaries.length;
    }

    return stats;
  }

  private calculateMonthlySummary(month: string, diaries: Diary[]): MonthlyDiarySummary {
    const weatherDistribution: Record<WeatherType, number> = {} as Record<WeatherType, number>;
    let totalHours = 0;
    let totalWorkers = 0;
    let approvedCount = 0;
    let pendingCount = 0;

    for (const diary of diaries) {
      if (diary.weather) {
        weatherDistribution[diary.weather] = (weatherDistribution[diary.weather] || 0) + 1;
      }
      if (diary.work_hours) {
        totalHours += Number(diary.work_hours);
      }
      if (diary.worker_count) {
        totalWorkers += diary.worker_count;
      }
      if (diary.status === 'approved') {
        approvedCount++;
      } else if (diary.status === 'submitted') {
        pendingCount++;
      }
    }

    return {
      month,
      working_days: diaries.length,
      total_hours: totalHours,
      total_workers: totalWorkers,
      weather_distribution: weatherDistribution,
      approved_count: approvedCount,
      pending_count: pendingCount
    };
  }

  private emptyStats(): DiaryStats {
    return {
      total_count: 0,
      draft_count: 0,
      submitted_count: 0,
      approved_count: 0,
      rejected_count: 0,
      total_work_hours: 0,
      total_worker_count: 0,
      avg_daily_hours: 0,
      avg_daily_workers: 0
    };
  }

  private emptyMonthlySummary(month: string): MonthlyDiarySummary {
    return {
      month,
      working_days: 0,
      total_hours: 0,
      total_workers: 0,
      weather_distribution: {} as Record<WeatherType, number>,
      approved_count: 0,
      pending_count: 0
    };
  }
}
