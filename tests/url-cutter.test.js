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
