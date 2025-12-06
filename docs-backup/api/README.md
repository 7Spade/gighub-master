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

**最後更新**: 2025-12-02
