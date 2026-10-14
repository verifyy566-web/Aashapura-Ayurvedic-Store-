/* Ayurveda AI - chat + voice (bolna/sunna). Works NOW with built-in herb knowledge + your store products.
   Real AI mode: put Supabase Edge Function URL in ENDPOINT below (see AYURVEDA-AI-SETUP.txt). Empty = local mode. */
(function () {
  const ENDPOINT = "https://rvygarzpdacnhxwxsgxo.supabase.co/functions/v1/bright-api"; /* Gemini AI (Supabase Edge Function). Khali "" = sirf free local mode */
  const DISC = "Ayurveda is AI and can make mistakes.\nयह डॉक्टर की सलाह नहीं है।";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KB = () => window.AYU_KB || [];
  const RED = /chest pain|seene me dard|सीने|सांस फूल|saans phool|behosh|बेहोश|खून की उल्टी|emergency|suicide|आत्महत्या|zeher|ज़हर|overdose/i;
  const CARE = /pregnan|garbh|गर्भ|bacha|bachcha|baby|child|बच्च|cancer|कैंसर|diabet|sugar|शुगर|thyroid|थायराइड|kidney|किडनी|liver|लिवर|blood thinner|dawai|दवा|medicine/i;
  let msgs = [], speakOn = false, rec = null;

  function pick(q) {
    const ql = q.toLowerCase(), hits = [];
    KB().forEach(e => { const m = e.k.filter(w => ql.includes(w)).sort((x, y) => y.length - x.length)[0]; if (m) hits.push({ e, s: m.length }); });
    return hits.sort((x, y) => y.s - x.s).slice(0, 2).map(x => x.e);
  }

  /* ===== v54c: 500 rogon ka PDF manual (ayudb.js) - rog ke aam bol-chal naam, dawai ka upyog, matra ===== */
  const cmp = s => String(s || "").toLowerCase().replace(/[^a-z]/g, "");
  const RASA = /bhasma|\bras\b|rasa\b|parpati|makshik|suvarna|swarna|abhrak|lauha|mandur|vasant|kupi|sindoor|gunja|hingul|naga|vanga/i;
  function keyHit(ql, k) {
    if (/^[\u0900-\u097f ]+$/.test(k) && k.length < 3) return false;
    if (/^[a-z0-9' \-]+$/.test(k) && k.length <= 4) return new RegExp("(^|[^a-z])" + k.replace(/[-']/g, "\\$&") + "([^a-z]|$)").test(ql);
    return ql.includes(k);
  }
  function dbPick(q) {
    const db = window.AYU_DB; if (!db) return [];
    const ql = q.toLowerCase(), hits = [];
    db.d.forEach(r => { let b = 0; for (const k of r.k) { if (k.length > b && keyHit(ql, k)) b = k.length; } if (b) hits.push({ r, s: b }); });
    return hits.sort((x, y) => y.s - x.s).slice(0, 2).map(x => x.r);
  }
  function medPick(q) {
    const db = window.AYU_DB; if (!db) return null;
    const ql = q.toLowerCase(), qc = cmp(q); let key = null, bl = 0;
    for (const h in db.h) { if (ql.includes(h) && h.length > bl) { key = db.h[h]; bl = h.length; } }
    if (!key) { for (const k in db.m) { if (k.length >= 5 && qc.includes(k) && k.length > bl) { key = k; bl = k.length; } } }
    if (!key || !db.m[key]) return null;
    let vars = Object.keys(db.m[key].v); const nar = vars.filter(n => cmp(n) !== key && qc.includes(cmp(n))); if (nar.length) vars = nar;
    const ids = [], doses = {};
    vars.forEach(n => db.m[key].v[n].forEach(([i, d]) => { if (!ids.includes(i)) ids.push(i); if (d) doses[n] = d; }));
    const names = ids.map(i => (db.d.find(r => r.i === i) || {}).e).filter(Boolean);
    return { name: vars.length === 1 ? vars[0] : db.m[key].n.split(" ")[0], vars, ids, names, doses };
  }
  function dbText(r) {
    const db = window.AYU_DB, ms = r.m.map(x => x[0] + (x[1] ? " (" + x[1] + ")" : ""));
    let o = `🩺 ${r.e}${r.s ? " (" + r.s + ")" : ""}\n`;
    if (r.y) o += `• लक्षण: ${r.y}\n`;
    if (ms.length) o += `• आयुर्वेदिक दवाएं (मैनुअल के अनुसार): ${ms.join(", ")}\n• सामान्य मात्रा: ${db.g}; ऊपर कोष्ठक में मात्रा हो तो वही देखें\n`;
    if (r.h) o += `• घरेलू उपाय: ${r.h}\n`;
    if (r.p) o += `• पथ्य/सलाह: ${r.p}\n`;
    if (r.m.some(x => RASA.test(x[0]))) o += "• भस्म/रस/लौह/मंडूर वाली दवाएं सिर्फ वैद्य की देखरेख में लें।\n";
    if (r.z) o += "⚠️ इस रोग में डॉक्टर से जांच और इलाज ज़रूरी है; सिर्फ घरेलू/आयुर्वेदिक उपाय के भरोसे न रहें।\n";
    return o + "\n";
  }
  function medText(m) {
    const db = window.AYU_DB, show = m.names.slice(0, 12);
    let o = `💊 ${m.name} - किन रोगों में उपयोग होती है (मैनुअल के अनुसार)\n• ${show.join("\n• ")}${m.names.length > 12 ? "\n• ... और " + (m.names.length - 12) + " रोग" : ""}\n`;
    const ds = Object.entries(m.doses).slice(0, 4).map(([n, d]) => n + ": " + d);
    o += `• मात्रा: ${ds.length ? ds.join("; ") + " (मैनुअल)" : db.g}\n• इसे डॉक्टर/वैद्य की सलाह और लेबल के अनुसार ही लें; बच्चों, गर्भावस्था और चल रही दवा में खुद से न दें।\n`;
    if (m.vars.some(n => RASA.test(n))) o += "• यह रस/भस्म/लौह वर्ग की दवा है, सिर्फ वैद्य की देखरेख में।\n";
    return o + "\n";
  }
  function kbFor(q) {
    const ds = dbPick(q).map(r => ({ e: r.e, s: r.s, d: r.d, y: r.y, m: r.m.map(x => x[0] + (x[1] ? " (" + x[1] + ")" : "")), h: r.h, p: r.p, z: r.z })), m = medPick(q);
    return ds.concat(m ? [{ medicine: m.name, used_in: m.names.slice(0, 20), doses: m.doses, rasa_vaidya_only: m.vars.some(n => RASA.test(n)) }] : []);
  }
  function prods(q, herbs) {
    let list = [];
    try { list = products || []; } catch (e) { }
    const toks = q.toLowerCase().split(/[^a-z0-9\u0900-\u097f]+/).filter(t => t.length >= 3);
    const rk = herbs.flatMap(h => h.k.filter(w => /^[a-z]+$/.test(w)));
    return list.map(p => {
      const hay = [p.name, p.category, p.description, p.ay_benefits, p.ay_ingredients, p.ay_usage].join(" ").toLowerCase();
      let s = toks.filter(t => hay.includes(t)).length;
      rk.forEach(w => { if (hay.includes(w)) s += 2; });
      return { p, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.p);
  }
  const BUSY = { quota: "AI की मुफ़्त सीमा अभी पूरी हो गई है, इसलिए अभी इस सवाल का पूरा जवाब नहीं दे पा रहा। कृपया 1-2 मिनट बाद (या कल) फिर पूछें, या Help Desk से हमारी टीम से पूछें।", fail: "AI से अभी जुड़ नहीं पा रहा। इंटरनेट देखकर थोड़ी देर बाद फिर कोशिश करें।" };
  const busyMsg = err => BUSY[err] || BUSY.fail;
  function local(q, err) {
    if (RED.test(q)) return "⚠️ यह गंभीर हो सकता है। आयुर्वेदिक उपाय का इंतज़ार न करें, तुरंत डॉक्टर या इमरजेंसी (112) से संपर्क करें।";
    const herbs = pick(q), ps = prods(q, herbs);
    let out = "";
    herbs.forEach(h => { out += `🌿 ${h.n}\n• जानकारी: ${h.b}\n• कैसे लें: ${h.u}\n` + (h.x && h.x.m ? `• दवा और मात्रा (वयस्क): ${h.x.m}\n` : "") + (h.x && h.x.a ? `• परहेज़/पथ्य: ${h.x.a}\n` : "") + (h.x && h.x.d ? `• डॉक्टर के पास कब जाएं: ${h.x.d}\n` : "") + `• सावधानी: ${h.p}\n` + (h.x && h.x.m ? "• मात्रा लेबल/वैद्य की सलाह के अनुसार ही लें; बच्चों और गर्भावस्था में खुद से न दें।\n" : "") + "\n"; });
    const dbs = dbPick(q), med = medPick(q);
    dbs.slice(0, herbs.length ? 1 : 2).forEach(r => { out += dbText(r); });
    if (med) out += medText(med);
    ps.forEach(p => {
      const f = (v, n) => String(v).split("\n").slice(0, n).join(", ");
      const bits = [p.ay_benefits && "फ़ायदे: " + f(p.ay_benefits, 3), p.ay_usage && "उपयोग: " + f(p.ay_usage, 2), p.ay_dose && "मात्रा: " + f(p.ay_dose, 1), p.ay_precautions && "सावधानी: " + f(p.ay_precautions, 2)].filter(Boolean);
      out += `🛍️ हमारे स्टोर में: ${p.name}${p.price ? " (₹" + p.price + ")" : ""}\n${bits.join("\n")}\n\n`;
    });
    if (!out) return err ? busyMsg(err) : "इस सवाल का पक्का जवाब मेरे पास अभी नहीं है। कृपया अपना सवाल थोड़ा अलग तरह से लिखें (जैसे \"बाल झड़ना\", \"अश्वगंधा के फ़ायदे\"), या Help Desk से हमारी टीम से पूछें। मैं अंदाज़े से गलत जानकारी नहीं देना चाहता।";
    if (CARE.test(q)) out += "⚠️ गर्भावस्था, बच्चों, लंबी बीमारी या चल रही दवा में पहले अपने डॉक्टर/वैद्य से ज़रूर पूछें।\n";
    if (err) out += "\nℹ️ AI अभी व्यस्त है, इसलिए यह हमारी बनी-बनाई जानकारी से जवाब है।";
    return out.trim();
  }
  /* Gemini ke jawab se markdown (**, *, #) hata do: screen par bhi saaf dikhe aur awaaz "tarankan" na bole */
  const clean = t => String(t || "").replace(/\*\*|__|`/g, "").replace(/^\s*#{1,6}\s*/gm, "").replace(/^\s*[*\-]\s+/gm, "\u2022 ").replace(/\*/g, "").replace(/\n{3,}/g, "\n\n").trim();
  /* Jawab ki bhasha: Devanagari = "hi" (Hindi), Roman Hindi = "hing" (Hinglish), saaf English = "en". Sawal ki bhasha wahi jawab ki bhasha. */
  function detectLang(q) {
    q = String(q || "");
    if (/\b(in|reply in|answer in|speak in)\s+english\b|\benglish\s+(me|mein|main|mai)\b/i.test(q)) return "en";
    if (/\bhinglish\b/i.test(q)) return "hing";
    if (/\b(in|reply in|answer in)\s+hindi\b|\bhindi\s+(me|mein|main|mai)\b/i.test(q)) return "hi";
    if (/[\u0900-\u097F]/.test(q)) return "hi";
    const w = q.toLowerCase().match(/[a-z']+/g) || [];
    const en = w.filter(x => /^(the|is|are|what|how|why|can|could|should|does|do|i|my|me|for|of|to|and|with|in|on|at|have|has|good|best|help|tell|about|which|when|a|an|it|this|that|you|please|benefits|use|take|cure|treatment|remedy|remedies|sleep|pain|cold|cough|fever|skin|hair|weight|digestion|stress)$/.test(x)).length;
    const hi = w.filter(x => /^(ka|ki|ke|ko|me|mein|hai|hain|kya|kaise|kyun|nahi|nahin|ilaaj|upay|dawai|bimari|aur|se|par|ho|hoga|karo|batao|bataiye|mujhe|mera|meri|liye|wala|wali|kaun|kab|kitna|kitni|lun|lu|lena|lein|chahiye|rahta|rehta|aati|aata)$/.test(x)).length;
    return en >= 2 && en > hi ? "en" : "hing";
  }
  const SP = {}; /* Hinglish jawab -> usi ka Devanagari rup, sirf bolne ke liye (Hindi voice ke liye) */
  async function answer(q, img) {
    let err = "", dbg = "";
    if (ENDPOINT) {
      try {
        const herbs = pick(q), ps = prods(q, herbs).map(p => ({ name: p.name, price: p.price, benefits: p.ay_benefits, usage: p.ay_usage, dose: p.ay_dose, precautions: p.ay_precautions, ingredients: p.ay_ingredients }));
        let key = ""; try { key = SUPABASE_KEY; } catch (e) { }
        const body = { messages: msgs.slice(-12).map(m => ({ role: m.r, content: m.t })), products: ps, kb: kbFor(q), lang: detectLang(q) };
        if (img) body.image = { mime: img.mime, data: img.data };
        const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", apikey: key, Authorization: "Bearer " + key }, body: JSON.stringify(body) });
        const rawT = await r.text(); let j = null;
        try { j = JSON.parse(rawT); } catch (e) { dbg = "HTTP " + r.status + " " + rawT.slice(0, 100); }
        if (j && j.reply) { const c = clean(j.reply); if (j.speech) SP[c] = clean(j.speech); return c; }
        err = (j && j.error) || "fail";
        if (j && !dbg) dbg = j.detail || j.message || (r.ok ? "" : "HTTP " + r.status);
      } catch (e) { err = "fail"; dbg = "net: " + String(e && e.message || e).slice(0, 80); }
    }
    if (img) return "📷 फोटो समझने के लिए AI चाहिए। " + busyMsg(err || "fail") + (dbg && err !== "quota" ? "\n\n(तकनीकी कारण: " + String(dbg).slice(0, 300) + ")" : "");
    return local(q, err);
  }
  /* Photo chhoti karo (max 1024px JPEG) taaki upload tez ho aur AI quota kam lage */
  function shrink(file) {
    return new Promise((res, rej) => {
      const u = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1024 / Math.max(im.naturalWidth, im.naturalHeight)), w = Math.round(im.naturalWidth * k), h = Math.round(im.naturalHeight * k);
        const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(im, 0, 0, w, h);
        const d = c.toDataURL("image/jpeg", .82); URL.revokeObjectURL(u); res({ mime: "image/jpeg", data: d.split(",")[1], url: d });
      };
      im.onerror = () => { URL.revokeObjectURL(u); rej(new Error("img")); };
      im.src = u;
    });
  }
  let voices = [];
  const loadV = () => { voices = (window.speechSynthesis && speechSynthesis.getVoices()) || []; };
  if (window.speechSynthesis) { loadV(); speechSynthesis.onvoiceschanged = loadV; }
  /* v56: sirf Indian awaaz. English -> en-IN, Hindi/Hinglish -> hi-IN. US/UK awaaz kabhi nahi (milti na ho to samjhakar chup rehta hai). */
  const IND = (v, l) => new RegExp("^" + l + "[-_]?IN", "i").test(v.lang) || (l === "hi" && /hindi|हिन्दी|हिंदी/i.test(v.name)) || (l === "en" && /india|indian/i.test(v.name));
  function bestVoice(en) {
    const l = en ? "en" : "hi", pool = voices.filter(v => IND(v, l));
    return pool.find(v => /google/i.test(v.name)) || pool.find(v => /female|lekha|kalpana|swara|neerja|heera|veena|rishi/i.test(v.name)) || pool[0] || null;
  }
  let warned = false;
  function speak(t) {
    t = SP[t] || t;
    if (!window.speechSynthesis) return alert("इस फ़ोन में बोलने की सुविधा नहीं है।");
    speechSynthesis.cancel(); loadV();
    const en = !/[\u0900-\u097F]/.test(String(t)); const v = bestVoice(en);
    if (!v && voices.length) {
      if (!warned) { warned = true; alert(en ? "आपके फ़ोन में भारतीय English आवाज़ नहीं मिली। Settings → Language → Text-to-speech → Google → Voice data → English (India) डाउनलोड करें। तब तक आवाज़ बंद रहेगी।" : "आपके फ़ोन में हिन्दी आवाज़ नहीं मिली। Settings → Language → Text-to-speech → Google → Voice data → Hindi (भारत) डाउनलोड करें। तब तक आवाज़ बंद रहेगी।"); }
      return;
    }
    const clean = String(t).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF•]/gu, " ").replace(/\n+/g, "। ");
    (clean.match(/[^।.!?]+[।.!?]?/g) || []).filter(x => x.trim()).forEach(part => {
      const u = new SpeechSynthesisUtterance(part.trim()); u.lang = en ? "en-IN" : "hi-IN"; u.rate = .92; u.pitch = 1; if (v) u.voice = v; speechSynthesis.speak(u);
    });
  }
  const css = `.aai-fab{position:fixed;left:14px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9000;display:flex;align-items:center;gap:6px;padding:12px 16px;border:1.5px solid #d9b36a;border-radius:99px;background:linear-gradient(135deg,#1e6245,#123c2b);color:#f3e2b3;font:600 14px 'DM Sans',sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.28);cursor:pointer}
body:has(.m-bnav) .aai-fab{bottom:calc(84px + env(safe-area-inset-bottom,0px))}
body:has(#cartFullPage) .aai-fab,body:has(#productFullPage) .aai-fab,body:has(.aa-page) .aai-fab,body:has(.aa-ov) .aai-fab,body:has(#profilePage:not([hidden])) .aai-fab,body:has(#myOrdersPage:not([hidden])) .aai-fab,body:has(#siPage) .aai-fab,body.adm-mode .aai-fab{display:none}
.aai-pg{position:fixed;inset:0;z-index:9600;background:#fbf7ec;display:flex;flex-direction:column;font-family:'DM Sans',sans-serif}
.aai-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(90deg,#123c2b,#1e6245);color:#f3e2b3;border-bottom:2px solid #d9b36a}
.aai-hd b{flex:1;font:700 20px 'Cormorant Garamond',Georgia,serif}.aai-hd button{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:8px 11px;font-size:16px}
.aai-ms{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.aai-m{max-width:88%;padding:11px 14px;border-radius:16px;line-height:1.55;font-size:14.5px;white-space:pre-wrap;word-break:break-word}
.aai-m.u{align-self:flex-end;background:#123c2b;color:#fff;border-bottom-right-radius:4px}.aai-m.a{align-self:flex-start;background:#fff;border:1px solid #e6dec8;color:#23291f;border-bottom-left-radius:4px;box-shadow:0 2px 10px rgba(60,48,20,.07)}
.aai-m button{display:block;margin-top:8px;border:1px solid #d9b36a;background:#f3ecda;color:#123c2b;border-radius:99px;padding:5px 12px;font-size:12px}
.aai-ch{display:flex;flex-wrap:wrap;gap:8px}.aai-ch button{border:1px solid #d9b36a;background:#fff;color:#123c2b;border-radius:99px;padding:8px 13px;font-size:13px}
.aai-ft{padding:8px 12px calc(10px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #e6dec8}
.aai-in{display:flex;gap:8px}.aai-in input{flex:1;min-width:0;padding:12px 14px;border:1px solid #e6dec8;border-radius:14px;font:inherit;background:#fbf7ec}
.aai-in button{border:0;border-radius:14px;padding:0 15px;font-size:18px;background:#123c2b;color:#fff}.aai-in button.mic.on{background:#b42318}
.aai-ds{margin:7px 2px 0;text-align:center;font-size:11.5px;line-height:1.45;color:#6f7466;white-space:pre-line}
.aai-in button.cam{background:#f3ecda;color:#123c2b;border:1px solid #d9b36a}
.aai-pv{display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:6px 8px;background:#fbf7ec;border:1px solid #e6dec8;border-radius:12px;font-size:12.5px;color:#4a503f}.aai-pv[hidden]{display:none}
.aai-pv img{width:46px;height:46px;object-fit:cover;border-radius:8px}.aai-pv button{margin-left:auto;border:0;background:#e6dec8;color:#123c2b;border-radius:50%;width:28px;height:28px;font-size:14px}
.aai-m img.pic{display:block;max-width:100%;max-height:220px;border-radius:10px;margin-bottom:6px}`;
  function open() {
    if (document.getElementById("aaiPg")) return;
    const pg = document.createElement("div"); pg.className = "aai-pg"; pg.id = "aaiPg";
    pg.innerHTML = `<div class="aai-hd"><button id="aaiX">←</button><b>🌿 Ayurveda AI</b><button id="aaiSp" title="जवाब सुनें">🔇</button></div><div class="aai-ms" id="aaiMs"></div><div class="aai-ft"><div class="aai-pv" id="aaiPv" hidden><img id="aaiPvI" alt=""><span>फोटो जुड़ गई। सवाल लिखें या सीधे भेजें ➤</span><button id="aaiPvX" aria-label="फोटो हटाएं">✕</button></div><div class="aai-in"><input id="aaiIn" placeholder="अपना सवाल लिखें या बोलें..." autocomplete="off"><input type="file" id="aaiFile" accept="image/*" hidden><button class="cam" id="aaiCam" aria-label="फोटो भेजें">📷</button><button class="mic" id="aaiMic">🎤</button><button id="aaiGo">➤</button></div><div class="aai-ds">${esc(DISC)}</div></div>`;
    document.body.appendChild(pg);
    try { history.pushState({ aai: 1 }, ""); } catch (e) { }
    const ms = pg.querySelector("#aaiMs"), inp = pg.querySelector("#aaiIn");
    const add = (r, t, pic) => { const d = document.createElement("div"); d.className = "aai-m " + (r === "user" ? "u" : "a"); if (pic) { const im = document.createElement("img"); im.className = "pic"; im.src = pic; d.appendChild(im); } d.appendChild(document.createTextNode(t)); if (r !== "user") { const b = document.createElement("button"); b.textContent = "🔊 सुनाएं"; b.onclick = () => speak(t); d.appendChild(b); } ms.appendChild(d); ms.scrollTop = ms.scrollHeight; return d; };
    add("assistant", "नमस्ते 🙏 मैं आयुर्वेद AI हूँ। जड़ी-बूटी, फ़ायदे, कैसे लें, सावधानी, बाल, त्वचा, पाचन जैसे किसी भी सवाल के बारे में पूछिए।\n\n📷 किसी जड़ी-बूटी, दवा या पैकेट की फोटो भी भेज सकते हैं: मैं बताऊँगा कि वह क्या है, कैसे लेना है, कहाँ रखना है और किस उम्र में।");
    const ch = document.createElement("div"); ch.className = "aai-ch";
    ["अश्वगंधा के फ़ायदे", "नींद के लिए क्या लें?", "दाढ़ी कैसे बढ़ाएं?", "पाचन और कब्ज", "बाल झड़ना"].forEach(t => { const b = document.createElement("button"); b.textContent = t; b.onclick = () => { ch.remove(); send(t); }; ch.appendChild(b); });
    ms.appendChild(ch);
    let pic = null, busy = false;
    const pv = pg.querySelector("#aaiPv"), clearPic = () => { pic = null; pv.hidden = true; pg.querySelector("#aaiFile").value = ""; };
    async function send(t) {
      if (busy) return;
      t = (t || inp.value).trim(); const img = pic; if (!t && !img) return;
      if (!t) t = "इस फोटो की पूरी जानकारी बताइए: यह क्या है, फ़ायदे, कैसे लेना है, कहाँ रखना है और किस उम्र में लेना ठीक है।";
      inp.value = ""; ch.remove(); clearPic(); busy = true;
      msgs.push({ r: "user", t: img ? t + " (फोटो भेजी गई)" : t }); add("user", t, img && img.url);
      const w = add("assistant", img ? "फोटो देख रहा हूँ…" : "सोच रहा हूँ…"); w.querySelector("button") && w.querySelector("button").remove();
      let a; try { a = await answer(t.slice(0, 500), img); } finally { busy = false; }
      msgs.push({ r: "assistant", t: a });
      w.remove(); add("assistant", a); if (speakOn) speak(a);
    }
    pg.querySelector("#aaiCam").onclick = () => pg.querySelector("#aaiFile").click();
    pg.querySelector("#aaiFile").onchange = async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      try { pic = await shrink(f); pg.querySelector("#aaiPvI").src = pic.url; pv.hidden = false; inp.focus(); }
      catch (x) { clearPic(); alert("यह फोटो खुल नहीं पाई। कृपया दूसरी फोटो (JPG/PNG) चुनें।"); }
    };
    pg.querySelector("#aaiPvX").onclick = clearPic;
    const close = () => { speechSynthesis && speechSynthesis.cancel(); pg.remove(); };
    pg.querySelector("#aaiX").onclick = () => { close(); try { history.back(); } catch (e) { } };
    window.addEventListener("popstate", function f() { window.removeEventListener("popstate", f); if (document.getElementById("aaiPg")) close(); });
    pg.querySelector("#aaiGo").onclick = () => send();
    inp.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
    pg.querySelector("#aaiSp").onclick = e => { speakOn = !speakOn; e.currentTarget.textContent = speakOn ? "🔊" : "🔇"; if (!speakOn) speechSynthesis.cancel(); };
    pg.querySelector("#aaiMic").onclick = e => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return alert("इस ब्राउज़र में बोलकर लिखना नहीं चलता। Chrome इस्तेमाल करें।");
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = "hi-IN"; rec.interimResults = false; const b = e.currentTarget; b.classList.add("on");
      rec.onresult = ev => { inp.value = ev.results[0][0].transcript; send(); };
      rec.onend = rec.onerror = () => { b.classList.remove("on"); rec = null; };
      rec.start();
    };
  }
  function init() {
    if (document.querySelector(".aai-fab")) return;
    const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
    const b = document.createElement("button"); b.className = "aai-fab"; b.setAttribute("aria-label", "Ayurveda AI"); b.innerHTML = "🌿 Ayurveda AI"; b.onclick = open; document.body.appendChild(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
