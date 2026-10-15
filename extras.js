/* Extras: "Frequently bought together" (product page + cart), search suggestions, "Notify me" for out-of-stock + admin Stock Alerts. */
(function () {
  const $ = id => document.getElementById(id);
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rs = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  const sb = () => supabaseClient;
  const ADMIN = "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3", WA = String((window.AASHAPURA_CONFIG && window.AASHAPURA_CONFIG.support) || "916367561630");
  const norm = p => String(p.name || "").trim().toLowerCase().replace(/\s+/g, " ");
  const isVid = u => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(u || ""));
  const imgOf = p => {
    let u = []; try { const s = typeof p.images === "string" ? JSON.parse(p.images || "[]") : p.images; u = Array.isArray(s) ? s.slice() : []; } catch (e) {}
    if (p.image_url && !u.includes(p.image_url)) u.unshift(p.image_url);
    return u.filter(x => x && !isVid(x))[0] || "";
  };
  const P = () => { try { return products || []; } catch (e) { return []; } };
  const prim = id => (window.primaryId ? window.primaryId(id) : Number(id));
  /* one in-stock size of a product group (or null if every size is out) */
  const pick = pid => {
    const p0 = P().find(x => x.id === pid); if (!p0) return null;
    const g = P().filter(x => norm(x) === norm(p0) && x.stock > 0).sort((a, b) => a.id - b.id);
    return g[0] || null;
  };

  const st = document.createElement("style");
  st.textContent = `
  .fbt-row{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 8px;-webkit-overflow-scrolling:touch}
  .fbt-c{flex:0 0 132px;border:1px solid #e3e8e1;border-radius:12px;padding:8px;background:#fff;display:flex;flex-direction:column;gap:4px;cursor:pointer;text-align:left}
  .fbt-c .im{aspect-ratio:1;border-radius:8px;background:#eef3ea;display:flex;align-items:center;justify-content:center;font-size:36px;overflow:hidden}.fbt-c .im img{width:100%;height:100%;object-fit:contain}
  .fbt-c h4{margin:2px 0 0;font-size:13px;font-weight:500;line-height:1.25;color:#173d2e;min-height:32px}.fbt-c .pr{font-weight:700;font-size:14px;color:#173d2e}.fbt-c .pr s{font-weight:400;color:#888;font-size:11px;margin-left:4px}
  .fbt-c button{margin-top:auto;border:1px solid #2f6b3a;background:#fff;color:#2f6b3a;border-radius:8px;padding:7px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
  .fbt-c button:active{background:#2f6b3a;color:#fff}
  .pp-fbt h3{margin:20px 0 8px}.add-btn.notify-btn{background:#8a5a00}
  .sg-box{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:900;background:#fff;border:1px solid #dfe8da;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.16);overflow:hidden;max-height:60vh;overflow-y:auto}
  .sg-box button{display:flex;width:100%;gap:10px;align-items:center;padding:9px 12px;border:0;border-bottom:1px solid #f0f3ee;background:#fff;font:inherit;text-align:left;cursor:pointer;color:#173d2e}
  .sg-box button:last-child{border-bottom:0}.sg-box button:active,.sg-box button:hover{background:#f3f8ef}
  .sg-box .th{width:38px;height:38px;border-radius:8px;background:#eef3ea;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none;font-size:20px}.sg-box .th img{width:100%;height:100%;object-fit:cover}
  .sg-box .tx{min-width:0;flex:1}.sg-box .tx b{display:block;font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.sg-box .tx small{color:#6a7d70;font-size:12px}
  .sg-box .sg-p{font-weight:700;font-size:13px;flex:none}.sg-box .sg-out{color:#b42318;font-size:11px;font-weight:600}
  .sg-box .sg-all{color:#2f6b3a;font-weight:700;justify-content:center}
  .nt-back{position:fixed;inset:0;background:rgba(10,25,18,.55);z-index:100200;display:flex;align-items:flex-end;justify-content:center}
  .nt-sheet{width:min(100%,480px);background:#fff;border-radius:20px 20px 0 0;padding:20px 18px 24px;color:#173d2e;animation:ntu .22s ease}@keyframes ntu{from{transform:translateY(40px);opacity:0}}
  .nt-sheet h3{margin:0 0 4px;font-size:19px}.nt-sheet p{margin:0 0 12px;color:#5d7266;font-size:14px;line-height:1.5}
  .nt-sheet label{display:block;font-size:13px;color:#4b6455;margin:10px 0 3px}.nt-sheet input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cfd9cb;border-radius:10px;font:inherit}
  .nt-row{display:flex;gap:10px;margin-top:16px}.nt-row button{flex:1;padding:13px;border-radius:12px;border:0;font:inherit;font-weight:700;cursor:pointer}
  .nt-go{background:#2f6b3a;color:#fff}.nt-x{background:#eef2ec;color:#173d2e}
  .nt-prod{display:flex;gap:10px;align-items:center;background:#f3f8ef;border-radius:12px;padding:8px;margin-bottom:6px}.nt-prod .th{width:44px;height:44px;border-radius:8px;background:#e3ecde;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:24px;flex:none}.nt-prod .th img{width:100%;height:100%;object-fit:cover}
  .al-p{border:1px solid #e3e8e1;border-radius:12px;background:#fff;margin:10px 0;padding:10px}.al-p.back{border-color:#9ccb9c;background:#f4fbf4}
  .al-p h4{margin:0 0 2px;font-size:15px}.al-p small{color:#6a7d70}
  .al-u{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid #eef1ec;font-size:14px}.al-u:first-of-type{margin-top:6px}
  .al-u button{border:1px solid #888;background:#fff;border-radius:8px;padding:7px 10px;font:inherit;font-size:13px;cursor:pointer}.al-u .wa{background:#25d366;border-color:#25d366;color:#fff}
  .al-bk{display:inline-block;background:#dcfce7;color:#166534;border-radius:99px;padding:2px 9px;font-size:12px;font-weight:700;margin-left:4px}`;
  document.head.appendChild(st);

  /* ================= FREQUENTLY BOUGHT TOGETHER ================= */
  let pairs = null, pairsP = null;
  function loadPairs() {
    if (pairsP) return pairsP;
    pairsP = (async () => {
      try { const r = await sb().rpc("product_pairs"); pairs = r.error ? [] : (r.data || []); } catch (e) { pairs = []; }
      return pairs;
    })();
    return pairsP;
  }
  /* returns product objects (one in-stock size each), best first */
  function suggest(forIds, exclude, max, fallback) {
    const base = new Set(forIds.map(prim)), skip = new Set(exclude.map(prim));
    const score = new Map();
    (pairs || []).forEach(r => { const a = prim(r.a); if (base.has(a)) { const b = prim(r.b); if (!skip.has(b)) score.set(b, (score.get(b) || 0) + Number(r.n || 0)); } });
    const out = []; const seen = new Set();
    const add = pid => { if (seen.has(pid) || skip.has(pid)) return; const p = pick(pid); if (p) { seen.add(pid); out.push(p); } };
    [...score.entries()].sort((a, b) => b[1] - a[1]).forEach(([pid]) => { if (out.length < max) add(pid); });
    const real = out.length;
    if (fallback && out.length < max) {
      const cats = new Set(forIds.map(id => { const p = P().find(x => x.id === Number(id)); return p && String(p.category || "").toLowerCase(); }));
      const rest = P().filter(p => !skip.has(prim(p.id))).sort((a, b) => (cats.has(String(b.category || "").toLowerCase()) ? 1 : 0) - (cats.has(String(a.category || "").toLowerCase()) ? 1 : 0) || a.id - b.id);
      rest.forEach(p => { if (out.length < max) add(prim(p.id)); });
    }
    out.real = real; return out;
  }
  const miniCard = p => `<div class="fbt-c" data-open="${p.id}"><div class="im">${imgOf(p) ? `<img src="${esc(imgOf(p))}" alt="" loading="lazy">` : esc(p.emoji || "🌿")}</div><h4>${esc(p.name)}${p.weight ? " · " + esc(p.weight) : ""}</h4><div class="pr">${rs(p.price)}${p.mrp > p.price ? `<s>${rs(p.mrp)}</s>` : ""}</div><button type="button" data-add="${p.id}">+ ${L("Add", "जोड़ें")}</button></div>`;
  function wireMini(root, after) {
    root.querySelectorAll("[data-open]").forEach(c => c.onclick = e => { if (e.target.closest("[data-add]")) return; showProduct(Number(c.dataset.open)); });
    root.querySelectorAll("[data-add]").forEach(b => b.onclick = e => {
      e.stopPropagation();
      const id = String(b.dataset.add), p = P().find(x => String(x.id) === id); if (!p) return;
      if ((Number(cart[id]) || 0) >= p.stock) return toast(L("That is all we have in stock.", "स्टॉक में इतना ही उपलब्ध है।"), "error");
      cart[id] = (Number(cart[id]) || 0) + 1; renderCart(); toast(`${p.name} ${L("added to cart", "कार्ट में जोड़ा गया")}`);
      if (after) after();
    });
  }

  /* product page */
  (window.aashapuraPPHooks = window.aashapuraPPHooks || []).push((page, p) => {
    /* out of stock -> Notify me */
    const dis = page.querySelector(".pp-btn[disabled]");
    if (dis) { dis.disabled = false; dis.className = "pp-btn buy"; dis.textContent = "🔔 " + L("Notify me when available", "स्टॉक आने पर बताएँ"); dis.onclick = () => openNotify(p); }
    loadPairs().then(() => {
      if (!document.body.contains(page)) return;
      const grp = P().filter(x => norm(x) === norm(p)).map(x => x.id);
      const list = suggest(grp, grp, 8, false);
      page.querySelector(".pp-fbt")?.remove();
      if (!list.length) return;
      const sec = document.createElement("section"); sec.className = "pp-rel pp-fbt";
      sec.innerHTML = `<h3>🛒 ${L("Frequently bought together", "अक्सर साथ खरीदे जाते हैं")}</h3><div class="fbt-row">${list.map(miniCard).join("")}</div>`;
      const anchor = page.querySelector(".pp-wrap");
      anchor ? anchor.after(sec) : page.appendChild(sec);
      wireMini(sec);
    });
  });

  /* cart page */
  function decorateCart() {
    const page = $("cartFullPage"); if (!page) return;
    page.querySelector(".ct-fbt")?.remove();
    const ids = Object.keys(cart || {}).filter(k => Number(cart[k]) > 0).map(Number); if (!ids.length) return;
    const list = suggest(ids, ids, 8, true); if (!list.length) return;
    const host = page.querySelector(".ct-trust"); if (!host) return;
    const card = document.createElement("div"); card.className = "ct-card ct-fbt";
    card.innerHTML = `<h4 style="margin:0 0 8px">🛒 ${list.real ? L("Frequently bought together", "अक्सर साथ खरीदे जाते हैं") : L("You may also like", "आपको ये भी पसंद आएँगे")}</h4><div class="fbt-row">${list.map(miniCard).join("")}</div>`;
    host.before(card);
    wireMini(card, () => { try { renderCartPage(true); } catch (e) {} });
  }
  const origCart = window.renderCartPage;
  if (typeof origCart === "function") {
    window.renderCartPage = function () { const r = origCart.apply(this, arguments); try { decorateCart(); loadPairs().then(decorateCart); } catch (e) {} return r; };
    if ($("cartFullPage")) window.renderCartPage(true);
  }

  /* ================= SEARCH SUGGESTIONS ================= */
  function attachSuggest(input) {
    if (!input) return;
    const wrap = input.parentElement; if (!wrap) return;
    if (getComputedStyle(wrap).position === "static") wrap.style.position = "relative";
    const box = document.createElement("div"); box.className = "sg-box"; box.hidden = true; wrap.appendChild(box);
    const hide = () => { box.hidden = true; box.innerHTML = ""; };
    const run = () => {
      const q = input.value.trim().toLowerCase();
      if (q.length < 1) return hide();
      const seen = new Set(), hits = [];
      P().forEach(p => {
        const k = norm(p); if (seen.has(k)) return;
        const hay = (p.name + " " + (p.category || "")).toLowerCase();
        const words = hay.split(/\s+/);
        const s = hay.startsWith(q) ? 0 : words.some(w => w.startsWith(q)) ? 1 : hay.includes(q) ? 2 : -1;
        if (s < 0) return; seen.add(k); hits.push({ p, s });
      });
      hits.sort((a, b) => a.s - b.s || a.p.name.localeCompare(b.p.name));
      /* v65: related products for Hindi / Roman / health words (bawasir, pachan, hair fall ...) + spelling help */
      let dym = "";
      try {
        const C = window.aashapuraConcern;
        if (C) {
          C.search(q).forEach(p => { const k = norm(p); if (seen.has(k)) return; seen.add(k); hits.push({ p, s: 3 }); });
          if (!hits.length) dym = C.didYouMean(q);
        }
      } catch (e) {}
      if (!hits.length && dym) {
        box.innerHTML = `<button type="button" data-dym="${esc(dym)}"><span class="th">🔍</span><span class="tx"><b>${L("Did you mean", "क्या आपका मतलब है")}: ${esc(dym)}?</b><small>${L("Tap to search", "खोजने के लिए दबाएँ")}</small></span></button>`;
        box.hidden = false; return;
      }
      if (!hits.length) { box.innerHTML = `<button type="button" style="cursor:default"><span class="th">🔍</span><span class="tx"><b>${L("No product found", "कोई प्रोडक्ट नहीं मिला")}</b><small>${L("Try another word, e.g. ashwagandha, powder", "दूसरा शब्द आज़माएँ, जैसे ashwagandha, powder")}</small></span></button>`; box.hidden = false; return; }
      const top = hits.slice(0, 6);
      box.innerHTML = top.map(({ p }) => {
        const g = P().filter(x => norm(x) === norm(p)), anyIn = g.some(x => x.stock > 0), minP = Math.min(...g.map(x => x.price));
        return `<button type="button" data-sg="${prim(p.id)}"><span class="th">${imgOf(p) ? `<img src="${esc(imgOf(p))}" alt="">` : esc(p.emoji || "🌿")}</span><span class="tx"><b>${esc(p.name)}</b><small>${esc(p.category || "")}${p.weight && g.length === 1 ? " · " + esc(p.weight) : ""}</small></span>${anyIn ? `<span class="sg-p">${g.length > 1 ? L("from ", "") : ""}${rs(minP)}</span>` : `<span class="sg-out">${L("Out of stock", "स्टॉक खत्म")}</span>`}</button>`;
      }).join("") + (hits.length > 6 ? `<button type="button" class="sg-all" data-all="1">${L("See all", "सभी देखें")} ${hits.length} ${L("results", "परिणाम")}</button>` : "");
      box.hidden = false;
    };
    input.addEventListener("input", run);
    input.addEventListener("focus", run);
    box.addEventListener("mousedown", e => e.preventDefault());
    box.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.dym) { input.value = b.dataset.dym; input.dispatchEvent(new Event("input", { bubbles: true })); return; }
      if (b.dataset.sg) { hide(); input.blur(); showProduct(Number(b.dataset.sg)); }
      else if (b.dataset.all) { hide(); input.blur(); const s = $("shop"); if (s) s.scrollIntoView({ behavior: "smooth" }); }
    });
    input.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === "Escape") hide(); });
    document.addEventListener("click", e => { if (!wrap.contains(e.target)) hide(); });
  }
  attachSuggest($("homeSearch")); attachSuggest($("searchInput"));

  /* ================= NOTIFY ME ================= */
  const NK = "aashapura_notify";
  const seenN = () => { try { return JSON.parse(localStorage.getItem(NK) || "[]"); } catch (e) { return []; } };
  function openNotify(p) {
    if (!p) return;
    document.querySelectorAll(".nt-back").forEach(x => x.remove());
    let nm = "", ph = "";
    try { const c = JSON.parse(localStorage.getItem(NK + "_c") || "{}"); nm = c.n || ""; ph = c.p || ""; } catch (e) {}
    nm = nm || ($("profileName") && $("profileName").value) || ($("customerName") && $("customerName").value) || "";
    ph = ph || ($("profilePhone") && $("profilePhone").value) || "";
    const el = document.createElement("div"); el.className = "nt-back";
    el.innerHTML = `<div class="nt-sheet" role="dialog"><div class="nt-prod"><span class="th">${imgOf(p) ? `<img src="${esc(imgOf(p))}" alt="">` : esc(p.emoji || "🌿")}</span><div><b>${esc(p.name)}</b><br><small>${esc(p.weight || "")}</small></div></div>
      <h3>🔔 ${L("Notify me when available", "स्टॉक आने पर बताएँ")}</h3><p>${L("Leave your name and WhatsApp number. We will message you as soon as this is back in stock.", "अपना नाम और WhatsApp नंबर दें। स्टॉक आते ही हम आपको मैसेज करेंगे।")}</p>
      <label>${L("Your name", "आपका नाम")}</label><input id="ntName" autocomplete="name" value="${esc(nm)}">
      <label>${L("WhatsApp / mobile number", "WhatsApp / मोबाइल नंबर")}</label><input id="ntPhone" type="tel" inputmode="numeric" maxlength="14" autocomplete="tel" placeholder="10-digit" value="${esc(ph)}">
      <div class="nt-row"><button type="button" class="nt-x">${L("Cancel", "रद्द करें")}</button><button type="button" class="nt-go">${L("Notify me", "मुझे बताएँ")}</button></div></div>`;
    document.body.appendChild(el);
    const shut = () => el.remove();
    el.onclick = e => { if (e.target === el) shut(); };
    el.querySelector(".nt-x").onclick = shut;
    const go = el.querySelector(".nt-go");
    go.onclick = async () => {
      const name = el.querySelector("#ntName").value.trim(), phone = el.querySelector("#ntPhone").value.replace(/\D/g, "").slice(-10);
      if (!name) return toast(L("Please enter your name.", "कृपया अपना नाम लिखें।"), "error");
      if (phone.length !== 10) return toast(L("Enter a valid 10-digit number.", "सही 10 अंकों का नंबर लिखें।"), "error");
      const key = prim(p.id) + ":" + phone;
      if (seenN().includes(key)) { shut(); return toast(L("Already saved. We will message you when it is back.", "पहले से सेव है। स्टॉक आते ही बताएँगे।"), "info"); }
      go.disabled = true; go.textContent = "…";
      let uid = null; try { uid = signedInUser && signedInUser.id || null; } catch (e) {}
      const { error } = await sb().from("stock_alerts").insert({ product_id: prim(p.id), product_name: p.name + (p.weight ? " " + p.weight : ""), customer_name: name, phone, user_id: uid });
      if (error) { go.disabled = false; go.textContent = L("Notify me", "मुझे बताएँ"); return toast(/stock_alerts|relation|schema/i.test(error.message) ? L("Notify feature is not ready yet. Please try later.", "यह सुविधा अभी तैयार नहीं है, बाद में कोशिश करें।") : error.message, "error"); }
      try { localStorage.setItem(NK, JSON.stringify([...seenN(), key])); localStorage.setItem(NK + "_c", JSON.stringify({ n: name, p: phone })); } catch (e) {}
      shut(); toast(L("Done! We will WhatsApp you when it is back in stock. 🔔", "ठीक है! स्टॉक आते ही WhatsApp करेंगे। 🔔") + (uid ? "" : L(" Sign in to also see it in your 🔔 bell.", " Sign In करेंगे तो 🔔 में भी दिखेगा।")));
    };
  }
  window.aashapuraNotify = { open: openNotify };
  /* out-of-stock card buttons in the shop grid (captured before the card opens the product page) */
  const grid = $("productGrid");
  if (grid) grid.addEventListener("click", e => { const b = e.target.closest("[data-notify]"); if (!b) return; e.stopPropagation(); openNotify(P().find(x => String(x.id) === b.dataset.notify)); }, true);

  /* ================= ADMIN: STOCK ALERTS ================= */
  const host = $("admSec-alerts");
  if (host) {
    let mode = "wait", started = false;
    const adminOk = async () => { try { const { data: { user } } = await sb().auth.getUser(); return !!user && user.id === ADMIN; } catch (e) { return false; } };
    const dt = d => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
    const waMsg = u => `Namaste ${u.customer_name || ""}, Aashapura Ayurveda se: aapka wait kiya hua "${u.product_name || "product"}" ab stock mein aa gaya hai. Order karne ke liye store dekhein. Dhanyavaad!`;
    /* v65: the same "back in stock" message also goes to the customer's Notification (bell) icon */
    const bellFor = u => (window.aashapuraPush ? window.aashapuraPush({ user_id: u.user_id, phone: u.phone, kind: "stock", title: (u.product_name || "Product") + " ab stock me hai 🌿", body: "Aapka wait kiya hua \"" + (u.product_name || "product") + "\" ab stock mein aa gaya hai. Order karne ke liye dabayein.", link: "product:" + u.product_id, product_id: u.product_id, key: "alert" + u.id, daily: false }) : Promise.resolve(null));
    /* one-by-one WhatsApp queue: tap once per customer (browser cannot open many chats at once) */
    function runQueue(us) {
      if (!us.length) return;
      let i = 0;
      const ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;z-index:100300;background:rgba(10,25,18,.6);display:flex;align-items:flex-end;justify-content:center";
      const paint = () => {
        if (i >= us.length) { ov.remove(); toast("Sabko message bhej diya ✅"); draw(); return; }
        const u = us[i];
        ov.innerHTML = `<div style="background:#fff;width:100%;max-width:520px;border-radius:22px 22px 0 0;padding:20px 18px 22px"><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:17px">📲 ${i + 1} / ${us.length}</b><button type="button" id="qX" style="border:0;background:none;font-size:24px">×</button></div>
          <p style="margin:10px 0 4px"><b>${esc(u.customer_name || "Customer")}</b><br><small>📞 ${esc(u.phone)} · ${esc(u.product_name || "")}</small></p>
          <p style="background:#f3f7f1;border-radius:12px;padding:10px;font-size:13px;color:#34493d">${esc(waMsg(u))}</p>
          <div style="display:flex;gap:10px"><button type="button" id="qSkip" style="flex:1;padding:13px;border-radius:12px;border:1px solid #cdd8cf;background:#fff;font-weight:700">Skip</button><button type="button" id="qGo" style="flex:2;padding:13px;border-radius:12px;border:0;background:#25a244;color:#fff;font-weight:800">💬 WhatsApp kholo &amp; Done</button></div></div>`;
        ov.querySelector("#qX").onclick = () => { ov.remove(); draw(); };
        ov.querySelector("#qSkip").onclick = () => { i++; paint(); };
        ov.querySelector("#qGo").onclick = () => {
          window.open(`https://wa.me/91${String(u.phone).replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(waMsg(u))}`, "_blank", "noopener");
          bellFor(u); sb().from("stock_alerts").update({ notified: true }).eq("id", u.id).then(() => {}); i++; paint();
        };
      };
      document.body.appendChild(ov); paint();
    }
    async function draw() {
      if (!(await adminOk())) return;
      started = true;
      host.innerHTML = "<p>Loading…</p>";
      const r = await sb().from("stock_alerts").select("*").order("created_at", { ascending: false }).limit(500);
      if (r.error) { host.innerHTML = `<p style="color:#b42318">${esc(r.error.message)}<br>Supabase SQL Editor me <b>supabase_v23.sql</b> run karo.</p>`; return; }
      const rows = (r.data || []).filter(x => mode === "wait" ? !x.notified : !!x.notified);
      const waiting = (r.data || []).filter(x => !x.notified).length;
      const groups = new Map();
      rows.forEach(x => { const k = x.product_id; (groups.get(k) || groups.set(k, []).get(k)).push(x); });
      const stockOf = pid => { const p = P().find(x => x.id === Number(pid)); if (!p) return null; return P().filter(x => norm(x) === norm(p)).reduce((s, x) => s + Number(x.stock || 0), 0); };
      const list = [...groups.entries()].map(([pid, us]) => ({ pid, us, stock: stockOf(pid) })).sort((a, b) => ((b.stock > 0) - (a.stock > 0)) || b.us.length - a.us.length);
      host.innerHTML = `<div class="adm-bar"><span class="adm-sub">${waiting} customers waiting</span><span><button type="button" data-m="wait" style="${mode === "wait" ? "background:#2f6b3a;color:#fff" : ""}">Waiting</button> <button type="button" data-m="done" style="${mode === "done" ? "background:#2f6b3a;color:#fff" : ""}">Informed</button> <button type="button" id="alRe" aria-label="Refresh">↻</button></span></div>` +
        (list.length ? list.map(g => {
          const name = g.us[0].product_name || ("#" + g.pid), back = g.stock > 0;
          return `<div class="al-p ${back ? "back" : ""}"><h4>${esc(name)}${back ? `<span class="al-bk">Back in stock (${g.stock})</span>` : ""}</h4><small>${g.us.length} ${mode === "wait" ? "waiting" : "informed"}${back ? "" : " · stock abhi 0"}</small>${back && mode === "wait" ? `<div class="al-bulk" style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 4px"><button type="button" data-bellall="${g.pid}" style="padding:9px 12px;border-radius:10px;border:1px solid #2f6b3a;background:#fff;color:#2f6b3a;font-weight:700">🔔 Sabko app notification (${g.us.length})</button><button type="button" data-queue="${g.pid}" style="padding:9px 12px;border-radius:10px;border:0;background:#2f6b3a;color:#fff;font-weight:700">📲 WhatsApp one-by-one</button></div>` : ""}
            ${g.us.map(u => `<div class="al-u"><div><b>${esc(u.customer_name || "Customer")}</b><br><small>📞 ${esc(u.phone)} · ${esc(dt(u.created_at))}</small></div><div style="display:flex;gap:6px;flex:none"><button type="button" class="wa" data-wa="${u.id}">💬 WhatsApp</button>${mode === "wait" ? `<button type="button" data-done="${u.id}">✓</button>` : ""}</div></div>`).join("")}</div>`;
        }).join("") : `<p>${mode === "wait" ? "Koi customer wait nahi kar raha." : "Abhi koi record nahi."}</p>`);
      host.querySelectorAll("[data-m]").forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
      host.querySelector("#alRe").onclick = draw;
      host.querySelectorAll("[data-bellall]").forEach(b => b.onclick = async () => {
        const us = rows.filter(x => String(x.product_id) === b.dataset.bellall); b.disabled = true;
        const rs = await Promise.all(us.map(bellFor));
        const n = rs.filter(r => r && r.ok).length;
        toast(n ? "🔔 " + n + " customers ke Notification icon me bhej diya" : "Notification nahi gayi (supabase_v65_notifications.sql run kiya?)", n ? undefined : "error"); b.disabled = false;
      });
      host.querySelectorAll("[data-queue]").forEach(b => b.onclick = () => runQueue(rows.filter(x => String(x.product_id) === b.dataset.queue)));
      host.querySelectorAll("[data-wa]").forEach(b => b.onclick = async () => {
        const u = rows.find(x => String(x.id) === b.dataset.wa); if (!u) return;
        const msg = `Namaste ${u.customer_name || ""}, Aashapura Ayurveda se: aapka wait kiya hua "${u.product_name || "product"}" ab stock mein aa gaya hai. Order karne ke liye store dekhein. Dhanyavaad!`;
        window.open(`https://wa.me/91${String(u.phone).replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
        bellFor(u);
        if (mode === "wait" && await confirm("Message bhej diya? 'Informed' me daal dein?")) { const x = await sb().from("stock_alerts").update({ notified: true }).eq("id", u.id); if (x.error) toast(x.error.message, "error"); draw(); }
      });
      host.querySelectorAll("[data-done]").forEach(b => b.onclick = async () => { const x = await sb().from("stock_alerts").update({ notified: true }).eq("id", b.dataset.done); if (x.error) return toast(x.error.message, "error"); draw(); });
    }
    const box = $("adminProductBox");
    if (box) {
      const go = () => { if (box.style.display !== "none" && !started) draw(); };
      new MutationObserver(go).observe(box, { attributes: true, attributeFilter: ["style"] });
      setTimeout(go, 1800);
    }
    window.aashapuraAlertsRefresh = draw;
  }
})();
