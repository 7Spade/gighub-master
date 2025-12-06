/**
 * Blueprint Advanced Search Component
 *
 * 藍圖進階搜尋元件
 * Comprehensive search interface with filters and results display
 *
 * Features:
 * - Multi-category search (tasks, diaries, files, problems, etc.)
 * - Advanced filters (status, date range, assignee, priority)
 * - Search results with highlighting
 * - Search history and saved searches
 *
 * @module routes/blueprint/search
 */

import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzPageHeaderModule } from 'ng-zorro-antd/page-header';
import { NzPaginationModule } from 'ng-zorro-antd/pagination';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  score: number;
  highlights: { field: string; value: string }[];
}

interface SearchFilter {
  types: string[];
  status: string[];
  priority: string[];
  dateRange: [Date | null, Date | null];
  createdBy: string | null;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilter;
  createdAt: Date;
}

@Component({
  selector: 'app-blueprint-advanced-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NzPageHeaderModule,
    NzBreadCrumbModule,
    NzCardModule,
    NzGridModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzCheckboxModule,
    NzTableModule,
    NzTagModule,
    NzPaginationModule,
    NzEmptyModule,
    NzSpinModule,
    NzStatisticModule,
    NzDividerModule,
    NzToolTipModule
  ],
  template: `
    <nz-page-header nzBackIcon [nzGhost]="false" (nzBack)="goBack()">
      <nz-breadcrumb nz-page-header-breadcrumb>
        <nz-breadcrumb-item><a [routerLink]="['/blueprint', blueprintId(), 'overview']">藍圖概覽</a></nz-breadcrumb-item>
        <nz-breadcrumb-item>進階搜尋</nz-breadcrumb-item>
      </nz-breadcrumb>
      <nz-page-header-title>進階搜尋</nz-page-header-title>
      <nz-page-header-subtitle>在此藍圖中搜尋任務、日誌、檔案、問題等</nz-page-header-subtitle>
    </nz-page-header>

    <div class="search-container">
      <!-- Search Input -->
      <nz-card [nzBordered]="false" style="margin-bottom: 16px;">
        <div class="search-input-row">
          <nz-input-group [nzPrefix]="searchIconTpl" nzSize="large" style="flex: 1;">
            <input
              nz-input
              type="text"
              placeholder="輸入關鍵字搜尋..."
              [(ngModel)]="searchQuery"
              (keyup.enter)="performSearch()"
            />
          </nz-input-group>
          <ng-template #searchIconTpl>
            <span nz-icon nzType="search"></span>
          </ng-template>
          <button nz-button nzType="primary" nzSize="large" (click)="performSearch()" [nzLoading]="searching()">
            搜尋
          </button>
          <button nz-button nzSize="large" (click)="toggleFilters()">
            <span nz-icon nzType="filter"></span>
            篩選
            @if (activeFilterCount() > 0) {
              <nz-tag [nzColor]="'blue'" style="margin-left: 8px;">{{ activeFilterCount() }}</nz-tag>
            }
          </button>
          <button nz-button nzSize="large" (click)="clearSearch()">
            清除
          </button>
        </div>
      </nz-card>

      <!-- Filters Panel -->
      @if (showFilters()) {
        <nz-card [nzBordered]="false" nzTitle="篩選條件" [nzExtra]="filterExtraTpl" style="margin-bottom: 16px;">
          <ng-template #filterExtraTpl>
            <button nz-button nzType="link" (click)="resetFilters()">重設篩選</button>
          </ng-template>

          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="6">
              <label class="filter-label">搜尋類型</label>
              <nz-select
                [(ngModel)]="filters.types"
                nzMode="multiple"
                nzPlaceHolder="選擇類型"
                style="width: 100%;"
              >
                <nz-option nzValue="task" nzLabel="任務"></nz-option>
                <nz-option nzValue="diary" nzLabel="日誌"></nz-option>
                <nz-option nzValue="file" nzLabel="檔案"></nz-option>
                <nz-option nzValue="problem" nzLabel="問題"></nz-option>
                <nz-option nzValue="qc" nzLabel="品質檢查"></nz-option>
                <nz-option nzValue="acceptance" nzLabel="驗收"></nz-option>
              </nz-select>
            </div>
            <div nz-col [nzSpan]="6">
              <label class="filter-label">狀態</label>
              <nz-select
                [(ngModel)]="filters.status"
                nzMode="multiple"
                nzPlaceHolder="選擇狀態"
                style="width: 100%;"
              >
                <nz-option nzValue="pending" nzLabel="待處理"></nz-option>
                <nz-option nzValue="in_progress" nzLabel="進行中"></nz-option>
                <nz-option nzValue="completed" nzLabel="已完成"></nz-option>
                <nz-option nzValue="cancelled" nzLabel="已取消"></nz-option>
              </nz-select>
            </div>
            <div nz-col [nzSpan]="6">
              <label class="filter-label">優先級</label>
              <nz-select
                [(ngModel)]="filters.priority"
                nzMode="multiple"
                nzPlaceHolder="選擇優先級"
                style="width: 100%;"
              >
                <nz-option nzValue="low" nzLabel="低"></nz-option>
                <nz-option nzValue="medium" nzLabel="中"></nz-option>
                <nz-option nzValue="high" nzLabel="高"></nz-option>
                <nz-option nzValue="urgent" nzLabel="緊急"></nz-option>
              </nz-select>
            </div>
            <div nz-col [nzSpan]="6">
              <label class="filter-label">日期範圍</label>
              <nz-range-picker
                [(ngModel)]="filters.dateRange"
                style="width: 100%;"
              ></nz-range-picker>
            </div>
          </div>
        </nz-card>
      }

      <!-- Search Statistics -->
      @if (hasSearched()) {
        <nz-card [nzBordered]="false" style="margin-bottom: 16px;">
          <div nz-row [nzGutter]="16">
            <div nz-col [nzSpan]="4">
              <nz-statistic nzTitle="搜尋結果" [nzValue]="totalResults()"></nz-statistic>
            </div>
            <div nz-col [nzSpan]="4">
              <nz-statistic nzTitle="任務" [nzValue]="resultsByType()['task'] || 0"></nz-statistic>
            </div>
            <div nz-col [nzSpan]="4">
              <nz-statistic nzTitle="日誌" [nzValue]="resultsByType()['diary'] || 0"></nz-statistic>
            </div>
            <div nz-col [nzSpan]="4">
              <nz-statistic nzTitle="檔案" [nzValue]="resultsByType()['file'] || 0"></nz-statistic>
            </div>
            <div nz-col [nzSpan]="4">
              <nz-statistic nzTitle="問題" [nzValue]="resultsByType()['problem'] || 0"></nz-statistic>
            </div>
            <div nz-col [nzSpan]="4">
              <nz-statistic nzTitle="搜尋時間" [nzValue]="searchTime() + 'ms'"></nz-statistic>
            </div>
          </div>
        </nz-card>
      }

      <!-- Search Results -->
      <nz-spin [nzSpinning]="searching()">
        @if (!hasSearched()) {
          <nz-card [nzBordered]="false">
            <nz-empty nzNotFoundContent="輸入關鍵字開始搜尋" [nzNotFoundImage]="searchEmptyTpl">
              <ng-template #searchEmptyTpl>
                <span nz-icon nzType="search" style="font-size: 64px; color: #d9d9d9;"></span>
              </ng-template>
            </nz-empty>
          </nz-card>
        } @else if (results().length === 0) {
          <nz-card [nzBordered]="false">
            <nz-empty nzNotFoundContent="沒有找到符合的結果">
              <ng-template nz-empty-footer>
                <p class="empty-hint">嘗試使用不同的關鍵字或調整篩選條件</p>
              </ng-template>
            </nz-empty>
          </nz-card>
        } @else {
          <nz-card [nzBordered]="false" [nzBodyStyle]="{ padding: 0 }">
            <div class="results-list">
              @for (result of results(); track result.id) {
                <div class="result-item" (click)="navigateToResult(result)">
                  <div class="result-header">
                    <nz-tag [nzColor]="getTypeColor(result.type)">{{ getTypeLabel(result.type) }}</nz-tag>
                    <span class="result-title">{{ result.title }}</span>
                    @if (result.status) {
                      <nz-tag [nzColor]="getStatusColor(result.status)">{{ getStatusLabel(result.status) }}</nz-tag>
                    }
                  </div>
                  <div class="result-description">
                    @if (result.highlights.length > 0) {
                      <span [innerHTML]="result.highlights[0].value"></span>
                    } @else {
                      {{ result.description || '無描述' }}
                    }
                  </div>
                  <div class="result-meta">
                    <span>
                      <span nz-icon nzType="clock-circle" nzTheme="outline"></span>
                      {{ formatDate(result.updatedAt) }}
                    </span>
                    @if (result.createdBy) {
                      <span>
                        <span nz-icon nzType="user" nzTheme="outline"></span>
                        {{ result.createdBy }}
                      </span>
                    }
                    <span class="result-score">
                      相關度: {{ (result.score * 100).toFixed(0) }}%
                    </span>
                  </div>
                </div>
              }
            </div>
          </nz-card>

          <!-- Pagination -->
          <div class="pagination-container">
            <nz-pagination
              [(nzPageIndex)]="currentPage"
              [nzTotal]="totalResults()"
              [nzPageSize]="pageSize"
              [nzShowSizeChanger]="true"
              [nzShowQuickJumper]="true"
              (nzPageIndexChange)="onPageChange($event)"
              (nzPageSizeChange)="onPageSizeChange($event)"
            ></nz-pagination>
          </div>
        }
      </nz-spin>

      <!-- Search History -->
      @if (searchHistory().length > 0 && !hasSearched()) {
        <nz-card nzTitle="搜尋歷史" [nzBordered]="false" style="margin-top: 16px;" [nzExtra]="historyExtraTpl">
          <ng-template #historyExtraTpl>
            <button nz-button nzType="link" nzDanger (click)="clearHistory()">清除歷史</button>
          </ng-template>
          <div class="history-list">
            @for (query of searchHistory(); track query) {
              <nz-tag class="history-tag" (click)="searchFromHistory(query)">
                <span nz-icon nzType="clock-circle" nzTheme="outline"></span>
                {{ query }}
              </nz-tag>
            }
          </div>
        </nz-card>
      }
    </div>
  `,
  styles: [
    `
      .search-container {
        padding: 24px;
      }

      .search-input-row {
        display: flex;
        gap: 12px;
        align-items: center;
      }

      .filter-label {
        display: block;
        margin-bottom: 8px;
        color: #666;
        font-size: 13px;
      }

      .results-list {
        padding: 0;
      }

      .result-item {
        padding: 16px 24px;
        border-bottom: 1px solid #f0f0f0;
        cursor: pointer;
        transition: background 0.2s;
      }

      .result-item:hover {
        background: #fafafa;
      }

      .result-item:last-child {
        border-bottom: none;
      }

      .result-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .result-title {
        font-size: 15px;
        font-weight: 500;
        color: #1890ff;
      }

      .result-description {
        color: #666;
        font-size: 13px;
        margin-bottom: 8px;
        line-height: 1.6;
      }

      .result-description ::ng-deep em {
        background: #ffe58f;
        font-style: normal;
        padding: 0 2px;
      }

      .result-meta {
        display: flex;
        gap: 16px;
        color: #999;
        font-size: 12px;
      }

      .result-meta span {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .result-score {
        margin-left: auto;
      }

      .pagination-container {
        display: flex;
        justify-content: flex-end;
        padding: 16px 24px;
        background: #fff;
        border-top: 1px solid #f0f0f0;
      }

      .history-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .history-tag {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .history-tag:hover {
        color: #1890ff;
      }

      .empty-hint {
        color: #999;
        font-size: 13px;
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BlueprintAdvancedSearchComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly msg = inject(NzMessageService);

  blueprintId = signal('');
  searching = signal(false);
  showFilters = signal(false);
  hasSearched = signal(false);

  searchQuery = '';
  currentPage = 1;
  pageSize = 20;

  filters: SearchFilter = {
    types: [],
    status: [],
    priority: [],
    dateRange: [null, null],
    createdBy: null
  };

  results = signal<SearchResult[]>([]);
  totalResults = signal(0);
  searchTime = signal(0);
  searchHistory = signal<string[]>([]);

  resultsByType = computed(() => {
    const byType: Record<string, number> = {};
    for (const result of this.results()) {
      byType[result.type] = (byType[result.type] || 0) + 1;
    }
    return byType;
  });

  activeFilterCount = computed(() => {
    let count = 0;
    if (this.filters.types.length > 0) count++;
    if (this.filters.status.length > 0) count++;
    if (this.filters.priority.length > 0) count++;
    if (this.filters.dateRange[0] || this.filters.dateRange[1]) count++;
    if (this.filters.createdBy) count++;
    return count;
  });

  ngOnInit(): void {
    this.route.parent?.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.blueprintId.set(id);
      }
    });

    // Load search history from localStorage
    const history = localStorage.getItem('search_history');
    if (history) {
      this.searchHistory.set(JSON.parse(history));
    }
  }

  toggleFilters(): void {
    this.showFilters.update(v => !v);
  }

  resetFilters(): void {
    this.filters = {
      types: [],
      status: [],
      priority: [],
      dateRange: [null, null],
      createdBy: null
    };
  }

  performSearch(): void {
    if (!this.searchQuery.trim()) {
      this.msg.warning('請輸入搜尋關鍵字');
      return;
    }

    this.searching.set(true);
    const startTime = Date.now();

    // Add to history
    const history = this.searchHistory();
    if (!history.includes(this.searchQuery)) {
      const newHistory = [this.searchQuery, ...history].slice(0, 10);
      this.searchHistory.set(newHistory);
      localStorage.setItem('search_history', JSON.stringify(newHistory));
    }

    // Simulate search - in real implementation, call the search service
    setTimeout(() => {
      const mockResults: SearchResult[] = this.generateMockResults();
      this.results.set(mockResults);
      this.totalResults.set(mockResults.length);
      this.searchTime.set(Date.now() - startTime);
      this.hasSearched.set(true);
      this.searching.set(false);
    }, 500);
  }

  private generateMockResults(): SearchResult[] {
    // This would be replaced with actual search service call
    const types = ['task', 'diary', 'file', 'problem', 'qc'];
    const statuses = ['pending', 'in_progress', 'completed'];
    const results: SearchResult[] = [];

    const count = Math.floor(Math.random() * 15) + 5;
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      results.push({
        id: `result-${i}`,
        type,
        title: `${this.getTypeLabel(type)} - ${this.searchQuery} 相關項目 ${i + 1}`,
        description: `這是一個與「${this.searchQuery}」相關的${this.getTypeLabel(type)}項目描述...`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        createdBy: `用戶 ${Math.floor(Math.random() * 10) + 1}`,
        score: Math.random() * 0.5 + 0.5,
        highlights: [
          {
            field: 'description',
            value: `這是一個與「<em>${this.searchQuery}</em>」相關的項目...`
          }
        ]
      });
    }

    // Sort by score descending
    return results.sort((a, b) => b.score - a.score);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.results.set([]);
    this.totalResults.set(0);
    this.hasSearched.set(false);
    this.resetFilters();
  }

  searchFromHistory(query: string): void {
    this.searchQuery = query;
    this.performSearch();
  }

  clearHistory(): void {
    this.searchHistory.set([]);
    localStorage.removeItem('search_history');
  }

  navigateToResult(result: SearchResult): void {
    const id = this.blueprintId();
    const routes: Record<string, string> = {
      task: 'tasks',
      diary: 'diaries',
      file: 'files',
      problem: 'problems',
      qc: 'qc-inspections',
      acceptance: 'acceptances'
    };

    const route = routes[result.type] || 'tasks';
    this.router.navigate(['/blueprint', id, route], {
      queryParams: { highlight: result.id }
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // Re-fetch with new page
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    // Re-fetch with new size
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      task: 'blue',
      diary: 'green',
      file: 'purple',
      problem: 'red',
      qc: 'orange',
      acceptance: 'cyan'
    };
    return colors[type] || 'default';
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      task: '任務',
      diary: '日誌',
      file: '檔案',
      problem: '問題',
      qc: '品質檢查',
      acceptance: '驗收'
    };
    return labels[type] || type;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: 'default',
      in_progress: 'processing',
      completed: 'success',
      cancelled: 'default'
    };
    return colors[status] || 'default';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '待處理',
      in_progress: '進行中',
      completed: '已完成',
      cancelled: '已取消'
    };
    return labels[status] || status;
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    if (days < 30) return `${Math.floor(days / 7)} 週前`;
    return d.toLocaleDateString('zh-TW');
  }

  goBack(): void {
    this.router.navigate(['/blueprint', this.blueprintId(), 'overview']);
  }
}
