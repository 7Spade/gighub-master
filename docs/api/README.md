# 🔌 API 文件

> GigHub API 參考文件

---

## 📋 API 概覽

本專案使用 Supabase 作為後端，API 透過以下方式存取：

| 類型 | 說明 |
|------|------|
| Supabase Client | 直接使用 Supabase JS SDK |
| REST API | Supabase 自動生成的 REST API |
| RPC | 自訂 PostgreSQL 函數呼叫 |

---

## 🔐 認證

### Bearer Token

所有 API 請求需要在 Header 中包含：

```
Authorization: Bearer <access_token>
```

### API Key

使用 Supabase anon key：

```
apikey: <supabase_anon_key>
```

---

## 📚 API 端點

### 認證 API
| 端點 | 方法 | 說明 |
|------|------|------|
| `/auth/v1/signup` | POST | 註冊 |
| `/auth/v1/token` | POST | 登入 |
| `/auth/v1/logout` | POST | 登出 |

### 資料 API (自動生成)
| 端點 | 方法 | 說明 |
|------|------|------|
| `/rest/v1/account` | GET/POST | 帳戶操作 |
| `/rest/v1/blueprint` | GET/POST | 藍圖操作 |
| `/rest/v1/task` | GET/POST | 任務操作 |

---

## 🔗 SDK 使用

### Supabase JS SDK

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 查詢資料
const { data, error } = await supabase
  .from('blueprint')
  .select('*')
  .eq('owner_id', userId);

// 插入資料
const { data, error } = await supabase
  .from('task')
  .insert({ title: 'New Task', blueprint_id: blueprintId });
```

---

## 🌤️ 外部 API 整合

### 中央氣象署開放資料平台 API
📄 **文件**: [cwb-open-data-api.md](./cwb-open-data-api.md)  
**版本**: 1.0.0  
**更新日期**: 2025-12-06

**內容概要**:
- 平台簡介與基本資訊
- API 認證與授權方式
- 完整的資料類別與端點說明（天氣預報、觀測資料、地震資訊、颱風警報等）
- TypeScript/Angular 實作範例（含 Signals 與 Standalone Components）
- Python 實作範例與 cURL 範例
- 錯誤處理、速率限制與最佳實踐
- GigHub 專案整合建議（Repository Pattern）

**適用場景**:
- 工地天氣資訊展示
- 施工適宜度評估
- 天氣預警通知
- 專案排程規劃

---

## 📖 API 文檔開發規範

### 新增外部 API 文檔時，請遵循以下結構：

1. **基本資訊** - API 名稱、版本、平台簡介
2. **認證與授權** - 如何取得金鑰、認證方式、安全建議
3. **API 端點** - 完整端點列表、參數說明、回應格式
4. **程式碼範例** - TypeScript/Angular 實作（必須）、其他語言範例（可選）
5. **整合指南** - 專案架構整合建議、Repository Pattern 實作
6. **常見問題** - 疑難排解、效能優化、參考資源

### 檔案命名規範
- 使用 kebab-case：`{api-name}-api.md`
- 範例：`google-maps-api.md`, `line-notify-api.md`

---

**最後更新**: 2025-12-06
