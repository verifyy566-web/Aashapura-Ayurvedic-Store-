/* Admin menu: on ?page=admin the header's three-lines button (☰) opens a drawer with one option per admin section.
   Only one section is shown at a time, so the dashboard stays clean. */
(function () {
  const $ = id => document.getElementById(id);
  const isRoute = new URLSearchParams(location.search).get("page") === "admin";
  const SECS = [
    { id: "overview", icon: "📊", title: "Sales Overview", sub: "Sales, payments, low stock" },
    { id: "orders", icon: "🧾", title: "Orders", sub: "Search, confirm, ship, track" },
    { id: "report", icon: "📈", title: "Sales Report", sub: "Best sellers, daily sale" },
    { id: "customers", icon: "👥", title: "Customers", sub: "Kaun kitna kharidta hai" },
    { id: "refunds", icon: "↩️", title: "Refund Requests", sub: "Approve or reject returns" },
    { id: "reviews", icon: "⭐", title: "Reviews", sub: "Approve aur jawab do" },
    { id: "alerts", icon: "🔔", title: "Stock Alerts", sub: "Customers waiting for stock" },
    { id: "add", icon: "➕", title: "Add Product", sub: "New product with photos" },
    { id: "products", icon: "📦", title: "Products", sub: "Edit or delete products" },
    { id: "look", icon: "🎨", title: "Website Look", sub: "Colours and top text" },
    { id: "banners", icon: "🖼️", title: "Home Banners", sub: "Slides on the home page" },
    { id: "cats", icon: "🔘", title: "Category Photos", sub: "Icons on the home page" },
    { id: "payment", icon: "💳", title: "Payment (UPI & QR)", sub: "Change UPI ID and QR code" },
    { id: "combos", icon: "🎁", title: "Combos", sub: "Do product ek saath sasta" },
    { id: "coupons", icon: "🏷️", title: "Coupons", sub: "Naya coupon, edit, on/off, delete" },
    { id: "log", icon: "📜", title: "Activity Log", sub: "Kisne kya badla, kab" },
    { id: "backup", icon: "💾", title: "Backup", sub: "Data download (CSV / JSON)" }
  ];
  window.aashapuraAdmin = { sections: SECS, active: () => false, badges: {}, setBadges(o) { this.badges = o || {}; document.dispatchEvent(new Event("aashapura-badges")); } };
  if (!isRoute) return;

  const KEY = "aashapura_admin_sec";
  let cur = "overview";
  try { const v = sessionStorage.getItem(KEY); if (SECS.some(s => s.id === v)) cur = v; } catch (e) {}

  const st = document.createElement("style");
  st.textContent = `
  body.adm-mode .header-actions,body.adm-mode .header nav,body.adm-mode footer,body.adm-mode .topbar{display:none!important}
  body.adm-mode .header{padding:12px 16px}
  body.adm-mode .header .menu-toggle{display:block!important;margin:0}
  body.adm-mode #adminPanel{border:0!important;border-radius:0!important;max-height:none!important;overflow:visible!important;padding:6px 14px 100px!important;margin:0 auto!important;max-width:760px!important}
  .adm-sec{display:none}.adm-sec.on{display:block}
  .adm-title{display:flex;align-items:center;gap:10px;margin:4px 0 14px;padding-bottom:12px;border-bottom:1px solid #e3eadf}
  .adm-title .ic{width:40px;height:40px;border-radius:12px;background:#e8f1e4;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}
  .adm-title b{display:block;font-size:19px;color:#173d2e;line-height:1.2}.adm-title small{display:block;color:#6a7d70;font-size:12px;margin-top:2px}
  .adm-title .adm-mn{margin-left:auto;border:1px solid #cfd9cb;background:#fff;border-radius:99px;padding:8px 13px;font:inherit;font-size:13px;color:#173d2e;cursor:pointer;flex:none}
  .adm-bar{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}.adm-sub{color:#6a7d70;font-size:13px}
  .adm-bar button,.rf-row button{border:1px solid #cfd9cb;background:#fff;border-radius:8px;padding:7px 11px;font:inherit;cursor:pointer;color:#173d2e}
  .adm-back{position:fixed;inset:0;background:rgba(10,25,18,.5);z-index:100100;opacity:0;pointer-events:none;transition:opacity .2s}
  .adm-back.open{opacity:1;pointer-events:auto}
  .adm-drawer{position:fixed;top:0;left:0;bottom:0;width:min(84vw,320px);background:#fff;z-index:100101;transform:translateX(-102%);transition:transform .25s;display:flex;flex-direction:column;box-shadow:6px 0 30px rgba(0,0,0,.18)}
  .adm-drawer.open{transform:none}
  .adm-dh{padding:20px 18px;background:linear-gradient(120deg,#14402b,#2f6b3a);color:#fff}.adm-dh b{display:block;font-size:17px}.adm-dh small{opacity:.85}
  .adm-dl{flex:1;overflow-y:auto;padding:6px 0}
  .adm-dl button{display:flex;width:100%;gap:14px;align-items:center;padding:13px 18px;border:0;background:#fff;font:inherit;text-align:left;cursor:pointer;color:#173d2e;border-left:4px solid transparent}
  .adm-dl button small{display:block;color:#7a8a80;font-size:12px}
  .adm-dl button.on{background:#eef5ea;border-left-color:#2f6b3a;font-weight:700}
  .adm-dl .sp{height:1px;background:#e8eee5;margin:6px 0}
  body.adm-mode .menu-toggle{position:relative}
  body.adm-mode .menu-toggle[data-n]::after{content:attr(data-n);position:absolute;top:-6px;right:-6px;background:#b42318;color:#fff;border-radius:99px;font-size:11px;min-width:18px;height:18px;line-height:18px;text-align:center;font-weight:700;padding:0 4px}
  .adm-badge{margin-left:auto;background:#b42318;color:#fff;border-radius:99px;font-size:11px;padding:2px 8px;font-weight:700}
  .adm-df{padding:12px 18px;border-top:1px solid #e8eee5}.adm-df button{width:100%;padding:12px;border-radius:10px;border:1px solid #c0392b;background:#fff;color:#c0392b;font-weight:700;font-size:15px;cursor:pointer}`;
  document.head.appendChild(st);
  document.body.classList.add("adm-mode");

  const back = document.createElement("div"); back.className = "adm-back";
  const dr = document.createElement("aside"); dr.className = "adm-drawer"; dr.setAttribute("aria-label", "Admin menu");
  document.body.append(back, dr);
  const shut = () => { back.classList.remove("open"); dr.classList.remove("open"); };
  back.onclick = shut;

  const box = () => $("adminProductBox");
  const loggedIn = () => { const b = box(); return !!b && b.style.display !== "none"; };
  window.aashapuraAdmin.active = loggedIn;

  function apply() {
    if (!loggedIn()) return;
    SECS.forEach(s => { const el = $("admSec-" + s.id); if (el) el.classList.toggle("on", s.id === cur); });
    const s = SECS.find(x => x.id === cur) || SECS[0];
    const t = $("admTitle");
    if (t) {
      t.innerHTML = `<span class="ic">${s.icon}</span><div><b>${s.title}</b><small>${s.sub}</small></div>`;
    }
  }
  function go(id) {
    cur = id; try { sessionStorage.setItem(KEY, id); } catch (e) {}
    apply(); shut(); window.scrollTo({ top: 0, behavior: "auto" });
    try { document.dispatchEvent(new CustomEvent("aashapura-admin-sec", { detail: id })); } catch (e) {}
  }
  window.aashapuraAdmin.go = go; window.aashapuraAdmin.cur = () => cur;

  function openDrawer() {
    if (!loggedIn()) return;
    dr.innerHTML = `<div class="adm-dh"><b>Admin Panel</b><small>Aashapura Ayurveda</small></div><div class="adm-dl"></div><div class="adm-df"><button type="button">Log out</button></div>`;
    const list = dr.querySelector(".adm-dl");
    SECS.forEach(s => {
      const b = document.createElement("button"); b.type = "button"; if (s.id === cur) b.className = "on";
      const bn = Number((window.aashapuraAdmin.badges || {})[s.id]) || 0;
      b.innerHTML = `<span style="font-size:20px">${s.icon}</span><span>${s.title}<small>${s.sub}</small></span>${bn > 0 ? `<span class="adm-badge">${bn}</span>` : ""}`;
      b.onclick = () => go(s.id); list.appendChild(b);
    });
    const sp = document.createElement("div"); sp.className = "sp"; list.appendChild(sp);
    const cs = document.createElement("button"); cs.type = "button";
    cs.innerHTML = `<span style="font-size:20px">🏬</span><span>Customer Store<small>View the shop</small></span>`;
    cs.onclick = () => { try { sessionStorage.setItem("aashapura_store_view", "1"); } catch (e) {} location.href = location.pathname; }; list.appendChild(cs);
    dr.querySelector(".adm-df button").onclick = async () => { shut(); try { if (window.adminLogout) await window.adminLogout(); } catch (e) {} try { sessionStorage.removeItem("aashapura_store_view"); } catch (e) {} location.replace(location.pathname); };
    back.classList.add("open"); dr.classList.add("open");
  }

  /* The header's three-lines button opens this menu instead of the customer links. */
  const mt = $("menuToggle");
  if (mt) mt.addEventListener("click", e => { if (!loggedIn()) return; e.stopImmediatePropagation(); e.preventDefault(); openDrawer(); }, true);

  setTimeout(() => { try { document.dispatchEvent(new CustomEvent("aashapura-admin-sec", { detail: cur })); } catch (e) {} }, 0);
  const b = box();
  if (b) {
    new MutationObserver(apply).observe(b, { attributes: true, attributeFilter: ["style"] });
    apply();
  }
})();
