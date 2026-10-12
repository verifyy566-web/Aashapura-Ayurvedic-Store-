(function () {
  const $ = id => document.getElementById(id);
  const WA = "916367561630";
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
  const wa = t => window.open(`https://wa.me/${WA}?text=${encodeURIComponent(t)}`, "_blank", "noopener");

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
        item("↩️", "Returns & Refunds", "Return, cancel and track requests", () => (window.openRefunds ? window.openRefunds() : wa("Hello Aashapura Aurveda, I need help with a refund for my order. Order ID: "))),
        item("📍", "Saved Address", "Delivery address", () => openAccountModal()),
        item("🛒", "My Cart", "", () => $("cartOpen").click())
      );
    } else {
      list.append(item("🔑", "Sign In", "To see your orders and write reviews", () => $("googleLoginBtn").click()));
    }
    list.append(
      item("🌐", "Language", window.AASHAPURA_LANG === "hi" ? "हिन्दी" : "English", () => { const l = document.querySelector(".lang-btn"); if (l) l.click(); }),
      item("💬", "Help Center", "Chat with us on WhatsApp", () => wa("Hello Aashapura Aurveda, I need help.")),
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
