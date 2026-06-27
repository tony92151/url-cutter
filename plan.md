# URL Cutter 實作規劃

## 目標

建立一個可部署在 GitHub Pages 的靜態網頁工具，用來裁剪社群平台分享連結中不需要的 URL 區段，例如 Query String 或 Fragment。使用者可透過網址帶入一段 Base64 編碼後的目標 URL，網頁會解碼、解析 URL 結構，並提供適合手機操作的介面，讓使用者點選要移除的部分後產生乾淨連結。

## 使用情境

1. 使用者從社群平台複製分享連結。
2. 使用者或外部捷徑工具將該連結做 Base64 URL-safe 編碼。
3. 開啟本工具頁面並透過 Query String 帶入編碼後的 URL。
4. 工具解碼並解析 URL。
5. 使用者在手機上點選想移除的 URL 組成部分。
6. 工具即時產生裁剪後的 URL，並提供複製或開啟連結功能。

## 部署方式

本專案希望以 GitHub Pages 部署，因此優先採用純前端靜態網站架構：

- HTML
- CSS
- JavaScript
- 不依賴後端服務
- 不需要資料庫
- 不儲存使用者輸入的 URL

建議專案初期可使用以下結構：

```text
/
├── index.html
├── styles.css
├── app.js
├── README.md
└── plan.md
```

若未來功能增加，再考慮導入 Vite 或其他前端建置工具；但第一版應避免過度工程化，確保 GitHub Pages 可直接部署。

## URL 輸入格式

網頁本身透過 Query String 接收 Base64 後的目標 URL。

建議參數名稱：

```text
?url=<base64-url-safe-encoded-target-url>
```

範例：

```text
https://example.github.io/url-cutter/?url=aHR0cHM6Ly9leGFtcGxlLmNvbS9wYXRoP2E9MSZiPTIjZnJhZw
```

### Base64 編碼規則

建議支援兩種格式：

1. 標準 Base64
2. Base64 URL-safe

Base64 URL-safe 需處理：

- `-` 還原為 `+`
- `_` 還原為 `/`
- 自動補齊 `=` padding

解碼時需使用 UTF-8 安全解碼，避免中文網址或非 ASCII 字元出錯。

## URL 解析項目

工具需要解析以下 URL 組成部分：

| 項目 | 說明 | 範例 |
| --- | --- | --- |
| Protocol / Scheme | URL 協定 | `https:` |
| User Info | 使用者資訊，可能包含 username/password | `user:pass@` |
| Host / Domain / IP | 網域或 IP | `example.com` |
| Port | 連接埠 | `:8080` |
| Path | 路徑 | `/posts/123` |
| Query String | 查詢字串 | `?utm_source=x&id=1` |
| Fragment | 片段識別 | `#comments` |

JavaScript 可優先使用內建 `URL` 物件解析：

```js
const parsed = new URL(targetUrl);
```

但需注意：

- `URL.protocol` 會包含結尾冒號，例如 `https:`。
- `URL.username` 與 `URL.password` 分開提供，顯示時可合併成 User Info。
- `URL.host` 會包含 port。
- `URL.hostname` 不包含 port。
- `URL.port` 只回傳明確指定的 port。
- `URL.search` 包含 `?`。
- `URL.hash` 包含 `#`。

## 裁剪規則

第一版建議讓使用者可移除下列部分：

- User Info
- Port
- Path
- Query String
- Fragment

Protocol 與 Host 預設不建議移除，因為移除後多數情況會造成 URL 不完整；但可在 UI 上顯示它們，並標示為必要項目。

### Query String 細部裁剪

Query String 是主要需求來源，建議第一版支援兩個層級：

1. 移除整段 Query String。
2. 展開 Query Parameters，讓使用者逐一移除特定 key-value。

例如：

```text
https://example.com/post?id=123&utm_source=facebook&utm_medium=social#top
```

可解析為：

- `id=123`
- `utm_source=facebook`
- `utm_medium=social`

使用者可只移除 `utm_source` 與 `utm_medium`，保留 `id=123`。

### Fragment 裁剪

Fragment 可整段移除，例如：

```text
#top
```

第一版不需要再解析 Fragment 內部格式。

## 手機操作介面設計

目標是讓使用者在手機上快速點選要移除的部分，因此 UI 應採用大按鈕與清楚的狀態提示。

### 建議畫面區塊

1. 標題與簡短說明
2. 原始 URL 顯示區
3. URL 組成部分卡片列表
4. Query Parameters 展開列表
5. 裁剪後 URL 預覽
6. 操作按鈕

### URL 組成部分卡片

每個 URL 部分以卡片或 pill button 呈現：

- 名稱：例如 `Query String`
- 內容：例如 `?utm_source=facebook`
- 狀態：保留 / 移除
- 點擊後切換狀態

建議視覺狀態：

- 保留：一般底色
- 移除：淡紅底、刪除線或 `Removed` 標籤
- 必要：灰色鎖定，例如 Protocol、Host

### 操作按鈕

- 複製裁剪後 URL
- 開啟裁剪後 URL
- 重設選取
- 手動貼上 URL（可作為沒有 query 參數時的備援）

## URL 重組方式

不建議直接用字串取代方式重組 URL，應根據解析結果與使用者選取狀態重新組合。

建議流程：

1. 使用 `new URL(targetUrl)` 建立 URL 物件。
2. 根據使用者選取狀態修改複製後的 URL 物件。
3. 若移除 User Info：清空 `username` 與 `password`。
4. 若移除 Port：清空 `port`。
5. 若移除 Path：設定 `pathname = '/'` 或空路徑策略。
6. 若移除整段 Query String：清空 `search`。
7. 若只移除部分 Query Parameters：使用 `URLSearchParams` 重建 `search`。
8. 若移除 Fragment：清空 `hash`。
9. 輸出 `url.toString()`。

### Path 移除策略

需明確定義移除 Path 後的行為。建議第一版採用：

```text
pathname = '/'
```

原因：

- 對 HTTP/HTTPS URL 較符合瀏覽器預期。
- 可避免產生格式不明確的 URL。

## 錯誤處理

需要處理以下錯誤狀態：

1. 未提供 `url` 參數。
2. Base64 解碼失敗。
3. 解碼後不是合法 URL。
4. URL 使用不支援的協定。
5. 剪貼簿 API 不可用或使用者拒絕權限。

錯誤訊息應以使用者可理解的方式呈現，例如：

- 「找不到要裁剪的 URL，請貼上一個 URL。」
- 「無法解碼網址參數，請確認 Base64 格式是否正確。」
- 「這不是有效的 URL，請確認包含 https:// 或 http://。」

## 隱私與安全考量

- 所有處理都在瀏覽器本機完成。
- 不將 URL 傳送到任何伺服器。
- 不使用第三方分析工具作為第一版預設。
- 顯示 User Info 時需注意可能包含密碼，可考慮預設遮蔽 password。
- 開啟裁剪後 URL 時使用一般連結或 `window.open`，並加上 `noopener noreferrer`。

## 無障礙與可用性

- 所有可點擊項目需使用 `button` 或可鍵盤操作元素。
- 狀態不可只依賴顏色，需有文字標籤。
- 手機按鈕高度建議至少 44px。
- 裁剪後 URL 可選取、可複製。
- 使用 `aria-pressed` 表示切換狀態。

## 實作里程碑

### Milestone 1：靜態頁面骨架

- 建立 `index.html`。
- 建立 `styles.css`。
- 建立 `app.js`。
- 完成 GitHub Pages 可直接開啟的基本頁面。

### Milestone 2：Base64 URL 輸入與解碼

- 讀取 `?url=` 參數。
- 支援標準 Base64 與 Base64 URL-safe。
- 支援 UTF-8 解碼。
- 加入錯誤訊息顯示。
- 沒有參數時提供手動貼上欄位。

### Milestone 3：URL 解析與顯示

- 使用 `URL` 物件解析目標 URL。
- 顯示 Protocol、User Info、Host、Port、Path、Query String、Fragment。
- 將必要項目與可移除項目做出視覺區分。

### Milestone 4：互動式裁剪

- 點擊 URL 部分切換保留 / 移除狀態。
- 支援移除 User Info、Port、Path、Query String、Fragment。
- 即時更新裁剪後 URL 預覽。

### Milestone 5：Query Parameters 細部控制

- 展開 Query String。
- 列出每個 query parameter。
- 支援逐一移除 query parameter。
- 保留重複 key 的處理能力，例如 `tag=a&tag=b`。

### Milestone 6：輸出操作

- 複製裁剪後 URL。
- 開啟裁剪後 URL。
- 重設選取狀態。
- 加入操作成功或失敗提示。

### Milestone 7：測試與文件

- 補充 README 使用說明。
- 測試常見 URL 型態。
- 測試中文 URL。
- 測試含 User Info、Port、Query、Fragment 的完整 URL。
- 測試 GitHub Pages 部署結果。

## 測試案例

### 一般社群分享連結

```text
https://example.com/post/123?utm_source=facebook&utm_medium=social&id=123#comments
```

期望：可移除 `utm_source`、`utm_medium` 與 `#comments`，保留必要的 `id=123`。

### 含 User Info 與 Port

```text
https://user:pass@example.com:8080/path?a=1#frag
```

期望：可移除 User Info、Port、Path、Query String、Fragment。

### 中文 URL

```text
https://example.com/文章/測試?標籤=分享&utm_source=社群#段落
```

期望：Base64 解碼與 URL 顯示不應產生亂碼。

### 重複 Query Key

```text
https://example.com/search?tag=a&tag=b&utm_source=x
```

期望：可保留兩個 `tag`，只移除 `utm_source`。

### 沒有 Query String

```text
https://example.com/path#frag
```

期望：仍可移除 Fragment 或 Path，並顯示沒有 Query String。

## 第一版不做的事項

- 不做後端短網址服務。
- 不儲存歷史紀錄。
- 不自動判斷哪些 query parameter 是追蹤參數。
- 不支援批次處理多個 URL。
- 不做登入或帳號系統。

## 後續可擴充功能

- 常見追蹤參數一鍵移除，例如 `utm_*`、`fbclid`、`gclid`。
- 分享產生器：貼上 URL 後自動產生本工具的 Base64 入口連結。
- PWA 支援，方便手機加入主畫面。
- 深色模式。
- 多語系介面。
- 匯出裁剪規則設定。
