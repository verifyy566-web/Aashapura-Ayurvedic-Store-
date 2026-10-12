/* v14: pincode on cart/product, expected delivery (Maharashtra 4-5 days, others 6-7), order status dates, live location helpers */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const loc = () => (window.AASHAPURA_LANG === "hi" ? "hi-IN" : "en-IN");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KEY = "aashapura_pin";
  const getPin = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  window.aashapuraSavePin = (pin, r) => { try { localStorage.setItem(KEY, JSON.stringify({ pin, area: r.area || "", state: r.state || "" })); } catch (e) {} };

  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fd = d => d.toLocaleDateString(loc(), { weekday: "short", day: "numeric", month: "short" });
  const dt = t => (t ? new Date(t).toLocaleString(loc(), { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");

  /* Maharashtra = 4-5 days, baaki India = 6-7 days (yahin se badlo) */
  window.aashapuraEta = (state, from) => {
    const mh = /maharashtra/i.test(String(state || "")), a = mh ? 4 : 6, b = mh ? 5 : 7, base = from ? new Date(from) : new Date();
    const lo = addDays(base, a), hi = addDays(base, b);
    return { min: lo, max: hi, mh, text: `${fd(lo)} – ${fd(hi)} (${a}–${b} ${L("days", "दिन")})` };
  };
  window.aashapuraEtaFor = od => {
    if (od.exp_min && od.exp_max) return `${fd(new Date(od.exp_min))} – ${fd(new Date(od.exp_max))}`;
    const st = od.delivery_state || String(od.delivery_area || "").split(",").pop();
    return window.aashapuraEta(st, od.created_at).text;
  };

  /* extra block inside "My Orders" card: delivered message, location, expected date, status history with date+time */
  window.aashapuraOrderExtra = (od, ev) => {
    const os = String(od.order_status || "pending").toLowerCase();
    if (os === "cancelled") return "";
    const hist = [["Placed", "ऑर्डर हुआ", od.created_at], ["Confirmed", "कन्फर्म", od.confirmed_at], ["Shipped", "शिप", od.shipped_at], ["Delivered", "डिलीवर", od.delivered_at]].filter(x => x[2]);
    let top = "";
    if (os === "delivered") top += `<div class="dl-ok">✅ ${L("Order delivered successfully", "ऑर्डर सफलतापूर्वक डिलीवर हुआ")}${od.delivered_at ? " · " + esc(dt(od.delivered_at)) : ""}</div>`;
    else {
      if (os === "shipped" && ev) top += `<div class="dl-loc">📍 ${L("Currently at", "अभी यहाँ है")}: <b>${esc(ev.message)}</b><small> ${esc(dt(ev.created_at))}</small></div>`;
      top += `<div class="dl-eta">📦 ${L("Expected delivery", "अनुमानित डिलीवरी")}: <b>${esc(window.aashapuraEtaFor(od))}</b></div>`;
      if (od.courier || od.tracking_id) top += `<div class="dl-eta">🚚 ${esc(od.courier || "")} ${od.tracking_id ? "· " + L("Tracking ID", "ट्रैकिंग आईडी") + ": <b>" + esc(od.tracking_id) + "</b>" : ""}</div>`;
      if (os === "shipped") top += `<small class="dl-nc">${L("Shipped — this order can no longer be cancelled. You can return it after delivery.", "शिप हो चुका है — अब ऑर्डर रद्द नहीं हो सकता। डिलीवरी के बाद रिटर्न कर सकते हैं।")}</small>`;
    }
    return top + `<div class="dl-hist">${hist.map(([en, hi, t]) => `<span><b>${L(en, hi)}</b> ${esc(dt(t))}</span>`).join("")}</div>`;
  };

  /* pincode card (cart page + product page) */
  function pinCard() {
    const sv = getPin(), d = document.createElement("div");
    d.className = "ct-card dl-pin";
    d.innerHTML = `<b>📍 ${L("Delivery pincode", "डिलीवरी पिनकोड")}</b><div class="dl-row"><input inputmode="numeric" maxlength="6" placeholder="${L("Enter 6-digit pincode", "6 अंकों का पिनकोड")}" value="${sv ? esc(sv.pin) : ""}"><button type="button">${L("Check", "जाँचें")}</button></div><p class="dl-msg"></p>`;
    const inp = d.querySelector("input"), msg = d.querySelector(".dl-msg");
    const ok = (area, state) => { msg.className = "dl-msg ok"; msg.innerHTML = `${area ? "✅ " + esc(area) + "<br>" : ""}📦 <b>${L("Expected delivery", "अनुमानित डिलीवरी")}:</b> ${esc(window.aashapuraEta(state).text)}`; };
    const run = async () => {
      const pin = inp.value.trim();
      if (!/^[1-9][0-9]{5}$/.test(pin)) { msg.className = "dl-msg bad"; msg.textContent = L("Enter a valid 6-digit pincode", "6 अंकों का सही पिनकोड भरें"); return; }
      msg.className = "dl-msg"; msg.textContent = L("Checking…", "जाँच हो रही है…");
      const r = window.aashapuraPinLookup ? await window.aashapuraPinLookup(pin) : { ok: true };
      if (inp.value.trim() !== pin) return;
      if (!r.ok) { msg.className = "dl-msg bad"; msg.textContent = "❌ " + (r.msg || ""); return; }
      window.aashapuraSavePin(pin, r); ok(r.area, r.state);
    };
    d.querySelector("button").onclick = run;
    inp.oninput = () => { inp.value = inp.value.replace(/\D/g, "").slice(0, 6); if (inp.value.length === 6) run(); };
    if (sv && sv.pin) ok(sv.area, sv.state);
    return d;
  }
  let queued = false;
  const inject = () => {
    queued = false;
    const cp = document.getElementById("cartFullPage");
    if (cp && !cp.querySelector(".dl-pin")) { const a = cp.querySelector(".ct-pd") || cp.querySelector(".ct-trust"); if (a) a.before(pinCard()); }
    const pp = document.getElementById("productFullPage");
    if (pp && !pp.querySelector(".dl-pin")) { const a = pp.querySelector(".pp-trust"); if (a) a.before(pinCard()); }
  };
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(inject); } }).observe(document.body, { childList: true, subtree: true });

  const css = document.createElement("style");
  css.textContent = `.dl-pin{background:#fff;border:1px solid #e3e8e1;border-radius:14px;padding:12px 14px;margin:12px 0}.dl-row{display:flex;gap:8px;margin-top:8px}.dl-row input{flex:1;padding:10px;border:1px solid #cfd6cc;border-radius:10px;font:inherit}.dl-row button{border:0;border-radius:10px;background:#123c2b;color:#fff;padding:0 16px;font:inherit;cursor:pointer}.dl-msg{margin:8px 0 0;font-size:14px;line-height:1.5}.dl-msg.ok{color:#166534}.dl-msg.bad{color:#b42318}
.dl-ok{background:#dcfce7;color:#166534;border-radius:10px;padding:8px 10px;margin:8px 0;font-weight:600}.dl-loc{background:#e0ecff;color:#1d4ed8;border-radius:10px;padding:8px 10px;margin:8px 0}.dl-eta{margin:6px 0;font-size:14px}.dl-nc{display:block;color:#68736c;margin:4px 0}.dl-hist{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12px;color:#555;margin:6px 0}.dl-head{display:grid;gap:8px}
.tl-pl{display:block;font-size:15px;color:#222;margin:2px 0}
.ad-trk{border:1px dashed #1d4ed8;border-radius:10px;padding:10px;margin:10px 0;display:grid;gap:8px}.ad-trk-r{display:flex;gap:6px;flex-wrap:wrap}.ad-trk-r input{flex:1;min-width:130px;padding:8px;border:1px solid #ccc;border-radius:8px}.ad-trk button{padding:7px 10px;border-radius:8px;border:1px solid #1d4ed8;background:#fff;color:#1d4ed8;cursor:pointer}.ad-trk-q{display:flex;flex-wrap:wrap;gap:6px}.tk-list div{padding:4px 0;border-bottom:1px solid #eee}`;
  document.head.appendChild(css);
})();
