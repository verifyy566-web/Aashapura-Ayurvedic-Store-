/* Header icons (wishlist heart + cart icon) and Myntra-style "Move from Bag" sheet + heart on every cart item.
   Loads after wishlist.js, cart2.js and extras.js. */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const W = () => window.aashapuraWish;
  const HEART = (fill) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="${fill ? "#e0245e" : "none"}" stroke="${fill ? "#e0245e" : "currentColor"}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.4-9.2C1.2 7.9 3.2 4.8 6.4 4.8c2 0 3.4 1.1 4.2 2.4l1.4 2 1.4-2c.8-1.3 2.2-2.4 4.2-2.4 3.2 0 5.2 3.1 3.8 6.5-1.9 4.6-9.4 9.2-9.4 9.2z"/></svg>`;
  const CART = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 3.5h2.7l2.3 11.2a1.5 1.5 0 0 0 1.5 1.2h8.2a1.5 1.5 0 0 0 1.5-1.1l1.8-7.1H6.1"/><circle cx="9.5" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/></svg>`;

  const css = document.createElement("style");
  css.textContent = `
  .hd-ic{position:relative;display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;padding:0!important;border:1px solid var(--line,#e3e3e3);background:#fff;border-radius:12px;color:#173d2e;cursor:pointer;font:inherit}
  .hd-ic b{position:absolute;top:-6px;right:-6px;min-width:19px;height:19px;padding:0 5px;border-radius:99px;background:#14402b;color:#fff;font-size:11px;line-height:19px;text-align:center;font-weight:700}
  #wishOpen b{background:#e0245e}.hd-ic b.zero{display:none}
  .cart-button.hd-ic span{position:absolute;top:-6px;right:-6px;margin:0;padding:0 5px;min-width:19px;height:19px;line-height:19px;font-size:11px;font-weight:700;text-align:center;border-radius:99px}
  .header-actions{align-items:center}
  .ct-hw{position:absolute;top:-4px;right:34px;border:0;background:none;padding:6px 6px;color:#6b7f74;line-height:0;cursor:pointer}
  .ct-main h3{padding-right:76px}
  .mv-back{position:fixed;inset:0;z-index:100600;background:rgba(10,25,18,.55);opacity:0;transition:opacity .2s;display:flex;align-items:flex-end}
  .mv-back.on{opacity:1}
  .mv-sheet{width:100%;background:#fff;border-radius:22px 22px 0 0;padding:20px 18px 18px;transform:translateY(100%);transition:transform .25s;max-height:90vh;overflow:auto}
  .mv-back.on .mv-sheet{transform:none}
  .mv-h{display:flex;justify-content:space-between;align-items:center;font-size:19px;font-weight:700;color:#14301f;margin-bottom:14px}
  .mv-h button{border:0;background:none;font-size:26px;line-height:1;color:#14301f;cursor:pointer;padding:4px 8px}
  .mv-it{display:flex;gap:12px;align-items:center;border:1px solid #dfe8dc;border-radius:14px;padding:10px;margin-bottom:14px}
  .mv-it .im{width:62px;height:62px;border-radius:10px;background:#eef4ea;display:flex;align-items:center;justify-content:center;font-size:30px;overflow:hidden;flex:none}
  .mv-it .im img{width:100%;height:100%;object-fit:contain}
  .mv-it b{display:block;color:#14301f;font-size:15px}.mv-it small{display:block;color:#6a7d70;font-size:13px;margin-top:2px}
  .mv-q{font-size:16px;color:#2d3f35;margin:0 0 16px}
  .mv-row{display:flex;gap:10px}
  .mv-row button{flex:1;padding:14px 8px;border-radius:12px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;border:1px solid #cdd8cf;background:#fff;color:#14301f}
  .mv-row .wl{background:#e0245e;border-color:#e0245e;color:#fff}`;
  document.head.appendChild(css);

  /* ---------- header: wishlist heart + cart icon ---------- */
  function header() {
    const cartBtn = document.getElementById("cartOpen"), count = document.getElementById("cartCount");
    if (!cartBtn || !count) return;
    cartBtn.classList.add("hd-ic");
    cartBtn.setAttribute("aria-label", L("Cart", "कार्ट"));
    cartBtn.innerHTML = CART;
    cartBtn.appendChild(count);
    if (!document.getElementById("wishOpen")) {
      const w = document.createElement("button");
      w.type = "button"; w.id = "wishOpen"; w.className = "hd-ic"; w.setAttribute("aria-label", L("Wishlist", "पसंदीदा"));
      w.innerHTML = HEART(false) + `<b class="zero" id="wishBadge">0</b>`;
      w.onclick = () => { if (window.aashapuraWishlist) window.aashapuraWishlist.open(); };
      cartBtn.parentNode.insertBefore(w, cartBtn);
    }
    paintBadge();
  }
  function paintBadge() {
    const b = document.getElementById("wishBadge"), w = W(); if (!b || !w) return;
    const n = w.count(); b.textContent = n; b.classList.toggle("zero", !n);
  }
  window.addEventListener("aashapura-wish", paintBadge);

  /* ---------- Move from Bag sheet ---------- */
  function sheet(id, rowEl) {
    const p = (typeof products !== "undefined" ? products : []).find(x => String(x.id) === String(id));
    const imgEl = rowEl && rowEl.querySelector(".ct-img img"), nameEl = rowEl && rowEl.querySelector("h3"), wEl = rowEl && rowEl.querySelector(".ct-w");
    const back = document.createElement("div"); back.className = "mv-back"; back.setAttribute("role", "dialog");
    back.innerHTML = `<div class="mv-sheet"><div class="mv-h"><span>${L("Move from Bag", "कार्ट से हटाएँ")}</span><button type="button" aria-label="${L("Close", "बंद")}">×</button></div>
      <div class="mv-it"><div class="im">${imgEl ? `<img src="${esc(imgEl.getAttribute("src"))}" alt="">` : "🌿"}</div><div><b>${esc(nameEl ? nameEl.textContent : (p && p.name) || "")}</b>${wEl ? `<small>${esc(wEl.textContent)}</small>` : ""}</div></div>
      <p class="mv-q">${L("Are you sure you want to move this item from bag?", "क्या आप इस आइटम को कार्ट से हटाना चाहते हैं?")}</p>
      <div class="mv-row"><button type="button" class="rm">${L("Remove", "हटाएँ")}</button><button type="button" class="wl">${L("Move to Wishlist", "पसंदीदा में डालें")}</button></div></div>`;
    document.body.appendChild(back);
    requestAnimationFrame(() => back.classList.add("on"));
    const close = () => { back.classList.remove("on"); setTimeout(() => back.remove(), 220); };
    const after = () => { try { renderCart(); } catch (e) {} try { renderCartPage(true); } catch (e) {} };
    back.onclick = e => { if (e.target === back) close(); };
    back.querySelector(".mv-h button").onclick = close;
    back.querySelector(".rm").onclick = () => { delete cart[id]; close(); after(); };
    back.querySelector(".wl").onclick = () => {
      const w = W(); let added = false;
      if (w && !w.has(id)) { w.toggle(Number(id)); added = true; }
      delete cart[id]; close(); after();
      try { showStoreToast(added || (w && w.has(id)) ? L("Moved to wishlist", "पसंदीदा में डाल दिया") : L("Removed", "हटा दिया"), "success"); } catch (e) {}
    };
  }

  /* ---------- cart page: hearts + new remove flow ---------- */
  function enhanceCart() {
    const page = document.getElementById("cartFullPage"); if (!page) return;
    const w = W();
    page.querySelectorAll("[data-rm]").forEach(x => {
      const id = x.dataset.rm, row = x.closest(".ct-item");
      x.onclick = e => { e.preventDefault(); e.stopPropagation(); sheet(id, row); };
      if (w && row && !row.querySelector(".ct-hw")) {
        const h = document.createElement("button"); h.type = "button"; h.className = "ct-hw";
        h.setAttribute("aria-label", L("Wishlist", "पसंदीदा"));
        const paint = () => { h.innerHTML = HEART(w.has(id)); };
        paint();
        h.onclick = e => { e.stopPropagation(); const on = w.toggle(Number(id)); paint(); try { showStoreToast(on ? L("Added to wishlist", "पसंदीदा में जोड़ा") : L("Removed from wishlist", "पसंदीदा से हटाया"), "success"); } catch (er) {} };
        x.after(h);
      }
    });
    /* "🗑" on a quantity of 1 asks first, "−" on 2+ just reduces */
    page.querySelectorAll("[data-dec]").forEach(b => {
      if (b.textContent.trim() !== "🗑") return;
      const id = b.dataset.dec, row = b.closest(".ct-item");
      b.onclick = e => { e.preventDefault(); e.stopPropagation(); sheet(id, row); };
    });
  }

  const prev = window.renderCartPage;
  if (typeof prev === "function") {
    window.renderCartPage = function () { const r = prev.apply(this, arguments); try { enhanceCart(); } catch (e) {} return r; };
  }
  header();
  if (document.readyState !== "complete") window.addEventListener("load", () => { header(); });
})();
