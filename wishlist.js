/* Wishlist: heart on product page, Wishlist page, sync with account (table wishlists). Uses window.aashapuraWish from enhance.js */
(function () {
  const W = window.aashapuraWish; if (!W) return;
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) {} };
  const img = p => { let u = []; try { const s = typeof p.images === "string" ? JSON.parse(p.images || "[]") : p.images; u = Array.isArray(s) ? s.slice() : []; } catch (e) {} if (p.image_url && !u.includes(p.image_url)) u.unshift(p.image_url); return u.filter(x => x && !/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(x))[0] || ""; };
  const uid = () => { try { return signedInUser && signedInUser.id; } catch (e) { return null; } };
  let syncing = false, syncedFor = null;

  /* ---- sync with account ---- */
  async function pull() {
    const u = uid(); if (!u || syncing || syncedFor === u) return;
    syncing = true;
    try {
      const { data, error } = await supabaseClient.from("wishlists").select("product_id");
      if (error) return;                       // table not created yet -> stay local only
      const remote = (data || []).map(r => Number(r.product_id)), local = W.ids();
      const merged = [...new Set([...local, ...remote])];
      const add = merged.filter(x => !remote.includes(x));
      if (add.length) await supabaseClient.from("wishlists").upsert(add.map(product_id => ({ user_id: u, product_id })), { onConflict: "user_id,product_id", ignoreDuplicates: true });
      syncedFor = u; W.set(merged);
    } catch (e) {} finally { syncing = false; }
  }
  W.on(async (id, on, group) => {
    paintHeart();
    const u = uid(); if (!u || id == null) return;
    try {
      if (on) await supabaseClient.from("wishlists").upsert({ user_id: u, product_id: id }, { onConflict: "user_id,product_id", ignoreDuplicates: true });
      else await supabaseClient.from("wishlists").delete().eq("user_id", u).in("product_id", group && group.length ? group : [id]);
    } catch (e) {}
  });
  window.addEventListener("aashapura-wish", () => paintHeart());
  setInterval(() => { const u = uid(); if (!u) syncedFor = null; else pull(); }, 2000);

  /* ---- product page heart ---- */
  function paintHeart() {
    const b = document.getElementById("ppWish"); if (!b) return;
    const id = Number(new URL(location.href).searchParams.get("product"));
    const on = W.has(window.primaryId ? window.primaryId(id) : id);
    b.classList.toggle("on", on); b.textContent = on ? "❤" : "♡";
  }
  (window.aashapuraPPHooks = window.aashapuraPPHooks || []).push((page, p) => {
    const b = page.querySelector("#ppWish"); if (!b) return;
    const pid = window.primaryId ? window.primaryId(p.id) : p.id;
    const on = () => W.has(pid);
    const paint = () => { b.classList.toggle("on", on()); b.textContent = on() ? "❤" : "♡"; };
    paint();
    b.onclick = () => { const now = W.toggle(pid); paint(); toast(now ? L("Added to wishlist ❤", "पसंदीदा में जोड़ा ❤") : L("Removed from wishlist", "पसंदीदा से हटाया"), now ? "success" : "info"); };
  });

  /* ---- wishlist page ---- */
  function open() {
    document.querySelectorAll(".wl-ov").forEach(e => e.remove());
    const el = document.createElement("div"); el.className = "wl-ov";
    document.body.appendChild(el);
    const A = window.aashapuraAddr && window.aashapuraAddr.ov; let shut;
    if (A) { A.push(el); shut = () => A.close(el); } else shut = () => el.remove();
    const draw = () => {
      const seen = new Set();
      const list = W.ids().map(id => products.find(p => p.id === window.primaryId(id))).filter(p => p && !seen.has(p.id) && seen.add(p.id));
      el.innerHTML = `<div class="wl-head"><button type="button" class="bk" aria-label="${L("Back", "वापस")}">←</button><b>${L("My Wishlist", "मेरी पसंदीदा सूची")}</b><small style="margin-left:auto;color:#68736c">${list.length} ${L(list.length === 1 ? "item" : "items", "आइटम")}</small></div>` +
        (list.length ? `<div class="wl-grid">${list.map(p => {
          const im = img(p), out = p.stock <= 0, off = p.mrp > p.price;
          return `<div class="wl-c"><button type="button" class="x" data-rm="${p.id}" aria-label="${L("Remove", "हटाएँ")}">❤</button>
            <div class="im" data-open="${p.id}">${im ? `<img src="${esc(im)}" alt="" loading="lazy">` : esc(p.emoji || "🌿")}</div>
            <h4 data-open="${p.id}">${esc(p.name)}${p.weight ? " · " + esc(p.weight) : ""}</h4>
            <div class="pr">₹${p.price}${off ? `<s>₹${p.mrp}</s>` : ""}</div>
            ${out ? `<button type="button" class="ad nt" data-nt="${p.id}">🔔 ${L("Notify me", "स्टॉक आने पर बताएँ")}</button>` : `<button type="button" class="ad" data-add="${p.id}">${L("Add to cart", "कार्ट में जोड़ें")}</button>`}</div>`;
        }).join("")}</div>` : `<div class="wl-empty"><div>💚</div><h3>${L("Your wishlist is empty", "आपकी पसंदीदा सूची खाली है")}</h3><p>${L("Tap the ♡ on any product to save it here.", "किसी भी प्रोडक्ट पर ♡ दबाकर यहाँ सेव करें।")}</p></div>`);
      el.querySelector(".bk").onclick = shut;
      el.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { W.toggle(b.dataset.rm); draw(); });
      el.querySelectorAll("[data-open]").forEach(b => b.onclick = () => { shut(); setTimeout(() => showProduct(Number(b.dataset.open)), 50); });
      el.querySelectorAll("[data-nt]").forEach(b => b.onclick = () => window.aashapuraNotify && window.aashapuraNotify.open(products.find(x => String(x.id) === b.dataset.nt)));
      el.querySelectorAll("[data-add]").forEach(b => b.onclick = e => {
        e.preventDefault(); e.stopPropagation();
        const id = b.dataset.add, p = products.find(x => String(x.id) === id); if (!p) return;
        if ((Number(cart[id]) || 0) >= p.stock) return toast(L("That is all we have in stock.", "स्टॉक में इतना ही उपलब्ध है।"), "error");
        cart[id] = (Number(cart[id]) || 0) + 1; renderCart(); toast(`${p.name} ${L("added to cart", "कार्ट में जोड़ा गया")}`);
      });
    };
    draw();
  }
  window.aashapuraWishlist = { open };
  const st = document.createElement("style");
  st.textContent = `.wl-ov{position:fixed;inset:0;z-index:100040;background:#f3f6f2;overflow-y:auto;color:#173d2e;-webkit-overflow-scrolling:touch}
  .wl-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border-bottom:1px solid #e3eadf;font-size:18px}
  .wl-head .bk{border:0;background:none;font-size:24px;cursor:pointer;color:inherit}
  .wl-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px;max-width:760px;margin:0 auto 60px}@media(min-width:700px){.wl-grid{grid-template-columns:repeat(3,1fr)}}
  .wl-c{position:relative;background:#fff;border:1px solid #e3eadf;border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:6px}
  .wl-c .x{position:absolute;top:8px;right:8px;z-index:1;width:32px;height:32px;border:0;border-radius:50%;background:rgba(255,255,255,.95);box-shadow:0 2px 8px rgba(0,0,0,.15);color:#d92d4b;font-size:17px;cursor:pointer}
  .wl-c .im{aspect-ratio:1;border-radius:10px;background:#eef3ea;display:flex;align-items:center;justify-content:center;font-size:44px;overflow:hidden;cursor:pointer}
  .wl-c .im img{width:100%;height:100%;object-fit:contain}
  .wl-c h4{margin:2px 0 0;font-size:14px;line-height:1.3;cursor:pointer}.wl-c .pr{font-weight:700}.wl-c .pr s{font-weight:400;color:#888;margin-left:6px;font-size:12px}
  .wl-c .ad{margin-top:auto;padding:10px;border-radius:10px;border:0;background:#2f6b3a;color:#fff;font:inherit;font-weight:600;cursor:pointer}.wl-c .ad:disabled{background:#d9dfd6;color:#6a766e;cursor:not-allowed}
  .wl-empty{text-align:center;padding:70px 24px;color:#4b6455}.wl-empty div{font-size:54px}.wl-empty h3{margin:10px 0 6px}`;
  document.head.appendChild(st);
})();
