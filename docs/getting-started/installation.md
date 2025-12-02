# 安裝指南

> 完整的安裝與設定步驟

---

## 📥 步驟 1: Clone 專案

```bash
git clone https://github.com/7Spade/gighub-master.git
cd gighub-master
```

---

## 📦 步驟 2: 安裝依賴

```bash
# 使用 Yarn 安裝依賴
yarn install
```

> ⚠️ 專案使用 Yarn 4.x (Berry)，請確保已正確安裝

---

## ⚙️ 步驟 3: 環境設定

### 建立環境設定檔

```bash
cp .env.example .env
```

### 編輯 `.env` 檔案

```env
# Supabase 配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# 開發環境
NODE_ENV=development
```

---

## 🚀 步驟 4: 啟動開發伺服器

```bash
# 啟動開發伺服器
yarn start

# 或使用 HMR (熱模組替換)
yarn hmr
```

開啟瀏覽器訪問 `http://localhost:4200`

---

## 🧪 步驟 5: 驗證安裝

### 執行 Lint 檢查
```bash
yarn lint
```

### 執行測試
```bash
yarn test
```

### 建置專案
```bash
yarn build
```

---

## 🗄️ Supabase 設定 (選用)

### 本地開發

```bash
# 啟動 Supabase 本地服務
npx supabase start

# 執行資料庫遷移
npx supabase db push
```

### 遠端連接

確保 `.env` 中的 Supabase URL 和 Key 正確設定。

---

## 🐳 Docker 設定 (選用)

```bash
# 建置映像
docker build -t gighub-master .

# 執行容器
docker run -p 4200:80 gighub-master
```

---

## ❓ 常見問題

### Q: 安裝依賴時出現錯誤
```bash
# 清除快取後重試
yarn cache clean
rm -rf node_modules
yarn install
```

### Q: 啟動時出現 Port 占用
```bash
# 使用其他 Port
yarn start --port 4201
```

### Q: TypeScript 型別錯誤
```bash
# 重新產生型別
yarn ng build --configuration=development
```

---

**下一步**: [快速開始](./quick-start.md)
