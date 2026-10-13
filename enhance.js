/* Store UI enhancements: category chips, price/stock filters, wishlist, list/grid view */
(function () {
  const WK = "aashapura_wishlist";
  let wish = [];
  try { wish = JSON.parse(localStorage.getItem(WK) || "[]"); } catch (e) { wish = []; }
  const saveWish = () => { try { localStorage.setItem(WK, JSON.stringify(wish)); } catch (e) {} };
  const LABELS = { powder: "पाउडर", herbal: "हर्बल", wellness: "वेलनेस" };
  const norm = p => String(p.name || "").trim().toLowerCase().replace(/\s+/g, " ");
  window.primaryId = id => {
    const p = products.find(x => x.id === Number(id));
    return p ? Math.min(...products.filter(x => norm(x) === norm(p)).map(x => x.id)) : Number(id);
  };
  let activeCat = "all", onlyWish = false, view = "grid";

  /* Shared wishlist API (used by wishlist.js). Sizes of the same product count as one favourite. */
  const wlisteners = [];
  const grp = id => { const p = products.find(x => x.id === Number(id)); return p ? products.filter(x => norm(x) === norm(p)).map(x => x.id) : [Number(id)]; };
  const wchanged = () => { saveWish(); try { renderStore(); } catch (e) {} window.dispatchEvent(new Event("aashapura-wish")); };
  window.aashapuraWish = {
    ids: () => wish.slice(),
    has: id => grp(id).some(x => wish.includes(x)),
    count: () => new Set(wish.map(x => window.primaryId(x))).size,
    toggle(id) {
      const g = grp(id), pid = window.primaryId(id); let on;
      if (g.some(x => wish.includes(x))) { wish = wish.filter(x => !g.includes(x)); on = false; } else { wish = [...wish, pid]; on = true; }
      wchanged(); wlisteners.forEach(f => { try { f(pid, on, g); } catch (e) {} }); return on;
    },
    set(arr) { wish = [...new Set((arr || []).map(Number).filter(Boolean))]; wchanged(); },
    on(f) { wlisteners.push(f); }
  };
  const W = window.aashapuraWish;

  const grid = $("productGrid");
  const tools = document.querySelector(".shop-tools");
  if (!grid || !tools) return;

  const bar = document.createElement("div");
  bar.className = "store-filters";
  bar.innerHTML = `
    <div id="catChips" class="cat-chips"></div>
    <div class="filter-row">
      <label>₹ <input id="minPrice" type="number" min="0" placeholder="Min"></label>
      <label>– <input id="maxPrice" type="number" min="0" placeholder="Max"></label>
      <label class="chk"><input id="inStockOnly" type="checkbox"> स्टॉक में</label>
      <button id="wishToggle" type="button" class="chip">❤ पसंदीदा (<span id="wishCount">0</span>)</button>
      <button id="viewToggle" type="button" class="chip">☷ लिस्ट व्यू</button>
    </div>`;
  tools.after(bar);

  function renderChips() {
    const cats = ["all", ...new Set(products.map(p => String(p.category || "").trim().toLowerCase()).filter(Boolean))];
    $("catChips").innerHTML = cats.map(c =>
      `<button type="button" class="chip${c === activeCat ? " active" : ""}" data-cat="${escapeHTML(c)}">${c === "all" ? "सभी" : escapeHTML(LABELS[c] || c)}</button>`
    ).join("");
    const sel = $("categoryFilter");
    sel.innerHTML = cats.map(c => `<option value="${escapeHTML(c)}">${c === "all" ? "सभी कैटेगरी" : escapeHTML(LABELS[c] || c)}</option>`).join("");
    sel.value = activeCat;
  }

  function card(p, n = 1, min = p.price) {
    const liked = W.has(p.id);
    const out = p.stock <= 0;
    const low = p.stock > 0 && p.stock <= 5;
    return `
    <article class="product-card" onclick="showProduct(${p.id})">
      <button type="button" class="wish-btn${liked ? " on" : ""}" data-wish="${p.id}" aria-label="पसंदीदा">${liked ? "❤" : "♡"}</button>
      <div class="product-art">${p.image_url
        ? `<img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.name)}" style="width:100%;height:100%;object-fit:contain;" loading="lazy">`
        : p.emoji}</div>
      <div class="product-info">
        <span class="product-tag">${escapeHTML(p.weight)}</span>
        <h3>${escapeHTML(p.name)}</h3>
        <p>${escapeHTML(p.desc)}</p>
        ${low && n === 1 ? `<span class="stock-note">सिर्फ़ ${p.stock} बचे!</span>` : ""}
        <div class="product-buy">
          <strong>${n > 1 ? "₹" + min + " से" : "₹" + p.price}${n === 1 && p.mrp > p.price ? ` <s class="card-mrp">₹${p.mrp}</s>` : ""}</strong>
          ${n > 1 ? `<button class="add-btn">साइज़ चुनें →</button>`
            : out ? `<button class="add-btn notify-btn" data-notify="${p.id}">🔔 ${window.AASHAPURA_LANG === "hi" ? "बताएँ" : "Notify me"}</button>`
                : `<button class="add-btn" data-add="${p.id}">कार्ट में जोड़ें +</button>`}
        </div>
      </div>
    </article>`;
  }

  function renderStore() {
    renderChips();
    const q = $("searchInput").value.trim().toLowerCase();
    const min = Number($("minPrice").value) || 0;
    const max = Number($("maxPrice").value) || Infinity;
    const stockOnly = $("inStockOnly").checked;
    let list = products.filter(p => {
      const cat = String(p.category || "").trim().toLowerCase();
      return (activeCat === "all" || cat === activeCat)
        && (!q || p.name.toLowerCase().includes(q) || String(p.desc).toLowerCase().includes(q))
        && p.price >= min && p.price <= max
        && (!stockOnly || p.stock > 0)
        && (!onlyWish || W.has(p.id));
    });
    const sort = $("sortFilter").value;
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    else if (sort === "high") list.sort((a, b) => b.price - a.price);
    grid.className = "product-grid" + (view === "list" ? " list-view" : "");
    const counts = {}, mins = {};
    products.forEach(x => { const k = norm(x); counts[k] = (counts[k] || 0) + 1; mins[k] = Math.min(mins[k] ?? Infinity, x.price); });
    const seen = new Set();
    list = list.filter(p => { const k = norm(p); if (seen.has(k)) return false; seen.add(k); return true; });
    grid.innerHTML = list.map(p => card(p, counts[norm(p)], mins[norm(p)])).join("") || "<p>कोई उत्पाद नहीं मिला।</p>";
    $("wishCount").textContent = W.count();
    $("wishToggle").classList.toggle("active", onlyWish);
    const note = document.querySelector(".demo-note");
    if (note) note.textContent = list.length + " उत्पाद";
  }
  window.renderProducts = renderStore;

  // Capture phase: keeps heart / add-to-cart clicks from also opening the product page.
  grid.addEventListener("click", e => {
    const heart = e.target.closest("[data-wish]");
    const add = e.target.closest("[data-add]");
    if (heart) {
      e.stopPropagation();
      const now = W.toggle(Number(heart.dataset.wish));
      const hi = window.AASHAPURA_LANG === "hi"; showStoreToast(now ? (hi ? "पसंदीदा में जोड़ा ❤" : "Added to wishlist ❤") : (hi ? "पसंदीदा से हटाया" : "Removed from wishlist"), now ? "success" : "info");
    } else if (add) {
      e.stopPropagation();
      const id = String(add.dataset.add);
      const p = products.find(x => String(x.id) === id);
      if (!p) return;
      if (p.stock > 0 && (Number(cart[id]) || 0) >= p.stock) { showStoreToast("स्टॉक में इतना ही उपलब्ध है।", "error"); return; }
      cart[id] = (Number(cart[id]) || 0) + 1;
      renderCart();
      showStoreToast(`${p.name} कार्ट में जोड़ा गया`, "success");
    }
  }, true);

  bar.addEventListener("click", e => {
    const c = e.target.closest("[data-cat]");
    if (c) { activeCat = c.dataset.cat; renderStore(); }
    if (e.target.closest("#wishToggle")) { onlyWish = !onlyWish; renderStore(); }
    if (e.target.closest("#viewToggle")) {
      view = view === "grid" ? "list" : "grid";
      $("viewToggle").textContent = view === "grid" ? "☷ लिस्ट व्यू" : "▦ ग्रिड व्यू";
      renderStore();
    }
  });
  ["minPrice", "maxPrice", "inStockOnly"].forEach(id => $(id).addEventListener("input", renderStore));
  $("categoryFilter").addEventListener("change", e => { activeCat = e.target.value; renderStore(); });
  $("searchInput").addEventListener("input", renderStore);
  $("sortFilter").addEventListener("change", renderStore);
  renderStore();
})();
