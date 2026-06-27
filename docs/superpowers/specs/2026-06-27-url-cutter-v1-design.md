# URL Cutter V1 Design

## Goal

Build a static, GitHub Pages-compatible URL trimming tool. The page accepts a Base64 or URL-safe Base64 encoded target URL through `?url=`, parses the URL in the browser, lets the user remove selected URL parts with mobile-friendly controls, and produces a trimmed URL that can be copied.

All processing happens locally in the browser. The app has no backend, database, analytics, login, history, or cloud sync in V1.

## User Flow

1. User opens `index.html` with `?url=<encoded-target-url>`.
2. App decodes the parameter as UTF-8-safe Base64 or URL-safe Base64.
3. App validates that the decoded value is an `http:` or `https:` URL.
4. App renders URL segments at the top of the page.
5. User taps removable segments or individual query parameters.
6. Trimmed URL preview updates immediately after each change.
7. User may press "產生裁剪後網址" to explicitly refresh the preview and see a short "已更新" state.
8. User presses "複製裁剪後網址" to copy the preview.

If `?url=` is missing or invalid, the page shows a manual URL input so the user can paste a URL directly.

## Page Structure

The V1 screen order is:

1. URL segmented controls
2. Query parameter controls, only when query parameters exist
3. Generate result button
4. Copy result button
5. Trimmed URL preview
6. URL segment explanation table

The first viewport must prioritize the segmented controls so mobile users can start trimming immediately.

## URL Segments

Render the target URL as separate visual segments:

| Segment | Removable | Display |
| --- | --- | --- |
| Protocol | No | `https:` |
| Separator | No | `//` |
| User Info | Yes | `user:pass@` |
| Host | No | `example.com` |
| Port | Yes | `:8080` |
| Path | Yes | `/path/to/page` |
| Query String | Yes | `?a=1&utm=x` |
| Fragment | Yes | `#section` |

Protocol, separator, and host are required. They should be visibly marked as "必要" and not use a clickable control.

Removable segments use `button` elements. Each button toggles between "保留" and "移除". Removed segment buttons use `aria-pressed="true"`.

Password display in User Info is masked, for example `user:••••@`, but the original password is preserved when rebuilding the URL unless User Info is removed.

## Query Parameter Behavior

When a query string exists, render the full Query String segment in the main URL segmented controls and render each query parameter separately below it.

Rules:

- Clicking the Query String segment removes or restores all query parameters.
- Clicking an individual query parameter removes or restores only that occurrence.
- Duplicate keys are separate controls, so `tag=a&tag=b` becomes two removable items.
- Empty values are displayed, for example `debug=`.
- Parameters without `=` are displayed, for example `preview`.
- If the whole Query String is removed, all query parameter controls appear removed and are disabled until the full Query String is restored.
- If only some query parameters are removed, the Query String segment remains kept but shows "部分移除".

Query parameter controls use a related but visually lighter style than the full Query String segment.

## State Model

The app keeps state in browser memory only:

- `sourceUrl`: original decoded or manually entered URL string.
- `parsedUrl`: parsed `URL` instance or equivalent derived data.
- `removedSegments`: removal flags for user info, port, path, query string, and fragment.
- `queryItems`: ordered query parameter entries, including key, value, whether the original token had `=`, and removal state.
- `trimmedUrl`: current rebuilt URL preview.
- `statusMessage`: transient UI feedback for generate and copy actions.

No V1 state is written to `localStorage`, cookies, or any remote service.

## URL Rebuild Rules

Use the browser `URL` API rather than ad hoc string replacement.

Rebuild from a fresh `URL(sourceUrl)` each time:

1. If User Info is removed, clear `username` and `password`.
2. If Port is removed, clear `port`.
3. If Path is removed, set `pathname = "/"`.
4. If Query String is removed, clear `search`.
5. If only some query parameters are removed, rebuild `search` from the kept ordered query entries.
6. If Fragment is removed, clear `hash`.
7. Output `url.toString()`.

For query parameters without `=`, preserve the no-equals form while rebuilding partial query strings. For empty values with `=`, preserve the equals sign.

## Error Handling

Display user-readable inline errors for:

- Missing `url` parameter: show manual URL input.
- Base64 decode failure.
- Decoded value is not a valid absolute URL.
- URL protocol is not `http:` or `https:`.
- Clipboard API is unavailable or fails.

Clipboard failures should not block the flow. The preview remains selectable, and the app shows: "無法自動複製，請手動選取下方網址".

## Accessibility And Mobile Requirements

- Removable controls are real `button` elements.
- Required segments are visibly marked and not presented as toggle buttons.
- State is expressed with text labels, not color alone.
- Removable buttons expose `aria-pressed`.
- Tap targets are at least 44px tall.
- URL and query text wraps without overflowing the viewport.
- The trimmed URL preview uses a monospace font and selectable text.
- Mobile action buttons may span the full width.

## Files

V1 uses a build-free static structure:

```text
/
├── index.html
├── styles.css
├── app.js
├── README.md
├── plan.md
└── ui.md
```

`index.html` owns semantic structure, `styles.css` owns responsive presentation, and `app.js` owns decoding, parsing, state, rendering, rebuilding, and clipboard behavior.

## Verification

Manual verification must cover:

- Standard Base64 input.
- URL-safe Base64 input.
- UTF-8 URLs with non-ASCII characters.
- Missing `url` parameter with manual input fallback.
- Invalid Base64.
- Invalid URL.
- Unsupported protocol.
- Duplicate query keys.
- Empty query values.
- Query parameters without equals signs.
- Removing all query parameters through the Query String segment.
- Removing only some query parameters.
- Removing user info, port, path, and fragment.
- Clipboard success and failure fallback where possible.

Because V1 has no build system or test runner, implementation should keep logic functions small enough to inspect and exercise manually in the browser console if needed.

## Out Of Scope

V1 does not include:

- Automatic tracking parameter detection.
- Advanced settings.
- History.
- Batch URL trimming.
- Login.
- Cloud sync.
- Analytics.
