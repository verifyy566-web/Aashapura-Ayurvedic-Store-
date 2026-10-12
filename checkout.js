/* Checkout upgrade: coupon, order saved to Supabase (store_orders), UPI link, WhatsApp, cart persistence */
(function () {
  const CK = "aashapura_cart";
  try { Object.assign(cart, JSON.parse(localStorage.getItem(CK) || "{}")); } catch (e) {}
  const _renderCart = renderCart;
  window.renderCart = function () {
    _renderCart();
    try { localStorage.setItem(CK, JSON.stringify(cart)); } catch (e) {}
  };
  const clearCart = () => { Object.keys(cart).forEach(k => delete cart[k]); renderCart(); };
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const money = n => "₹" + Number(n).toFixed(2);

  window.openPremiumCheckout = function () {
    const items = cartItems();
    if (!items.length) { showStoreToast("पहले कार्ट में उत्पाद जोड़ें।", "error"); return; }
    document.getElementById("premiumCheckoutModal")?.remove();
    appliedCoupon = null;
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const m = document.createElement("main");
    m.id = "premiumCheckoutModal";
    m.className = "premium-checkout-page";
    m.style.cssText = "position:fixed;inset:0;z-index:100010;overflow-y:auto;background:#f7faf6;padding:22px;box-sizing:border-box;color:#173d2e;font-family:inherit";
    m.innerHTML = `<section class="premium-modal" style="margin:20px auto;max-height:none;width:min(100%,560px);box-sizing:border-box">
      <button type="button" class="premium-modal-close" aria-label="वापस जाएँ">×</button>
      <span class="premium-eyebrow">AASHAPURA • CHECKOUT</span>
      <div id="coStep1">
        <h2>डिलीवरी जानकारी</h2>
        <label>पूरा नाम<input id="coName" autocomplete="name" value="${escapeHTML($("profileName")?.value || $("customerName")?.value || signedInUser?.user_metadata?.full_name || "")}"></label>
        <label>मोबाइल नंबर<input id="coPhone" inputmode="tel" autocomplete="tel" value="${escapeHTML($("profilePhone")?.value || "")}"></label>
        <label>डिलीवरी का पता<textarea id="coAddress" autocomplete="street-address">${escapeHTML($("profileAddress")?.value || $("customerAddress")?.value || "")}</textarea></label>
        <label>कूपन कोड<span style="display:flex;gap:8px"><input id="coCode" placeholder="जैसे WELCOME10" style="flex:1"><button type="button" id="coApply" class="secondary-btn">लगाएँ</button></span></label>
        <div class="co-sum"><div><span>सबटोटल</span><span id="coSub"></span></div><div><span>छूट</span><span id="coDisc"></span></div><div class="tot"><span>कुल</span><strong id="coTotal"></strong></div></div>
        <button type="button" id="coPlace" class="premium-checkout-submit">ऑर्डर पक्का करें</button>
        <p class="premium-help">${signedInUser ? "ऑर्डर आपके 'मेरे ऑर्डर' में दिखेगा।" : "Sign In करने पर ऑर्डर 'मेरे ऑर्डर' में भी दिखेगा।"}</p>
      </div>
      <div id="coStep2" hidden></div></section>`;
    document.body.appendChild(m);
    const q = s => m.querySelector(s);
    const close = () => m.remove();
    q(".premium-modal-close").onclick = close;
    const calc = () => { const d = appliedCoupon ? appliedCoupon.discount : 0; return { d, total: Math.max(0, subtotal - d) }; };
    const paint = () => { const { d, total } = calc(); q("#coSub").textContent = money(subtotal); q("#coDisc").textContent = "−" + money(d); q("#coTotal").textContent = money(total); };
    paint();

    q("#coApply").onclick = async () => {
      const r = await validateStoreCoupon(q("#coCode").value, subtotal);
      if (!r.ok) appliedCoupon = null;
      showStoreToast(r.message, r.ok ? "success" : "error");
      paint();
    };

    q("#coPlace").onclick = async () => {
      const name = q("#coName").value.trim(), phone = q("#coPhone").value.trim(), address = q("#coAddress").value.trim();
      if (!name || !phone || !address) return showStoreToast("नाम, मोबाइल और पूरा पता भरें।", "error");
      if (!/^[0-9+\-\s]{10,15}$/.test(phone)) return showStoreToast("मोबाइल नंबर सही भरें।", "error");
      const btn = q("#coPlace"); btn.disabled = true; btn.textContent = "सेव हो रहा है…";
      const { d, total } = calc();
      const orderItems = items.map(i => ({ id: i.id, name: i.name, weight: i.weight, price: i.price, qty: i.qty }));
      let orderId = null, orderNo = null, saveErr = "";
      if (signedInUser) {
        const { data, error } = await supabaseClient.from("store_orders").insert({
          user_id: signedInUser.id, customer_name: name, customer_email: signedInUser.email || null, phone, address, delivery_address: address, items: orderItems,
          subtotal, discount: d, total, coupon_code: appliedCoupon?.code || null,
          payment_status: "pending", order_status: "pending"
        }).select("id,order_no").single();
        if (error) { console.warn(error.message); saveErr = error.message; showStoreToast("ऑर्डर सेव नहीं हुआ; WhatsApp से भेज सकते हैं।", "error"); }
        else { orderId = data.id; orderNo = data.order_no || String(data.id); clearCart(); }
      }
      q("#coStep1").hidden = true;
      const s2 = q("#coStep2"); s2.hidden = false;
      const note = orderNo || "Aashapura";
      const qs = `pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("Aashapura Aurveda")}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
      const isAndroid = /android/i.test(navigator.userAgent);
      const upiLink = pkg => isAndroid ? `intent://pay?${qs}#Intent;scheme=upi;${pkg ? "package=" + pkg + ";" : ""}end` : `upi://pay?${qs}`;
      s2.innerHTML = `<h2>पेमेंट और ऑर्डर भेजें</h2>
        ${orderId ? `<p>ऑर्डर #${escapeHTML(String(orderNo))} सेव हो गया।</p>`
          : `<p class="small-note" style="color:#b42318">${signedInUser ? "ऑर्डर सेव नहीं हुआ: " + escapeHTML(saveErr) : "Sign In नहीं है, इसलिए ऑर्डर 'मेरे ऑर्डर' में सेव नहीं हुआ।"} WhatsApp से ऑर्डर भेज सकते हैं।</p>`}
        <p class="checkout-total">देय राशि <strong>${money(total)}</strong></p>
        <button type="button" class="primary-btn" id="coPayUpi" style="width:100%">${L("Pay with UPI app","UPI ऐप से पेमेंट करें")}</button>
        <div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap"><button type="button" class="secondary-btn" data-pkg="com.google.android.apps.nbu.paisa.user" style="flex:1">GPay</button><button type="button" class="secondary-btn" data-pkg="com.phonepe.app" style="flex:1">PhonePe</button><button type="button" class="secondary-btn" data-pkg="net.one97.paytm" style="flex:1">Paytm</button></div>
        <p class="small-note">ऐप न खुले तो UPI ID कॉपी करके अपने UPI ऐप में खुद पेमेंट करें, या नीचे का QR स्कैन करें।</p>
        <p><strong>${escapeHTML(UPI_ID)}</strong> <button type="button" id="coCopy" class="secondary-btn">कॉपी करें</button></p>
        <img src="upi-qr.jpg" alt="UPI QR" style="width:min(100%,240px);border-radius:12px;display:block;margin:8px 0">
        <button type="button" id="coWa" class="premium-checkout-submit">${L("Send order & payment screenshot on WhatsApp","WhatsApp पर ऑर्डर और पेमेंट स्क्रीनशॉट भेजें")}</button>
        <p class="premium-help">${L("After paying, tap the button below and send your payment screenshot in the WhatsApp chat. ⏳ Verification will take a few minutes. Your order will be confirmed after we check the payment. Status shows in My Orders.","पेमेंट के बाद नीचे बटन दबाकर WhatsApp चैट में पेमेंट का स्क्रीनशॉट भेजें। ⏳ वेरिफिकेशन में कुछ मिनट लगेंगे। पेमेंट जाँचकर ऑर्डर कन्फर्म होगा। स्टेटस 'मेरे ऑर्डर' में दिखेगा।")}</p>`;
      const openUpi = pkg => {
        window.location.href = upiLink(pkg);
        setTimeout(() => { if (!document.hidden) showStoreToast(L("UPI app did not open. Copy the UPI ID below or scan the QR.", "UPI ऐप नहीं खुला। नीचे UPI ID कॉपी करें या QR स्कैन करें।"), "error"); }, 2500);
      };
      s2.querySelector("#coPayUpi").onclick = () => openUpi("");
      s2.querySelectorAll("[data-pkg]").forEach(b => { b.onclick = () => openUpi(isAndroid ? b.dataset.pkg : ""); });
      s2.querySelector("#coCopy").onclick = async () => {
        try { await navigator.clipboard.writeText(UPI_ID); showStoreToast("UPI ID कॉपी हो गई।", "success"); }
        catch (e) { showStoreToast("कॉपी नहीं हुई: " + UPI_ID, "error"); }
      };
      s2.querySelector("#coWa").onclick = () => {
        const lines = items.map(i => `• ${i.name} (${i.weight || "standard"}) × ${i.qty} = ${money(i.price * i.qty)}`).join("\n");
        const msg = `नमस्ते Aashapura Aurveda,\n${orderId ? "ऑर्डर #" + orderNo + "\n" : ""}${lines}\n` +
          `सबटोटल: ${money(subtotal)}\n${d ? "छूट (" + appliedCoupon.code + "): −" + money(d) + "\n" : ""}कुल: ${money(total)}\n` +
          `नाम: ${name}\nमोबाइल: ${phone}\nपता: ${address}\n${L("I have paid. My payment screenshot is below.", "मैंने पेमेंट कर दिया है। पेमेंट का स्क्रीनशॉट नीचे भेज रहा/रही हूँ।")}\n${L("Please confirm my order.", "कृपया ऑर्डर कन्फर्म करें।")}`;
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
        if (!orderId) clearCart();
        else { try { supabaseClient.rpc("submit_order_utr", { p_id: String(orderId), p_utr: "WA-SCREENSHOT" }); } catch (e) {} }
        if (!window.open(url, "_blank", "noopener")) { window.location.href = url; return; }
        close(); closeCart();
      };
    };
  };
})();
