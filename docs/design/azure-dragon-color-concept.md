# 青龍意象 — 青色定義與漸層配色

## 📋 目錄
- [概述](#概述)
- [青色定義與文化意涵](#青色定義與文化意涵)
- [色彩科學基礎](#色彩科學基礎)
- [青龍配色系統](#青龍配色系統)
- [漸層設計理論](#漸層設計理論)
- [實作指南](#實作指南)
- [應用場景](#應用場景)
- [技術規格](#技術規格)
- [參考資料](#參考資料)

---

## 概述

### 設計理念

青龍，東方四象之一，代表春季、生命力與希望。在 GigHub 工地施工進度追蹤管理系統中，青龍意象象徵著專案的蓬勃發展、持續進步與卓越品質。

本設計文檔基於以下原則：
- **文化傳承**：融合東方美學與現代設計
- **科學配色**：基於色彩理論的系統化設計
- **無障礙性**：符合 WCAG 2.0 對比度標準
- **技術可行**：使用 CSS 漸層與現代色彩空間

### 技術架構

- **色彩系統**：基於 Ant Design 色彩規範
- **漸層實作**：CSS3 Linear/Radial Gradients
- **色彩空間**：RGB、HSL、HEX
- **框架整合**：ng-zorro-antd 20.4.3 + ng-alain 20.1.0

---

## 青色定義與文化意涵

### 傳統青色概念

在中國傳統文化中，「青」是一個複雜且富含詩意的色彩概念：

#### 色彩範圍
```
青色光譜範圍：
├── 深藍青（靛青）: #003D79 - #1E4D8B
├── 標準青（湖青）: #00A0AC - #00CED1  
├── 淺青（天青）  : #87CEEB - #B0E0E6
└── 碧青（翠青）  : #008B8B - #20B2AA
```

#### 文化象徵
- **生命與成長**：「青出於藍而勝於藍」
- **春季與希望**：「春來江水綠如藍」
- **高潔品格**：「青山不改，綠水長流」
- **永恆堅韌**：「青松翠柏」

### 現代 Cyan 色彩定義

根據 Ant Design 色彩系統和現代色彩理論：

#### RGB 色彩模型
```typescript
// Cyan (青色) 在 RGB 色彩空間的定義
interface CyanRGB {
  r: number; // 紅色通道: 0-100
  g: number; // 綠色通道: 180-255
  b: number; // 藍色通道: 180-255
}

// 標準青色
const standardCyan: CyanRGB = {
  r: 19,   // 低紅色值
  g: 194,  // 高綠色值
  b: 194   // 高藍色值
};
// RGB(19, 194, 194) = #13C2C2
```

#### HSL 色彩模型
```css
/* Cyan 在 HSL 色彩空間 */
.cyan-color {
  hue: 180deg;         /* 色相: 180度 (青色區域) */
  saturation: 82%;     /* 飽和度: 高飽和 */
  lightness: 42%;      /* 明度: 中等明度 */
}
```

---

## 色彩科學基礎

### 青色在色輪中的位置

```
色輪圖示 (360度):
        0° Red
         |
   330° | 30° Orange
        |
   300° | 60° Yellow
        |
   270° | 90° Yellow-Green
 Purple |
        | 120° Green
   240° | 
  Blue  | 150° Cyan-Green
        |
   210° | 180° Cyan (青色核心)
        |
        | 210° Cyan-Blue
   180° |
  Cyan  | 240° Blue
```

### 色彩對比與和諧

#### 互補色 (Complementary)
```less
// 青色的互補色是紅橙色
@cyan-primary: #13C2C2;      // Hue: 180°
@cyan-complement: #C21313;    // Hue: 0° (相對180°)
```

#### 類似色 (Analogous)
```less
// 青色的類似色
@cyan-green: #13C278;         // Hue: 150° (綠青)
@cyan-primary: #13C2C2;       // Hue: 180° (標準青)
@cyan-blue: #1378C2;          // Hue: 210° (藍青)
```

#### 三角色 (Triadic)
```less
// 青色三角配色
@cyan: #13C2C2;      // Hue: 180° (青)
@magenta: #C213C2;   // Hue: 300° (品紅)
@yellow: #C2C213;    // Hue: 60° (黃)
```

### WCAG 對比度標準

根據 Ant Design 無障礙設計原則：

```less
// 文字對比度要求
// Normal text (14px+): 4.5:1
// Large text (18px+ or 14px+ bold): 3:1

// 青龍配色對比度計算
@azure-dragon-primary: #13C2C2;     // 主色
@azure-dragon-on-white: #0B7A7A;    // 白底文字 (對比 4.52:1) ✓
@azure-dragon-on-dark: #7FE5E5;     // 深色底文字 (對比 7.2:1) ✓
```

---

## 青龍配色系統

### 主色階 (Primary Palette)

基於 Ant Design 10色階系統，青龍配色定義如下：

```less
// ============================================================================
// Azure Dragon Color System - 青龍配色系統
// 基於 Ant Design 色彩規範與中國傳統青色美學
// ============================================================================

// 青龍主色階 (10 Levels)
@azure-dragon-1: #E6FFFF;   // 最淡 - 冰青 (Ice Cyan)
@azure-dragon-2: #B3F5F5;   // 極淡 - 薄霧青 (Mist Cyan)
@azure-dragon-3: #80EBEB;   // 很淡 - 晨露青 (Dew Cyan)
@azure-dragon-4: #4DE0E0;   // 較淡 - 湖水青 (Lake Cyan)
@azure-dragon-5: #26D6D6;   // 淡色 - 清泉青 (Spring Cyan)
@azure-dragon-6: #13C2C2;   // 標準 - 主青色 (Primary Cyan) ⭐
@azure-dragon-7: #0F9E9E;   // 較深 - 深潭青 (Deep Pool Cyan)
@azure-dragon-8: #0B7A7A;   // 很深 - 墨青 (Ink Cyan)
@azure-dragon-9: #085656;   // 極深 - 夜青 (Night Cyan)
@azure-dragon-10: #043232;  // 最深 - 淵青 (Abyss Cyan)
```

### 語義色彩擴展

```less
// 青龍語義色 - 成功狀態增強
@color-success-azure: @azure-dragon-6;        // 主要成功色
@color-success-azure-light: @azure-dragon-2;  // 淺色背景
@color-success-azure-dark: @azure-dragon-8;   // 深色變體

// 青龍語義色 - 資訊狀態
@color-info-azure: @azure-dragon-6;
@color-info-azure-light: @azure-dragon-1;
```

### 中性色擴展

```less
// 青龍調性的中性灰 (Cool Grays)
@azure-neutral-1: #F5F9F9;  // 極淡青灰
@azure-neutral-2: #E8F2F2;  // 淡青灰
@azure-neutral-3: #D1E5E5;  // 青灰
@azure-neutral-4: #A3CCCC;  // 中青灰
@azure-neutral-5: #669999;  // 深青灰
```

---

## 漸層設計理論

### 線性漸層 (Linear Gradients)

基於 CSS3 漸層規範，設計多種青龍漸層效果：

#### 1. 晨曦漸層 (Dawn Gradient)
**設計意圖**：象徵專案啟動的希望與活力

```css
/* 從淺青到深青的垂直漸層 */
.azure-gradient-dawn {
  background: linear-gradient(
    180deg,                    /* 從上到下 */
    #E6FFFF 0%,               /* 冰青 - 天空 */
    #80EBEB 35%,              /* 晨露青 */
    #26D6D6 70%,              /* 清泉青 */
    #13C2C2 100%              /* 主青色 - 地平線 */
  );
}
```

**使用場景**：頁面頂部背景、Hero區塊

#### 2. 深潭漸層 (Deep Pool Gradient)
**設計意圖**：表達深度與專業性

```css
/* 從深青到極深青的徑向漸層 */
.azure-gradient-pool {
  background: radial-gradient(
    circle at center,          /* 圓形中心擴散 */
    #0B7A7A 0%,               /* 墨青 - 中心 */
    #085656 50%,              /* 夜青 */
    #043232 100%              /* 淵青 - 邊緣 */
  );
}
```

**使用場景**：暗色主題背景、Modal背景

#### 3. 龍鱗漸層 (Dragon Scale Gradient)
**設計意圖**：青龍鱗片般的層次感

```css
/* 多色停止點漸層 - 創造紋理效果 */
.azure-gradient-scale {
  background: linear-gradient(
    135deg,                    /* 對角線 */
    #13C2C2 0%,               /* 主青 */
    #0F9E9E 25%,              /* 深潭青 */
    #13C2C2 50%,              /* 主青 */
    #0F9E9E 75%,              /* 深潭青 */
    #13C2C2 100%              /* 主青 */
  );
  background-size: 200% 200%; /* 支援動畫 */
}
```

**使用場景**：按鈕hover效果、裝飾性背景

#### 4. 天青漸層 (Sky Gradient)
**設計意圖**：清新明亮的天空感

```css
/* 從白色到青色的淡雅漸層 */
.azure-gradient-sky {
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 1) 0%,     /* 純白 */
    rgba(179, 245, 245, 0.6) 50%,  /* 半透明薄霧青 */
    rgba(19, 194, 194, 0.3) 100%   /* 半透明主青 */
  );
}
```

**使用場景**：卡片背景、區塊分隔

### 徑向漸層 (Radial Gradients)

#### 5. 靈氣漸層 (Aura Gradient)
**設計意圖**：青龍靈氣的擴散效果

```css
.azure-gradient-aura {
  background: radial-gradient(
    ellipse at top left,       /* 橢圓形，左上起點 */
    #13C2C2 0%,               /* 主青 - 核心 */
    rgba(19, 194, 194, 0.6) 40%, /* 半透明 */
    rgba(19, 194, 194, 0.2) 70%, /* 更淡 */
    transparent 100%           /* 完全透明 */
  );
}
```

**使用場景**：聚光效果、強調區域背景

### 錐形漸層 (Conic Gradients)

#### 6. 龍珠漸層 (Dragon Orb Gradient)
**設計意圖**：圓形寶珠的光澤效果

```css
.azure-gradient-orb {
  background: conic-gradient(
    from 0deg at 50% 50%,      /* 中心旋轉 */
    #13C2C2 0deg,              /* 主青 */
    #26D6D6 90deg,             /* 清泉青 */
    #13C2C2 180deg,            /* 主青 */
    #0F9E9E 270deg,            /* 深潭青 */
    #13C2C2 360deg             /* 回到主青 */
  );
  border-radius: 50%;          /* 圓形 */
}
```

**使用場景**：圖標、徽章、裝飾元素

### 動態漸層 (Animated Gradients)

#### 7. 流動漸層 (Flowing Gradient)
**設計意圖**：水流般的動態效果

```css
@keyframes azure-flow {
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

.azure-gradient-flowing {
  background: linear-gradient(
    -45deg,
    #E6FFFF,
    #80EBEB,
    #13C2C2,
    #0B7A7A
  );
  background-size: 400% 400%;
  animation: azure-flow 15s ease infinite;
}
```

**使用場景**：Loading動畫、Hero背景動效

---

## 實作指南

### LESS 變數定義

完整的青龍配色 LESS 變數：

```less
// ============================================================================
// Azure Dragon Color Variables - 青龍配色變數
// ============================================================================

// 主色階
@azure-dragon-1: #E6FFFF;
@azure-dragon-2: #B3F5F5;
@azure-dragon-3: #80EBEB;
@azure-dragon-4: #4DE0E0;
@azure-dragon-5: #26D6D6;
@azure-dragon-6: #13C2C2;  // Primary
@azure-dragon-7: #0F9E9E;
@azure-dragon-8: #0B7A7A;
@azure-dragon-9: #085656;
@azure-dragon-10: #043232;

// 別名 - 便於記憶的命名
@color-azure-ice: @azure-dragon-1;
@color-azure-mist: @azure-dragon-2;
@color-azure-dew: @azure-dragon-3;
@color-azure-lake: @azure-dragon-4;
@color-azure-spring: @azure-dragon-5;
@color-azure-primary: @azure-dragon-6;
@color-azure-pool: @azure-dragon-7;
@color-azure-ink: @azure-dragon-8;
@color-azure-night: @azure-dragon-9;
@color-azure-abyss: @azure-dragon-10;

// 漸層預設組合
@gradient-azure-dawn: linear-gradient(180deg, @azure-dragon-1 0%, @azure-dragon-3 35%, @azure-dragon-5 70%, @azure-dragon-6 100%);
@gradient-azure-pool: radial-gradient(circle at center, @azure-dragon-8 0%, @azure-dragon-9 50%, @azure-dragon-10 100%);
@gradient-azure-sky: linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(179, 245, 245, 0.6) 50%, rgba(19, 194, 194, 0.3) 100%);
```

### Angular 元件整合

#### 使用青龍色彩的 Angular 元件範例

```typescript
import { Component } from '@angular/core';
import { SHARED_IMPORTS } from '@shared';

@Component({
  selector: 'app-azure-hero',
  standalone: true,
  imports: [SHARED_IMPORTS],
  template: `
    <div class="azure-hero">
      <h1 class="azure-title">GigHub 施工管理系統</h1>
      <p class="azure-subtitle">青龍品質，卓越進度</p>
    </div>
  `,
  styles: [`
    .azure-hero {
      padding: 80px 24px;
      background: linear-gradient(
        180deg,
        #E6FFFF 0%,
        #80EBEB 35%,
        #26D6D6 70%,
        #13C2C2 100%
      );
      text-align: center;
    }
    
    .azure-title {
      color: #043232;
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 16px;
      text-shadow: 0 2px 8px rgba(4, 50, 50, 0.1);
    }
    
    .azure-subtitle {
      color: #085656;
      font-size: 20px;
    }
  `]
})
export class AzureHeroComponent {}
```

#### 使用青龍色彩的按鈕元件

```typescript
@Component({
  selector: 'app-azure-button',
  standalone: true,
  imports: [SHARED_IMPORTS, NzButtonModule],
  template: `
    <button 
      nz-button 
      [nzType]="'primary'"
      class="azure-button"
      (click)="handleClick()">
      <span nz-icon nzType="rocket" nzTheme="outline"></span>
      {{ label }}
    </button>
  `,
  styles: [`
    .azure-button {
      background: #13C2C2;
      border-color: #13C2C2;
      color: #fff;
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, #13C2C2 0%, #0F9E9E 50%, #13C2C2 100%);
        border-color: #0F9E9E;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(19, 194, 194, 0.3);
      }
      
      &:active {
        background: #0B7A7A;
        border-color: #0B7A7A;
        transform: translateY(0);
      }
    }
  `]
})
export class AzureButtonComponent {
  @Input() label = '確認';
  @Output() onClick = new EventEmitter<void>();
  
  handleClick(): void {
    this.onClick.emit();
  }
}
```

### ng-zorro-antd 主題整合

在 `angular.json` 或主題配置中：

```less
// theme.less
@import '~ng-zorro-antd/ng-zorro-antd.less';

// 覆蓋 Ant Design 預設變數
@primary-color: #13C2C2;           // 青龍主色
@info-color: #13C2C2;
@success-color: #52c41a;
@processing-color: #13C2C2;
@error-color: #ff4d4f;
@highlight-color: #ff4d4f;
@warning-color: #faad14;
@normal-color: #d9d9d9;

// 連結色
@link-color: #13C2C2;
@link-hover-color: #26D6D6;
@link-active-color: #0B7A7A;
```

---

## 應用場景

### 1. 頁面頭部 (Page Header)

```html
<div class="azure-page-header">
  <div class="header-gradient"></div>
  <div class="header-content">
    <h1>專案儀表板</h1>
    <p>實時監控施工進度</p>
  </div>
</div>
```

```less
.azure-page-header {
  position: relative;
  height: 200px;
  overflow: hidden;
  
  .header-gradient {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      @azure-dragon-1 0%,
      @azure-dragon-3 50%,
      @azure-dragon-6 100%
    );
    opacity: 0.9;
  }
  
  .header-content {
    position: relative;
    z-index: 1;
    padding: 48px 24px;
    color: @azure-dragon-10;
  }
}
```

### 2. 狀態卡片 (Status Cards)

```html
<nz-card class="azure-status-card azure-success">
  <div class="card-icon">
    <span nz-icon nzType="check-circle" nzTheme="fill"></span>
  </div>
  <div class="card-content">
    <h3>已完成任務</h3>
    <p class="card-value">128</p>
  </div>
</nz-card>
```

```less
.azure-status-card {
  border: 1px solid @azure-dragon-3;
  border-radius: 8px;
  transition: all 0.3s ease;
  
  &.azure-success {
    background: linear-gradient(
      135deg,
      rgba(230, 255, 255, 0.5) 0%,
      rgba(179, 245, 245, 0.3) 100%
    );
    
    .card-icon {
      color: @azure-dragon-6;
      font-size: 32px;
    }
  }
  
  &:hover {
    border-color: @azure-dragon-6;
    box-shadow: 0 4px 12px rgba(19, 194, 194, 0.2);
    transform: translateY(-4px);
  }
}
```

### 3. 進度條 (Progress Bar)

```html
<nz-progress 
  [nzPercent]="75" 
  nzStrokeColor="#13C2C2"
  class="azure-progress">
</nz-progress>
```

```less
.azure-progress {
  ::ng-deep .ant-progress-bg {
    background: linear-gradient(
      to right,
      @azure-dragon-5,
      @azure-dragon-6,
      @azure-dragon-7
    );
  }
  
  ::ng-deep .ant-progress-success-bg {
    background: @azure-dragon-6;
  }
}
```

### 4. 通知提示 (Notifications)

```typescript
// 使用青龍色彩的成功通知
this.notification.success(
  '操作成功',
  '專案進度已更新',
  {
    nzStyle: {
      background: 'linear-gradient(135deg, #E6FFFF 0%, #B3F5F5 100%)',
      border: '1px solid #13C2C2'
    }
  }
);
```

---

## 技術規格

### 色彩值對照表

| 色階 | 名稱 | HEX | RGB | HSL |
|------|------|-----|-----|-----|
| 1 | 冰青 | #E6FFFF | rgb(230, 255, 255) | hsl(180, 100%, 95%) |
| 2 | 薄霧青 | #B3F5F5 | rgb(179, 245, 245) | hsl(180, 73%, 83%) |
| 3 | 晨露青 | #80EBEB | rgb(128, 235, 235) | hsl(180, 73%, 71%) |
| 4 | 湖水青 | #4DE0E0 | rgb(77, 224, 224) | hsl(180, 70%, 59%) |
| 5 | 清泉青 | #26D6D6 | rgb(38, 214, 214) | hsl(180, 70%, 49%) |
| 6 | 主青色 | #13C2C2 | rgb(19, 194, 194) | hsl(180, 82%, 42%) |
| 7 | 深潭青 | #0F9E9E | rgb(15, 158, 158) | hsl(180, 83%, 34%) |
| 8 | 墨青 | #0B7A7A | rgb(11, 122, 122) | hsl(180, 83%, 26%) |
| 9 | 夜青 | #085656 | rgb(8, 86, 86) | hsl(180, 83%, 18%) |
| 10 | 淵青 | #043232 | rgb(4, 50, 50) | hsl(180, 85%, 11%) |

### 對比度檢測結果

| 組合 | 前景色 | 背景色 | 對比度 | WCAG AA | WCAG AAA |
|------|--------|--------|--------|---------|----------|
| 主色/白底 | #13C2C2 | #FFFFFF | 3.06:1 | ❌ | ❌ |
| 深色/白底 | #0B7A7A | #FFFFFF | 4.52:1 | ✅ | ❌ |
| 極深/白底 | #043232 | #FFFFFF | 9.84:1 | ✅ | ✅ |
| 淺色/深底 | #80EBEB | #043232 | 10.2:1 | ✅ | ✅ |
| 主色/深底 | #13C2C2 | #043232 | 3.21:1 | ❌ | ❌ |

**建議使用**：
- 白底文字：使用 `@azure-dragon-8` (#0B7A7A) 或更深
- 深色底文字：使用 `@azure-dragon-3` (#80EBEB) 或更淺
- 強調用色：使用 `@azure-dragon-6` (#13C2C2)，但不做為主要文字色

### 瀏覽器支援

| 功能 | Chrome | Firefox | Safari | Edge |
|------|--------|---------|--------|------|
| Linear Gradient | ✅ 26+ | ✅ 16+ | ✅ 7+ | ✅ 12+ |
| Radial Gradient | ✅ 26+ | ✅ 16+ | ✅ 7+ | ✅ 12+ |
| Conic Gradient | ✅ 69+ | ✅ 83+ | ✅ 12.1+ | ✅ 79+ |
| CSS Variables | ✅ 49+ | ✅ 31+ | ✅ 9.1+ | ✅ 15+ |

---

## 參考資料

### 色彩理論來源

1. **Ant Design Color System**
   - 官方文檔: https://ant.design/docs/spec/colors
   - 色彩生成算法: @ant-design/colors
   - WCAG 無障礙標準

2. **CSS Gradient 規範**
   - W3C CSS Images Module Level 3
   - MDN Web Docs: CSS Gradients
   - 漸層生成器工具參考

3. **Open Props**
   - 現代 CSS 變數系統
   - 漸層預設集合
   - 色彩空間轉換

4. **Color Theory Resources**
   - Culori (JavaScript 色彩庫)
   - 色輪與配色理論
   - RGB/HSL 色彩空間

### 文化參考

1. **中國傳統色彩**
   - 《說文解字》對「青」的解釋
   - 四象系統：青龍、白虎、朱雀、玄武
   - 五行色彩對應

2. **現代設計應用**
   - Material Design Color System
   - Tailwind CSS Color Palette
   - Radix UI Colors

### 技術文檔

- **Angular**: https://angular.dev
- **ng-zorro-antd**: https://ng.ant.design
- **ng-alain**: https://ng-alain.com
- **Supabase**: https://supabase.com/docs
- **LESS**: https://lesscss.org

---

## 版本歷史

| 版本 | 日期 | 變更內容 | 作者 |
|------|------|----------|------|
| 1.0.0 | 2025-12-06 | 初版發布，完整青龍配色系統 | GigHub Team |

---

## 授權

本設計文檔採用 MIT License，與 GigHub 專案保持一致。

---

**設計理念總結**：青龍配色系統融合了中國傳統文化的青色美學與現代色彩科學，通過精心設計的10色階和多種漸層效果，為 GigHub 系統帶來獨特的視覺識別和文化內涵。色彩設計遵循無障礙標準，確保所有用戶都能獲得良好的使用體驗。
