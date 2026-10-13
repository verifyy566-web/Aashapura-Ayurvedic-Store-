/* Professional site info: Footer + trust strip, policy pages (About, Contact, Shipping, Returns, Terms, Privacy, FAQ), floating WhatsApp button.
   >>> Apni details SIRF is CONFIG me badlo. Jo khali ("") hai wo website par dikhega hi nahi. <<< */
(function () {
  const CONFIG = {
    brand: "Aashapura Ayurveda",
    phone: "916367561630",          // WhatsApp / call number (91 ke saath)
    email: "",                      // e.g. "aashapuraayurveda@gmail.com"  (khali = nahi dikhega)
    address: "",                    // e.g. "Shop 1, Main Road, Pune, Maharashtra 411001" (khali = nahi dikhega)
    hours: "10 AM – 7 PM (Mon–Sat)",
    gst: "",                        // GST banne par yahan likho: "27ABCDE1234F1Z5"  -> footer me apne aap dikhega
    fssai: "",                      // FSSAI license number (agar ho)
    ayush: "",                      // AYUSH / Drug license number (agar ho)
    returnDays: 7,                  // delivery ke baad kitne din me return request
    instagram: "", facebook: "", youtube: ""   // poora link, e.g. "https://instagram.com/yourpage"
  };
  window.AASHAPURA_SITE = CONFIG;
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const D = () => window.AASHAPURA_DELIVERY || { charge: 49, freeAbove: 499 };
  const wa = txt => `https://wa.me/${CONFIG.phone}${txt ? "?text=" + encodeURIComponent(txt) : ""}`;
  const ph = "+" + CONFIG.phone.replace(/^(\d{2})(\d{5})(\d{5})$/, "$1 $2 $3");

  const css = document.createElement("style");
  css.textContent = `
  footer.sf-wrap{max-width:none;margin:0;padding:0;display:block;background:#0f3322;color:#cfe0d4;font-size:14px}
  .sf-in{max-width:1100px;margin:0 auto;padding:34px 20px 20px}
  .sf-trust{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:18px 20px;background:#f3f8ef;border-top:1px solid #e0e9da;color:#173d2e;text-align:center;font-size:13px;font-weight:600}
  .sf-trust div{display:flex;flex-direction:column;gap:4px;align-items:center}.sf-trust b{font-size:26px;font-weight:400}
  .sf-cols{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:26px}
  .sf h4{margin:0 0 10px;color:#fff;font-size:15px;letter-spacing:.3px}
  .sf a,.sf button.lk{display:block;color:#cfe0d4;text-decoration:none;background:none;border:0;padding:5px 0;font:inherit;text-align:left;cursor:pointer}.sf a:hover,.sf button.lk:hover{color:#fff}
  .sf p{margin:0 0 8px;line-height:1.55}.sf .br{display:flex;align-items:center;gap:10px;margin-bottom:10px;color:#fff}.sf .br span:first-child{font-size:32px}.sf .br strong{font-size:19px;display:block;line-height:1.1}.sf .br small{letter-spacing:2px;font-size:10px}
  .sf-lic{margin-top:14px;font-size:12.5px;color:#a9c2b0;line-height:1.7}
  .sf-bot{border-top:1px solid #234a36;margin-top:22px;padding-top:14px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:12.5px;color:#a9c2b0}
  .sf-soc{display:flex;gap:12px;margin-top:6px}.sf-soc a{display:inline;padding:0;text-decoration:underline}
  @media(max-width:700px){.sf-trust{grid-template-columns:1fr 1fr}.sf-cols{grid-template-columns:1fr 1fr}.sf-cols>div:first-child{grid-column:1/-1}}
  .wa-fab{position:fixed;right:14px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9000;width:56px;height:56px;border-radius:50%;background:#25d366;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(0,0,0,.28);text-decoration:none}
  .wa-fab svg{width:32px;height:32px;fill:#fff}
  body:has(#cartFullPage) .wa-fab,body:has(#productFullPage) .wa-fab,body:has(.aa-page) .wa-fab,body:has(.aa-ov) .wa-fab,body:has(#profilePage:not([hidden])) .wa-fab,body:has(#myOrdersPage:not([hidden])) .wa-fab,body:has(#siPage) .wa-fab,body.adm-mode .wa-fab{display:none!important}
  #siPage{position:fixed;inset:0;z-index:99500;background:#f6f8f4;overflow-y:auto;color:#173d2e;-webkit-overflow-scrolling:touch}
  .si-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:10px;background:#123c2b;color:#fff;padding:12px 14px;font-weight:700;font-size:17px}
  .si-top button{border:0;background:none;color:#fff;font-size:24px;line-height:1;padding:2px 8px;cursor:pointer}
  .si-in{max-width:760px;margin:0 auto;padding:18px 16px 60px;line-height:1.7}
  .si-in h2{margin:22px 0 6px;font-size:18px;color:#14402b}.si-in h2:first-child{margin-top:4px}.si-in p,.si-in li{font-size:15px;color:#2f4a3c}.si-in ul{padding-left:20px;margin:6px 0}
  .si-card{background:#fff;border:1px solid #dfe8da;border-radius:14px;padding:14px 16px;margin:12px 0}
  .si-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:12px;padding:13px 18px;font-weight:700;text-decoration:none;margin:6px 8px 0 0;font-size:15px}
  .si-btn.g{background:#25d366;color:#fff}.si-btn.d{background:#14402b;color:#fff}
  .si-in details{background:#fff;border:1px solid #dfe8da;border-radius:12px;margin:8px 0;padding:0}.si-in summary{padding:13px 14px;font-weight:700;cursor:pointer;color:#14402b;list-style:none}.si-in summary::-webkit-details-marker{display:none}.si-in summary:after{content:"＋";float:right}.si-in details[open] summary:after{content:"－"}
  .si-in details p{margin:0;padding:0 14px 14px}
  .si-tbl{width:100%;border-collapse:collapse;margin:8px 0;background:#fff;border-radius:10px;overflow:hidden}.si-tbl td,.si-tbl th{border:1px solid #e3eadf;padding:9px 10px;text-align:left;font-size:14px}.si-tbl th{background:#eef5ea}`;
  document.head.appendChild(css);

  /* ---------------- page content ---------------- */
  const P = {
    about: () => ({
      title: L("About Us", "हमारे बारे में"),
      html: `<h2>${L("Our story", "हमारी कहानी")}</h2>
      <p>${L(`${CONFIG.brand} brings pure Ayurvedic products for everyday wellness – herbal powders, hair care, skin care and immunity support – made with traditional herbs like Ashwagandha, Amla and Moringa.`, `${CONFIG.brand} रोज़ की सेहत के लिए शुद्ध आयुर्वेदिक प्रोडक्ट लाता है – हर्बल पाउडर, हेयर केयर, स्किन केयर और इम्युनिटी – अश्वगंधा, आँवला और मोरिंगा जैसी पारंपरिक जड़ी-बूटियों से।`)}</p>
      <h2>${L("What we promise", "हमारा वादा")}</h2>
      <ul><li>${L("Only Ayurvedic and herbal products", "सिर्फ़ आयुर्वेदिक और हर्बल प्रोडक्ट")}</li><li>${L("Honest prices – what you see is what you pay", "ईमानदार दाम – जो दिखे वही देना है")}</li><li>${L("Careful packing and tracked delivery", "सावधानी से पैकिंग और ट्रैकिंग के साथ डिलीवरी")}</li><li>${L("Real human support on WhatsApp", "WhatsApp पर असली इंसान से सपोर्ट")}</li><li>${L("Easy returns for damaged or wrong items", "डैमेज या गलत आइटम पर आसान रिटर्न")}</li></ul>
      <p style="font-size:13px;color:#6a7d70">${L("Ayurvedic products are traditional wellness aids and are not a substitute for medical treatment. Please consult a doctor for any health condition.", "आयुर्वेदिक प्रोडक्ट परंपरागत वेलनेस के लिए हैं और इलाज का विकल्प नहीं हैं। किसी भी बीमारी में डॉक्टर से सलाह लें।")}</p>`
    }),
    contact: () => ({
      title: L("Contact Us", "संपर्क करें"),
      html: `<div class="si-card"><b>${esc(CONFIG.brand)}</b><p>${L("Order help, product questions, payment or delivery – message us anytime.", "ऑर्डर, प्रोडक्ट, पेमेंट या डिलीवरी – कभी भी मैसेज करें।")}</p>
        <a class="si-btn g" href="${wa("Hello Aashapura Ayurveda, I need help.")}" target="_blank" rel="noopener">💬 WhatsApp</a><a class="si-btn d" href="tel:+${CONFIG.phone}">📞 ${L("Call", "कॉल")} ${esc(ph)}</a></div>
        <div class="si-card"><p>🕘 <b>${L("Support hours", "सपोर्ट समय")}:</b> ${esc(CONFIG.hours)}</p>${CONFIG.email ? `<p>✉️ <b>Email:</b> <a href="mailto:${esc(CONFIG.email)}">${esc(CONFIG.email)}</a></p>` : ""}${CONFIG.address ? `<p>📍 <b>${L("Address", "पता")}:</b> ${esc(CONFIG.address)}</p>` : ""}
        <p>${L("For order issues, please send your Order No. (like AA261012-0006) so we can help faster.", "ऑर्डर की समस्या में अपना ऑर्डर नंबर (जैसे AA261012-0006) भेजें, ताकि जल्दी मदद हो सके।")}</p></div>`
    }),
    shipping: () => ({
      title: L("Shipping Policy", "शिपिंग पॉलिसी"),
      html: `<h2>${L("Delivery charges", "डिलीवरी शुल्क")}</h2><table class="si-tbl"><tr><th>${L("Order value", "ऑर्डर राशि")}</th><th>${L("Delivery", "डिलीवरी")}</th></tr><tr><td>${L("Below", "से कम")} ₹${D().freeAbove}</td><td>₹${D().charge}</td></tr><tr><td>₹${D().freeAbove} ${L("and above", "या उससे ज़्यादा")}</td><td><b>${L("FREE", "फ्री")}</b></td></tr></table>
      <p style="font-size:13px;color:#6a7d70">${L("Free-delivery amount is checked after coupon and combo discounts.", "फ्री डिलीवरी की राशि कूपन और कॉम्बो छूट के बाद देखी जाती है।")}</p>
      <h2>${L("Delivery time", "डिलीवरी का समय")}</h2><table class="si-tbl"><tr><td>Maharashtra</td><td>4–5 ${L("days", "दिन")}</td></tr><tr><td>${L("Rest of India", "बाकी भारत")}</td><td>6–7 ${L("days", "दिन")}</td></tr></table>
      <p>${L("Time starts after your payment is confirmed. Remote pincodes or festivals may take a little longer.", "समय पेमेंट कन्फर्म होने के बाद से गिना जाता है। दूर के पिनकोड या त्योहार में थोड़ा ज़्यादा लग सकता है।")}</p>
      <h2>${L("Tracking", "ट्रैकिंग")}</h2><p>${L("After shipping you can see courier name, tracking ID and live location updates in My Orders → Track order.", "शिप होने के बाद कूरियर, ट्रैकिंग ID और लाइव लोकेशन 'मेरे ऑर्डर' → Track order में दिखते हैं।")}</p>
      <h2>${L("Weekend & address", "वीकेंड और पता")}</h2><p>${L("Please give a correct address and pincode. For office addresses, tell us if Saturday/Sunday delivery is possible when you save the address.", "सही पता और पिनकोड दें। ऑफिस के पते पर शनिवार/रविवार डिलीवरी हो सकती है या नहीं, पता सेव करते समय बताएँ।")}</p>`
    }),
    returns: () => ({
      title: L("Returns & Refunds", "रिटर्न और रिफंड"),
      html: `<h2>${L("Cancel an order", "ऑर्डर कैंसल करें")}</h2><p>${L("You can cancel before the order is shipped from My Orders. Paid amount is refunded to your UPI within 24 hours.", "शिप होने से पहले 'मेरे ऑर्डर' से कैंसल कर सकते हैं। दी हुई राशि 24 घंटे में आपके UPI में लौटा दी जाती है।")}</p>
      <h2>${L("Return a product", "प्रोडक्ट रिटर्न करें")}</h2><ul><li>${L(`Request within ${CONFIG.returnDays} days of delivery from My Orders → Return / Refund.`, `डिलीवरी के ${CONFIG.returnDays} दिन के अंदर 'मेरे ऑर्डर' → Return / Refund से रिक्वेस्ट करें।`)}</li><li>${L("Return is accepted for damaged, leaking, wrong or expired items.", "डैमेज, लीक, गलत या एक्सपायर्ड आइटम का रिटर्न लिया जाता है।")}</li><li>${L("Add clear photos/video of the product and the parcel – required for damage or quality issues.", "प्रोडक्ट और पार्सल की साफ़ फोटो/वीडियो जोड़ें – डैमेज या क्वालिटी की समस्या में ज़रूरी है।")}</li><li>${L("Opened or used products cannot be returned unless damaged or wrong.", "खोले या इस्तेमाल हुए प्रोडक्ट रिटर्न नहीं होते, जब तक डैमेज या गलत न हों।")}</li></ul>
      <h2>${L("How it works", "प्रोसेस कैसे चलता है")}</h2><ul><li>${L("We review your request and approve or reject it.", "हम रिक्वेस्ट देखकर मंज़ूर या अस्वीकार करते हैं।")}</li><li>${L("If approved, pickup is scheduled.", "मंज़ूर होने पर पिकअप तय होता है।")}</li><li>${L("After pickup is confirmed, refund is sent to your UPI within 24 hours.", "पिकअप कन्फर्म होने के बाद 24 घंटे में रिफंड आपके UPI में भेजा जाता है।")}</li></ul>
      <p>${L("Status of every request shows in Returns & Refunds.", "हर रिक्वेस्ट का स्टेटस Returns & Refunds में दिखता है।")}</p>`
    }),
    terms: () => ({
      title: L("Terms & Conditions", "नियम और शर्तें"),
      html: `<h2>1. ${L("Orders", "ऑर्डर")}</h2><p>${L("An order is confirmed only after we verify your payment. We may cancel an order (with full refund) if an item is out of stock or the address is not serviceable.", "पेमेंट वेरिफाई होने के बाद ही ऑर्डर कन्फर्म होता है। स्टॉक न होने या पता सर्विस एरिया में न होने पर हम ऑर्डर कैंसल कर सकते हैं (पूरा रिफंड)।")}</p>
      <h2>2. ${L("Prices & payment", "दाम और पेमेंट")}</h2><p>${L("Prices are in Indian Rupees. Payment is by UPI; after paying, send the payment screenshot on WhatsApp. Prices and offers can change without notice.", "दाम भारतीय रुपये में हैं। पेमेंट UPI से होता है; पेमेंट के बाद WhatsApp पर स्क्रीनशॉट भेजें। दाम और ऑफ़र बिना सूचना बदल सकते हैं।")}</p>
      <h2>3. ${L("Offers", "ऑफ़र")}</h2><p>${L("Coupons and combo offers are valid as shown at checkout and cannot be exchanged for cash.", "कूपन और कॉम्बो ऑफ़र चेकआउट में दिखाए अनुसार मान्य हैं, नकद में नहीं बदले जा सकते।")}</p>
      <h2>4. ${L("Health", "स्वास्थ्य")}</h2><p>${L("Our products are Ayurvedic/herbal wellness products and are not medicines for any disease. Read the usage and precautions on the product page. Consult a doctor if you are pregnant, nursing, on medication or have a medical condition.", "हमारे प्रोडक्ट आयुर्वेदिक/हर्बल वेलनेस प्रोडक्ट हैं, किसी बीमारी की दवा नहीं। प्रोडक्ट पेज पर उपयोग और सावधानियाँ पढ़ें। गर्भावस्था, दवा या बीमारी में डॉक्टर से सलाह लें।")}</p>
      <h2>5. ${L("Shipping, returns, privacy", "शिपिंग, रिटर्न, प्राइवेसी")}</h2><p>${L("Please read our Shipping Policy, Returns & Refunds and Privacy Policy – they are part of these terms.", "कृपया हमारी शिपिंग पॉलिसी, रिटर्न और रिफंड तथा प्राइवेसी पॉलिसी पढ़ें – ये इन शर्तों का हिस्सा हैं।")}</p>
      <h2>6. ${L("Contact", "संपर्क")}</h2><p>${L("Questions? WhatsApp us at", "सवाल? WhatsApp करें:")} ${esc(ph)}.</p>`
    }),
    faq: () => {
      const q = [
        [L("How do I pay?", "पेमेंट कैसे करें?"), L("Pay by any UPI app (GPay, PhonePe, Paytm). After paying, tap 'Send order & payment screenshot on WhatsApp'. We confirm your order after checking the payment.", "किसी भी UPI ऐप (GPay, PhonePe, Paytm) से पेमेंट करें। फिर 'WhatsApp पर ऑर्डर और स्क्रीनशॉट भेजें' दबाएँ। पेमेंट जाँचकर हम ऑर्डर कन्फर्म करते हैं।")],
        [L("How long does delivery take?", "डिलीवरी में कितना समय लगता है?"), L("Maharashtra 4–5 days, rest of India 6–7 days after confirmation.", "महाराष्ट्र 4–5 दिन, बाकी भारत 6–7 दिन (कन्फर्म होने के बाद)।")],
        [L("Is there a delivery charge?", "क्या डिलीवरी शुल्क लगता है?"), L(`₹${D().charge} for orders below ₹${D().freeAbove}; FREE above that.`, `₹${D().freeAbove} से कम के ऑर्डर पर ₹${D().charge}; उससे ऊपर फ्री।`)],
        [L("How do I track my order?", "ऑर्डर कैसे ट्रैक करूँ?"), L("Sign in → My Orders → Track order. You will see courier, tracking ID and live location.", "Sign In → मेरे ऑर्डर → Track order। कूरियर, ट्रैकिंग ID और लाइव लोकेशन दिखेगी।")],
        [L("Can I cancel my order?", "क्या ऑर्डर कैंसल हो सकता है?"), L("Yes, before it is shipped. Refund comes to your UPI within 24 hours.", "हाँ, शिप होने से पहले। रिफंड 24 घंटे में UPI में आता है।")],
        [L("How do I return a product?", "प्रोडक्ट कैसे रिटर्न करूँ?"), L(`My Orders → Return / Refund within ${CONFIG.returnDays} days of delivery, with photos/video if damaged.`, `डिलीवरी के ${CONFIG.returnDays} दिन में मेरे ऑर्डर → Return / Refund, डैमेज हो तो फोटो/वीडियो के साथ।`)],
        [L("What is a combo offer?", "कॉम्बो ऑफ़र क्या है?"), L("Buy the listed products together and the combo discount is applied automatically in your bag.", "बताए गए प्रोडक्ट साथ लें तो कॉम्बो छूट कार्ट में अपने आप लग जाती है।")],
        [L("Are the products safe?", "क्या प्रोडक्ट सुरक्षित हैं?"), L("They are Ayurvedic/herbal wellness products. Read usage and precautions on each product page and consult a doctor if you have a medical condition.", "ये आयुर्वेदिक/हर्बल वेलनेस प्रोडक्ट हैं। हर प्रोडक्ट पेज पर उपयोग और सावधानियाँ पढ़ें; बीमारी हो तो डॉक्टर से पूछें।")],
        [L("I did not get my order update.", "मुझे ऑर्डर अपडेट नहीं मिला।"), L("Message us on WhatsApp with your Order No.", "अपने ऑर्डर नंबर के साथ WhatsApp पर मैसेज करें।")]
      ];
      return { title: "FAQ", html: q.map(x => `<details><summary>${esc(x[0])}</summary><p>${esc(x[1])}</p></details>`).join("") + `<a class="si-btn g" href="${wa("Hello, I have a question.")}" target="_blank" rel="noopener">💬 ${L("Ask on WhatsApp", "WhatsApp पर पूछें")}</a>` };
    }
  };

  let open = null;
  function close(fromPop) {
    const el = document.getElementById("siPage"); if (el) el.remove();
    if (open && !fromPop) { try { history.back(); } catch (e) {} }
    open = null; document.body.style.overflow = "";
  }
  function show(id) {
    if (id === "privacy") { window.open("privacy.html", "_blank", "noopener"); return; }
    if (!P[id]) return;
    const d = P[id](); const old = document.getElementById("siPage"); if (old) old.remove();
    const el = document.createElement("main"); el.id = "siPage";
    el.innerHTML = `<div class="si-top"><button type="button" aria-label="Back">←</button><span>${esc(d.title)}</span></div><div class="si-in">${d.html}</div>`;
    document.body.appendChild(el); document.body.style.overflow = "hidden";
    el.querySelector("button").onclick = () => close(false);
    if (!open) { try { history.pushState({ si: id }, ""); } catch (e) {} }
    open = id; el.scrollTop = 0;
  }
  window.addEventListener("popstate", () => { if (open) close(true); });
  window.aashapuraInfo = { open: show, close };

  /* ---------------- footer ---------------- */
  function buildFooter() {
    const f = document.querySelector("footer"); if (!f) return;
    f.className = "sf-wrap";
    const lic = [CONFIG.gst && "GSTIN: " + CONFIG.gst, CONFIG.fssai && "FSSAI: " + CONFIG.fssai, CONFIG.ayush && "AYUSH/Drug Lic: " + CONFIG.ayush].filter(Boolean);
    const soc = [["Instagram", CONFIG.instagram], ["Facebook", CONFIG.facebook], ["YouTube", CONFIG.youtube]].filter(x => x[1]);
    f.innerHTML = `<div class="sf-trust"><div><b>🌿</b>${L("100% Ayurvedic", "100% आयुर्वेदिक")}</div><div><b>🚚</b>${L("Free delivery above", "फ्री डिलीवरी")} ₹${D().freeAbove}</div><div><b>🔒</b>${L("Secure UPI payment", "सुरक्षित UPI पेमेंट")}</div><div><b>↩️</b>${L("Easy returns", "आसान रिटर्न")}</div></div>
    <div class="sf"><div class="sf-in"><div class="sf-cols">
      <div><div class="br"><span>✿</span><span><strong>Aashapura</strong><small>AYURVEDA</small></span></div><p>${L("Pure Ayurvedic products for everyday wellness.", "रोज़ की सेहत के लिए शुद्ध आयुर्वेदिक प्रोडक्ट।")}</p>
        <p>💬 <a style="display:inline" href="${wa()}" target="_blank" rel="noopener">${esc(ph)}</a>${CONFIG.email ? `<br>✉️ <a style="display:inline" href="mailto:${esc(CONFIG.email)}">${esc(CONFIG.email)}</a>` : ""}${CONFIG.address ? `<br>📍 ${esc(CONFIG.address)}` : ""}<br>🕘 ${esc(CONFIG.hours)}</p>
        ${soc.length ? `<div class="sf-soc">${soc.map(s => `<a href="${esc(s[1])}" target="_blank" rel="noopener">${s[0]}</a>`).join("")}</div>` : ""}</div>
      <div><h4>${L("Help", "मदद")}</h4><button class="lk" data-si="contact">${L("Contact Us", "संपर्क करें")}</button><button class="lk" data-si="faq">FAQ</button><button class="lk" data-si="shipping">${L("Shipping Policy", "शिपिंग पॉलिसी")}</button><button class="lk" data-si="returns">${L("Returns & Refunds", "रिटर्न और रिफंड")}</button></div>
      <div><h4>${L("Company", "कंपनी")}</h4><button class="lk" data-si="about">${L("About Us", "हमारे बारे में")}</button><button class="lk" data-si="terms">${L("Terms & Conditions", "नियम और शर्तें")}</button><button class="lk" data-si="privacy">${L("Privacy Policy", "प्राइवेसी पॉलिसी")}</button></div>
    </div>${lic.length ? `<div class="sf-lic">${lic.map(esc).join(" &nbsp;|&nbsp; ")}</div>` : ""}
    <div class="sf-bot"><span>© ${new Date().getFullYear()} ${esc(CONFIG.brand)}. ${L("All rights reserved.", "सर्वाधिकार सुरक्षित।")}</span><span>${L("Ayurvedic products are not a substitute for medical treatment.", "आयुर्वेदिक प्रोडक्ट इलाज का विकल्प नहीं हैं।")}</span></div></div></div>`;
    f.onclick = e => { const b = e.target.closest("[data-si]"); if (b) show(b.dataset.si); };
  }

  /* header nav: About / Contact open the new pages */
  document.addEventListener("click", e => {
    const a = e.target.closest('#nav a[href="#about"],#nav a[href="#contact"]'); if (!a) return;
    e.preventDefault(); show(a.getAttribute("href").slice(1));
    const n = document.getElementById("nav"); if (n) n.classList.remove("nav-open");
  });

  /* floating WhatsApp button */
  function fab() {
    if (document.querySelector(".wa-fab")) return;
    const a = document.createElement("a"); a.className = "wa-fab"; a.href = wa("Hello Aashapura Ayurveda, I have a question."); a.target = "_blank"; a.rel = "noopener"; a.setAttribute("aria-label", "WhatsApp");
    a.innerHTML = `<svg viewBox="0 0 32 32"><path d="M16.04 3C9.4 3 4 8.38 4 15.02c0 2.12.55 4.19 1.6 6.01L4 29l8.18-1.57a12 12 0 0 0 3.86.63C22.68 28.06 28 22.68 28 16.04 28 9.4 22.68 3 16.04 3zm0 22.04c-1.2 0-2.38-.2-3.5-.6l-.5-.18-4.86.93.95-4.73-.2-.5a9.95 9.95 0 0 1-1.6-5.4c0-5.5 4.5-9.97 10.05-9.97 5.5 0 10 4.47 10 9.97 0 5.5-4.5 10.48-10.34 10.48zm5.55-7.4c-.3-.16-1.8-.9-2.08-1-.28-.1-.48-.15-.68.15s-.78 1-.96 1.2c-.18.2-.35.22-.65.07-.3-.15-1.28-.47-2.44-1.5a9.2 9.2 0 0 1-1.7-2.1c-.18-.3 0-.47.13-.62.14-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.65-.93-2.25-.25-.58-.5-.5-.68-.5h-.58c-.2 0-.53.08-.8.38s-1.05 1.03-1.05 2.5 1.08 2.9 1.23 3.1c.15.2 2.1 3.2 5.1 4.5.7.3 1.27.5 1.7.62.72.23 1.37.2 1.88.12.57-.08 1.8-.74 2.05-1.45.25-.7.25-1.3.18-1.43-.08-.12-.28-.2-.58-.35z"/></svg>`;
    document.body.appendChild(a);
  }
  function init() { buildFooter(); fab(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  setTimeout(() => { if (D().freeAbove) buildFooter(); }, 1800);   // refresh after server delivery rules load
})();
