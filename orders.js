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
      <p><b>${esc(o.customer_name || "")}</b><br>${esc(o.phone || "")}<br>${esc(o.address || o.delivery_address || "")}</p>
      <table><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>${rows}</table>
      <p>Subtotal: ${money(o.subtotal)}<br>${Number(o.discount) ? "Discount" + (o.coupon_code ? " (" + esc(o.coupon_code) + ")" : "") + ": −" + money(o.discount) + "<br>" : ""}${Number(o.delivery_charge) ? "Delivery: " + money(o.delivery_charge) + "<br>" : "Delivery: FREE<br>"}<b>Total: ${money(o.total)}</b><br>Payment: ${esc(o.payment_status || "pending")}</p>
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


  /* ---------- Cancel flow: reason -> refund mode -> confirm -> done ---------- */
  const cst = document.createElement("style");
  cst.textContent = `.cf-wrap{position:fixed;inset:0;z-index:100020;background:#f5f5f6;display:flex;flex-direction:column;color:#222}
  .cf-head{display:flex;gap:12px;align-items:center;padding:14px;background:#fff;border-bottom:1px solid #eee;font-size:17px}.cf-head button{border:0;background:none;font-size:22px}
  .cf-body{flex:1;overflow:auto;padding:14px;-webkit-overflow-scrolling:touch}.cf-card{background:#fff;border-radius:12px;padding:12px;margin-bottom:12px}
  .cf-r{display:flex;gap:10px;align-items:flex-start;padding:11px 0;font-size:15px}.cf-r i{flex:none;width:20px;height:20px;border:2px solid #999;border-radius:50%;margin-top:1px}.cf-r.on i{border-color:#2f6b3a;background:radial-gradient(#2f6b3a 45%,#fff 50%)}
  .cf-wrap textarea,.cf-wrap input{width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:8px;padding:11px;font-size:16px;background:#fff}
  .cf-bar{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;border-top:1px solid #eee}.cf-bar small{display:block;color:#2f6b3a;font-weight:700}.cf-bar b{font-size:19px}
  .cf-go{min-width:140px;padding:14px;border:0;border-radius:6px;background:#2f6b3a;color:#fff;font-weight:700;font-size:15px}.cf-go.off{background:#c8c8c8}
  .cf-sheet{position:fixed;left:0;right:0;bottom:0;z-index:100030;background:#fff;border-radius:14px 14px 0 0;padding:16px;box-shadow:0 -10px 40px #0006}.cf-dim{position:fixed;inset:0;z-index:100025;background:#0008}
  .cf-sheet .row{display:flex;gap:10px;margin-top:14px}.cf-sheet button{flex:1;padding:13px;border-radius:6px;border:1px solid #2f6b3a;background:#fff;font-weight:700}.cf-sheet button.p{background:#2f6b3a;color:#fff}
  .cf-ok{width:64px;height:64px;border-radius:50%;background:#2f6b3a;color:#fff;font-size:36px;display:grid;place-items:center;margin:20px auto 8px}`;
  document.head.appendChild(cst);
  const CANCEL_REASONS = [["Ordered by mistake", "गलती से ऑर्डर हो गया"], ["Product not required anymore", "अब प्रोडक्ट की ज़रूरत नहीं"], ["Wants to change product / quantity", "प्रोडक्ट / मात्रा बदलनी है"], ["Delayed delivery", "डिलीवरी में देरी"], ["Found a better price", "कहीं सस्ता मिला"], ["Duplicate order", "डुप्लिकेट ऑर्डर"], ["Payment problem", "पेमेंट की समस्या"], ["Other", "अन्य"]];

  function cancelFlow(od) {
    const ps = lc(od.payment_status) || "pending";
    const refundable = ps === "paid" || !!od.utr, amt = Number(od.total || 0);
    const items = Array.isArray(od.items) ? od.items : [];
    let reason = "", note = "", upi = "";
    const w = document.createElement("div"); w.className = "cf-wrap"; document.body.appendChild(w);
    const shut = () => { w.remove(); document.querySelectorAll(".cf-sheet,.cf-dim").forEach(x => x.remove()); };
    const head = (t, back) => { w.innerHTML = `<div class="cf-head"><button type="button" id="cfBack">←</button><b>${esc(t)}</b></div><div class="cf-body" id="cfBody"></div><div class="cf-bar" id="cfBar"></div>`; w.querySelector("#cfBack").onclick = back || shut; return [w.querySelector("#cfBody"), w.querySelector("#cfBar")]; };
    const itemsCard = () => `<div class="cf-card"><b>#${esc(od.order_no || od.id)}</b>${items.map(i => `<div style="display:flex;justify-content:space-between;padding-top:6px"><span>${esc(i.name)}${i.weight ? " (" + esc(i.weight) + ")" : ""} × ${Number(i.qty || i.quantity || 1)}</span><span>${money(i.price * (i.qty || i.quantity || 1))}</span></div>`).join("")}</div>`;
    const bar = (el, left, label, fn, off) => { el.innerHTML = `<div>${left}</div><button type="button" class="cf-go${off ? " off" : ""}">${label} ›</button>`; el.querySelector("button").onclick = fn; };

    function step1() {
      const [b, bar1] = head(T("Cancel Order", "ऑर्डर रद्द करें"));
      b.innerHTML = itemsCard() + `<div class="cf-card"><b>${T("Reason for cancellation", "रद्द करने का कारण")}</b><br><small style="color:#666">${T("Please tell us the correct reason. It helps us improve.", "सही कारण बताएँ। इससे हमें सुधार में मदद मिलती है।")}</small>
        <div id="cfR">${CANCEL_REASONS.map(r => `<div class="cf-r${reason === r[0] ? " on" : ""}" data-r="${esc(r[0])}"><i></i><span>${esc(T(r[0], r[1]))}</span></div>`).join("")}</div>
        <textarea id="cfNote" rows="3" maxlength="200" placeholder="${T("Additional comments", "अन्य टिप्पणी")}">${esc(note)}</textarea></div>`;
      b.querySelector("#cfR").onclick = e => { const r = e.target.closest("[data-r]"); if (r) { note = b.querySelector("#cfNote").value; reason = r.dataset.r; step1(); } };
      b.querySelector("#cfNote").oninput = e => { note = e.target.value; };
      const left = refundable ? `<small>${T("Refund Details", "रिफंड विवरण")}</small><b>${money(amt)}</b>` : `<small>${T("Order total", "ऑर्डर कुल")}</small><b>${money(amt)}</b>`;
      bar(bar1, left, refundable ? T("REFUND", "रिफंड") : T("CANCEL ORDER", "रद्द करें"), () => {
        if (!reason) return toast(T("Please select a reason.", "कृपया कारण चुनें।"), "error");
        refundable ? step2() : finish();
      }, !reason);
    }

    function step2() {
      const [b, bar2] = head(T("Refund", "रिफंड"), step1);
      b.innerHTML = itemsCard() + `<div class="cf-card"><b>${T("Choose a refund mode", "रिफंड का तरीका चुनें")}</b>
        <div class="cf-r on"><i></i><span><b>${T("Back to my UPI ID", "मेरी UPI ID में वापस")}</b><br><small style="color:#555">${T(`${money(amt)} will be sent to your UPI ID after we check the payment.`, `पेमेंट जाँचने के बाद ${money(amt)} आपकी UPI ID में भेजे जाएँगे।`)}</small></span></div>
        <input id="cfUpi" placeholder="name@bank" autocapitalize="none" autocomplete="off" value="${esc(upi)}"></div>`;
      const ok = () => /^[\w.\-]{2,}@[A-Za-z][\w.\-]{1,}$/.test(upi.trim());
      b.querySelector("#cfUpi").oninput = e => { upi = e.target.value.trim(); bar2.querySelector("button").classList.toggle("off", !ok()); };
      bar(bar2, `<small>${T("Refund Details", "रिफंड विवरण")}</small><b>${money(amt)}</b>`, T("CONFIRM", "कन्फर्म"), () => { if (!ok()) return toast(T("Enter a valid UPI ID, like name@bank", "सही UPI ID भरें, जैसे name@bank"), "error"); sheet(); }, !ok());
    }

    function sheet() {
      const d = document.createElement("div"); d.className = "cf-dim";
      const s2 = document.createElement("div"); s2.className = "cf-sheet";
      s2.innerHTML = `<b>${T("Confirm Refund", "रिफंड कन्फर्म करें")}</b><p>${T(`Are you sure you want the refund of ${money(amt)} to UPI ID`, `क्या आप ${money(amt)} का रिफंड इस UPI ID पर चाहते हैं`)} <b>${esc(upi)}</b>?<br><small style="color:#555">${T("Credited within 24 hours after we verify the payment.", "पेमेंट जाँचने के बाद 24 घंटे में जमा होगा।")}</small></p><div class="row"><button type="button" id="cfNo">${T("GO BACK", "वापस जाएँ")}</button><button type="button" class="p" id="cfYes">${T("GET REFUND", "रिफंड लें")}</button></div>`;
      document.body.append(d, s2);
      const rm = () => { d.remove(); s2.remove(); };
      d.onclick = s2.querySelector("#cfNo").onclick = rm;
      s2.querySelector("#cfYes").onclick = async () => { s2.querySelector("#cfYes").disabled = true; await finish(rm); };
    }

    async function finish(after) {
      const { error } = await supabaseClient.rpc("cancel_my_order", { p_id: String(od.id), p_reason: reason + (note ? " — " + note : "") });
      if (error) { if (after) after(); return toast(error.message, "error"); }
      if (refundable) {
        const r = await supabaseClient.from("store_refunds").insert({ order_id: String(od.id), user_id: signedInUser.id, reason: "Order cancelled: " + reason, details: note || null, refund_upi: upi, amount: amt, status: "requested", photos: [] });
        if (r.error && r.error.code !== "23505") toast(T("Order cancelled, but refund request failed. Please contact us on WhatsApp.", "ऑर्डर रद्द हुआ, पर रिफंड निवेदन नहीं बना। WhatsApp पर संपर्क करें।"), "error");
      }
      if (after) after();
      done();
    }

    function done() {
      const [b, bar3] = head(T("Order Cancelled", "ऑर्डर रद्द"), () => { shut(); loadMyOrders(); });
      b.innerHTML = `<div class="cf-ok">✓</div><p style="text-align:center;font-weight:700;font-size:18px;margin:0 0 14px">${T("Order Cancelled", "ऑर्डर रद्द हो गया")}</p>
        <div class="cf-card"><b>${T(`${items.length} item(s) cancelled`, `${items.length} आइटम रद्द`)}</b>${items.map(i => `<div style="padding-top:6px">${esc(i.name)}${i.weight ? " (" + esc(i.weight) + ")" : ""}</div>`).join("")}
        <hr style="border:0;border-top:1px solid #eee;margin:12px 0">
        <small style="color:#666">${T("REFUND DETAILS", "रिफंड विवरण")}</small>
        <div>${refundable ? T(`A refund of <b>${money(amt)}</b> will be processed within 24 hours in your account (${esc(upi)}).`, `<b>${money(amt)}</b> का रिफंड 24 घंटे में आपके खाते (${esc(upi)}) में प्रोसेस होगा।`) : T("No payment was received for this order, so no refund is needed.", "इस ऑर्डर का पेमेंट नहीं मिला था, इसलिए रिफंड की ज़रूरत नहीं।")}</div>
        ${refundable ? `<small style="color:#666;display:block;margin-top:10px">${T("REFUND TRACKING", "रिफंड ट्रैकिंग")}</small><div>${T("Open Returns & Refunds from your account menu to track the refund status.", "रिफंड की स्थिति देखने के लिए अकाउंट मेन्यू में Returns & Refunds खोलें।")}</div>` : ""}</div>`;
      bar3.innerHTML = `<button type="button" class="cf-go" style="width:100%">${T("DONE", "ठीक है")}</button>`;
      bar3.querySelector("button").onclick = () => { shut(); loadMyOrders(); };
    }
    step1();
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
        <div class="od-top"><span>${Number(od.discount) ? T("Discount", "छूट") + (od.coupon_code ? " (" + esc(od.coupon_code) + ")" : "") + " −" + money(od.discount) + " · " : ""}${T("Delivery", "डिलीवरी")} ${Number(od.delivery_charge) ? money(od.delivery_charge) : T("FREE", "फ्री")}</span><b>${T("Total", "कुल")} ${money(od.total)}</b></div>
        ${ps !== "paid" && os !== "cancelled" ? (od.utr ? `<p style="margin:6px 0;color:#1d4ed8">✅ ${T("⏳ Verification will take a few minutes. Your order will be confirmed shortly.", "⏳ वेरिफिकेशन में कुछ मिनट लगेंगे। ऑर्डर जल्दी कन्फर्म होगा।")}</p>` : `<p style="margin:6px 0;color:#b45309">${T("Paid already? Send your payment screenshot on WhatsApp so we can confirm.", "पेमेंट कर दिया? कन्फर्म के लिए WhatsApp पर पेमेंट स्क्रीनशॉट भेजें।")}</p>`) : ""}
        <small style="color:#666">📍 ${esc(od.address || od.delivery_address || "")}</small>
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
      if (["pending", "confirmed"].includes(os)) add("✕ " + T("Cancel Order", "ऑर्डर रद्द करें"), () => cancelFlow(od), "d");
      if (!active && (ps === "paid" || os === "delivered")) add("↩️ " + T("Return / Refund", "रिटर्न / रिफंड"), () => window.openRefunds && window.openRefunds());
      if (os === "delivered") add("⭐ " + T("Rate", "रेटिंग दें"), () => { const i = (od.items || [])[0]; if (i) { try { closeMyOrdersPage(); } catch (e) {} showProduct(i.id); } });
      add("🧾 " + T("Invoice", "इनवॉइस"), () => invoice(od));
      add("💬 " + T("Help", "मदद"), () => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hello Aashapura Aurveda, help with order " + (od.order_no || od.id))}`, "_blank", "noopener"));
      list.appendChild(c);
    });
  };
})();
