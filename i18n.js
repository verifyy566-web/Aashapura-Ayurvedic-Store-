/* Aashapura Ayurveda — language layer. English is the main language; Hindi is optional. */
(function () {
  const KEY = "aashapura_lang";
  let lang = "en";
  try { lang = localStorage.getItem(KEY) || "en"; } catch (e) {}
  window.AASHAPURA_LANG = lang;

  const D = [
    ["Aashapura Ayurveda पर अपने पसंदीदा हर्बल उत्पाद खोजें और WhatsApp पर ऑर्डर भेजें।", "Discover your favourite herbal products at Aashapura Ayurveda and send your order on WhatsApp."],
    ["ऑर्डर और सवालों के लिए WhatsApp पर संपर्क करें।", "Contact us on WhatsApp for orders and questions."],
    ["WhatsApp खुलेगा और ऑर्डर का संदेश तैयार होगा। ऑर्डर तभी भेजा जाएगा जब आप WhatsApp में Send दबाएँगे।", "WhatsApp will open with your order message ready. The order is sent only when you press Send in WhatsApp."],
    ["ऐप न खुले तो UPI ID कॉपी करके अपने UPI ऐप में खुद पेमेंट करें, या नीचे का QR स्कैन करें।", "If the app does not open, copy the UPI ID and pay in your UPI app, or scan the QR below."],
    ["पेमेंट अपने-आप वेरिफाई नहीं होता; दुकान UTR जाँचकर कन्फर्म करेगी।", "Payment is not verified automatically; the store will confirm after checking the UTR."],
    ["पेमेंट की पुष्टि अपने-आप नहीं होती। UTR एडमिन द्वारा जाँचा जाएगा।", "Payment is not confirmed automatically. The UTR will be checked by the admin."],
    ["ऑर्डर सेव नहीं हुआ; WhatsApp से भेज सकते हैं।", "Order was not saved; you can send it on WhatsApp."],
    ["Sign In नहीं है, इसलिए ऑर्डर", "You are not signed in, so the order was not saved in"],
    ["में सेव नहीं हुआ।", "."],
    ["WhatsApp से ऑर्डर भेज सकते हैं।", "You can send the order on WhatsApp."],
    ["Sign In करने पर ऑर्डर", "After signing in, your order will also appear in"],
    ["में भी दिखेगा।", "."],
    ["ऑर्डर आपके", "Your order will appear in"],
    ["में दिखेगा।", "."],
    ["प्रोडक्ट खोजें, कार्ट में जोड़ें और ऑर्डर भेजें", "Find products, add to cart and send your order"],
    ["ऑर्डर भेजने से पहले अपना पता और मोबाइल नंबर जाँच लें।", "Please check your address and mobile number before sending the order."],
    ["कृपया उपलब्धता और डिलीवरी चार्ज की पुष्टि करें।", "Please confirm availability and delivery charges."],
    ["कृपया अपना नाम और डिलीवरी का पूरा पता भरें।", "Please enter your name and full delivery address."],
    ["Product name, सही price और stock भरें।", "Enter a product name, a valid price and stock."],
    ["Supabase की products Read Policy जाँचें।", "Check the Supabase products read policy."],
    ["इस अकाउंट को Admin की अनुमति नहीं है।", "This account does not have admin permission."],
    ["Email और password भरें।", "Enter email and password."],
    ["Admin login करें।", "Please log in as admin."],
    ["को स्थायी रूप से हटाएँ?", "— delete permanently?"],
    ["अपने ऑर्डर देखने के लिए Sign In करें।", "Sign in to see your orders."],
    ["रिव्यू लिखने के लिए Sign In करें", "Sign in to write a review"],
    ["पहले Sign In करें।", "Please sign in first."],
    ["Sign In शुरू नहीं हुआ:", "Sign In could not start:"],
    ["उत्पाद नहीं मिला। दुकान दोबारा खोलें।", "Product not found. Please reopen the shop."],
    ["प्रोडक्ट की जानकारी उपलब्ध नहीं है।", "Product details are not available."],
    ["स्टॉक में इतना ही उपलब्ध है।", "That is all we have in stock."],
    ["पहले कार्ट में उत्पाद जोड़ें।", "Add products to the cart first."],
    ["नाम, मोबाइल और पूरा पता भरें।", "Enter your name, mobile and full address."],
    ["नाम, मोबाइल और पता भरें।", "Enter your name, mobile and address."],
    ["मोबाइल नंबर सही भरें।", "Enter a valid mobile number."],
    ["10 अंकों का मोबाइल नंबर", "10-digit mobile number"],
    ["मकान/गली, शहर, पिन कोड", "House/street, city, PIN code"],
    ["मकान, गाँव/शहर, पिन कोड", "House, village/city, PIN code"],
    ["मकान, गली, शहर, पिन कोड", "House, street, city, PIN code"],
    ["वैकल्पिक, काटी हुई कीमत", "optional, strike-through price"],
    ["उत्पाद कैसा लगा?", "How was the product?"],
    ["वैकल्पिक", "optional"],
    ["रिव्यू लिखने के लिए", "To write a review"],
    ["रिव्यू सबमिट करें", "Submit review"],
    ["अपना रिव्यू बदलें", "Edit your review"],
    ["अपना रिव्यू लिखें", "Write your review"],
    ["रिव्यू लोड हो रहे हैं", "Loading reviews"],
    ["रिव्यू लोड नहीं हुए", "Could not load reviews"],
    ["रिव्यू सेव नहीं हुआ", "Review was not saved"],
    ["रिव्यू सेव हो गया। धन्यवाद", "Review saved. Thank you"],
    ["अभी कोई रिव्यू नहीं है।", "No reviews yet."],
    ["अभी कोई रिव्यू नहीं", "No reviews yet"],
    ["यह रिव्यू हटाएँ?", "Delete this review?"],
    ["पहले स्टार रेटिंग चुनें।", "Please select a star rating first."],
    ["हट नहीं पाया", "Could not delete"],
    ["आपको ये भी पसंद आ सकते हैं", "You may also like"],
    ["आपके ऑर्डर लोड हो रहे हैं", "Loading your orders"],
    ["ऑर्डर लोड नहीं हो सके।", "Could not load orders."],
    ["अभी आपका कोई ऑर्डर नहीं है।", "You have no orders yet."],
    ["प्रोफ़ाइल लोड नहीं हुई", "Could not load profile"],
    ["प्रोफ़ाइल सेव हो गई।", "Profile saved."],
    ["प्रोफ़ाइल सेव करें", "Save profile"],
    ["प्रोफ़ाइल जानकारी", "Profile details"],
    ["उत्पाद लोड नहीं हुए", "Could not load products"],
    ["कोई उत्पाद नहीं मिला।", "No products found."],
    ["कूपन की अवधि समाप्त हो गई।", "This coupon has expired."],
    ["कूपन सही नहीं है।", "This coupon is not valid."],
    ["कूपन कोड लिखें।", "Enter a coupon code."],
    ["न्यूनतम ऑर्डर", "Minimum order"],
    ["होना चाहिए।", "required."],
    ["कूपन लागू:", "Coupon applied:"],
    ["की छूट", "discount"],
    ["Products लोड हो रहे हैं", "Loading products"],
    ["Products लोड नहीं हुए", "Could not load products"],
    ["अभी कोई product नहीं है।", "No products yet."],
    ["Product save नहीं हुआ", "Product was not saved"],
    ["Product सफलतापूर्वक सेव हुआ", "Product saved successfully"],
    ["Admin permission नहीं है।", "No admin permission."],
    ["Delete नहीं हुआ", "Could not delete"],
    ["Product delete हो गया।", "Product deleted."],
    ["ऑर्डर पक्का करें", "Confirm order"],
    ["कृपया ऑर्डर कन्फर्म करें।", "Please confirm my order."],
    ["ऑर्डर WhatsApp में तैयार है।", "Your order is ready in WhatsApp."],
    ["ऑर्डर सेव नहीं हुआ", "Order was not saved"],
    ["सेव हो रहा है", "Saving"],
    ["सेव नहीं हुआ", "Not saved"],
    ["सेव हो गया।", "Saved."],
    ["हो गया।", "done."],
    ["पेमेंट और ऑर्डर भेजें", "Payment & send order"],
    ["WhatsApp पर ऑर्डर भेजें", "Send order on WhatsApp"],
    ["UPI ऐप से पेमेंट करें", "Pay with UPI app"],
    ["UPI ऐप खोलें", "Open UPI app"],
    ["QR कोड स्कैन करें ↓", "Scan QR code ↓"],
    ["UPI ID कॉपी हो गई।", "UPI ID copied."],
    ["कॉपी नहीं हुई", "Could not copy"],
    ["(पेमेंट के बाद)", "(after payment)"],
    ["पेमेंट करने के बाद UTR भरें", "Enter the UTR after payment"],
    ["पेमेंट जानकारी", "Payment information"],
    ["पेमेंट स्टेटस", "Payment status"],
    ["UPI पेमेंट", "UPI Payment"],
    ["UPI से", "UPI"],
    ["पेमेंट करें", "Payment"],
    ["देय राशि", "Amount payable"],
    ["कुल राशि", "Total amount"],
    ["ऑर्डर कुल", "Order total"],
    ["ऑर्डर स्टेटस", "Order status"],
    ["ऑर्डर के प्रोडक्ट", "Items in order"],
    ["मुझे यह ऑर्डर करना है", "I would like to place this order"],
    ["नमस्ते", "Hello"],
    ["WhatsApp पर चैट करें", "Chat on WhatsApp"],
    ["WhatsApp पर आसान ऑर्डर", "Easy ordering on WhatsApp"],
    ["आपके पते पर डिलीवरी", "Delivery to your address"],
    ["कीमत: कम से ज़्यादा", "Price: Low to High"],
    ["कीमत: ज़्यादा से कम", "Price: High to Low"],
    ["कीमत के अनुसार", "Sort by price"],
    ["सभी करों सहित", "Inclusive of all taxes"],
    ["साफ़ कीमतें", "Clear prices"],
    ["मोबाइल-फ्रेंडली", "Mobile-friendly"],
    ["आसान ऑर्डर", "Easy ordering"],
    ["प्राकृतिक देखभाल", "Natural care"],
    ["प्रकृति से प्रेरित", "Inspired by nature"],
    ["सेहत और देखभाल,", "Health and care,"],
    ["प्रकृति के साथ।", "with nature."],
    ["नैचुरल चॉइस", "Natural Choice"],
    ["हमारा कलेक्शन", "Our Collection"],
    ["से चुनें", "our collection"],
    ["हमारा उद्देश्य", "Our Purpose"],
    ["प्रकृति की शक्ति,", "Nature's power,"],
    ["आयुर्वेद की परंपरा।", "the Ayurvedic tradition."],
    ["शुद्ध जड़ी-बूटियों और सदियों पुराने आयुर्वेदिक ज्ञान से बने उत्पाद, आपके और आपके परिवार के स्वस्थ जीवन के लिए।", "Products made with pure herbs and centuries-old Ayurvedic wisdom, for the healthy life of you and your family."],
    ["हमारे बारे में", "About Us"],
    ["हमसे", "Talk"],
    ["बात करें", "to us"],
    ["उत्पाद की जानकारी", "Product information"],
    ["उत्पाद देखें", "View products"],
    ["उत्पाद खोजें", "Search products"],
    ["प्रोडक्ट वीडियो देखें", "Watch product video"],
    ["वीडियो देखें", "Watch video"],
    ["कार्ट में जोड़ा गया", "added to cart"],
    ["कार्ट में जोड़ें", "Add to Cart"],
    ["कार्ट बंद करें", "Close cart"],
    ["आपका कार्ट अभी खाली है।", "Your cart is empty."],
    ["आपका कार्ट खाली है।", "Your cart is empty."],
    ["आपका कार्ट", "Your Cart"],
    ["शॉपिंग कार्ट", "Shopping cart"],
    ["अभी खरीदें", "Buy Now"],
    ["ऑर्डर करें", "Place Order"],
    ["स्टोर पर वापस", "Back to store"],
    ["वापस दुकान पर", "Back to shop"],
    ["वापस जाएँ", "Go back"],
    ["ग्राहक स्टोर", "Customer store"],
    ["ग्राहक रिव्यू", "Customer reviews"],
    ["ग्राहक", "Customer"],
    ["डिलीवरी जानकारी", "Delivery details"],
    ["डिलीवरी का पता", "Delivery address"],
    ["मोबाइल नंबर", "Mobile number"],
    ["पूरा नाम", "Full name"],
    ["आपका नाम", "Your name"],
    ["आपका अकाउंट", "Your account"],
    ["आपका खाता", "Your account"],
    ["मेरी प्रोफ़ाइल", "My Profile"],
    ["मेरे ऑर्डर", "My Orders"],
    ["लॉग आउट", "Log out"],
    ["कूपन कोड", "Coupon code"],
    ["जैसे", "e.g."],
    ["लगाएँ", "Apply"],
    ["पिछली फ़ोटो", "Previous photo"],
    ["अगली फ़ोटो", "Next photo"],
    ["सभी कैटेगरी", "All categories"],
    ["कैटेगरी", "Category"],
    ["वज़न / साइज़", "Weight / Size"],
    ["साइज़ चुनें", "Choose size"],
    ["साइज़:", "Size:"],
    ["मात्रा:", "Quantity:"],
    ["लिस्ट व्यू", "List view"],
    ["ग्रिड व्यू", "Grid view"],
    ["सिर्फ़", "Only"],
    ["बचे", "left"],
    ["स्टॉक खत्म", "Out of stock"],
    ["स्टॉक में", "In stock"],
    ["% छूट", "% off"],
    ["छूट", "Discount"],
    ["सबटोटल", "Subtotal"],
    ["तारीख:", "Date:"],
    ["ब्रांड", "Brand"],
    ["विवरण", "Description"],
    ["पसंदीदा", "Favourites"],
    ["फीचर्ड", "Featured"],
    ["वेलनेस", "Wellness"],
    ["हर्बल और आयुर्वेदिक उत्पाद।", "Herbal and Ayurvedic products."],
    ["हर्बल", "Herbal"],
    ["पाउडर", "Powder"],
    ["सभी", "All"],
    ["नाम:", "Name:"],
    ["पता:", "Address:"],
    ["मोबाइल:", "Mobile:"],
    ["कॉपी करें", "Copy"],
    ["संपर्क", "Contact"],
    ["दुकान", "Shop"],
    ["होम", "Home"],
    ["मेन्यू", "Menu"],
    ["कार्ट", "Cart"],
    ["रिव्यू", "Reviews"],
    ["हटाएँ", "Remove"],
    ["बंद करें", "Close"],
    ["वापस", "Back"],
    ["कुल", "Total"],
    ["उत्पाद", "Products"],
    ["ऑर्डर", "Order"],
    ["पेमेंट", "Payment"],
    ["से", "onwards"],
    ["दिया गया UPI QR कोड", "UPI QR code"],
    ["WhatsApp खुलेगा", "WhatsApp will open"]
  ].sort((a, b) => b[0].length - a[0].length);

  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const B = "\\u0900-\\u097F";
  const reEn = new RegExp("(?<![" + B + "])(?:" + D.map(x => esc(x[0])).join("|") + ")(?![" + B + "])", "g");
  const mapEn = new Map(D);
  const HI_NAME = [["Aashapura Ayurveda", "आशापुरा आयुर्वेद"], ["AASHAPURA", "आशापुरा"], ["Aashapura", "आशापुरा"], ["AYURVEDA", "आयुर्वेद"]];
  const reHi = new RegExp(HI_NAME.map(x => esc(x[0])).join("|"), "g");
  const mapHi = new Map(HI_NAME);

  function t(s) {
    if (typeof s !== "string" || !s) return s;
    let out;
    if (lang === "hi") out = s.replace(reHi, m => mapHi.get(m));
    else out = s.replace(reEn, m => mapEn.get(m)).replace(/\s+([.,!?;:])/g, "$1");
    return out;
  }
  window.I18N = { t, get lang() { return lang; } };

  /* translate WhatsApp text and dialogs */
  const _open = window.open;
  window.open = function (u, ...r) {
    try {
      if (typeof u === "string" && u.includes("wa.me") && u.includes("text=")) {
        const [a, q] = u.split("text=");
        u = a + "text=" + encodeURIComponent(t(decodeURIComponent(q)));
      }
    } catch (e) {}
    return _open.call(window, u, ...r);
  };
  ["alert", "confirm", "prompt"].forEach(n => { const f = window[n]; window[n] = (m, ...r) => f.call(window, t(String(m)), ...r); });

  const ATTRS = ["placeholder", "aria-label", "alt", "title"];
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { const v = t(root.nodeValue); if (v !== root.nodeValue) root.nodeValue = v; return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE)$/.test(root.tagName)) return;
    ATTRS.forEach(a => { if (root.hasAttribute(a)) { const o = root.getAttribute(a), v = t(o); if (v !== o) root.setAttribute(a, v); } });
    root.childNodes.forEach(walk);
  }
  const mo = new MutationObserver(ms => {
    mo.disconnect();
    ms.forEach(m => {
      if (m.type === "characterData") walk(m.target);
      else if (m.type === "attributes") walk(m.target);
      else m.addedNodes.forEach(walk);
    });
    start();
  });
  function start() { mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS }); }

  document.documentElement.lang = lang === "hi" ? "hi" : "en";
  start();

  /* Amazon-style Language Settings */
  function ui() {
    document.title = lang === "hi" ? "आशापुरा आयुर्वेद" : "Aashapura Ayurveda";
    walk(document.body);
    const css = document.createElement("style");
    css.textContent = ".lang-btn{background:transparent;border:1px solid currentColor;border-radius:999px;padding:6px 10px;font:inherit;cursor:pointer}" +
      ".lang-modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:none;align-items:center;justify-content:center;z-index:9999}" +
      ".lang-modal.open{display:flex}.lang-box{background:#fff;color:#222;border-radius:12px;padding:20px;width:min(92vw,360px)}" +
      ".lang-box h3{margin:0 0 6px}.lang-box label{display:flex;gap:10px;align-items:center;padding:12px;border:1px solid #ddd;border-radius:8px;margin-top:8px;cursor:pointer}" +
      ".lang-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}.lang-actions button{padding:9px 16px;border-radius:999px;border:1px solid #bbb;background:#fff;cursor:pointer}.lang-actions .save{background:#f7ca00;border-color:#f7ca00;font-weight:600}";
    document.head.appendChild(css);
    const btn = document.createElement("button");
    btn.className = "lang-btn"; btn.type = "button"; btn.textContent = "🌐 " + (lang === "hi" ? "HI" : "EN");
    btn.setAttribute("aria-label", "Language settings");
    const host = document.querySelector(".header-actions");
    if (host) host.insertBefore(btn, host.firstChild);
    const m = document.createElement("div"); m.className = "lang-modal";
    m.innerHTML = '<div class="lang-box"><h3>Language Settings</h3><p>Select the language you prefer for browsing, shopping and communications.</p>' +
      '<label><input type="radio" name="lg" value="en"> English - EN</label><label><input type="radio" name="lg" value="hi"> हिन्दी - HI</label>' +
      '<div class="lang-actions"><button type="button" class="cancel">Cancel</button><button type="button" class="save">Save Changes</button></div></div>';
    document.body.appendChild(m);
    m.querySelector('input[value="' + lang + '"]').checked = true;
    btn.onclick = () => m.classList.add("open");
    m.querySelector(".cancel").onclick = () => m.classList.remove("open");
    m.querySelector(".save").onclick = () => {
      const v = m.querySelector("input:checked").value;
      try { localStorage.setItem(KEY, v); } catch (e) {}
      location.reload();
    };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ui); else ui();
})();
