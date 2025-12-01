/**
 * Diary Store
 *
 * State management store for Diary feature
 * Acts as Facade layer providing unified API to components
 * Following vertical slice architecture
 *
 * @module features/blueprint/data-access/stores/diary.store
 */

import { Injectable, inject } from '@angular/core';

import { DiaryModel, CreateDiaryRequest, UpdateDiaryRequest } from '../../domain';
import { DiaryService } from '../services';

/**
 * Diary Store (Facade)
 *
 * Provides unified API for Diary module
 * Integrates with Workspace Context
 */
@Injectable({ providedIn: 'root' })
export class DiaryStore {
  private readonly diaryService = inject(DiaryService);

  // Expose Diary Service state
  readonly diaries = this.diaryService.diaries;
  readonly selectedDiary = this.diaryService.selectedDiary;
  readonly loading = this.diaryService.loading;
  readonly error = this.diaryService.error;
  readonly statistics = this.diaryService.statistics;

  // Computed signals (shortcuts)
  readonly diaryViewModels = this.diaryService.diaryViewModels;
  readonly thisMonthDiaries = this.diaryService.thisMonthDiaries;

  /**
   * Load diaries by workspace
   */
  async loadWorkspaceDiaries(workspaceId: string): Promise<void> {
    await this.diaryService.loadDiariesByWorkspace(workspaceId);
  }

  /**
   * Load diaries by blueprint
   */
  async loadBlueprintDiaries(blueprintId: string): Promise<void> {
    await this.diaryService.loadDiariesByBlueprint(blueprintId);
  }

  /**
   * Get diary by ID
   */
  async getDiary(id: string): Promise<DiaryModel> {
    return this.diaryService.getDiaryById(id);
  }

  /**
   * Create new diary
   */
  async createDiary(request: CreateDiaryRequest, authorId: string): Promise<DiaryModel> {
    return this.diaryService.createDiary(request, authorId);
  }

  /**
   * Update diary
   */
  async updateDiary(id: string, request: UpdateDiaryRequest): Promise<DiaryModel> {
    return this.diaryService.updateDiary(id, request);
  }

  /**
   * Delete diary
   */
  async deleteDiary(id: string): Promise<void> {
    return this.diaryService.deleteDiary(id);
  }

  /**
   * Select diary
   */
  selectDiary(diary: DiaryModel | null): void {
    this.diaryService.selectDiary(diary);
  }

  /**
   * Clear diary error
   */
  clearError(): void {
    this.diaryService.clearError();
  }

  /**
   * Clear diary selection
   */
  clearSelection(): void {
    this.diaryService.clearSelection();
  }
}
