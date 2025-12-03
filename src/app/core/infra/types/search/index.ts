/**
 * Search Types Module
 * 搜尋類型定義模組
 *
 * Exports all search-related type definitions for the enterprise search engine.
 * Designed for full-text search, autocomplete, and intelligent search capabilities.
 *
 * Key Features:
 * - Full-text search with PostgreSQL FTS
 * - Multi-entity search (tasks, blueprints, diaries, etc.)
 * - Search history and suggestions
 * - Category-based filtering
 * - Permission-aware filtering
 *
 * @module core/infra/types/search
 */

// ============================================================================
// Search Category Enum (搜尋分類)
// ============================================================================

/**
 * 搜尋實體類型枚舉
 * Searchable entity type enumeration
 *
 * Defines all entity types that can be searched in the system
 */
export enum SearchCategory {
  /** 所有類型 | All types */
  ALL = 'all',
  /** 任務 | Tasks */
  TASK = 'task',
  /** 藍圖 | Blueprints */
  BLUEPRINT = 'blueprint',
  /** 日誌 | Diaries */
  DIARY = 'diary',
  /** 使用者 | Users */
  USER = 'user',
  /** 組織 | Organizations */
  ORGANIZATION = 'organization',
  /** 檔案 | Files */
  FILE = 'file',
  /** 問題 | Issues */
  ISSUE = 'issue'
}

/**
 * 搜尋結果優先級
 * Search result priority for ranking
 */
export enum SearchResultPriority {
  /** 精確匹配 | Exact match */
  EXACT = 1,
  /** 標題匹配 | Title match */
  TITLE = 2,
  /** 內容匹配 | Content match */
  CONTENT = 3,
  /** 模糊匹配 | Fuzzy match */
  FUZZY = 4
}

// ============================================================================
// Search Result Interfaces (搜尋結果介面)
// ============================================================================

/**
 * Base search result interface
 * 基礎搜尋結果介面
 */
export interface SearchResultItem {
  /** 結果唯一識別碼 | Unique identifier */
  id: string;
  /** 實體類型 | Entity type */
  category: SearchCategory;
  /** 結果標題 | Result title */
  title: string;
  /** 結果描述/摘要 | Result description/summary */
  description?: string | null;
  /** 高亮片段 | Highlighted snippet */
  highlight?: string | null;
  /** 相關性分數 | Relevance score (0-1) */
  score: number;
  /** 優先級 | Priority for ranking */
  priority: SearchResultPriority;
  /** 導航路徑 | Navigation path */
  url: string;
  /** 父級 ID (如藍圖 ID) | Parent ID (e.g., blueprint ID) */
  parentId?: string | null;
  /** 父級名稱 | Parent name */
  parentName?: string | null;
  /** 圖標 | Icon */
  icon?: string;
  /** 標籤 | Tags */
  tags?: string[];
  /** 建立時間 | Created timestamp */
  createdAt?: string;
  /** 更新時間 | Updated timestamp */
  updatedAt?: string;
  /** 元資料 | Metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Search result group by category
 * 按分類分組的搜尋結果
 */
export interface SearchResultGroup {
  /** 分類 | Category */
  category: SearchCategory;
  /** 分類顯示名稱 | Category display name */
  categoryLabel: string;
  /** 分類圖標 | Category icon */
  categoryIcon: string;
  /** 該分類的結果 | Results in this category */
  items: SearchResultItem[];
  /** 該分類的總數 | Total count in this category */
  totalCount: number;
}

/**
 * Paginated search response
 * 分頁搜尋回應
 */
export interface SearchResponse {
  /** 搜尋結果 | Search results */
  items: SearchResultItem[];
  /** 按分類分組的結果 | Results grouped by category */
  groups: SearchResultGroup[];
  /** 總結果數 | Total result count */
  totalCount: number;
  /** 當前頁碼 | Current page number */
  page: number;
  /** 每頁數量 | Page size */
  pageSize: number;
  /** 總頁數 | Total pages */
  totalPages: number;
  /** 搜尋關鍵字 | Search query */
  query: string;
  /** 搜尋耗時 (毫秒) | Search duration in milliseconds */
  duration: number;
  /** 搜尋建議 | Search suggestions */
  suggestions?: string[];
  /** 是否有更多結果 | Has more results */
  hasMore: boolean;
}

// ============================================================================
// Search Query Interfaces (搜尋查詢介面)
// ============================================================================

/**
 * 搜尋排序方式
 * Search sort options
 */
export enum SearchSortBy {
  /** 相關性 | Relevance */
  RELEVANCE = 'relevance',
  /** 建立時間 | Created date */
  CREATED = 'created',
  /** 更新時間 | Updated date */
  UPDATED = 'updated',
  /** 標題字母順序 | Title alphabetically */
  TITLE = 'title'
}

/**
 * 搜尋排序方向
 * Search sort order
 */
export enum SearchSortOrder {
  /** 升序 | Ascending */
  ASC = 'asc',
  /** 降序 | Descending */
  DESC = 'desc'
}

/**
 * Search query options
 * 搜尋查詢選項
 */
export interface SearchQueryOptions {
  /** 搜尋關鍵字 | Search query string */
  query: string;
  /** 搜尋分類過濾 | Category filter */
  categories?: SearchCategory[];
  /** 藍圖 ID 過濾 | Blueprint ID filter */
  blueprintId?: string;
  /** 組織 ID 過濾 | Organization ID filter */
  organizationId?: string;
  /** 日期範圍起始 | Date range start */
  dateFrom?: string;
  /** 日期範圍結束 | Date range end */
  dateTo?: string;
  /** 頁碼 | Page number (1-based) */
  page?: number;
  /** 每頁數量 | Page size */
  pageSize?: number;
  /** 排序方式 | Sort by */
  sortBy?: SearchSortBy;
  /** 排序方向 | Sort order */
  sortOrder?: SearchSortOrder;
  /** 是否只搜尋當前藍圖 | Search current blueprint only */
  currentBlueprintOnly?: boolean;
  /** 是否包含已刪除項目 | Include deleted items */
  includeDeleted?: boolean;
  /** 是否啟用模糊匹配 | Enable fuzzy matching */
  fuzzyMatch?: boolean;
  /** 是否啟用同義詞 | Enable synonyms */
  useSynonyms?: boolean;
  /** 最小相關性分數 | Minimum relevance score */
  minScore?: number;
}

/**
 * Quick search options (for autocomplete)
 * 快速搜尋選項 (用於自動完成)
 */
export interface QuickSearchOptions {
  /** 搜尋關鍵字 | Search query string */
  query: string;
  /** 最大結果數 | Maximum results */
  limit?: number;
  /** 搜尋分類 | Categories to search */
  categories?: SearchCategory[];
  /** 藍圖 ID | Blueprint ID */
  blueprintId?: string;
}

// ============================================================================
// Search History Interfaces (搜尋歷史介面)
// ============================================================================

/**
 * Search history item
 * 搜尋歷史項目
 */
export interface SearchHistoryItem {
  /** 歷史記錄 ID | History ID */
  id: string;
  /** 使用者 ID | User ID */
  userId: string;
  /** 搜尋查詢 | Search query */
  query: string;
  /** 搜尋分類 | Search categories */
  categories?: SearchCategory[];
  /** 結果數量 | Result count */
  resultCount: number;
  /** 是否點擊了結果 | Whether a result was clicked */
  hasClick: boolean;
  /** 點擊的結果 ID | Clicked result ID */
  clickedResultId?: string;
  /** 搜尋時間 | Search timestamp */
  timestamp: string;
}

/**
 * Search suggestion (autocomplete)
 * 搜尋建議 (自動完成)
 */
export interface SearchSuggestion {
  /** 建議文字 | Suggestion text */
  text: string;
  /** 建議類型 | Suggestion type */
  type: 'history' | 'popular' | 'autocomplete' | 'recent';
  /** 相關分類 | Related category */
  category?: SearchCategory;
  /** 點擊次數 | Click count */
  clickCount?: number;
  /** 圖標 | Icon */
  icon?: string;
}

// ============================================================================
// Search Configuration (搜尋配置)
// ============================================================================

/**
 * Search category configuration
 * 搜尋分類配置
 */
export interface SearchCategoryConfig {
  /** 分類 | Category */
  category: SearchCategory;
  /** 顯示標籤 | Display label */
  label: string;
  /** 圖標 | Icon */
  icon: string;
  /** 顏色 | Color */
  color: string;
  /** 是否啟用 | Is enabled */
  enabled: boolean;
  /** 排序權重 | Sort weight */
  weight: number;
}

/**
 * 搜尋分類配置映射
 * Search category configuration map
 */
export const SEARCH_CATEGORY_CONFIG: Record<SearchCategory, SearchCategoryConfig> = {
  [SearchCategory.ALL]: {
    category: SearchCategory.ALL,
    label: '全部',
    icon: 'search',
    color: 'default',
    enabled: true,
    weight: 0
  },
  [SearchCategory.TASK]: {
    category: SearchCategory.TASK,
    label: '任務',
    icon: 'check-square',
    color: 'blue',
    enabled: true,
    weight: 10
  },
  [SearchCategory.BLUEPRINT]: {
    category: SearchCategory.BLUEPRINT,
    label: '藍圖',
    icon: 'project',
    color: 'purple',
    enabled: true,
    weight: 20
  },
  [SearchCategory.DIARY]: {
    category: SearchCategory.DIARY,
    label: '日誌',
    icon: 'calendar',
    color: 'green',
    enabled: true,
    weight: 30
  },
  [SearchCategory.USER]: {
    category: SearchCategory.USER,
    label: '使用者',
    icon: 'user',
    color: 'orange',
    enabled: true,
    weight: 40
  },
  [SearchCategory.ORGANIZATION]: {
    category: SearchCategory.ORGANIZATION,
    label: '組織',
    icon: 'team',
    color: 'cyan',
    enabled: true,
    weight: 50
  },
  [SearchCategory.FILE]: {
    category: SearchCategory.FILE,
    label: '檔案',
    icon: 'file',
    color: 'magenta',
    enabled: false, // Not yet implemented
    weight: 60
  },
  [SearchCategory.ISSUE]: {
    category: SearchCategory.ISSUE,
    label: '問題',
    icon: 'exclamation-circle',
    color: 'red',
    enabled: false, // Not yet implemented
    weight: 70
  }
};

// ============================================================================
// Search State Interfaces (搜尋狀態介面)
// ============================================================================

/**
 * Search component state
 * 搜尋元件狀態
 */
export interface SearchState {
  /** 搜尋關鍵字 | Search query */
  query: string;
  /** 是否正在搜尋 | Is searching */
  isSearching: boolean;
  /** 是否顯示結果面板 | Is results panel visible */
  isResultsPanelVisible: boolean;
  /** 搜尋結果 | Search results */
  results: SearchResultItem[];
  /** 按分類分組的結果 | Grouped results */
  groupedResults: SearchResultGroup[];
  /** 總結果數 | Total count */
  totalCount: number;
  /** 當前選中的分類 | Current selected category */
  selectedCategory: SearchCategory;
  /** 搜尋建議 | Search suggestions */
  suggestions: SearchSuggestion[];
  /** 搜尋歷史 | Search history */
  history: SearchHistoryItem[];
  /** 錯誤訊息 | Error message */
  error: string | null;
  /** 是否已初始化 | Is initialized */
  isInitialized: boolean;
}

/**
 * Default search state
 * 預設搜尋狀態
 */
export const DEFAULT_SEARCH_STATE: SearchState = {
  query: '',
  isSearching: false,
  isResultsPanelVisible: false,
  results: [],
  groupedResults: [],
  totalCount: 0,
  selectedCategory: SearchCategory.ALL,
  suggestions: [],
  history: [],
  error: null,
  isInitialized: false
};

// ============================================================================
// Keyboard Shortcuts Configuration
// ============================================================================

/**
 * Search keyboard shortcuts
 * 搜尋鍵盤快捷鍵
 */
export const SEARCH_KEYBOARD_SHORTCUTS = {
  /** 開啟搜尋 | Open search */
  OPEN_SEARCH: 'F1',
  /** 關閉搜尋 | Close search */
  CLOSE_SEARCH: 'Escape',
  /** 選擇上一個結果 | Select previous result */
  PREV_RESULT: 'ArrowUp',
  /** 選擇下一個結果 | Select next result */
  NEXT_RESULT: 'ArrowDown',
  /** 選擇當前結果 | Select current result */
  SELECT_RESULT: 'Enter',
  /** 清除搜尋 | Clear search */
  CLEAR_SEARCH: 'Ctrl+Backspace'
};

// ============================================================================
// Search Constants
// ============================================================================

/**
 * Search constants
 * 搜尋常數
 */
export const SEARCH_CONSTANTS = {
  /** 預設每頁數量 | Default page size */
  DEFAULT_PAGE_SIZE: 10,
  /** 快速搜尋最大結果數 | Quick search max results */
  QUICK_SEARCH_LIMIT: 8,
  /** 搜尋歷史最大數量 | Max search history */
  MAX_HISTORY_ITEMS: 50,
  /** 最小搜尋字符數 | Min query length */
  MIN_QUERY_LENGTH: 2,
  /** 搜尋防抖延遲 (毫秒) | Search debounce delay in ms */
  DEBOUNCE_DELAY: 300,
  /** 最大建議數量 | Max suggestions */
  MAX_SUGGESTIONS: 10,
  /** 搜尋結果快取時間 (秒) | Search result cache time in seconds */
  CACHE_DURATION: 300
};

// ============================================================================
// Type Aliases
// ============================================================================

export type SearchResults = SearchResultItem[];
export type SearchGroups = SearchResultGroup[];
export type SearchHistoryList = SearchHistoryItem[];
export type SearchSuggestionList = SearchSuggestion[];
