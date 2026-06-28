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

test("orders required and kept segments before removed segments", function () {
  const state = UrlCutter.createInitialState("https://example.com:8080/path?utm_source=x#top");
  state.removedSegments.port = true;
  state.removedSegments.query = true;

  const segments = UrlCutter.getSegments(state);
  const firstRemovedIndex = segments.findIndex(function (segment) {
    return segment.status === "移除";
  });
  const lastKeptIndex = Math.max.apply(null, segments.map(function (segment, index) {
    return segment.status === "必要" || segment.status === "保留" ? index : -1;
  }));

  assert.ok(firstRemovedIndex > lastKeptIndex);
});
