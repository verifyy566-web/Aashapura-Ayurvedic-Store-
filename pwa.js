/* PWA: only registers the service worker. (v72: all "Install app" buttons / banners / hints removed on purpose.) */
(function () {
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }
})();
