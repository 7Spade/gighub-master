/**
 * Diary Service
 *
 * Business logic for Diary management
 * Following vertical slice architecture
 *
 * Uses Angular Signals for reactive state management
 *
 * @module features/blueprint/data-access/services/diary.service
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  DiaryModel,
  CreateDiaryRequest,
  UpdateDiaryRequest,
  DiaryStatistics,
  mapDiaryToViewModel,
  calculateDiaryStatistics,
  DiaryViewModel
} from '../../domain';
import { DiaryRepository } from '../repositories';

/**
 * Diary Service
 *
 * Manages diary state and business logic with Signals
 */
@Injectable({ providedIn: 'root' })
export class DiaryService {
  private readonly diaryRepo = inject(DiaryRepository);

  // State management with Signals
  private diariesState = signal<DiaryModel[]>([]);
  private selectedDiaryState = signal<DiaryModel | null>(null);
  private loadingState = signal<boolean>(false);
  private errorState = signal<string | null>(null);

  // Expose ReadonlySignal to components
  readonly diaries = this.diariesState.asReadonly();
  readonly selectedDiary = this.selectedDiaryState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  // Computed signals for derived state
  readonly diaryViewModels = computed<DiaryViewModel[]>(() => this.diaries().map(d => mapDiaryToViewModel(d)));

  readonly statistics = computed<DiaryStatistics>(() => calculateDiaryStatistics(this.diaries()));

  readonly thisMonthDiaries = computed(() => {
    const now = new Date();
    return this.diaries().filter(d => {
      const diaryDate = new Date(d.date);
      return diaryDate.getMonth() === now.getMonth() && diaryDate.getFullYear() === now.getFullYear();
    });
  });

  /**
   * Load diaries by workspace
   */
  async loadDiariesByWorkspace(workspaceId: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const diaries = await firstValueFrom(this.diaryRepo.findByWorkspace(workspaceId));
      this.diariesState.set(diaries);
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to load diaries');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Load diaries by blueprint
   */
  async loadDiariesByBlueprint(blueprintId: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const diaries = await firstValueFrom(this.diaryRepo.findByBlueprint(blueprintId));
      this.diariesState.set(diaries);
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to load diaries');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Get diary by ID
   */
  async getDiaryById(id: string): Promise<DiaryModel> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const diary = await firstValueFrom(this.diaryRepo.findById(id));
      if (!diary) {
        throw new Error('Diary not found');
      }
      this.selectedDiaryState.set(diary);
      return diary;
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to load diary');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Create new diary
   */
  async createDiary(request: CreateDiaryRequest, authorId: string): Promise<DiaryModel> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      // Business validation
      if (!request.title || request.title.trim().length === 0) {
        throw new Error('Title is required');
      }
      if (!request.content || request.content.trim().length === 0) {
        throw new Error('Content is required');
      }

      const diaryInsert = {
        ...request,
        weather: request.weather || 'unknown',
        authorId
      };

      const newDiary = await firstValueFrom(this.diaryRepo.create(diaryInsert));

      // Update state
      this.diariesState.update(diaries => [newDiary, ...diaries]);

      return newDiary;
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to create diary');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Update diary
   */
  async updateDiary(id: string, request: UpdateDiaryRequest): Promise<DiaryModel> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const updatedDiary = await firstValueFrom(this.diaryRepo.update(id, request));

      // Update state
      this.diariesState.update(diaries => diaries.map(d => (d.id === id ? updatedDiary : d)));

      if (this.selectedDiary()?.id === id) {
        this.selectedDiaryState.set(updatedDiary);
      }

      return updatedDiary;
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to update diary');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Delete diary
   */
  async deleteDiary(id: string): Promise<void> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      await firstValueFrom(this.diaryRepo.delete(id));

      // Update state
      this.diariesState.update(diaries => diaries.filter(d => d.id !== id));

      if (this.selectedDiary()?.id === id) {
        this.selectedDiaryState.set(null);
      }
    } catch (error) {
      this.errorState.set(error instanceof Error ? error.message : 'Failed to delete diary');
      throw error;
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Select diary
   */
  selectDiary(diary: DiaryModel | null): void {
    this.selectedDiaryState.set(diary);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorState.set(null);
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedDiaryState.set(null);
  }
}
