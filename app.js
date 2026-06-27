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
