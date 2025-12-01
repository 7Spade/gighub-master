/**
 * Diary Repository
 *
 * 施工日誌資料存取層
 *
 * @module features/blueprint/data-access/repositories
 */

import { Injectable, inject } from '@angular/core';
import { SupabaseService } from '@core';
import { Diary, DiaryAttachment, CreateDiaryRequest, UpdateDiaryRequest, DiaryFilter } from '../../domain';

@Injectable({
  providedIn: 'root'
})
export class DiaryRepository {
  private readonly supabase = inject(SupabaseService);
  private readonly TABLE_NAME = 'diaries';
  private readonly ATTACHMENT_TABLE = 'diary_attachments';

  /**
   * 根據藍圖 ID 查詢所有日誌
   */
  async findByBlueprintId(blueprintId: string): Promise<Diary[]> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null)
      .order('work_date', { ascending: false });

    if (error) {
      console.error('[DiaryRepository] findByBlueprintId error:', error);
      throw error;
    }

    return (data || []) as Diary[];
  }

  /**
   * 根據 ID 查詢單一日誌
   */
  async findById(id: string): Promise<Diary | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[DiaryRepository] findById error:', error);
      throw error;
    }

    return data as Diary;
  }

  /**
   * 根據日期查詢日誌
   */
  async findByDate(blueprintId: string, workDate: string): Promise<Diary | null> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('blueprint_id', blueprintId)
      .eq('work_date', workDate)
      .is('deleted_at', null)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[DiaryRepository] findByDate error:', error);
      throw error;
    }

    return data as Diary;
  }

  /**
   * 根據篩選條件查詢日誌
   */
  async findByFilter(blueprintId: string, filter: DiaryFilter): Promise<Diary[]> {
    let query = this.supabase.client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('blueprint_id', blueprintId)
      .is('deleted_at', null);

    if (filter.date_from) {
      query = query.gte('work_date', filter.date_from);
    }

    if (filter.date_to) {
      query = query.lte('work_date', filter.date_to);
    }

    if (filter.weather && filter.weather.length > 0) {
      query = query.in('weather', filter.weather);
    }

    if (filter.status && filter.status.length > 0) {
      query = query.in('status', filter.status);
    }

    const { data, error } = await query.order('work_date', { ascending: false });

    if (error) {
      console.error('[DiaryRepository] findByFilter error:', error);
      throw error;
    }

    return (data || []) as Diary[];
  }

  /**
   * 建立日誌
   */
  async create(request: CreateDiaryRequest): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .insert({
        blueprint_id: request.blueprint_id,
        work_date: request.work_date,
        weather: request.weather ?? null,
        temperature_min: request.temperature_min ?? null,
        temperature_max: request.temperature_max ?? null,
        work_hours: request.work_hours ?? null,
        worker_count: request.worker_count ?? null,
        summary: request.summary ?? null,
        notes: request.notes ?? null
      })
      .select()
      .single();

    if (error) {
      console.error('[DiaryRepository] create error:', error);
      throw error;
    }

    return data as Diary;
  }

  /**
   * 更新日誌
   */
  async update(id: string, request: UpdateDiaryRequest): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .update({
        ...request,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[DiaryRepository] update error:', error);
      throw error;
    }

    return data as Diary;
  }

  /**
   * 軟刪除日誌
   */
  async softDelete(id: string): Promise<Diary> {
    const { data, error } = await this.supabase.client
      .from(this.TABLE_NAME)
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[DiaryRepository] softDelete error:', error);
      throw error;
    }

    return data as Diary;
  }

  /**
   * 查詢日誌附件
   */
  async findAttachments(diaryId: string): Promise<DiaryAttachment[]> {
    const { data, error } = await this.supabase.client
      .from(this.ATTACHMENT_TABLE)
      .select('*')
      .eq('diary_id', diaryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[DiaryRepository] findAttachments error:', error);
      throw error;
    }

    return (data || []) as DiaryAttachment[];
  }
}
