# 青龍意象配色系統 (Azure Dragon Color System)

> **GigHub 專案專用設計規範**  
> 版本：1.0.0  
> 建立日期：2025-01-01  
> 最後更新：2025-01-01

---

## 目錄

1. [概述](#概述)
2. [青色的本質與意涵](#青色的本質與意涵)
3. [青龍漸變色板](#青龍漸變色板)
4. [色彩語義與應用場景](#色彩語義與應用場景)
5. [CSS/LESS 實作指南](#cssless-實作指南)
6. [無障礙設計考量](#無障礙設計考量)
7. [整合指南](#整合指南)
8. [附錄](#附錄)

---

## 概述

青龍意象配色系統是專為 **GigHub 工地施工進度追蹤管理系統** 設計的視覺語言規範。此系統以中華傳統文化中象徵東方、春季與木氣的「青龍」為意象基礎，結合現代設計理論，建立一套完整的青色漸變配色方案。

### 設計目標

- **文化傳承**：承載東方美學中「青」的獨特意涵
- **視覺統一**：為整個專案提供一致的色彩語言
- **功能性**：確保色彩在各種使用情境下的可識別性
- **無障礙**：符合 WCAG 2.1 AA 級標準的對比度要求

### 適用範圍

- 品牌識別與標誌設計
- 使用者介面主題配色
- 資料視覺化圖表
- 狀態指示與回饋
- 裝飾性元素與背景

---

## 青色的本質與意涵

### 自然語言敘述

「青」是一種跨越藍與綠之間的複合色，屬於冷色光譜，是自然界中常見於天空、湖水、嫩竹、青苔等介於藍與綠之間的色相。

### 核心特質

| 特質 | 描述 |
|------|------|
| **色相範圍** | 介於藍色（Blue）與綠色（Green）之間，但不等於二者任意混合 |
| **明度表現** | 適中；通常不如純藍深沉，也不如純綠鮮亮 |
| **飽和度** | 偏中至偏低，帶一種「自然、濕潤、沉穩」的質感 |
| **文化意涵** | 在古代語境中，青包含綠、藍、黑的部分色調，核心意象是「帶生命力的藍綠色」 |

### 象徵意義

| 象徵 | 說明 |
|------|------|
| **春天** | 萬物復甦、生機盎然的季節色彩 |
| **木氣** | 五行中木的代表色，象徵生長與發展 |
| **自然生長** | 植物嫩芽、竹林青翠的生命力 |
| **清涼** | 水面倒影、晨曦露珠的清新感 |
| **靈氣** | 東方龍族的神秘與靈動 |

### 色彩哲學

> 青色不是單點色，而是一段範圍，可以用漸層色來忠實呈現。

這一理念指導我們建立一套具有層次感的漸變色系，而非單一固定的色值。如同青龍在雲霧間若隱若現，青色在我們的設計系統中也呈現出流動與變化的特質。

---

## 青龍漸變色板

### 核心五色漸層

以下提供一套**色相統一、亮度平順**的青→青綠→青藍漸層，作為青龍主題色的核心定義。

| 色名 | 中文名稱 | HEX | RGB | HSL | 描述 |
|------|----------|-----|-----|-----|------|
| **Qing Light** | 青·光 | `#66D1C4` | rgb(102, 209, 196) | hsl(173°, 53%, 61%) | 清亮，帶春意與水光感 |
| **Qing Mid** | 青·正 | `#2CB7AE` | rgb(44, 183, 174) | hsl(176°, 61%, 45%) | 標準青，藍綠均衡 |
| **Qing Deep** | 青·深 | `#0093AF` | rgb(0, 147, 175) | hsl(190°, 100%, 34%) | 偏藍，沉穩典型青色 |
| **Azure Qing** | 蒼青 | `#007A92` | rgb(0, 122, 146) | hsl(190°, 100%, 29%) | 更深，帶蒼色與古典感 |
| **Dark Teal** | 玄青 | `#065E68` | rgb(6, 94, 104) | hsl(186°, 89%, 22%) | 深青藍，接近自然礦青 |

### 視覺色票

```
┌─────────────────────────────────────────────────────────────────┐
│  青·光        青·正        青·深        蒼青         玄青       │
│  #66D1C4     #2CB7AE      #0093AF     #007A92      #065E68     │
│  ████████    ████████     ████████    ████████     ████████    │
│  ▓▓▓▓▓▓▓▓    ▓▓▓▓▓▓▓▓     ▓▓▓▓▓▓▓▓    ▓▓▓▓▓▓▓▓     ▓▓▓▓▓▓▓▓    │
│  Light  ←───────── Gradient ─────────→  Dark                   │
└─────────────────────────────────────────────────────────────────┘
```

### 擴展色階（10 級）

為提供更精細的色彩控制，以下定義從最淺到最深的 10 級色階：

| 級別 | 名稱 | HEX | 用途建議 |
|------|------|-----|----------|
| **100** | 青霧 (Qing Mist) | `#E6F7F5` | 背景、懸浮提示背景 |
| **200** | 青露 (Qing Dew) | `#B3EBE6` | 選中狀態背景、標籤背景 |
| **300** | 青泉 (Qing Spring) | `#80DFD7` | 輔助元素、圖示填充 |
| **400** | 青·光 (Qing Light) | `#66D1C4` | 次要按鈕、進度條 |
| **500** | 青·正 (Qing Mid) | `#2CB7AE` | **主色調**、主要按鈕 |
| **600** | 青·深 (Qing Deep) | `#0093AF` | 懸浮狀態、活躍狀態 |
| **700** | 蒼青 (Azure Qing) | `#007A92` | 點擊狀態、強調元素 |
| **800** | 玄青 (Dark Teal) | `#065E68` | 深色文字、邊框 |
| **900** | 墨青 (Ink Qing) | `#043E45` | 最深色、頁首背景 |
| **950** | 青淵 (Qing Abyss) | `#022A30` | 極深色、暗色模式背景 |

---

## 色彩語義與應用場景

### 主題色角色定義

根據 Ant Design 和 NG-ZORRO 的設計系統，我們為青龍配色定義以下語義角色：

#### 主色 (Primary Color)

| Token | 值 | 用途 |
|-------|-----|------|
| `@qing-primary` | `#2CB7AE` | 品牌主色、主要操作按鈕 |
| `@qing-primary-hover` | `#0093AF` | 懸浮狀態 |
| `@qing-primary-active` | `#007A92` | 點擊/激活狀態 |
| `@qing-primary-bg` | `#E6F7F5` | 淺背景色 |
| `@qing-primary-bg-hover` | `#B3EBE6` | 淺背景懸浮色 |
| `@qing-primary-border` | `#80DFD7` | 邊框色 |
| `@qing-primary-border-hover` | `#66D1C4` | 邊框懸浮色 |

#### 文字色 (Text Colors)

| Token | 值 | 對比度 (白底) | 用途 |
|-------|-----|---------------|------|
| `@qing-text` | `#2CB7AE` | 3.1:1 | 裝飾性文字（大標題） |
| `@qing-text-active` | `#007A92` | 4.6:1 | 可點擊文字 |
| `@qing-text-dark` | `#065E68` | 6.3:1 | 正文文字（符合 AA） |

### 應用場景指南

#### 1. 品牌識別

```
┌────────────────────────────────────────┐
│           GigHub Logo Usage            │
│  ┌──────┐                              │
│  │ 青龍 │  主色: #2CB7AE               │
│  │ 標誌 │  輔色: #065E68               │
│  └──────┘  背景: #E6F7F5 或 #FFFFFF    │
└────────────────────────────────────────┘
```

#### 2. 導航與選單

| 狀態 | 背景色 | 文字色 | 邊框/指示器 |
|------|--------|--------|-------------|
| 預設 | 透明 | `#333333` | - |
| 懸浮 | `#E6F7F5` | `#2CB7AE` | - |
| 選中 | `#E6F7F5` | `#007A92` | `#2CB7AE` |
| 禁用 | `#F5F5F5` | `#BFBFBF` | - |

#### 3. 按鈕樣式

| 類型 | 背景 | 文字 | 邊框 |
|------|------|------|------|
| **Primary** | `#2CB7AE` | `#FFFFFF` | `#2CB7AE` |
| Primary:hover | `#0093AF` | `#FFFFFF` | `#0093AF` |
| Primary:active | `#007A92` | `#FFFFFF` | `#007A92` |
| **Secondary** | `#FFFFFF` | `#2CB7AE` | `#2CB7AE` |
| Secondary:hover | `#E6F7F5` | `#0093AF` | `#0093AF` |
| **Ghost** | 透明 | `#2CB7AE` | `#2CB7AE` |
| Ghost:hover | `#E6F7F5` | `#0093AF` | `#0093AF` |

#### 4. 資料視覺化

青龍配色適合用於表現以下類型的資料：

| 數據類型 | 建議色彩 | 理由 |
|----------|----------|------|
| 進度/完成度 | 漸變 `#66D1C4` → `#065E68` | 從淺到深表示完成進度 |
| 成長趨勢 | `#2CB7AE` | 青色象徵生長 |
| 環境/永續 | `#2CB7AE` 為主 | 自然、環保意涵 |
| 時間序列 | 10 級色階 | 區分不同時間段 |

#### 5. 狀態指示

雖然語義色（成功、警告、錯誤）應保持標準定義，青龍配色可用於：

| 狀態 | 色彩 | 用途 |
|------|------|------|
| 資訊提示 | `#2CB7AE` | 一般性資訊訊息 |
| 進行中 | `#0093AF` | 任務進行中狀態 |
| 新功能 | `#66D1C4` | 新功能標記 |
| 專案主題 | 漸變色 | 特定專案的識別色 |

---

## CSS/LESS 實作指南

### CSS 原生變數

```css
:root {
  /* ====== 青龍意象 - 核心色板 ====== */
  
  /* 核心五色 */
  --qing-light: #66D1C4;
  --qing-mid: #2CB7AE;
  --qing-deep: #0093AF;
  --qing-azure: #007A92;
  --qing-dark: #065E68;
  
  /* 10 級色階 */
  --qing-100: #E6F7F5;
  --qing-200: #B3EBE6;
  --qing-300: #80DFD7;
  --qing-400: #66D1C4;
  --qing-500: #2CB7AE;
  --qing-600: #0093AF;
  --qing-700: #007A92;
  --qing-800: #065E68;
  --qing-900: #043E45;
  --qing-950: #022A30;
  
  /* ====== 語義化 Token ====== */
  
  /* 主色系列 */
  --qing-primary: var(--qing-500);
  --qing-primary-hover: var(--qing-600);
  --qing-primary-active: var(--qing-700);
  --qing-primary-bg: var(--qing-100);
  --qing-primary-bg-hover: var(--qing-200);
  --qing-primary-border: var(--qing-300);
  --qing-primary-border-hover: var(--qing-400);
  
  /* 文字色系列 */
  --qing-text: var(--qing-500);
  --qing-text-hover: var(--qing-600);
  --qing-text-active: var(--qing-700);
  
  /* ====== 漸變定義 ====== */
  
  /* 完整五色漸變 */
  --qing-gradient-full: linear-gradient(
    90deg,
    #66D1C4 0%,
    #2CB7AE 25%,
    #0093AF 50%,
    #007A92 75%,
    #065E68 100%
  );
  
  /* 淺色漸變（適合背景） */
  --qing-gradient-light: linear-gradient(
    90deg,
    #E6F7F5 0%,
    #B3EBE6 50%,
    #80DFD7 100%
  );
  
  /* 深色漸變（適合強調） */
  --qing-gradient-dark: linear-gradient(
    90deg,
    #0093AF 0%,
    #007A92 50%,
    #065E68 100%
  );
  
  /* 垂直漸變 */
  --qing-gradient-vertical: linear-gradient(
    180deg,
    #66D1C4 0%,
    #2CB7AE 25%,
    #0093AF 50%,
    #007A92 75%,
    #065E68 100%
  );
  
  /* 對角漸變 */
  --qing-gradient-diagonal: linear-gradient(
    135deg,
    #66D1C4 0%,
    #2CB7AE 25%,
    #0093AF 50%,
    #007A92 75%,
    #065E68 100%
  );
  
  /* 徑向漸變（適合頭像背景） */
  --qing-gradient-radial: radial-gradient(
    circle at center,
    #66D1C4 0%,
    #2CB7AE 30%,
    #0093AF 60%,
    #007A92 80%,
    #065E68 100%
  );
}
```

### LESS 變數定義

以下是用於整合到 GigHub 專案 `src/styles/_variables.less` 的 LESS 變數：

```less
// =============================================================================
// Azure Dragon (青龍) Color System - 青龍意象配色系統
// =============================================================================

// -----------------------------------------------------------------------------
// Core Palette - 核心色板
// -----------------------------------------------------------------------------

// 核心五色
@qing-light: #66D1C4;   // 青·光 - Light Qing
@qing-mid: #2CB7AE;     // 青·正 - Mid Qing (Primary)
@qing-deep: #0093AF;    // 青·深 - Deep Qing
@qing-azure: #007A92;   // 蒼青 - Azure Qing
@qing-dark: #065E68;    // 玄青 - Dark Teal

// -----------------------------------------------------------------------------
// Extended Scale - 擴展色階 (10 級)
// -----------------------------------------------------------------------------

@qing-100: #E6F7F5;     // 青霧 - Qing Mist
@qing-200: #B3EBE6;     // 青露 - Qing Dew
@qing-300: #80DFD7;     // 青泉 - Qing Spring
@qing-400: #66D1C4;     // 青·光 - Qing Light
@qing-500: #2CB7AE;     // 青·正 - Qing Mid (Primary)
@qing-600: #0093AF;     // 青·深 - Qing Deep
@qing-700: #007A92;     // 蒼青 - Azure Qing
@qing-800: #065E68;     // 玄青 - Dark Teal
@qing-900: #043E45;     // 墨青 - Ink Qing
@qing-950: #022A30;     // 青淵 - Qing Abyss

// -----------------------------------------------------------------------------
// Semantic Tokens - 語義化 Token
// -----------------------------------------------------------------------------

// Primary Color Series - 主色系列
@qing-primary: @qing-500;
@qing-primary-hover: @qing-600;
@qing-primary-active: @qing-700;
@qing-primary-bg: @qing-100;
@qing-primary-bg-hover: @qing-200;
@qing-primary-border: @qing-300;
@qing-primary-border-hover: @qing-400;

// Text Color Series - 文字色系列
@qing-text: @qing-500;
@qing-text-hover: @qing-600;
@qing-text-active: @qing-700;
@qing-text-dark: @qing-800;

// -----------------------------------------------------------------------------
// Gradient Definitions - 漸變定義
// -----------------------------------------------------------------------------

// 完整五色水平漸變
@qing-gradient-full: linear-gradient(90deg, #66D1C4, #2CB7AE, #0093AF, #007A92, #065E68);

// 淺色漸變（適合背景）
@qing-gradient-light: linear-gradient(90deg, #E6F7F5, #B3EBE6, #80DFD7);

// 深色漸變（適合強調）
@qing-gradient-dark: linear-gradient(90deg, #0093AF, #007A92, #065E68);

// 垂直漸變
@qing-gradient-vertical: linear-gradient(180deg, #66D1C4, #2CB7AE, #0093AF, #007A92, #065E68);

// 對角漸變
@qing-gradient-diagonal: linear-gradient(135deg, #66D1C4, #2CB7AE, #0093AF, #007A92, #065E68);

// 徑向漸變
@qing-gradient-radial: radial-gradient(circle at center, #66D1C4, #2CB7AE, #0093AF, #007A92, #065E68);
```

### 實用工具類別

```css
/* ====== 青龍配色工具類別 ====== */

/* 背景色 */
.bg-qing-100 { background-color: var(--qing-100); }
.bg-qing-200 { background-color: var(--qing-200); }
.bg-qing-300 { background-color: var(--qing-300); }
.bg-qing-400 { background-color: var(--qing-400); }
.bg-qing-500 { background-color: var(--qing-500); }
.bg-qing-600 { background-color: var(--qing-600); }
.bg-qing-700 { background-color: var(--qing-700); }
.bg-qing-800 { background-color: var(--qing-800); }
.bg-qing-900 { background-color: var(--qing-900); }
.bg-qing-950 { background-color: var(--qing-950); }

/* 漸變背景 */
.bg-qing-gradient { background: var(--qing-gradient-full); }
.bg-qing-gradient-light { background: var(--qing-gradient-light); }
.bg-qing-gradient-dark { background: var(--qing-gradient-dark); }
.bg-qing-gradient-vertical { background: var(--qing-gradient-vertical); }
.bg-qing-gradient-diagonal { background: var(--qing-gradient-diagonal); }
.bg-qing-gradient-radial { background: var(--qing-gradient-radial); }

/* 文字色 */
.text-qing { color: var(--qing-primary); }
.text-qing-light { color: var(--qing-400); }
.text-qing-dark { color: var(--qing-800); }

/* 邊框色 */
.border-qing { border-color: var(--qing-primary); }
.border-qing-light { border-color: var(--qing-300); }
.border-qing-dark { border-color: var(--qing-700); }

/* 漸變文字 */
.text-qing-gradient {
  background: var(--qing-gradient-full);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### 動畫漸變

```css
/* 流動漸變動畫 */
@keyframes qing-flow {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.qing-flowing-gradient {
  background: linear-gradient(
    90deg,
    #66D1C4,
    #2CB7AE,
    #0093AF,
    #007A92,
    #065E68,
    #007A92,
    #0093AF,
    #2CB7AE,
    #66D1C4
  );
  background-size: 200% 100%;
  animation: qing-flow 8s ease infinite;
}

/* 呼吸效果 */
@keyframes qing-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.qing-pulse {
  animation: qing-pulse 2s ease-in-out infinite;
}
```

---

## 無障礙設計考量

### WCAG 對比度標準

根據 WCAG 2.1 指南，文字與背景的對比度需求如下：

| 標準 | 正常文字 | 大文字 (≥18pt 或 14pt 粗體) |
|------|----------|---------------------------|
| **AA 級** | 4.5:1 | 3:1 |
| **AAA 級** | 7:1 | 4.5:1 |

### 青龍配色對比度分析

#### 白色背景 (#FFFFFF) 上的對比度

| 色彩 | HEX | 對比度 | AA 正常文字 | AA 大文字 | AAA |
|------|-----|--------|-------------|-----------|-----|
| 青·光 | `#66D1C4` | 2.2:1 | ❌ | ❌ | ❌ |
| 青·正 | `#2CB7AE` | 3.1:1 | ❌ | ✅ | ❌ |
| 青·深 | `#0093AF` | 4.0:1 | ❌ | ✅ | ❌ |
| 蒼青 | `#007A92` | 4.6:1 | ✅ | ✅ | ❌ |
| 玄青 | `#065E68` | 6.3:1 | ✅ | ✅ | ❌ |
| 墨青 | `#043E45` | 9.3:1 | ✅ | ✅ | ✅ |
| 青淵 | `#022A30` | 12.5:1 | ✅ | ✅ | ✅ |

#### 黑色背景 (#000000) 上的對比度

| 色彩 | HEX | 對比度 | AA 正常文字 | AA 大文字 | AAA |
|------|-----|--------|-------------|-----------|-----|
| 青霧 | `#E6F7F5` | 16.8:1 | ✅ | ✅ | ✅ |
| 青露 | `#B3EBE6` | 12.5:1 | ✅ | ✅ | ✅ |
| 青泉 | `#80DFD7` | 9.2:1 | ✅ | ✅ | ✅ |
| 青·光 | `#66D1C4` | 7.5:1 | ✅ | ✅ | ✅ |
| 青·正 | `#2CB7AE` | 5.5:1 | ✅ | ✅ | ❌ |

### 使用建議

#### ✅ 推薦用法

1. **正文文字**：使用 `@qing-800` (#065E68) 或更深的顏色
2. **標題文字**：可使用 `@qing-700` (#007A92) 或更深
3. **連結文字**：使用 `@qing-700` (#007A92)，懸浮使用 `@qing-800`
4. **裝飾性元素**：可自由使用任何色階
5. **大面積背景**：使用 `@qing-100` (#E6F7F5) 配深色文字

#### ⚠️ 注意事項

1. **避免**：淺色（100-400）作為小字體文字色
2. **避免**：僅依靠顏色傳達重要資訊
3. **建議**：搭配圖示或文字說明
4. **測試**：使用對比度檢測工具驗證

### 色盲友好設計

| 類型 | 影響 | 建議 |
|------|------|------|
| 紅綠色盲 | 較小影響（青色非紅綠） | 可正常使用 |
| 藍黃色盲 | 可能影響青色辨識 | 搭配形狀/圖示區分 |
| 全色盲 | 僅能辨識明度差異 | 確保不同色階明度差異足夠 |

---

## 整合指南

### 與 GigHub 專案整合

#### 步驟 1：更新 LESS 變數檔案

在 `src/styles/_variables.less` 中添加青龍配色變數：

```less
// 在現有變數之後添加
@import './_azure-dragon-colors.less';
```

#### 步驟 2：建立青龍配色 LESS 檔案

建立 `src/styles/_azure-dragon-colors.less`：

```less
// =============================================================================
// Azure Dragon (青龍) Color System
// =============================================================================
// 此檔案包含青龍意象配色系統的所有 LESS 變數定義
// 詳細文檔請參閱: docs/design/azure-dragon-color-system.md

// [將上方 LESS 變數定義部分的內容複製到此處]
```

#### 步驟 3：與 ng-zorro-antd 主題整合

如需將青龍配色設為主色，在 `src/styles/theme.less` 中：

```less
@import '@delon/theme/theme-default.less';

// 使用青龍配色作為主色
@primary-color: #2CB7AE;  // 青·正
@link-color: #007A92;     // 蒼青
@success-color: #52c41a;  // 保持標準語義色
@warning-color: #faad14;
@error-color: #ff4d4f;
```

#### 步驟 4：動態主題切換

使用 NzConfigService 實現動態主題切換：

```typescript
import { Component, inject } from '@angular/core';
import { NzConfigService } from 'ng-zorro-antd/core/config';

@Component({
  selector: 'app-theme-switcher',
  template: `
    <button (click)="switchToAzureDragon()">切換青龍主題</button>
  `
})
export class ThemeSwitcherComponent {
  private nzConfigService = inject(NzConfigService);

  switchToAzureDragon(): void {
    this.nzConfigService.set('theme', { 
      primaryColor: '#2CB7AE' // 青·正
    });
  }
}
```

### 與 Ant Design 整合 (React/CSS-in-JS)

```tsx
import { ConfigProvider } from 'antd';

const azureDragonTheme = {
  token: {
    colorPrimary: '#2CB7AE',
    colorPrimaryHover: '#0093AF',
    colorPrimaryActive: '#007A92',
    colorPrimaryBg: '#E6F7F5',
    colorPrimaryBgHover: '#B3EBE6',
    colorPrimaryBorder: '#80DFD7',
    colorPrimaryBorderHover: '#66D1C4',
    colorPrimaryText: '#2CB7AE',
    colorPrimaryTextHover: '#0093AF',
    colorPrimaryTextActive: '#007A92',
  },
};

const App = () => (
  <ConfigProvider theme={azureDragonTheme}>
    <YourApp />
  </ConfigProvider>
);
```

---

## 附錄

### A. 色彩命名對照表

| 英文名稱 | 中文名稱 | 別名 | HEX |
|----------|----------|------|-----|
| Qing Mist | 青霧 | - | `#E6F7F5` |
| Qing Dew | 青露 | - | `#B3EBE6` |
| Qing Spring | 青泉 | - | `#80DFD7` |
| Qing Light | 青·光 | Light Qing | `#66D1C4` |
| Qing Mid | 青·正 | Mid Qing, Primary | `#2CB7AE` |
| Qing Deep | 青·深 | Deep Qing | `#0093AF` |
| Azure Qing | 蒼青 | - | `#007A92` |
| Dark Teal | 玄青 | - | `#065E68` |
| Ink Qing | 墨青 | - | `#043E45` |
| Qing Abyss | 青淵 | - | `#022A30` |

### B. HSL 與 RGB 完整對照

| 名稱 | HEX | RGB | HSL |
|------|-----|-----|-----|
| 青霧 | `#E6F7F5` | rgb(230, 247, 245) | hsl(173°, 53%, 94%) |
| 青露 | `#B3EBE6` | rgb(179, 235, 230) | hsl(175°, 53%, 81%) |
| 青泉 | `#80DFD7` | rgb(128, 223, 215) | hsl(175°, 57%, 69%) |
| 青·光 | `#66D1C4` | rgb(102, 209, 196) | hsl(173°, 53%, 61%) |
| 青·正 | `#2CB7AE` | rgb(44, 183, 174) | hsl(176°, 61%, 45%) |
| 青·深 | `#0093AF` | rgb(0, 147, 175) | hsl(190°, 100%, 34%) |
| 蒼青 | `#007A92` | rgb(0, 122, 146) | hsl(190°, 100%, 29%) |
| 玄青 | `#065E68` | rgb(6, 94, 104) | hsl(186°, 89%, 22%) |
| 墨青 | `#043E45` | rgb(4, 62, 69) | hsl(186°, 89%, 14%) |
| 青淵 | `#022A30` | rgb(2, 42, 48) | hsl(188°, 92%, 10%) |

### C. SCSS 版本變數

```scss
// Azure Dragon Color System - SCSS Version
$qing-100: #E6F7F5;
$qing-200: #B3EBE6;
$qing-300: #80DFD7;
$qing-400: #66D1C4;
$qing-500: #2CB7AE;
$qing-600: #0093AF;
$qing-700: #007A92;
$qing-800: #065E68;
$qing-900: #043E45;
$qing-950: #022A30;

$qing-gradient-full: linear-gradient(90deg, $qing-400, $qing-500, $qing-600, $qing-700, $qing-800);
```

### D. Tailwind CSS 配置

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        qing: {
          100: '#E6F7F5',
          200: '#B3EBE6',
          300: '#80DFD7',
          400: '#66D1C4',
          500: '#2CB7AE',
          600: '#0093AF',
          700: '#007A92',
          800: '#065E68',
          900: '#043E45',
          950: '#022A30',
        },
      },
    },
  },
};
```

### E. 設計工具導出

#### Figma 變數

```json
{
  "Qing/100": "#E6F7F5",
  "Qing/200": "#B3EBE6",
  "Qing/300": "#80DFD7",
  "Qing/400": "#66D1C4",
  "Qing/500": "#2CB7AE",
  "Qing/600": "#0093AF",
  "Qing/700": "#007A92",
  "Qing/800": "#065E68",
  "Qing/900": "#043E45",
  "Qing/950": "#022A30"
}
```

#### Sketch 調色板

```
Qing 100 - E6F7F5
Qing 200 - B3EBE6
Qing 300 - 80DFD7
Qing 400 - 66D1C4
Qing 500 - 2CB7AE
Qing 600 - 0093AF
Qing 700 - 007A92
Qing 800 - 065E68
Qing 900 - 043E45
Qing 950 - 022A30
```

### F. 參考資源

1. **Ant Design 色彩系統**: https://ant.design/docs/spec/colors
2. **NG-ZORRO 主題定制**: https://ng.ant.design/docs/customize-theme/zh
3. **WCAG 2.1 指南**: https://www.w3.org/WAI/WCAG21/quickref/
4. **對比度檢測工具**: https://webaim.org/resources/contrastchecker/

---

## 變更紀錄

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| 1.0.0 | 2025-01-01 | 初始版本，包含完整配色系統定義 | GigHub Team |

---

> **文檔維護說明**  
> 本文檔應與專案設計系統同步更新。任何色彩調整或新增應在此文檔中記錄，並同步更新相關的 LESS/CSS 變數檔案。

---

*此文檔由 GigHub 設計系統團隊維護*
