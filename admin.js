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
  .ad-addr{background:#f6f9f4;border:1px solid #dfe8da;border-radius:10px;padding:8px 10px}.ad-al{font-size:15px;font-weight:600;margin:2px 0}.ad-wk{margin-top:4px;font-weight:700}.ad-wk.y{color:#166534}.ad-wk.n{color:#b42318}.ad-cp{margin-top:8px;padding:8px 12px;border-radius:8px;border:1px solid #888;background:#fff}
  .ad-grid{display:grid;grid-template-columns:1fr;gap:6px}@media(min-width:700px){.ad-grid{grid-template-columns:1fr 1fr}}`;
  document.head.appendChild(st);

  let ORD = [], REF = [], PROF = {}, tab = "all", q = "";
  const COL = { pending: "#b45309:#fef3c7", confirmed: "#1d4ed8:#dbeafe", shipped: "#6d28d9:#ede9fe", delivered: "#166534:#dcfce7", cancelled: "#b42318:#fee4e2", paid: "#166534:#dcfce7" };
  const bd = v => { const [c, b] = (COL[lc(v)] || "#555:#eee").split(":"); return `<span class="ad-b" style="color:${c};background:${b}">${esc(v || "pending")}</span>`; };
  const isPaid = o => lc(o.payment_status) === "paid";
  const isCod = o => lc(o.payment_method) === "cod";
  const isCan = o => lc(o.order_status) === "cancelled";
  const num = o => esc(o.order_no || o.id);
  const isNew = o => !isCan(o) && new Date(o.created_at).getTime() > (Number(window.aashapuraAdminSeenAt) || Infinity);

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
    if (tab === "cod" && !isCod(o)) return false;
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

  /* Address + Home/Office + weekend delivery (courier ke liye). Naye orders me order ke saath save hota hai; purane orders ke liye customer ki saved address se milaya jata hai. */
  let ADDR = {};
  function addrInfo(o) {
    let type = o.address_type, sat = o.open_sat, sun = o.open_sun, from = "order";
    if (!type) {
      const list = ADDR[o.user_id] || [], txt = lc(o.address || o.delivery_address);
      let m = list.filter(a => a.pincode && String(a.pincode) === String(o.pincode) && (!a.house || txt.includes(lc(a.house))));
      if (!m.length) m = list.filter(a => a.pincode && String(a.pincode) === String(o.pincode));
      if (m.length) { type = m[0].address_type || "home"; sat = m[0].open_sat; sun = m[0].open_sun; from = "saved"; }
    }
    if (!type) return null;
    const office = type === "office";
    const days = [sat ? "Saturday" : "", sun ? "Sunday" : ""].filter(Boolean);
    const wk = !office ? { ok: true, txt: "Haan, weekend delivery chalegi (Home)" } : days.length ? { ok: true, txt: "Haan, " + days.join(" + ") + " chalegi (Office)" } : { ok: false, txt: "Nahi, office weekend par band hai - Mon-Fri hi bhejna" };
    return { office, wk, from };
  }
  function addrHTML(o) {
    const ai = addrInfo(o);
    return `<div class="ad-addr"><b>📍 Delivery address</b><div class="ad-al">${esc(o.address || o.delivery_address || "—")}</div>
      ${o.pincode ? `<div>PIN: <b style="font-size:16px">${esc(o.pincode)}</b>${o.delivery_area ? " · " + esc(o.delivery_area) : ""}</div>` : ""}
      ${ai ? `<div><span class="ad-b" style="background:${ai.office ? "#fef3c7;color:#92400e" : "#dcfce7;color:#166534"};margin:0">${ai.office ? "🏢 OFFICE" : "🏠 HOME"}</span></div>
      <div class="ad-wk ${ai.wk.ok ? "y" : "n"}">${ai.wk.ok ? "✅" : "⛔"} Weekend: ${esc(ai.wk.txt)}</div>${ai.from === "saved" ? `<small>(customer ki saved address se)</small>` : ""}` : `<div class="ad-wk">ℹ️ Home/Office info nahi mili (purana order)</div>`}
      <button type="button" class="ad-cp">📋 Copy for courier</button></div>`;
  }
  function addrCopy(o) {
    const ai = addrInfo(o);
    return [`Name: ${o.customer_name || ""}`, `Phone: ${o.phone || ""}`, `Address: ${o.address || o.delivery_address || ""}`, o.pincode ? `Pincode: ${o.pincode}` : "", ai ? `Type: ${ai.office ? "Office" : "Home"}` : "", ai ? `Weekend delivery: ${ai.wk.ok ? "YES" : "NO"} (${ai.wk.txt})` : "", `Order: ${o.order_no || o.id}`].filter(Boolean).join("\n");
  }

  function card(o) {
    const p = PROF[o.user_id] || {}, nOrd = ORD.filter(x => x.user_id === o.user_id).length;
    const items = Array.isArray(o.items) ? o.items : [];
    const refs = REF.filter(r => String(r.order_id) === String(o.id));
    const d = document.createElement("details"); d.className = "ad-o";
    d.innerHTML = `<summary>${isNew(o) ? `<span class="ad-b" style="background:#b42318;color:#fff;margin:0 6px 0 0">NEW</span>` : ""}<b>#${num(o)}</b> · ${esc(o.customer_name || p.full_name || "Customer")} · <b>${money(o.total)}</b><br><small>${esc(dt(o.created_at))}</small> ${bd(o.order_status)} ${bd(isPaid(o) ? "paid" : "unpaid")}${isCod(o) ? ` <span class="ad-b" style="background:#fff3cd;color:#8a5a00">💵 Cash On Delivery ${money(o.total)}</span>` : ""}${!isPaid(o) && !isCan(o) && o.utr ? ` <span class="ad-b" style="background:#fff3cd;color:#8a5a00">📷 screenshot sent · check &amp; confirm</span>` : ""}${refs.length ? ` <span class="ad-b" style="background:#fee4e2;color:#b42318">return: ${esc(refs[0].status)}</span>` : ""}</summary>
      <div class="ad-in"><div class="ad-grid">
        <div><b>Customer</b><br>${esc(o.customer_name || "")}<br>📞 ${esc(o.phone || "—")}<br>✉️ ${esc(o.customer_email || "—")}</div>
        ${addrHTML(o)}
        <div><b>Profile (login)</b><br>${p.full_name ? esc(p.full_name) + "<br>📞 " + esc(p.phone || "") + "<br>📍 " + esc(p.address || "") : "—"}<br><small>User ID: ${esc(o.user_id)}<br>Orders by this customer: ${nOrd}${nOrd > 1 ? " (repeat)" : ""}</small></div>
      </div>
      <table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${items.map(i => `<tr><td>${esc(i.name)}${i.weight ? " (" + esc(i.weight) + ")" : ""}</td><td>${Number(i.qty || i.quantity || 1)}</td><td>${money(i.price)}</td><td>${money(i.price * (i.qty || i.quantity || 1))}</td></tr>`).join("")}</table>
      <div>Subtotal ${money(o.subtotal)}${Number(o.combo_discount) ? " · 🎁 Combo −" + money(o.combo_discount) + (o.combo_names ? " (" + esc(o.combo_names) + ")" : "") : ""}${Number(o.discount) ? " · Discount −" + money(o.discount) + (o.coupon_code ? " (" + esc(o.coupon_code) + ")" : "") : ""} · Delivery ${Number(o.delivery_charge) ? money(o.delivery_charge) : "FREE"} · <b>Total ${money(o.total)}</b></div>
      ${isCod(o) ? `<div style="background:#fff8e1;border:1px solid #f1d98a;border-radius:8px;padding:8px 10px;margin:6px 0">💵 <b>Cash on Delivery</b> · Cash On Delivery fee ${money(o.cod_fee || 0)} · Delivery par <b>${money(o.total)}</b> collect karna hai${isPaid(o) ? " · <b style=\"color:#166534\">Cash mil gaya ✓</b>" : ""}</div>` : ""}
      <div>${o.stock_deducted ? "📦 Stock kam ho chuka hai" : "Stock: confirm par kam hoga"}</div>
      <div>Order No: <b>${num(o)}</b> · DB ID: ${esc(o.id)} · Payment screenshot: <b>${o.utr ? "sent on WhatsApp (check chat)" : "not yet"}</b></div>
      ${o.cancel_reason ? `<div style="color:#b42318">Cancel reason: ${esc(o.cancel_reason)}</div>` : ""}
      <div class="ad-acts"></div></div>`;
    const cpb = d.querySelector(".ad-cp"); if (cpb) cpb.onclick = async () => { try { await navigator.clipboard.writeText(addrCopy(o)); toast("Address copy ho gaya"); } catch (e) { window.prompt("Copy karo:", addrCopy(o)); } };
    const acts = d.querySelector(".ad-acts");
    const add = (t, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; b.onclick = fn; acts.appendChild(b); };
    const os = lc(o.order_status) || "pending";
    if (!isCan(o)) {
      if (isCod(o) && os === "pending") add("✅ Confirm Cash On Delivery Order", async () => {
        await setO(o, { order_status: "confirmed" }, "Cash On Delivery order confirmed");
        const ph2 = String(o.phone || "").replace(/\D/g, "").slice(-10);
        if (ph2 && await confirm("Customer ko WhatsApp par confirmation bhejein?")) {
          const no2 = o.order_no || o.id;
          window.open(`https://wa.me/91${ph2}?text=${encodeURIComponent("Namaste " + (o.customer_name || "") + ", aapka Cash on Delivery order " + no2 + " confirm ho gaya hai. Delivery par " + money(o.total) + " cash dena hoga. Dhanyavaad - Aashapura Ayurveda")}`, "_blank", "noopener");
          try { window.aashapuraPush && window.aashapuraPush({ user_id: o.user_id, phone: ph2, kind: "order", title: "Order confirm ho gaya ✅", body: "Aapka Cash on Delivery order " + no2 + " confirm ho gaya hai. Delivery par " + money(o.total) + " cash dena hoga.", link: "order:" + no2, order_id: no2, key: no2 + "|confirmed" }); } catch (e) {}
        }
      });
      if (!isPaid(o) && !isCod(o)) add("✅ Payment mila – Confirm Order", async () => {
        await setO(o, { payment_status: "paid", order_status: os === "pending" ? "confirmed" : o.order_status }, "Order confirmed");
        const ph2 = String(o.phone || "").replace(/\D/g, "").slice(-10);
        if (ph2 && await confirm("Customer ko WhatsApp par confirmation bhejein?")) {
          const no2 = o.order_no || o.id;
          window.open(`https://wa.me/91${ph2}?text=${encodeURIComponent("Namaste " + (o.customer_name || "") + ", aapka payment mil gaya. Aapka order " + no2 + " (" + money(o.total) + ") confirm ho gaya hai. Dhanyavaad - Aashapura Ayurveda")}`, "_blank", "noopener");
          try { window.aashapuraPush && window.aashapuraPush({ user_id: o.user_id, phone: ph2, kind: "order", title: "Payment mil gaya, order confirm ✅", body: "Aapka payment mil gaya. Order " + no2 + " (" + money(o.total) + ") confirm ho gaya hai.", link: "order:" + no2, order_id: no2, key: no2 + "|confirmed" }); } catch (e) {}
        }
      });
      if (os === "pending") add("Confirm", () => setO(o, { order_status: "confirmed" }));
      if (["pending", "confirmed"].includes(os)) add("🚚 Shipped", () => setO(o, { order_status: "shipped" }));
      if (["confirmed", "shipped"].includes(os)) add(isCod(o) && !isPaid(o) ? "📦 Delivered + Cash mila" : "📦 Delivered", async () => {
        if (isCod(o) && !isPaid(o)) { if (!(await confirm("Delivery ho gayi aur " + money(o.total) + " cash mil gaya?"))) return; await setO(o, { order_status: "delivered", payment_status: "paid" }, "Delivered, cash received"); }
        else await setO(o, { order_status: "delivered" });
      });
      if (os !== "delivered") add("✕ Cancel", async () => { const r = await window.prompt("Cancel reason:", ""); if (r !== null && r !== undefined) setO(o, { order_status: "cancelled", cancel_reason: String(r).trim(), cancelled_at: new Date().toISOString() }, "Cancelled"); });
    }
    const ph = String(o.phone || p.phone || "").replace(/\D/g, "").slice(-10);
    const wa = txt => window.open(`https://wa.me/91${ph}?text=${encodeURIComponent(txt)}`, "_blank", "noopener");
    const hi = "Namaste " + (o.customer_name || p.full_name || "") + ", ", no = o.order_no || o.id;
    /* v65: same message also goes to the customer's Notification (bell) icon */
    const bell = (kind, title, body, key) => { try { if (window.aashapuraPush) window.aashapuraPush({ user_id: o.user_id, phone: ph || o.phone, kind, title, body, link: "order:" + no, order_id: no, key: key ? no + "|" + key : null }).then(r => { if (r && r.ok && !r.dup) toast("🔔 Customer ke Notification icon me bhi gaya"); }); } catch (e) {} };
    const trk = window.aashapuraTrackLink ? window.aashapuraTrackLink(o) : "";
    if (ph && !isCan(o) && ["confirmed", "shipped", "delivered"].includes(os)) {
      if (os === "confirmed") add("📲 Confirm msg", () => { wa(hi + "aapka order " + no + " (" + money(o.total) + ") confirm ho gaya hai. Hum jaldi hi ise ship karenge. Dhanyavaad - Aashapura Ayurveda"); bell("order", "Order confirm ho gaya ✅", "Aapka order " + no + " (" + money(o.total) + ") confirm ho gaya hai. Hum jaldi hi ise ship karenge.", "confirmed"); });
      if (os === "shipped") add("📲 Shipped msg + tracking link", () => { wa(hi + "aapka order " + no + " ship ho gaya hai." + (o.courier ? " Courier: " + o.courier + "." : "") + (o.tracking_id ? " Tracking ID: " + o.tracking_id + "." : "") + (trk ? "\nLive tracking dekhein (Sign In karke): " + trk : "") + "\nJaldi pahunch jayega. - Aashapura Ayurveda"); bell("track", "Order ship ho gaya 🚚", "Aapka order " + no + " ship ho gaya hai." + (o.courier ? " Courier: " + o.courier + "." : "") + (o.tracking_id ? " Tracking ID: " + o.tracking_id + "." : "") + " Live tracking dekhne ke liye dabayein.", "shipped"); });
      if (os === "delivered") add("📲 Delivered msg", () => { wa(hi + "aapka order " + no + " deliver ho gaya hai. Product pasand aaye to website par review zaroor dein. Dhanyavaad - Aashapura Ayurveda"); bell("order", "Order deliver ho gaya 📦", "Aapka order " + no + " deliver ho gaya hai. Product pasand aaye to review zaroor dein.", "delivered"); });
    }
    if (ph) add("💬 WhatsApp", () => window.open(`https://wa.me/91${ph}?text=${encodeURIComponent("Namaste " + (o.customer_name || "") + ", Aashapura Ayurveda order " + (o.order_no || o.id) + " (" + money(o.total) + "): ")}`, "_blank", "noopener"));
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
        try { window.aashapuraPush && window.aashapuraPush({ user_id: o.user_id, phone: o.phone, kind: "track", title: "Order update 📍", body: "Order " + (o.order_no || o.id) + ": " + m, link: "order:" + (o.order_no || o.id), order_id: o.order_no || o.id }); } catch (e) {}
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
    const h = ["Order No", "Date", "Customer", "Phone", "Email", "Address", "Items", "Subtotal", "Discount", "Coupon", "Delivery", "Pincode", "Address type", "Weekend delivery", "Combo discount", "Total", "Payment", "Method", "Cash On Delivery fee", "Status", "Screenshot sent"];
    const rows = ORD.map(o => [o.order_no || o.id, o.created_at, o.customer_name, o.phone, o.customer_email, (o.address || o.delivery_address), (o.items || []).map(i => `${i.name} x${i.qty || i.quantity || 1}`).join("; "), o.subtotal, o.discount, o.coupon_code, o.delivery_charge, o.pincode, (addrInfo(o) ? (addrInfo(o).office ? "Office" : "Home") : ""), (addrInfo(o) ? (addrInfo(o).wk.ok ? "Yes" : "No") : ""), o.combo_discount || 0, o.total, o.payment_status, o.payment_method || "upi", o.cod_fee || 0, o.order_status, o.utr ? "yes" : ""]);
    const t = [h, ...rows].map(r => r.map(v => `"${String(v == null ? "" : v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + t], { type: "text/csv" })); a.download = "aashapura-orders.csv"; a.click();
  }

  function paintOverview(h) {
    h.innerHTML = `<div class="adm-bar"><span class="adm-sub">Live summary of your store</span><span><button type="button" id="adCsv">⬇ CSV</button> <button type="button" id="adReload" aria-label="Refresh">↻</button></span></div>
      <div class="ad-stats">${stats()}</div><div id="adLow"></div>`;
    h.querySelector("#adCsv").onclick = csv; h.querySelector("#adReload").onclick = load;
    sb().from("products").select("name,weight,stock").lte("stock", 5).order("stock").limit(15).then(r => {
      if (r.data && r.data.length) h.querySelector("#adLow").innerHTML = `<div class="ad-stat red" style="margin:6px 0"><small>⚠️ Low stock (≤5)</small>${r.data.map(p => `${esc(p.name)} ${esc(p.weight || "")}: <b>${p.stock}</b>`).join(" · ")}</div>`;
    });
  }
  function paintOrders(h) {
    const tabs = [["all", "All"], ["utr", "Screenshot sent"], ["unpaid", "Payment pending"], ["confirmed", "Confirmed"], ["shipped", "Shipped"], ["delivered", "Delivered"], ["cancelled", "Cancelled"], ["returns", "Returns"], ["cod", "Cash On Delivery"]];
    h.innerHTML = `<div class="adm-bar"><span class="adm-sub">${ORD.length} orders</span><button type="button" id="adReload2" aria-label="Refresh">↻</button></div>
      <input id="adSearch" placeholder="Search order no, name, phone, email…" value="${esc(q)}" style="width:100%;padding:10px;box-sizing:border-box;margin:6px 0">
      <div class="ad-tabs">${tabs.map(t => `<button type="button" data-t="${t[0]}" class="${tab === t[0] ? "on" : ""}">${t[1]}</button>`).join("")}</div><div id="adList"></div>`;
    h.querySelector("#adReload2").onclick = load;
    h.querySelector(".ad-tabs").onclick = e => { const b = e.target.closest("[data-t]"); if (b) { tab = b.dataset.t; paintOrders(h); } };
    h.querySelector("#adSearch").oninput = e => { q = e.target.value.trim().toLowerCase(); fill(h); };
    fill(h);
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
    const ovh = $("admSec-overview"), orh = $("admSec-orders");
    if (!ovh || !orh) return;
    const [o, r] = await Promise.all([
      sb().from("store_orders").select("*").order("created_at", { ascending: false }).limit(500),
      sb().from("store_refunds").select("order_id,status,amount")
    ]);
    if (o.error) { orh.innerHTML = `<p>Orders load error: ${esc(o.error.message)}</p>`; return; }
    ORD = o.data || []; REF = r.data || [];
    const ids = [...new Set(ORD.map(x => x.user_id).filter(Boolean))];
    PROF = {};
    if (ids.length) { const p = await sb().from("customer_profiles").select("user_id,full_name,phone,address").in("user_id", ids); (p.data || []).forEach(x => { PROF[x.user_id] = x; }); }
    ADDR = {};
    if (ids.length) { try { const ad = await sb().from("customer_addresses").select("user_id,pincode,house,address_type,open_sat,open_sun").in("user_id", ids); (ad.data || []).forEach(x => { (ADDR[x.user_id] = ADDR[x.user_id] || []).push(x); }); } catch (e) {} }
    started = true; paintOverview(ovh); paintOrders(orh);
  }

  let started = false;
  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none" && !started) load(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(load, 1200);
  }
})();
