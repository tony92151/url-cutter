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
