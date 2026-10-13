(function () {
  const $ = id => document.getElementById(id);
  const WAN = () => (String((window.AASHAPURA_CONFIG && window.AASHAPURA_CONFIG.support) || "916367561630"));
  const go = q => {
    const s = $("searchInput");
    if ($("homeSearch")) $("homeSearch").value = q || "";
    if (s) { s.value = q || ""; s.dispatchEvent(new Event("input", { bubbles: true })); }
    const shop = $("shop"); if (shop) shop.scrollIntoView({ behavior: "smooth" });
  };

  /* Home page: search, categories, concerns */
  document.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => go(b.dataset.q)));
  const hs = $("homeSearch");
  if (hs) {
    hs.addEventListener("input", () => { const s = $("searchInput"); if (s) { s.value = hs.value; s.dispatchEvent(new Event("input", { bubbles: true })); } });
    hs.addEventListener("keydown", e => { if (e.key === "Enter") { hs.blur(); $("shop").scrollIntoView({ behavior: "smooth" }); } });
  }
  /* Dynamic categories: built from products (admin category) - first 7 + "More" page */
  const MAXCAT = 7;
  const CAT_EMOJI = { powder: "🥣", powders: "🥣", herbal: "🍃", wellness: "💪", hair: "💇", "hair care": "💇", skin: "✨", "skin care": "✨", immunity: "🛡️", digestion: "🍵", digest: "🍵", oil: "🫙", oils: "🫙", tablet: "💊", tablets: "💊", capsule: "💊", capsules: "💊", juice: "🧃", tea: "🍵", churna: "🥣", ghee: "🧈", honey: "🍯", soap: "🧼", "face pack": "🌸" };
  const esc2 = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const titleOf = c => c.replace(/\b\w/g, m => m.toUpperCase());
  const emojiOf = c => CAT_EMOJI[c] || "🌿";
  /* Category photos set by admin (table category_images). Cached for instant paint. */
  let catImgs = {}; try { catImgs = JSON.parse(localStorage.getItem("aashapura_catimgs") || "{}") || {}; } catch (e) {}
  const iconOf = (c, emo) => catImgs[c] ? `<span class="has-img"><img src="${esc2(catImgs[c])}" alt="" loading="lazy"></span>` : `<span>${emo}</span>`;
  const listCats = () => {
    let ps = []; try { ps = products || []; } catch (e) {}
    const map = new Map();
    ps.forEach(p => { const c = String(p.category || "").trim().toLowerCase(); if (c) map.set(c, (map.get(c) || 0) + 1); });
    return [...map.entries()].map(([c, n]) => ({ c, n })).sort((a, b) => b.n - a.n || a.c.localeCompare(b.c));
  };
  const pickCat = c => {
    const sel = $("categoryFilter");
    const s = $("searchInput"); if ($("homeSearch")) $("homeSearch").value = ""; if (s && s.value) { s.value = ""; s.dispatchEvent(new Event("input", { bubbles: true })); }
    if (sel) { if (![...sel.options].some(o => o.value === c)) sel.add(new Option(titleOf(c), c)); sel.value = c; sel.dispatchEvent(new Event("change", { bubbles: true })); }
    const shop = $("shop"); if (shop) shop.scrollIntoView({ behavior: "smooth" });
  };
  function openAllCats() {
    const list = listCats();
    const el = document.createElement("div"); el.className = "m-allcats";
    el.innerHTML = `<div class="m-allcats-head"><button type="button" class="bk" aria-label="Back">←</button><b>All Categories</b></div><div class="m-allcats-grid"></div>`;
    const grid = el.querySelector(".m-allcats-grid");
    const all = document.createElement("button"); all.type = "button"; all.className = "m-cat";
    all.innerHTML = `<span>🌿</span>All<small>${list.reduce((a, x) => a + x.n, 0)} items</small>`;
    grid.appendChild(all);
    list.forEach(({ c, n }) => { const b = document.createElement("button"); b.type = "button"; b.className = "m-cat"; b.dataset.c = c; b.innerHTML = `${iconOf(c, emojiOf(c))}${esc2(titleOf(c))}<small>${n} item${n > 1 ? "s" : ""}</small>`; grid.appendChild(b); });
    document.body.appendChild(el);
    const A = window.aashapuraAddr && window.aashapuraAddr.ov;
    let shut;
    if (A) { A.push(el); shut = () => A.close(el); } else shut = () => el.remove();
    el.querySelector(".bk").onclick = shut;
    grid.addEventListener("click", e => { const b = e.target.closest(".m-cat"); if (!b) return; shut(); setTimeout(() => pickCat(b.dataset.c || "all"), 60); });
  }
  let catSig = null;
  function buildCats() {
    const box = document.querySelector(".m-cats"); if (!box) return;
    const list = listCats();
    const sig = list.map(x => x.c).join("|") + "#" + Object.keys(catImgs).sort().map(k => k + catImgs[k]).join("|");
    if (!list.length || sig === catSig) return;
    catSig = sig;
    const show = list.length > MAXCAT ? list.slice(0, MAXCAT) : list;
    box.innerHTML = `<button type="button" class="m-cat" data-c="all">${iconOf("all", "🌿")}All</button>` +
      show.map(({ c }) => `<button type="button" class="m-cat" data-c="${esc2(c)}">${iconOf(c, emojiOf(c))}${esc2(titleOf(c))}</button>`).join("") +
      (list.length > MAXCAT ? `<button type="button" class="m-cat" data-more="1"><span>➕</span>More</button>` : "");
  }
  (async () => {
    try {
      const { data, error } = await supabaseClient.from("category_images").select("category,image_url");
      if (error || !data) return;
      const m = {}; data.forEach(r => { if (r.image_url) m[String(r.category).trim().toLowerCase()] = r.image_url; });
      try { localStorage.setItem("aashapura_catimgs", JSON.stringify(m)); } catch (e) {}
      catImgs = m; buildCats();
    } catch (e) {}
  })();
  const catBox = document.querySelector(".m-cats");
  if (catBox) {
    catBox.addEventListener("click", e => {
      const b = e.target.closest(".m-cat"); if (!b) return;
      if (b.dataset.more) return openAllCats();
      if (b.dataset.c) pickCat(b.dataset.c);
    });
    buildCats(); setInterval(buildCats, 1500);
  }

  /* Home banners from admin (table home_banners). Cached for instant paint; falls back to built-in banners */
  const GRADS = { green: "linear-gradient(120deg,#2f6b3a,#7aa84f)", gold: "linear-gradient(120deg,#b9731f,#e6a93b)", brown: "linear-gradient(120deg,#6a3d1f,#a8683a)", blue: "linear-gradient(120deg,#1e4e8c,#4a90d9)", red: "linear-gradient(120deg,#a4262c,#e0605a)", purple: "linear-gradient(120deg,#5b3a8c,#9b6fd0)" };
  const bannerHTML = (b, i) => {
    const bg = b.image_url ? `background:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.35)),url('${String(b.image_url).replace(/'/g, "%27")}') center/cover` : `background:${GRADS[b.bg_color] || GRADS.green}`;
    return `<div class="m-banner" data-bi="${i}" style="${bg}">${b.tag ? `<p>${esc2(b.tag)}</p>` : ""}${b.title ? `<h2>${esc2(b.title)}</h2>` : ""}${b.subtitle ? `<p>${esc2(b.subtitle)}</p>` : ""}${b.button_text ? `<a href="#shop" data-link="${esc2(b.button_link || "#shop")}">${esc2(b.button_text)}</a>` : ""}</div>`;
  };
  function paintBanners(rows) {
    const box = document.querySelector(".m-banners"); if (!box || !rows || !rows.length) return;
    box.innerHTML = rows.map(bannerHTML).join("");
    box.scrollLeft = 0;
  }
  const bannerBox = document.querySelector(".m-banners");
  if (bannerBox) {
    bannerBox.addEventListener("click", e => {
      const a = e.target.closest("a[data-link]"); if (!a) return;
      const l = a.dataset.link;
      if (l.startsWith("cat:")) { e.preventDefault(); pickCat(l.slice(4)); }
      else if (l.startsWith("product:")) { e.preventDefault(); try { showProduct(Number(l.slice(8))); } catch (er) {} }
      else if (/^https?:/i.test(l)) { e.preventDefault(); window.open(l, "_blank", "noopener"); }
    });
    try { const c = JSON.parse(localStorage.getItem("aashapura_banners") || "null"); if (c && c.length) paintBanners(c); } catch (e) {}
    (async () => {
      try {
        const { data, error } = await supabaseClient.from("home_banners").select("*").eq("is_active", true).order("sort_order", { ascending: true });
        if (error || !data) return;
        try { localStorage.setItem("aashapura_banners", JSON.stringify(data)); } catch (e) {}
        if (data.length) paintBanners(data);
      } catch (e) {}
    })();
  }

  const ban = document.querySelector(".m-banners");
  if (ban) setInterval(() => {
    const n = ban.children.length, w = ban.clientWidth;
    const i = Math.round(ban.scrollLeft / (w || 1));
    ban.scrollTo({ left: ((i + 1) % n) * (w + 10), behavior: "smooth" });
  }, 4500);

  /* Profile sidebar */
  const back = document.createElement("div"); back.className = "m-back";
  const side = document.createElement("aside"); side.className = "m-side"; side.setAttribute("aria-label", "Account");
  document.body.append(back, side);
  const close = () => { back.classList.remove("open"); side.classList.remove("open"); };
  back.onclick = close;

  const user = () => { try { return signedInUser; } catch (e) { return null; } };
  const item = (icon, title, sub, fn) => {
    const b = document.createElement("button");
    b.innerHTML = `<span>${icon}</span><span>${title}${sub ? `<small>${sub}</small>` : ""}</span>`;
    b.onclick = () => { close(); fn(); };
    return b;
  };
  const wa = t => window.open(`https://wa.me/${WAN()}?text=${encodeURIComponent(t)}`, "_blank", "noopener");

  function openSide() {
    const u = user();
    const nm = ($("profileName") && $("profileName").value) || (u && (u.user_metadata?.full_name || u.email.split("@")[0])) || "Guest";
    side.innerHTML = "";
    const head = document.createElement("div"); head.className = "m-side-head";
    head.innerHTML = `<div class="m-av">${nm[0].toUpperCase()}</div><div><b>${u ? "Hello, " + nm : "Welcome"}</b><small>${u ? u.email : "Sign in to see your orders"}</small></div>`;
    const list = document.createElement("div"); list.className = "m-side-list";
    if (u) {
      list.append(
        item("✏️", "Edit Profile", "Name, mobile and address", () => openAccountModal()),
        item("📦", "My Orders", "Track and view your orders", () => $("openMyOrdersBtn").click()),
        item("↩️", "Returns & Refunds", "Return, cancel and track requests", () => (window.openRefunds ? window.openRefunds() : wa("Hello Aashapura Ayurveda, I need help with a refund for my order. Order ID: "))),
        item("📍", "Saved Address", "Delivery address", () => openAccountModal()),
        item("❤️", "My Wishlist", "Products you saved", () => window.aashapuraWishlist && window.aashapuraWishlist.open()),
        item("🛒", "My Cart", "", () => $("cartOpen").click())
      );
    } else {
      list.append(item("🔑", "Sign In", "To see your orders and write reviews", () => $("googleLoginBtn").click()), item("❤️", "My Wishlist", "Products you saved", () => window.aashapuraWishlist && window.aashapuraWishlist.open()));
    }
    list.append(
      item("🌐", "Language", window.AASHAPURA_LANG === "hi" ? "हिन्दी" : "English", () => { const l = document.querySelector(".lang-btn"); if (l) l.click(); }),
      item("🎧", "Help Desk", "Order problem? Hum madad karenge", () => (window.aashapuraHelpDesk ? window.aashapuraHelpDesk.open() : wa("Hello Aashapura Ayurveda, I need help."))),
      item("ℹ️", "About Us", "", () => $("about").scrollIntoView({ behavior: "smooth" })),
      item("📞", "Contact Us", "", () => $("contact").scrollIntoView({ behavior: "smooth" }))
    );
    side.append(head, list);
    if (u) {
      const lo = document.createElement("div"); lo.className = "m-logout";
      lo.innerHTML = "<button type=\"button\">Log out</button>";
      lo.firstChild.onclick = () => { close(); $("googleLogoutBtn").click(); };
      side.append(lo);
    }
    back.classList.add("open"); side.classList.add("open");
  }

  const pb = $("profileBtn");
  if (pb) pb.addEventListener("click", e => { e.stopImmediatePropagation(); e.preventDefault(); openSide(); }, true);


  /* Filter bar (Category, Sort, Price, Stock, Favourites, View) */
  const bar = document.createElement("div"); bar.className = "m-filters";
  let wishOn = false, listOn = false;
  const fire = (el, type) => el && el.dispatchEvent(new Event(type, { bubbles: true }));
  const pill = (label, fn) => { const b = document.createElement("button"); b.type = "button"; b.className = "m-pill"; b.innerHTML = label; b.onclick = fn; bar.appendChild(b); return b; };
  function sheet(title, opts, cur, apply) {
    let pick = cur;
    const bk = document.createElement("div"); bk.className = "m-sheet-back";
    const sh = document.createElement("div"); sh.className = "m-sheet";
    sh.innerHTML = `<div class="m-sheet-head"><b>${title}</b><button type="button" aria-label="Close">✕</button></div><div class="m-sheet-chips"></div><div class="m-sheet-foot"><button type="button" class="clr">Clear All</button><button type="button" class="app">Apply Filters</button></div>`;
    const box = sh.querySelector(".m-sheet-chips");
    const paint = () => { box.innerHTML = ""; opts.forEach(o => { const c = document.createElement("button"); c.type = "button"; c.textContent = o.t; if (o.v === pick) c.className = "on"; c.onclick = () => { pick = o.v; paint(); }; box.appendChild(c); }); };
    paint();
    const shut = () => { bk.remove(); sh.remove(); };
    bk.onclick = shut; sh.querySelector(".m-sheet-head button").onclick = shut;
    sh.querySelector(".clr").onclick = () => { pick = opts[0].v; paint(); };
    sh.querySelector(".app").onclick = () => { apply(pick); shut(); refresh(); };
    document.body.append(bk, sh);
  }
  const optsOf = id => [...$(id).options].map(o => ({ v: o.value, t: o.textContent }));
  const setSel = (id, v) => { const s = $(id); s.value = v; fire(s, "change"); };
  const pCat = pill("Category ▾", () => sheet("Categories", optsOf("categoryFilter"), $("categoryFilter").value, v => setSel("categoryFilter", v)));
  const pSort = pill("⇅ Sort", () => sheet("Sort by", optsOf("sortFilter"), $("sortFilter").value, v => setSel("sortFilter", v)));
  const price = (label, max) => pill(label, () => { const m = $("maxPrice"); m.value = m.value === max ? "" : max; fire(m, "input"); refresh(); });
  const p1 = price("Under ₹199", "199"), p2 = price("Under ₹499", "499");
  const pStock = pill("In stock", () => { const c = $("inStockOnly"); c.checked = !c.checked; fire(c, "input"); refresh(); });
  const pFav = pill("❤ Favourites", () => { wishOn = !wishOn; $("wishToggle").click(); refresh(); });
  const pView = pill("☷ View", () => { listOn = !listOn; $("viewToggle").click(); refresh(); });
  function refresh() {
    const on = (b, v) => b.classList.toggle("on", !!v);
    on(pCat, $("categoryFilter").selectedIndex > 0); on(pSort, $("sortFilter").selectedIndex > 0);
    on(p1, $("maxPrice").value === "199"); on(p2, $("maxPrice").value === "499");
    on(pStock, $("inStockOnly").checked); on(pFav, wishOn); on(pView, listOn);
  }
  const grid = $("productGrid"); if (grid) grid.before(bar);

  /* Bottom navigation (mobile) */
  const nav = document.createElement("nav"); nav.className = "m-bnav";
  [["🏠", "Home", () => scrollTo({ top: 0, behavior: "smooth" })], ["🌿", "Shop", () => go("")],
   ["🛒", "Bag", () => $("cartOpen").click()], ["👤", "Account", openSide]].forEach(([i, t, f]) => {
    const b = document.createElement("button"); b.innerHTML = `<b>${i}</b>${t}`; b.onclick = f; nav.appendChild(b);
  });
  document.body.appendChild(nav);
})();
