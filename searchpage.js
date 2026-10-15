/* v69: Full-page search (Myntra style). Tap on the search box -> new page: search box, category cards, filter chips (Sort / Filter / Categories / Price / In stock / Favourites),
   2-column product grid, floating "Image Search" + "Camera Search" (photo -> Ayurveda AI names the item -> matching products). Window API: aashapuraSearch.open(q) */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const P = () => { try { return Array.isArray(products) ? products : []; } catch (e) { return []; } };
  const CT = () => { try { return cart || {}; } catch (e) { return {}; } };
  const AI = "https://rvygarzpdacnhxwxsgxo.supabase.co/functions/v1/bright-api";
  const low = s => String(s == null ? "" : s).toLowerCase();
  const PR = [{ k: "a", t: L("Under ₹199", "₹199 से कम"), a: 0, b: 199 }, { k: "b", t: "₹200 - ₹499", a: 200, b: 499 }, { k: "c", t: "₹500 - ₹999", a: 500, b: 999 }, { k: "d", t: L("₹1000 And Above", "₹1000 और ऊपर"), a: 1000, b: Infinity }];
  const SORTS = [["", L("Recommended", "सुझाए गए")], ["low", L("Price: Low to High", "कीमत: कम से ज़्यादा")], ["high", L("Price: High to Low", "कीमत: ज़्यादा से कम")], ["disc", L("Better Discount", "ज़्यादा छूट")]];
  const DISC = [[0, L("Any", "सभी")], [10, "10% " + L("and above", "और ऊपर")], [20, "20% " + L("and above", "और ऊपर")], [30, "30% " + L("and above", "और ऊपर")], [50, "50% " + L("and above", "और ऊपर")]];
  const LAB = { powder: "पाउडर", herbal: "हर्बल", wellness: "वेलनेस" };
  const catName = c => { const t = LAB[c] && window.AASHAPURA_LANG === "hi" ? LAB[c] : String(c || "Other"); return t.charAt(0).toUpperCase() + t.slice(1); };
  const imgOf = p => { let u = ""; try { const s = typeof p.images === "string" ? JSON.parse(p.images || "[]") : p.images; u = (Array.isArray(s) && s[0]) || ""; } catch (e) {} return (typeof p.image_url === "string" && p.image_url) || u || ""; };
  const off = p => (p.mrp > p.price ? Math.round((p.mrp - p.price) / p.mrp * 100) : 0);
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) {} };
  const RK = "aashapura_recent_search";
  const recents = () => { try { return JSON.parse(localStorage.getItem(RK) || "[]").slice(0, 8); } catch (e) { return []; } };
  const saveRecent = q => { q = String(q || "").trim(); if (q.length < 2) return; try { localStorage.setItem(RK, JSON.stringify([q, ...recents().filter(x => x !== q)].slice(0, 8))); } catch (e) {} };

  const css = document.createElement("style");
  css.textContent = `.sp-ov{position:fixed;inset:0;z-index:100030;background:#fbf8f1;overflow-y:auto;color:#14301f;-webkit-overflow-scrolling:touch}
  .sp-top{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:8px;padding:14px 12px 16px;background:linear-gradient(135deg,#0d3524,#1f5c3b);border-radius:0 0 26px 26px;box-shadow:0 6px 20px rgba(13,53,36,.25)}
  .sp-top .bk{border:0;background:rgba(255,255,255,.14);width:38px;height:38px;border-radius:50%;font-size:20px;color:#f4d98a;cursor:pointer}
  .sp-box{flex:1;display:flex;align-items:center;border-radius:99px;padding:0 6px 0 16px;background:#fffdf7;box-shadow:0 0 0 2px #d9b45a}
  .sp-box input{flex:1;min-width:0;border:0;outline:0;font:inherit;font-size:16px;padding:12px 0;background:none;color:#14301f}
  .sp-box button{border:0;background:none;font-size:17px;padding:8px 10px;color:#8a7433;cursor:pointer}
  .sp-sg{padding:12px 16px 2px}.sp-sg h5{margin:10px 0 8px;font:italic 600 15px Georgia,serif;color:#7a6320}
  .sp-sg div{display:flex;flex-wrap:wrap;gap:8px}.sp-sg button{border:1px solid #e3d3a4;background:#fffdf7;border-radius:99px;padding:9px 14px;font:inherit;font-size:13.5px;color:#14402b;cursor:pointer}
  .sp-ph{display:flex;align-items:center;gap:12px;margin:12px 14px 2px;padding:12px;border-radius:18px;background:#fffdf7;box-shadow:0 4px 16px rgba(60,50,10,.1)}
  .sp-ph img{width:52px;height:52px;border-radius:14px;object-fit:cover;flex:none}.sp-ph .t{flex:1;min-width:0;font-size:13.5px;line-height:1.5}.sp-ph .t span{display:inline-block;margin:3px 5px 0 0;padding:4px 11px;border-radius:99px;background:#14402b;color:#f4d98a;cursor:pointer}
  .sp-ph>button{border:0;background:none;font-size:20px;color:#8a7433;cursor:pointer}
  .sp-cats{display:flex;gap:14px;overflow-x:auto;padding:14px 16px 4px;scrollbar-width:none}.sp-cats::-webkit-scrollbar,.sp-chips::-webkit-scrollbar{display:none}
  .sp-cat{flex:none;width:68px;text-align:center;cursor:pointer;font-size:11.5px;color:#4d6455}
  .sp-cat i{display:flex;width:62px;height:62px;margin:0 auto;border-radius:50%;align-items:center;justify-content:center;font-style:normal;font-size:28px;background:#fffdf7;box-shadow:0 0 0 2px #e3d3a4,0 4px 10px rgba(60,50,10,.12);overflow:hidden}.sp-cat i img{width:100%;height:100%;object-fit:cover}
  .sp-cat.on i{box-shadow:0 0 0 3px #14402b,0 4px 10px rgba(20,64,43,.3)}.sp-cat.on{color:#14402b;font-weight:700}.sp-cat b{display:block;margin-top:6px;font-weight:inherit;color:#14301f;line-height:1.2}
  .sp-chips{position:sticky;top:70px;z-index:4;display:flex;gap:8px;overflow-x:auto;padding:12px 14px 8px;background:#fbf8f1;scrollbar-width:none}
  .sp-chips button{flex:none;border:1px solid #e3d3a4;background:#fffdf7;border-radius:99px;padding:8px 15px;font:inherit;font-size:13.5px;color:#14402b;cursor:pointer;white-space:nowrap}
  .sp-chips button.on{background:linear-gradient(120deg,#0d3524,#2a6b45);border-color:#0d3524;color:#f4d98a;font-weight:700}
  .sp-meta{padding:4px 18px 0;font:italic 14px Georgia,serif;color:#7a6320}.sp-meta a{color:#14402b;font-weight:700;margin-left:6px;cursor:pointer;text-decoration:underline}
  .sp-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:12px 14px 120px;max-width:760px;margin:0 auto}
  @media(min-width:700px){.sp-grid{grid-template-columns:repeat(3,1fr)}}
  .sp-c{background:#fffdf7;border-radius:22px;overflow:hidden;display:flex;flex-direction:column;cursor:pointer;box-shadow:0 6px 18px rgba(60,50,10,.1)}
  .sp-c .im{position:relative;height:160px;background:radial-gradient(circle at 50% 40%,#fff 0,#f1ead7 100%);display:flex;align-items:center;justify-content:center;font-size:50px}.sp-c .im img{width:100%;height:100%;object-fit:contain;padding:8px;box-sizing:border-box}
  .sp-c .tg{position:absolute;left:10px;top:10px;background:#14402b;color:#f4d98a;font-size:10.5px;font-weight:700;letter-spacing:.3px;padding:4px 10px;border-radius:99px}
  .sp-c .bd{position:absolute;left:0;bottom:10px;background:linear-gradient(120deg,#c99a2e,#e8c466);color:#3b2a00;font-size:11.5px;font-weight:800;padding:4px 10px 4px 9px;border-radius:0 99px 99px 0}
  .sp-c .hr{position:absolute;right:8px;top:8px;border:0;background:rgba(255,253,247,.85);backdrop-filter:blur(4px);border-radius:50%;width:34px;height:34px;font-size:18px;color:#b3392b;cursor:pointer}
  .sp-c .in{padding:10px 12px 12px;display:flex;flex-direction:column;flex:1}.sp-c h4{margin:0;font:600 15px/1.25 Georgia,serif;color:#14301f}.sp-c small{color:#8a7a4a;font-size:12px;margin:3px 0 0}
  .sp-c .pr{margin:6px 0 10px;font-size:14px;color:#14402b}.sp-c .pr b{font-size:17px}.sp-c .pr s{color:#a39a7c;font-size:12px;margin-left:6px}
  .sp-c button.ad{margin-top:auto;padding:10px;border:0;border-radius:99px;background:linear-gradient(120deg,#0d3524,#2a6b45);color:#f4d98a;font:inherit;font-weight:700;font-size:13.5px;cursor:pointer}
  .sp-c button.ad.dn{background:linear-gradient(120deg,#c99a2e,#e8c466);color:#3b2a00}.sp-c button.ad.nt{background:#fff;border:1.5px solid #b58a1f;color:#8a6410}
  .sp-empty{grid-column:1/-1;text-align:center;padding:48px 16px;color:#6b5f35}.sp-empty div{font-size:48px}.sp-empty h3{font-family:Georgia,serif}.sp-empty button{margin:10px 4px 0;padding:11px 20px;border:0;border-radius:99px;background:#14402b;color:#f4d98a;font:inherit;font-weight:700;cursor:pointer}
  .sp-fab{position:fixed;left:0;right:0;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:6;display:flex;justify-content:center;pointer-events:none}
  .sp-fab>div{pointer-events:auto;display:flex;gap:4px;padding:5px;border-radius:99px;background:rgba(13,53,36,.94);box-shadow:0 8px 24px rgba(0,0,0,.3)}
  .sp-fab button{display:flex;align-items:center;gap:7px;padding:11px 18px;border:0;border-radius:99px;background:none;font:inherit;font-size:13.5px;font-weight:600;color:#f4d98a;cursor:pointer}.sp-fab button+button{border-left:1px solid rgba(244,217,138,.3)}
  .sp-sb{position:fixed;inset:0;z-index:100050;background:rgba(10,30,20,.55)}
  .sp-sh{position:fixed;left:0;right:0;bottom:0;z-index:100051;background:#fbf8f1;border-radius:26px 26px 0 0;max-height:80vh;display:flex;flex-direction:column;color:#14301f}
  .sp-sh h3{margin:0;padding:18px 20px 12px;font:italic 600 18px Georgia,serif;color:#14402b}.sp-sh .bd{overflow-y:auto;padding-bottom:12px}
  .sp-sh label{display:flex;align-items:center;gap:12px;padding:14px 20px;font-size:15px;cursor:pointer}.sp-sh input{width:20px;height:20px;accent-color:#14402b}
  .sp-fp{position:fixed;inset:0;z-index:100051;background:#fbf8f1;display:flex;flex-direction:column;color:#14301f}
  .sp-fp .hd{display:flex;justify-content:space-between;align-items:center;padding:18px 18px 14px;font:italic 600 20px Georgia,serif;color:#14402b;background:linear-gradient(180deg,#f1ead7,#fbf8f1)}.sp-fp .hd button{border:0;background:none;color:#8a6410;font:inherit;font-size:12.5px;font-weight:700;letter-spacing:.5px;cursor:pointer}
  .sp-fp .mn{flex:1;display:flex;min-height:0}.sp-fp .lf{width:34%;background:#f1ead7;overflow-y:auto}.sp-fp .lf button{display:block;width:100%;text-align:left;border:0;border-left:4px solid transparent;background:none;padding:16px 12px;font:inherit;font-size:14px;color:#6b5f35;cursor:pointer}.sp-fp .lf button.on{background:#fbf8f1;border-left-color:#c99a2e;color:#14301f;font-weight:700}
  .sp-fp .rt{flex:1;overflow-y:auto}.sp-fp .rt label{display:flex;align-items:center;gap:12px;padding:15px 16px;font-size:15px;border-bottom:1px solid #efe7cf;cursor:pointer}.sp-fp .rt input{width:20px;height:20px;accent-color:#14402b}
  .sp-fp .ft{display:flex;gap:10px;padding:12px 14px calc(12px + env(safe-area-inset-bottom,0px))}.sp-fp .ft button{flex:1;padding:14px;border:1.5px solid #14402b;border-radius:99px;background:#fff;font:inherit;font-weight:700;letter-spacing:.5px;color:#14402b;cursor:pointer}.sp-fp .ft .ap{background:linear-gradient(120deg,#0d3524,#2a6b45);color:#f4d98a}`;
  document.head.appendChild(css);

  let ov = null, mute = 0, st, ph = null;
  const fresh = q => ({ q: q || "", sort: "", cats: new Set(), pr: new Set(), disc: 0, stock: false, fav: false });
  const AO = () => window.aashapuraAddr && window.aashapuraAddr.ov;
  const push = (el, fn) => { const A = AO(); if (A) { try { A.push(el, fn); } catch (e) {} } };
  const pop = el => { const A = AO(); if (A) { try { A.close(el); return; } catch (e) {} } el.remove(); };

  /* ---------- matching ---------- */
  function matches(q) {
    const t = low(q).trim(), all = P(); if (!t) return all.slice();
    const toks = t.split(/\s+/), seen = new Set(), out = [], C = window.aashapuraConcern;
    const add = p => { if (p && !seen.has(p.id)) { seen.add(p.id); out.push(p); } };
    const hay = p => low(p.name + " " + p.desc + " " + p.category + " " + p.weight);
    all.filter(p => low(p.name).includes(t)).forEach(add);
    all.filter(p => toks.every(k => hay(p).includes(k))).forEach(add);
    try { if (C) { all.filter(p => C.hit(p, t)).forEach(add); (C.search(t) || []).forEach(add); } } catch (e) {}
    return out;
  }
  function baseList() {
    if (ph && ph.terms.length) { const sc = {}, by = {}; ph.terms.forEach(t => matches(t).forEach(p => { sc[p.id] = (sc[p.id] || 0) + 1; by[p.id] = p; })); return Object.values(by).sort((a, b) => sc[b.id] - sc[a.id]); }
    if (ph) return [];
    return matches(st.q);
  }
  const filtered = list => list.filter(p => {
    if (st.cats.size && !st.cats.has(low(p.category).trim())) return false;
    if (st.pr.size && ![...st.pr].some(k => { const r = PR.find(x => x.k === k); return p.price >= r.a && p.price <= r.b; })) return false;
    if (st.disc && off(p) < st.disc) return false;
    if (st.stock && !(p.stock > 0)) return false;
    if (st.fav && !(window.aashapuraWish && window.aashapuraWish.has(p.id))) return false;
    return true;
  });
  function groups(list) {
    const m = new Map();
    list.forEach(p => { const k = low(p.name).trim().replace(/\s+/g, " "); const g = m.get(k); if (!g) m.set(k, { p, n: 1, min: p.price }); else { g.n++; g.min = Math.min(g.min, p.price); } });
    const out = [...m.values()];
    if (st.sort === "low") out.sort((a, b) => a.min - b.min); else if (st.sort === "high") out.sort((a, b) => b.min - a.min); else if (st.sort === "disc") out.sort((a, b) => off(b.p) - off(a.p));
    return out;
  }

  /* ---------- drawing ---------- */
  function cardHTML(g) {
    const p = g.p, out = p.stock <= 0, inCart = (Number(CT()[p.id]) || 0) > 0, liked = window.aashapuraWish && window.aashapuraWish.has(p.id), im = imgOf(p), d = off(p);
    return `<div class="sp-c" data-open="${p.id}"><div class="im">${im ? `<img src="${esc(im)}" alt="" loading="lazy">` : esc(p.emoji || "🌿")}${g.n === 1 && d ? `<span class="bd">${d}% OFF</span>` : ""}${inCart ? `<span class="tg">${L("In your cart", "कार्ट में है")}</span>` : ""}<button type="button" class="hr" data-wish="${p.id}" aria-label="Wishlist">${liked ? "❤" : "♡"}</button></div>
    <div class="in"><h4>${esc(p.name)}</h4><small>${esc(p.weight || "")}</small><div class="pr"><b>₹${g.n > 1 ? g.min : p.price}</b>${g.n === 1 && d ? `<s>₹${p.mrp}</s>` : g.n > 1 ? " " + L("onwards", "से") : ""}</div>
    ${g.n > 1 ? `<button type="button" class="ad" data-pick="${p.id}">${L("Select size", "साइज़ चुनें")} →</button>` : out ? `<button type="button" class="ad nt" data-nt="${p.id}">🔔 ${L("Notify me", "बताएँ")}</button>` : `<button type="button" class="ad${inCart ? " dn" : ""}" data-add="${p.id}">${inCart ? "✓ " + L("Added", "जुड़ गया") : "+ " + L("Add", "जोड़ें")}</button>`}</div></div>`;
  }
  function paint() {
    if (!ov) return;
    const q = ov.querySelector(".sp-box input"), base = baseList(), list = filtered(base), gr = groups(list), C = window.aashapuraConcern;
    /* suggestions when nothing typed */
    const sg = ov.querySelector(".sp-sg"), rc = recents();
    sg.hidden = !!(st.q || ph);
    if (!sg.hidden) sg.innerHTML = (rc.length ? `<h5>${L("Recent searches", "हाल की खोज")}</h5><div>${rc.map(x => `<button type="button" data-q="${esc(x)}">🕘 ${esc(x)}</button>`).join("")}</div>` : "") + (C ? `<h5>${L("Shop by concern", "बीमारी के हिसाब से")}</h5><div>${C.list.slice(0, 8).map(c => `<button type="button" data-q="${esc(c.en.split(/[ &/]/)[0])}">${c.e} ${esc(L(c.en, c.hi))}</button>`).join("")}</div>` : "");
    /* photo banner */
    const pb = ov.querySelector(".sp-ph"); pb.hidden = !ph;
    if (ph) pb.innerHTML = `<img src="${ph.url}" alt=""><div class="t">${ph.busy ? "⏳ " + L("Looking at your photo…", "फोटो देख रहा हूँ…") : ph.err ? "⚠️ " + esc(ph.err) : "📷 " + L("Photo search", "फोटो से खोज") + ": " + ph.terms.map(t => `<span data-q="${esc(t)}">${esc(t)}</span>`).join("")}</div><button type="button" data-xp aria-label="Close">✕</button>`;
    /* category cards */
    const cm = new Map(); base.forEach(p => { const c = low(p.category).trim() || "other"; const x = cm.get(c) || { n: 0, im: "", e: p.emoji }; x.n++; x.im = x.im || imgOf(p); cm.set(c, x); });
    ov.querySelector(".sp-cats").innerHTML = cm.size > 1 && !(ph && ph.busy) ? [...cm].map(([c, x]) => `<div class="sp-cat${st.cats.has(c) ? " on" : ""}" data-cat="${esc(c)}"><i>${x.im ? `<img src="${esc(x.im)}" alt="">` : esc(x.e || "🌿")}</i><b>${esc(catName(c))}</b>${x.n}</div>`).join("") : "";
    /* chips */
    const ch = [["sort", "⇅ " + L("Sort", "सॉर्ट"), !!st.sort], ["filter", "☰ " + L("Filter", "फ़िल्टर"), !!st.disc], ["cat", L("Categories", "कैटेगरी") + " ▾", st.cats.size > 0]]
      .concat(PR.map(r => ["p" + r.k, r.t, st.pr.has(r.k)]), [["stock", L("In stock", "स्टॉक में"), st.stock], ["fav", "❤ " + L("Favourites", "पसंदीदा"), st.fav]]);
    const sc = ov.querySelector(".sp-chips").scrollLeft; ov.querySelector(".sp-chips").innerHTML = ch.map(([k, t, on]) => `<button type="button" data-c="${k}" class="${on ? "on" : ""}">${t}</button>`).join(""); ov.querySelector(".sp-chips").scrollLeft = sc;
    /* meta + grid */
    const dm = !ph && st.q && C && C.didYouMean ? (() => { try { return C.didYouMean(st.q); } catch (e) { return ""; } })() : "";
    ov.querySelector(".sp-meta").innerHTML = ph && ph.busy ? "" : `${gr.length} ${L(gr.length === 1 ? "product" : "products", "प्रोडक्ट")}${dm && dm !== low(st.q) ? ` · ${L("Did you mean", "क्या आप ये खोज रहे थे")} <a data-q="${esc(dm)}">${esc(dm)}</a>` : ""}`;
    const on = st.cats.size || st.pr.size || st.disc || st.stock || st.fav;
    ov.querySelector(".sp-grid").innerHTML = ph && ph.busy ? "" : gr.length ? gr.map(cardHTML).join("") : `<div class="sp-empty"><div>🌿</div><h3>${L("No product found", "कोई प्रोडक्ट नहीं मिला")}</h3><p>${L("Try another word, or search with a photo.", "दूसरा शब्द लिखें या फोटो से खोजें।")}</p>${on ? `<button type="button" data-clr>${L("Clear filters", "फ़िल्टर हटाएँ")}</button>` : ""}</div>`;
    if (document.activeElement !== q && q.value !== st.q) q.value = st.q;
  }
  function refreshCard(id) {
    const el = ov && ov.querySelector(`.sp-c[data-open="${id}"]`); if (!el || el.querySelector("[data-pick]")) return;
    const p = P().find(x => String(x.id) === String(id)); if (!p) return;
    const t = document.createElement("div"); t.innerHTML = cardHTML({ p, n: 1, min: p.price }); el.replaceWith(t.firstChild);
  }

  /* ---------- sheets ---------- */
  function sheet(title, body, onPick) {
    const bk = document.createElement("div"); bk.className = "sp-sb"; const sh = document.createElement("div"); sh.className = "sp-sh";
    sh.innerHTML = `<h3>${title}</h3><div class="bd">${body}</div>`; document.body.append(bk, sh);
    const shut = () => { bk.remove(); sh.remove(); }; bk.onclick = () => pop(bk);
    push(bk, () => { bk.remove(); sh.remove(); }); sh.addEventListener("change", e => { onPick(e.target.value); pop(bk); });
  }
  function filterPanel(tab) {
    const d = { cats: new Set(st.cats), pr: new Set(st.pr), disc: st.disc, stock: st.stock }; let cur = tab || "cat";
    const cats = [...new Set(matches(ph ? "" : st.q).map(p => low(p.category).trim()).filter(Boolean))];
    const el = document.createElement("div"); el.className = "sp-fp";
    el.innerHTML = `<div class="hd"><span>${L("Filters", "फ़िल्टर")}</span><button type="button" data-clr>${L("CLEAR ALL", "सब हटाएँ")}</button></div><div class="mn"><div class="lf"></div><div class="rt"></div></div><div class="ft"><button type="button" data-x>${L("CLOSE", "बंद")}</button><button type="button" class="ap" data-ap>${L("APPLY", "लागू करें")}</button></div>`;
    document.body.appendChild(el); push(el, () => el.remove());
    const TABS = [["cat", L("Categories", "कैटेगरी")], ["pr", L("Price Range", "कीमत")], ["disc", L("Discount", "छूट")], ["stock", L("Availability", "उपलब्धता")]];
    const draw = () => {
      el.querySelector(".lf").innerHTML = TABS.map(([k, t]) => `<button type="button" data-t="${k}" class="${k === cur ? "on" : ""}">${t}</button>`).join("");
      const row = (type, val, txt, on) => `<label><input type="${type}" name="${cur}" data-v="${esc(val)}" ${on ? "checked" : ""}>${esc(txt)}</label>`;
      el.querySelector(".rt").innerHTML = cur === "cat" ? cats.map(c => row("checkbox", c, catName(c), d.cats.has(c))).join("") : cur === "pr" ? PR.map(r => row("checkbox", r.k, r.t, d.pr.has(r.k))).join("") : cur === "disc" ? DISC.map(([v, t]) => row("radio", v, t, d.disc === v)).join("") : row("checkbox", "s", L("In stock only", "सिर्फ़ स्टॉक में"), d.stock);
    };
    el.onclick = e => {
      const t = e.target.closest("[data-t]"); if (t) { cur = t.dataset.t; draw(); return; }
      if (e.target.closest("[data-x]")) { pop(el); return; }
      if (e.target.closest("[data-clr]")) { d.cats.clear(); d.pr.clear(); d.disc = 0; d.stock = false; draw(); return; }
      if (e.target.closest("[data-ap]")) { st.cats = d.cats; st.pr = d.pr; st.disc = d.disc; st.stock = d.stock; pop(el); paint(); return; }
      const i = e.target.closest("input[data-v]"); if (!i) return; const v = i.dataset.v;
      if (cur === "cat") d.cats[i.checked ? "add" : "delete"](v); else if (cur === "pr") d.pr[i.checked ? "add" : "delete"](v); else if (cur === "disc") d.disc = Number(v); else d.stock = i.checked;
    };
    draw();
  }

  /* ---------- photo search ---------- */
  function shrink(file) {
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(file), im = new Image();
      im.onload = () => { const k = Math.min(1, 800 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); const d = c.toDataURL("image/jpeg", .8); URL.revokeObjectURL(u); res({ mime: "image/jpeg", data: d.split(",")[1], url: d }); };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("img")); }; im.src = u;
    });
  }
  async function photoSearch(file) {
    let img; try { img = await shrink(file); } catch (e) { toast(L("Could not read the photo", "फोटो नहीं खुली"), "error"); return; }
    st = fresh(""); ph = { url: img.url, terms: [], busy: true, err: "" }; paint();
    const ask = "Look at this photo (an Ayurvedic herb, powder, medicine, bottle, plant, or a skin/hair/body problem). Reply with ONLY 3 to 6 short search keywords separated by commas, no sentences. Include common English and Hindi/Hinglish names, e.g. tulsi, holy basil, giloy.";
    try {
      let key = ""; try { key = SUPABASE_KEY; } catch (e) {}
      const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 60000);
      let r; try { r = await fetch(AI, { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json", apikey: key, Authorization: "Bearer " + key }, body: JSON.stringify({ messages: [{ role: "user", content: ask }], products: [], kb: [], lang: "en", image: { mime: img.mime, data: img.data } }) }); } finally { clearTimeout(tm); }
      const j = await r.json().catch(() => null), txt = String((j && j.reply) || "");
      const terms = txt.replace(/[*_`#>]/g, "").split("\n").find(x => x.trim()) || "";
      ph.terms = terms.split(/[,;|]/).map(x => x.replace(/^[\s\-•\d.)]+/, "").replace(/[.\s]+$/, "").trim()).filter(x => x && x.length <= 28 && x.split(" ").length <= 3).slice(0, 6);
      if (!ph.terms.length) ph.err = L("Could not recognise the photo. Type the name instead.", "फोटो पहचान नहीं पाया। नाम लिखकर खोजें।");
    } catch (e) { ph.err = L("Photo search needs internet / AI. Please try again.", "फोटो खोज के लिए इंटरनेट/AI चाहिए। दोबारा कोशिश करें।"); }
    if (ph) { ph.busy = false; paint(); }
  }

  /* ---------- open / close ---------- */
  function shut() { if (!ov) return; const e = ov; ov = null; mute = Date.now() + 700; pop(e); try { document.activeElement && document.activeElement.blur(); } catch (er) {} }
  function open(q) {
    if (ov) return; st = fresh(q); ph = null;
    const el = document.createElement("div"); el.className = "sp-ov"; el.setAttribute("role", "dialog");
    el.innerHTML = `<div class="sp-top"><button type="button" class="bk" aria-label="Back">←</button><div class="sp-box"><input type="search" enterkeyhint="search" autocomplete="off" placeholder="${L("Search Products", "प्रोडक्ट खोजें")}" aria-label="Search"><button type="button" data-xq aria-label="Clear">✕</button></div></div>
    <div class="sp-sg"></div><div class="sp-ph" hidden></div><div class="sp-cats"></div><div class="sp-chips"></div><div class="sp-meta"></div><div class="sp-grid"></div>
    <div class="sp-fab"><div><button type="button" data-g>🖼 ${L("Image Search", "इमेज सर्च")}</button><button type="button" data-cm>📷 ${L("Camera Search", "कैमरा सर्च")}</button></div></div>
    <input type="file" accept="image/*" hidden data-fg><input type="file" accept="image/*" capture="environment" hidden data-fc>`;
    document.body.appendChild(el); ov = el; push(el, () => { if (ov === el) { ov = null; mute = Date.now() + 700; } el.remove(); });
    const inp = el.querySelector(".sp-box input"); inp.value = st.q; paint();
    let tm; inp.addEventListener("input", () => { st.q = inp.value; if (ph) ph = null; clearTimeout(tm); tm = setTimeout(paint, 120); });
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { saveRecent(inp.value); inp.blur(); } });
    el.querySelector(".bk").onclick = shut;
    ["fg", "fc"].forEach(k => el.querySelector(`[data-${k}]`).onchange = e => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) { inp.value = ""; photoSearch(f); } });
    el.addEventListener("click", e => {
      const T = s => e.target.closest(s);
      if (T("[data-xq]")) { inp.value = ""; st.q = ""; ph = null; paint(); inp.focus(); return; }
      if (T("[data-g]")) { el.querySelector("[data-fg]").click(); return; }
      if (T("[data-cm]")) { el.querySelector("[data-fc]").click(); return; }
      if (T("[data-xp]")) { ph = null; paint(); return; }
      if (T("[data-clr]")) { st = Object.assign(fresh(st.q), { sort: st.sort }); paint(); return; }
      const qb = T("[data-q]"); if (qb) { ph = null; st.q = inp.value = qb.dataset.q; saveRecent(st.q); paint(); el.scrollTop = 0; return; }
      const cb = T("[data-cat]"); if (cb) { const c = cb.dataset.cat; st.cats.has(c) ? st.cats.delete(c) : st.cats.add(c); paint(); return; }
      const c = T("[data-c]"); if (c) {
        const k = c.dataset.c;
        if (k === "sort") sheet(L("Sort by", "सॉर्ट करें"), SORTS.map(([v, t]) => `<label><input type="radio" name="s" value="${v}" ${v === st.sort ? "checked" : ""}>${esc(t)}</label>`).join(""), v => { st.sort = v; paint(); });
        else if (k === "filter") filterPanel("disc"); else if (k === "cat") filterPanel("cat");
        else if (k === "stock") { st.stock = !st.stock; paint(); } else if (k === "fav") { st.fav = !st.fav; paint(); }
        else { const id = k.slice(1); st.pr.has(id) ? st.pr.delete(id) : st.pr.add(id); paint(); }
        return;
      }
      const h = T("[data-wish]"); if (h) { e.stopPropagation(); const W = window.aashapuraWish; if (W) { const on = W.toggle(Number(h.dataset.wish)); h.textContent = on ? "❤" : "♡"; toast(on ? L("Added to wishlist ❤", "पसंदीदा में जोड़ा ❤") : L("Removed from wishlist", "पसंदीदा से हटाया"), on ? "success" : "info"); if (st.fav) paint(); } return; }
      if (T("[data-add]")) { const id = T("[data-add]").dataset.add; saveRecent(st.q); setTimeout(() => refreshCard(id), 80); return; }   // cart + toast come from the global handler
      const nt = T("[data-nt]"); if (nt) { const p = P().find(x => String(x.id) === nt.dataset.nt); if (p && window.aashapuraNotify) window.aashapuraNotify.open(p); return; }
      const cd = T("[data-open]"); if (cd && window.showProduct) { saveRecent(st.q); window.showProduct(Number(cd.dataset.open)); }
    });
    setTimeout(() => { try { inp.focus(); } catch (e) {} }, 60);
  }
  window.aashapuraSearch = { open, close: shut };

  /* tapping the search boxes (home + shop section) opens the page */
  ["focus", "click"].forEach(ev => document.addEventListener(ev, e => {
    const t = e.target; if (!t || (t.id !== "homeSearch" && t.id !== "searchInput")) return;
    if (document.body.classList.contains("adm-mode")) return;
    e.stopImmediatePropagation(); if (ov || Date.now() < mute) { try { t.blur(); } catch (er) {} return; }
    try { t.blur(); } catch (er) {} open(t.value || "");
  }, true));
})();
