/* Admin new-order alerts: red badge on ☰ and on Orders/Refund menu items, banner on top, toast + vibrate when a new order arrives (checks every 45 s while the admin page is open). No SQL. */
(function () {
  if (new URLSearchParams(location.search).get("page") !== "admin") return;
  const $ = id => document.getElementById(id);
  const lc = v => String(v || "").toLowerCase();
  const SEEN = "aashapura_orders_seen";
  const rd = () => { try { return Number(localStorage.getItem(SEEN)) || 0; } catch (e) { return 0; } };
  const wr = () => { try { localStorage.setItem(SEEN, String(Date.now())); } catch (e) {} };
  if (!rd()) wr();   // first ever visit: old orders are not "new"
  window.aashapuraAdminSeenAt = rd();   // orders newer than this get a NEW chip this session
  let known = null, cur = "overview", need = { orders: 0, refunds: 0, shots: 0, fresh: 0 };

  const css = document.createElement("style");
  css.textContent = `.adm-alert{display:flex;align-items:center;gap:10px;margin:0 0 12px;padding:11px 13px;border-radius:12px;background:#fff1ef;border:1px solid #f3c6c0;color:#7a1d12;font-size:14px;line-height:1.4;cursor:pointer}
  .adm-alert b{color:#b42318}.adm-alert .go{margin-left:auto;font-weight:700;white-space:nowrap}`;
  document.head.appendChild(css);

  function paint() {
    const A = window.aashapuraAdmin; if (!A || !A.setBadges) return;
    A.setBadges({ orders: need.orders, refunds: need.refunds });
    const t = need.orders + need.refunds, mt = $("menuToggle");
    if (mt) { if (t > 0) mt.setAttribute("data-n", t > 99 ? "99+" : String(t)); else mt.removeAttribute("data-n"); }
    let el = $("admAlert");
    const lines = [];
    if (need.fresh) lines.push(`<b>${need.fresh}</b> naya order`);
    if (need.shots) lines.push(`<b>${need.shots}</b> payment screenshot check karna hai`);
    if (need.refunds) lines.push(`<b>${need.refunds}</b> refund/return request`);
    if (!lines.length || cur === "orders") { if (el) el.remove(); return; }
    if (!el) { el = document.createElement("div"); el.id = "admAlert"; el.className = "adm-alert"; const tt = $("admTitle"); if (tt) tt.insertAdjacentElement("afterend", el); else return; }
    el.innerHTML = `<span style="font-size:20px">🔔</span><span>${lines.join(" · ")}</span><span class="go">Dekho ›</span>`;
    el.onclick = () => { if (need.orders || !need.refunds) A.go("orders"); else A.go("refunds"); };
  }

  async function check() {
    const A = window.aashapuraAdmin; if (!A || !A.active || !A.active()) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    const r = await supabaseClient.from("store_orders").select("id,order_no,created_at,order_status,payment_status,utr,customer_name,total").order("created_at", { ascending: false }).limit(200);
    if (r.error) return;
    const rows = r.data || [], seen = rd();
    const live = rows.filter(o => lc(o.order_status) !== "cancelled");
    const shots = live.filter(o => o.utr && lc(o.payment_status) !== "paid");
    const fresh = live.filter(o => new Date(o.created_at).getTime() > seen);
    const ids = new Set([...shots, ...fresh].map(o => o.id));
    need.orders = ids.size; need.shots = shots.length; need.fresh = fresh.length;
    try {
      const f = await supabaseClient.from("store_refunds").select("id", { count: "exact", head: true }).eq("status", "requested");
      need.refunds = f.error ? 0 : (f.count || 0);
    } catch (e) { need.refunds = 0; }
    if (known) {
      const nu = rows.filter(o => !known.has(o.id) && lc(o.order_status) !== "cancelled");
      if (nu.length) {
        const o = nu[0];
        try { showStoreToast(`🔔 Naya order ${o.order_no || ""} · ₹${Number(o.total || 0)}${nu.length > 1 ? " (+" + (nu.length - 1) + " aur)" : ""}`, "success"); } catch (e) {}
        try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
      }
    }
    known = new Set(rows.map(o => o.id));
    paint();
  }

  document.addEventListener("aashapura-admin-sec", e => {
    cur = e.detail;
    if (cur === "orders") { wr(); need.fresh = 0; need.orders = need.shots; }
    paint();
  });
  document.addEventListener("aashapura-badges", () => {});
  setTimeout(check, 2500);
  setInterval(() => { if (!document.hidden) check(); }, 45000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
})();
