# ADR-0002: 使用 Supabase 作為後端服務

## 狀態

✅ 已採納

## 背景

專案需要一個可靠的後端解決方案，包括：
- 資料庫服務
- 使用者認證
- 檔案儲存
- 即時訂閱
- 安全的資料存取控制

考慮的選項包括：
- Firebase
- Supabase
- 自建後端 (Node.js/NestJS)
- AWS Amplify

## 決策

我們選擇使用 **Supabase** 作為 BaaS (Backend as a Service) 解決方案。

## 原因

1. **PostgreSQL**: 使用成熟的關聯式資料庫，支援複雜查詢
2. **Row Level Security**: 資料庫層級的安全控制
3. **即時功能**: 內建 Realtime 訂閱
4. **認證系統**: 完整的 Auth 解決方案（JWT、OAuth）
5. **開源**: 可自行部署，不受供應商鎖定
6. **儲存**: 內建檔案儲存功能
7. **成本**: 對於中小型專案具有成本優勢

## 後果

### 正面影響
- 快速開發：無需自建後端
- 安全性：RLS 提供資料庫層級保護
- 擴展性：可遷移至自管 PostgreSQL
- 開發體驗：優秀的 SDK 和文檔

### 負面影響
- 對 Supabase 服務有依賴
- 複雜業務邏輯可能需要 Edge Functions
- 效能調優選項較自建後端少

## 替代方案

### Firebase
- 優點：成熟、社群大
- 缺點：NoSQL (Firestore)、供應商鎖定

### 自建後端
- 優點：完全控制
- 缺點：開發成本高、維護負擔重

## 相關連結

- [Supabase 官方文檔](https://supabase.com/docs)
- [Supabase 配置指南](../../supabase/README.md)
- [RLS 政策設計](../../supabase/rls/README.md)

---

**日期**: 2025-11-27
**作者**: @7Spade
