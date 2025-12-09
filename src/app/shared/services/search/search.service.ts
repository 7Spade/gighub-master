/**
 * Search Service
 *
 * 搜尋管理服務 (Shared 層)
 * Search management service (Shared layer)
 *
 * Provides enterprise-grade search functionality including:
 * - Full-text search with debouncing
 * - Autocomplete suggestions
 * - Search history management
 * - Category-based filtering
 * - Keyboard navigation support
 * - Caching for performance
 * - Permission-aware search
 *
 * Uses Angular 20 modern patterns:
 * - inject() function for dependency injection
 * - signal(), computed() for reactive state
 * - effect() for side effects
 * - RxJS for async operations
 *
 * @module shared/services/search
 */

import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import {
  SearchRepository,
  SearchCategory,
  SearchResultItem,
  SearchResultGroup,
  SearchQueryOptions,
  QuickSearchOptions,
  SearchSuggestion,
  SearchHistoryItem,
  SearchState,
  SEARCH_CATEGORY_CONFIG,
  SEARCH_CONSTANTS,
  SearchResponse
} from '@core';
import { Subject, debounceTime, distinctUntilChanged, switchMap, tap, catchError, of, filter } from 'rxjs';
import { LoggerService } from '../../../core/logger/logger.service';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly searchRepository = inject(SearchRepository);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);

  // ============================================================================
  // State Signals (狀態信號)
  // ============================================================================

  private readonly queryState = signal<string>('');
  private readonly isSearchingState = signal<boolean>(false);
  private readonly isResultsPanelVisibleState = signal<boolean>(false);
  private readonly resultsState = signal<SearchResultItem[]>([]);
  private readonly groupedResultsState = signal<SearchResultGroup[]>([]);
  private readonly totalCountState = signal<number>(0);
  private readonly selectedCategoryState = signal<SearchCategory>(SearchCategory.ALL);
  private readonly suggestionsState = signal<SearchSuggestion[]>([]);
  private readonly historyState = signal<SearchHistoryItem[]>([]);
  private readonly errorState = signal<string | null>(null);
  private readonly isInitializedState = signal<boolean>(false);
  private readonly selectedIndexState = signal<number>(-1);
  private readonly currentBlueprintIdState = signal<string | null>(null);

  // Readonly signals for external consumption
  readonly query = this.queryState.asReadonly();
  readonly isSearching = this.isSearchingState.asReadonly();
  readonly isResultsPanelVisible = this.isResultsPanelVisibleState.asReadonly();
  readonly results = this.resultsState.asReadonly();
  readonly groupedResults = this.groupedResultsState.asReadonly();
  readonly totalCount = this.totalCountState.asReadonly();
  readonly selectedCategory = this.selectedCategoryState.asReadonly();
  readonly suggestions = this.suggestionsState.asReadonly();
  readonly history = this.historyState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly isInitialized = this.isInitializedState.asReadonly();
  readonly selectedIndex = this.selectedIndexState.asReadonly();
  readonly currentBlueprintId = this.currentBlueprintIdState.asReadonly();

  // ============================================================================
  // Computed Signals (計算信號)
  // ============================================================================

  readonly hasResults = computed(() => this.resultsState().length > 0);
  readonly hasError = computed(() => this.errorState() !== null);
  readonly isQueryValid = computed(() => this.queryState().trim().length >= SEARCH_CONSTANTS.MIN_QUERY_LENGTH);
  readonly canSearch = computed(() => this.isQueryValid() && !this.isSearchingState());
  readonly selectedResult = computed(() => {
    const index = this.selectedIndexState();
    const results = this.resultsState();
    return index >= 0 && index < results.length ? results[index] : null;
  });

  readonly availableCategories = computed(() => {
    return Object.values(SEARCH_CATEGORY_CONFIG)
      .filter(config => config.enabled)
      .sort((a, b) => a.weight - b.weight);
  });

  readonly filteredResults = computed(() => {
    const category = this.selectedCategoryState();
    const results = this.resultsState();

    if (category === SearchCategory.ALL) {
      return results;
    }

    return results.filter(r => r.category === category);
  });

  readonly searchState = computed<SearchState>(() => ({
    query: this.queryState(),
    isSearching: this.isSearchingState(),
    isResultsPanelVisible: this.isResultsPanelVisibleState(),
    results: this.resultsState(),
    groupedResults: this.groupedResultsState(),
    totalCount: this.totalCountState(),
    selectedCategory: this.selectedCategoryState(),
    suggestions: this.suggestionsState(),
    history: this.historyState(),
    error: this.errorState(),
    isInitialized: this.isInitializedState()
  }));

  // ============================================================================
  // Search Subjects (搜尋主題)
  // ============================================================================

  private readonly searchSubject = new Subject<string>();
  private readonly suggestionSubject = new Subject<string>();

  constructor() {
    this.setupSearchPipeline();
    this.setupSuggestionPipeline();
  }

  // ============================================================================
  // Initialization (初始化)
  // ============================================================================

  /**
   * Initialize search service
   * 初始化搜尋服務
   */
  initialize(): void {
    if (this.isInitializedState()) return;

    this.loadSearchHistory();
    this.isInitializedState.set(true);
  }

  /**
   * Set current blueprint context
   * 設定當前藍圖上下文
   */
  setCurrentBlueprint(blueprintId: string | null): void {
    this.currentBlueprintIdState.set(blueprintId);
  }

  // ============================================================================
  // Search Methods (搜尋方法)
  // ============================================================================

  /**
   * Update search query
   * 更新搜尋查詢
   */
  updateQuery(query: string): void {
    this.queryState.set(query);
    this.searchSubject.next(query);

    if (query.trim().length >= 1) {
      this.suggestionSubject.next(query);
    } else {
      this.suggestionsState.set([]);
    }
  }

  /**
   * Execute search
   * 執行搜尋
   */
  search(options?: Partial<SearchQueryOptions>): void {
    const query = this.queryState().trim();
    if (query.length < SEARCH_CONSTANTS.MIN_QUERY_LENGTH) {
      this.clearResults();
      return;
    }

    const searchOptions: SearchQueryOptions = {
      query,
      categories: this.selectedCategoryState() === SearchCategory.ALL ? undefined : [this.selectedCategoryState()],
      blueprintId: options?.blueprintId || this.currentBlueprintIdState() || undefined,
      page: options?.page || 1,
      pageSize: options?.pageSize || SEARCH_CONSTANTS.DEFAULT_PAGE_SIZE,
      ...options
    };

    this.isSearchingState.set(true);
    this.errorState.set(null);

    this.searchRepository
      .search(searchOptions)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => this.handleSearchResponse(response),
        error: error => this.handleSearchError(error)
      });
  }

  /**
   * Quick search for autocomplete
   * 快速搜尋用於自動完成
   */
  quickSearch(query: string): void {
    if (query.trim().length < SEARCH_CONSTANTS.MIN_QUERY_LENGTH) {
      this.clearResults();
      return;
    }

    const options: QuickSearchOptions = {
      query: query.trim(),
      limit: SEARCH_CONSTANTS.QUICK_SEARCH_LIMIT,
      blueprintId: this.currentBlueprintIdState() || undefined
    };

    this.isSearchingState.set(true);

    this.searchRepository
      .quickSearch(options)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: results => {
          this.resultsState.set(results);
          this.totalCountState.set(results.length);
          this.isSearchingState.set(false);
          this.showResultsPanel();
        },
        error: () => {
          this.isSearchingState.set(false);
        }
      });
  }

  // ============================================================================
  // Category Methods (分類方法)
  // ============================================================================

  /**
   * Set selected category
   * 設定選中的分類
   */
  selectCategory(category: SearchCategory): void {
    this.selectedCategoryState.set(category);
    if (this.queryState().trim().length >= SEARCH_CONSTANTS.MIN_QUERY_LENGTH) {
      this.search();
    }
  }

  /**
   * Toggle category filter
   * 切換分類過濾
   */
  toggleCategory(category: SearchCategory): void {
    const current = this.selectedCategoryState();
    if (current === category) {
      this.selectedCategoryState.set(SearchCategory.ALL);
    } else {
      this.selectedCategoryState.set(category);
    }

    if (this.queryState().trim()) {
      this.search();
    }
  }

  // ============================================================================
  // Navigation Methods (導航方法)
  // ============================================================================

  /**
   * Navigate to search result
   * 導航到搜尋結果
   */
  navigateToResult(result: SearchResultItem): void {
    if (!result.url) return;

    this.hideResultsPanel();
    this.saveToHistory();
    this.router.navigateByUrl(result.url);
  }

  /**
   * Navigate to selected result
   * 導航到選中的結果
   */
  navigateToSelected(): void {
    const result = this.selectedResult();
    if (result) {
      this.navigateToResult(result);
    }
  }

  /**
   * Select next result
   * 選擇下一個結果
   */
  selectNext(): void {
    const results = this.filteredResults();
    if (results.length === 0) return;

    const current = this.selectedIndexState();
    const next = current < results.length - 1 ? current + 1 : 0;
    this.selectedIndexState.set(next);
  }

  /**
   * Select previous result
   * 選擇上一個結果
   */
  selectPrevious(): void {
    const results = this.filteredResults();
    if (results.length === 0) return;

    const current = this.selectedIndexState();
    const prev = current > 0 ? current - 1 : results.length - 1;
    this.selectedIndexState.set(prev);
  }

  /**
   * Select result by index
   * 根據索引選擇結果
   */
  selectResultByIndex(index: number): void {
    const results = this.filteredResults();
    if (index >= 0 && index < results.length) {
      this.selectedIndexState.set(index);
    }
  }

  // ============================================================================
  // History Methods (歷史方法)
  // ============================================================================

  /**
   * Load search history
   * 載入搜尋歷史
   */
  loadSearchHistory(): void {
    this.searchRepository
      .getSearchHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: history => this.historyState.set(history),
        error: () => this.historyState.set([])
      });
  }

  /**
   * Clear search history
   * 清除搜尋歷史
   */
  clearHistory(): void {
    this.searchRepository
      .clearSearchHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: success => {
          if (success) {
            this.historyState.set([]);
          }
        }
      });
  }

  /**
   * Save search to history
   * 儲存搜尋到歷史
   */
  private saveToHistory(): void {
    const query = this.queryState().trim();
    if (!query) return;

    this.searchRepository
      .saveSearchHistory(
        query,
        this.totalCountState(),
        this.selectedCategoryState() === SearchCategory.ALL ? undefined : [this.selectedCategoryState()]
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Search from history item
   * 從歷史項目搜尋
   */
  searchFromHistory(historyItem: SearchHistoryItem): void {
    this.updateQuery(historyItem.query);
    if (historyItem.categories?.length) {
      this.selectedCategoryState.set(historyItem.categories[0] as SearchCategory);
    }
    this.search();
  }

  // ============================================================================
  // Suggestion Methods (建議方法)
  // ============================================================================

  /**
   * Load suggestions for query
   * 載入查詢建議
   */
  loadSuggestions(query: string): void {
    if (query.length < 1) {
      this.suggestionsState.set([]);
      return;
    }

    this.searchRepository
      .getSuggestions(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: suggestions => this.suggestionsState.set(suggestions),
        error: () => this.suggestionsState.set([])
      });
  }

  /**
   * Apply suggestion
   * 應用建議
   */
  applySuggestion(suggestion: SearchSuggestion): void {
    this.updateQuery(suggestion.text);
    if (suggestion.category) {
      this.selectedCategoryState.set(suggestion.category);
    }
    this.search();
  }

  // ============================================================================
  // UI State Methods (UI 狀態方法)
  // ============================================================================

  /**
   * Show results panel
   * 顯示結果面板
   */
  showResultsPanel(): void {
    this.isResultsPanelVisibleState.set(true);
  }

  /**
   * Hide results panel
   * 隱藏結果面板
   */
  hideResultsPanel(): void {
    this.isResultsPanelVisibleState.set(false);
    this.selectedIndexState.set(-1);
  }

  /**
   * Toggle results panel
   * 切換結果面板
   */
  toggleResultsPanel(): void {
    this.isResultsPanelVisibleState.update(visible => !visible);
  }

  /**
   * Clear search
   * 清除搜尋
   */
  clearSearch(): void {
    this.queryState.set('');
    this.clearResults();
    this.hideResultsPanel();
  }

  /**
   * Clear results only
   * 僅清除結果
   */
  clearResults(): void {
    this.resultsState.set([]);
    this.groupedResultsState.set([]);
    this.totalCountState.set(0);
    this.selectedIndexState.set(-1);
    this.suggestionsState.set([]);
    this.errorState.set(null);
  }

  /**
   * Focus search input
   * 聚焦搜尋輸入
   */
  focus(): void {
    this.showResultsPanel();
  }

  /**
   * Blur search input
   * 失焦搜尋輸入
   */
  blur(): void {
    setTimeout(() => {
      this.hideResultsPanel();
    }, 200);
  }

  // ============================================================================
  // Private Methods (私有方法)
  // ============================================================================

  /**
   * Setup search pipeline with debouncing
   * 設置帶防抖的搜尋管道
   */
  private setupSearchPipeline(): void {
    this.searchSubject
      .pipe(
        debounceTime(SEARCH_CONSTANTS.DEBOUNCE_DELAY),
        distinctUntilChanged(),
        filter(query => query.trim().length >= SEARCH_CONSTANTS.MIN_QUERY_LENGTH),
        tap(() => this.isSearchingState.set(true)),
        switchMap(query => {
          const options: SearchQueryOptions = {
            query,
            categories: this.selectedCategoryState() === SearchCategory.ALL ? undefined : [this.selectedCategoryState()],
            blueprintId: this.currentBlueprintIdState() || undefined,
            pageSize: SEARCH_CONSTANTS.QUICK_SEARCH_LIMIT
          };
          return this.searchRepository.search(options).pipe(
            catchError(error => {
              this.handleSearchError(error);
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(response => {
        if (response) {
          this.handleSearchResponse(response);
        }
      });
  }

  /**
   * Setup suggestion pipeline
   * 設置建議管道
   */
  private setupSuggestionPipeline(): void {
    this.suggestionSubject
      .pipe(
        debounceTime(150),
        distinctUntilChanged(),
        filter(query => query.trim().length >= 1),
        switchMap(query => this.searchRepository.getSuggestions(query).pipe(catchError(() => of([])))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(suggestions => {
        this.suggestionsState.set(suggestions);
      });
  }

  /**
   * Handle search response
   * 處理搜尋回應
   */
  private handleSearchResponse(response: SearchResponse): void {
    this.resultsState.set(response.items);
    this.groupedResultsState.set(response.groups);
    this.totalCountState.set(response.totalCount);
    this.isSearchingState.set(false);
    this.errorState.set(null);
    this.selectedIndexState.set(-1);
    this.showResultsPanel();
  }

  /**
   * Handle search error
   * 處理搜尋錯誤
   */
  private handleSearchError(error: unknown): void {
    this.logger.error('SearchService', 'Search error', error, { options: searchOptions });
    const errorMessage = error instanceof Error ? error.message : '搜尋時發生錯誤';
    this.errorState.set(errorMessage);
    this.isSearchingState.set(false);
    this.resultsState.set([]);
    this.groupedResultsState.set([]);
    this.totalCountState.set(0);
  }
}
