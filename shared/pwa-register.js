/* PWA — service worker registration (public + center platforms) */
(function () {
  "use strict";

  if (!("serviceWorker" in navigator)) return;

  var script = document.currentScript;
  var swUrl = (script && script.getAttribute("data-sw")) || "sw.js";

  var refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });

  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register(swUrl, { scope: "./" })
      .then(function (registration) {
        registration.addEventListener("updatefound", function () {
          var worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", function () {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              if (window.toast) {
                window.toast("Доступна новая версия. Обновляем…", { type: "info" });
              }
              worker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch(function () {});
  });
})();
