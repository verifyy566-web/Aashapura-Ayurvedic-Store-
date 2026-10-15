/* v65: Customer Notification bell (header) + helper the admin uses to push the same message that goes on WhatsApp.
   Table: customer_notifications (supabase_v65_notifications.sql).
   - window.aashapuraPush(n)      -> admin side: store one notification (never throws, returns {ok,dup,error})
   - window.aashapuraTrackLink(o) -> site link that opens the order tracking page: <site>?track=<order no>
   - customer side: bell icon with unread badge, full screen list, tap opens order tracking / product.            */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) {} };
  const sb = () => supabaseClient;
  const ph10 = v => String(v || "").replace(/\D/g, "").slice(-10);

  /* ------------------------------------------------------------------ admin helper */
  window.aashapuraPush = async function (n) {
    try {
      if (!n || !n.title) return { ok: false };
      const phone = ph10(n.phone);
      if (!n.user_id && phone.length !== 10) return { ok: false, error: "no user/phone" };
      const day = new Date().toISOString().slice(0, 10);
      const who = n.user_id || phone;
      const row = {
        user_id: n.user_id || null, phone: phone.length === 10 ? phone : null,
        kind: n.kind || "info", title: String(n.title).slice(0, 140), body: String(n.body || "").slice(0, 600),
        link: n.link || null, order_id: n.order_id ? String(n.order_id) : null, product_id: n.product_id ? Number(n.product_id) : null,
        dedupe: n.key ? [n.kind || "info", n.key, who, n.daily ? day : ""].join("|") : null
      };
      const r = await sb().from("customer_notifications").insert(row);
      if (r.error) {
        if (r.error.code === "23505" || /duplicate|unique/i.test(r.error.message || "")) return { ok: true, dup: true };
        const miss = /customer_notifications|relation|schema|does not exist/i.test(r.error.message || "");
        toast(miss ? "Notification bell ke liye Supabase me supabase_v65_notifications.sql run karo." : "Notification save nahi hui: " + r.error.message, "error");
        return { ok: false, error: r.error.message };
      }
      return { ok: true };
    } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  };

  window.aashapuraTrackLink = function (o) {
    const base = location.origin + location.pathname.replace(/index\.html$/, "");
    return base + "?track=" + encodeURIComponent(String((o && (o.order_no || o.id)) || ""));
  };

  /* ------------------------------------------------------------------ customer bell */
  const BELL = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0"/></svg>`;
  const ICON = { stock: "📦", order: "🧾", track: "🚚", info: "🔔" };
  let items = [], uid = null, lastUnread = -1, loaded = false, panel = null;

  const css = document.createElement("style");
  css.textContent = `
  #notifOpen b{position:absolute;top:-6px;right:-6px;min-width:19px;height:19px;padding:0 5px;border-radius:99px;background:#e0245e;color:#fff;font-size:11px;line-height:19px;text-align:center;font-weight:700}
  #notifOpen b.zero{display:none}
  #notifOpen.ring svg{animation:nfRing .9s ease both;transform-origin:50% 10%}
  @keyframes nfRing{0%,100%{transform:rotate(0)}15%{transform:rotate(18deg)}30%{transform:rotate(-16deg)}45%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}75%{transform:rotate(4deg)}}
  .nf-ov{position:fixed;inset:0;z-index:100050;background:#f3f6f2;overflow-y:auto;color:#173d2e;-webkit-overflow-scrolling:touch}
  .nf-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border-bottom:1px solid #e1e9de}
  .nf-head button.bk{border:0;background:none;font-size:24px;cursor:pointer;color:#173d2e;padding:2px 6px}
  .nf-head b{font-size:19px;flex:1}
  .nf-head .ma{border:1px solid #cfdacb;background:#fff;border-radius:10px;padding:7px 11px;font:inherit;font-size:13px;font-weight:700;color:#14402b;cursor:pointer}
  .nf-list{padding:12px 12px 90px;max-width:640px;margin:0 auto}
  .nf-it{display:flex;gap:12px;align-items:flex-start;background:#fff;border:1px solid #e1e9de;border-radius:16px;padding:13px;margin-bottom:10px;cursor:pointer;position:relative}
  .nf-it.new{border-color:#9cc5a3;background:#f5fbf4}
  .nf-it.new:after{content:"";position:absolute;top:14px;right:13px;width:9px;height:9px;border-radius:50%;background:#e0245e}
  .nf-ic{flex:none;width:42px;height:42px;border-radius:12px;background:#e8f3e6;display:flex;align-items:center;justify-content:center;font-size:21px}
  .nf-tx{min-width:0;flex:1;padding-right:14px}
  .nf-tx b{display:block;font-size:15px;color:#14301f}
  .nf-tx p{margin:3px 0 4px;font-size:13.5px;color:#34493d;line-height:1.4;white-space:pre-line;word-break:break-word}
  .nf-tx small{color:#728579;font-size:12px}
  .nf-go{display:inline-block;margin:6px 0 0 4px;font-size:12.5px;font-weight:700;color:#14402b}
  .nf-empty{text-align:center;padding:70px 24px;color:#4d6455}
  .nf-empty div{font-size:54px;margin-bottom:8px}
  .nf-empty button{margin-top:14px;padding:12px 22px;border:0;border-radius:12px;background:#14402b;color:#fff;font:inherit;font-weight:700;cursor:pointer}`;
  document.head.appendChild(css);

  function ago(d) {
    const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
    if (s < 60) return L("just now", "अभी");
    const m = Math.round(s / 60); if (m < 60) return m + L(" min ago", " मिनट पहले");
    const h = Math.round(m / 60); if (h < 24) return h + L(" hr ago", " घंटे पहले");
    const dd = Math.round(h / 24); if (dd < 7) return dd + L(" day ago", " दिन पहले");
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  }
  const unread = () => items.filter(x => !x.read_at).length;

  function paintBadge() {
    const b = $("notifBadge"); if (!b) return;
    const n = unread(); b.textContent = n > 9 ? "9+" : n; b.classList.toggle("zero", !n);
  }

  function addBell() {
    if ($("notifOpen")) return true;
    const acts = document.querySelector(".header-actions"); if (!acts) return false;
    const b = document.createElement("button");
    b.type = "button"; b.id = "notifOpen"; b.className = "hd-ic"; b.setAttribute("aria-label", L("Notifications", "नोटिफ़िकेशन"));
    b.innerHTML = BELL + `<b class="zero" id="notifBadge">0</b>`;
    b.onclick = openPanel;
    const anchor = $("wishOpen") || $("cartOpen");
    anchor ? anchor.parentNode.insertBefore(b, anchor) : acts.appendChild(b);
    return true;
  }

  async function refresh(force) {
    let u = null; try { u = signedInUser; } catch (e) {}
    const id = u ? u.id : null;
    if (id !== uid) { uid = id; items = []; loaded = false; lastUnread = -1; }
    if (!id) { paintBadge(); if (panel) draw(); return; }
    try {
      const r = await sb().from("customer_notifications").select("*").order("created_at", { ascending: false }).limit(60);
      if (r.error) return;
      items = r.data || []; loaded = true;
      const n = unread();
      if (lastUnread >= 0 && n > lastUnread) {
        const top = items.find(x => !x.read_at);
        if (top && !panel) toast("🔔 " + top.title);
        const bt = $("notifOpen"); if (bt) { bt.classList.remove("ring"); void bt.offsetWidth; bt.classList.add("ring"); setTimeout(() => bt.classList.remove("ring"), 1000); }
      }
      lastUnread = n; paintBadge(); if (panel) draw();
    } catch (e) {}
  }

  function close() {
    if (!panel) return;
    const A = window.aashapuraAddr && window.aashapuraAddr.ov;
    const p = panel; panel = null;
    if (A) { try { A.close(p); } catch (e) { p.remove(); } } else p.remove();
  }

  async function openTarget(n) {
    close();
    const link = String(n.link || "");
    try {
      if (link.startsWith("product:")) { setTimeout(() => window.showProduct && window.showProduct(Number(link.slice(8))), 80); return; }
      if (link.startsWith("order:") || n.order_id) await trackOrder(link.startsWith("order:") ? link.slice(6) : n.order_id);
    } catch (e) {}
  }

  async function trackOrder(ref) {
    if (!ref) return;
    let u = null; try { u = signedInUser; } catch (e) {}
    if (!u) { toast(L("Please sign in to track your order.", "ऑर्डर ट्रैक करने के लिए Sign In करें।"), "error"); return; }
    let o = null;
    for (const col of ["order_no", "id"]) {
      const r = await sb().from("store_orders").select("*").eq(col, ref).eq("user_id", u.id).limit(1);
      if (r.data && r.data[0]) { o = r.data[0]; break; }
    }
    if (!o) { toast(L("Order not found in your account.", "यह ऑर्डर आपके अकाउंट में नहीं मिला।"), "error"); return; }
    if (window.openOrderTrack) window.openOrderTrack(o);
    else { const b = $("openMyOrdersBtn"); if (b) b.click(); }
  }

  function draw() {
    if (!panel) return;
    const list = panel.querySelector(".nf-list");
    let u = null; try { u = signedInUser; } catch (e) {}
    if (!u) {
      list.innerHTML = `<div class="nf-empty"><div>🔔</div><h3>${L("Sign in to see your updates", "अपडेट देखने के लिए Sign In करें")}</h3><p>${L("Order, shipping and stock updates will show here.", "ऑर्डर, शिपिंग और स्टॉक के अपडेट यहाँ दिखेंगे।")}</p><button type="button" id="nfSign">${L("Sign In", "साइन इन")}</button></div>`;
      list.querySelector("#nfSign").onclick = () => { close(); const g = $("googleLoginBtn"); if (g) g.click(); };
      return;
    }
    if (!items.length) {
      list.innerHTML = `<div class="nf-empty"><div>🔔</div><h3>${L("No notifications yet", "अभी कोई नोटिफ़िकेशन नहीं")}</h3><p>${L("When we update your order or a product is back in stock, you will see it here.", "ऑर्डर अपडेट या स्टॉक वापस आने पर यहाँ दिखेगा।")}</p></div>`;
      return;
    }
    const seen = panel._seen || new Set();
    list.innerHTML = items.map(n => `<div class="nf-it ${(!n.read_at || seen.has(n.id)) ? "new" : ""}" data-id="${n.id}">
      <div class="nf-ic">${ICON[n.kind] || "🔔"}</div>
      <div class="nf-tx"><b>${esc(n.title)}</b>${n.body ? `<p>${esc(n.body)}</p>` : ""}<small>${esc(ago(n.created_at))}</small>${n.link || n.order_id ? `<span class="nf-go"> · ${/^product:/.test(n.link || "") ? L("View product ›", "प्रोडक्ट देखें ›") : L("Track order ›", "ऑर्डर ट्रैक करें ›")}</span>` : ""}</div></div>`).join("");
    list.querySelectorAll(".nf-it").forEach(el => el.onclick = () => { const n = items.find(x => String(x.id) === el.dataset.id); if (n) openTarget(n); });
  }

  async function markAll() {
    const ids = items.filter(x => !x.read_at).map(x => x.id); if (!ids.length) return;
    panel._seen = new Set(ids);
    const now = new Date().toISOString();
    items.forEach(x => { if (!x.read_at) x.read_at = now; });
    lastUnread = 0; paintBadge();
    try { await sb().from("customer_notifications").update({ read_at: now }).in("id", ids); } catch (e) {}
  }

  async function openPanel() {
    if (panel) return;
    const el = document.createElement("div"); el.className = "nf-ov"; el.setAttribute("role", "dialog");
    el.innerHTML = `<div class="nf-head"><button type="button" class="bk" aria-label="${L("Back", "वापस")}">←</button><b>${L("Notifications", "नोटिफ़िकेशन")}</b><button type="button" class="ma">${L("Mark all read", "सब पढ़ा")}</button></div><div class="nf-list"></div>`;
    document.body.appendChild(el); panel = el; el._seen = new Set();
    const A = window.aashapuraAddr && window.aashapuraAddr.ov;
    if (A) { try { A.push(el); } catch (e) {} }
    el.querySelector(".bk").onclick = close;
    el.querySelector(".ma").onclick = () => { markAll(); draw(); };
    draw();
    await refresh(true);
    if (panel === el) { draw(); setTimeout(() => { if (panel === el) { const had = items.filter(x => !x.read_at).map(x => x.id); el._seen = new Set(had); markAll().then(() => { if (panel === el) draw(); }); } }, 900); }
  }
  window.aashapuraNotifications = { open: openPanel, refresh: () => refresh(true), unread };

  /* ------------------------------------------------------------------ deep link: ?track=<order no> */
  try {
    const q = new URLSearchParams(location.search).get("track");
    if (q) {
      localStorage.setItem("aashapura_track", JSON.stringify({ r: q, t: Date.now() }));
      const url = new URL(location.href); url.searchParams.delete("track"); history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
  } catch (e) {}
  let trackTries = 0;
  async function pendingTrack() {
    let t = null; try { t = JSON.parse(localStorage.getItem("aashapura_track") || "null"); } catch (e) {}
    if (!t || Date.now() - t.t > 3600e3) { try { localStorage.removeItem("aashapura_track"); } catch (e) {} return; }
    let u = null; try { u = signedInUser; } catch (e) {}
    if (!u) {
      if (++trackTries === 6) toast(L("Sign in to see your order tracking.", "ऑर्डर ट्रैकिंग देखने के लिए Sign In करें।"), "error");
      return;
    }
    try { localStorage.removeItem("aashapura_track"); } catch (e) {}
    trackTries = 0;
    await trackOrder(t.r);
  }

  /* ------------------------------------------------------------------ boot */
  const boot = () => { addBell(); refresh(true); };
  if (document.readyState === "complete") boot(); else window.addEventListener("load", boot);
  setTimeout(addBell, 600); setTimeout(addBell, 2000);
  const checkUser = () => { let u = null; try { u = signedInUser; } catch (e) {} if ((u ? u.id : null) !== uid) refresh(true); };
  setInterval(() => { addBell(); checkUser(); pendingTrack(); }, 3000);
  setInterval(() => refresh(true), 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(true); });
})();
