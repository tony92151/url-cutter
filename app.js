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

  function getEncodedUrlParam() {
    const query = window.location.search.replace(/^\?/, "");
    const params = query ? query.split("&") : [];

    for (const param of params) {
      const separatorIndex = param.indexOf("=");
      const rawKey = separatorIndex === -1 ? param : param.slice(0, separatorIndex);
      const rawValue = separatorIndex === -1 ? "" : param.slice(separatorIndex + 1);

      if (decodeUrlPart(rawKey) === "url") {
        return decodeUrlPart(rawValue);
      }
    }

    return null;
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
