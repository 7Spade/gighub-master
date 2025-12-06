# ADR-0001: 使用 Angular Signals 作為狀態管理方案

## 狀態

✅ 已採納

## 背景

專案需要一個可靠的狀態管理方案來處理：
- 元件間的狀態共享
- 響應式資料更新
- 效能優化（減少不必要的渲染）

考慮的選項包括：
- NgRx
- NGXS
- Akita
- Angular Signals (Angular 16+)

## 決策

我們選擇使用 **Angular Signals** 作為主要的狀態管理方案。

## 原因

1. **官方支援**: Signals 是 Angular 團隊官方開發和維護的方案
2. **效能優異**: 細粒度的反應性，只更新實際變化的部分
3. **學習曲線低**: 相較於 NgRx/NGXS，概念更簡單直觀
4. **減少樣板代碼**: 不需要 Actions、Reducers、Effects 等
5. **與 OnPush 完美整合**: 自動觸發變更檢測
6. **未來發展**: Angular 團隊將持續投資 Signals 生態系

## 後果

### 正面影響
- 程式碼更簡潔
- 效能提升
- 開發體驗改善
- 維護成本降低

### 負面影響
- 團隊需要學習新概念
- 現有的 RxJS 程式碼需要逐步遷移
- 部分進階功能可能需要自行實作

## 替代方案

### NgRx
功能強大但學習曲線陡峭，樣板代碼多。對於本專案規模來說過於複雜。

### NGXS
比 NgRx 簡單但仍需要較多樣板代碼。

## 相關連結

- [Angular Signals 官方文檔](https://angular.dev/guide/signals)
- [系統架構文件](../system-architecture.md)

---

**日期**: 2025-11-27
**作者**: @7Spade
