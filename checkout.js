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

  /* ===== DELIVERY SETTINGS (yahin se badlo) ===== */
  const DELIVERY = {
    charge: 49,          // delivery charge (₹) jab order chhota ho
    freeAbove: 499,      // is amount ya usse upar ka order (coupon ke baad) = FREE delivery
    blocked: [],         // jin pincode par delivery nahi: e.g. ["190001", "682001"]
    blockedPrefix: []    // jin pincode ke shuruaat par delivery nahi: e.g. ["19"] (Kashmir) 
  };
  const delFor = amt => (amt >= DELIVERY.freeAbove ? 0 : DELIVERY.charge);
  window.AASHAPURA_DELIVERY = DELIVERY;
  /* server rules (table store_rules, supabase_v34_security.sql) override the numbers above so UI and server always match */
  try { supabaseClient.from("store_rules").select("delivery_charge,free_above").eq("id", 1).maybeSingle().then(r => { if (r && r.data) { const c = Number(r.data.delivery_charge), f = Number(r.data.free_above); if (isFinite(c)) DELIVERY.charge = c; if (isFinite(f)) DELIVERY.freeAbove = f; } }).catch(() => {}); } catch (e) {}
  const pinLookup = async pin => {
    if (DELIVERY.blocked.includes(pin) || DELIVERY.blockedPrefix.some(x => pin.startsWith(x))) return { ok: false, msg: L("Sorry, we can't deliver to this pincode yet.", "माफ़ कीजिए, इस पिनकोड पर अभी डिलीवरी नहीं होती।") };
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 6000);
      const r = await fetch("https://api.postalpincode.in/pincode/" + pin, { signal: ctl.signal }); clearTimeout(t);
      const j = await r.json(); const x = j && j[0];
      if (x && x.Status === "Success" && x.PostOffice && x.PostOffice.length) {
        const po = x.PostOffice[0]; return { ok: true, area: [po.District, po.State].filter(Boolean).join(", "), state: po.State || "" };
      }
      return { ok: false, msg: L("Pincode not found. Please check it.", "पिनकोड नहीं मिला। कृपया जाँचें।") };
    } catch (e) { return { ok: true, area: "", unverified: true }; }
  };
  window.aashapuraPinLookup = pinLookup;

  const imgOfP = p => {
    let urls = [];
    try { const x = typeof p.images === "string" ? JSON.parse(p.images || "[]") : p.images; urls = Array.isArray(x) ? x.slice() : []; } catch (e) {}
    if (p.image_url && !urls.includes(p.image_url)) urls.unshift(p.image_url);
    return urls.filter(Boolean)[0] || "";
  };

  /* v15: Myntra-style checkout = Address step (saved addresses, change, add/edit, location) -> Payment step (bill + UPI + WhatsApp).
     Coupon and pincode check now live ONLY on the cart page. */
  window.openPremiumCheckout = function () {
    const AD = window.aashapuraAddr;
    if (!AD) { showStoreToast(L("Please reload the page and try again.", "कृपया पेज रीलोड करके फिर कोशिश करें।"), "error"); return; }
    if (window.aashapuraClampCart) window.aashapuraClampCart();
    const items = cartItems();
    if (!items.length) { showStoreToast("पहले कार्ट में उत्पाद जोड़ें।", "error"); return; }
    const old = document.getElementById("premiumCheckoutModal"); if (old) AD.ov.drop(old);
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const m = document.createElement("main");
    m.id = "premiumCheckoutModal"; m.className = "aa-page";
    m.innerHTML = `<div class="aa-wrap"><div class="aa-oh"><button type="button" class="aa-bk" aria-label="${L("Back", "वापस")}">←</button><b id="coTitle"></b></div><div id="coSteps"></div><div id="coStep1"></div><div id="coStep2" hidden></div></div>`;
    document.body.appendChild(m);
    AD.ov.push(m);
    const q = s => m.querySelector(s);
    const close = () => AD.ov.close(m);
    q(".aa-bk").onclick = close;
    const CBX = window.aashapuraCombos;
    const calc = () => { const cb = CBX ? CBX.calc(items) : { discount: 0, names: "" }; const cmb = cb.discount; const d = appliedCoupon ? Math.min(Number(appliedCoupon.discount) || 0, subtotal - cmb) : 0; const after = Math.max(0, subtotal - cmb - d); const del = delFor(after); return { d, cmb, cnames: cb.names, del, total: after + del }; };

    let addr = null;
    const showAddr = async () => {
      q("#coStep1").hidden = false; q("#coStep2").hidden = true;
      q("#coTitle").textContent = L("ADDRESS", "पता");
      q("#coSteps").innerHTML = AD.stepper(2);
      let list = await AD.load(true);
      if (!list.length) {
        const r = await AD.openForm({ first: true, select: true });
        if (!r) { close(); return; }
        list = await AD.load(true);
      }
      addr = AD.selected(list);
      if (!addr) { close(); return; }
      const th = items.slice(0, 4).map(i => { const im = imgOfP(i.product); return im ? `<img src="${escapeHTML(im)}" alt="">` : `<span class="em">${escapeHTML(i.product.emoji || "🌿")}</span>`; }).join("");
      q("#coStep1").innerHTML = `<div class="aa-card" style="margin-top:10px"><div class="aa-top"><b>${escapeHTML(addr.name)}</b>${AD.chip(addr)}<button type="button" class="aa-chg" id="coChange">${L("Change", "बदलें")}</button></div>${AD.html(addr)}<div class="aa-mob">${L("Mobile", "मोबाइल")}: <b>${escapeHTML(addr.phone)}</b></div></div>
        <div class="aa-lbl">${L("DELIVERY ESTIMATES", "डिलीवरी अनुमान")}</div>
        <div class="aa-est"><span class="th">${th}</span><span style="margin-left:10px">${L("Delivery between", "डिलीवरी")} <b>${escapeHTML(AD.estimate(addr.state))}</b></span></div>
        <p class="small-note" style="padding:12px 16px;margin:0">${signedInUser ? L("Your order will be saved in 'My Orders'. Payment options come next.", "ऑर्डर 'मेरे ऑर्डर' में सेव होगा। अगले स्टेप में पेमेंट दिखेगा।") : L("Sign In to see this order in 'My Orders'. Payment options come next.", "'मेरे ऑर्डर' में दिखाने के लिए Sign In करें। अगले स्टेप में पेमेंट दिखेगा।")}</p>
        <div class="aa-cta"><button type="button" id="coGo">${L("CONTINUE", "आगे बढ़ें")}</button></div>`;
      q("#coChange").onclick = async () => { await AD.openSelect(); showAddr(); };
      q("#coGo").onclick = place;
    };

    const place = async () => {
      const a = addr; if (!a) return;
      const btn = q("#coGo"); btn.disabled = true;
      const reset = () => { btn.disabled = false; btn.textContent = L("CONTINUE", "आगे बढ़ें"); };
      btn.textContent = L("Checking…", "जाँच हो रही है…");
      if (window.aashapuraRefreshStock) {
        await window.aashapuraRefreshStock(true);
        const bad = items.find(i => i.product.stock < i.qty);
        if (bad) {
          showStoreToast(bad.product.stock <= 0 ? L(`${bad.name} is out of stock now. Please update your bag.`, `${bad.name} अब स्टॉक में नहीं है। कार्ट अपडेट करें।`) : L(`Only ${bad.product.stock} of ${bad.name} left. Please update your bag.`, `${bad.name} सिर्फ़ ${bad.product.stock} बचा है। कार्ट अपडेट करें।`), "error");
          close(); try { window.renderCart(); window.renderCartPage(true); } catch (e) {} return;
        }
      }
      if (CBX) { try { await CBX.load(true); } catch (e) {} }
      const pin = a.pincode;
      const pr = await pinLookup(pin);
      if (!pr || !pr.ok) { reset(); return showStoreToast(pr && pr.msg ? pr.msg : L("Please check your pincode.", "कृपया पिनकोड जाँचें।"), "error"); }
      if (appliedCoupon) {
        const rc = await validateStoreCoupon(appliedCoupon.code, subtotal);
        if (!rc.ok) { appliedCoupon = null; showStoreToast(rc.message + " " + L("Please review your bag.", "कृपया कार्ट देखें।"), "error"); close(); try { window.renderCartPage(true); } catch (e) {} return; }
      }
      const name = a.name, phone = a.phone;
      const fullAddress = AD.text(a);
      const area = pr.area || [a.city, a.state].filter(Boolean).join(", ");
      const stt = pr.state || a.state;
      const etaCols = (() => { try { const e = window.aashapuraEta(stt); return { delivery_state: stt || null, exp_min: e.min.toISOString().slice(0, 10), exp_max: e.max.toISOString().slice(0, 10) }; } catch (x) { return {}; } })();
      btn.textContent = L("Saving…", "सेव हो रहा है…");
      const { d, cmb, cnames, del, total } = calc();
      const cCode = appliedCoupon ? appliedCoupon.code : "";
      const orderItems = items.map(i => ({ id: i.id, name: i.name, weight: i.weight, price: i.price, qty: i.qty }));
      let orderId = null, orderNo = null, saveErr = "";
      if (signedInUser) {
        const base = {
          user_id: signedInUser.id, customer_name: name, customer_email: signedInUser.email || null, phone, address: fullAddress, delivery_address: fullAddress, items: orderItems,
          subtotal, discount: d, total, coupon_code: cCode || null,
          payment_status: "pending", order_status: "pending"
        };
        const optional = { pincode: pin, delivery_charge: del, delivery_area: area || null, ...etaCols,
          address_type: a.address_type === "office" ? "office" : "home", open_sat: !!a.open_sat, open_sun: !!a.open_sun,
          combo_discount: cmb || 0, combo_names: cnames || null };
        let data = null, error = null;
        for (let t = 0; t < 14; t++) {
          ({ data, error } = await supabaseClient.from("store_orders").insert({ ...base, ...optional }).select("id,order_no").single());
          if (!error || !/column|schema/i.test(error.message || "")) break;
          const mm = (error.message || "").match(/'([a-z_]+)' column/i) || (error.message || "").match(/column \"([a-z_]+)\"/i);
          if (mm && Object.prototype.hasOwnProperty.call(optional, mm[1])) delete optional[mm[1]];
          else { for (const k of Object.keys(optional)) delete optional[k]; }
        }
        if (error && /PRICE_CHANGED|OUT_OF_STOCK|BAD_COUPON|BAD_PRODUCT|BAD_QTY|ORDER_RATE_LIMIT/.test(error.message || "")) {
          const m = error.message;
          showStoreToast(/ORDER_RATE_LIMIT/.test(m) ? L("Too many orders in a short time. Please try again after some time.", "थोड़े समय में बहुत ऑर्डर हुए। कुछ देर बाद कोशिश करें।")
            : /OUT_OF_STOCK/.test(m) ? L("An item just went out of stock. Please check your bag.", "कोई आइटम अभी स्टॉक से बाहर हो गया। कार्ट देखें।")
            : /BAD_COUPON/.test(m) ? L("Coupon is not valid any more. Please check your bag.", "कूपन अब मान्य नहीं है। कार्ट देखें।")
            : L("Prices have changed. Please refresh and check your bag.", "कीमतें बदल गई हैं। पेज रिफ्रेश करके कार्ट देखें।"), "error");
          reset(); try { appliedCoupon = null; window.renderCartPage(true); } catch (e) {} return;
        }
        if (error) { console.warn(error.message); saveErr = error.message; showStoreToast("ऑर्डर सेव नहीं हुआ; WhatsApp से भेज सकते हैं।", "error"); }
        else { orderId = data.id; orderNo = data.order_no || String(data.id); clearCart(); appliedCoupon = null; }
      }
      q("#coStep1").hidden = true;
      q("#coTitle").textContent = L("PAYMENT", "पेमेंट"); q("#coSteps").innerHTML = AD.stepper(3);
      const s2 = q("#coStep2"); s2.hidden = false; s2.className = "aa-pay";
      const note = orderNo || "Aashapura";
      const qs = `pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
      const isAndroid = /android/i.test(navigator.userAgent);
      const upiLink = pkg => isAndroid ? `intent://pay?${qs}#Intent;scheme=upi;${pkg ? "package=" + pkg + ";" : ""}end` : `upi://pay?${qs}`;
      s2.innerHTML = `${orderId ? `<p style="margin:12px 4px 0">${L("Order", "ऑर्डर")} #${escapeHTML(String(orderNo))} ${L("saved.", "सेव हो गया।")}</p>`
          : `<p class="small-note" style="color:#b42318">${signedInUser ? "ऑर्डर सेव नहीं हुआ: " + escapeHTML(saveErr) : "Sign In नहीं है, इसलिए ऑर्डर 'मेरे ऑर्डर' में सेव नहीं हुआ।"} WhatsApp से ऑर्डर भेज सकते हैं।</p>`}
        <div class="aa-bill" style="margin:10px 0"><h4>${L("Price Details", "प्राइस डिटेल")}</h4>
          <div><span>${L("Subtotal", "सबटोटल")}</span><span>${money(subtotal)}</span></div>
          ${cmb ? `<div><span>${L("Combo offer", "कॉम्बो ऑफ़र")}</span><span class="g">−${money(cmb)}</span></div>` : ""}
          ${d ? `<div><span>${L("Coupon", "कूपन")} (${escapeHTML(cCode)})</span><span class="g">−${money(d)}</span></div>` : ""}
          <div><span>${L("Delivery", "डिलीवरी")}</span><span class="${del ? "" : "g"}">${del ? money(del) : L("FREE", "फ्री")}</span></div>
          <div class="t"><span>${L("Total to pay", "देय राशि")}</span><span>${money(total)}</span></div></div>
        <div class="aa-card"><div class="aa-top"><b>${L("Delivering to", "डिलीवरी का पता")}: ${escapeHTML(name)}</b>${AD.chip(a)}</div>${AD.html(a)}<div class="aa-mob">${L("Mobile", "मोबाइल")}: ${escapeHTML(phone)}</div>
          <div class="aa-mob">📦 ${L("Delivery between", "डिलीवरी")} <b>${escapeHTML(AD.estimate(stt))}</b></div></div>
        <button type="button" class="primary-btn" id="coPayUpi" style="width:100%">${L("Pay with UPI app", "UPI ऐप से पेमेंट करें")}</button>
        <div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap"><button type="button" class="secondary-btn" data-pkg="com.google.android.apps.nbu.paisa.user" style="flex:1">GPay</button><button type="button" class="secondary-btn" data-pkg="com.phonepe.app" style="flex:1">PhonePe</button><button type="button" class="secondary-btn" data-pkg="net.one97.paytm" style="flex:1">Paytm</button></div>
        <p class="small-note">ऐप न खुले तो UPI ID कॉपी करके अपने UPI ऐप में खुद पेमेंट करें, या नीचे का QR स्कैन करें।</p>
        <p><strong>${escapeHTML(UPI_ID)}</strong> <button type="button" id="coCopy" class="secondary-btn">कॉपी करें</button></p>
        <img src="${escapeHTML(window.AASHAPURA_QR || "upi-qr.jpg")}" alt="UPI QR" style="width:min(100%,240px);border-radius:12px;display:block;margin:8px 0">
        <button type="button" id="coWa" class="premium-checkout-submit">${L("Send order & payment screenshot on WhatsApp", "WhatsApp पर ऑर्डर और पेमेंट स्क्रीनशॉट भेजें")}</button>
        <p class="premium-help">${L("After paying, tap the button below and send your payment screenshot in the WhatsApp chat. ⏳ Verification will take a few minutes. Your order will be confirmed after we check the payment. Status shows in My Orders.", "पेमेंट के बाद नीचे बटन दबाकर WhatsApp चैट में पेमेंट का स्क्रीनशॉट भेजें। ⏳ वेरिफिकेशन में कुछ मिनट लगेंगे। पेमेंट जाँचकर ऑर्डर कन्फर्म होगा। स्टेटस 'मेरे ऑर्डर' में दिखेगा।")}</p>`;
      m.scrollTop = 0;
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
        const msg = `नमस्ते Aashapura Ayurveda,\n${orderId ? "ऑर्डर #" + orderNo + "\n" : ""}${lines}\n` +
          `सबटोटल: ${money(subtotal)}\n${cmb ? "कॉम्बो ऑफ़र (" + cnames + "): −" + money(cmb) + "\n" : ""}${d ? "छूट (" + cCode + "): −" + money(d) + "\n" : ""}${L("Delivery", "डिलीवरी")}: ${del ? money(del) : L("FREE", "फ्री")}\nकुल: ${money(total)}\n` +
          `नाम: ${name}\nमोबाइल: ${phone}\nपता: ${fullAddress}\n${a.address_type === "office" ? "Office" : "Home"}${a.address_type === "office" ? " · Weekend: " + ([a.open_sat ? "Sat" : "", a.open_sun ? "Sun" : ""].filter(Boolean).join("+") || "No") : " · Weekend: OK"}\n${L("I have paid. My payment screenshot is below.", "मैंने पेमेंट कर दिया है। पेमेंट का स्क्रीनशॉट नीचे भेज रहा/रही हूँ।")}\n${L("Please confirm my order.", "कृपया ऑर्डर कन्फर्म करें।")}`;
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
        if (!orderId) { clearCart(); appliedCoupon = null; }
        else { try { supabaseClient.rpc("submit_order_utr", { p_id: String(orderId), p_utr: "WA-SCREENSHOT" }); } catch (e) {} }
        if (!window.open(url, "_blank", "noopener")) { window.location.href = url; return; }
        AD.ov.closeAll(); closeCart();
      };
    };
    showAddr();
  };
})();
