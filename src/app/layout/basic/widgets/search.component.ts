/**
 * Header Search Component
 *
 * 企業級全域搜尋元件
 * Enterprise-grade global search component
 *
 * Features:
 * - Full-text search with autocomplete
 * - Multi-category search (tasks, blueprints, diaries, users)
 * - Keyboard navigation (Arrow keys, Enter, Escape, F1)
 * - Search history and suggestions
 * - Category-based filtering
 * - Loading states and skeleton screens
 * - Responsive design
 * - Accessibility (a11y) support
 *
 * Uses Angular 20 modern patterns:
 * - Standalone component
 * - signal(), computed() for reactive state
 * - inject() for dependency injection
 * - ChangeDetectionStrategy.OnPush for performance
 *
 * @module layout/basic/widgets
 */

import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  HostBinding,
  HostListener,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
  input,
  output,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  SearchCategory,
  SearchResultItem,
  SearchSuggestion,
  SearchHistoryItem,
  SEARCH_CATEGORY_CONFIG,
  SEARCH_CONSTANTS,
  SEARCH_KEYBOARD_SHORTCUTS
} from '@core';
import { I18nPipe } from '@delon/theme';
import { SearchService } from '@shared';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'header-search',
  template: `
    <nz-input-group [nzPrefix]="iconTpl" [nzSuffix]="suffixTpl">
      <ng-template #iconTpl>
        <i nz-icon [nzType]="searchIconType()" class="search-icon" [class.active]="focus()"></i>
      </ng-template>

      <ng-template #suffixTpl>
        @if (searchService.isSearching()) {
          <i nz-icon nzType="loading" nzSpin class="loading-icon"></i>
        } @else if (searchService.query()) {
          <i nz-icon nzType="close-circle" nz-tooltip="清除搜尋" class="clear-icon" (click)="clearSearch($event)"></i>
        }
      </ng-template>

      <input
        #searchInput
        type="text"
        nz-input
        [ngModel]="searchService.query()"
        (ngModelChange)="onQueryChange($event)"
        [nzAutocomplete]="searchAutocomplete"
        (focus)="onFocus()"
        (blur)="onBlur()"
        (keydown)="onInputKeydown($event)"
        [attr.placeholder]="'menu.search.placeholder' | i18n"
        [attr.aria-label]="'搜尋' | i18n"
        autocomplete="off"
        role="searchbox"
      />
    </nz-input-group>

    <!-- Autocomplete dropdown -->
    <nz-autocomplete
      #searchAutocomplete
      [nzBackfill]="false"
      [nzDefaultActiveFirstOption]="false"
      [nzOverlayClassName]="'search-autocomplete-overlay'"
      [nzWidth]="dropdownWidth()"
    >
      <!-- Loading state -->
      @if (searchService.isSearching()) {
        <nz-auto-option [nzDisabled]="true" [nzValue]="null">
          <div class="search-loading">
            <nz-skeleton [nzActive]="true" [nzParagraph]="{ rows: 2 }"></nz-skeleton>
          </div>
        </nz-auto-option>
      }

      <!-- Categories filter -->
      @if (showCategoryFilter()) {
        <nz-auto-option [nzDisabled]="true" [nzValue]="null">
          <div class="search-categories">
            @for (category of availableCategories(); track category.category) {
              <nz-tag
                [nzColor]="selectedCategory() === category.category ? 'blue' : 'default'"
                (click)="selectCategory(category.category, $event)"
                class="category-tag"
              >
                <i nz-icon [nzType]="category.icon"></i>
                {{ category.label }}
              </nz-tag>
            }
          </div>
        </nz-auto-option>
      }

      <!-- Search suggestions -->
      @if (showSuggestions()) {
        @for (suggestion of searchService.suggestions(); track suggestion.text) {
          <nz-auto-option [nzValue]="suggestion.text" [nzLabel]="suggestion.text" (click)="selectSuggestion(suggestion)">
            <div class="suggestion-item">
              <i nz-icon [nzType]="suggestion.icon || 'search'" class="suggestion-icon"></i>
              <span class="suggestion-text">{{ suggestion.text }}</span>
              @if (suggestion.type === 'history') {
                <nz-tag nzColor="default" class="suggestion-tag">歷史</nz-tag>
              }
            </div>
          </nz-auto-option>
        }
      }

      <!-- Search results -->
      @if (showResults()) {
        @for (result of displayResults(); track result.id; let i = $index) {
          <nz-auto-option
            [nzValue]="result.title"
            [nzLabel]="result.title"
            [class.selected]="i === searchService.selectedIndex()"
            (click)="selectResult(result)"
          >
            <div class="result-item">
              <div class="result-icon">
                <i nz-icon [nzType]="result.icon || 'file'" [style.color]="getCategoryColor(result.category)"></i>
              </div>
              <div class="result-content">
                <div class="result-title">{{ result.title }}</div>
                @if (result.highlight) {
                  <div class="result-highlight">{{ result.highlight }}</div>
                }
                @if (result.parentName) {
                  <div class="result-parent">
                    <i nz-icon nzType="folder" nzTheme="outline"></i>
                    {{ result.parentName }}
                  </div>
                }
              </div>
              <div class="result-meta">
                <nz-tag [nzColor]="getCategoryColor(result.category)" class="result-category-tag">
                  {{ getCategoryLabel(result.category) }}
                </nz-tag>
              </div>
            </div>
          </nz-auto-option>
        }

        <!-- More results hint -->
        @if (hasMoreResults()) {
          <nz-auto-option [nzDisabled]="true" [nzValue]="null">
            <div class="more-results">
              <span>還有 {{ remainingCount() }} 個結果</span>
              <a (click)="showAllResults($event)">查看全部</a>
            </div>
          </nz-auto-option>
        }
      }

      <!-- Empty state -->
      @if (showEmptyState()) {
        <nz-auto-option [nzDisabled]="true" [nzValue]="null">
          <nz-empty [nzNotFoundContent]="'未找到相關結果'" [nzNotFoundImage]="'simple'"></nz-empty>
        </nz-auto-option>
      }

      <!-- Recent searches -->
      @if (showRecentSearches()) {
        <nz-auto-option [nzDisabled]="true" [nzValue]="null">
          <div class="recent-header">
            <span>最近搜尋</span>
            <a (click)="clearHistory($event)">清除</a>
          </div>
        </nz-auto-option>
        @for (history of recentHistory(); track history.id) {
          <nz-auto-option [nzValue]="history.query" [nzLabel]="history.query" (click)="searchFromHistory(history)">
            <div class="history-item">
              <i nz-icon nzType="history" class="history-icon"></i>
              <span class="history-text">{{ history.query }}</span>
              <span class="history-count">{{ history.resultCount }} 個結果</span>
            </div>
          </nz-auto-option>
        }
      }
    </nz-autocomplete>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 200px;
        transition: width 0.3s ease;

        &.alain-default__search-focus {
          width: 320px;
        }

        &.alain-default__search-toggled {
          width: 320px;
        }
      }

      .search-icon {
        color: rgba(0, 0, 0, 0.45);
        transition: color 0.3s;

        &.active {
          color: #1890ff;
        }
      }

      .loading-icon {
        color: #1890ff;
      }

      .clear-icon {
        color: rgba(0, 0, 0, 0.45);
        cursor: pointer;
        transition: color 0.3s;

        &:hover {
          color: rgba(0, 0, 0, 0.85);
        }
      }

      ::ng-deep .search-autocomplete-overlay {
        .ant-select-dropdown {
          padding: 8px 0;
          max-height: 480px;
          overflow-y: auto;
        }
      }

      .search-loading {
        padding: 12px 16px;
      }

      .search-categories {
        padding: 8px 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px;

        .category-tag {
          cursor: pointer;
          transition: all 0.2s;

          &:hover {
            transform: scale(1.05);
          }
        }
      }

      .suggestion-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;

        .suggestion-icon {
          color: rgba(0, 0, 0, 0.45);
        }

        .suggestion-text {
          flex: 1;
        }

        .suggestion-tag {
          font-size: 12px;
        }
      }

      .result-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 8px 0;

        .result-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f5f5f5;
          border-radius: 4px;
          font-size: 16px;
        }

        .result-content {
          flex: 1;
          min-width: 0;

          .result-title {
            font-weight: 500;
            color: rgba(0, 0, 0, 0.85);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .result-highlight {
            font-size: 12px;
            color: rgba(0, 0, 0, 0.45);
            margin-top: 2px;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .result-parent {
            font-size: 12px;
            color: rgba(0, 0, 0, 0.45);
            margin-top: 4px;

            i {
              margin-right: 4px;
            }
          }
        }

        .result-meta {
          flex-shrink: 0;

          .result-category-tag {
            font-size: 12px;
          }
        }
      }

      .more-results {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        color: rgba(0, 0, 0, 0.45);

        a {
          color: #1890ff;
          cursor: pointer;

          &:hover {
            color: #40a9ff;
          }
        }
      }

      .recent-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.45);
        border-bottom: 1px solid #f0f0f0;

        a {
          color: #1890ff;
          cursor: pointer;

          &:hover {
            color: #40a9ff;
          }
        }
      }

      .history-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 0;

        .history-icon {
          color: rgba(0, 0, 0, 0.45);
        }

        .history-text {
          flex: 1;
        }

        .history-count {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.45);
        }
      }

      nz-auto-option.selected {
        background-color: #e6f7ff;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    I18nPipe,
    NzAutocompleteModule,
    NzBadgeModule,
    NzButtonModule,
    NzDividerModule,
    NzEmptyModule,
    NzIconModule,
    NzInputModule,
    NzListModule,
    NzPopoverModule,
    NzSkeletonModule,
    NzSpinModule,
    NzTagModule,
    NzTooltipModule
  ]
})
export class HeaderSearchComponent implements OnInit, OnDestroy {
  readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  // View child for input element
  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // ============================================================================
  // Inputs & Outputs
  // ============================================================================

  readonly toggleChange = input<boolean>(false);
  readonly toggleChangeChange = output<boolean>();

  // ============================================================================
  // Local State Signals
  // ============================================================================

  readonly focus = signal<boolean>(false);
  private readonly searchToggled = signal<boolean>(false);
  private readonly maxDisplayResults = signal<number>(8);

  // ============================================================================
  // Host Bindings
  // ============================================================================

  @HostBinding('class.alain-default__search-focus')
  get isFocused(): boolean {
    return this.focus();
  }

  @HostBinding('class.alain-default__search-toggled')
  get isToggled(): boolean {
    return this.searchToggled();
  }

  // ============================================================================
  // Computed Signals
  // ============================================================================

  readonly searchIconType = computed(() => {
    if (this.searchService.isSearching()) return 'loading';
    return this.focus() ? 'search' : 'search';
  });

  readonly dropdownWidth = computed(() => {
    return this.focus() ? 400 : 320;
  });

  readonly availableCategories = computed(() => {
    return this.searchService.availableCategories();
  });

  readonly selectedCategory = computed(() => {
    return this.searchService.selectedCategory();
  });

  readonly displayResults = computed(() => {
    return this.searchService.filteredResults().slice(0, this.maxDisplayResults());
  });

  readonly hasMoreResults = computed(() => {
    return this.searchService.filteredResults().length > this.maxDisplayResults();
  });

  readonly remainingCount = computed(() => {
    return this.searchService.totalCount() - this.maxDisplayResults();
  });

  readonly recentHistory = computed(() => {
    return this.searchService.history().slice(0, 5);
  });

  readonly showCategoryFilter = computed(() => {
    const query = this.searchService.query();
    return query.length >= SEARCH_CONSTANTS.MIN_QUERY_LENGTH && !this.searchService.isSearching();
  });

  readonly showSuggestions = computed(() => {
    const suggestions = this.searchService.suggestions();
    const results = this.searchService.results();
    const query = this.searchService.query();
    return query.length >= 1 && suggestions.length > 0 && results.length === 0 && !this.searchService.isSearching();
  });

  readonly showResults = computed(() => {
    const results = this.searchService.results();
    return results.length > 0 && !this.searchService.isSearching();
  });

  readonly showEmptyState = computed(() => {
    const query = this.searchService.query();
    const results = this.searchService.results();
    const isSearching = this.searchService.isSearching();
    return query.length >= SEARCH_CONSTANTS.MIN_QUERY_LENGTH && results.length === 0 && !isSearching;
  });

  readonly showRecentSearches = computed(() => {
    const query = this.searchService.query();
    const history = this.searchService.history();
    return query.length === 0 && history.length > 0 && this.focus();
  });

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================

  constructor() {
    effect(() => {
      const toggle = this.toggleChange();
      if (toggle !== undefined) {
        this.searchToggled.set(toggle);
        this.focus.set(toggle);
        if (toggle) {
          setTimeout(() => {
            this.searchInput()?.nativeElement?.focus();
          });
        }
      }
    });
  }

  ngOnInit(): void {
    this.searchService.initialize();
  }

  ngOnDestroy(): void {
    this.searchService.clearSearch();
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  onQueryChange(query: string): void {
    this.searchService.updateQuery(query);
  }

  onFocus(): void {
    this.focus.set(true);
    this.searchService.focus();
  }

  onBlur(): void {
    this.focus.set(false);
    this.searchToggled.set(false);
    this.toggleChangeChange.emit(false);
    this.searchService.blur();
  }

  @HostListener('window:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    const key = event.key;

    if (key === SEARCH_KEYBOARD_SHORTCUTS.OPEN_SEARCH && !this.focus()) {
      event.preventDefault();
      this.searchInput()?.nativeElement?.focus();
    }
  }

  onInputKeydown(event: KeyboardEvent): void {
    const key = event.key;

    switch (key) {
      case SEARCH_KEYBOARD_SHORTCUTS.CLOSE_SEARCH:
        this.searchService.hideResultsPanel();
        this.searchInput()?.nativeElement?.blur();
        break;

      case SEARCH_KEYBOARD_SHORTCUTS.PREV_RESULT:
        event.preventDefault();
        this.searchService.selectPrevious();
        break;

      case SEARCH_KEYBOARD_SHORTCUTS.NEXT_RESULT:
        event.preventDefault();
        this.searchService.selectNext();
        break;

      case SEARCH_KEYBOARD_SHORTCUTS.SELECT_RESULT: {
        const selected = this.searchService.selectedResult();
        if (selected) {
          event.preventDefault();
          this.selectResult(selected);
        }
        break;
      }
    }
  }

  clearSearch(event: Event): void {
    event.stopPropagation();
    this.searchService.clearSearch();
    this.searchInput()?.nativeElement?.focus();
  }

  selectCategory(category: SearchCategory, event: Event): void {
    event.stopPropagation();
    this.searchService.selectCategory(category);
  }

  selectSuggestion(suggestion: SearchSuggestion): void {
    this.searchService.applySuggestion(suggestion);
  }

  selectResult(result: SearchResultItem): void {
    this.searchService.navigateToResult(result);
  }

  searchFromHistory(history: SearchHistoryItem): void {
    this.searchService.searchFromHistory(history);
  }

  showAllResults(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    const query = this.searchService.query();
    this.router.navigate(['/search'], { queryParams: { q: query } });
  }

  clearHistory(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.searchService.clearHistory();
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  getCategoryColor(category: SearchCategory): string {
    return SEARCH_CATEGORY_CONFIG[category]?.color || 'default';
  }

  getCategoryLabel(category: SearchCategory): string {
    return SEARCH_CATEGORY_CONFIG[category]?.label || category;
  }
}
