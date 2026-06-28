const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function loadUrlCutter() {
  const context = {
    URL,
    TextDecoder,
    Uint8Array,
    atob,
    document: {
      getElementById: function () {
        return null;
      }
    },
    window: {
      location: { search: "" },
      addEventListener: function () {},
      clearTimeout: function () {},
      setTimeout: function () {}
    }
  };

  context.window.URL = URL;
  context.window.TextDecoder = TextDecoder;
  context.window.Uint8Array = Uint8Array;
  context.window.atob = atob;

  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  vm.runInContext(source, context, { filename: "app.js" });
  return context.window.UrlCutter;
}

function test(name, fn) {
  try {
    fn();
    console.log("ok - " + name);
  } catch (error) {
    console.error("not ok - " + name);
    throw error;
  }
}

const UrlCutter = loadUrlCutter();

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("combines protocol, separator, and host into one required segment", function () {
  const state = UrlCutter.createInitialState("https://example.com/path?utm_source=x");
  const segments = UrlCutter.getSegments(state);

  assert.equal(segments[0].id, "protocolHost");
  assert.equal(segments[0].label, "Protocol + Host");
  assert.equal(segments[0].value, "https://example.com");
  assert.equal(segments[0].status, "必要");
  assert.equal(segments.filter(function (segment) {
    return segment.id === "protocol" || segment.id === "separator" || segment.id === "host";
  }).length, 0);
});

test("keeps main URL segments in URL order even when segments are removed", function () {
  const state = UrlCutter.createInitialState("https://example.com:8080/path?utm_source=x#top");
  state.removedSegments.port = true;
  state.removedSegments.query = true;

  const segments = UrlCutter.getSegments(state);
  assert.deepEqual(plain(segments.map(function (segment) {
    return segment.id;
  })), ["protocolHost", "port", "path", "query", "fragment"]);
});

test("removing a main URL segment also removes later removable main segments", function () {
  const state = UrlCutter.createInitialState("https://example.com:8080/path?a=1#top");

  UrlCutter.toggleSegmentState(state, "port");

  assert.deepEqual(plain(state.removedSegments), {
    userInfo: false,
    port: true,
    path: true,
    query: true,
    fragment: true
  });
});

test("restoring a main URL segment leaves later removed segments unchanged", function () {
  const state = UrlCutter.createInitialState("https://example.com:8080/path?a=1#top");

  UrlCutter.toggleSegmentState(state, "port");
  UrlCutter.toggleSegmentState(state, "port");

  assert.deepEqual(plain(state.removedSegments), {
    userInfo: false,
    port: false,
    path: true,
    query: true,
    fragment: true
  });
});

test("removing the whole query string also removes later main segments", function () {
  const state = UrlCutter.createInitialState("https://example.com/path?a=1#top");

  UrlCutter.toggleSegmentState(state, "query");

  assert.equal(state.removedSegments.query, true);
  assert.equal(state.removedSegments.fragment, true);
});

test("rebuilds the URL without later segments after cascading main segment removal", function () {
  const state = UrlCutter.createInitialState("https://example.com:8080/path?a=1#top");

  UrlCutter.toggleSegmentState(state, "port");

  assert.equal(UrlCutter.rebuildUrl(state), "https://example.com/");
});

test("keeps query parameters in original order without cascading removals", function () {
  const state = UrlCutter.createInitialState("https://example.com/path?a=1&b=2&c=3");

  UrlCutter.toggleQueryItemState(state, "query-0");

  assert.deepEqual(plain(UrlCutter.getQueryItemsForDisplay(state).map(function (item) {
    return item.id;
  })), ["query-0", "query-1", "query-2"]);
  assert.deepEqual(plain(state.queryItems.map(function (item) {
    return item.removed;
  })), [true, false, false]);
});

test("rebuilds partial query removals without removing later query parameters", function () {
  const state = UrlCutter.createInitialState("https://example.com/path?a=1&b=2&c=3#top");

  UrlCutter.toggleQueryItemState(state, "query-0");

  assert.equal(UrlCutter.rebuildUrl(state), "https://example.com/path?b=2&c=3#top");
});

test("formats segment status inside the segment label", function () {
  assert.equal(
    UrlCutter.getSegmentTitle({ label: "Protocol + Host", status: "必要" }),
    "Protocol + Host (必要)"
  );
  assert.equal(
    UrlCutter.getSegmentTitle({ label: "Query String", status: "部分移除" }),
    "Query String (部分移除)"
  );
});

test("normalizes standard Base64 without changes", function () {
  assert.equal(UrlCutter.normalizeBase64("aGVsbG8="), "aGVsbG8=");
});

test("normalizes URL-safe Base64 with - and _", function () {
  assert.equal(UrlCutter.normalizeBase64("aGVsbG8-"), "aGVsbG8+");
  assert.equal(UrlCutter.normalizeBase64("aGVsbG8_"), "aGVsbG8/");
});

test("adds correct padding for Base64", function () {
  assert.equal(UrlCutter.normalizeBase64("aGVsbG8"), "aGVsbG8=");
  assert.equal(UrlCutter.normalizeBase64("aGVsbA"), "aGVsbA==");
});

test("decodes valid Base64 URL", function () {
  const decoded = UrlCutter.decodeBase64Url("aHR0cHM6Ly9leGFtcGxlLmNvbS8=");
  assert.equal(decoded, "https://example.com/");
});

test("throws on invalid Base64", function () {
  assert.throws(function () {
    UrlCutter.decodeBase64Url("!!!invalid!!!");
  });
});

test("decodes non-HTTP URL without throwing (validation happens later)", function () {
  const decoded = UrlCutter.decodeBase64Url("ZnRwOi8vZmlsZS50eHQ=");
  assert.equal(decoded, "ftp://file.txt");
});

test("accepts valid https URL", function () {
  const parsed = UrlCutter.validateHttpUrl("https://example.com/path?a=1#top");
  assert.equal(parsed.protocol, "https:");
  assert.equal(parsed.hostname, "example.com");
});

test("accepts valid http URL", function () {
  const parsed = UrlCutter.validateHttpUrl("http://localhost:8080/path");
  assert.equal(parsed.protocol, "http:");
  assert.equal(parsed.port, "8080");
});

test("rejects invalid URL format", function () {
  assert.throws(function () {
    UrlCutter.validateHttpUrl("not-a-url");
  });
});

test("rejects unsupported protocol", function () {
  assert.throws(function () {
    UrlCutter.validateHttpUrl("ftp://example.com");
  });
});

test("parses multiple query parameters", function () {
  const items = UrlCutter.parseQueryItems("?a=1&b=2&c=3");
  assert.equal(items.length, 3);
  assert.equal(items[0].key, "a");
  assert.equal(items[0].value, "1");
  assert.equal(items[1].key, "b");
  assert.equal(items[1].value, "2");
  assert.equal(items[2].key, "c");
  assert.equal(items[2].value, "3");
});

test("decodes URL-encoded parameters via createInitialState", function () {
  const state = UrlCutter.createInitialState("https://example.com?name=%E5%BC%A0%E4%B8%89");
  assert.equal(state.queryItems[0].value, "张三");
});

test("handles empty value parameters", function () {
  const items = UrlCutter.parseQueryItems("?key=");
  assert.equal(items.length, 1);
  assert.equal(items[0].key, "key");
  assert.equal(items[0].value, "");
  assert.equal(items[0].hasEquals, true);
});

test("handles flag parameters without value", function () {
  const items = UrlCutter.parseQueryItems("?flag&active&debug");
  assert.equal(items.length, 3);
  assert.equal(items[0].key, "flag");
  assert.equal(items[0].value, "");
  assert.equal(items[0].hasEquals, false);
});

test("full flow: encode URL to Base64, decode, remove path, rebuild", function () {
  const originalUrl = "https://example.com:8080/path/to/page?a=1#section";
  const encoded = btoa(originalUrl);
  const decoded = UrlCutter.decodeBase64Url(encoded);

  const state = UrlCutter.createInitialState(decoded);
  UrlCutter.toggleSegmentState(state, "path");

  const result = UrlCutter.rebuildUrl(state);
  assert.equal(result, "https://example.com:8080/");
});

test("full flow: remove userInfo and query, rebuild", function () {
  const originalUrl = "https://user:pass@example.com/path?a=1&b=2#top";
  const encoded = btoa(originalUrl);
  const decoded = UrlCutter.decodeBase64Url(encoded);

  const state = UrlCutter.createInitialState(decoded);
  UrlCutter.toggleSegmentState(state, "userInfo");
  UrlCutter.toggleSegmentState(state, "query");

  const result = UrlCutter.rebuildUrl(state);
  assert.equal(result, "https://example.com/?a=1&b=2");
});

test("full flow: toggle individual query params, rebuild", function () {
  const originalUrl = "https://example.com?keep=1&remove=2&keep=3";
  const encoded = btoa(originalUrl);
  const decoded = UrlCutter.decodeBase64Url(encoded);

  const state = UrlCutter.createInitialState(decoded);
  UrlCutter.toggleQueryItemState(state, "query-1");

  const result = UrlCutter.rebuildUrl(state);
  assert.equal(result, "https://example.com/?keep=1&keep=3");
});

test("full flow: cascade removal from port, rebuild", function () {
  const originalUrl = "https://example.com:443/path?query=value#fragment";
  const encoded = btoa(originalUrl);
  const decoded = UrlCutter.decodeBase64Url(encoded);

  const state = UrlCutter.createInitialState(decoded);
  UrlCutter.toggleSegmentState(state, "port");

  const result = UrlCutter.rebuildUrl(state);
  assert.equal(result, "https://example.com/");
});

test("full flow: URL-safe Base64 roundtrip", function () {
  const originalUrl = "https://example.com/path?key=value";
  const urlSafe = originalUrl.replace(/\+/g, "-").replace(/\//g, "_");
  const encoded = btoa(originalUrl).replace(/\+/g, "-").replace(/\//g, "_");

  const decoded = UrlCutter.decodeBase64Url(encoded);
  assert.equal(decoded, originalUrl);

  const state = UrlCutter.createInitialState(decoded);
  const segments = UrlCutter.getSegments(state);

  assert.equal(segments[0].value, "https://example.com");
});
