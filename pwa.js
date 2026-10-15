/* PWA: registers the service worker and shows an "Install app" banner (Android/Chrome) or an Add-to-Home-Screen hint (iPhone). */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
  }
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (standalone || new URLSearchParams(location.search).get("page") === "admin") return;
  const KEY = "aashapura_install_dismissed";
  const dismissed = () => { try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < 7 * 864e5; } catch (e) { return false; } };
  const css = document.createElement("style");
  css.textContent = `.pw-bar{position:fixed;left:10px;right:10px;bottom:84px;z-index:9500;background:#14402b;color:#fff;border-radius:16px;padding:12px 14px;display:flex;align-items:center;gap:12px;box-shadow:0 8px 28px rgba(0,0,0,.3);animation:pwu .3s ease-out}
  @keyframes pwu{from{transform:translateY(30px);opacity:0}}
  .pw-bar img{width:42px;height:42px;border-radius:10px;flex:none}.pw-bar .t{flex:1;min-width:0;font-size:14px;line-height:1.35}.pw-bar .t b{display:block;font-size:15px}
  .pw-bar button{border:0;border-radius:10px;font:inherit;font-weight:700;cursor:pointer}.pw-bar .go{background:#fff;color:#14402b;padding:10px 14px}.pw-bar .x{background:none;color:#cfe3d5;font-size:20px;padding:6px}`;
  document.head.appendChild(css);
  function bar(html, onGo) {
    if (document.querySelector(".pw-bar") || dismissed()) return;
    const b = document.createElement("div"); b.className = "pw-bar";
    b.innerHTML = `<img src="icon-192.png" alt=""><div class="t">${html}</div>${onGo ? `<button type="button" class="go">${L("Install", "इंस्टॉल")}</button>` : ""}<button type="button" class="x" aria-label="Close">✕</button>`;
    document.body.appendChild(b);
    b.querySelector(".x").onclick = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} b.remove(); };
    if (onGo) b.querySelector(".go").onclick = async () => { b.remove(); await onGo(); };
  }
  let dp = null;
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault(); dp = e;
    setTimeout(() => bar(`<b>${L("Install Aashapura app", "आशापुरा ऐप इंस्टॉल करें")}</b>${L("Faster ordering from your home screen", "होम स्क्रीन से तेज़ ऑर्डर")}`, async () => { dp.prompt(); try { await dp.userChoice; } catch (e) {} dp = null; }), 8000);
  });
  window.aashapuraInstall = () => {
    if (dp) { dp.prompt(); return; }
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) alert(L("Tap the Share button in Safari, then 'Add to Home Screen'.", "Safari में Share दबाएँ, फिर 'Add to Home Screen' चुनें।"));
    else alert(L("Open the browser menu (⋮) and tap 'Install app' or 'Add to Home screen'.", "ब्राउज़र मेन्यू (⋮) में 'Install app' या 'Add to Home screen' दबाएँ।"));
  };
  const hs = document.querySelector(".m-home .m-search");
  if (hs) {
    const st = document.createElement("style");
    st.textContent = ".pw-pill{display:block;margin:10px auto 2px;padding:10px 20px;border:1px solid #d9b45a;border-radius:99px;background:linear-gradient(120deg,#0d3524,#2a6b45);color:#f4d98a;font:inherit;font-weight:700;font-size:13.5px;box-shadow:0 4px 14px rgba(13,53,36,.28);cursor:pointer}";
    document.head.appendChild(st);
    const b = document.createElement("button"); b.type = "button"; b.className = "pw-pill";
    b.textContent = "📲 " + L("Install App — Free", "ऐप इंस्टॉल करें — फ्री"); b.onclick = () => window.aashapuraInstall();
    hs.after(b); window.addEventListener("appinstalled", () => b.remove());
  }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
  if (ios) setTimeout(() => bar(`<b>${L("Add to Home Screen", "होम स्क्रीन पर जोड़ें")}</b>${L("Tap Share, then 'Add to Home Screen'", "Share दबाएँ, फिर 'Add to Home Screen'")}`, null), 8000);
})();
