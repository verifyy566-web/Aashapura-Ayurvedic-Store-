/* Admin > Sales Report: totals for a period, daily sales bars, best / slow sellers, coupon usage. Built from orders already in the database. No SQL. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lc = v => String(v || "").toLowerCase();
  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const IST = 5.5 * 3600e3;
  const dayKey = d => new Date(new Date(d).getTime() + IST).toISOString().slice(0, 10);
  const PER = [["today", "Aaj"], ["7", "7 din"], ["30", "30 din"], ["month", "Is mahine"], ["all", "Sab"]];
  let done = false, ORD = [], REF = [], PRODS = [], per = "7";

  const css = document.createElement("style");
  css.textContent = `.rp-ch{display:flex;gap:6px;overflow-x:auto;margin-bottom:12px}.rp-ch button{white-space:nowrap;border:1px solid #cfd9cb;background:#fff;border-radius:99px;padding:8px 14px;font:inherit;font-size:13px;color:#173d2e;cursor:pointer}.rp-ch button.on{background:#14402b;color:#fff;border-color:#14402b}
  .rp-k{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}.rp-k div{background:#f6f9f4;border:1px solid #dfe8da;border-radius:12px;padding:10px 12px}.rp-k small{display:block;color:#5d7266;font-size:12px}.rp-k b{font-size:19px;color:#14402b}
  .rp-k div.big{grid-column:1/-1;background:#14402b;border-color:#14402b}.rp-k div.big small{color:#bcd6c3}.rp-k div.big b{color:#fff;font-size:26px}
  .rp-s{background:#fff;border:1px solid #dfe8dc;border-radius:14px;padding:13px;margin-bottom:12px}.rp-s h4{margin:0 0 10px;color:#173d2e;font-size:15px}
  .rp-bars{display:flex;align-items:flex-end;gap:3px;height:110px;margin-top:4px}.rp-bars i{flex:1;background:#2f6b3a;border-radius:3px 3px 0 0;min-height:2px;position:relative}.rp-bars i.z{background:#dfe8dc}
  .rp-ax{display:flex;justify-content:space-between;font-size:11px;color:#6a7d70;margin-top:4px}
  .rp-r{margin:8px 0}.rp-r .t{display:flex;justify-content:space-between;gap:8px;font-size:14px;color:#173d2e}.rp-r .t span:first-child{overflow:hidden;text-overflow:ellipsis}.rp-r .t b{white-space:nowrap}
  .rp-r .bar{height:7px;background:#e8f0e4;border-radius:99px;margin-top:4px;overflow:hidden}.rp-r .bar i{display:block;height:100%;background:#2f6b3a;border-radius:99px}
  .rp-r small{color:#6a7d70;font-size:12px}
  .rp-none{color:#6a7d70;font-size:14px;padding:6px 0}.rp-slow{font-size:14px;line-height:1.7;color:#4b5d52}`;
  document.head.appendChild(css);

  function range() {
    const now = Date.now(), t0 = dayKey(now);
    if (per === "today") return d => dayKey(d) === t0;
    if (per === "month") return d => dayKey(d).slice(0, 7) === t0.slice(0, 7);
    if (per === "all") return () => true;
    const n = Number(per), from = dayKey(now - (n - 1) * 86400e3);
    return d => dayKey(d) >= from;
  }

  async function load() {
    const host = $("apReport"); if (!host) return;
    host.innerHTML = `<div class="rp-none">Load ho raha hai…</div>`;
    const [o, r, p] = await Promise.all([
      supabaseClient.from("store_orders").select("id,created_at,items,subtotal,discount,coupon_code,delivery_charge,total,payment_status,order_status").order("created_at", { ascending: false }).limit(3000),
      supabaseClient.from("store_refunds").select("order_id,status,amount,created_at").limit(2000),
      supabaseClient.from("products").select("id,name,weight,stock")
    ]);
    if (o.error) { host.innerHTML = `<div class="rp-none" style="color:#b42318">Orders load nahi hue: ${esc(o.error.message)}</div>`; return; }
    ORD = o.data || []; REF = r.error ? [] : (r.data || []); PRODS = p.data || [];
    paint();
  }

  function paint() {
    const host = $("apReport"); if (!host) return;
    const inR = range();
    const mine = ORD.filter(o => inR(o.created_at));
    const sold = mine.filter(o => lc(o.payment_status) === "paid" && lc(o.order_status) !== "cancelled");
    const canc = mine.filter(o => lc(o.order_status) === "cancelled");
    const wait = mine.filter(o => lc(o.payment_status) !== "paid" && lc(o.order_status) !== "cancelled");
    const sum = (a, f) => a.reduce((s, o) => s + Number(f(o) || 0), 0);
    const sales = sum(sold, o => o.total), disc = sum(sold, o => o.discount), del = sum(sold, o => o.delivery_charge);
    const ids = new Set(mine.map(o => String(o.id)));
    const refd = REF.filter(x => x.status === "refunded" && ids.has(String(x.order_id)));
    const refAmt = sum(refd, x => x.amount);

    // daily bars (last 30 days max)
    const nd = per === "today" ? 1 : per === "7" ? 7 : 30, days = [];
    for (let i = nd - 1; i >= 0; i--) days.push(dayKey(Date.now() - i * 86400e3));
    const byDay = {}; sold.forEach(o => { const k = dayKey(o.created_at); byDay[k] = (byDay[k] || 0) + Number(o.total || 0); });
    const mx = Math.max(1, ...days.map(d => byDay[d] || 0));
    const bars = nd > 1 ? `<div class="rp-s"><h4>Din ke hisaab se sale</h4><div class="rp-bars">${days.map(d => `<i class="${byDay[d] ? "" : "z"}" style="height:${Math.max(2, Math.round((byDay[d] || 0) / mx * 100))}%" title="${d}: ${money(byDay[d] || 0)}"></i>`).join("")}</div><div class="rp-ax"><span>${days[0].slice(5)}</span><span>Sabse zyada ${money(mx === 1 && !Object.keys(byDay).length ? 0 : mx)}</span><span>${days[days.length - 1].slice(5)}</span></div></div>` : "";

    // products
    const pm = {};
    sold.forEach(o => (Array.isArray(o.items) ? o.items : []).forEach(i => {
      const k = String(i.name || "Product") + (i.weight ? " (" + i.weight + ")" : ""), q = Number(i.qty || i.quantity || 1);
      const x = pm[k] || (pm[k] = { name: k, qty: 0, amt: 0 }); x.qty += q; x.amt += Number(i.price || 0) * q;
    }));
    const top = Object.values(pm).sort((a, b) => b.amt - a.amt).slice(0, 10), tmx = top.length ? top[0].amt : 1;
    const soldNames = new Set(Object.values(pm).map(x => x.name.replace(/ \(.*\)$/, "").toLowerCase()));
    const slow = [...new Set(PRODS.map(p => p.name))].filter(n => !soldNames.has(String(n).toLowerCase()));

    // coupons
    const cp = {}; sold.filter(o => o.coupon_code).forEach(o => { const x = cp[o.coupon_code] || (cp[o.coupon_code] = { c: o.coupon_code, n: 0, d: 0 }); x.n++; x.d += Number(o.discount || 0); });
    const cps = Object.values(cp).sort((a, b) => b.n - a.n);

    host.innerHTML = `<div class="rp-ch" id="rpCh">${PER.map(x => `<button type="button" data-p="${x[0]}" class="${per === x[0] ? "on" : ""}">${x[1]}</button>`).join("")}</div>
      <div class="rp-k"><div class="big"><small>Kul sale (paid orders)</small><b>${money(sales)}</b></div>
        <div><small>Orders</small><b>${sold.length}</b></div><div><small>Ek order ka average</small><b>${money(sold.length ? sales / sold.length : 0)}</b></div>
        <div><small>Coupon se discount diya</small><b>${money(disc)}</b></div><div><small>Delivery se mila</small><b>${money(del)}</b></div>
        <div><small>Payment baaki</small><b>${wait.length}</b></div><div><small>Cancelled</small><b>${canc.length}</b></div>
        <div><small>Refund diya</small><b>${money(refAmt)}</b></div><div><small>Sale − refund</small><b>${money(sales - refAmt)}</b></div></div>
      ${bars}
      <div class="rp-s"><h4>🏆 Sabse zyada bikne wale</h4>${top.length ? top.map((x, i) => `<div class="rp-r"><div class="t"><span>${i + 1}. ${esc(x.name)}</span><b>${money(x.amt)}</b></div><div class="bar"><i style="width:${Math.max(3, Math.round(x.amt / tmx * 100))}%"></i></div><small>${x.qty} piece bike</small></div>`).join("") : `<div class="rp-none">Is period me koi sale nahi.</div>`}</div>
      <div class="rp-s"><h4>🐌 Is period me ek bhi nahi bika</h4>${slow.length ? `<div class="rp-slow">${slow.map(esc).join(" · ")}</div>` : `<div class="rp-none">Sab products bike. 👍</div>`}</div>
      <div class="rp-s"><h4>🏷️ Coupon ka use</h4>${cps.length ? cps.map(x => `<div class="rp-r"><div class="t"><span>${esc(x.c)}</span><b>${x.n} baar</b></div><small>Total discount ${money(x.d)}</small></div>`).join("") : `<div class="rp-none">Is period me koi coupon use nahi hua.</div>`}</div>
      <div class="rp-none">Note: sirf <b>paid</b> aur cancel na hue orders gine gaye. Din IST ke hisaab se hain.</div>`;
    $("rpCh").onclick = e => { const b = e.target.closest("[data-p]"); if (b) { per = b.dataset.p; paint(); } };
  }

  async function render() {
    if (done || !$("apReport")) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true; load();
    document.addEventListener("aashapura-admin-sec", e => { if (e.detail === "report") load(); });
  }
  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none") render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(render, 2500);
  }
})();
