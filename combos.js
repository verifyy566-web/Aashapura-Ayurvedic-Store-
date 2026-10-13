/* Combos / bundles: "Ashwagandha + Amla ek saath 15% sasta". Table: combos (supabase_v40_combos.sql).
   Discount AUTO lagta hai jab cart me combo ke saare products ho. Server (secure_new_order) wahi hisaab dobara karta hai. */
(function () {
  const $ = id => document.getElementById(id);
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rs = n => "₹" + (Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) {} };
  const P = () => { try { return products || []; } catch (e) { return []; } };
  const isVid = u => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(u || ""));
  const imgOf = p => {
    let u = []; try { const s = typeof p.images === "string" ? JSON.parse(p.images || "[]") : p.images; u = Array.isArray(s) ? s.slice() : []; } catch (e) {}
    if (p.image_url && !u.includes(p.image_url)) u.unshift(p.image_url);
    return u.filter(x => x && !isVid(x))[0] || "";
  };

  let COMBOS = [], loaded = false, loading = null;
  function load(force) {
    if (loading) return loading;
    if (loaded && !force) return Promise.resolve(COMBOS);
    loading = (async () => {
      try {
        const r = await supabaseClient.from("combos").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("id", { ascending: true });
        COMBOS = r.error ? [] : (r.data || []).map(c => { let it = c.items; if (typeof it === "string") { try { it = JSON.parse(it); } catch (e) { it = []; } } return { ...c, items: Array.isArray(it) ? it : [] }; });
      } catch (e) { COMBOS = []; }
      loaded = true; loading = null;
      try { if ($("cartFullPage")) window.renderCartPage(true); } catch (e) {}
      paintHome(true);
      return COMBOS;
    })();
    return loading;
  }

  /* combo ko products se jodo. valid = saare products mile aur saving > 0 */
  function info(c) {
    const rows = (c.items || []).map(i => ({ p: P().find(x => String(x.id) === String(i.id)), qty: Math.max(1, Number(i.qty) || 1) }));
    const ok = rows.length >= 2 && rows.every(r => r.p);
    const regular = ok ? rows.reduce((s, r) => s + Number(r.p.price || 0) * r.qty, 0) : 0;
    const price = Number(c.price) || 0, saving = ok ? Math.round((regular - price) * 100) / 100 : 0;
    return { c, rows, ok, regular, price, saving, pct: regular > 0 ? Math.round(saving / regular * 100) : 0, valid: ok && saving > 0, oos: ok && rows.some(r => r.p.stock < r.qty) };
  }
  const valid = () => COMBOS.map(info).filter(x => x.valid);

  /* cart ke items par kitne combo lage (server jaisa hi hisaab: sabse zyada saving wala pehle) */
  function calc(items) {
    const avail = {}; (items || []).forEach(i => { avail[String(i.id)] = (avail[String(i.id)] || 0) + Number(i.qty || 0); });
    const list = valid().sort((a, b) => b.saving - a.saving || a.c.id - b.c.id);
    let discount = 0; const applied = [];
    list.forEach(x => {
      let sets = Infinity;
      x.rows.forEach(r => { sets = Math.min(sets, Math.floor((avail[String(r.p.id)] || 0) / r.qty)); });
      if (!isFinite(sets) || sets < 1) return;
      x.rows.forEach(r => { avail[String(r.p.id)] -= sets * r.qty; });
      discount += sets * x.saving; applied.push({ combo: x.c, sets, saving: sets * x.saving });
    });
    discount = Math.round(discount * 100) / 100;
    const names = applied.map(a => a.combo.name + (a.sets > 1 ? " x" + a.sets : "")).join(", ");
    return { discount, applied, names };
  }
  /* kaun se combo adhure hain (cart me kuch products hain, baaki add karo) */
  function hints(items) {
    const have = {}; (items || []).forEach(i => { have[String(i.id)] = Number(i.qty || 0); });
    return valid().map(x => {
      const missing = x.rows.filter(r => (have[String(r.p.id)] || 0) < r.qty);
      const present = x.rows.length - missing.length;
      return { x, missing, present };
    }).filter(h => h.missing.length && h.present > 0 && !h.x.oos);
  }

  function addCombo(x, btn) {
    if (x.oos) return toast(L("Some product of this combo is out of stock.", "इस कॉम्बो का कोई प्रोडक्ट स्टॉक में नहीं है।"), "error");
    for (const r of x.rows) {
      if ((Number(cart[r.p.id]) || 0) + r.qty > r.p.stock) return toast(L(`Only ${r.p.stock} of ${r.p.name} in stock`, `${r.p.name} स्टॉक में सिर्फ़ ${r.p.stock} है`), "error");
    }
    x.rows.forEach(r => { cart[r.p.id] = (Number(cart[r.p.id]) || 0) + r.qty; });
    try { renderCart(); } catch (e) {}
    toast(L(`Combo added! You save ${rs(x.saving)}`, `कॉम्बो जुड़ गया! आप ${rs(x.saving)} बचा रहे हैं`));
    try { if ($("cartFullPage")) window.renderCartPage(true); } catch (e) {}
  }

  const css = document.createElement("style");
  css.textContent = `
  .cb-sec{margin:6px 0 14px}.cb-sec h3{margin:6px 12px 8px;font-size:17px;color:#173d2e}
  .cb-row{display:flex;gap:12px;overflow-x:auto;padding:4px 12px 10px;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}
  .cb-c{flex:0 0 min(78%,290px);scroll-snap-align:start;background:#fff;border:1px solid #dfe8da;border-radius:16px;padding:12px;position:relative;display:flex;flex-direction:column;gap:6px}
  .cb-off{position:absolute;top:10px;right:10px;background:#c2410c;color:#fff;border-radius:99px;padding:3px 10px;font-size:12px;font-weight:800}
  .cb-ims{display:flex;gap:6px;align-items:center;justify-content:center;background:#eef5ea;border-radius:12px;padding:8px;min-height:84px}
  .cb-ims .im{width:70px;height:70px;border-radius:10px;background:#fff;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:30px;flex:none}.cb-ims img{width:100%;height:100%;object-fit:cover}
  .cb-ims .pl{font-weight:800;color:#2f6b3a;font-size:20px}
  .cb-c h4{margin:2px 0 0;font-size:15px;color:#173d2e}.cb-c small{color:#5d7266;font-size:12.5px;line-height:1.4}
  .cb-p{display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}.cb-p b{font-size:20px;color:#173d2e}.cb-p s{color:#8a998f;font-size:13px}.cb-p em{font-style:normal;color:#17853f;font-weight:700;font-size:13px}
  .cb-c button{margin-top:4px;border:0;background:#123c2b;color:#fff;border-radius:10px;padding:11px;font:inherit;font-weight:700;cursor:pointer}.cb-c button:disabled{background:#9aa8a0}
  .cb-note{background:#fff7e6;border:1px solid #f1d9a0;color:#7a5200;border-radius:12px;padding:10px 12px;font-size:13.5px;line-height:1.45;margin-bottom:8px}
  .cb-ok{background:#e4f4e8;border:1px solid #bfe3c8;color:#17653a;border-radius:12px;padding:10px 12px;font-size:13.5px;font-weight:600;margin-bottom:8px}
  .cb-note button{margin-left:6px;border:1px solid #7a5200;background:#fff;color:#7a5200;border-radius:8px;padding:4px 10px;font:inherit;font-weight:700;font-size:12.5px;cursor:pointer}`;
  document.head.appendChild(css);

  const card = x => {
    const thumbs = x.c.image_url ? `<div class="im"><img src="${esc(x.c.image_url)}" alt="" loading="lazy"></div>`
      : x.rows.slice(0, 3).map(r => { const im = imgOf(r.p); return `<div class="im">${im ? `<img src="${esc(im)}" alt="" loading="lazy">` : esc(r.p.emoji || "🌿")}</div>`; }).join('<span class="pl">+</span>');
    return `<div class="cb-c"><span class="cb-off">${x.pct}% ${L("OFF", "छूट")}</span><div class="cb-ims">${thumbs}</div>
      <h4>${esc(x.c.name)}</h4><small>${esc(x.rows.map(r => r.p.name + (r.p.weight ? " " + r.p.weight : "") + (r.qty > 1 ? " ×" + r.qty : "")).join(" + "))}</small>
      ${x.c.description ? `<small>${esc(x.c.description)}</small>` : ""}
      <div class="cb-p"><b>${rs(x.price)}</b><s>${rs(x.regular)}</s><em>${L("Save", "बचत")} ${rs(x.saving)}</em></div>
      <button type="button" data-cb="${x.c.id}" ${x.oos ? "disabled" : ""}>${x.oos ? L("Out of stock", "स्टॉक खत्म") : L("Add combo to bag", "कॉम्बो कार्ट में जोड़ें")}</button></div>`;
  };
  const wire = root => root.querySelectorAll("[data-cb]").forEach(b => b.onclick = () => { const x = valid().find(v => String(v.c.id) === b.dataset.cb); if (x) addCombo(x); });

  /* home page strip */
  let homeSig = "";
  function paintHome(force) {
    const host = document.querySelector(".m-banners"); if (!host) return;
    const list = valid();
    const sig = JSON.stringify(list.map(x => [x.c.id, x.price, x.regular, x.oos]));
    let sec = $("cbHome");
    if (!list.length) { if (sec) sec.remove(); homeSig = ""; return; }
    if (sec && sig === homeSig && !force) return;
    homeSig = sig;
    if (!sec) { sec = document.createElement("div"); sec.id = "cbHome"; sec.className = "cb-sec"; host.after(sec); }
    sec.innerHTML = `<h3>🎁 ${L("Combo Offers · Buy together & save", "कॉम्बो ऑफ़र · साथ ख़रीदें, बचाएँ")}</h3><div class="cb-row">${list.map(card).join("")}</div>`;
    wire(sec);
  }

  /* product page */
  (window.aashapuraPPHooks = window.aashapuraPPHooks || []).push((page, p) => {
    load().then(() => {
      if (!document.body.contains(page)) return;
      page.querySelector(".pp-combos")?.remove();
      const list = valid().filter(x => x.rows.some(r => r.p.id === p.id)); if (!list.length) return;
      const sec = document.createElement("section"); sec.className = "pp-rel pp-combos cb-sec";
      sec.innerHTML = `<h3>🎁 ${L("Buy together & save", "साथ ख़रीदें, बचाएँ")}</h3><div class="cb-row">${list.map(card).join("")}</div>`;
      const anchor = page.querySelector(".pp-wrap"); anchor ? anchor.after(sec) : page.appendChild(sec);
      wire(sec);
    });
  });

  /* cart page: lagaya hua combo + "ye add karo to combo mil jayega" */
  function decorateCart() {
    const page = $("cartFullPage"); if (!page) return;
    page.querySelector(".cb-cart")?.remove();
    const items = (typeof cartItems === "function" ? cartItems() : []).filter(i => i.product.stock > 0); if (!items.length) return;
    const r = calc(items), hs = hints(items).slice(0, 2);
    let html = "";
    if (r.applied.length) html += `<div class="cb-ok">🎁 ${L("Combo offer applied", "कॉम्बो ऑफ़र लागू")}: ${esc(r.names)} — ${L("you save", "बचत")} ${rs(r.discount)}</div>`;
    hs.forEach(h => { html += `<div class="cb-note">🎁 <b>${esc(h.x.c.name)}</b>: ${L("add", "जोड़ें")} ${esc(h.missing.map(m => m.p.name).join(" + "))} ${L("and save", "और बचाएँ")} ${rs(h.x.saving)} (${h.x.pct}%) <button type="button" data-cbm="${h.x.c.id}">${L("Add", "जोड़ें")}</button></div>`; });
    if (!html) return;
    const box = document.createElement("div"); box.className = "cb-cart"; box.innerHTML = html;
    const anchor = page.querySelector(".ct-offers") || page.querySelector(".ct-pd") || page.querySelector(".ct-trust"); if (!anchor) return;
    anchor.before(box);
    box.querySelectorAll("[data-cbm]").forEach(b => b.onclick = () => {
      const h = hs.find(z => String(z.x.c.id) === b.dataset.cbm); if (!h) return;
      for (const m of h.missing) { const need = m.qty - (Number(cart[m.p.id]) || 0); if ((Number(cart[m.p.id]) || 0) + need > m.p.stock) return toast(L(`Only ${m.p.stock} of ${m.p.name} in stock`, `${m.p.name} स्टॉक में सिर्फ़ ${m.p.stock} है`), "error"); }
      h.missing.forEach(m => { cart[m.p.id] = Math.max(Number(cart[m.p.id]) || 0, m.qty); });
      try { renderCart(); window.renderCartPage(true); } catch (e) {}
      toast(L("Combo offer unlocked!", "कॉम्बो ऑफ़र मिल गया!"));
    });
  }
  const prev = window.renderCartPage;
  if (typeof prev === "function") {
    window.renderCartPage = function () { const r = prev.apply(this, arguments); try { decorateCart(); } catch (e) {} return r; };
  }

  window.aashapuraCombos = { load, calc, hints, list: () => COMBOS, info, valid };
  load(); setInterval(() => paintHome(false), 2500);
})();
