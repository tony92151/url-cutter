# URL Cutter V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the V1 static URL Cutter page from the approved design spec.

**Architecture:** The app is a build-free static site. `index.html` provides semantic structure and templates, `styles.css` provides mobile-first presentation and visual states, and `app.js` owns decoding, parsing, state transitions, rendering, rebuilding, clipboard behavior, and lightweight browser-console-verifiable helper functions.

**Tech Stack:** HTML, CSS, browser JavaScript, native `URL`, `TextDecoder`, `atob`, and Clipboard APIs. No backend, package manager, build step, or test runner.

---

## File Structure

- Create `index.html`: Static document shell, app regions, URL input form, action buttons, preview, explanation table, and script/style references.
- Create `styles.css`: Responsive layout, segment colors, required/kept/partial/removed states, accessible tap targets, wrapping behavior, and table styling.
- Create `app.js`: Pure helpers plus DOM controller. Helpers handle Base64 decoding, URL validation, segment/query extraction, state creation, URL rebuilding, and query serialization.
- Modify `README.md`: Add a short usage section with `?url=` input format, local-only privacy note, and static deployment note.

The existing `plan.md`, `ui.md`, `presentation.html`, and approved design spec remain unchanged during implementation unless a later review explicitly requests documentation edits.

---

### Task 1: Static Page Skeleton

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`

- [ ] **Step 1: Create `index.html` with stable app regions**

Use this complete file:

```html
<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>URL Cutter</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="app-shell">
    <header class="app-header">
      <div>
        <p class="eyebrow">URL Cutter</p>
        <h1>裁剪網址中不需要的部分</h1>
      </div>
    </header>

    <section class="panel input-panel" aria-labelledby="input-title">
      <h2 id="input-title">來源網址</h2>
      <form id="manual-url-form" class="url-form" novalidate>
        <label for="manual-url-input">貼上完整網址</label>
        <div class="input-row">
          <input id="manual-url-input" name="url" type="url" inputmode="url" autocomplete="url" placeholder="https://example.com/path?utm_source=x">
          <button type="submit">解析網址</button>
        </div>
      </form>
      <p id="source-status" class="status-message" role="status" aria-live="polite"></p>
    </section>

    <section class="panel cutter-panel" aria-labelledby="segments-title">
      <h2 id="segments-title">URL 分段操作區</h2>
      <div id="url-segments" class="segment-list" aria-label="URL 組成部分"></div>
    </section>

    <section id="query-section" class="panel query-panel" aria-labelledby="query-title" hidden>
      <h2 id="query-title">Query Parameters</h2>
      <div id="query-parameters" class="segment-list query-list" aria-label="Query parameters"></div>
    </section>

    <section class="action-panel" aria-label="操作">
      <button id="generate-button" class="primary-action" type="button">產生裁剪後網址</button>
      <button id="copy-button" class="secondary-action" type="button">複製裁剪後網址</button>
      <p id="action-status" class="status-message" role="status" aria-live="polite"></p>
    </section>

    <section class="panel preview-panel" aria-labelledby="preview-title">
      <h2 id="preview-title">裁剪後 URL 預覽</h2>
      <output id="result-url" class="result-url" for="manual-url-input"></output>
    </section>

    <section class="panel info-panel" aria-labelledby="info-title">
      <h2 id="info-title">URL 區段說明</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>URL 部分</th>
              <th>用意</th>
              <th>是否建議移除</th>
              <th>範例</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Protocol</td>
              <td>指定連線方式，例如 HTTP 或 HTTPS。</td>
              <td>不建議</td>
              <td><code>https:</code></td>
            </tr>
            <tr>
              <td>User Info</td>
              <td>URL 中的帳號或密碼資訊。</td>
              <td>建議移除</td>
              <td><code>user:pass@</code></td>
            </tr>
            <tr>
              <td>Host</td>
              <td>網站網域或 IP，是 URL 的核心目的地。</td>
              <td>不可移除</td>
              <td><code>example.com</code></td>
            </tr>
            <tr>
              <td>Port</td>
              <td>指定連線埠。一般網站通常不需要。</td>
              <td>視情況移除</td>
              <td><code>:8080</code></td>
            </tr>
            <tr>
              <td>Path</td>
              <td>指向網站中的特定頁面或資源。</td>
              <td>視情況移除</td>
              <td><code>/post/123</code></td>
            </tr>
            <tr>
              <td>Query String</td>
              <td>傳遞參數，可能包含追蹤碼或必要資料。</td>
              <td>視情況移除</td>
              <td><code>?utm_source=x&amp;id=1</code></td>
            </tr>
            <tr>
              <td>Query Parameter</td>
              <td>Query String 中的單一參數。</td>
              <td>視情況移除</td>
              <td><code>utm_source=x</code></td>
            </tr>
            <tr>
              <td>Fragment</td>
              <td>指向頁面內特定段落。</td>
              <td>可移除</td>
              <td><code>#comments</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `styles.css` with a minimal non-final baseline**

Use this complete starter file:

```css
:root {
  color-scheme: light;
  --bg: #f5f7f9;
  --panel: #ffffff;
  --ink: #17202a;
  --muted: #5e6a75;
  --line: #d8dee6;
  --action: #146c94;
  --action-dark: #263542;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
}

.app-shell {
  width: min(1100px, calc(100% - 24px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.app-header,
.panel,
.action-panel {
  margin-bottom: 16px;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: 30px;
  line-height: 1.15;
}

h2 {
  margin-bottom: 12px;
  font-size: 20px;
}

.url-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

.input-row {
  display: flex;
  gap: 10px;
}

input,
button {
  font: inherit;
}

input {
  min-width: 0;
  flex: 1;
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
}

button {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

.input-row button,
.primary-action {
  background: var(--action);
  color: #fff;
  padding: 10px 16px;
}

.secondary-action {
  background: var(--action-dark);
  color: #fff;
  padding: 10px 16px;
}

.status-message {
  min-height: 1.4em;
  margin: 10px 0 0;
  color: var(--muted);
}

.segment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.result-url {
  display: block;
  min-height: 54px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfd;
  padding: 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow-wrap: anywhere;
  user-select: text;
}

.action-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.action-panel .status-message {
  flex-basis: 100%;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid var(--line);
  padding: 10px 8px;
  text-align: left;
  vertical-align: top;
}

code {
  overflow-wrap: anywhere;
}

@media (max-width: 680px) {
  .input-row,
  .action-panel {
    display: grid;
  }

  .input-row button,
  .primary-action,
  .secondary-action {
    width: 100%;
  }
}
```

- [ ] **Step 3: Create `app.js` with a boot guard**

Use this complete starter file:

```js
(function () {
  "use strict";

  function init() {
    const result = document.getElementById("result-url");
    if (result) {
      result.textContent = "請貼上或透過 ?url= 帶入要裁剪的網址。";
    }
  }

  window.addEventListener("DOMContentLoaded", init);
}());
```

- [ ] **Step 4: Verify skeleton in a browser**

Open `index.html` directly in a browser.

Expected:

- The page loads without console errors.
- The manual input is visible.
- URL segments and query sections are empty.
- The preview says `請貼上或透過 ?url= 帶入要裁剪的網址。`

- [ ] **Step 5: Commit skeleton**

Run:

```bash
git add index.html styles.css app.js
git commit -m "Add static URL cutter shell"
```

---

### Task 2: Base64 Decoding And URL Validation

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Replace `app.js` with decoding and validation helpers**

Use this complete file:

```js
(function () {
  "use strict";

  const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

  const elements = {};
  let state = null;

  function normalizeBase64(input) {
    const trimmed = input.trim().replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (trimmed.length % 4)) % 4;
    return trimmed + "=".repeat(paddingLength);
  }

  function decodeBase64Url(input) {
    try {
      const binary = atob(normalizeBase64(input));
      const bytes = Uint8Array.from(binary, function (char) {
        return char.charCodeAt(0);
      });
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (error) {
      throw new Error("無法解碼網址參數，請確認 Base64 格式是否正確。");
    }
  }

  function validateHttpUrl(value) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch (error) {
      throw new Error("這不是有效的 URL，請確認包含 https:// 或 http://。");
    }

    if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
      throw new Error("目前只支援 http:// 或 https:// 網址。");
    }

    return parsed;
  }

  function getEncodedUrlParam() {
    return new URLSearchParams(window.location.search).get("url");
  }

  function showStatus(message, isError) {
    elements.sourceStatus.textContent = message || "";
    elements.sourceStatus.classList.toggle("is-error", Boolean(isError));
  }

  function setPreview(text) {
    elements.resultUrl.textContent = text;
  }

  function loadSourceUrl(sourceUrl) {
    const parsed = validateHttpUrl(sourceUrl);
    state = {
      sourceUrl: parsed.toString(),
      parsedUrl: parsed
    };
    elements.manualUrlInput.value = state.sourceUrl;
    showStatus("網址已解析。", false);
    setPreview(state.sourceUrl);
  }

  function handleManualSubmit(event) {
    event.preventDefault();
    try {
      loadSourceUrl(elements.manualUrlInput.value);
    } catch (error) {
      state = null;
      showStatus(error.message, true);
      setPreview("請修正來源網址後再試一次。");
    }
  }

  function initFromLocation() {
    const encoded = getEncodedUrlParam();
    if (!encoded) {
      showStatus("找不到要裁剪的 URL，請貼上一個 URL。", false);
      setPreview("請貼上或透過 ?url= 帶入要裁剪的網址。");
      return;
    }

    try {
      loadSourceUrl(decodeBase64Url(encoded));
    } catch (error) {
      state = null;
      showStatus(error.message, true);
      setPreview("請貼上有效的來源網址。");
    }
  }

  function init() {
    elements.manualUrlForm = document.getElementById("manual-url-form");
    elements.manualUrlInput = document.getElementById("manual-url-input");
    elements.sourceStatus = document.getElementById("source-status");
    elements.resultUrl = document.getElementById("result-url");

    elements.manualUrlForm.addEventListener("submit", handleManualSubmit);
    initFromLocation();
  }

  window.UrlCutter = {
    decodeBase64Url,
    normalizeBase64,
    validateHttpUrl
  };

  window.addEventListener("DOMContentLoaded", init);
}());
```

- [ ] **Step 2: Verify decoding manually**

Open this URL from the project directory:

```text
index.html?url=aHR0cHM6Ly9leGFtcGxlLmNvbS9wYXRoP2E9MSNi
```

Expected:

- The input contains `https://example.com/path?a=1#b`.
- The preview contains `https://example.com/path?a=1#b`.
- Source status says `網址已解析。`

- [ ] **Step 3: Verify URL-safe decoding manually**

In the browser console, run:

```js
UrlCutter.decodeBase64Url("aHR0cHM6Ly9leGFtcGxlLmNvbS8_cT3kuK3mloc")
```

Expected result:

```text
https://example.com/?q=中文
```

- [ ] **Step 4: Verify invalid states manually**

Open:

```text
index.html?url=not-base64
```

Expected: status says `無法解碼網址參數，請確認 Base64 格式是否正確。`

Then enter `ftp://example.com/file` manually and submit.

Expected: status says `目前只支援 http:// 或 https:// 網址。`

- [ ] **Step 5: Commit decoding and validation**

Run:

```bash
git add app.js
git commit -m "Add URL input decoding and validation"
```

---

### Task 3: URL State, Segments, And Query Parsing

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Replace `app.js` with parsed state helpers**

Use this complete file:

```js
(function () {
  "use strict";

  const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

  const REMOVABLE_SEGMENTS = new Set(["userInfo", "port", "path", "query", "fragment"]);

  const elements = {};
  let state = null;

  function normalizeBase64(input) {
    const trimmed = input.trim().replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (trimmed.length % 4)) % 4;
    return trimmed + "=".repeat(paddingLength);
  }

  function decodeBase64Url(input) {
    try {
      const binary = atob(normalizeBase64(input));
      const bytes = Uint8Array.from(binary, function (char) {
        return char.charCodeAt(0);
      });
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (error) {
      throw new Error("無法解碼網址參數，請確認 Base64 格式是否正確。");
    }
  }

  function validateHttpUrl(value) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch (error) {
      throw new Error("這不是有效的 URL，請確認包含 https:// 或 http://。");
    }

    if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
      throw new Error("目前只支援 http:// 或 https:// 網址。");
    }

    return parsed;
  }

  function decodeUrlPart(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  }

  function buildUserInfoDisplay(parsed) {
    if (!parsed.username && !parsed.password) {
      return "";
    }

    const username = decodeUrlPart(parsed.username);
    const password = parsed.password ? ":••••" : "";
    return username + password + "@";
  }

  function parseQueryItems(search) {
    if (!search) {
      return [];
    }

    return search.slice(1).split("&").map(function (token, index) {
      const equalsIndex = token.indexOf("=");
      const hasEquals = equalsIndex !== -1;
      const rawKey = hasEquals ? token.slice(0, equalsIndex) : token;
      const rawValue = hasEquals ? token.slice(equalsIndex + 1) : "";

      return {
        id: "query-" + index,
        rawKey,
        rawValue,
        key: decodeUrlPart(rawKey.replace(/\+/g, " ")),
        value: decodeUrlPart(rawValue.replace(/\+/g, " ")),
        hasEquals,
        removed: false
      };
    });
  }

  function createInitialState(sourceUrl) {
    const parsed = validateHttpUrl(sourceUrl);
    const normalizedSource = parsed.toString();
    const normalizedParsed = new URL(normalizedSource);

    return {
      sourceUrl: normalizedSource,
      removedSegments: {
        userInfo: false,
        port: false,
        path: false,
        query: false,
        fragment: false
      },
      queryItems: parseQueryItems(normalizedParsed.search),
      trimmedUrl: normalizedSource
    };
  }

  function getSegments(currentState) {
    const parsed = new URL(currentState.sourceUrl);
    const segments = [
      {
        id: "protocol",
        label: "Protocol",
        value: parsed.protocol,
        required: true,
        status: "必要"
      },
      {
        id: "separator",
        label: "Separator",
        value: "//",
        required: true,
        status: "必要"
      }
    ];

    const userInfo = buildUserInfoDisplay(parsed);
    if (userInfo) {
      segments.push({
        id: "userInfo",
        label: "User Info",
        value: userInfo,
        removable: true,
        status: currentState.removedSegments.userInfo ? "移除" : "保留"
      });
    }

    segments.push({
      id: "host",
      label: "Host",
      value: parsed.hostname,
      required: true,
      status: "必要"
    });

    if (parsed.port) {
      segments.push({
        id: "port",
        label: "Port",
        value: ":" + parsed.port,
        removable: true,
        status: currentState.removedSegments.port ? "移除" : "保留"
      });
    }

    if (parsed.pathname && parsed.pathname !== "/") {
      segments.push({
        id: "path",
        label: "Path",
        value: parsed.pathname,
        removable: true,
        status: currentState.removedSegments.path ? "移除" : "保留"
      });
    }

    if (parsed.search) {
      segments.push({
        id: "query",
        label: "Query String",
        value: parsed.search,
        removable: true,
        status: getQuerySegmentStatus(currentState)
      });
    }

    if (parsed.hash) {
      segments.push({
        id: "fragment",
        label: "Fragment",
        value: parsed.hash,
        removable: true,
        status: currentState.removedSegments.fragment ? "移除" : "保留"
      });
    }

    return segments;
  }

  function getQuerySegmentStatus(currentState) {
    if (currentState.removedSegments.query) {
      return "移除";
    }

    if (currentState.queryItems.some(function (item) { return item.removed; })) {
      return "部分移除";
    }

    return "保留";
  }

  function getEncodedUrlParam() {
    return new URLSearchParams(window.location.search).get("url");
  }

  function showStatus(message, isError) {
    elements.sourceStatus.textContent = message || "";
    elements.sourceStatus.classList.toggle("is-error", Boolean(isError));
  }

  function setPreview(text) {
    elements.resultUrl.textContent = text;
  }

  function loadSourceUrl(sourceUrl) {
    state = createInitialState(sourceUrl);
    elements.manualUrlInput.value = state.sourceUrl;
    showStatus("網址已解析。", false);
    setPreview(state.trimmedUrl);
  }

  function handleManualSubmit(event) {
    event.preventDefault();
    try {
      loadSourceUrl(elements.manualUrlInput.value);
    } catch (error) {
      state = null;
      showStatus(error.message, true);
      setPreview("請修正來源網址後再試一次。");
    }
  }

  function initFromLocation() {
    const encoded = getEncodedUrlParam();
    if (!encoded) {
      showStatus("找不到要裁剪的 URL，請貼上一個 URL。", false);
      setPreview("請貼上或透過 ?url= 帶入要裁剪的網址。");
      return;
    }

    try {
      loadSourceUrl(decodeBase64Url(encoded));
    } catch (error) {
      state = null;
      showStatus(error.message, true);
      setPreview("請貼上有效的來源網址。");
    }
  }

  function init() {
    elements.manualUrlForm = document.getElementById("manual-url-form");
    elements.manualUrlInput = document.getElementById("manual-url-input");
    elements.sourceStatus = document.getElementById("source-status");
    elements.resultUrl = document.getElementById("result-url");

    elements.manualUrlForm.addEventListener("submit", handleManualSubmit);
    initFromLocation();
  }

  window.UrlCutter = {
    createInitialState,
    decodeBase64Url,
    getSegments,
    normalizeBase64,
    parseQueryItems,
    validateHttpUrl,
    REMOVABLE_SEGMENTS
  };

  window.addEventListener("DOMContentLoaded", init);
}());
```

- [ ] **Step 2: Verify state helpers manually**

In the browser console, run:

```js
const state = UrlCutter.createInitialState("https://user:pass@example.com:8080/path/to/page?id=123&utm_source=x&tag=a&tag=b&debug=&preview#top");
UrlCutter.getSegments(state).map((segment) => [segment.id, segment.value, segment.status]);
state.queryItems.map((item) => [item.key, item.value, item.hasEquals]);
```

Expected segment output includes:

```js
[
  ["protocol", "https:", "必要"],
  ["separator", "//", "必要"],
  ["userInfo", "user:••••@", "保留"],
  ["host", "example.com", "必要"],
  ["port", ":8080", "保留"],
  ["path", "/path/to/page", "保留"],
  ["query", "?id=123&utm_source=x&tag=a&tag=b&debug=&preview", "保留"],
  ["fragment", "#top", "保留"]
]
```

Expected query output includes:

```js
[
  ["id", "123", true],
  ["utm_source", "x", true],
  ["tag", "a", true],
  ["tag", "b", true],
  ["debug", "", true],
  ["preview", "", false]
]
```

- [ ] **Step 3: Commit parsed state helpers**

Run:

```bash
git add app.js
git commit -m "Add URL segment parsing state"
```

---

### Task 4: Rendering And Toggle Interactions

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

- [ ] **Step 1: Replace `app.js` with rendering and toggles**

Use this complete file:

```js
(function () {
  "use strict";

  const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

  const elements = {};
  let state = null;

  function normalizeBase64(input) {
    const trimmed = input.trim().replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (trimmed.length % 4)) % 4;
    return trimmed + "=".repeat(paddingLength);
  }

  function decodeBase64Url(input) {
    try {
      const binary = atob(normalizeBase64(input));
      const bytes = Uint8Array.from(binary, function (char) {
        return char.charCodeAt(0);
      });
      return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch (error) {
      throw new Error("無法解碼網址參數，請確認 Base64 格式是否正確。");
    }
  }

  function validateHttpUrl(value) {
    let parsed;
    try {
      parsed = new URL(value);
    } catch (error) {
      throw new Error("這不是有效的 URL，請確認包含 https:// 或 http://。");
    }

    if (!SUPPORTED_PROTOCOLS.has(parsed.protocol)) {
      throw new Error("目前只支援 http:// 或 https:// 網址。");
    }

    return parsed;
  }

  function decodeUrlPart(value) {
    try {
      return decodeURIComponent(value);
    } catch (error) {
      return value;
    }
  }

  function buildUserInfoDisplay(parsed) {
    if (!parsed.username && !parsed.password) {
      return "";
    }

    const username = decodeUrlPart(parsed.username);
    const password = parsed.password ? ":••••" : "";
    return username + password + "@";
  }

  function parseQueryItems(search) {
    if (!search) {
      return [];
    }

    return search.slice(1).split("&").map(function (token, index) {
      const equalsIndex = token.indexOf("=");
      const hasEquals = equalsIndex !== -1;
      const rawKey = hasEquals ? token.slice(0, equalsIndex) : token;
      const rawValue = hasEquals ? token.slice(equalsIndex + 1) : "";

      return {
        id: "query-" + index,
        rawKey,
        rawValue,
        key: decodeUrlPart(rawKey.replace(/\+/g, " ")),
        value: decodeUrlPart(rawValue.replace(/\+/g, " ")),
        hasEquals,
        removed: false
      };
    });
  }

  function createInitialState(sourceUrl) {
    const parsed = validateHttpUrl(sourceUrl);
    const normalizedSource = parsed.toString();
    const normalizedParsed = new URL(normalizedSource);

    return {
      sourceUrl: normalizedSource,
      removedSegments: {
        userInfo: false,
        port: false,
        path: false,
        query: false,
        fragment: false
      },
      queryItems: parseQueryItems(normalizedParsed.search),
      trimmedUrl: normalizedSource
    };
  }

  function getQuerySegmentStatus(currentState) {
    if (currentState.removedSegments.query) {
      return "移除";
    }

    if (currentState.queryItems.some(function (item) { return item.removed; })) {
      return "部分移除";
    }

    return "保留";
  }

  function getSegments(currentState) {
    const parsed = new URL(currentState.sourceUrl);
    const segments = [
      {
        id: "protocol",
        label: "Protocol",
        value: parsed.protocol,
        required: true,
        status: "必要"
      },
      {
        id: "separator",
        label: "Separator",
        value: "//",
        required: true,
        status: "必要"
      }
    ];

    const userInfo = buildUserInfoDisplay(parsed);
    if (userInfo) {
      segments.push({
        id: "userInfo",
        label: "User Info",
        value: userInfo,
        removable: true,
        status: currentState.removedSegments.userInfo ? "移除" : "保留"
      });
    }

    segments.push({
      id: "host",
      label: "Host",
      value: parsed.hostname,
      required: true,
      status: "必要"
    });

    if (parsed.port) {
      segments.push({
        id: "port",
        label: "Port",
        value: ":" + parsed.port,
        removable: true,
        status: currentState.removedSegments.port ? "移除" : "保留"
      });
    }

    if (parsed.pathname && parsed.pathname !== "/") {
      segments.push({
        id: "path",
        label: "Path",
        value: parsed.pathname,
        removable: true,
        status: currentState.removedSegments.path ? "移除" : "保留"
      });
    }

    if (parsed.search) {
      segments.push({
        id: "query",
        label: "Query String",
        value: parsed.search,
        removable: true,
        status: getQuerySegmentStatus(currentState)
      });
    }

    if (parsed.hash) {
      segments.push({
        id: "fragment",
        label: "Fragment",
        value: parsed.hash,
        removable: true,
        status: currentState.removedSegments.fragment ? "移除" : "保留"
      });
    }

    return segments;
  }

  function serializeQueryItem(item) {
    return item.hasEquals ? item.rawKey + "=" + item.rawValue : item.rawKey;
  }

  function rebuildUrl(currentState) {
    const nextUrl = new URL(currentState.sourceUrl);

    if (currentState.removedSegments.userInfo) {
      nextUrl.username = "";
      nextUrl.password = "";
    }

    if (currentState.removedSegments.port) {
      nextUrl.port = "";
    }

    if (currentState.removedSegments.path) {
      nextUrl.pathname = "/";
    }

    if (currentState.removedSegments.query) {
      nextUrl.search = "";
    } else if (currentState.queryItems.some(function (item) { return item.removed; })) {
      const keptQuery = currentState.queryItems
        .filter(function (item) { return !item.removed; })
        .map(serializeQueryItem)
        .join("&");
      nextUrl.search = keptQuery ? "?" + keptQuery : "";
    }

    if (currentState.removedSegments.fragment) {
      nextUrl.hash = "";
    }

    return nextUrl.toString();
  }

  function createStatusBadge(text) {
    const badge = document.createElement("span");
    badge.className = "segment-status";
    badge.textContent = text;
    return badge;
  }

  function createSegmentContent(segment) {
    const content = document.createElement("span");
    content.className = "segment-content";

    const label = document.createElement("span");
    label.className = "segment-label";
    label.textContent = segment.label;

    const value = document.createElement("span");
    value.className = "segment-value";
    value.textContent = segment.value;

    content.append(label, value, createStatusBadge(segment.status));
    return content;
  }

  function getSegmentClassName(segment) {
    const classes = ["segment", "segment-" + segment.id];

    if (segment.required) {
      classes.push("is-required");
    }

    if (segment.status === "移除") {
      classes.push("is-removed");
    }

    if (segment.status === "部分移除") {
      classes.push("is-partial");
    }

    return classes.join(" ");
  }

  function renderSegments() {
    elements.urlSegments.replaceChildren();

    if (!state) {
      return;
    }

    getSegments(state).forEach(function (segment) {
      if (segment.removable) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = getSegmentClassName(segment);
        button.dataset.segmentId = segment.id;
        button.setAttribute("aria-pressed", String(segment.status === "移除"));
        button.append(createSegmentContent(segment));
        elements.urlSegments.append(button);
        return;
      }

      const locked = document.createElement("span");
      locked.className = getSegmentClassName(segment);
      locked.append(createSegmentContent(segment));
      elements.urlSegments.append(locked);
    });
  }

  function getQueryItemDisplay(item) {
    return item.hasEquals ? item.key + "=" + item.value : item.key;
  }

  function renderQueryItems() {
    elements.queryParameters.replaceChildren();

    if (!state || state.queryItems.length === 0) {
      elements.querySection.hidden = true;
      return;
    }

    elements.querySection.hidden = false;

    state.queryItems.forEach(function (item) {
      const button = document.createElement("button");
      const removed = state.removedSegments.query || item.removed;
      button.type = "button";
      button.className = "segment segment-queryItem" + (removed ? " is-removed" : "");
      button.dataset.queryId = item.id;
      button.disabled = state.removedSegments.query;
      button.setAttribute("aria-pressed", String(removed));

      button.append(createSegmentContent({
        id: "queryItem",
        label: "Parameter",
        value: getQueryItemDisplay(item),
        status: removed ? "移除" : "保留"
      }));

      elements.queryParameters.append(button);
    });
  }

  function render() {
    if (state) {
      state.trimmedUrl = rebuildUrl(state);
      elements.resultUrl.textContent = state.trimmedUrl;
    }

    renderSegments();
    renderQueryItems();
  }

  function toggleSegment(segmentId) {
    if (!state || !(segmentId in state.removedSegments)) {
      return;
    }

    state.removedSegments[segmentId] = !state.removedSegments[segmentId];
    render();
  }

  function toggleQueryItem(queryId) {
    if (!state || state.removedSegments.query) {
      return;
    }

    const item = state.queryItems.find(function (queryItem) {
      return queryItem.id === queryId;
    });

    if (!item) {
      return;
    }

    item.removed = !item.removed;
    render();
  }

  function handleSegmentClick(event) {
    const segmentButton = event.target.closest("[data-segment-id]");
    if (!segmentButton) {
      return;
    }

    toggleSegment(segmentButton.dataset.segmentId);
  }

  function handleQueryClick(event) {
    const queryButton = event.target.closest("[data-query-id]");
    if (!queryButton) {
      return;
    }

    toggleQueryItem(queryButton.dataset.queryId);
  }

  function getEncodedUrlParam() {
    return new URLSearchParams(window.location.search).get("url");
  }

  function showStatus(message, isError) {
    elements.sourceStatus.textContent = message || "";
    elements.sourceStatus.classList.toggle("is-error", Boolean(isError));
  }

  function showActionStatus(message, isError) {
    elements.actionStatus.textContent = message || "";
    elements.actionStatus.classList.toggle("is-error", Boolean(isError));
  }

  function setPreview(text) {
    elements.resultUrl.textContent = text;
  }

  function loadSourceUrl(sourceUrl) {
    state = createInitialState(sourceUrl);
    elements.manualUrlInput.value = state.sourceUrl;
    showStatus("網址已解析。", false);
    showActionStatus("", false);
    render();
  }

  function handleManualSubmit(event) {
    event.preventDefault();
    try {
      loadSourceUrl(elements.manualUrlInput.value);
    } catch (error) {
      state = null;
      showStatus(error.message, true);
      showActionStatus("", false);
      elements.urlSegments.replaceChildren();
      elements.queryParameters.replaceChildren();
      elements.querySection.hidden = true;
      setPreview("請修正來源網址後再試一次。");
    }
  }

  function initFromLocation() {
    const encoded = getEncodedUrlParam();
    if (!encoded) {
      showStatus("找不到要裁剪的 URL，請貼上一個 URL。", false);
      setPreview("請貼上或透過 ?url= 帶入要裁剪的網址。");
      return;
    }

    try {
      loadSourceUrl(decodeBase64Url(encoded));
    } catch (error) {
      state = null;
      showStatus(error.message, true);
      setPreview("請貼上有效的來源網址。");
    }
  }

  function init() {
    elements.manualUrlForm = document.getElementById("manual-url-form");
    elements.manualUrlInput = document.getElementById("manual-url-input");
    elements.sourceStatus = document.getElementById("source-status");
    elements.urlSegments = document.getElementById("url-segments");
    elements.querySection = document.getElementById("query-section");
    elements.queryParameters = document.getElementById("query-parameters");
    elements.actionStatus = document.getElementById("action-status");
    elements.resultUrl = document.getElementById("result-url");

    elements.manualUrlForm.addEventListener("submit", handleManualSubmit);
    elements.urlSegments.addEventListener("click", handleSegmentClick);
    elements.queryParameters.addEventListener("click", handleQueryClick);
    initFromLocation();
  }

  window.UrlCutter = {
    createInitialState,
    decodeBase64Url,
    getSegments,
    normalizeBase64,
    parseQueryItems,
    rebuildUrl,
    validateHttpUrl
  };

  window.addEventListener("DOMContentLoaded", init);
}());
```

- [ ] **Step 2: Append segment state styles to `styles.css`**

Append this CSS:

```css
.segment {
  min-height: 44px;
  max-width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #eef3f6;
  color: var(--ink);
  padding: 9px 12px;
  text-align: left;
}

button.segment:hover {
  filter: brightness(0.98);
}

button.segment:focus-visible {
  outline: 3px solid rgb(20 108 148 / 35%);
  outline-offset: 2px;
}

.segment-content {
  display: grid;
  gap: 4px;
}

.segment-label,
.segment-status {
  color: var(--muted);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 12px;
  font-weight: 700;
}

.segment-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.is-required {
  background: #eceff2;
  border-color: #d8dde2;
  color: #4d5964;
}

.segment-userInfo {
  background: #e2f4f8;
  border-color: #b7dfea;
}

.segment-port {
  background: #f2ecfb;
  border-color: #d7c6f2;
}

.segment-path {
  background: #e2f4ec;
  border-color: #acd8c4;
}

.segment-query,
.segment-queryItem {
  background: #eee9fb;
  border-color: #c9bff0;
}

.segment-queryItem {
  background: #f6f3fd;
}

.segment-fragment {
  background: #fff0d7;
  border-color: #efd09b;
}

.is-removed {
  background: #fae5e2;
  border-color: #e8b5af;
  color: #9d332d;
  opacity: .82;
}

.is-removed .segment-value {
  text-decoration: line-through;
}

.is-partial {
  border-style: dashed;
  box-shadow: inset 0 -4px 0 rgb(111 94 168 / 18%);
}

.is-error {
  color: #9d332d;
}
```

- [ ] **Step 3: Verify toggle rendering manually**

Open:

```text
index.html?url=aHR0cHM6Ly91c2VyOnBhc3NAZXhhbXBsZS5jb206ODA4MC9wYXRoL3RvL3BhZ2U_aWQ9MTIzJnV0bV9zb3VyY2U9eCZ0YWc9YSZ0YWc9YiZkZWJ1Zz0mcHJldmlldyN0b3A
```

Expected:

- User Info displays as `user:••••@`.
- Query Parameters section shows `id=123`, `utm_source=x`, `tag=a`, `tag=b`, `debug=`, and `preview`.
- Clicking `utm_source=x` changes its label to `移除`.
- Main Query String segment changes to `部分移除`.
- Clicking the main Query String segment changes all query parameter controls to removed and disabled.

- [ ] **Step 4: Commit rendering and toggles**

Run:

```bash
git add app.js styles.css
git commit -m "Render URL segments and query toggles"
```

---

### Task 5: Generate And Copy Actions

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add generate and copy handlers in `app.js`**

In the Task 4 `app.js`, add these functions after `handleQueryClick`:

```js
  function handleGenerateClick() {
    if (!state) {
      showActionStatus("請先提供有效的來源網址。", true);
      return;
    }

    state.trimmedUrl = rebuildUrl(state);
    elements.resultUrl.textContent = state.trimmedUrl;
    showActionStatus("已更新。", false);
  }

  async function handleCopyClick() {
    if (!state || !state.trimmedUrl) {
      showActionStatus("請先產生裁剪後網址。", true);
      return;
    }

    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(state.trimmedUrl);
      showActionStatus("已複製。", false);
    } catch (error) {
      showActionStatus("無法自動複製，請手動選取下方網址。", true);
    }
  }
```

Then add these element lookups in `init()` before the existing event listeners:

```js
    elements.generateButton = document.getElementById("generate-button");
    elements.copyButton = document.getElementById("copy-button");
```

Then add these event listeners in `init()`:

```js
    elements.generateButton.addEventListener("click", handleGenerateClick);
    elements.copyButton.addEventListener("click", handleCopyClick);
```

- [ ] **Step 2: Verify generate and copy manually**

Open a valid encoded URL and click a removable segment.

Expected:

- Preview updates immediately.
- Clicking `產生裁剪後網址` shows `已更新。`
- Clicking `複製裁剪後網址` shows `已複製。` on secure browser contexts where Clipboard API is available.
- If Clipboard API is unavailable from a direct file URL, the status shows `無法自動複製，請手動選取下方網址。`

- [ ] **Step 3: Commit generate and copy actions**

Run:

```bash
git add app.js
git commit -m "Add generate and copy actions"
```

---

### Task 6: Visual Polish And Mobile Fit

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Replace `styles.css` with the final stylesheet**

Use this complete file:

```css
:root {
  color-scheme: light;
  --bg: #f5f7f9;
  --panel: #ffffff;
  --ink: #17202a;
  --muted: #5e6a75;
  --line: #d8dee6;
  --action: #146c94;
  --action-dark: #263542;
  --shadow: 0 12px 30px rgb(23 32 42 / 7%);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  line-height: 1.5;
}

.app-shell {
  width: min(1100px, calc(100% - 24px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.app-header,
.panel,
.action-panel {
  margin-bottom: 16px;
}

.app-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: flex-end;
}

.panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
  box-shadow: var(--shadow);
}

.cutter-panel {
  border-color: #c9d8e2;
}

.eyebrow {
  margin: 0 0 6px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0;
  font-size: clamp(28px, 5vw, 44px);
  line-height: 1.12;
  letter-spacing: 0;
}

h2 {
  margin-bottom: 12px;
  font-size: 20px;
  line-height: 1.25;
}

.url-form label {
  display: block;
  margin-bottom: 8px;
  font-weight: 700;
}

.input-row {
  display: flex;
  gap: 10px;
}

input,
button {
  font: inherit;
}

input {
  min-width: 0;
  flex: 1;
  min-height: 44px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  background: #fff;
  color: var(--ink);
}

input:focus-visible,
button:focus-visible {
  outline: 3px solid rgb(20 108 148 / 35%);
  outline-offset: 2px;
}

button {
  min-height: 44px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
}

button:disabled {
  cursor: not-allowed;
}

.input-row button,
.primary-action {
  background: var(--action);
  color: #fff;
  padding: 10px 16px;
}

.secondary-action {
  background: var(--action-dark);
  color: #fff;
  padding: 10px 16px;
}

.status-message {
  min-height: 1.4em;
  margin: 10px 0 0;
  color: var(--muted);
}

.segment-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.segment {
  min-height: 44px;
  max-width: 100%;
  border: 1px solid transparent;
  border-radius: 8px;
  background: #eef3f6;
  color: var(--ink);
  padding: 9px 12px;
  text-align: left;
}

button.segment:hover {
  filter: brightness(0.98);
}

.segment-content {
  display: grid;
  gap: 4px;
}

.segment-label,
.segment-status {
  color: var(--muted);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 12px;
  font-weight: 700;
}

.segment-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  overflow-wrap: anywhere;
}

.is-required {
  background: #eceff2;
  border-color: #d8dde2;
  color: #4d5964;
}

.segment-userInfo {
  background: #e2f4f8;
  border-color: #b7dfea;
}

.segment-port {
  background: #f2ecfb;
  border-color: #d7c6f2;
}

.segment-path {
  background: #e2f4ec;
  border-color: #acd8c4;
}

.segment-query,
.segment-queryItem {
  background: #eee9fb;
  border-color: #c9bff0;
}

.segment-queryItem {
  background: #f6f3fd;
}

.segment-fragment {
  background: #fff0d7;
  border-color: #efd09b;
}

.is-removed {
  background: #fae5e2;
  border-color: #e8b5af;
  color: #9d332d;
  opacity: .82;
}

.is-removed .segment-value {
  text-decoration: line-through;
}

.is-partial {
  border-style: dashed;
  box-shadow: inset 0 -4px 0 rgb(111 94 168 / 18%);
}

.result-url {
  display: block;
  min-height: 54px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fbfcfd;
  padding: 14px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow-wrap: anywhere;
  user-select: text;
}

.action-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.action-panel .status-message {
  flex-basis: 100%;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  border-bottom: 1px solid var(--line);
  padding: 10px 8px;
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--muted);
  font-size: 12px;
  text-transform: uppercase;
}

code {
  border-radius: 5px;
  background: #eef1f4;
  padding: 2px 5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  overflow-wrap: anywhere;
}

.is-error {
  color: #9d332d;
}

@media (max-width: 680px) {
  .app-shell {
    width: min(100% - 20px, 1100px);
    padding-top: 18px;
  }

  .app-header {
    display: block;
  }

  .panel {
    padding: 15px;
  }

  .input-row,
  .action-panel {
    display: grid;
  }

  .input-row button,
  .primary-action,
  .secondary-action {
    width: 100%;
  }

  .segment {
    width: 100%;
  }
}
```

- [ ] **Step 2: Verify mobile layout manually**

Open browser responsive mode at 375px wide.

Expected:

- No horizontal page overflow.
- URL segment buttons are at least 44px tall.
- Action buttons span full width.
- Long URL preview wraps inside the viewport.
- Table scrolls horizontally only if needed.

- [ ] **Step 3: Commit final styling**

Run:

```bash
git add styles.css
git commit -m "Polish URL cutter mobile layout"
```

---

### Task 7: Documentation And Final Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with usage documentation**

Use this complete file:

```markdown
# url-cutter

A static browser tool for trimming URL parts such as user info, ports, paths, query parameters, and fragments.

## Usage

Open the page directly or deploy it with GitHub Pages.

To preload a target URL, pass it through the `url` query parameter after Base64 or URL-safe Base64 encoding:

```text
index.html?url=aHR0cHM6Ly9leGFtcGxlLmNvbS9wYXRoP2E9MSNi
```

The decoded target URL in this example is:

```text
https://example.com/path?a=1#b
```

If `url` is missing or invalid, paste a full `http://` or `https://` URL into the input on the page.

## Privacy

All decoding, parsing, trimming, and copying runs locally in the browser. The app has no backend, database, login, analytics, or cloud sync.

## Development

This is a build-free static site:

```text
index.html
styles.css
app.js
```

Open `index.html` in a browser to test changes.
```

- [ ] **Step 2: Run final manual verification checklist**

Use the browser and console to verify:

```js
UrlCutter.decodeBase64Url("aHR0cHM6Ly9leGFtcGxlLmNvbS9wYXRoP2E9MSNi")
UrlCutter.decodeBase64Url("aHR0cHM6Ly9leGFtcGxlLmNvbS8_cT3kuK3mloc")
UrlCutter.createInitialState("https://example.com/?tag=a&tag=b&debug=&preview")
UrlCutter.rebuildUrl(Object.assign(UrlCutter.createInitialState("https://example.com/path?a=1&b=2#top"), {
  removedSegments: { userInfo: false, port: false, path: true, query: false, fragment: true },
  queryItems: UrlCutter.createInitialState("https://example.com/path?a=1&b=2#top").queryItems.map((item) => item.key === "b" ? Object.assign({}, item, { removed: true }) : item)
}))
```

Expected:

- First decode returns `https://example.com/path?a=1#b`.
- Second decode returns `https://example.com/?q=中文`.
- State for duplicate keys contains two separate `tag` items.
- Rebuild sample returns `https://example.com/?a=1`.

Also verify in the UI:

- Missing `url` parameter shows manual input guidance.
- Invalid Base64 shows the decode error.
- Invalid URL shows the URL validation error.
- Unsupported protocol shows the protocol error.
- Removing the full Query String disables query parameter controls.
- Removing only one query parameter shows Query String as `部分移除`.
- Removing User Info clears username and password in the preview.
- Removing Port clears the explicit port in the preview.
- Removing Path changes the path to `/`.
- Removing Fragment clears the hash.
- Copy success or fallback status appears after pressing the copy button.

- [ ] **Step 3: Commit documentation**

Run:

```bash
git add README.md
git commit -m "Document URL cutter usage"
```

- [ ] **Step 4: Inspect final git status**

Run:

```bash
git status --short
```

Expected: only pre-existing untracked discussion artifacts may remain, such as `presentation.html`, `.superpowers/`, or `ui.md`.
