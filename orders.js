/* Customer "My Orders": order no, status timeline, cancel, return, buy again, invoice */
(function () {
  const T = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = n => "₹" + Number(n || 0).toFixed(2);
  const lc = v => String(v || "").toLowerCase();
  const dt = d => d ? new Date(d).toLocaleString(window.AASHAPURA_LANG === "hi" ? "hi-IN" : "en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  const st = document.createElement("style");
  st.textContent = `.od-card{background:#fff;border:1px solid #e6e6e6;border-radius:14px;padding:12px;margin:10px 0;font-size:14px;line-height:1.5}
  .od-top{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.od-top small{color:#666;display:block}
  .od-b{padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap}
  .od-items{margin:8px 0;padding:8px 0;border-top:1px dashed #ddd;border-bottom:1px dashed #ddd}.od-items div{display:flex;justify-content:space-between;gap:8px;padding:2px 0}
  .od-tl{display:flex;gap:4px;margin:8px 0}.od-tl span{flex:1;text-align:center;font-size:11px;padding:5px 2px;border-radius:6px;background:#eee;color:#777}.od-tl span.on{background:#dcfce7;color:#166534;font-weight:700}
  .od-acts{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.od-acts button{flex:1 1 30%;padding:10px 6px;border-radius:10px;border:1px solid #2f6b3a;background:#fff;color:#2f6b3a;font-weight:600;font-size:13px}
  .od-acts button.p{background:#2f6b3a;color:#fff}.od-acts button.d{border-color:#b42318;color:#b42318}`;
  document.head.appendChild(st);

  const OB = { pending: ["Pending", "#b45309", "#fef3c7"], confirmed: ["Confirmed", "#1d4ed8", "#dbeafe"], shipped: ["Shipped", "#6d28d9", "#ede9fe"], delivered: ["Delivered", "#166534", "#dcfce7"], cancelled: ["Cancelled", "#b42318", "#fee4e2"] };
  const badge = (txt, c, bg) => `<span class="od-b" style="color:${c};background:${bg}">${esc(txt)}</span>`;
  const STEPS = ["pending", "confirmed", "shipped", "delivered"];

  function invoice(o) {
    const w = window.open("", "_blank"); if (!w) return toast(T("Allow pop-ups to open the invoice.", "इनवॉइस खोलने के लिए पॉप-अप की अनुमति दें।"), "error");
    const rows = (o.items || []).map(i => `<tr><td>${esc(i.name)}${i.weight ? " (" + esc(i.weight) + ")" : ""}</td><td>${Number(i.qty || i.quantity || 1)}</td><td>${money(i.price)}</td><td>${money(i.price * (i.qty || i.quantity || 1))}</td></tr>`).join("");
    w.document.write(`<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><title>Invoice ${esc(o.order_no || o.id)}</title><style>body{font-family:sans-serif;padding:16px;color:#222}table{width:100%;border-collapse:collapse}td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left}h2{color:#2f6b3a;margin:0}</style>
      <h2>Aashapura Aurveda</h2><p>Invoice / Order <b>${esc(o.order_no || o.id)}</b><br>${esc(dt(o.created_at))}</p>
      <p><b>${esc(o.customer_name || "")}</b><br>${esc(o.phone || "")}<br>${esc(o.address || "")}</p>
      <table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${rows}</table>
      <p>Subtotal: ${money(o.subtotal)}<br>${Number(o.discount) ? "Discount" + (o.coupon_code ? " (" + esc(o.coupon_code) + ")" : "") + ": −" + money(o.discount) + "<br>" : ""}<b>Total: ${money(o.total)}</b><br>Payment: ${esc(o.payment_status || "pending")}</p>
      <p style="color:#777;font-size:12px">Thank you for shopping with Aashapura Aurveda.</p><script>setTimeout(function(){print()},400)<\/script>`);
    w.document.close();
  }

  function buyAgain(o) {
    let added = 0, miss = 0;
    (o.items || []).forEach(i => {
      const p = products.find(x => String(x.id) === String(i.id));
      if (!p || p.stock <= 0) { miss++; return; }
      cart[p.id] = Math.min(Number(i.qty || i.quantity || 1), p.stock); added++;
    });
    if (!added) return toast(T("These products are not available right now.", "ये प्रोडक्ट अभी उपलब्ध नहीं हैं।"), "error");
    renderCart();
    toast(T("Added to cart", "कार्ट में जोड़ दिया") + (miss ? T(` (${miss} not available)`, ` (${miss} उपलब्ध नहीं)`) : ""));
    try { closeMyOrdersPage(); } catch (e) {}
    try { openCart(); } catch (e) {}
  }

  window.loadMyOrders = async function () {
    const list = $("myOrdersList"), msg = $("myOrdersMessage"); if (!list) return;
    list.replaceChildren(); msg.textContent = "";
    if (!signedInUser) { list.textContent = T("Sign in to see your orders.", "अपने ऑर्डर देखने के लिए Sign In करें।"); return; }
    list.textContent = T("Loading your orders…", "आपके ऑर्डर लोड हो रहे हैं…");
    const [o, r] = await Promise.all([
      supabaseClient.from("store_orders").select("*").eq("user_id", signedInUser.id).order("created_at", { ascending: false }),
      supabaseClient.from("store_refunds").select("order_id,status").eq("user_id", signedInUser.id)
    ]);
    if (o.error) { list.textContent = T("Could not load orders.", "ऑर्डर लोड नहीं हो सके।"); msg.textContent = o.error.message; return; }
    const ret = {}; (r.data || []).forEach(x => { if (!ret[x.order_id] || ["requested", "approved", "refunded"].includes(x.status)) ret[x.order_id] = x.status; });
    list.replaceChildren();
    if (!o.data.length) { list.textContent = T("You have no orders yet.", "अभी आपका कोई ऑर्डर नहीं है।"); return; }
    o.data.forEach(od => {
      const os = lc(od.order_status) || "pending", ps = lc(od.payment_status) || "pending";
      const ob = OB[os] || OB.pending, active = ["requested", "approved", "refunded"].includes(ret[od.id]);
      const c = document.createElement("article"); c.className = "od-card";
      const idx = STEPS.indexOf(os);
      c.innerHTML = `<div class="od-top"><div><b>#${esc(od.order_no || od.id)}</b><small>${esc(dt(od.created_at))}</small></div><div style="text-align:right">${badge(ob[0], ob[1], ob[2])}<br>${ps === "paid" ? badge(T("Paid", "पेमेंट हुआ"), "#166534", "#dcfce7") : od.utr ? badge(T("Payment verifying", "पेमेंट जाँच में"), "#1d4ed8", "#dbeafe") : badge(T("Payment pending", "पेमेंट बाकी"), "#b45309", "#fef3c7")}</div></div>
        ${os === "cancelled" ? `<p style="color:#b42318;margin:6px 0">${T("Order cancelled", "ऑर्डर रद्द")}${od.cancel_reason ? ": " + esc(od.cancel_reason) : ""}</p>` : `<div class="od-tl">${STEPS.map((s, i) => `<span class="${i <= idx ? "on" : ""}">${esc(OB[s][0])}</span>`).join("")}</div>`}
        <div class="od-items">${(od.items || []).map(i => `<div><span>${esc(i.name)}${i.weight ? " (" + esc(i.weight) + ")" : ""} × ${Number(i.qty || i.quantity || 1)}</span><span>${money(i.price * (i.qty || i.quantity || 1))}</span></div>`).join("")}</div>
        <div class="od-top"><span>${Number(od.discount) ? T("Discount", "छूट") + (od.coupon_code ? " (" + esc(od.coupon_code) + ")" : "") + " −" + money(od.discount) : ""}</span><b>${T("Total", "कुल")} ${money(od.total)}</b></div>
        ${ps !== "paid" && os !== "cancelled" ? (od.utr ? `<p style="margin:6px 0;color:#1d4ed8">✅ ${T("⏳ Verification will take a few minutes. Your order will be confirmed shortly.", "⏳ वेरिफिकेशन में कुछ मिनट लगेंगे। ऑर्डर जल्दी कन्फर्म होगा।")}</p>` : `<p style="margin:6px 0;color:#b45309">${T("Paid already? Send your payment screenshot on WhatsApp so we can confirm.", "पेमेंट कर दिया? कन्फर्म के लिए WhatsApp पर पेमेंट स्क्रीनशॉट भेजें।")}</p>`) : ""}
        <small style="color:#666">📍 ${esc(od.address || "")}</small>
        ${active ? `<p style="margin:6px 0">↩️ ${T("Return/refund", "रिटर्न/रिफंड")}: <b>${esc(ret[od.id])}</b></p>` : ""}
        <div class="od-acts"></div>`;
      const acts = c.querySelector(".od-acts");
      const add = (label, fn, cls) => { const b = document.createElement("button"); b.type = "button"; b.textContent = label; if (cls) b.className = cls; b.onclick = fn; acts.appendChild(b); };
      if (ps !== "paid" && os !== "cancelled") add("📷 " + T("Send payment screenshot", "पेमेंट स्क्रीनशॉट भेजें"), async () => {
        try { await supabaseClient.rpc("submit_order_utr", { p_id: String(od.id), p_utr: "WA-SCREENSHOT" }); } catch (e) {}
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Aashapura Aurveda, order " + (od.order_no || od.id) + " (" + money(od.total) + "). I have paid. My payment screenshot is below.")}`, "_blank", "noopener");
        loadMyOrders();
      }, "p");
      add("🔁 " + T("Buy Again", "दोबारा खरीदें"), () => buyAgain(od), "p");
      if (["pending", "confirmed"].includes(os)) add("✕ " + T("Cancel Order", "ऑर्डर रद्द करें"), async () => {
        if (!(await confirm(T("Cancel this order?", "यह ऑर्डर रद्द करें?")))) return;
        const reason = window.prompt(T("Reason (optional):", "कारण (वैकल्पिक):"), "") || "";
        const { error } = await supabaseClient.rpc("cancel_my_order", { p_id: String(od.id), p_reason: reason });
        if (error) return toast(error.message, "error");
        toast(T("Order cancelled. If you already paid, request a refund.", "ऑर्डर रद्द हो गया। पेमेंट कर चुके हैं तो रिफंड माँगें।")); loadMyOrders();
      }, "d");
      if (!active && (ps === "paid" || os === "delivered")) add("↩️ " + T("Return / Refund", "रिटर्न / रिफंड"), () => window.openRefunds && window.openRefunds());
      if (os === "delivered") add("⭐ " + T("Rate", "रेटिंग दें"), () => { const i = (od.items || [])[0]; if (i) { try { closeMyOrdersPage(); } catch (e) {} showProduct(i.id); } });
      add("🧾 " + T("Invoice", "इनवॉइस"), () => invoice(od));
      add("💬 " + T("Help", "मदद"), () => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Aashapura Aurveda, help with order " + (od.order_no || od.id))}`, "_blank", "noopener"));
      list.appendChild(c);
    });
  };
})();
