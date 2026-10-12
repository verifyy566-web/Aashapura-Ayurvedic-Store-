/* Amazon-style product page: gallery, size variants, MRP/discount, qty, details, similar products */
(function () {
  const norm = p => String(p.name || "").trim().toLowerCase().replace(/\s+/g, " ");
  const money = n => "₹" + Number(n).toLocaleString("en-IN");
  const CATS = { powder: "पाउडर", herbal: "हर्बल", wellness: "वेलनेस" };
  const unit = w => {
    const m = String(w || "").toLowerCase().replace(/,/g, "").match(/([\d.]+)\s*(kg|gm|gram|grams|g|ml|ltr|l)\b/);
    if (!m) return null;
    const big = ["kg", "l", "ltr"].includes(m[2]);
    return { v: parseFloat(m[1]) * (big ? 1000 : 1), u: ["ml", "l", "ltr"].includes(m[2]) ? "ml" : "g" };
  };
  const stockLine = p => p.stock <= 0 ? ["out", "स्टॉक खत्म"] : p.stock <= 5 ? ["low", `सिर्फ़ ${p.stock} बचे`] : ["ok", "स्टॉक में"];
  const off = p => p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const imagesOf = p => {
    let urls = [];
    try { const s = typeof p.images === "string" ? JSON.parse(p.images || "[]") : p.images; urls = Array.isArray(s) ? s.slice() : []; } catch (e) {}
    if (p.image_url && !urls.includes(p.image_url)) urls.unshift(p.image_url);
    return urls.filter(Boolean);
  };
  const resetUrl = id => { const u = new URL(location.href); id ? u.searchParams.set("product", id) : u.searchParams.delete("product"); history.replaceState({}, "", u); };

  window.renderProductPage = function (p) {
    document.getElementById("productFullPage")?.remove();
    const page = document.createElement("main");
    page.id = "productFullPage";
    page.className = "pp";
    const imgs = imagesOf(p);
    const variants = products.filter(x => norm(x) === norm(p)).sort((a, b) => ((unit(a.weight)?.v) || a.price) - ((unit(b.weight)?.v) || b.price));
    const rel = [], seen = new Set([norm(p)]);
    products.filter(x => x.category === p.category).forEach(x => { if (!seen.has(norm(x)) && rel.length < 8) { seen.add(norm(x)); rel.push(x); } });
    const [sk, st] = stockLine(p);
    const d = off(p);
    const maxQ = Math.max(1, Math.min(10, p.stock || 10));

    page.innerHTML = `
      <div class="pp-top"><button type="button" id="ppBack" aria-label="वापस">←</button><span>${escapeHTML(p.name)}</span></div>
      <div class="pp-wrap">
        <div class="pp-gallery">
          ${d ? `<span class="pp-badge">${d}% छूट</span>` : ""}
          ${imgs.length ? `<div class="pp-slides" id="ppSlides">${imgs.map(u => `<img src="${escapeHTML(u)}" alt="${escapeHTML(p.name)}">`).join("")}</div>
            ${imgs.length > 1 ? `<div class="pp-dots" id="ppDots">${imgs.map((_, i) => `<i class="${i ? "" : "on"}"></i>`).join("")}</div>` : ""}`
            : `<div class="pp-emoji">${escapeHTML(p.emoji)}</div>`}
        </div>
        <div class="pp-info">
          <h1 class="pp-title">${escapeHTML(p.name)}${p.weight ? " | " + escapeHTML(p.weight) : ""}</h1>
          <div class="pp-rate" id="ppRate"></div>
          ${variants.length > 1 ? `<div class="pp-label">साइज़: <strong>${escapeHTML(p.weight || "")}</strong></div>
          <div class="pp-sizes">${variants.map(v => {
            const u = unit(v.weight), per = u ? `<small>(₹${(v.price / u.v * 100).toFixed(2)} / 100 ${u.u})</small>` : "";
            const [k, t] = stockLine(v);
            return `<button type="button" class="pp-size${v.id === p.id ? " sel" : ""}" data-v="${v.id}"><b>${escapeHTML(v.weight || v.name)}</b><span>${money(v.price)}</span>${per}${off(v) ? `<s>${money(v.mrp)}</s>` : ""}<em class="${k}">${t}</em></button>`;
          }).join("")}</div>` : ""}
          <div class="pp-pricebox">
            ${d ? `<span class="pp-off">-${d}%</span>` : ""}<span class="pp-price"><sup>₹</sup>${Number(p.price).toLocaleString("en-IN")}</span>
            ${d ? `<div class="pp-mrp">M.R.P.: <s>${money(p.mrp)}</s></div>` : ""}
            <div class="pp-tax">सभी करों सहित</div>
          </div>
          <div class="pp-stock ${sk}">${st}</div>
          ${p.stock > 0 ? `<label class="pp-qty">मात्रा: <select id="ppQty">${Array.from({ length: maxQ }, (_, i) => `<option>${i + 1}</option>`).join("")}</select></label>
          <button type="button" id="ppAdd" class="pp-btn add">🛒 कार्ट में जोड़ें</button>
          <button type="button" id="ppBuy" class="pp-btn buy">अभी खरीदें</button>` : `<button class="pp-btn" disabled>स्टॉक खत्म</button>`}
          <div class="pp-trust"><div>💬<span>WhatsApp पर आसान ऑर्डर</span></div><div>📲<span>UPI से पेमेंट</span></div><div>🚚<span>आपके पते पर डिलीवरी</span></div></div>
          <h3>उत्पाद की जानकारी</h3>
          <table class="pp-table">
            ${p.weight ? `<tr><th>वज़न / साइज़</th><td>${escapeHTML(p.weight)}</td></tr>` : ""}
            <tr><th>कैटेगरी</th><td>${escapeHTML(CATS[String(p.category).toLowerCase()] || p.category)}</td></tr>
            <tr><th>ब्रांड</th><td>Aashapura Ayurvedic Store</td></tr>
          </table>
          ${p.desc ? `<h3>विवरण</h3><p class="pp-desc">${escapeHTML(p.desc)}</p>` : ""}
          ${p.video_url ? `<p><a href="${escapeHTML(p.video_url)}" target="_blank" rel="noopener">▶ प्रोडक्ट वीडियो देखें</a></p>` : ""}
        </div>
      </div>
      ${rel.length ? `<section class="pp-rel"><h3>आपको ये भी पसंद आ सकते हैं</h3><div class="pp-rel-row">${rel.map(x => {
        const img = imagesOf(x)[0];
        return `<article onclick="showProduct(${x.id})">${img ? `<img src="${escapeHTML(img)}" alt="" loading="lazy">` : `<div class="pp-emoji sm">${escapeHTML(x.emoji)}</div>`}<h4>${escapeHTML(x.name)}</h4><strong>${money(x.price)}</strong></article>`;
      }).join("")}</div></section>` : ""}`;
    document.body.appendChild(page);

    const slides = page.querySelector("#ppSlides"), dots = page.querySelectorAll("#ppDots i");
    if (slides && dots.length) slides.addEventListener("scroll", () => {
      const i = Math.round(slides.scrollLeft / slides.clientWidth);
      dots.forEach((x, j) => x.classList.toggle("on", i === j));
    }, { passive: true });

    page.querySelector("#ppBack").onclick = () => { page.remove(); resetUrl(null); };
    page.querySelectorAll("[data-v]").forEach(b => b.onclick = () => {
      const v = products.find(x => x.id === Number(b.dataset.v));
      if (v) { resetUrl(v.id); renderProductPage(v); }
    });
    const add = () => {
      const q = Number(page.querySelector("#ppQty").value), id = String(p.id), cur = Number(cart[id]) || 0;
      if (p.stock > 0 && cur + q > p.stock) { showStoreToast("स्टॉक में इतना ही उपलब्ध है।", "error"); return false; }
      cart[id] = cur + q; renderCart(); return true;
    };
    page.querySelector("#ppAdd")?.addEventListener("click", () => { if (add()) showStoreToast(`${p.name} कार्ट में जोड़ा गया`, "success"); });
    page.querySelector("#ppBuy")?.addEventListener("click", () => { if (add()) { page.remove(); resetUrl(null); openCart(); } });
  };
})();
