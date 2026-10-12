(function () {
  const $ = id => document.getElementById(id);
  const WA = "916367561630";
  const go = q => {
    const s = $("searchInput");
    if (s) { s.value = q || ""; s.dispatchEvent(new Event("input", { bubbles: true })); }
    const shop = $("shop"); if (shop) shop.scrollIntoView({ behavior: "smooth" });
  };

  /* Home page: search, categories, concerns */
  document.querySelectorAll("[data-q]").forEach(b => b.addEventListener("click", () => go(b.dataset.q)));
  const hs = $("homeSearch");
  if (hs) hs.addEventListener("keydown", e => { if (e.key === "Enter") go(hs.value.trim()); });
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
        item("↩️", "My Refunds", "Request a refund on WhatsApp", () => wa("Hello Aashapura Aurveda, I need help with a refund for my order. Order ID: ")),
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

  /* Bottom navigation (mobile) */
  const nav = document.createElement("nav"); nav.className = "m-bnav";
  [["🏠", "Home", () => scrollTo({ top: 0, behavior: "smooth" })], ["🌿", "Shop", () => go("")],
   ["🛒", "Bag", () => $("cartOpen").click()], ["👤", "Account", openSide]].forEach(([i, t, f]) => {
    const b = document.createElement("button"); b.innerHTML = `<b>${i}</b>${t}`; b.onclick = f; nav.appendChild(b);
  });
  document.body.appendChild(nav);
})();
