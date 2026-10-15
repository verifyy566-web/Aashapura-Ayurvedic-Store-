/* Aashapura - Search page (v70)
   Full-screen search: brand tiles slider, quick-filter chips, results grid, premium Sort/Filter capsule,
   Filter page (left list + right options, Select All, price slider, Bundles, More filters).
   Brands come from products.brand (admin Add Product), so a new brand shows up everywhere
   the moment a product with it is saved. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const P = () => { try { return products || []; } catch (e) { return []; } };
  const inCart = id => { try { return Number(cart[String(id)]) || 0; } catch (e) { return 0; } };
  const lc = s => String(s || "").trim().toLowerCase();
  const norm = p => lc(p.name).replace(/\s+/g, " ");
  const gkey = p => lc(p.brand) + "|" + norm(p);
  const disc = p => (p.mrp > p.price && p.price > 0 ? Math.round((p.mrp - p.price) * 100 / p.mrp) : 0);
  const title = s => String(s).replace(/\b\w/g, m => m.toUpperCase());

  /* ---------- state ---------- */
  const blank = () => ({ brands: new Set(), cats: new Set(), sizes: new Set(), quick: new Set(), pr: null, disc: 0, stock: false, cod: false, bundle: false });
  let Q = "", SORT = "rel", F = blank(), page = null, depth = 0, skip = 0;
  let RATING = {}, COMBO_IDS = new Set(), extraAt = 0;
  const QUICK = [
    { k: "top", t: () => L("Top Brands", "टॉप ब्रांड") },
    { k: "rated", t: () => L("Top Rated", "टॉप रेटेड") },
    { k: "new", t: () => L("New Arrivals", "नए आए") },
    { k: "deal", t: () => L("Great Deals", "बढ़िया ऑफ़र") }
  ];
  const PCHIPS = [[0, 199, "Under ₹199"], [200, 499, "₹200 – ₹499"], [500, 999, "₹500 – ₹999"], [1000, 1e9, "₹1000 & above"]];
  const DISCS = [10, 20, 30, 50];
  const SORTS = [
    { v: "rel", t: () => L("Relevance", "प्रासंगिकता") },
    { v: "new", t: () => L("What's new", "नया पहले") },
    { v: "plh", t: () => L("Price: Low to High", "कीमत: कम से ज़्यादा") },
    { v: "phl", t: () => L("Price: High to Low", "कीमत: ज़्यादा से कम") },
    { v: "dis", t: () => L("Better discount", "ज़्यादा छूट") },
    { v: "az", t: () => L("Name: A to Z", "नाम: A से Z") }
  ];

  /* ---------- data helpers ---------- */
  function brandMap() {
    const m = new Map();
    P().forEach(p => {
      const k = lc(p.brand); if (!k) return;
      const e = m.get(k) || { k, name: p.brand, n: 0, cats: {} };
      e.n++; const c = lc(p.category); if (c) e.cats[c] = (e.cats[c] || 0) + 1; m.set(k, e);
    });
    return [...m.values()].map(e => { e.cat = Object.keys(e.cats).sort((a, b) => e.cats[b] - e.cats[a])[0] || ""; return e; })
      .sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  }
  function ctx() {
    const top = new Set(brandMap().slice(0, 5).map(b => b.k));
    const newest = new Set(P().slice().sort((a, b) => b.id - a.id).slice(0, 8).map(p => p.id));
    const rate = {};
    P().forEach(p => { const a = RATING[p.id]; if (!a) return; const r = rate[gkey(p)] || (rate[gkey(p)] = { s: 0, n: 0 }); r.s += a.s; r.n += a.n; });
    return { top, newest, rate };
  }
  let C = ctx();
  const avgOf = p => { const r = C.rate[gkey(p)]; return r && r.n ? { a: r.s / r.n, n: r.n } : null; };
  const quickOK = (p, k) => k === "top" ? (p.brand && C.top.has(lc(p.brand)))
    : k === "rated" ? (avgOf(p) && avgOf(p).a >= 4)
    : k === "new" ? C.newest.has(p.id) : k === "deal" ? disc(p) >= 25 : false;
  const textHit = (p, q) => {
    if (!q) return true;
    const hay = lc(p.name + " " + p.brand + " " + p.category + " " + p.desc + " " + p.weight);
    if (q.split(/\s+/).every(w => hay.includes(w))) return true;
    try { return !!(window.aashapuraConcern && window.aashapuraConcern.hit(p, q)); } catch (e) { return false; }
  };
  /* ignore = one filter group left out (so its own counts show what you would get by picking it) */
  function pass(p, f, ignore) {
    if (ignore !== "brand" && f.brands.size && !f.brands.has(lc(p.brand))) return false;
    if (ignore !== "cat" && f.cats.size && !f.cats.has(lc(p.category))) return false;
    if (ignore !== "size" && f.sizes.size && !f.sizes.has(lc(p.weight))) return false;
    if (ignore !== "quick" && f.quick.size && ![...f.quick].some(k => quickOK(p, k))) return false;
    if (ignore !== "price" && f.pr && !(p.price >= f.pr[0] && p.price <= f.pr[1])) return false;
    if (ignore !== "disc" && f.disc && disc(p) < f.disc) return false;
    if (ignore !== "bundle" && f.bundle && !COMBO_IDS.has(String(p.id))) return false;
    if (ignore !== "more") { if (f.stock && !(p.stock > 0)) return false; if (f.cod && p.cod_available === false) return false; }
    return true;
  }
  function results(f) {
    const q = lc(Q);
    const list = P().filter(p => textHit(p, q) && pass(p, f));
    const groups = new Map();
    list.forEach(p => { const k = gkey(p); const g = groups.get(k) || []; g.push(p); groups.set(k, g); });
    const out = [...groups.values()].map(g => {
      const inS = g.filter(x => x.stock > 0), pool = inS.length ? inS : g;
      const rep = pool.slice().sort((a, b) => a.price - b.price)[0];
      return { rep, n: g.length, from: Math.min(...g.map(x => x.price)), any: inS.length > 0, d: Math.max(...g.map(disc)), rt: avgOf(rep) };
    });
    const rel = x => { if (!q) return 0; const n = lc(x.rep.name), b = lc(x.rep.brand); return n.startsWith(q) ? 0 : b === q ? 1 : n.includes(q) ? 2 : 3; };
    if (SORT === "plh") out.sort((a, b) => a.from - b.from);
    else if (SORT === "phl") out.sort((a, b) => b.from - a.from);
    else if (SORT === "dis") out.sort((a, b) => b.d - a.d);
    else if (SORT === "az") out.sort((a, b) => a.rep.name.localeCompare(b.rep.name));
    else if (SORT === "new") out.sort((a, b) => b.rep.id - a.rep.id);
    else out.sort((a, b) => rel(a) - rel(b) || (b.any - a.any));
    return out;
  }
  const activeCount = f => f.brands.size + f.cats.size + f.sizes.size + f.quick.size + (f.pr ? 1 : 0) + (f.disc ? 1 : 0) + (f.stock ? 1 : 0) + (f.cod ? 1 : 0) + (f.bundle ? 1 : 0);
  const clone = f => ({ brands: new Set(f.brands), cats: new Set(f.cats), sizes: new Set(f.sizes), quick: new Set(f.quick), pr: f.pr ? f.pr.slice() : null, disc: f.disc, stock: f.stock, cod: f.cod, bundle: f.bundle });
  const recent = () => { try { return JSON.parse(localStorage.getItem("aashapura_recent_q") || "[]"); } catch (e) { return []; } };
  const saveRecent = q => { q = q.trim(); if (q.length < 2) return; try { const r = recent().filter(x => lc(x) !== lc(q)); r.unshift(q); localStorage.setItem("aashapura_recent_q", JSON.stringify(r.slice(0, 8))); } catch (e) {} };

  /* ratings + combos (for "Top Rated" and "Bundles"); failures are ignored */
  async function loadExtra() {
    if (Date.now() - extraAt < 120000 || typeof supabaseClient === "undefined") return;
    extraAt = Date.now();
    try {
      let r = await supabaseClient.from("reviews").select("product_id,rating").eq("approved", true);
      if (r.error) r = await supabaseClient.from("reviews").select("product_id,rating");
      const a = {}; (r.data || []).forEach(x => { const o = a[x.product_id] || (a[x.product_id] = { s: 0, n: 0 }); o.s += Number(x.rating) || 0; o.n++; });
      RATING = a;
    } catch (e) {}
    try {
      const c = await supabaseClient.from("combos").select("items").eq("is_active", true);
      const ids = new Set();
      (c.data || []).forEach(x => { let it = x.items; if (typeof it === "string") { try { it = JSON.parse(it); } catch (e) { it = []; } } (Array.isArray(it) ? it : []).forEach(i => ids.add(String(i.id))); });
      COMBO_IDS = ids;
    } catch (e) {}
    C = ctx(); if (page) paint();
  }

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
.sp{position:fixed;inset:0;z-index:99500;background:var(--ivory,#fbf7ec);color:var(--ink,#23291f);font-family:var(--sans,system-ui,sans-serif);display:flex;flex-direction:column;overscroll-behavior:contain}
.sp *{box-sizing:border-box}
.sp button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.sp-top{display:flex;align-items:center;gap:8px;padding:calc(10px + env(safe-area-inset-top,0px)) 12px 10px;background:var(--ivory,#fbf7ec);border-bottom:1px solid var(--line,#e6dec8)}
.sp-back{flex:none;width:40px;height:40px;border:0;background:transparent;border-radius:50%;display:grid;place-items:center;color:#123c2b}
.sp-field{flex:1;display:flex;align-items:center;gap:8px;height:44px;padding:0 12px;border-radius:14px;background:#fff;border:1.5px solid #d9c79a}
.sp-field:focus-within{border-color:#123c2b;box-shadow:0 0 0 3px rgba(18,60,43,.12)}
.sp-field svg{flex:none;color:#8a6a2a}
.sp-field input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:500 16px var(--sans,system-ui);color:inherit;height:100%}
.sp-field input::-webkit-search-cancel-button,.sp-field input::-webkit-search-decoration{-webkit-appearance:none;appearance:none;display:none}
.sp-x{flex:none;border:0;background:#efe6cf;color:#5b5a45;width:24px;height:24px;border-radius:50%;font-size:13px;line-height:1;display:none}
.sp-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:calc(96px + env(safe-area-inset-bottom,0px))}
.sp-h{display:flex;align-items:baseline;justify-content:space-between;margin:16px 16px 8px}
.sp-h b{font:700 21px var(--serif,Georgia,serif);color:#123c2b;letter-spacing:.01em}
.sp-h button{border:0;background:none;color:#8a6a2a;font-size:13px;font-weight:600;padding:4px 0}
/* brand tiles slider */
.sp-rail{display:flex;align-items:stretch;gap:10px;overflow-x:auto;padding:4px 16px 10px;scroll-snap-type:x proximity;scroll-padding:0 16px;scrollbar-width:none}
.sp-rail::-webkit-scrollbar,.sp-qr::-webkit-scrollbar{display:none}
.sp-b{flex:none;width:142px;scroll-snap-align:start;display:flex;flex-direction:column;justify-content:center;gap:4px;text-align:center;padding:16px 10px;min-height:88px;border-radius:16px;background:#fff;border:1.5px solid #e1d2a6;color:inherit;position:relative}
.sp-b b{font:700 16px/1.15 var(--serif,Georgia,serif);color:#123c2b;text-transform:uppercase;letter-spacing:.01em;overflow-wrap:break-word}
.sp-b span{font-size:12px;color:#7a7c6c;text-transform:capitalize}
.sp-b.on{background:linear-gradient(180deg,#174a35,#0e3022);border-color:#b8893b}
.sp-b.on b{color:#f1dfae}.sp-b.on span{color:#d8c690}
.sp-b.on::after{content:"✓";position:absolute;top:7px;right:10px;color:#e3bf72;font-size:13px;font-weight:800}
.sp-empty-b{margin:2px 16px 8px;padding:12px 14px;border:1.5px dashed #d9c79a;border-radius:14px;font-size:13px;color:#6f7466;background:rgba(255,255,255,.55)}
/* quick filter chips */
.sp-qr{display:flex;gap:8px;overflow-x:auto;padding:6px 16px 8px;scrollbar-width:none}
.sp-q{flex:none;border:1.5px solid #d9c79a;background:#fff;color:#123c2b;border-radius:999px;padding:9px 15px;font-size:13.5px;font-weight:600;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.sp-q.on{background:#123c2b;border-color:#123c2b;color:#f1dfae}
.sp-q.dd::after{content:"▾";font-size:11px;opacity:.7}
.sp-chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px}
.sp-chip{border:1px solid #d9c79a;background:#fff;color:#123c2b;border-radius:999px;padding:8px 13px;font-size:13px;font-weight:600}
.sp-chip.rm{background:#efe6cf;color:#123c2b;border-color:#d9c79a;padding:6px 8px 6px 12px;display:inline-flex;gap:7px;align-items:center}
.sp-chip.rm u{text-decoration:none;opacity:.7}
.sp-sum{display:flex;align-items:center;justify-content:space-between;margin:10px 16px 6px;font-size:13px;color:#6f7466}
.sp-sum b{color:#123c2b;font-size:14px}
/* product cards */
.sp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px 12px;padding:6px 14px}
@media(min-width:700px){.sp-grid{grid-template-columns:repeat(4,1fr)}}
.sp-c{position:relative;display:flex;flex-direction:column;cursor:pointer;min-width:0}
.sp-c .im{position:relative;aspect-ratio:1/1.05;border-radius:16px;background:#f3ecda;display:grid;place-items:center;font-size:48px;overflow:hidden;border:1px solid var(--line,#e6dec8)}
.sp-c .im img{width:100%;height:100%;object-fit:contain}
.sp-c .tg{position:absolute;left:0;top:10px;background:linear-gradient(90deg,#123c2b,#1d5a40);color:#f1dfae;font-size:11.5px;font-weight:700;padding:4px 10px 4px 9px;border-radius:0 8px 8px 0}
.sp-c .tg.o{background:#23291f;color:#fff}
.sp-c .hr{position:absolute;top:8px;right:8px;width:32px;height:32px;border-radius:50%;border:0;background:rgba(255,255,255,.92);font-size:17px;color:#9a6b12;display:grid;place-items:center;box-shadow:0 1px 4px rgba(0,0,0,.12)}
.sp-c .hr.on{color:#c0392b}
.sp-c .rt{position:absolute;left:8px;bottom:8px;background:rgba(255,255,255,.94);border-radius:8px;padding:4px 8px;font-size:12px;font-weight:700;color:#23291f;box-shadow:0 1px 4px rgba(0,0,0,.12)}
.sp-c .rt i{font-style:normal;color:#b8893b}.sp-c .rt small{font-weight:500;color:#6f7466;margin-left:2px}
.sp-c .ob{position:absolute;right:8px;bottom:8px;border:1px solid #d9b36a;background:linear-gradient(180deg,#174a35,#0e3022);color:#f6ead0;border-radius:10px;padding:7px 14px;font-weight:700;font-size:13px;box-shadow:0 3px 10px rgba(14,48,34,.3)}
.sp-c .ob.on{background:#fff;color:#123c2b;border-color:#123c2b;box-shadow:none}
.sp-c .ob.nt{background:#fff;color:#8a6a2a;border-color:#b8893b;box-shadow:none}
.sp-c .in{padding:9px 2px 0;display:flex;flex-direction:column;gap:2px}
.sp-c .br{font:800 15px/1.2 var(--sans,system-ui);letter-spacing:.03em;text-transform:uppercase;color:#1b2418;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-c h3{margin:0;font:500 13.5px/1.3 var(--sans,system-ui);color:#6b6e60;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sp-c .pr{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px;margin-top:3px}
.sp-c .pr b{font:700 16px var(--sans,system-ui);color:#123c2b}
.sp-c .pr s{font-size:12.5px;color:#8b8f84}
.sp-c .pr em{font-style:normal;font-size:12px;font-weight:700;color:#c47a12}
.sp-none{text-align:center;padding:44px 28px;color:#6f7466}
.sp-none b{display:block;font:700 22px var(--serif,Georgia,serif);color:#123c2b;margin-bottom:6px}
.sp-none button{margin-top:14px}
/* premium capsule: Sort | Filter */
.sp-bar[hidden],.sp-bar .n[hidden]{display:none}
.sp-bar{position:absolute;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:3;display:flex;align-items:stretch;width:min(330px,88%);height:54px;border-radius:999px;background:linear-gradient(180deg,#174a35,#0e3022);border:1px solid rgba(217,179,106,.7);box-shadow:0 10px 26px rgba(14,48,34,.38),inset 0 1px 0 rgba(255,255,255,.12)}
.sp-bar button{flex:1;border:0;background:transparent;color:#f6ead0;display:flex;align-items:center;justify-content:center;gap:9px;font:700 14px var(--sans,system-ui);letter-spacing:.02em;border-radius:999px;position:relative}
.sp-bar button:active{background:rgba(255,255,255,.08)}
.sp-bar svg{color:#e3bf72}
.sp-bar hr{width:1px;margin:12px 0;border:0;background:linear-gradient(#0000,#d9b36a,#0000)}
.sp-bar small{display:block;font-size:10.5px;font-weight:500;color:#d8c690;margin-top:1px;text-align:left}
.sp-bar .t{display:flex;flex-direction:column;line-height:1.1}
.sp-bar .n{position:absolute;top:7px;right:18px;min-width:19px;height:19px;border-radius:10px;background:#e3bf72;color:#123c2b;font-size:11px;font-weight:800;display:grid;place-items:center;padding:0 5px}
/* sort sheet */
.sp-sb{position:fixed;inset:0;z-index:99600;background:rgba(14,30,22,.5)}
.sp-sh{position:fixed;left:0;right:0;bottom:0;z-index:99601;background:var(--ivory,#fbf7ec);border-radius:22px 22px 0 0;padding:6px 0 calc(14px + env(safe-area-inset-bottom,0px));box-shadow:0 -10px 30px rgba(0,0,0,.2);animation:spUp .22s ease-out}
@keyframes spUp{from{transform:translateY(40px);opacity:.4}to{transform:none;opacity:1}}
.sp-sh .gr{width:42px;height:4px;border-radius:4px;background:#d9c79a;margin:6px auto 4px}
.sp-sh h4{margin:10px 18px 4px;font:700 21px var(--serif,Georgia,serif);color:#123c2b}
.sp-sh label{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;font-size:15px;border-bottom:1px solid var(--line,#e6dec8)}
.sp-sh label:last-child{border-bottom:0}
.sp-sh input{position:absolute;opacity:0}
.sp-sh label i{width:22px;height:22px;border-radius:50%;border:2px solid #cdbd8d;display:grid;place-items:center}
.sp-sh input:checked+i{border-color:#123c2b;background:#123c2b}
.sp-sh input:checked+i::after{content:"";width:8px;height:8px;border-radius:50%;background:#e8c984}
.sp-sh label.on{font-weight:700;color:#123c2b}
/* filter page */
.sf{position:fixed;inset:0;z-index:99700;background:var(--ivory,#fbf7ec);color:var(--ink,#23291f);display:flex;flex-direction:column;font-family:var(--sans,system-ui,sans-serif)}
.sf *{box-sizing:border-box}
.sf button{font-family:inherit;cursor:pointer}
.sf-h{display:flex;align-items:center;justify-content:space-between;padding:calc(12px + env(safe-area-inset-top,0px)) 8px 12px 6px;border-bottom:1px solid var(--line,#e6dec8)}
.sf-h div{display:flex;align-items:center;gap:2px}
.sf-h b{font:700 23px var(--serif,Georgia,serif);color:#123c2b}
.sf-h .cl{border:0;background:none;color:#9a6b12;font-weight:800;font-size:13px;letter-spacing:.04em;padding:10px 12px}
.sf-m{flex:1;display:flex;min-height:0}
.sf-l{width:36%;max-width:170px;background:#f3ecda;overflow-y:auto}
.sf-l button{display:flex;width:100%;align-items:center;justify-content:space-between;gap:6px;text-align:left;border:0;background:transparent;padding:16px 12px 16px 14px;font-size:14px;font-weight:600;color:#4b4f40;border-left:4px solid transparent}
.sf-l button.on{background:var(--ivory,#fbf7ec);color:#123c2b;border-left-color:#b8893b;font-weight:800}
.sf-l .dot{min-width:20px;height:20px;border-radius:10px;background:#123c2b;color:#f1dfae;font-size:11px;display:grid;place-items:center;padding:0 5px;font-weight:700}
.sf-r{flex:1;overflow-y:auto;padding:6px 14px 20px;-webkit-overflow-scrolling:touch}
.sf-r .find{width:100%;height:42px;border-radius:12px;border:1.5px solid #d9c79a;background:#fff;padding:0 12px;font:500 15px var(--sans,system-ui);margin:8px 0 4px;outline:0}
.sf-o{display:flex;align-items:center;gap:12px;padding:13px 2px;border-bottom:1px solid var(--line,#e6dec8);font-size:15px}
.sf-o input{position:absolute;opacity:0}
.sf-o i{flex:none;width:22px;height:22px;border-radius:7px;border:2px solid #cdbd8d;display:grid;place-items:center;background:#fff}
.sf-o input:checked+i{background:#123c2b;border-color:#123c2b}
.sf-o input:checked+i::after{content:"";width:6px;height:11px;border:solid #e8c984;border-width:0 2.5px 2.5px 0;transform:rotate(45deg) translate(-1px,-1px)}
.sf-o span{flex:1;min-width:0;word-break:break-word}
.sf-o small{color:#8b8f84;font-size:12.5px}
.sf-o.z{opacity:.45}
.sf-o.all{font-weight:700;color:#123c2b}
.sf-note{margin:14px 2px;padding:14px;border:1.5px dashed #d9c79a;border-radius:14px;color:#6f7466;font-size:13.5px;line-height:1.5;background:rgba(255,255,255,.6)}
.sf-pr{padding:18px 6px 6px}
.sf-pr .v{font:700 22px var(--serif,Georgia,serif);color:#123c2b;margin-bottom:22px}
.sf-pr .v small{display:block;font:500 12.5px var(--sans,system-ui);color:#6f7466;margin-bottom:4px}
.sf-sl{position:relative;height:30px}
.sf-sl .tr{position:absolute;left:0;right:0;top:12px;height:5px;border-radius:5px;background:#e3d8b8}
.sf-sl .fl{position:absolute;top:12px;height:5px;border-radius:5px;background:linear-gradient(90deg,#174a35,#b8893b)}
.sf-sl input{position:absolute;left:0;top:0;width:100%;height:30px;margin:0;background:none;pointer-events:none;-webkit-appearance:none;appearance:none}
.sf-sl input::-webkit-slider-thumb{-webkit-appearance:none;pointer-events:auto;width:26px;height:26px;border-radius:50%;background:#fff;border:3px solid #123c2b;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.sf-sl input::-moz-range-thumb{pointer-events:auto;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid #123c2b}
.sf-sl input::-webkit-slider-runnable-track{background:none}.sf-sl input::-moz-range-track{background:none}
.sf-pr .cn{margin-top:18px;font-size:13px;color:#6f7466}
.sf-f{display:flex;gap:10px;padding:12px 14px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--line,#e6dec8);background:var(--ivory,#fbf7ec)}
.sf-f button{height:50px;border-radius:999px;font-weight:700;font-size:15px}
.sf-f .g{flex:1;border:1.5px solid #123c2b;background:transparent;color:#123c2b}
.sf-f .p{flex:2;border:1px solid #d9b36a;background:linear-gradient(180deg,#174a35,#0e3022);color:#f6ead0;box-shadow:0 6px 16px rgba(14,48,34,.28)}
.sp button:focus-visible,.sf button:focus-visible{outline:2px solid #b8893b;outline-offset:2px}
@media(prefers-reduced-motion:reduce){.sp-sh{animation:none}}
`;
  document.head.appendChild(css);

  /* ---------- history (phone Back closes the top screen) ---------- */
  function pushLayer() { depth++; try { history.pushState({ sp: depth }, "", location.href); } catch (e) {} }
  function popLayers(n) { if (n <= 0) return; skip++; try { history.go(-n); } catch (e) { skip--; } }
  window.addEventListener("popstate", () => {
    if (skip > 0) { skip--; return; }
    const d = (history.state && history.state.sp) || 0;
    while (depth > d && depth > 0) { if (depth >= 2 && $("sfPage")) { $("sfPage").remove(); } else if (page) { page.remove(); page = null; } depth--; }
  });

  /* ---------- icons ---------- */
  const IC = {
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    search: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    sort: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M7 20l-3.5-3.5M7 20l3.5-3.5M17 20V4M17 4l-3.5 3.5M17 4l3.5 3.5"/></svg>',
    filt: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg>'
  };

  /* ---------- page ---------- */
  function brandRail() {
    const bs = brandMap();
    if (!bs.length) return `<div class="sp-h"><b>${L("Top brands", "टॉप ब्रांड")}</b></div><div class="sp-empty-b">${L("Brands will appear here as soon as you add a product with a brand name.", "प्रोडक्ट में ब्रांड का नाम डालते ही ब्रांड यहाँ दिखेंगे।")}</div>`;
    const sel = F.brands;
    return `<div class="sp-h"><b>${L("Top brands", "टॉप ब्रांड")}</b>${sel.size ? `<button type="button" data-clrb>${L("Clear", "हटाएँ")}</button>` : ""}</div>
    <div class="sp-rail">${bs.map(b => `<button type="button" class="sp-b${sel.has(b.k) ? " on" : ""}" data-b="${esc(b.k)}"><b>${esc(b.name)}</b><span>${esc(b.cat || (b.n + " " + L("products", "प्रोडक्ट")))}</span></button>`).join("")}</div>`;
  }
  function quickRow() {
    const sortName = (SORTS.find(s => s.v === SORT) || SORTS[0]).t();
    const price = F.pr || [];
    return `<div class="sp-qr"><button type="button" class="sp-q dd${F.cats.size ? " on" : ""}" data-catsec>${L("Categories", "कैटेगरी")}</button>
    <button type="button" class="sp-q dd${SORT !== "rel" ? " on" : ""}" data-sortchip>${SORT !== "rel" ? esc(sortName) : L("Sort", "सॉर्ट")}</button>
    ${PCHIPS.map(c => `<button type="button" class="sp-q${price[0] === c[0] && price[1] === c[1] ? " on" : ""}" data-pc="${c[0]}-${c[1]}">${c[2]}</button>`).join("")}
    ${QUICK.map(q => `<button type="button" class="sp-q${F.quick.has(q.k) ? " on" : ""}" data-qk="${q.k}">${q.t()}</button>`).join("")}</div>`;
  }
  function chipsActive() {
    const out = [], bn = {}; brandMap().forEach(b => bn[b.k] = b.name);
    F.brands.forEach(k => out.push({ t: bn[k] || k, a: "b", k }));
    F.cats.forEach(k => out.push({ t: title(k), a: "c", k }));
    F.sizes.forEach(k => out.push({ t: k, a: "s", k }));
    F.quick.forEach(k => out.push({ t: (QUICK.find(q => q.k === k) || { t: () => k }).t(), a: "q", k }));
    if (F.pr) out.push({ t: "₹" + F.pr[0] + " – " + (F.pr[1] >= 1e9 ? "above" : "₹" + F.pr[1]), a: "p", k: "" });
    if (F.disc) out.push({ t: F.disc + "%+ " + L("off", "छूट"), a: "d", k: "" });
    if (F.bundle) out.push({ t: L("Combo offers", "कॉम्बो ऑफ़र"), a: "u", k: "" });
    if (F.stock) out.push({ t: L("In stock", "स्टॉक में"), a: "t", k: "" });
    if (F.cod) out.push({ t: L("Cash on Delivery", "कैश ऑन डिलीवरी"), a: "o", k: "" });
    return out;
  }
  function cardHTML(g) {
    const p = g.rep, W = window.aashapuraWish, liked = W && W.has(p.id), d = disc(p), bag = inCart(p.id) > 0;
    const ob = g.n > 1 ? `<button type="button" class="ob" data-open="${p.id}">${L("Sizes", "साइज़")}</button>`
      : p.stock <= 0 ? `<button type="button" class="ob nt" data-notify="${p.id}">🔔 ${L("Notify", "बताएँ")}</button>`
      : bag ? `<button type="button" class="ob on" data-bag>✓ ${L("Added", "जुड़ गया")}</button>`
      : `<button type="button" class="ob" data-add="${p.id}">+ ${L("Add", "जोड़ें")}</button>`;
    const tag = !g.any ? `<span class="tg o">${L("Out of stock", "स्टॉक खत्म")}</span>` : bag ? `<span class="tg">${L("In your bag", "आपके बैग में")}</span>` : "";
    return `<article class="sp-c" data-open="${p.id}">
      <div class="im">${p.image_url ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">` : esc(p.emoji || "🌿")}
        ${tag}<button type="button" class="hr${liked ? " on" : ""}" data-heart="${p.id}" aria-label="Wishlist">${liked ? "♥" : "♡"}</button>
        ${g.rt ? `<span class="rt">${g.rt.a.toFixed(1)} <i>★</i><small>${g.rt.n}</small></span>` : ""}${ob}</div>
      <div class="in"><div class="br">${esc(p.brand || p.name)}</div>${p.brand ? `<h3>${esc(p.name)}</h3>` : `<h3>${esc(p.weight || "")}</h3>`}
      <div class="pr"><b>${g.n > 1 ? L("from ", "") : ""}₹${g.from}</b>${g.n === 1 && p.mrp > p.price ? `<s>₹${p.mrp}</s>` : ""}${g.d ? `<em>${g.d}% ${L("OFF", "छूट")}</em>` : ""}</div></div></article>`;
  }
  function paint() {
    if (!page) return;
    const body = page.querySelector(".sp-body"), has = !!Q.trim() || activeCount(F) > 0;
    const sc = body.scrollTop, rail = body.querySelector(".sp-rail"), rsl = rail ? rail.scrollLeft : 0;
    const qr0 = body.querySelector(".sp-qr"), qsl = qr0 ? qr0.scrollLeft : 0;
    C = ctx();
    let h = brandRail();
    if (!has) {
      const rc = recent(), cats = [...new Set(P().map(p => lc(p.category)).filter(Boolean))];
      if (rc.length) h += `<div class="sp-h"><b>${L("Recent searches", "हाल की खोज")}</b><button type="button" data-clrr>${L("Clear", "हटाएँ")}</button></div><div class="sp-chips">${rc.map(r => `<button type="button" class="sp-chip" data-rq="${esc(r)}">${esc(r)}</button>`).join("")}</div>`;
      if (cats.length) h += `<div class="sp-h"><b>${L("Browse by category", "कैटेगरी देखें")}</b></div><div class="sp-chips">${cats.map(c => `<button type="button" class="sp-chip" data-cat="${esc(c)}">${esc(title(c))}</button>`).join("")}</div>`;
      if (!P().length) h += `<div class="sp-none"><b>${L("No products yet", "अभी कोई प्रोडक्ट नहीं")}</b>${L("Products will show here once they are added.", "प्रोडक्ट जुड़ते ही यहाँ दिखेंगे।")}</div>`;
    } else {
      const res = results(F), ch = chipsActive();
      h += quickRow();
      if (ch.length) h += `<div class="sp-chips" style="margin-top:4px">${ch.map(c => `<button type="button" class="sp-chip rm" data-rm="${c.a}" data-k="${esc(c.k)}">${esc(c.t)} <u>✕</u></button>`).join("")}</div>`;
      h += `<div class="sp-sum"><span><b>${res.length}</b> ${res.length === 1 ? L("product", "प्रोडक्ट") : L("products", "प्रोडक्ट")}${Q.trim() ? ` ${L("for", "के लिए")} “${esc(Q.trim())}”` : ""}</span></div>`;
      h += res.length ? `<div class="sp-grid">${res.map(cardHTML).join("")}</div>`
        : `<div class="sp-none"><b>${L("Nothing found", "कुछ नहीं मिला")}</b>${L("Try another word or remove some filters.", "दूसरा शब्द आज़माएँ या फ़िल्टर हटाएँ।")}<br>${activeCount(F) ? `<button type="button" class="sp-chip" data-clearf>${L("Clear filters", "फ़िल्टर हटाएँ")}</button>` : ""}</div>`;
    }
    body.innerHTML = h;
    body.scrollTop = sc;
    const r2 = body.querySelector(".sp-rail"); if (r2) r2.scrollLeft = rsl;
    const q2 = body.querySelector(".sp-qr"); if (q2) q2.scrollLeft = qsl;
    const bar = page.querySelector(".sp-bar");
    bar.hidden = !has;
    const n = activeCount(F);
    bar.querySelector(".n").hidden = !n; bar.querySelector(".n").textContent = n;
    bar.querySelector(".sl").textContent = (SORTS.find(s => s.v === SORT) || SORTS[0]).t();
    page.querySelector(".sp-x").style.display = Q ? "block" : "none";
  }

  function open(opt) {
    opt = opt || {};
    if (page) { if (opt.q != null) { Q = opt.q; page.querySelector("input").value = Q; } paint(); return; }
    Q = opt.q != null ? String(opt.q) : ""; SORT = "rel"; F = blank();
    if (opt.brand) F.brands.add(lc(opt.brand));
    if (opt.cat) F.cats.add(lc(opt.cat));
    page = document.createElement("div"); page.className = "sp"; page.id = "spPage";
    page.setAttribute("role", "dialog"); page.setAttribute("aria-label", "Search");
    page.innerHTML = `<div class="sp-top"><button type="button" class="sp-back" aria-label="Back">${IC.back}</button>
      <label class="sp-field">${IC.search}<input type="search" enterkeyhint="search" autocomplete="off" placeholder="${L("Search products, brands…", "प्रोडक्ट, ब्रांड खोजें…")}" aria-label="Search"><button type="button" class="sp-x" aria-label="Clear">✕</button></label></div>
      <div class="sp-body"></div>
      <div class="sp-bar" hidden><button type="button" data-sort aria-label="Sort">${IC.sort}<span class="t">${L("Sort", "सॉर्ट")}<small class="sl"></small></span></button><hr><button type="button" data-filter aria-label="Filter">${IC.filt}${L("Filter", "फ़िल्टर")}<span class="n" hidden></span></button></div>`;
    document.body.appendChild(page);
    pushLayer();
    const inp = page.querySelector("input"); inp.value = Q;
    inp.addEventListener("input", () => { Q = inp.value; paint(); });
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { saveRecent(Q); inp.blur(); } });
    page.querySelector(".sp-x").onclick = () => { Q = ""; inp.value = ""; paint(); inp.focus(); };
    page.querySelector(".sp-back").onclick = () => closeAll();
    page.querySelector("[data-sort]").onclick = openSort;
    page.querySelector("[data-filter]").onclick = () => openFilter();
    page.addEventListener("click", onClick);
    paint(); loadExtra();
    if (!opt.brand && !opt.cat) setTimeout(() => { try { inp.focus(); } catch (e) {} }, 60);
  }
  function closeAll() { if (!page) return; const n = depth; page.remove(); page = null; const f = $("sfPage"); if (f) f.remove(); popLayers(n); depth = 0; }
  function dropNoHistory() { if (page) { page.remove(); page = null; } const f = $("sfPage"); if (f) f.remove(); depth = 0; }

  function onClick(e) {
    const t = e.target;
    let el;
    if ((el = t.closest("[data-b]"))) { const k = el.dataset.b; F.brands.has(k) ? F.brands.delete(k) : F.brands.add(k); paint(); return; }
    if (t.closest("[data-clrb]")) { F.brands.clear(); paint(); return; }
    if ((el = t.closest("[data-rq]"))) { Q = el.dataset.rq; page.querySelector("input").value = Q; paint(); return; }
    if (t.closest("[data-clrr]")) { try { localStorage.removeItem("aashapura_recent_q"); } catch (er) {} paint(); return; }
    if ((el = t.closest("[data-cat]"))) { F.cats.add(el.dataset.cat); paint(); return; }
    if (t.closest("[data-clearf]")) { F = blank(); paint(); return; }
    if (t.closest("[data-catsec]")) { openFilter("cat"); return; }
    if (t.closest("[data-sortchip]")) { openSort(); return; }
    if ((el = t.closest("[data-pc]"))) { const [lo, hi] = el.dataset.pc.split("-").map(Number); F.pr = (F.pr && F.pr[0] === lo && F.pr[1] === hi) ? null : [lo, hi]; paint(); return; }
    if ((el = t.closest("[data-qk]"))) { const k = el.dataset.qk; F.quick.has(k) ? F.quick.delete(k) : F.quick.add(k); paint(); return; }
    if ((el = t.closest("[data-rm]"))) {
      const a = el.dataset.rm, k = el.dataset.k;
      if (a === "b") F.brands.delete(k); else if (a === "c") F.cats.delete(k); else if (a === "s") F.sizes.delete(k); else if (a === "q") F.quick.delete(k);
      else if (a === "p") F.pr = null; else if (a === "d") F.disc = 0; else if (a === "u") F.bundle = false; else if (a === "t") F.stock = false; else F.cod = false;
      paint(); return;
    }
    if (t.closest("[data-add]")) { setTimeout(paint, 80); return; } /* the store's own handler adds it to the bag */
    if (t.closest("[data-notify]")) return;
    if (t.closest("[data-bag]")) { dropNoHistory(); const c = $("cartOpen"); if (c) c.click(); return; }
    if ((el = t.closest("[data-heart]"))) {
      const W = window.aashapuraWish; if (!W) return;
      const on = W.toggle(Number(el.dataset.heart)); el.classList.toggle("on", !!on); el.textContent = on ? "♥" : "♡";
      try { showStoreToast(on ? L("Added to wishlist ❤", "पसंदीदा में जोड़ा ❤") : L("Removed from wishlist", "पसंदीदा से हटाया"), on ? "success" : "info"); } catch (er) {}
      return;
    }
    if ((el = t.closest("[data-open]"))) { saveRecent(Q); if (window.showProduct) window.showProduct(Number(el.dataset.open)); }
  }

  /* ---------- sort sheet ---------- */
  function openSort() {
    const bk = document.createElement("div"); bk.className = "sp-sb";
    const sh = document.createElement("div"); sh.className = "sp-sh"; sh.setAttribute("role", "dialog");
    sh.innerHTML = `<div class="gr"></div><h4>${L("Sort by", "ऐसे सॉर्ट करें")}</h4>` + SORTS.map(s => `<label class="${s.v === SORT ? "on" : ""}">${s.t()}<input type="radio" name="spsort" value="${s.v}"${s.v === SORT ? " checked" : ""}><i></i></label>`).join("");
    const shut = () => { bk.remove(); sh.remove(); };
    bk.onclick = shut;
    sh.addEventListener("change", e => { SORT = e.target.value; shut(); paint(); const b = page.querySelector(".sp-body"); b.scrollTop = 0; });
    document.body.append(bk, sh);
  }

  /* ---------- filter page ---------- */
  function openFilter(startSec) {
    if ($("sfPage")) return;
    let D = clone(F), sec = startSec || "quick", bq = "";
    const el = document.createElement("div"); el.className = "sf"; el.id = "sfPage";
    el.innerHTML = `<div class="sf-h"><div><button type="button" class="sp-back" data-x aria-label="Close" style="border:0;background:none;width:40px;height:40px;color:#123c2b">${IC.back}</button><b>${L("Filters", "फ़िल्टर")}</b></div><button type="button" class="cl" data-clr>${L("CLEAR ALL", "सब हटाएँ")}</button></div>
      <div class="sf-m"><div class="sf-l"></div><div class="sf-r"></div></div>
      <div class="sf-f"><button type="button" class="g" data-x>${L("Close", "बंद करें")}</button><button type="button" class="p" data-ok></button></div>`;
    document.body.appendChild(el);
    pushLayer();
    C = ctx();
    const q = lc(Q);
    const base = ignore => P().filter(p => textHit(p, q) && pass(p, D, ignore));
    const cnt = (list, fn) => { const m = new Map(); list.forEach(p => { const k = fn(p); if (k) m.set(k, (m.get(k) || 0) + 1); }); return m; };
    const prices = P().map(p => p.price).filter(x => x >= 0);
    const PLO = prices.length ? Math.floor(Math.min(...prices)) : 0, PHI = prices.length ? Math.ceil(Math.max(...prices)) : 0;
    const SECS = () => [
      { id: "quick", t: L("Quick Filters", "क्विक फ़िल्टर"), n: D.quick.size },
      { id: "brand", t: L("Brand", "ब्रांड"), n: D.brands.size },
      { id: "cat", t: L("Categories", "कैटेगरी"), n: D.cats.size },
      { id: "size", t: L("Size / Weight", "साइज़ / वज़न"), n: D.sizes.size },
      { id: "bundle", t: L("Bundles", "बंडल / कॉम्बो"), n: D.bundle ? 1 : 0 },
      { id: "price", t: L("Price Range", "कीमत"), n: D.pr ? 1 : 0 },
      { id: "disc", t: L("Discount", "छूट"), n: D.disc ? 1 : 0 },
      { id: "more", t: L("More Filters", "और फ़िल्टर"), n: (D.stock ? 1 : 0) + (D.cod ? 1 : 0) }
    ];
    const opt = (type, val, label, n, on) => `<label class="sf-o${n === 0 && !on ? " z" : ""}"><input type="checkbox" data-t="${type}" data-v="${esc(val)}"${on ? " checked" : ""}><i></i><span>${esc(label)}</span><small>${n == null ? "" : n}</small></label>`;
    const selAll = (type, vals, set) => `<label class="sf-o all"><input type="checkbox" data-t="all-${type}" data-vs="${esc(JSON.stringify(vals))}"${vals.length && vals.every(v => set.has(v)) ? " checked" : ""}><i></i><span>${L("Select All", "सभी चुनें")} (${vals.length})</span></label>`;
    function right() {
      const r = el.querySelector(".sf-r"); let h = "";
      if (sec === "quick") {
        const b = base("quick");
        h = QUICK.map(k => opt("quick", k.k, k.t(), b.filter(p => quickOK(p, k.k)).length, D.quick.has(k.k))).join("");
      } else if (sec === "brand") {
        const bs = brandMap(), c = cnt(base("brand"), p => lc(p.brand));
        if (!bs.length) h = `<div class="sf-note">${L("No brands yet. When you add a product with a brand name in the admin panel, the brand will appear here automatically.", "अभी कोई ब्रांड नहीं है। एडमिन में ब्रांड के नाम के साथ प्रोडक्ट जोड़ते ही ब्रांड यहाँ अपने आप दिखेगा।")}</div>`;
        else {
          const vis = bs.filter(b => !bq || lc(b.name).includes(lc(bq)));
          if (bs.length > 7) h += `<input class="find" type="search" data-bq placeholder="${L("Search brand", "ब्रांड खोजें")}" value="${esc(bq)}">`;
          h += selAll("brand", vis.map(b => b.k), D.brands) + vis.map(b => opt("brand", b.k, b.name, c.get(b.k) || 0, D.brands.has(b.k))).join("");
        }
      } else if (sec === "cat") {
        const c = cnt(base("cat"), p => lc(p.category)), all = [...new Set(P().map(p => lc(p.category)).filter(Boolean))].sort();
        h = all.length ? selAll("cat", all, D.cats) + all.map(k => opt("cat", k, title(k), c.get(k) || 0, D.cats.has(k))).join("") : `<div class="sf-note">${L("No categories yet.", "अभी कोई कैटेगरी नहीं।")}</div>`;
      } else if (sec === "size") {
        const c = cnt(base("size"), p => lc(p.weight)), all = [...new Set(P().map(p => lc(p.weight)).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
        h = all.length ? selAll("size", all, D.sizes) + all.map(k => opt("size", k, k, c.get(k) || 0, D.sizes.has(k))).join("") : `<div class="sf-note">${L("No sizes yet.", "अभी कोई साइज़ नहीं।")}</div>`;
      } else if (sec === "bundle") {
        const b = base("bundle");
        h = COMBO_IDS.size ? opt("bundle", "1", L("Part of a combo offer", "कॉम्बो ऑफ़र में शामिल"), b.filter(p => COMBO_IDS.has(String(p.id))).length, D.bundle) : `<div class="sf-note">${L("No combo offers right now. When you create a combo in the admin panel, products in it can be filtered here.", "अभी कोई कॉम्बो ऑफ़र नहीं है। एडमिन में कॉम्बो बनाने पर उसके प्रोडक्ट यहाँ फ़िल्टर हो सकेंगे।")}</div>`;
      } else if (sec === "price") {
        if (PHI <= PLO) h = `<div class="sf-note">${L("All products have the same price.", "सभी प्रोडक्ट की कीमत एक जैसी है।")}</div>`;
        else {
          const lo = D.pr ? Math.max(PLO, D.pr[0]) : PLO, hi = D.pr ? Math.min(PHI, D.pr[1]) : PHI, step = PHI - PLO > 600 ? 10 : 1;
          h = `<div class="sf-pr"><div class="v"><small>${L("Selected price range", "चुनी हुई कीमत")}</small><span data-pv>₹${lo} – ₹${hi}</span></div>
          <div class="sf-sl"><div class="tr"></div><div class="fl" data-fl></div><input type="range" data-pr="lo" min="${PLO}" max="${PHI}" step="${step}" value="${lo}" aria-label="Min price"><input type="range" data-pr="hi" min="${PLO}" max="${PHI}" step="${step}" value="${hi}" aria-label="Max price"></div>
          <div class="cn" data-pn></div></div>`;
        }
      } else if (sec === "disc") {
        const b = base("disc");
        h = DISCS.map(d => `<label class="sf-o${!b.some(p => disc(p) >= d) && D.disc !== d ? " z" : ""}"><input type="checkbox" data-t="disc" data-v="${d}"${D.disc === d ? " checked" : ""}><i></i><span>${d}% ${L("and above", "या ज़्यादा")}</span><small>${b.filter(p => disc(p) >= d).length}</small></label>`).join("");
      } else {
        const b = base("more");
        h = opt("stock", "1", L("In stock only", "सिर्फ़ स्टॉक में"), b.filter(p => p.stock > 0).length, D.stock) + opt("cod", "1", L("Cash on Delivery available", "कैश ऑन डिलीवरी उपलब्ध"), b.filter(p => p.cod_available !== false).length, D.cod);
      }
      r.innerHTML = h; r.scrollTop = 0;
      if (sec === "price") sliderUI();
    }
    function sliderUI() {
      const lo = el.querySelector('[data-pr="lo"]'), hi = el.querySelector('[data-pr="hi"]'); if (!lo) return;
      const a = Number(lo.min), z = Number(lo.max), l = Number(lo.value), h = Number(hi.value);
      el.querySelector("[data-pv]").textContent = "₹" + Math.min(l, h) + " – ₹" + Math.max(l, h);
      const fl = el.querySelector("[data-fl]"); fl.style.left = ((Math.min(l, h) - a) / (z - a) * 100) + "%"; fl.style.right = (100 - (Math.max(l, h) - a) / (z - a) * 100) + "%";
      const n = P().filter(p => textHit(p, q) && pass(p, D, "price") && p.price >= Math.min(l, h) && p.price <= Math.max(l, h)).length;
      el.querySelector("[data-pn]").textContent = n + " " + (n === 1 ? L("product in this range", "प्रोडक्ट इस रेंज में") : L("products in this range", "प्रोडक्ट इस रेंज में"));
    }
    function left() {
      el.querySelector(".sf-l").innerHTML = SECS().map(s => `<button type="button" data-sec="${s.id}" class="${s.id === sec ? "on" : ""}">${s.t}${s.n ? `<span class="dot">${s.n}</span>` : ""}</button>`).join("");
    }
    function foot() {
      const n = results(D).length;
      el.querySelector("[data-ok]").textContent = L("Apply · ", "लागू करें · ") + n + (n === 1 ? L(" product", " प्रोडक्ट") : L(" products", " प्रोडक्ट"));
    }
    function refresh() { left(); const r = el.querySelector(".sf-r"), sc = r.scrollTop; right(); r.scrollTop = sc; foot(); }
    el.addEventListener("click", e => {
      const t = e.target;
      const s = t.closest("[data-sec]"); if (s) { sec = s.dataset.sec; left(); right(); return; }
      if (t.closest("[data-clr]")) { D = blank(); bq = ""; refresh(); return; }
      if (t.closest("[data-x]")) { closeFilter(); return; }
      if (t.closest("[data-ok]")) { F = D; closeFilter(); paint(); const b = page && page.querySelector(".sp-body"); if (b) b.scrollTop = 0; return; }
    });
    el.addEventListener("change", e => {
      const c = e.target.closest("input[data-t]"); if (!c) return;
      const ty = c.dataset.t, v = c.dataset.v, on = c.checked;
      const flip = set => on ? set.add(v) : set.delete(v);
      if (ty.indexOf("all-") === 0) {
        const vals = JSON.parse(c.dataset.vs || "[]"), set = ty === "all-brand" ? D.brands : ty === "all-cat" ? D.cats : D.sizes;
        vals.forEach(x => on ? set.add(x) : set.delete(x));
      }
      else if (ty === "brand") flip(D.brands); else if (ty === "cat") flip(D.cats); else if (ty === "size") flip(D.sizes); else if (ty === "quick") flip(D.quick);
      else if (ty === "disc") D.disc = on ? Number(v) : 0; else if (ty === "bundle") D.bundle = on; else if (ty === "stock") D.stock = on; else if (ty === "cod") D.cod = on;
      refresh();
    });
    el.addEventListener("input", e => {
      const t = e.target;
      if (t.matches("[data-bq]")) { bq = t.value; const pos = t.selectionStart; right(); const f = el.querySelector("[data-bq]"); if (f) { f.focus(); try { f.setSelectionRange(pos, pos); } catch (er) {} } return; }
      if (t.matches("[data-pr]")) {
        const lo = el.querySelector('[data-pr="lo"]'), hi = el.querySelector('[data-pr="hi"]');
        const a = Math.min(Number(lo.value), Number(hi.value)), z = Math.max(Number(lo.value), Number(hi.value));
        D.pr = (a <= PLO && z >= PHI) ? null : [a, z];
        sliderUI(); left(); foot();
      }
    });
    function closeFilter() { if (!$("sfPage")) return; el.remove(); popLayers(1); depth = Math.max(1, depth - 1); }
    left(); right(); foot();
  }

  /* ---------- hooks ---------- */
  document.addEventListener("focus", e => {
    const t = e.target;
    if (t && (t.id === "homeSearch" || t.id === "searchInput") && !page) { e.stopImmediatePropagation(); try { t.blur(); } catch (er) {} open({ q: t.value || "" }); }
  }, true);
  document.addEventListener("click", e => {
    const t = e.target;
    if (t && (t.id === "homeSearch" || t.id === "searchInput") && !page) { e.preventDefault(); try { t.blur(); } catch (er) {} open({ q: t.value || "" }); return; }
    /* "View cart" toast button / cart icon: the cart page must not sit under this page */
    if (page && t && t.closest && (t.closest(".store-toast-act") || t.closest("#cartOpen"))) dropNoHistory();
  }, true);

  /* brand list for admin Add Product + refresh when products reload */
  function fillBrandList() {
    const dl = $("pBrandList"); if (!dl) return;
    dl.innerHTML = brandMap().map(b => `<option value="${esc(b.name)}">`).join("");
  }
  const prev = window.renderProducts;
  window.renderProducts = function () {
    const r = typeof prev === "function" ? prev.apply(this, arguments) : undefined;
    try { fillBrandList(); if (page) paint(); } catch (e) {}
    return r;
  };
  try { fillBrandList(); } catch (e) {}

  window.aashapuraSearch = { open, close: closeAll, brands: brandMap };
})();
