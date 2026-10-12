/* Admin dashboard: sales summary + all orders (customer, address, items, status actions) + CSV. Shows only after admin login on ?page=admin */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  const lc = v => String(v || "").toLowerCase();
  const dt = d => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  const sb = () => supabaseClient;
  const st = document.createElement("style");
  st.textContent = `#adminPanel{max-width:960px!important}
  .ad-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:10px 0}@media(min-width:700px){.ad-stats{grid-template-columns:repeat(4,1fr)}}
  .ad-stat{background:#f6f9f4;border:1px solid #dfe8da;border-radius:12px;padding:10px}.ad-stat small{display:block;color:#555}.ad-stat b{font-size:18px}
  .ad-stat.red{background:#fff4f2;border-color:#f3d0cb}.ad-stat.blue{background:#f1f6ff;border-color:#d3e1fb}
  .ad-tabs{display:flex;gap:6px;overflow-x:auto;padding:4px 0}.ad-tabs button{white-space:nowrap;padding:8px 12px;border-radius:99px;border:1px solid #bbb;background:#fff}.ad-tabs button.on{background:#2f6b3a;color:#fff;border-color:#2f6b3a}
  .ad-o{border:1px solid #ddd;border-radius:12px;margin:8px 0;background:#fff}.ad-o summary{padding:10px;cursor:pointer;list-style:none}.ad-o summary::-webkit-details-marker{display:none}
  .ad-o .ad-in{padding:0 10px 10px;font-size:14px;line-height:1.5}.ad-o table{width:100%;border-collapse:collapse;margin:6px 0}.ad-o td,.ad-o th{border-bottom:1px solid #eee;padding:4px;text-align:left}
  .ad-b{padding:2px 8px;border-radius:99px;font-size:12px;font-weight:700;margin-left:4px}
  .ad-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.ad-acts button{padding:9px 12px;border-radius:8px;border:1px solid #888;background:#fff}
  .ad-grid{display:grid;grid-template-columns:1fr;gap:6px}@media(min-width:700px){.ad-grid{grid-template-columns:1fr 1fr}}`;
  document.head.appendChild(st);

  let ORD = [], REF = [], PROF = {}, tab = "all", q = "";
  const COL = { pending: "#b45309:#fef3c7", confirmed: "#1d4ed8:#dbeafe", shipped: "#6d28d9:#ede9fe", delivered: "#166534:#dcfce7", cancelled: "#b42318:#fee4e2", paid: "#166534:#dcfce7" };
  const bd = v => { const [c, b] = (COL[lc(v)] || "#555:#eee").split(":"); return `<span class="ad-b" style="color:${c};background:${b}">${esc(v || "pending")}</span>`; };
  const isPaid = o => lc(o.payment_status) === "paid";
  const isCan = o => lc(o.order_status) === "cancelled";
  const num = o => esc(o.order_no || o.id);

  function stats() {
    const sold = ORD.filter(o => isPaid(o) && !isCan(o)), can = ORD.filter(isCan);
    const refd = REF.filter(r => r.status === "refunded"), reqd = REF.filter(r => ["requested", "approved", "picked_up"].includes(r.status));
    const sum = a => a.reduce((s, o) => s + Number(o.total || o.amount || 0), 0);
    const today = new Date().toDateString();
    const todays = sold.filter(o => new Date(o.created_at).toDateString() === today);
    const pend = ORD.filter(o => !isPaid(o) && !isCan(o));
    const cards = [
      ["Total Orders", ORD.length, ""], ["Sales (paid)", money(sum(sold)) + " · " + sold.length + " orders", ""],
      ["Net Sales (after refunds)", money(sum(sold) - sum(refd)), ""], ["Today's Sales", money(sum(todays)) + " · " + todays.length, ""],
      ["Payment Pending", money(sum(pend)) + " · " + pend.length, "blue"], ["Cancelled Orders", can.length + " · " + money(sum(can)), "red"],
      ["Return Requests (open)", reqd.length, "red"], ["Refunded", money(sum(refd)) + " · " + refd.length, "red"]
    ];
    return cards.map(c => `<div class="ad-stat ${c[2]}"><small>${c[0]}</small><b>${c[1]}</b></div>`).join("");
  }

  const match = o => {
    const os = lc(o.order_status) || "pending";
    if (tab === "utr" && !(!isPaid(o) && !isCan(o) && o.utr)) return false;
    if (tab === "unpaid" && !(!isPaid(o) && !isCan(o))) return false;
    if (["confirmed", "shipped", "delivered", "cancelled"].includes(tab) && os !== tab) return false;
    if (tab === "returns" && !REF.some(r => String(r.order_id) === String(o.id))) return false;
    if (q) { const p = PROF[o.user_id] || {}; const hay = [o.order_no, o.id, o.customer_name, o.phone, o.customer_email, o.address, p.full_name, p.phone].join(" ").toLowerCase(); if (!hay.includes(q)) return false; }
    return true;
  };

  async function setO(o, patch, okMsg) {
    if (["confirmed", "shipped", "delivered"].includes(patch.order_status || "") && (lc(o.order_status) || "pending") === "pending") {
      try {
        const its = Array.isArray(o.items) ? o.items : [];
        const ids = its.map(i => Number(i.id)).filter(Boolean);
        if (ids.length) {
          const pr = await sb().from("products").select("id,name,stock").in("id", ids);
          const bad = (pr.data || []).map(p => { const it = its.find(i => Number(i.id) === Number(p.id)); const q = Number(it && (it.qty || it.quantity) || 1); return Number(p.stock || 0) < q ? `${p.name}: stock ${p.stock}, order qty ${q}` : null; }).filter(Boolean);
          if (bad.length && !(await confirm("⚠️ Stock kam hai:\n" + bad.join("\n") + "\nPhir bhi confirm karein? (Customer ko refund dena pad sakta hai)"))) return;
        }
      } catch (e) {}
    }
    const now = new Date().toISOString(), ts = {};
    if (patch.payment_status === "paid") ts.paid_at = now;
    if (patch.order_status === "confirmed") ts.confirmed_at = now;
    if (patch.order_status === "shipped") ts.shipped_at = now;
    if (patch.order_status === "delivered") ts.delivered_at = now;
    const base = Object.assign({ updated_at: now }, patch);
    let { error } = await sb().from("store_orders").update(Object.assign({}, base, ts)).eq("id", o.id);
    if (error && /column|schema/i.test(error.message || "")) ({ error } = await sb().from("store_orders").update(base).eq("id", o.id));
    if (error) return toast(error.message, "error");
    toast(okMsg || "Updated"); load();
  }

  function card(o) {
    const p = PROF[o.user_id] || {}, nOrd = ORD.filter(x => x.user_id === o.user_id).length;
    const items = Array.isArray(o.items) ? o.items : [];
    const refs = REF.filter(r => String(r.order_id) === String(o.id));
    const d = document.createElement("details"); d.className = "ad-o";
    d.innerHTML = `<summary><b>#${num(o)}</b> · ${esc(o.customer_name || p.full_name || "Customer")} · <b>${money(o.total)}</b><br><small>${esc(dt(o.created_at))}</small> ${bd(o.order_status)} ${bd(isPaid(o) ? "paid" : "unpaid")}${!isPaid(o) && !isCan(o) && o.utr ? ` <span class="ad-b" style="background:#fff3cd;color:#8a5a00">📷 screenshot sent · check &amp; confirm</span>` : ""}${refs.length ? ` <span class="ad-b" style="background:#fee4e2;color:#b42318">return: ${esc(refs[0].status)}</span>` : ""}</summary>
      <div class="ad-in"><div class="ad-grid">
        <div><b>Customer</b><br>${esc(o.customer_name || "")}<br>📞 ${esc(o.phone || "—")}<br>✉️ ${esc(o.customer_email || "—")}<br>📍 ${esc((o.address || o.delivery_address || "—"))}${o.pincode ? "<br>PIN: <b>" + esc(o.pincode) + "</b>" + (o.delivery_area ? " · " + esc(o.delivery_area) : "") : ""}</div>
        <div><b>Profile (login)</b><br>${p.full_name ? esc(p.full_name) + "<br>📞 " + esc(p.phone || "") + "<br>📍 " + esc(p.address || "") : "—"}<br><small>User ID: ${esc(o.user_id)}<br>Orders by this customer: ${nOrd}${nOrd > 1 ? " (repeat)" : ""}</small></div>
      </div>
      <table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${items.map(i => `<tr><td>${esc(i.name)}${i.weight ? " (" + esc(i.weight) + ")" : ""}</td><td>${Number(i.qty || i.quantity || 1)}</td><td>${money(i.price)}</td><td>${money(i.price * (i.qty || i.quantity || 1))}</td></tr>`).join("")}</table>
      <div>Subtotal ${money(o.subtotal)}${Number(o.discount) ? " · Discount −" + money(o.discount) + (o.coupon_code ? " (" + esc(o.coupon_code) + ")" : "") : ""} · Delivery ${Number(o.delivery_charge) ? money(o.delivery_charge) : "FREE"} · <b>Total ${money(o.total)}</b></div>
      <div>${o.stock_deducted ? "📦 Stock kam ho chuka hai" : "Stock: confirm par kam hoga"}</div>
      <div>Order No: <b>${num(o)}</b> · DB ID: ${esc(o.id)} · Payment screenshot: <b>${o.utr ? "sent on WhatsApp (check chat)" : "not yet"}</b></div>
      ${o.cancel_reason ? `<div style="color:#b42318">Cancel reason: ${esc(o.cancel_reason)}</div>` : ""}
      <div class="ad-acts"></div></div>`;
    const acts = d.querySelector(".ad-acts");
    const add = (t, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; b.onclick = fn; acts.appendChild(b); };
    const os = lc(o.order_status) || "pending";
    if (!isCan(o)) {
      if (!isPaid(o)) add("✅ Payment mila – Confirm Order", async () => {
        await setO(o, { payment_status: "paid", order_status: os === "pending" ? "confirmed" : o.order_status }, "Order confirmed");
        const ph2 = String(o.phone || "").replace(/\D/g, "").slice(-10);
        if (ph2 && await confirm("Customer ko WhatsApp par confirmation bhejein?")) window.open(`https://wa.me/91${ph2}?text=${encodeURIComponent("Namaste " + (o.customer_name || "") + ", aapka payment mil gaya. Aapka order " + (o.order_no || o.id) + " (" + money(o.total) + ") confirm ho gaya hai. Dhanyavaad - Aashapura Aurveda")}`, "_blank", "noopener");
      });
      if (os === "pending") add("Confirm", () => setO(o, { order_status: "confirmed" }));
      if (["pending", "confirmed"].includes(os)) add("🚚 Shipped", () => setO(o, { order_status: "shipped" }));
      if (["confirmed", "shipped"].includes(os)) add("📦 Delivered", () => setO(o, { order_status: "delivered" }));
      if (os !== "delivered") add("✕ Cancel", () => { const r = window.prompt("Cancel reason:", ""); if (r !== null) setO(o, { order_status: "cancelled", cancel_reason: r, cancelled_at: new Date().toISOString() }, "Cancelled"); });
    }
    const ph = String(o.phone || p.phone || "").replace(/\D/g, "").slice(-10);
    if (ph) add("💬 WhatsApp", () => window.open(`https://wa.me/91${ph}?text=${encodeURIComponent("Namaste " + (o.customer_name || "") + ", Aashapura Aurveda order " + (o.order_no || o.id) + " (" + money(o.total) + "): ")}`, "_blank", "noopener"));
    if (["confirmed", "shipped"].includes(os)) {
      const box = document.createElement("div"); box.className = "ad-trk";
      box.innerHTML = `<b>📍 Live tracking (customer ko dikhega)</b>
        <div class="ad-trk-r"><input class="tk-c" placeholder="Courier (e.g. Xpress Bees)" value="${esc(o.courier || "")}"><input class="tk-t" placeholder="Tracking ID" value="${esc(o.tracking_id || "")}"><button type="button" class="tk-s">Save courier</button></div>
        <div class="ad-trk-r"><input class="tk-l" placeholder="Product abhi kahan hai? e.g. Reached at Jaipur Hub"><button type="button" class="tk-a">➕ Add location</button></div>
        <div class="ad-trk-q">${["Packed and ready to ship", "Picked up by courier", "Reached at hub", "In transit", "Reached nearest hub", "Out for delivery"].map(x => `<button type="button" data-q="${x}">${x}</button>`).join("")}</div>
        <div class="tk-list"><small>Khol kar dekho…</small></div>`;
      d.querySelector(".ad-in").appendChild(box);
      const listEl = box.querySelector(".tk-list");
      const reload = async () => {
        const r = await sb().from("order_events").select("*").eq("order_id", String(o.id)).order("created_at", { ascending: false });
        if (r.error) { listEl.innerHTML = `<small style="color:#b42318">${esc(r.error.message)} — supabase_v14.sql chalayi?</small>`; return; }
        listEl.innerHTML = (r.data || []).map(x => `<div>📍 ${esc(x.message)} <small>${esc(dt(x.created_at))}</small> <button type="button" data-del="${x.id}">✕</button></div>`).join("") || "<small>Abhi koi location update nahi.</small>";
      };
      let loaded = false; d.addEventListener("toggle", () => { if (d.open && !loaded) { loaded = true; reload(); } });
      box.querySelectorAll("[data-q]").forEach(b => b.onclick = () => { box.querySelector(".tk-l").value = b.dataset.q; });
      box.querySelector(".tk-a").onclick = async () => {
        const m = box.querySelector(".tk-l").value.trim(); if (!m) return toast("Location likho", "error");
        const r = await sb().from("order_events").insert({ order_id: String(o.id), message: m.slice(0, 200) });
        if (r.error) return toast(r.error.message, "error");
        box.querySelector(".tk-l").value = ""; toast("Location add ho gayi"); reload();
      };
      listEl.addEventListener("click", async e => { const b = e.target.closest("[data-del]"); if (!b) return; const r = await sb().from("order_events").delete().eq("id", b.dataset.del); if (r.error) return toast(r.error.message, "error"); reload(); });
      box.querySelector(".tk-s").onclick = async () => {
        const r = await sb().from("store_orders").update({ courier: box.querySelector(".tk-c").value.trim() || null, tracking_id: box.querySelector(".tk-t").value.trim() || null }).eq("id", o.id);
        toast(r.error ? r.error.message : "Courier save ho gaya", r.error ? "error" : undefined);
      };
    }
    return d;
  }

  function csv() {
    const h = ["Order No", "Date", "Customer", "Phone", "Email", "Address", "Items", "Subtotal", "Discount", "Coupon", "Delivery", "Pincode", "Total", "Payment", "Status", "Screenshot sent"];
    const rows = ORD.map(o => [o.order_no || o.id, o.created_at, o.customer_name, o.phone, o.customer_email, (o.address || o.delivery_address), (o.items || []).map(i => `${i.name} x${i.qty || i.quantity || 1}`).join("; "), o.subtotal, o.discount, o.coupon_code, o.delivery_charge, o.pincode, o.total, o.payment_status, o.order_status, o.utr ? "yes" : ""]);
    const t = [h, ...rows].map(r => r.map(v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + t], { type: "text/csv" })); a.download = "aashapura-orders.csv"; a.click();
  }

  function paint(host) {
    const tabs = [["all", "All"], ["utr", "Screenshot sent"], ["unpaid", "Payment pending"], ["confirmed", "Confirmed"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"], ["returns", "Returns"]];
    host.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><h3 style="margin:0">📊 Sales &amp; Orders</h3><span><button type="button" id="adCsv">⬇ CSV</button> <button type="button" id="adReload">↻</button></span></div>
      <div class="ad-stats">${stats()}</div><div id="adLow"></div>
      <input id="adSearch" placeholder="Search order no, name, phone, email…" value="${esc(q)}" style="width:100%;padding:10px;box-sizing:border-box;margin:6px 0">
      <div class="ad-tabs">${tabs.map(t => `<button type="button" data-t="${t[0]}" class="${tab === t[0] ? "on" : ""}">${t[1]}</button>`).join("")}</div><div id="adList"></div>`;
    host.querySelector("#adCsv").onclick = csv; host.querySelector("#adReload").onclick = load;
    host.querySelector(".ad-tabs").onclick = e => { const b = e.target.closest("[data-t]"); if (b) { tab = b.dataset.t; paint(host); } };
    host.querySelector("#adSearch").oninput = e => { q = e.target.value.trim().toLowerCase(); fill(host); };
    fill(host);
    sb().from("products").select("name,weight,stock").lte("stock", 5).order("stock").limit(15).then(r => {
      if (r.data && r.data.length) host.querySelector("#adLow").innerHTML = `<div class="ad-stat red" style="margin:6px 0"><small>⚠️ Low stock (≤5)</small>${r.data.map(p => `${esc(p.name)} ${esc(p.weight || "")}: <b>${p.stock}</b>`).join(" · ")}</div>`;
    });
  }
  function fill(host) {
    const l = host.querySelector("#adList"); l.innerHTML = "";
    const rows = ORD.filter(match);
    if (!rows.length) l.innerHTML = "<p>No orders.</p>";
    rows.forEach(o => l.appendChild(card(o)));
  }

  async function load() {
    const box = $("adminProductBox"); if (!box || box.style.display === "none") return;
    let uid = null; try { uid = (await sb().auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    let host = $("adminOrders");
    if (!host) { host = document.createElement("div"); host.id = "adminOrders"; host.style.marginBottom = "18px"; box.insertBefore(host, box.firstChild); }
    const [o, r] = await Promise.all([
      sb().from("store_orders").select("*").order("created_at", { ascending: false }).limit(500),
      sb().from("store_refunds").select("order_id,status,amount")
    ]);
    if (o.error) { host.innerHTML = `<p>Orders load error: ${esc(o.error.message)}</p>`; return; }
    ORD = o.data || []; REF = r.data || [];
    const ids = [...new Set(ORD.map(x => x.user_id).filter(Boolean))];
    PROF = {};
    if (ids.length) { const p = await sb().from("customer_profiles").select("user_id,full_name,phone,address").in("user_id", ids); (p.data || []).forEach(x => { PROF[x.user_id] = x; }); }
    paint(host);
  }

  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none" && !$("adminOrders")) load(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(load, 1200);
  }
})();
