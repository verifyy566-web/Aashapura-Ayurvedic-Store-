/* v65: Shop by health concern + smart search (Hindi / Roman / English words) + right-side ≡ menu button.
   - window.aashapuraConcern.list            concern definitions
   - .products(key)                          products for one concern (best match first)
   - .search(q)                              products related to a typed word (concern words, herbs, Ayurveda AI database)
   - .hit(p, q)                              does product p match typed word q (used by shop grid search)
   - .didYouMean(q)                          spelling suggestion (or "")
   - .open(key)                              full-screen result page
   - .drawerSection(close)                   block shown at the top of the right-side menu                        */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const P = () => { try { return Array.isArray(products) ? products : []; } catch (e) { return []; } };

  /* kw = words customers type (English, Roman Hindi, Devanagari) + common herbs/medicine words used in product names */
  const CONCERNS = [
    { k: "digestion", e: "🍵", en: "Digestion", hi: "पाचन / गैस", kw: ["digest", "gas", "acidity", "acid", "kabz", "kabj", "constipation", "indigestion", "apchan", "pachan", "pet dard", "pet ", "bloating", "amlapitta", "triphala", "hing", "ajwain", "jeera", "haritaki", "pudina", "gasantak", "churna", "पाचन", "गैस", "कब्ज", "एसिडिटी", "पेट", "त्रिफला", "चूर्ण"] },
    { k: "immunity", e: "🛡️", en: "Immunity & Fever", hi: "इम्युनिटी / बुखार", kw: ["immun", "giloy", "guduchi", "tulsi", "moringa", "sahijan", "sehjan", "kadha", "chyawan", "chyavan", "fever", "bukhar", "amla", "प्रतिरोधक", "इम्युनिटी", "गिलोय", "बुखार", "तुलसी", "सहजन"] },
    { k: "cold", e: "🤧", en: "Cough & Cold", hi: "सर्दी-खांसी", kw: ["cough", "cold", "khansi", "khasi", "sardi", "zukam", "jukam", "gala", "throat", "tulsi", "mulethi", "yashtimadhu", "sitopaladi", "vasa", "adusa", "खांसी", "खाँसी", "सर्दी", "जुकाम", "गला", "मुलेठी"] },
    { k: "joint", e: "🦴", en: "Joint & Back Pain", hi: "जोड़ों / कमर का दर्द", kw: ["joint", "jodo", "jodon", "arthritis", "gathiya", "gathia", "sandhivat", "back pain", "kamar", "dard", "pain", "guggul", "shallaki", "nirgundi", "mahanarayan", "haddi", "bone", "calcium", "हड्डी", "जोड़", "गठिया", "कमर", "दर्द"] },
    { k: "hair", e: "💇", en: "Hair Fall & Dandruff", hi: "बाल झड़ना / रूसी", kw: ["hair", "baal", "bal jhad", "dandruff", "roosi", "rusi", "ganj", "bhringraj", "bhrungraj", "shikakai", "reetha", "बाल", "रूसी", "गंजा", "भृंगराज", "आंवला", "amla"] },
    { k: "skin", e: "✨", en: "Skin & Pimples", hi: "त्वचा / मुँहासे", kw: ["skin", "twacha", "pimple", "acne", "muhase", "muhaase", "daag", "dag", "glow", "face", "neem", "haldi", "turmeric", "khujli", "itch", "fungal", "ubtan", "चेहरा", "त्वचा", "मुंहासे", "मुँहासे", "खुजली", "नीम", "हल्दी"] },
    { k: "sugar", e: "🩸", en: "Sugar / Diabetes", hi: "शुगर / मधुमेह", kw: ["sugar", "diabet", "madhumeh", "madhumeha", "glucose", "karela", "jamun", "methi", "gudmar", "vijaysar", "शुगर", "मधुमेह", "डायबिटीज", "करेला", "जामुन", "मेथी"] },
    { k: "weight", e: "⚖️", en: "Weight Loss", hi: "मोटापा / वजन", kw: ["weight", "motapa", "mota", "obes", "slim", "belly", "garcinia", "guggul", "मोटापा", "वजन", "चर्बी"] },
    { k: "stress", e: "😴", en: "Stress & Sleep", hi: "तनाव / नींद", kw: ["stress", "tanav", "anxiety", "neend", "nind", "sleep", "insomnia", "memory", "yaadash", "yadash", "brahmi", "ashwagandha", "jatamansi", "shankhpushpi", "तनाव", "नींद", "याददाश्त", "ब्राह्मी", "अश्वगंधा"] },
    { k: "piles", e: "🩹", en: "Piles", hi: "बवासीर", kw: ["pile", "bawasir", "bavasir", "bavaseer", "arsh", "fissure", "fistula", "बवासीर", "अर्श"] },
    { k: "liver", e: "🍃", en: "Liver", hi: "लिवर / जिगर", kw: ["liver", "jigar", "fatty", "jaundice", "piliya", "kalmegh", "bhumiamla", "bhumyamalaki", "kutki", "punarnava", "लिवर", "जिगर", "पीलिया", "कुटकी"] },
    { k: "heart", e: "❤️", en: "BP & Heart", hi: "बीपी / दिल", kw: ["bp ", "blood pressure", "cholesterol", "heart", "hriday", "arjun", "sarpagandha", "ब्लड प्रेशर", "कोलेस्ट्रॉल", "हृदय", "अर्जुन"] },
    { k: "women", e: "🌸", en: "Women's Health", hi: "महिला स्वास्थ्य", kw: ["women", "woman", "mahila", "period", "mahavari", "mahwari", "pcos", "pcod", "irregular", "white discharge", "safed pani", "leucorrh", "shatavari", "ashoka", "lodhra", "महिला", "माहवारी", "पीरियड", "शतावरी", "अशोक"] },
    { k: "energy", e: "💪", en: "Energy & Strength", hi: "ताकत / कमजोरी", kw: ["energy", "strength", "stamina", "kamzori", "kamjori", "weakness", "taqat", "takat", "shakti", "ashwagandha", "shilajit", "musli", "kaunch", "ताकत", "कमजोरी", "शक्ति", "स्टैमिना", "शिलाजीत"] }
  ];

  const lc = s => String(s == null ? "" : s).toLowerCase();
  const isLatin = s => /^[\x00-\x7f]+$/.test(s);
  const kwRe = new Map();
  function kwHit(text, kw) {
    if (!isLatin(kw)) return text.includes(kw);
    if (kw.length <= 4 && !kw.endsWith(" ")) {
      let r = kwRe.get(kw); if (!r) { r = new RegExp("(^|[^a-z])" + kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")); kwRe.set(kw, r); }
      return r.test(text);
    }
    return text.includes(kw);
  }
  const nameKey = p => lc(p.name).replace(/\s+/g, " ").trim();
  const dedupe = list => { const seen = new Set(); return list.filter(p => { const k = nameKey(p); if (seen.has(k)) return false; seen.add(k); return true; }); };
  const textOf = p => ({ n: lc(p.name), m: lc([p.desc, p.category, p.ay_benefits].join(" ")), g: lc(p.ay_ingredients) });

  function scoreFor(p, kws) {
    const t = textOf(p); let s = 0;
    kws.forEach(kw => { if (kwHit(t.n, kw)) s += 3; if (kwHit(t.g, kw)) s += 2; if (kwHit(t.m, kw)) s += 1; });
    return s;
  }
  function productsFor(key) {
    const c = CONCERNS.find(x => x.k === key); if (!c) return [];
    const kws = c.kw.map(lc);
    const sc = P().map(p => ({ p, s: scoreFor(p, kws) })).filter(x => x.s > 0);
    sc.sort((a, b) => ((b.p.stock > 0) - (a.p.stock > 0)) || b.s - a.s || a.p.price - b.p.price);
    return dedupe(sc.map(x => x.p));
  }

  /* ---------- smart search ---------- */
  const cache = new Map();
  function ayuTokens(q) {
    const out = new Set();
    try {
      const db = window.AYU_DB; if (!db || !db.d) return out;
      db.d.forEach(d => {
        const ks = d.k || [];
        if (ks.some(k => { k = lc(k); return k === q || (q.length >= 3 && (k.startsWith(q) || (k.length >= 4 && q.includes(k)))); })) {
          (d.m || []).forEach(m => { const w = lc(m[0]).split(/[\s(]+/)[0]; if (w && w.length >= 4) out.add(w); });
        }
      });
    } catch (e) {}
    return out;
  }
  function search(q) {
    q = lc(q).trim(); if (q.length < 3) return [];
    const ck = q + "#" + P().length + "#" + (window.AYU_DB ? 1 : 0);
    if (cache.has(ck)) return cache.get(ck);
    const found = new Map();
    const add = (p, s) => found.set(p.id, Math.max(found.get(p.id) || 0, s));
    // 1) concern words ("pachan", "bawasir", "hair fall" ...)
    CONCERNS.forEach(c => {
      const hitKw = c.kw.map(lc).some(k => { const kk = k.trim(); return kk === q || (q.length >= 3 && kk.startsWith(q)) || (kk.length >= 4 && q.includes(kk)); }) || lc(c.en).includes(q);
      if (hitKw) productsFor(c.k).forEach((p, i) => add(p, 10 - Math.min(i, 8) * 0.1));
    });
    // 2) 500-rog database: disease word -> medicine names -> store products with that name
    const toks = ayuTokens(q);
    if (toks.size) P().forEach(p => { const n = lc(p.name); if ([...toks].some(t => n.includes(t))) add(p, 5); });
    const res = dedupe([...found.entries()].map(([id, s]) => ({ p: P().find(x => x.id === id), s })).filter(x => x.p).sort((a, b) => b.s - a.s).map(x => x.p));
    cache.set(ck, res); return res;
  }
  const hit = (p, q) => { try { return search(q).some(x => x.id === p.id || nameKey(x) === nameKey(p)); } catch (e) { return false; } };

  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const m = []; for (let i = 0; i <= a.length; i++) { m[i] = [i]; } for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }
  function didYouMean(q) {
    q = lc(q).trim(); if (q.length < 4 || !isLatin(q)) return "";
    const pool = new Set();
    P().forEach(p => lc(p.name).split(/[^a-z]+/).forEach(w => { if (w.length >= 4) pool.add(w); }));
    CONCERNS.forEach(c => c.kw.forEach(k => { k = lc(k).trim(); if (isLatin(k) && k.length >= 4 && !k.includes(" ")) pool.add(k); }));
    let best = "", bd = 9;
    pool.forEach(w => { const d = lev(q, w); if (d < bd || (d === bd && w.length > best.length)) { bd = d; best = w; } });
    return bd <= (q.length >= 7 ? 2 : 1) && best !== q ? best : "";
  }

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .cn-ov{position:fixed;inset:0;z-index:100030;background:#f3f6f2;overflow-y:auto;color:#173d2e;-webkit-overflow-scrolling:touch}
  .cn-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:10px;padding:14px 16px;background:#fff;border-bottom:1px solid #e1e9de}
  .cn-head .bk{border:0;background:none;font-size:24px;cursor:pointer;color:#173d2e;padding:2px 6px}
  .cn-head b{font-size:18px;flex:1}.cn-head small{color:#6a7d70}
  .cn-tabs{display:flex;gap:8px;overflow-x:auto;padding:10px 12px;background:#fff;border-bottom:1px solid #e1e9de;scrollbar-width:none}
  .cn-tabs::-webkit-scrollbar{display:none}
  .cn-tabs button{flex:none;border:1px solid #cdd8cf;background:#fff;border-radius:99px;padding:8px 14px;font:inherit;font-size:13.5px;color:#14301f;cursor:pointer;white-space:nowrap}
  .cn-tabs button.on{background:#14402b;border-color:#14402b;color:#fff;font-weight:700}
  .cn-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 12px 90px;max-width:760px;margin:0 auto}
  @media(min-width:700px){.cn-grid{grid-template-columns:repeat(3,1fr)}}
  .cn-c{background:#fff;border:1px solid #e1e9de;border-radius:16px;padding:10px;display:flex;flex-direction:column;cursor:pointer}
  .cn-c .im{height:130px;border-radius:12px;background:#eef4ea;display:flex;align-items:center;justify-content:center;font-size:44px;overflow:hidden}
  .cn-c .im img{width:100%;height:100%;object-fit:contain}
  .cn-c h4{margin:8px 0 2px;font-size:14px;line-height:1.25;color:#14301f}
  .cn-c small{color:#728579;font-size:12px}
  .cn-c .pr{margin:6px 0 8px;font-weight:800;font-size:16px;color:#14301f}.cn-c .pr s{font-weight:400;font-size:12px;color:#8a998f;margin-left:5px}
  .cn-c button{margin-top:auto;padding:10px;border:0;border-radius:10px;background:#14402b;color:#fff;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}
  .cn-c button.nt{background:#8a5a00}
  .cn-empty{grid-column:1/-1;text-align:center;padding:50px 16px;color:#4d6455}.cn-empty div{font-size:48px}
  .cn-empty button{margin-top:12px;padding:11px 20px;border:0;border-radius:12px;background:#14402b;color:#fff;font:inherit;font-weight:700;cursor:pointer}
  /* left-side menu (☰ at the left of the header) */
  .lm-back{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100100;opacity:0;pointer-events:none;transition:opacity .25s}
  .lm-back.open{opacity:1;pointer-events:auto}
  .lm-side{position:fixed;top:0;left:0;bottom:0;width:min(86vw,330px);background:#fff;z-index:100101;transform:translateX(-100%);transition:transform .25s;display:flex;flex-direction:column;color:#173d2e}
  .lm-side.open{transform:none}
  .lm-head{padding:18px 16px;background:linear-gradient(120deg,#14402b,#2f6b3a);color:#fff;display:flex;align-items:center;gap:12px}
  .lm-head b{flex:1;font-size:17px}.lm-head small{display:block;font-weight:400;opacity:.85}
  .lm-head button{border:0;background:none;color:#fff;font-size:26px;line-height:1;cursor:pointer}
  .lm-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
  .cn-sec{padding:14px 16px 6px;border-bottom:8px solid #f1f4ef}
  .cn-sec h5{margin:0 0 10px;font-size:13px;letter-spacing:.6px;text-transform:uppercase;color:#4d6455}
  .cn-chips{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-bottom:10px}
  .cn-chips button{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid #dbe5d8;border-radius:12px;background:#f7faf6;font:inherit;font-size:13px;line-height:1.2;text-align:left;color:#14301f;cursor:pointer}
  .cn-chips button span:first-child{font-size:18px;flex:none}
  .lm-links button{display:flex;width:100%;gap:14px;align-items:center;padding:15px 18px;border:0;border-bottom:1px solid #eee;background:#fff;font:inherit;text-align:left;color:#173d2e;cursor:pointer}
  .lm-links small{display:block;color:#777;font-size:12px}`;
  document.head.appendChild(css);

  /* ---------- result page ---------- */
  let ov = null;
  function shut() { if (!ov) return; const A = window.aashapuraAddr && window.aashapuraAddr.ov; const e = ov; ov = null; if (A) { try { A.close(e); } catch (er) { e.remove(); } } else e.remove(); }
  function card(p) {
    const out = p.stock <= 0, img = (typeof p.image_url === "string" && p.image_url) || "";
    return `<div class="cn-c" data-open="${p.id}"><div class="im">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : esc(p.emoji || "🌿")}</div>
      <h4>${esc(p.name)}</h4><small>${esc(p.weight || "")}</small>
      <div class="pr">₹${p.price}${p.mrp > p.price ? `<s>₹${p.mrp}</s>` : ""}</div>
      ${out ? `<button type="button" class="nt" data-nt="${p.id}">🔔 ${L("Notify me", "बताएँ")}</button>` : `<button type="button" data-add="${p.id}">${L("Add to cart", "कार्ट में जोड़ें")} +</button>`}</div>`;
  }
  function open(key, queryText) {
    shut();
    let cur = key;
    const el = document.createElement("div"); el.className = "cn-ov"; el.setAttribute("role", "dialog");
    el.innerHTML = `<div class="cn-head"><button type="button" class="bk" aria-label="${L("Back", "वापस")}">←</button><b></b><small></small></div><div class="cn-tabs"></div><div class="cn-grid"></div>`;
    document.body.appendChild(el); ov = el;
    const A = window.aashapuraAddr && window.aashapuraAddr.ov; if (A) { try { A.push(el); } catch (e) {} }
    el.querySelector(".bk").onclick = shut;
    const tabs = el.querySelector(".cn-tabs"), grid = el.querySelector(".cn-grid");
    const paint = () => {
      const c = CONCERNS.find(x => x.k === cur);
      const list = cur === "__q" ? search(queryText) : productsFor(cur);
      el.querySelector(".cn-head b").textContent = cur === "__q" ? `🔎 “${queryText}”` : `${c.e} ${L(c.en, c.hi)}`;
      el.querySelector(".cn-head small").textContent = list.length + " " + L(list.length === 1 ? "product" : "products", "प्रोडक्ट");
      tabs.innerHTML = CONCERNS.map(x => `<button type="button" data-k="${x.k}" class="${x.k === cur ? "on" : ""}">${x.e} ${esc(L(x.en, x.hi))}</button>`).join("");
      const on = tabs.querySelector(".on"); if (on) on.scrollIntoView({ inline: "center", block: "nearest" });
      grid.innerHTML = list.length ? list.map(card).join("") : `<div class="cn-empty"><div>🌿</div><h3>${L("No product for this yet", "इसके लिए अभी प्रोडक्ट नहीं है")}</h3><p>${L("Ask on WhatsApp — we will suggest the right Ayurvedic product.", "WhatsApp पर पूछें — हम सही आयुर्वेदिक प्रोडक्ट बताएँगे।")}</p><button type="button" data-all="1">${L("See all products", "सभी प्रोडक्ट देखें")}</button></div>`;
      el.scrollTop = 0;
    };
    tabs.onclick = e => { const b = e.target.closest("[data-k]"); if (b) { cur = b.dataset.k; paint(); } };
    grid.onclick = e => {
      if (e.target.closest("[data-add]")) return;                 // add-to-cart is handled by the global handler (toast + View Cart)
      const nt = e.target.closest("[data-nt]");
      if (nt) { const p = P().find(x => String(x.id) === nt.dataset.nt); if (p && window.aashapuraNotify) window.aashapuraNotify.open(p); return; }
      if (e.target.closest("[data-all]")) { shut(); const s = $("shop"); if (s) s.scrollIntoView({ behavior: "smooth" }); return; }
      const c = e.target.closest("[data-open]"); if (c && window.showProduct) window.showProduct(Number(c.dataset.open));
    };
    paint();
  }

  /* ---------- right-side menu ---------- */
  function drawerSection(close) {
    const d = document.createElement("div"); d.className = "cn-sec";
    d.innerHTML = `<h5>🌿 ${L("Shop by health concern", "बीमारी के हिसाब से खरीदें")}</h5><div class="cn-chips">${CONCERNS.map(c => `<button type="button" data-k="${c.k}"><span>${c.e}</span><span>${esc(L(c.en, c.hi))}</span></button>`).join("")}</div>`;
    d.querySelector(".cn-chips").onclick = e => { const b = e.target.closest("[data-k]"); if (!b) return; if (close) close(); setTimeout(() => open(b.dataset.k), 120); };
    return d;
  }
  window.aashapuraConcern = { list: CONCERNS, products: productsFor, search, hit, didYouMean, open, drawerSection };

  /* ---------- left menu: ☰ (left of header) now opens this drawer ---------- */
  let lmBack = null, lmSide = null;
  const lmClose = () => { if (lmBack) lmBack.classList.remove("open"); if (lmSide) lmSide.classList.remove("open"); };
  function lmOpen() {
    if (!lmSide) {
      lmBack = document.createElement("div"); lmBack.className = "lm-back"; lmBack.onclick = lmClose;
      lmSide = document.createElement("aside"); lmSide.className = "lm-side"; lmSide.setAttribute("aria-label", "Menu");
      document.body.append(lmBack, lmSide);
    }
    const go = fn => () => { lmClose(); setTimeout(fn, 150); };
    const scrollTo$ = id => { const e = $(id); if (e) e.scrollIntoView({ behavior: "smooth" }); };
    const links = [
      ["🏠", L("Home", "होम"), "", () => window.scrollTo({ top: 0, behavior: "smooth" })],
      ["🛍️", L("Shop all products", "सभी प्रोडक्ट"), "", () => scrollTo$("shop")],
      ["🔔", L("Notifications", "नोटिफ़िकेशन"), L("Order and stock updates", "ऑर्डर और स्टॉक अपडेट"), () => window.aashapuraNotifications && window.aashapuraNotifications.open()],
      ...((window.matchMedia("(display-mode: standalone)").matches || navigator.standalone || !window.aashapuraInstall) ? [] : [["📲", L("Install App", "ऐप इंस्टॉल करें"), L("Free — open from your home screen", "फ्री — होम स्क्रीन से खोलें"), () => window.aashapuraInstall()]]),
      ["ℹ️", L("About Us", "हमारे बारे में"), "", () => scrollTo$("about")],
      ["📞", L("Contact Us", "संपर्क"), "", () => scrollTo$("contact")]
    ];
    lmSide.innerHTML = `<div class="lm-head"><b>Aashapura<small>${L("Ayurveda store menu", "आयुर्वेद स्टोर मेन्यू")}</small></b><button type="button" aria-label="${L("Close", "बंद")}">×</button></div><div class="lm-body"></div>`;
    const body = lmSide.querySelector(".lm-body");
    body.appendChild(drawerSection(lmClose));
    const wrap = document.createElement("div"); wrap.className = "lm-links";
    links.forEach(([ic, t, sub, fn]) => { const b = document.createElement("button"); b.type = "button"; b.innerHTML = `<span>${ic}</span><span>${esc(t)}${sub ? `<small>${esc(sub)}</small>` : ""}</span>`; b.onclick = go(fn); wrap.appendChild(b); });
    body.appendChild(wrap);
    lmSide.querySelector(".lm-head button").onclick = lmClose;
    lmBack.classList.add("open"); lmSide.classList.add("open");
  }
  window.aashapuraOpenMenu = lmOpen;
  const tg = $("menuToggle");
  if (tg) tg.addEventListener("click", e => { if (window.aashapuraAdmin && window.aashapuraAdmin.active && window.aashapuraAdmin.active()) return; /* admin panel: let adminmenu.js open the admin drawer */ e.preventDefault(); e.stopImmediatePropagation(); lmOpen(); }, true);
})();
