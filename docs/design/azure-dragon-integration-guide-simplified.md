# 青龍配色系統整合指南 (簡化版)
## Azure Dragon Color System Integration - Simplified Approach

> **使用 ng-zorro-antd 內建主題系統整合青龍配色**  
> 參考：https://ng.ant.design/docs/customize-theme/zh

---

## 核心概念

根據 ng-zorro-antd 官方文檔，我們應該：

1. **使用 ng-zorro 的主題變數系統**
2. **在 `src/styles/theme.less` 中自訂主題**
3. **避免建立複雜的自訂工具類別系統**

---

## 實作步驟

### 步驟 1: 更新 `src/styles/theme.less`

ng-zorro-antd 提供完整的主題定制功能，我們只需要覆寫關鍵變數：

```less
// src/styles/theme.less

@import '@delon/theme/theme-default.less';

// =============================================================================
// 青龍配色系統整合 (Azure Dragon Color System)
// =============================================================================
// 參考文檔：
// - docs/design/azure-dragon-color-system.md
// - docs/design/drafts/azure-dragon-color-concept.md
// - https://ng.ant.design/docs/customize-theme/zh
// =============================================================================

// -----------------------------------------------------------------------------
// 主要品牌色 (Primary Color)
// -----------------------------------------------------------------------------
// 使用青龍核心色：青·正 (Qing Mid)
@primary-color: #2CB7AE;  // 青·正 - 標準青，藍綠均衡

// -----------------------------------------------------------------------------
// 輔助色系 (Supporting Colors)
// -----------------------------------------------------------------------------
// 成功色 - 保持 ng-zorro 預設
@success-color: #52c41a;

// 警告色 - 保持 ng-zorro 預設
@warning-color: #faad14;

// 錯誤色 - 保持 ng-zorro 預設
@error-color: #ff4d4f;

// 資訊色 - 使用青龍主色
@info-color: @primary-color;

// -----------------------------------------------------------------------------
// 青龍擴展色階 (Azure Dragon Extended Scale)
// -----------------------------------------------------------------------------
// 用於需要更多層次的場景

// 青·光 (Light Qing) - 清亮，帶春意與水光感
@qing-light: #66D1C4;

// 青·深 (Deep Qing) - 偏藍，沉穩典型青色
@qing-deep: #0093AF;

// 蒼青 (Azure Qing) - 更深，帶蒼色與古典感
@qing-azure: #007A92;

// 玄青 (Dark Teal) - 深青藍，接近自然礦青
@qing-dark: #065E68;

// 青霧 (Qing Mist) - 背景、懸浮提示背景
@qing-mist: #E6F7F5;

// 青露 (Qing Dew) - 選中狀態背景、標籤背景
@qing-dew: #B3EBE6;

// 青泉 (Qing Spring) - 輔助元素、圖示填充
@qing-spring: #80DFD7;

// 墨青 (Ink Qing) - 最深色、頁首背景
@qing-ink: #043E45;

// 青淵 (Qing Abyss) - 極深色、暗色模式背景
@qing-abyss: #022A30;

// -----------------------------------------------------------------------------
// 連結色 (Link Color)
// -----------------------------------------------------------------------------
@link-color: @primary-color;
@link-hover-color: @qing-deep;
@link-active-color: @qing-azure;

// -----------------------------------------------------------------------------
// 邊框與背景 (Border & Background)
// -----------------------------------------------------------------------------
// 使用青龍淺色作為邊框和背景
@border-color-base: @qing-dew;
@border-color-split: @qing-mist;

// 背景色 - 使用極淺的青龍色
@component-background: #ffffff;
@background-color-light: @qing-mist;
@background-color-base: #f5f5f5;

// -----------------------------------------------------------------------------
// 文字色 (Text Color)
// -----------------------------------------------------------------------------
// 保持預設，確保可讀性
@text-color: rgba(0, 0, 0, 0.85);
@text-color-secondary: rgba(0, 0, 0, 0.45);
@disabled-color: rgba(0, 0, 0, 0.25);

// 標題色 - 可選使用深青色
@heading-color: rgba(0, 0, 0, 0.85);
// 如需強調青龍意象，可設為：
// @heading-color: @qing-dark;

// -----------------------------------------------------------------------------
// 陰影 (Shadow)
// -----------------------------------------------------------------------------
// 保持預設值以確保視覺一致性
@shadow-color: rgba(0, 0, 0, 0.15);
@box-shadow-base: @shadow-1-down;

// -----------------------------------------------------------------------------
// 圓角 (Border Radius)
// -----------------------------------------------------------------------------
// 保持預設值
@border-radius-base: 6px;

// -----------------------------------------------------------------------------
// 字體 (Typography)
// -----------------------------------------------------------------------------
// 保持預設值以確保跨平台相容性
@font-size-base: 14px;
```

### 步驟 2: 在元件中使用青龍色彩

**不需要建立複雜的工具類別系統**，直接在元件 LESS 中使用主題變數：

```less
// example.component.less

// 方式 1: 使用 ng-zorro 主題變數（推薦）
.my-card {
  background: @component-background;
  border: 1px solid @border-color-base;
  color: @text-color;
  
  .card-header {
    background: @primary-color;  // 青龍主色
    color: white;
  }
  
  .card-link {
    color: @link-color;  // 自動使用青龍色
    
    &:hover {
      color: @link-hover-color;  // 自動使用青龍深色
    }
  }
}

// 方式 2: 使用青龍擴展色階（需要時）
.dashboard-stats {
  .stat-success {
    background: @qing-mist;
    border-left: 3px solid @qing-light;
  }
  
  .stat-warning {
    background: @qing-dew;
    border-left: 3px solid @primary-color;
  }
  
  .stat-danger {
    background: @qing-spring;
    border-left: 3px solid @qing-deep;
  }
}

// 方式 3: 使用漸變（特殊場景）
.hero-section {
  background: linear-gradient(135deg, @qing-light 0%, @primary-color 50%, @qing-deep 100%);
}
```

### 步驟 3: 在模板中使用 ng-zorro 元件

ng-zorro 元件會自動使用主題色：

```html
<!-- 按鈕自動使用青龍主色 -->
<button nz-button nzType="primary">主要操作</button>

<!-- 標籤自動使用青龍主色 -->
<nz-tag [nzColor]="'processing'">進行中</nz-tag>

<!-- 進度條自動使用青龍主色 -->
<nz-progress [nzPercent]="75"></nz-progress>

<!-- 連結自動使用青龍主色 -->
<a>查看詳情</a>

<!-- 表格選中行自動使用青龍淺色背景 -->
<nz-table [nzData]="data">
  <!-- ... -->
</nz-table>
```

---

## 優勢

### ✅ 使用 ng-zorro 主題系統的優勢

1. **官方支援**: 使用 ng-zorro 官方推薦的方式
2. **自動生效**: 所有 ng-zorro 元件自動套用青龍配色
3. **維護簡單**: 只需維護 `theme.less` 一個檔案
4. **升級容易**: ng-zorro 版本升級不會影響主題配置
5. **效能最佳**: 不會產生大量未使用的工具類別
6. **設計一致**: 確保整個應用視覺風格統一

### ❌ 避免的複雜做法

1. ~~建立大量工具類別（類似 Tailwind）~~
2. ~~建立複雜的 mixin 系統~~
3. ~~重複定義顏色變數~~
4. ~~在每個元件中 import 變數~~

---

## 完整色彩對照表

### ng-zorro 主題變數 → 青龍配色

| ng-zorro 變數 | 青龍配色 | Hex 值 | 使用場景 |
|---------------|----------|--------|----------|
| `@primary-color` | 青·正 | `#2CB7AE` | 主要按鈕、連結、選中狀態 |
| `@link-color` | 青·正 | `#2CB7AE` | 文字連結 |
| `@link-hover-color` | 青·深 | `#0093AF` | 連結懸停 |
| `@link-active-color` | 蒼青 | `#007A92` | 連結激活 |
| `@border-color-base` | 青露 | `#B3EBE6` | 邊框 |
| `@border-color-split` | 青霧 | `#E6F7F5` | 分割線 |
| `@background-color-light` | 青霧 | `#E6F7F5` | 淺色背景 |

### 青龍擴展色階（可選使用）

| 變數名 | 中文名 | Hex 值 | 使用建議 |
|--------|--------|--------|----------|
| `@qing-light` | 青·光 | `#66D1C4` | 次要按鈕、亮色標籤 |
| `@qing-deep` | 青·深 | `#0093AF` | 懸停狀態、強調元素 |
| `@qing-azure` | 蒼青 | `#007A92` | 激活狀態、深色標籤 |
| `@qing-dark` | 玄青 | `#065E68` | 深色文字、圖示 |
| `@qing-mist` | 青霧 | `#E6F7F5` | 背景、提示框 |
| `@qing-dew` | 青露 | `#B3EBE6` | 選中背景、標籤背景 |
| `@qing-spring` | 青泉 | `#80DFD7` | 輔助元素、圖示填充 |
| `@qing-ink` | 墨青 | `#043E45` | 頁首背景、深色區塊 |
| `@qing-abyss` | 青淵 | `#022A30` | 暗色模式背景 |

---

## 使用範例

### 範例 1: 卡片元件

```less
// card.component.less

.project-card {
  background: @component-background;
  border: 1px solid @border-color-base;  // 自動使用青露色
  border-radius: @border-radius-base;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: @primary-color;  // 懸停時變為青龍主色
    box-shadow: 0 4px 12px rgba(44, 183, 174, 0.15);  // 使用青龍色陰影
  }
  
  .card-header {
    background: linear-gradient(90deg, @qing-mist 0%, white 100%);
    border-bottom: 1px solid @border-color-split;
    padding: 16px;
    
    h3 {
      color: @qing-dark;  // 使用玄青色
      margin: 0;
    }
  }
  
  .card-status {
    &.active {
      color: @primary-color;  // 青龍主色
      background: @qing-mist;  // 青霧背景
    }
    
    &.completed {
      color: @success-color;
      background: @success-color-deprecated-bg;
    }
  }
}
```

### 範例 2: 儀表板統計

```html
<!-- dashboard.component.html -->
<div class="stats-container">
  <nz-card class="stat-card">
    <div class="stat-value">156</div>
    <div class="stat-label">進行中專案</div>
    <nz-progress [nzPercent]="75" [nzStrokeColor]="'#2CB7AE'"></nz-progress>
  </nz-card>
</div>
```

```less
// dashboard.component.less

.stats-container {
  .stat-card {
    // ng-zorro card 已自動套用主題色
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: @primary-color;  // 青龍主色
    }
    
    .stat-label {
      color: @text-color-secondary;
      margin-bottom: 8px;
    }
  }
}
```

### 範例 3: 表格與列表

```html
<!-- list.component.html -->
<nz-table #basicTable [nzData]="listOfData">
  <thead>
    <tr>
      <th>專案名稱</th>
      <th>狀態</th>
      <th>進度</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let data of basicTable.data">
      <td>{{ data.name }}</td>
      <td>
        <nz-tag [nzColor]="'processing'">{{ data.status }}</nz-tag>
      </td>
      <td>
        <nz-progress [nzPercent]="data.progress"></nz-progress>
      </td>
    </tr>
  </tbody>
</nz-table>
```

所有元件自動使用青龍配色，無需額外配置！

---

## 漸變色使用指南

當需要使用漸變時，使用青龍核心五色組合：

```less
// 水平漸變
.gradient-horizontal {
  background: linear-gradient(
    90deg,
    #66D1C4 0%,    // 青·光
    #2CB7AE 25%,   // 青·正
    #0093AF 50%,   // 青·深
    #007A92 75%,   // 蒼青
    #065E68 100%   // 玄青
  );
}

// 垂直漸變
.gradient-vertical {
  background: linear-gradient(
    180deg,
    #E6F7F5 0%,    // 青霧
    #2CB7AE 50%,   // 青·正
    #043E45 100%   // 墨青
  );
}

// 徑向漸變
.gradient-radial {
  background: radial-gradient(
    circle at center,
    #66D1C4 0%,    // 青·光
    #2CB7AE 50%,   // 青·正
    #065E68 100%   // 玄青
  );
}
```

---

## 暗色模式支援

ng-zorro-antd 支援暗色主題，可以透過切換主題檔案實現：

```less
// src/styles/theme.less

// 預設使用亮色主題
@import '@delon/theme/theme-default.less';

// 如需暗色主題，改為：
// @import '@delon/theme/theme-dark.less';

// 然後覆寫主題色
@primary-color: #2CB7AE;  // 青龍主色在暗色模式下依然適用
```

或使用 ng-alain 的動態主題切換功能。

---

## 遷移檢查清單

從舊的配色系統遷移到 ng-zorro 主題系統：

- [ ] 更新 `src/styles/theme.less`，設定 `@primary-color: #2CB7AE`
- [ ] 移除不必要的工具類別定義
- [ ] 將硬編碼的顏色值替換為主題變數
- [ ] 確認所有 ng-zorro 元件自動套用青龍配色
- [ ] 測試各種互動狀態（hover、active、disabled）
- [ ] 驗證色彩對比度符合無障礙標準

---

## 常見問題

### Q: 為什麼不建立工具類別系統？

**A**: ng-zorro-antd 已經提供完整的元件系統和主題機制，建立額外的工具類別會：
- 增加專案複雜度
- 產生未使用的 CSS
- 與 ng-zorro 設計系統不一致
- 增加維護成本

### Q: 如何在 TypeScript 中使用色彩值？

**A**: 可以建立一個常數檔案：

```typescript
// src/app/shared/constants/colors.ts
export const AZURE_DRAGON_COLORS = {
  light: '#66D1C4',
  primary: '#2CB7AE',
  deep: '#0093AF',
  azure: '#007A92',
  dark: '#065E68',
} as const;
```

### Q: 如何自訂特定元件的顏色？

**A**: 在元件 LESS 中直接使用青龍變數：

```less
.custom-button {
  background: @qing-light;
  border-color: @primary-color;
  
  &:hover {
    background: @primary-color;
  }
}
```

---

## 總結

### 核心原則

1. **使用 ng-zorro 主題系統** - 這是官方推薦且最簡單的方式
2. **設定 `@primary-color`** - 一個變數改變整個應用配色
3. **保持簡單** - 不需要複雜的工具類別或 mixin
4. **自動生效** - ng-zorro 元件自動套用主題色

### 實施步驟

1. ✅ 更新 `src/styles/theme.less`
2. ✅ 設定青龍主色為 `@primary-color`
3. ✅ 定義青龍擴展色階（可選）
4. ✅ 在元件中使用主題變數
5. ✅ 測試並驗證視覺效果

### 預期效果

- 🎨 **全局一致**: 所有元件自動使用青龍配色
- 🚀 **開發快速**: 無需手動為每個元件設定顏色
- 🔧 **維護簡單**: 只需修改一個變數即可調整全局配色
- ✨ **體驗優良**: 符合 ng-zorro 設計規範的視覺效果

---

**文檔版本**: 2.0.0（簡化版）  
**參考文檔**:
- https://ng.ant.design/docs/customize-theme/zh
- https://ng.ant.design/docs/customize-theme-variable/zh
- docs/design/azure-dragon-color-system.md

**作者**: GitHub Copilot + 7Spade Team
