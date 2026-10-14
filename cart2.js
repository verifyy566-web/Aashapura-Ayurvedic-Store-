/* Premium cart page (Myntra-style bag) + stock limit. Loads after checkout.js */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rs = n => "₹" + (Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) {} };

  /* ---------- stock limit: cart can never hold more than stock ---------- */
  function clampCart() {
    const msgs = [];
    Object.keys(cart).forEach(id => {
      const p = products.find(x => String(x.id) === String(id));
      if (!p) return;
      const q = Number(cart[id]) || 0;
      if (p.stock <= 0) return;
      if (q > p.stock) { cart[id] = p.stock; msgs.push(L(`Only ${p.stock} of ${p.name} available`, `${p.name} सिर्फ़ ${p.stock} उपलब्ध है`)); }
    });
    return msgs;
  }
  window.aashapuraClampCart = function () { const m = clampCart(); if (m.length) toast(m[0], "error"); return m; };
  const _renderCart = window.renderCart;
  window.renderCart = function () {
    const m = clampCart();
    if (m.length) toast(m[0], "error");
    return _renderCart.apply(this, arguments);
  };

  const oosItems = () => cartItems().filter(i => i.product.stock <= 0);

  /* ---------- live stock: another customer's confirmed order updates stock ---------- */
  let lastRefresh = 0;
  async function refreshStock(force) {
    if (!force && Date.now() - lastRefresh < 10000) return false;
    const ids = Object.keys(cart).map(Number).filter(Boolean);
    if (!ids.length) return false;
    lastRefresh = Date.now();
    try {
      const { data, error } = await supabaseClient.from("products").select("id,stock").in("id", ids);
      if (error || !data) return false;
      let changed = false;
      data.forEach(r => {
        const p = products.find(x => x.id === Number(r.id)); const n = Number(r.stock || 0);
        if (p && p.stock !== n) {
          if (n <= 0 && p.stock > 0) toast(L(`${p.name} is now out of stock`, `${p.name} अब स्टॉक में नहीं है`), "error");
          p.stock = n; changed = true;
        }
      });
      if (changed) { try { renderProducts(); } catch (e) {} }
      return changed;
    } catch (e) { return false; }
  }
  window.aashapuraRefreshStock = refreshStock;
  let watch = null;
  const startWatch = () => {
    if (watch) return;
    watch = setInterval(async () => {
      if (!document.getElementById("cartFullPage")) { clearInterval(watch); watch = null; return; }
      if (await refreshStock(true)) { window.renderCart(); window.renderCartPage(true); }
    }, 15000);
  };
  const _opc = window.openPremiumCheckout;
  window.openPremiumCheckout = function () {
    if (oosItems().length) { toast(L("Please remove out-of-stock items from your bag first.", "पहले कार्ट से स्टॉक खत्म वाले आइटम हटाएँ।"), "error"); try { window.renderCartPage(true); } catch (e) {} return; }
    return _opc.apply(this, arguments);
  };

  /* ---------- styles ---------- */
  const st = document.createElement("style");
  st.textContent = `
  #cartFullPage{position:fixed!important;inset:0;z-index:99000;overflow-y:auto;background:#f3f6f2;color:#173d2e;font-family:inherit;-webkit-overflow-scrolling:touch;padding:0!important}
  .ct-in{max-width:640px;margin:0 auto;padding:0 12px 120px}
  .ct-head{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:14px 12px;margin:0 -12px 10px;background:#fff;border-bottom:1px solid #e3eadf}
  .ct-head button{border:0;background:none;font-size:24px;line-height:1;padding:2px 8px;color:#123c2b}
  .ct-head b{font-size:18px}.ct-head small{color:#6b7f74;margin-left:auto}
  .ct-save{display:flex;gap:8px;align-items:center;background:#e4f4e8;color:#17653a;border-radius:12px;padding:11px 14px;font-weight:700;margin-bottom:10px}
  .ct-card{background:#fff;border-radius:14px;padding:14px;margin-bottom:10px;border:1px solid #e6ece3}
  .ct-free p{margin:0 0 8px;font-size:14px;font-weight:600}.ct-bar{height:8px;border-radius:99px;background:#e5ece3;overflow:hidden}.ct-bar i{display:block;height:100%;background:#2f8f55;border-radius:99px;transition:width .3s}
  .ct-item{display:flex;gap:12px;position:relative}
  .ct-img{flex:none;width:92px;height:112px;border-radius:10px;background:#e8f1e6;object-fit:cover;display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden}
  .ct-img img{width:100%;height:100%;object-fit:cover}
  .ct-main{flex:1;min-width:0}.ct-main h3{margin:0 28px 2px 0;font-size:16px;line-height:1.25}
  .ct-w{color:#6b7f74;font-size:13px;margin-bottom:6px}
  .ct-price{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;margin:6px 0}.ct-price b{font-size:18px}.ct-price s{color:#8a998f;font-size:14px}.ct-price em{font-style:normal;color:#17853f;font-weight:700;font-size:13px}
  .ct-x{position:absolute;top:-4px;right:-4px;border:0;background:none;font-size:20px;color:#6b7f74;padding:6px 8px}
  .ct-qty{display:inline-flex;align-items:center;border:1.5px solid #cfdacb;border-radius:10px;overflow:hidden;background:#fff}
  .ct-qty button{width:38px;height:36px;border:0;background:#f3f7f1;font-size:20px;color:#123c2b}
  .ct-qty button:disabled{color:#b8c2bb;background:#f1f1f1}
  .ct-qty span{min-width:38px;text-align:center;font-weight:700}
  .ct-note{font-size:12.5px;margin-top:6px;font-weight:600}.ct-low{color:#b42318}.ct-max{color:#9a6a00}
  .ct-pd h4{margin:0 0 10px;font-size:16px}.ct-r{display:flex;justify-content:space-between;padding:6px 0;font-size:15px}.ct-r .g{color:#17853f;font-weight:700}
  .ct-r.t{border-top:1px dashed #cfdacb;margin-top:6px;padding-top:12px;font-size:17px;font-weight:800}
  .ct-trust{display:flex;justify-content:space-around;text-align:center;font-size:12px;color:#5f7468;padding:6px 0 4px}.ct-trust b{display:block;font-size:20px;font-weight:400}
  .ct-bar2{position:fixed;left:0;right:0;bottom:0;z-index:5;background:#fff;border-top:1px solid #dfe8dc;box-shadow:0 -6px 24px #123c2b1a}
  .ct-bar2 div{max-width:640px;margin:0 auto;display:flex;align-items:center;gap:12px;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px))}
  .ct-bar2 small{display:block;color:#6b7f74;font-size:12px}.ct-bar2 strong{font-size:21px}
  .ct-bar2 button{flex:1;margin-left:auto;max-width:230px;padding:15px;border:0;border-radius:12px;background:#123c2b;color:#fff;font-size:17px;font-weight:700}
  .ct-oos{background:#fee4e2;color:#8a1c12;border-radius:12px;padding:11px 14px;margin-bottom:10px;font-weight:600;display:flex;gap:10px;align-items:center;justify-content:space-between}
  .ct-oos button{border:1px solid #b42318;background:#fff;color:#b42318;border-radius:8px;padding:6px 10px;font-weight:700;flex:none}
  .ct-item.out .ct-img img,.ct-item.out .ct-img{filter:grayscale(1);opacity:.55}.ct-item.out h3,.ct-item.out .ct-price{opacity:.55}
  .ct-tag{display:inline-block;background:#b42318;color:#fff;border-radius:6px;padding:3px 8px;font-size:12.5px;font-weight:700;margin-top:4px}
  .ct-bar2 button.off{background:#9aa8a0}
  .ct-empty{text-align:center;padding:60px 20px}.ct-empty div{font-size:64px}.ct-empty button{margin-top:14px;padding:13px 26px;border:0;border-radius:12px;background:#123c2b;color:#fff;font-size:16px;font-weight:700}`;
  document.head.appendChild(st);

  const imgOf = p => {
    let urls = [];
    try { const s = typeof p.images === "string" ? JSON.parse(p.images || "[]") : p.images; urls = Array.isArray(s) ? s.slice() : []; } catch (e) {}
    if (p.image_url && !urls.includes(p.image_url)) urls.unshift(p.image_url);
    return urls.filter(u => u && !/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(u))[0] || "";
  };

  /* ---------- premium cart page ---------- */
  window.renderCartPage = function (noRefresh) {
    let page = document.getElementById("cartFullPage");
    if (!page) { page = document.createElement("main"); page.id = "cartFullPage"; document.body.appendChild(page); }
    page.removeAttribute("style");
    const m = clampCart(); if (m.length) toast(m[0], "error");
    const all = cartItems(), oos = all.filter(i => i.product.stock <= 0), items = all.filter(i => i.product.stock > 0);
    const D = window.AASHAPURA_DELIVERY || { charge: 0, freeAbove: 0 };
    const count = items.reduce((n, i) => n + i.qty, 0), countAll = all.reduce((n, i) => n + i.qty, 0);
    const sub = items.reduce((s, i) => s + i.price * i.qty, 0);
    const mrpTotal = items.reduce((s, i) => s + Math.max(Number(i.product.mrp) || 0, i.price) * i.qty, 0);
    const mrpOff = mrpTotal - sub;
    const CB = window.aashapuraCombos ? window.aashapuraCombos.calc(items) : { discount: 0 };
    const cmb = items.length ? CB.discount : 0;
    const cpd = appliedCoupon && items.length ? Math.min(Number(appliedCoupon.discount) || 0, sub - cmb) : 0;
    const after = Math.max(0, sub - cmb - cpd);
    const del = items.length && after < D.freeAbove ? D.charge : 0;
    const total = after + del;
    const AD = window.aashapuraAddr;
    // coupon discount depends on cart value: re-check it silently whenever the subtotal changes
    if (appliedCoupon && items.length && appliedCoupon.forSub !== sub && !appliedCoupon.checking) {
      appliedCoupon.checking = true;
      validateStoreCoupon(appliedCoupon.code, sub).then(r => {
        if (!r.ok) { appliedCoupon = null; toast(r.message, "error"); } else appliedCoupon.forSub = sub;
        if (document.getElementById("cartFullPage")) renderCartPage(true);
      }).catch(() => { if (appliedCoupon) appliedCoupon.forSub = sub; });
    }
    const addrBar = () => {
      if (!AD) return "";
      const cur = AD.selected(AD.cached() || []), sp = AD.savedPin();
      if (sp && sp.pin && (!cur || sp.pin !== cur.pincode)) return `<div class="tx"><b>${L("Deliver to", "डिलीवरी")}: ${esc(sp.pin)}</b><small>${esc(sp.area || "")}</small></div><span class="ar">▾</span>`;
      if (cur) return `<div class="tx"><b>${esc(cur.name)} (${esc(cur.pincode)})</b><small>${esc(AD.text(cur))}</small></div><span class="ar">▾</span>`;
      return `<div class="tx"><b>${L("Select delivery location", "डिलीवरी लोकेशन चुनें")}</b><small>${L("Pincode, current location or saved address", "पिनकोड, करंट लोकेशन या सेव पता")}</small></div><span class="ar">▾</span>`;
    };
    const head = `<div class="ct-head"><button type="button" id="ctBack" aria-label="${L("Back", "वापस")}">←</button><b>${L("My Bag", "आपका कार्ट")}</b><small>${countAll} ${L(countAll === 1 ? "item" : "items", "आइटम")}</small></div>`;

    if (!all.length) {
      page.innerHTML = `<div class="ct-in">${head}<div class="ct-empty"><div>🛍️</div><h2>${L("Your bag is empty", "आपका कार्ट खाली है")}</h2><p>${L("Add some Ayurvedic products to get started.", "शुरू करने के लिए कुछ आयुर्वेदिक प्रोडक्ट जोड़ें।")}</p><button type="button" id="ctShop">${L("Continue shopping", "खरीदारी करें")}</button></div></div>`;
      page.querySelector("#ctBack").onclick = closeCart; page.querySelector("#ctShop").onclick = closeCart; return;
    }

    const pct = D.freeAbove ? Math.min(100, Math.round(after / D.freeAbove * 100)) : 100;
    const rows = all.map(({ product: p, qty }) => {
      const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
      const img = imgOf(p), atMax = qty >= p.stock, out = p.stock <= 0;
      return `<div class="ct-card ct-item ${out ? "out" : ""}">
        <div class="ct-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : esc(p.emoji || "🌿")}</div>
        <div class="ct-main">
          <button type="button" class="ct-x" data-rm="${p.id}" aria-label="${L("Remove", "हटाएँ")}">✕</button>
          <h3>${esc(p.name)}</h3>${p.weight ? `<div class="ct-w">${esc(p.weight)}</div>` : ""}
          <div class="ct-price"><b>${rs(p.price)}</b>${off ? `<s>${rs(p.mrp)}</s><em>${off}% ${L("off", "छूट")}</em>` : ""}</div>
          ${out ? `<span class="ct-tag">${L("Out of stock", "स्टॉक खत्म")}</span>` : `<div class="ct-qty"><button type="button" data-dec="${p.id}" aria-label="${L("Decrease", "घटाएँ")}">${qty === 1 ? "🗑" : "−"}</button><span>${qty}</span><button type="button" data-inc="${p.id}" ${atMax ? "disabled" : ""} aria-label="${L("Increase", "बढ़ाएँ")}">+</button></div>`}
          ${!out && p.stock <= 5 ? `<div class="ct-note ${atMax ? "ct-max" : "ct-low"}">${atMax ? L(`Max ${p.stock} available in stock`, `स्टॉक में अधिकतम ${p.stock} उपलब्ध`) : L(`Only ${p.stock} left!`, `सिर्फ़ ${p.stock} बचे!`)}</div>` : ""}
        </div></div>`;
    }).join("");

    page.innerHTML = `<div class="ct-in">${head}
      ${AD ? `<div style="margin:0 -12px 10px">${AD.stepper(1)}</div>` : ""}
      ${AD ? `<div class="ct-addr" id="ctAddr">${addrBar()}</div>` : ""}
      ${oos.length ? `<div class="ct-oos"><span>⚠️ ${L("Some items are out of stock. Remove them to place your order.", "कुछ आइटम स्टॉक में नहीं हैं। ऑर्डर के लिए उन्हें हटाएँ।")}</span><button type="button" id="ctRmOos">${L("Remove", "हटाएँ")}</button></div>` : ""}
      ${mrpOff + cpd + cmb > 0 ? `<div class="ct-save">🎉 ${L("You're saving", "आप बचा रहे हैं")} ${rs(mrpOff + cpd + cmb)} ${L("on this order", "इस ऑर्डर पर")}</div>` : ""}
      ${D.freeAbove ? `<div class="ct-card ct-free"><p>${del ? L(`Add ${rs(D.freeAbove - after)} more for FREE delivery`, `${rs(D.freeAbove - after)} और जोड़ें, डिलीवरी फ्री पाएँ`) : L("🎉 You get FREE delivery on this order", "🎉 इस ऑर्डर पर डिलीवरी फ्री है")}</p><div class="ct-bar"><i style="width:${pct}%"></i></div></div>` : ""}
      ${rows}
      ${(() => {
        if (!del || !D.freeAbove) return "";
        const gap = Math.ceil(D.freeAbove - after), inBag = new Set(all.map(i => String(i.product.name).trim().toLowerCase())), seen = new Set();
        const pool = products.filter(p => p.stock > 0 && p.price > 0 && !inBag.has(String(p.name).trim().toLowerCase()) && !cart[p.id] && (k => (seen.has(k) ? false : (seen.add(k), true)))(String(p.name).trim().toLowerCase()));
        const hit = pool.filter(p => p.price >= gap).sort((a, b) => a.price - b.price), low = pool.filter(p => p.price < gap).sort((a, b) => b.price - a.price);
        const list = hit.slice(0, 4).concat(low).slice(0, 8); if (!list.length) return "";
        return `<div class="ct-card ct-sug"><div class="ct-sug-row">${list.map(p => { const im = imgOf(p); return `<div class="ct-sug-c"><div class="im">${im ? `<img src="${esc(im)}" alt="" loading="lazy">` : esc(p.emoji || "🌿")}</div><b>${esc(p.name)}${p.weight ? " · " + esc(p.weight) : ""}</b><span>${rs(p.price)}</span>${p.price >= gap ? `<em>${L("Free delivery", "फ्री डिलीवरी")}</em>` : ""}<button type="button" data-sadd="${p.id}">+ ${L("Add", "जोड़ें")}</button></div>`; }).join("")}</div></div>`;
      })()}
      ${items.length ? `<div class="ct-card ct-offers"><h4>${L("Offers & Benefits", "ऑफ़र और लाभ")}</h4><div class="of-row" id="ctOffers"><span class="of-ic">🏷️</span><div class="tx"><b>${appliedCoupon && cpd > 0 ? esc(appliedCoupon.code) + " " + L("applied", "लागू") : L("Apply Coupon", "कूपन लगाएँ")}</b><small class="${appliedCoupon && cpd > 0 ? "g" : ""}">${appliedCoupon && cpd > 0 ? L("You save", "आप बचा रहे हैं") + " " + rs(cpd) : L("Tap to see available offers", "उपलब्ध ऑफ़र देखें")}</small></div>${appliedCoupon && cpd > 0 ? `<button type="button" class="of-rm" id="ctCpRm">${L("Remove", "हटाएँ")}</button>` : `<span class="ar">›</span>`}</div></div>` : ""}
      ${items.length ? `<div class="ct-card ct-pd"><h4>${L("Price Details", "प्राइस डिटेल")} (${count} ${L(count === 1 ? "item" : "items", "आइटम")})</h4>
        <div class="ct-r"><span>${L("Total MRP", "कुल MRP")}</span><span>${rs(mrpTotal)}</span></div>
        ${mrpOff > 0 ? `<div class="ct-r"><span>${L("Discount on MRP", "MRP पर छूट")}</span><span class="g">−${rs(mrpOff)}</span></div>` : ""}
        ${cmb > 0 ? `<div class="ct-r"><span>${L("Combo offer", "कॉम्बो ऑफ़र")}</span><span class="g">−${rs(cmb)}</span></div>` : ""}
        ${cpd > 0 ? `<div class="ct-r"><span>${L("Coupon discount", "कूपन छूट")} (${esc(appliedCoupon.code)})</span><span class="g">−${rs(cpd)}</span></div>` : ""}
        <div class="ct-r"><span>${L("Delivery fee", "डिलीवरी शुल्क")}</span><span class="${del ? "" : "g"}">${del ? rs(del) : L("FREE", "फ्री")}</span></div>
        <div class="ct-r t"><span>${L("Total Amount", "कुल राशि")}</span><span>${rs(total)}</span></div>
        </div>` : ""}
      <div class="ct-trust"><span><b>🌿</b>${L("100% Ayurvedic", "100% आयुर्वेदिक")}</span><span><b>↩️</b>${L("Easy returns", "आसान रिटर्न")}</span><span><b>🔒</b>${L("Secure UPI pay", "सुरक्षित UPI")}</span></div>
    </div>
    <div class="ct-bar2"><div><span><small>${L("Total", "कुल")}</small><strong>${rs(total)}</strong></span><button type="button" id="ctPlace" class="${oos.length || !items.length ? "off" : ""}">${L("Place Order", "ऑर्डर करें")}</button></div></div>`;

    const refresh = () => { renderCart(); renderCartPage(); };
    const bar = page.querySelector("#ctAddr");
    if (bar && AD) {
      bar.onclick = () => AD.openSheet({ onChange: () => renderCartPage(true) });
      if (!AD.cached()) AD.load().then(() => { const b = page.querySelector("#ctAddr"); if (b) b.innerHTML = addrBar(); }).catch(() => {});
    }
    const cpRm = page.querySelector("#ctCpRm"), ofRow = page.querySelector("#ctOffers");
    if (ofRow) ofRow.onclick = () => { if (window.aashapuraOffers) window.aashapuraOffers.open({ sub, onDone: () => renderCartPage(true) }); };
    if (cpRm) cpRm.onclick = e => { e.stopPropagation(); appliedCoupon = null; renderCartPage(true); };
    page.querySelector("#ctBack").onclick = closeCart;
    const rmOos = page.querySelector("#ctRmOos"); if (rmOos) rmOos.onclick = () => { oos.forEach(i => delete cart[i.id]); refresh(); };
    page.querySelector("#ctPlace").onclick = () => { if (oos.length || !items.length) return toast(L("Please remove out-of-stock items first.", "पहले स्टॉक खत्म वाले आइटम हटाएँ।"), "error"); if (window.aashapuraClampCart && window.aashapuraClampCart().length) return renderCartPage(); openPremiumCheckout(); };
    page.querySelectorAll("[data-sadd]").forEach(b => b.onclick = () => {
      const id = b.dataset.sadd, p = products.find(x => String(x.id) === id); if (!p) return;
      if ((Number(cart[id]) || 0) >= p.stock) return toast(L(`Only ${p.stock} available in stock`, `स्टॉक में सिर्फ़ ${p.stock} उपलब्ध`), "error");
      cart[id] = (Number(cart[id]) || 0) + 1; toast(L(`${p.name} added to bag`, `${p.name} कार्ट में जोड़ा`), "success"); refresh();
    });
    page.querySelectorAll("[data-inc]").forEach(b => b.onclick = e => {
      e.preventDefault(); e.stopPropagation(); /* script.js ka global handler dobara +1 na kare */
      const id = b.dataset.inc, p = products.find(x => String(x.id) === id);
      if (p && (Number(cart[id]) || 0) >= p.stock) return toast(L(`Only ${p.stock} available in stock`, `स्टॉक में सिर्फ़ ${p.stock} उपलब्ध`), "error");
      cart[id] = (Number(cart[id]) || 0) + 1; refresh();
    });
    page.querySelectorAll("[data-dec]").forEach(b => b.onclick = e => {
      e.preventDefault(); e.stopPropagation();
      const id = b.dataset.dec; cart[id] = (Number(cart[id]) || 0) - 1; if (cart[id] <= 0) delete cart[id]; refresh();
    });
    page.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { delete cart[b.dataset.rm]; refresh(); });

    // Fetch the latest stock (another customer's confirmed order may have used it up)
    if (!noRefresh) refreshStock().then(ch => { if (ch) { window.renderCart(); window.renderCartPage(true); } });
    startWatch();
  };

  // If the cart page is already open when this file loads, redraw it.
  if (document.getElementById("cartFullPage")) window.renderCartPage();
})();
