/* v75: "Herb story" block on the home page (below the hero, above the shop).
   Ideas adapted from the Pulp Fresh showcase site (concern stage, build-your-own, step ledger),
   rebuilt in plain JS for this store: real products from `products`, add-to-cart via data-add,
   same ivory + deep green + gold look. One file, no library, no new SQL.
   EDIT HERE: STAGES (colours), KIT_MAX, STEPS (your real process text). */
(function () {
  if (window.__ayStory) return;
  window.__ayStory = 1;

  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const P = () => { try { return Array.isArray(products) ? products : []; } catch (e) { return []; } };
  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const lc = s => String(s == null ? "" : s).toLowerCase().replace(/\s+/g, " ").trim();
  const dedupe = list => { const seen = new Set(); return list.filter(p => { const k = lc(p.name); if (seen.has(k)) return false; seen.add(k); return true; }); };
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) {} };

  /* ---------- content you can edit ---------- */
  const KIT_MAX = 3;
  // key = concern key from concern.js; bg/fg = band colours (fg must read on bg)
  const STAGES = [
    { k: "immunity", e: "🛡️", en: "Immunity", hi: "इम्युनिटी", bg: "#E8B23A", fg: "#2b1d05" },
    { k: "digestion", e: "🍵", en: "Digestion", hi: "पाचन", bg: "#2F7A4A", fg: "#ffffff" },
    { k: "hair", e: "💇", en: "Hair care", hi: "बालों की देखभाल", bg: "#1B4D3E", fg: "#F6E7B8" },
    { k: "skin", e: "✨", en: "Skin glow", hi: "त्वचा", bg: "#B5476A", fg: "#ffffff" },
    { k: "stress", e: "😴", en: "Stress & sleep", hi: "तनाव / नींद", bg: "#4A5A8F", fg: "#ffffff" },
    { k: "energy", e: "💪", en: "Energy", hi: "ताकत", bg: "#A84A1B", fg: "#ffffff" }
  ];
  const STEPS = [
    { e: "🌿", w: ["Choose", "चुनाव"], t: ["Herbs picked with care", "ध्यान से चुनी गई जड़ी-बूटियाँ"] },
    { e: "💧", w: ["Clean", "सफाई"], t: ["Cleaned well before use", "इस्तेमाल से पहले अच्छी सफाई"] },
    { e: "☀️", w: ["Dry", "सुखाना"], t: ["Dried properly", "ठीक से सुखाना"] },
    { e: "🥣", w: ["Prepare", "तैयारी"], t: ["Made into powders and products", "पाउडर और प्रोडक्ट में तैयार"] },
    { e: "📦", w: ["Pack", "पैकिंग"], t: ["Sealed and sent to your door", "सील करके आपके घर तक"] }
  ];

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
#ayStory{--g1:#0f3324;--g2:#1f6a48;--iv:#fbf7ec;--gold:#c08a2e;--goldl:#f1d38a;--ink:#2b1d05;--pap:#f3ecda;--line:#e6dec8;--wood:#b98a52;--wood2:#8f6636;
  margin:14px 0 6px;font-family:'DM Sans',system-ui,sans-serif;color:var(--g1)}
#ayStory *{box-sizing:border-box}
#ayStory .ays-wrap{padding-left:max(12px,env(safe-area-inset-left,0px));padding-right:max(12px,env(safe-area-inset-right,0px));max-width:1100px;margin:0 auto}
#ayStory .ays-blk{margin:0 0 22px}
#ayStory .ays-eye{margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
#ayStory h2.ays-h{margin:0 0 6px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:clamp(30px,8.2vw,46px);line-height:1.02;color:var(--g1);text-wrap:balance}
#ayStory .ays-lead{margin:0 0 12px;font-size:14.5px;line-height:1.5;color:#4b5f52;max-width:56ch}
#ayStory .ays-slat{height:12px;margin:0 -12px;background:linear-gradient(#c79a62,#a87a43 55%,#8f6636);box-shadow:inset 0 2px 0 rgba(255,255,255,.25),inset 0 -2px 0 rgba(0,0,0,.2)}

/* chips */
#ayStory .ays-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 0 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
#ayStory .ays-chips::-webkit-scrollbar{display:none}
#ayStory .ays-chip{flex:none;border:1.5px solid var(--g1);background:var(--iv);color:var(--g1);border-radius:999px;padding:9px 15px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;transition:background .25s,color .25s,transform .2s}
#ayStory .ays-chip:hover{transform:translateY(-2px)}
#ayStory .ays-chip.on{background:var(--g1);color:var(--goldl)}
#ayStory .ays-chip:focus-visible,#ayStory button:focus-visible{outline:3px solid var(--gold);outline-offset:2px}

/* concern stage */
#ayStory .ays-stage{position:relative;overflow:hidden;border-radius:20px;background:var(--bg);color:var(--fg);padding:20px 18px 22px;transition:background-color .55s ease,color .4s;min-height:250px}
#ayStory .ays-ghost{position:absolute;left:-6px;top:-8px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:clamp(64px,21vw,190px);line-height:.9;color:var(--fg);opacity:.11;white-space:nowrap;pointer-events:none;user-select:none}
#ayStory .ays-sg{position:relative;display:grid;grid-template-columns:minmax(0,1fr);gap:14px;align-items:center}
#ayStory .ays-art{position:relative;justify-self:center;width:min(210px,58vw);aspect-ratio:1/1;border-radius:50%;background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.55),rgba(255,255,255,.14) 62%,transparent 64%);display:flex;align-items:center;justify-content:center;font-size:84px;animation:ayIn .6s cubic-bezier(.22,1,.36,1) both}
#ayStory .ays-art img{width:78%;height:78%;object-fit:contain;filter:drop-shadow(0 10px 14px rgba(0,0,0,.28))}
#ayStory .ays-copy h3{margin:0 0 6px;font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(28px,7vw,40px);line-height:1;color:inherit}
#ayStory .ays-copy p{margin:0 0 12px;font-size:14.5px;line-height:1.5;color:inherit;opacity:.92;max-width:44ch}
#ayStory .ays-btn{display:inline-block;border:2px solid var(--fg);background:transparent;color:var(--fg);border-radius:999px;padding:10px 18px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;transition:transform .2s,background .2s,color .2s}
#ayStory .ays-btn:hover{background:var(--fg);color:var(--bg);transform:translateY(-2px)}
#ayStory .ays-note{margin:10px 2px 0;font-size:12px;line-height:1.45;color:#5d7266}

/* kraft price tags */
#ayStory .ays-tags{display:flex;gap:12px;overflow-x:auto;padding:16px 2px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-snap-type:x proximity}
#ayStory .ays-tags::-webkit-scrollbar{display:none}
#ayStory .ays-tag{position:relative;flex:none;width:150px;scroll-snap-align:start;background:#eadbb9;color:var(--ink);padding:26px 10px 12px;cursor:pointer;clip-path:polygon(14% 0,86% 0,100% 9%,100% 100%,0 100%,0 9%);animation:ayIn .55s cubic-bezier(.22,1,.36,1) both;transition:transform .25s}
#ayStory .ays-tag:hover{transform:translateY(-4px) rotate(-1.2deg)}
#ayStory .ays-tag:before{content:"";position:absolute;left:50%;top:8px;width:11px;height:11px;margin-left:-5.5px;border-radius:50%;background:var(--g1);box-shadow:inset 0 0 0 3px #eadbb9,0 0 0 1.5px rgba(0,0,0,.25)}
#ayStory .ays-tag .im{height:96px;border-radius:8px;background:rgba(255,255,255,.55);display:flex;align-items:center;justify-content:center;font-size:42px;overflow:hidden}
#ayStory .ays-tag .im img{width:100%;height:100%;object-fit:contain}
#ayStory .ays-tag b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:8px 0 2px;font-size:13.5px;line-height:1.25;min-height:34px}
#ayStory .ays-tag small{display:block;font-size:11.5px;color:#6b5a33}
#ayStory .ays-pr{display:flex;align-items:baseline;gap:6px;margin:6px 0 8px}
#ayStory .ays-pr strong{font-size:18px;font-weight:800}
#ayStory .ays-pr s{font-size:12px;color:#8a7a52}
#ayStory .ays-add{width:100%;border:0;border-radius:8px;background:var(--g1);color:var(--goldl);padding:9px 8px;font:inherit;font-weight:700;font-size:13px;cursor:pointer;transition:background .2s}
#ayStory .ays-add:hover{background:var(--g2)}
#ayStory .ays-add[disabled]{background:#b9b09a;color:#fff;cursor:default}
#ayStory .ays-empty{padding:18px;border:1.5px dashed var(--line);border-radius:14px;color:#5d7266;font-size:14px}

/* herbal kit builder */
#ayStory .ays-kit{display:grid;grid-template-columns:minmax(0,1fr);gap:14px}
#ayStory .ays-tray{background:linear-gradient(#c79a62,#a87a43);border-radius:16px;padding:14px;box-shadow:inset 0 0 0 3px #8f6636,0 8px 18px rgba(60,40,10,.18)}
#ayStory .ays-bins{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
#ayStory .ays-bin{position:relative;border:2px solid #8f6636;background:#f6edd6;border-radius:12px;padding:8px 6px 8px;font:inherit;color:var(--ink);cursor:pointer;text-align:center;transition:transform .2s,box-shadow .2s,border-color .2s}
#ayStory .ays-bin:hover{transform:translateY(-3px);box-shadow:0 8px 12px rgba(0,0,0,.18)}
#ayStory .ays-bin .im{height:64px;display:flex;align-items:center;justify-content:center;font-size:34px;overflow:hidden}
#ayStory .ays-bin .im img{width:100%;height:100%;object-fit:contain}
#ayStory .ays-bin b{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12px;line-height:1.2;min-height:29px}
#ayStory .ays-bin i{display:block;font-style:normal;font-size:12px;font-weight:700;color:#6b5a33}
#ayStory .ays-bin.on{border-color:var(--g1);box-shadow:0 0 0 3px var(--goldl)}
#ayStory .ays-bin .n{position:absolute;right:-6px;top:-8px;width:24px;height:24px;border-radius:50%;background:var(--g1);color:var(--goldl);font-weight:800;font-size:13px;display:none;align-items:center;justify-content:center}
#ayStory .ays-bin.on .n{display:flex}
#ayStory .ays-board{position:relative;background:#24302a;color:#f3efe2;border-radius:16px;padding:16px 16px 16px;box-shadow:inset 0 0 0 5px #8f6636,inset 0 0 0 6px rgba(0,0,0,.25);background-image:radial-gradient(rgba(255,255,255,.07) 1px,transparent 1.4px);background-size:7px 7px}
#ayStory .ays-board h3{margin:0 0 2px;font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;color:#f1d38a}
#ayStory .ays-board .sub{margin:0 0 10px;font-size:12.5px;opacity:.8}
#ayStory .ays-slot{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed rgba(255,255,255,.28);font-size:14px}
#ayStory .ays-slot span:first-child{min-width:0;overflow-wrap:anywhere}
#ayStory .ays-slot.free{opacity:.55}
#ayStory .ays-tot{display:flex;justify-content:space-between;align-items:baseline;margin:12px 0 12px}
#ayStory .ays-tot strong{font-size:28px;color:#f1d38a}
#ayStory .ays-row{display:flex;gap:8px;flex-wrap:wrap}
#ayStory .ays-go{flex:1 1 150px;border:0;border-radius:999px;background:var(--goldl);color:var(--ink);padding:12px 16px;font:inherit;font-weight:800;font-size:14.5px;cursor:pointer;transition:transform .2s}
#ayStory .ays-go:hover{transform:translateY(-2px)}
#ayStory .ays-go[disabled]{opacity:.5;cursor:default;transform:none}
#ayStory .ays-clr{border:1.5px solid rgba(255,255,255,.5);background:transparent;color:#f3efe2;border-radius:999px;padding:11px 16px;font:inherit;font-weight:700;font-size:14px;cursor:pointer}

/* herb to home ledger */
#ayStory .ays-led{display:grid;grid-template-columns:minmax(0,1fr);gap:14px;background:var(--iv);border:1px solid var(--line);border-radius:20px;padding:18px 16px}
#ayStory .ays-big{display:flex;align-items:flex-end;gap:12px}
#ayStory .ays-num{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:clamp(84px,24vw,150px);line-height:.8;color:#b45a28}
#ayStory .ays-word{font-family:'Cormorant Garamond',Georgia,serif;font-weight:700;font-size:clamp(30px,8vw,48px);line-height:1;color:var(--g1);padding-bottom:6px}
#ayStory .ays-photo{position:relative;justify-self:start;width:min(220px,62vw);aspect-ratio:1/1;background:#fff;padding:12px 12px 36px;box-shadow:0 10px 22px rgba(0,0,0,.16);transform:rotate(-2.5deg)}
#ayStory .ays-photo:before{content:"";position:absolute;left:50%;top:-10px;width:70px;height:22px;margin-left:-35px;background:rgba(214,176,98,.7);transform:rotate(3deg)}
#ayStory .ays-photo .pic{height:100%;background:linear-gradient(135deg,#e4ead9,#cfe0c9);display:flex;align-items:center;justify-content:center;font-size:76px}
#ayStory .ays-photo .cap{position:absolute;left:12px;right:12px;bottom:9px;font-size:12.5px;font-weight:700;text-align:center;color:#6b5a33}
#ayStory .ays-steps{list-style:none;margin:0;padding:0;display:grid;gap:6px}
#ayStory .ays-st{display:flex;align-items:center;gap:12px;width:100%;border:1.5px solid var(--line);background:#fff;border-radius:12px;padding:11px 13px;font:inherit;color:var(--g1);text-align:left;cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s,background .2s}
#ayStory .ays-st:hover{transform:translateX(3px);box-shadow:4px 4px 0 var(--goldl)}
#ayStory .ays-st .no{flex:none;width:30px;height:30px;border-radius:50%;background:var(--pap);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
#ayStory .ays-st b{display:block;font-size:15px}
#ayStory .ays-st small{display:block;font-size:12.5px;color:#5d7266}
#ayStory .ays-st.on{border-color:var(--g1);background:var(--g1);color:var(--goldl)}
#ayStory .ays-st.on small{color:#cfe0c9}
#ayStory .ays-st.on .no{background:var(--goldl);color:var(--ink)}

@keyframes ayIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@media (min-width:760px){
  #ayStory .ays-sg{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:28px}
  #ayStory .ays-stage{padding:30px 34px 34px}
  #ayStory .ays-kit{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);align-items:start}
  #ayStory .ays-bin .im{height:84px}
  #ayStory .ays-led{grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);padding:26px 28px}
  #ayStory .ays-led .ays-left{display:grid;gap:18px;align-content:start}
}
@media (prefers-reduced-motion:reduce){#ayStory *{animation:none!important;transition:none!important}}`;
  document.head.appendChild(css);

  /* ---------- state ---------- */
  const S = { goal: "immunity", kit: [], kitInit: false, step: 0, touched: 0, sig: "" };

  /* ---------- data helpers ---------- */
  const imgOf = p => {
    const src = p.image_url || (() => { try { const a = JSON.parse(p.images || "[]"); return Array.isArray(a) ? a.find(u => !/\.(mp4|webm|mov)(\?|$)/i.test(u)) : ""; } catch (e) { return ""; } })();
    return src ? `<img src="${esc(src)}" alt="" loading="lazy">` : esc(p.emoji || "🌿");
  };
  const forGoal = k => { try { return (window.aashapuraConcern && window.aashapuraConcern.products(k)) || []; } catch (e) { return []; } };
  const kitPool = () => dedupe(P().filter(p => p.stock > 0)).slice(0, 9);
  const stageOf = k => STAGES.find(s => s.k === k) || STAGES[0];
  const pById = id => P().find(p => String(p.id) === String(id));

  /* ---------- markup ---------- */
  const root = document.createElement("section");
  root.id = "ayStory";
  root.innerHTML = `<div class="ays-wrap">
    <div class="ays-blk" id="aysConcern"></div>
    <div class="ays-slat" aria-hidden="true"></div>
    <div class="ays-blk" id="aysKit" style="margin-top:22px"></div>
    <div class="ays-blk" id="aysLed"></div>
  </div>`;

  function mount() {
    if (document.getElementById("ayStory")) return true;
    const home = document.getElementById("home"), shop = document.getElementById("shop");
    if (home) home.after(root); else if (shop) shop.before(root); else return false;
    return true;
  }

  /* ---------- 1. concern stage ---------- */
  function paintConcern(anim) {
    const box = root.querySelector("#aysConcern");
    const loaded = P().length > 0;
    let st = stageOf(S.goal), list = forGoal(st.k);
    if (loaded && !list.length) { // pick the first concern that really has products
      const alt = STAGES.find(s => forGoal(s.k).length); if (alt) { S.goal = alt.k; st = alt; list = forGoal(alt.k); }
    }
    const lead = list.find(p => p.stock > 0) || list[0];
    const chips = STAGES.map(s => `<button type="button" class="ays-chip${s.k === st.k ? " on" : ""}" data-g="${s.k}">${s.e} ${esc(L(s.en, s.hi))}</button>`).join("");
    const ghost = esc(L(st.en, st.hi).split(/[ /]/)[0]);
    const tags = list.slice(0, 8).map((p, i) => `<article class="ays-tag" data-id="${p.id}" style="animation-delay:${i * 50}ms">
        <div class="im">${imgOf(p)}</div><b>${esc(p.name)}</b><small>${esc(p.weight || "")}</small>
        <div class="ays-pr"><strong>${money(p.price)}</strong>${p.mrp > p.price ? `<s>${money(p.mrp)}</s>` : ""}</div>
        ${p.stock > 0 ? `<button type="button" class="ays-add" data-add="${p.id}">${L("Add to cart +", "कार्ट में जोड़ें +")}</button>` : `<button type="button" class="ays-add" disabled>${L("Out of stock", "स्टॉक में नहीं")}</button>`}
      </article>`).join("");
    box.innerHTML = `<p class="ays-eye">${L("Shop by concern", "ज़रूरत के हिसाब से")}</p>
      <h2 class="ays-h">${L("Herbs for how you feel.", "आपकी ज़रूरत की जड़ी-बूटियाँ।")}</h2>
      <div class="ays-chips" role="tablist">${chips}</div>
      <div class="ays-stage" style="--bg:${st.bg};--fg:${st.fg}">
        <div class="ays-ghost" aria-hidden="true">${ghost}</div>
        <div class="ays-sg">
          <div class="ays-art">${lead ? imgOf(lead) : esc(st.e)}</div>
          <div class="ays-copy">
            <h3>${esc(L(st.en, st.hi))}</h3>
            <p>${list.length ? L(`${list.length} hand-picked products from our range for ${st.en.toLowerCase()}.`, `${st.hi} के लिए हमारे कलेक्शन से ${list.length} चुने हुए प्रोडक्ट।`) : (loaded ? L("Products for this concern are coming soon.", "इस ज़रूरत के प्रोडक्ट जल्द आ रहे हैं।") : L("Loading herbs…", "जड़ी-बूटियाँ लोड हो रही हैं…"))}</p>
            ${list.length ? `<button type="button" class="ays-btn" data-open="${st.k}">${L("See all", "सब देखें")} →</button>` : ""}
          </div>
        </div>
      </div>
      ${list.length ? `<div class="ays-tags">${tags}</div>` : `<div class="ays-empty" style="margin-top:12px">${loaded ? L("Try another concern above.", "ऊपर से दूसरी ज़रूरत चुनें।") : L("Loading…", "लोड हो रहा है…")}</div>`}
      <p class="ays-note">${L("Ayurvedic products support everyday wellness. They are not a substitute for medical advice.", "आयुर्वेदिक प्रोडक्ट रोज़ की सेहत में मदद करते हैं। ये डॉक्टर की सलाह का विकल्प नहीं हैं।")}</p>`;
  }

  /* ---------- 2. herbal kit builder ---------- */
  function paintKit() {
    const box = root.querySelector("#aysKit");
    const pool = kitPool();
    if (!S.kitInit && pool.length) { S.kit = pool.slice(0, KIT_MAX).map(p => p.id); S.kitInit = true; }
    S.kit = S.kit.filter(id => pool.some(p => p.id === id));
    const picked = S.kit.map(pById).filter(Boolean);
    const total = picked.reduce((a, p) => a + p.price, 0);
    const bins = pool.map(p => { const i = S.kit.indexOf(p.id); return `<button type="button" class="ays-bin${i > -1 ? " on" : ""}" data-pick="${p.id}" aria-pressed="${i > -1}">
        <span class="n">${i + 1}</span><div class="im">${imgOf(p)}</div><b>${esc(p.name)}</b><i>${money(p.price)}</i></button>`; }).join("");
    let slots = "";
    for (let i = 0; i < KIT_MAX; i++) {
      const p = picked[i];
      slots += p ? `<div class="ays-slot"><span>${i + 1}. ${esc(p.name)}</span><span>${money(p.price)}</span></div>`
                 : `<div class="ays-slot free"><span>${i + 1}. ${L("Pick from the tray", "ट्रे से चुनें")}</span><span>—</span></div>`;
    }
    box.innerHTML = `<p class="ays-eye">${L("Build your own", "अपना किट बनाएँ")}</p>
      <h2 class="ays-h">${L("Build your herbal kit.", "अपना हर्बल किट बनाएँ।")}</h2>
      <p class="ays-lead">${L(`Pick up to ${KIT_MAX} from the tray. Your total is on the board; add the whole kit in one tap.`, `ट्रे से ${KIT_MAX} तक चुनें। कुल रकम बोर्ड पर दिखेगी, पूरा किट एक टैप में जोड़ें।`)}</p>
      ${pool.length ? `<div class="ays-kit"><div class="ays-tray"><div class="ays-bins">${bins}</div></div>
        <div class="ays-board"><h3>${L("Your kit", "आपका किट")}</h3><p class="sub">${L("Example picks, tap the tray to change.", "उदाहरण के तौर पर चुना है, बदलने के लिए ट्रे पर टैप करें।")}</p>
          ${slots}<div class="ays-tot"><span>${L("Total", "कुल")}</span><strong>${money(total)}</strong></div>
          <div class="ays-row"><button type="button" class="ays-go" data-kitadd ${picked.length ? "" : "disabled"}>${L("Add kit to cart", "किट कार्ट में जोड़ें")}</button>
          <button type="button" class="ays-clr" data-kitclr>${L("Clear", "हटाएँ")}</button></div></div></div>`
        : `<div class="ays-empty">${L("Loading the tray…", "ट्रे लोड हो रही है…")}</div>`}`;
  }

  /* ---------- 3. herb to home ledger ---------- */
  function paintLed(first) {
    const box = root.querySelector("#aysLed");
    const s = STEPS[S.step];
    const rows = STEPS.map((x, i) => `<li><button type="button" class="ays-st${i === S.step ? " on" : ""}" data-step="${i}"><span class="no">${i + 1}</span><span><b>${esc(L(x.w[0], x.w[1]))}</b><small>${esc(L(x.t[0], x.t[1]))}</small></span></button></li>`).join("");
    if (first || !box.firstChild) {
      box.innerHTML = `<p class="ays-eye">${L("Our process", "हमारी प्रक्रिया")}</p>
        <h2 class="ays-h">${L("From herb to your home.", "जड़ी-बूटी से आपके घर तक।")}</h2>
        <div class="ays-led"><div class="ays-left"><div class="ays-big"><div class="ays-num" id="aysNum"></div><div class="ays-word" id="aysWord"></div></div>
          <div class="ays-photo"><div class="pic" id="aysPic"></div><div class="cap" id="aysCap"></div></div></div>
          <ol class="ays-steps" id="aysSteps"></ol></div>`;
    }
    box.querySelector("#aysNum").textContent = "0" + (S.step + 1);
    box.querySelector("#aysWord").textContent = L(s.w[0], s.w[1]);
    box.querySelector("#aysPic").textContent = s.e;
    box.querySelector("#aysCap").textContent = L(s.t[0], s.t[1]);
    box.querySelector("#aysSteps").innerHTML = rows;
  }

  /* ---------- events ---------- */
  root.addEventListener("click", e => {
    const t = e.target;
    const g = t.closest("[data-g]");
    if (g) { S.goal = g.dataset.g; paintConcern(); return; }
    const op = t.closest("[data-open]");
    if (op) { try { window.aashapuraConcern.open(op.dataset.open); } catch (er) {} return; }
    if (t.closest("[data-add]")) return;                       // global handler adds to cart
    const tag = t.closest(".ays-tag");
    if (tag) { if (window.showProduct) window.showProduct(Number(tag.dataset.id)); return; }
    const pk = t.closest("[data-pick]");
    if (pk) {
      const id = Number(pk.dataset.pick), i = S.kit.indexOf(id);
      if (i > -1) S.kit.splice(i, 1);
      else if (S.kit.length >= KIT_MAX) { toast(L(`Max ${KIT_MAX} in a kit. Tap one to remove it.`, `किट में अधिकतम ${KIT_MAX}। हटाने के लिए एक पर टैप करें।`), "info"); return; }
      else S.kit.push(id);
      paintKit(); return;
    }
    if (t.closest("[data-kitclr]")) { S.kit = []; paintKit(); return; }
    if (t.closest("[data-kitadd]")) {
      const picked = S.kit.map(pById).filter(p => p && p.stock > 0);
      if (!picked.length) return;
      try {
        picked.forEach(p => { cart[String(p.id)] = (Number(cart[String(p.id)]) || 0) + 1; });
        renderCart();
        toast(L("Kit added to cart", "किट कार्ट में जोड़ा गया"), "success");
      } catch (er) { toast(L("Could not add the kit. Please add items one by one.", "किट नहीं जुड़ा। कृपया एक-एक करके जोड़ें।"), "error"); }
      return;
    }
    const st = t.closest("[data-step]");
    if (st) { S.step = Number(st.dataset.step); S.touched = Date.now(); paintLed(); }
  });

  /* ---------- boot + refresh ---------- */
  function sigOf() { return P().map(p => [p.id, p.price, p.stock, p.image_url].join(":")).join("|"); }
  function refresh(force) {
    if (!mount()) return;
    const s = sigOf();
    if (!force && s === S.sig) return;
    S.sig = s; paintConcern(); paintKit();
  }
  mount(); paintConcern(); paintKit(); paintLed(true);
  setInterval(() => refresh(false), 1500);           // products load after page start; keeps price/stock fresh

  // gentle auto-advance of the process steps while visible (pauses after a tap)
  let vis = false;
  try { new IntersectionObserver(en => { vis = en.some(x => x.isIntersecting); }, { threshold: 0.3 }).observe(root.querySelector("#aysLed")); } catch (e) { vis = true; }
  setInterval(() => {
    if (!vis || Date.now() - S.touched < 9000 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    S.step = (S.step + 1) % STEPS.length; paintLed();
  }, 3800);
})();
