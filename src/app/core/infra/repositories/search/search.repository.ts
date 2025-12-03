/**
 * Search Repository
 *
 * 搜尋資料存取層
 * Search data access layer
 *
 * Provides search operations using Supabase PostgreSQL full-text search.
 * Implements enterprise-grade search capabilities including:
 * - Full-text search with tsvector/tsquery
 * - Multi-table search across tasks, blueprints, diaries
 * - Relevance ranking and scoring
 * - Pagination and filtering
 * - Search history tracking
 *
 * Uses Angular 20 inject() function for modern dependency injection.
 *
 * @module core/infra/repositories/search
 */

import { Injectable, inject } from '@angular/core';
import { Observable, from, map, of, catchError, forkJoin } from 'rxjs';

import { SupabaseService } from '../../../supabase/supabase.service';
import {
  SearchCategory,
  SearchResultItem,
  SearchResultPriority,
  SearchResponse,
  SearchQueryOptions,
  QuickSearchOptions,
  SearchHistoryItem,
  SearchSuggestion,
  SearchResultGroup,
  SEARCH_CATEGORY_CONFIG,
  SEARCH_CONSTANTS
} from '../../types/search/index';

@Injectable({
  providedIn: 'root'
})
export class SearchRepository {
  private readonly supabase = inject(SupabaseService);

  // ============================================================================
  // Full-Text Search Methods (全文搜尋方法)
  // ============================================================================

  /**
   * Execute full-text search across multiple tables
   * 執行跨多個表的全文搜尋
   */
  search(options: SearchQueryOptions): Observable<SearchResponse> {
    const startTime = Date.now();
    const categories = options.categories?.length
      ? options.categories.filter(c => c !== SearchCategory.ALL)
      : [SearchCategory.TASK, SearchCategory.BLUEPRINT, SearchCategory.DIARY];

    const searchObservables: Array<Observable<SearchResultItem[]>> = [];

    if (categories.includes(SearchCategory.TASK) || categories.length === 0) {
      searchObservables.push(this.searchTasks(options));
    }

    if (categories.includes(SearchCategory.BLUEPRINT) || categories.length === 0) {
      searchObservables.push(this.searchBlueprints(options));
    }

    if (categories.includes(SearchCategory.DIARY) || categories.length === 0) {
      searchObservables.push(this.searchDiaries(options));
    }

    if (categories.includes(SearchCategory.USER) || categories.length === 0) {
      searchObservables.push(this.searchUsers(options));
    }

    if (searchObservables.length === 0) {
      return of(this.createEmptyResponse(options.query, startTime));
    }

    return forkJoin(searchObservables).pipe(
      map(results => {
        const allItems = results.flat();
        return this.processSearchResults(allItems, options, startTime);
      }),
      catchError(error => {
        console.error('[SearchRepository] search error:', error);
        return of(this.createEmptyResponse(options.query, startTime));
      })
    );
  }

  /**
   * Quick search for autocomplete
   * 快速搜尋用於自動完成
   */
  quickSearch(options: QuickSearchOptions): Observable<SearchResultItem[]> {
    const fullOptions: SearchQueryOptions = {
      query: options.query,
      categories: options.categories,
      blueprintId: options.blueprintId,
      pageSize: options.limit || SEARCH_CONSTANTS.QUICK_SEARCH_LIMIT,
      page: 1,
      sortBy: undefined,
      sortOrder: undefined
    };

    return this.search(fullOptions).pipe(map(response => response.items.slice(0, options.limit || SEARCH_CONSTANTS.QUICK_SEARCH_LIMIT)));
  }

  // ============================================================================
  // Entity-Specific Search Methods (實體特定搜尋方法)
  // ============================================================================

  /**
   * Search tasks
   * 搜尋任務
   */
  private searchTasks(options: SearchQueryOptions): Observable<SearchResultItem[]> {
    const query = this.sanitizeQuery(options.query);
    if (!query) return of([]);

    let queryBuilder = this.supabase.client
      .from('tasks')
      .select('id, title, description, status, priority, blueprint_id, created_at, updated_at')
      .is('deleted_at', null);

    if (options.blueprintId) {
      queryBuilder = queryBuilder.eq('blueprint_id', options.blueprintId);
    }

    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    return from(queryBuilder.limit(options.pageSize || SEARCH_CONSTANTS.DEFAULT_PAGE_SIZE)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[SearchRepository] searchTasks error:', error);
          return [];
        }
        return (data || []).map((task: any) => this.mapTaskToSearchResult(task, query));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Search blueprints
   * 搜尋藍圖
   */
  private searchBlueprints(options: SearchQueryOptions): Observable<SearchResultItem[]> {
    const query = this.sanitizeQuery(options.query);
    if (!query) return of([]);

    let queryBuilder = this.supabase.client
      .from('blueprints')
      .select('id, name, description, status, created_at, updated_at')
      .is('deleted_at', null);

    if (options.organizationId) {
      queryBuilder = queryBuilder.eq('organization_id', options.organizationId);
    }

    queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);

    return from(queryBuilder.limit(options.pageSize || SEARCH_CONSTANTS.DEFAULT_PAGE_SIZE)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[SearchRepository] searchBlueprints error:', error);
          return [];
        }
        return (data || []).map((blueprint: any) => this.mapBlueprintToSearchResult(blueprint, query));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Search diaries (construction logs)
   * 搜尋施工日誌
   */
  private searchDiaries(options: SearchQueryOptions): Observable<SearchResultItem[]> {
    const query = this.sanitizeQuery(options.query);
    if (!query) return of([]);

    let queryBuilder = this.supabase.client
      .from('diaries')
      .select('id, title, content, blueprint_id, date, created_at, updated_at')
      .is('deleted_at', null);

    if (options.blueprintId) {
      queryBuilder = queryBuilder.eq('blueprint_id', options.blueprintId);
    }

    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    return from(queryBuilder.limit(options.pageSize || SEARCH_CONSTANTS.DEFAULT_PAGE_SIZE)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[SearchRepository] searchDiaries error:', error);
          return [];
        }
        return (data || []).map((diary: any) => this.mapDiaryToSearchResult(diary, query));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Search users
   * 搜尋使用者
   */
  private searchUsers(options: SearchQueryOptions): Observable<SearchResultItem[]> {
    const query = this.sanitizeQuery(options.query);
    if (!query) return of([]);

    const queryBuilder = this.supabase.client
      .from('profiles')
      .select('id, full_name, email, avatar_url, created_at')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);

    return from(queryBuilder.limit(options.pageSize || SEARCH_CONSTANTS.DEFAULT_PAGE_SIZE)).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[SearchRepository] searchUsers error:', error);
          return [];
        }
        return (data || []).map((user: any) => this.mapUserToSearchResult(user, query));
      }),
      catchError(() => of([]))
    );
  }

  // ============================================================================
  // Search History Methods (搜尋歷史方法)
  // ============================================================================

  /**
   * Save search history
   * 儲存搜尋歷史
   */
  saveSearchHistory(query: string, resultCount: number, categories?: SearchCategory[]): Observable<boolean> {
    const currentUser = this.supabase.currentUser;
    if (!currentUser || !query.trim()) return of(false);

    return from(
      this.supabase.client.from('search_history').insert({
        user_id: currentUser.id,
        query: query.trim(),
        categories: categories || [SearchCategory.ALL],
        result_count: resultCount,
        has_click: false
      })
    ).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[SearchRepository] saveSearchHistory error:', error);
          return false;
        }
        return true;
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Get search history for current user
   * 獲取當前使用者的搜尋歷史
   */
  getSearchHistory(limit: number = SEARCH_CONSTANTS.MAX_HISTORY_ITEMS): Observable<SearchHistoryItem[]> {
    const currentUser = this.supabase.currentUser;
    if (!currentUser) return of([]);

    return from(
      this.supabase.client
        .from('search_history')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('timestamp', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('[SearchRepository] getSearchHistory error:', error);
          return [];
        }
        return (data || []) as SearchHistoryItem[];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Clear search history for current user
   * 清除當前使用者的搜尋歷史
   */
  clearSearchHistory(): Observable<boolean> {
    const currentUser = this.supabase.currentUser;
    if (!currentUser) return of(false);

    return from(this.supabase.client.from('search_history').delete().eq('user_id', currentUser.id)).pipe(
      map(({ error }) => {
        if (error) {
          console.error('[SearchRepository] clearSearchHistory error:', error);
          return false;
        }
        return true;
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Get search suggestions based on history and popular searches
   * 根據歷史和熱門搜尋獲取搜尋建議
   */
  getSuggestions(query: string, limit: number = SEARCH_CONSTANTS.MAX_SUGGESTIONS): Observable<SearchSuggestion[]> {
    const currentUser = this.supabase.currentUser;
    if (!query.trim()) return of([]);

    const suggestions: SearchSuggestion[] = [];
    const sanitizedQuery = this.sanitizeQuery(query);

    if (!currentUser) {
      return of([
        {
          text: sanitizedQuery,
          type: 'autocomplete',
          icon: 'search'
        }
      ]);
    }

    return from(
      this.supabase.client
        .from('search_history')
        .select('query, categories')
        .eq('user_id', currentUser.id)
        .ilike('query', `${sanitizedQuery}%`)
        .order('timestamp', { ascending: false })
        .limit(limit)
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return suggestions;

        const uniqueQueries = new Set<string>();
        data.forEach((item: any) => {
          if (!uniqueQueries.has(item.query)) {
            uniqueQueries.add(item.query);
            suggestions.push({
              text: item.query,
              type: 'history',
              category: item.categories?.[0] as SearchCategory,
              icon: 'history'
            });
          }
        });

        if (suggestions.length === 0) {
          suggestions.push({
            text: sanitizedQuery,
            type: 'autocomplete',
            icon: 'search'
          });
        }

        return suggestions;
      }),
      catchError(() => of(suggestions))
    );
  }

  // ============================================================================
  // Helper Methods (輔助方法)
  // ============================================================================

  /**
   * Sanitize search query to prevent injection
   * 清理搜尋查詢以防止注入
   */
  private sanitizeQuery(query: string): string {
    if (!query) return '';
    return query
      .trim()
      .replace(/[<>'"%;()&+\\]/g, '')
      .substring(0, 200);
  }

  /**
   * Calculate relevance score based on match quality
   * 根據匹配質量計算相關性分數
   */
  private calculateScore(text: string, query: string): number {
    if (!text || !query) return 0;

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText === lowerQuery) return 1.0;
    if (lowerText.startsWith(lowerQuery)) return 0.9;
    if (lowerText.includes(lowerQuery)) return 0.7;
    return 0.5;
  }

  /**
   * Generate highlighted snippet
   * 生成高亮片段
   */
  private generateHighlight(text: string, query: string, maxLength = 150): string {
    if (!text || !query) return text || '';

    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);

    if (index === -1) {
      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    }

    const start = Math.max(0, index - 30);
    const end = Math.min(text.length, index + query.length + 100);
    let snippet = text.substring(start, end);

    if (start > 0) snippet = `...${snippet}`;
    if (end < text.length) snippet = `${snippet}...`;

    return snippet;
  }

  /**
   * Determine search result priority
   * 確定搜尋結果優先級
   */
  private determinePriority(title: string, description: string | null, query: string): SearchResultPriority {
    const lowerQuery = query.toLowerCase();

    if (title.toLowerCase() === lowerQuery) {
      return SearchResultPriority.EXACT;
    }
    if (title.toLowerCase().includes(lowerQuery)) {
      return SearchResultPriority.TITLE;
    }
    if (description?.toLowerCase().includes(lowerQuery)) {
      return SearchResultPriority.CONTENT;
    }
    return SearchResultPriority.FUZZY;
  }

  /**
   * Map task to search result
   * 將任務映射為搜尋結果
   */
  private mapTaskToSearchResult(task: any, query: string): SearchResultItem {
    const config = SEARCH_CATEGORY_CONFIG[SearchCategory.TASK];
    return {
      id: task.id,
      category: SearchCategory.TASK,
      title: task.title,
      description: task.description,
      highlight: this.generateHighlight(task.description || task.title, query),
      score: this.calculateScore(task.title, query),
      priority: this.determinePriority(task.title, task.description, query),
      url: `/blueprint/${task.blueprint_id}/task/${task.id}`,
      parentId: task.blueprint_id,
      icon: config.icon,
      tags: [task.status, task.priority].filter(Boolean),
      createdAt: task.created_at,
      updatedAt: task.updated_at
    };
  }

  /**
   * Map blueprint to search result
   * 將藍圖映射為搜尋結果
   */
  private mapBlueprintToSearchResult(blueprint: any, query: string): SearchResultItem {
    const config = SEARCH_CATEGORY_CONFIG[SearchCategory.BLUEPRINT];
    return {
      id: blueprint.id,
      category: SearchCategory.BLUEPRINT,
      title: blueprint.name,
      description: blueprint.description,
      highlight: this.generateHighlight(blueprint.description || blueprint.name, query),
      score: this.calculateScore(blueprint.name, query),
      priority: this.determinePriority(blueprint.name, blueprint.description, query),
      url: `/blueprint/${blueprint.id}`,
      icon: config.icon,
      tags: [blueprint.status].filter(Boolean),
      createdAt: blueprint.created_at,
      updatedAt: blueprint.updated_at
    };
  }

  /**
   * Map diary to search result
   * 將日誌映射為搜尋結果
   */
  private mapDiaryToSearchResult(diary: any, query: string): SearchResultItem {
    const config = SEARCH_CATEGORY_CONFIG[SearchCategory.DIARY];
    return {
      id: diary.id,
      category: SearchCategory.DIARY,
      title: diary.title || `施工日誌 - ${diary.date}`,
      description: diary.content,
      highlight: this.generateHighlight(diary.content || diary.title, query),
      score: this.calculateScore(diary.title || '', query),
      priority: this.determinePriority(diary.title || '', diary.content, query),
      url: `/blueprint/${diary.blueprint_id}/diary/${diary.id}`,
      parentId: diary.blueprint_id,
      icon: config.icon,
      createdAt: diary.created_at,
      updatedAt: diary.updated_at
    };
  }

  /**
   * Map user to search result
   * 將使用者映射為搜尋結果
   */
  private mapUserToSearchResult(user: any, query: string): SearchResultItem {
    const config = SEARCH_CATEGORY_CONFIG[SearchCategory.USER];
    return {
      id: user.id,
      category: SearchCategory.USER,
      title: user.full_name || user.email,
      description: user.email,
      highlight: user.full_name || user.email,
      score: this.calculateScore(user.full_name || user.email, query),
      priority: this.determinePriority(user.full_name || '', user.email, query),
      url: `/user/${user.id}`,
      icon: config.icon,
      createdAt: user.created_at,
      metadata: { avatar_url: user.avatar_url }
    };
  }

  /**
   * Process and sort search results
   * 處理和排序搜尋結果
   */
  private processSearchResults(items: SearchResultItem[], options: SearchQueryOptions, startTime: number): SearchResponse {
    items.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.score - a.score;
    });

    const groups = this.groupResults(items);
    const page = options.page || 1;
    const pageSize = options.pageSize || SEARCH_CONSTANTS.DEFAULT_PAGE_SIZE;
    const totalCount = items.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      groups,
      totalCount,
      page,
      pageSize,
      totalPages,
      query: options.query,
      duration: Date.now() - startTime,
      hasMore: page < totalPages
    };
  }

  /**
   * Group results by category
   * 按分類分組結果
   */
  private groupResults(items: SearchResultItem[]): SearchResultGroup[] {
    const groupMap = new Map<SearchCategory, SearchResultItem[]>();

    items.forEach(item => {
      const existing = groupMap.get(item.category) || [];
      existing.push(item);
      groupMap.set(item.category, existing);
    });

    const groups: SearchResultGroup[] = [];
    groupMap.forEach((groupItems, category) => {
      const config = SEARCH_CATEGORY_CONFIG[category];
      groups.push({
        category,
        categoryLabel: config.label,
        categoryIcon: config.icon,
        items: groupItems,
        totalCount: groupItems.length
      });
    });

    groups.sort((a, b) => {
      const weightA = SEARCH_CATEGORY_CONFIG[a.category].weight;
      const weightB = SEARCH_CATEGORY_CONFIG[b.category].weight;
      return weightA - weightB;
    });

    return groups;
  }

  /**
   * Create empty search response
   * 建立空的搜尋回應
   */
  private createEmptyResponse(query: string, startTime: number): SearchResponse {
    return {
      items: [],
      groups: [],
      totalCount: 0,
      page: 1,
      pageSize: SEARCH_CONSTANTS.DEFAULT_PAGE_SIZE,
      totalPages: 0,
      query,
      duration: Date.now() - startTime,
      hasMore: false
    };
  }
}
