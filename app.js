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
