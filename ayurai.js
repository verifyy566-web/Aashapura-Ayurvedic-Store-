/* Ayurveda AI - chat + voice (bolna/sunna). Works NOW with built-in herb knowledge + your store products.
   Real AI mode: put Supabase Edge Function URL in ENDPOINT below (see AYURVEDA-AI-SETUP.txt). Empty = local mode. */
(function () {
  const ENDPOINT = "https://rvygarzpdacnhxwxsgxo.supabase.co/functions/v1/bright-api"; /* Gemini AI (Supabase Edge Function). Khali "" = sirf free local mode */
  const DISC = "Ayurveda is AI and can make mistakes.\nयह डॉक्टर की सलाह नहीं है।";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KB = () => window.AYU_KB || [];
  const RED = /chest pain|seene me dard|सीने|सांस फूल|saans phool|behosh|बेहोश|खून की उल्टी|emergency|suicide|आत्महत्या|zeher|ज़हर|overdose/i;
  const CARE = /pregnan|garbh|गर्भ|bacha|bachcha|baby|child|बच्च|cancer|कैंसर|diabet|sugar|शुगर|thyroid|थायराइड|kidney|किडनी|liver|लिवर|blood thinner|dawai|दवा|medicine/i;
  let msgs = [], speakOn = true, rec = null;

  /* ===== v57: 22 Indian bhashayein (jawab likhna + bolna + mic) ===== */
  /* c=code, n=English naam, a=apna naam, sr=mic (bolkar likhna) tag, tt=awaaz tag, px=awaaz na mile to milti-julti awaaz (lipi wahi), sc=AI ko batane ki lipi */
  const LANGS = [
    { c: "hi", n: "Hindi", a: "हिन्दी", sr: "hi-IN", tt: "hi-IN", sc: "Devanagari" },
    { c: "en", n: "English", a: "English", sr: "en-IN", tt: "en-IN", sc: "" },
    { c: "hing", n: "Hinglish", a: "Hinglish", sr: "hi-IN", tt: "hi-IN", sc: "" },
    { c: "as", n: "Assamese", a: "অসমীয়া", sr: "as-IN", tt: "as-IN", px: ["bn-IN"], sc: "Assamese (Bengali-Assamese script)" },
    { c: "bn", n: "Bengali", a: "বাংলা", sr: "bn-IN", tt: "bn-IN", sc: "Bengali" },
    { c: "brx", n: "Bodo", a: "बड़ो", sr: "hi-IN", tt: "brx-IN", px: ["hi-IN"], sc: "Devanagari" },
    { c: "doi", n: "Dogri", a: "डोगरी", sr: "hi-IN", tt: "doi-IN", px: ["hi-IN"], sc: "Devanagari" },
    { c: "gu", n: "Gujarati", a: "ગુજરાતી", sr: "gu-IN", tt: "gu-IN", sc: "Gujarati" },
    { c: "kn", n: "Kannada", a: "ಕನ್ನಡ", sr: "kn-IN", tt: "kn-IN", sc: "Kannada" },
    { c: "ks", n: "Kashmiri", a: "کٲشُر", sr: "ur-IN", tt: "ks-IN", sc: "Perso-Arabic (Nastaliq)" },
    { c: "kok", n: "Konkani", a: "कोंकणी", sr: "mr-IN", tt: "kok-IN", px: ["mr-IN", "hi-IN"], sc: "Devanagari" },
    { c: "mai", n: "Maithili", a: "मैथिली", sr: "hi-IN", tt: "mai-IN", px: ["hi-IN"], sc: "Devanagari" },
    { c: "ml", n: "Malayalam", a: "മലയാളം", sr: "ml-IN", tt: "ml-IN", sc: "Malayalam" },
    { c: "mni", n: "Manipuri (Meitei)", a: "ꯃꯩꯇꯩꯂꯣꯟ", sr: "hi-IN", tt: "mni-IN", sc: "Meitei Mayek" },
    { c: "mr", n: "Marathi", a: "मराठी", sr: "mr-IN", tt: "mr-IN", sc: "Devanagari" },
    { c: "ne", n: "Nepali", a: "नेपाली", sr: "ne-NP", tt: "ne-NP", px: ["hi-IN"], sc: "Devanagari" },
    { c: "or", n: "Odia", a: "ଓଡ଼ିଆ", sr: "or-IN", tt: "or-IN", sc: "Odia" },
    { c: "pa", n: "Punjabi", a: "ਪੰਜਾਬੀ", sr: "pa-IN", tt: "pa-IN", sc: "Gurmukhi" },
    { c: "sa", n: "Sanskrit", a: "संस्कृतम्", sr: "hi-IN", tt: "sa-IN", px: ["hi-IN"], sc: "Devanagari" },
    { c: "sat", n: "Santali", a: "ᱥᱟᱱᱛᱟᱲᱤ", sr: "hi-IN", tt: "sat-IN", sc: "Ol Chiki" },
    { c: "sd", n: "Sindhi", a: "سنڌي", sr: "ur-IN", tt: "sd-IN", sc: "Perso-Arabic" },
    { c: "ta", n: "Tamil", a: "தமிழ்", sr: "ta-IN", tt: "ta-IN", sc: "Tamil" },
    { c: "te", n: "Telugu", a: "తెలుగు", sr: "te-IN", tt: "te-IN", sc: "Telugu" },
    { c: "ur", n: "Urdu", a: "اردو", sr: "ur-IN", tt: "ur-IN", sc: "Perso-Arabic (Nastaliq)" }
  ];
  const LBY = c => LANGS.find(x => x.c === c) || LANGS[0];
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; };
  const selLang = () => { const v = ls("ayuLang"); return v && v !== "auto" && LANGS.some(x => x.c === v) ? v : "auto"; };
  /* Auto: likhi hui lipi se bhasha pehchano (Devanagari me Hindi maan lete hain; Marathi/Nepali waghera ke liye bhasha chuniye) */
  function scriptLang(q) {
    if (/[\u09F0\u09F1]/.test(q)) return "as";
    if (/[\u0980-\u09FF]/.test(q)) return "bn";
    if (/[\u0A00-\u0A7F]/.test(q)) return "pa";
    if (/[\u0A80-\u0AFF]/.test(q)) return "gu";
    if (/[\u0B00-\u0B7F]/.test(q)) return "or";
    if (/[\u0B80-\u0BFF]/.test(q)) return "ta";
    if (/[\u0C00-\u0C7F]/.test(q)) return "te";
    if (/[\u0C80-\u0CFF]/.test(q)) return "kn";
    if (/[\u0D00-\u0D7F]/.test(q)) return "ml";
    if (/[\u1C50-\u1C7F]/.test(q)) return "sat";
    if (/[\uABC0-\uABFF]/.test(q)) return "mni";
    if (/[\u0600-\u06FF]/.test(q)) return "ur";
    return "";
  }
  let lastLang = "";
  function pickLang(q) {
    const sel = selLang();
    if (sel !== "auto") return LBY(sel);
    return LBY(scriptLang(String(q || "")) || detectLang(q));
  }
  const LG = {}; /* jawab text -> uski bhasha code (awaaz chunne ke liye) */
  const guessLang = t => { t = String(t); return scriptLang(t) || (/[\u0900-\u097F]/.test(t) ? "hi" : "en"); };

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
        const LC = pickLang(q); lastLang = LC.c;
        const body = { messages: msgs.slice(-12).map(m => ({ role: m.r, content: m.t })), products: ps, kb: kbFor(q), lang: LC.c };
        if (LC.sc) { body.langName = LC.n; body.script = LC.sc; }
        if (img) body.image = { mime: img.mime, data: img.data };
        const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), img ? 60000 : 40000);
        let r; try { r = await fetch(ENDPOINT, { method: "POST", signal: ctl.signal, headers: { "Content-Type": "application/json", apikey: key, Authorization: "Bearer " + key }, body: JSON.stringify(body) }); } finally { clearTimeout(tm); }
        const rawT = await r.text(); let j = null;
        try { j = JSON.parse(rawT); } catch (e) { dbg = "HTTP " + r.status + " " + rawT.slice(0, 100); }
        if (j && j.reply) { const c = clean(j.reply); if (j.speech) SP[c] = clean(j.speech); LG[c] = LC.c === "hing" ? "hi" : LC.c; return c; }
        err = (j && j.error) || "fail";
        if (j && !dbg) dbg = j.detail || j.message || (r.ok ? "" : "HTTP " + r.status);
      } catch (e) { err = "fail"; dbg = e && e.name === "AbortError" ? "AI ne 40 second me jawab nahi diya (timeout)" : "net: " + String(e && e.message || e).slice(0, 80); }
    }
    if (img) return "📷 फोटो समझने के लिए AI चाहिए। " + busyMsg(err || "fail") + (dbg && err !== "quota" ? "\n\n(तकनीकी कारण: " + String(dbg).slice(0, 300) + ")" : "");
    return local(q, err) + (err === "fail" && dbg ? "\n\n(तकनीकी कारण: " + String(dbg).slice(0, 220) + ")" : "");
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
  /* ===== v57: bolna - Indian MAHILA awaaz =====
     1) phone me us bhasha ki pakki mahila awaaz mile to wahi  2) nahi to cloud mahila awaaz (Edge Function, Gemini TTS)
     3) nahi to phone ki us bhasha ki koi awaaz  4) nahi to milti-julti lipi wali awaaz (jaise Konkani -> Marathi/Hindi)  5) warna chup + samjhaiye */
  let voices = [], curAudio = null;
  const loadV = () => { voices = (window.speechSynthesis && speechSynthesis.getVoices()) || []; };
  if (window.speechSynthesis) { loadV(); speechSynthesis.onvoiceschanged = loadV; }
  const FEM = /(^|[^a-z])female|woman|swara|kalpana|lekha|veena|neerja|heera|aarti|aarohi|dhwani|tanishaa|sapna|sobhana|pallavi|shruti|subhasini|yashica|uzma|vaani|aditi|raveena|kajal|priya|anika|ananya|kavya|sangeeta/i;
  const MALE = /(^|[^a-z])male|hemant|prabhat|madhur|mohan|valluvar|sagar|midhun|gagan|bashkar|pradeep|rishi|ramesh|shyam|ravi($|[^a-z])/i;
  const isFem = v => FEM.test(v.name || "") && !(MALE.test(v.name || "") && !/female/i.test(v.name || ""));
  const isMale = v => MALE.test(v.name || "") && !/female/i.test(v.name || "");
  function devVoices(tag) {
    const t = tag.toLowerCase(), l2 = t.slice(0, 2);
    const pool = voices.filter(v => { const l = String(v.lang || "").replace("_", "-").toLowerCase(); return l === t || (t.endsWith("-in") && l === l2 + "-in"); });
    return { fem: pool.find(isFem) || null, any: pool.find(v => !isMale(v)) || pool[0] || null };
  }
  let spkId = 0, keepU = [];
  function stopSpeak() { spkId++; try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) { } if (curAudio) { try { curAudio.pause(); } catch (e) { } curAudio = null; } }
  const readable = t => String(t).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, " ").replace(/[•*#_]/g, " ").replace(/\n+/g, "। ").replace(/\s+/g, " ").trim();
  /* lambe jawab ko chhote hisson me todo (har hissa poora padha jaye, koi line chhute nahi) */
  function chunksOf(txt, max) {
    const parts = (readable(txt).match(/[^।.!?؟۔]+[।.!?؟۔]?/g) || []).map(x => x.trim()).filter(Boolean), out = [];
    let cur = "";
    for (const p of parts) {
      if (p.length > max) { if (cur) { out.push(cur); cur = ""; } let r = p; while (r.length > max) { let k = r.lastIndexOf(" ", max); if (k < 40) k = max; out.push(r.slice(0, k).trim()); r = r.slice(k); } cur = r.trim(); continue; }
      if ((cur + " " + p).trim().length > max) { out.push(cur); cur = p; } else cur = (cur + " " + p).trim();
    }
    if (cur) out.push(cur);
    return out;
  }
  /* phone ki awaaz: ek hissa khatam hone par hi agla (Android me ek saath queue karne se beech ki lines chhut jati thi) */
  function say(text, v, tag) {
    if (!window.speechSynthesis) return false;
    stopSpeak(); const id = spkId, list = chunksOf(text, 170); if (!list.length) return false;
    keepU = []; let i = 0;
    const next = () => {
      if (id !== spkId || i >= list.length) return;
      const part = list[i++], u = new SpeechSynthesisUtterance(part); keepU.push(u);
      u.lang = v ? v.lang : tag; u.rate = .92; u.pitch = v && isFem(v) ? 1 : 1.12; if (v) u.voice = v;
      let done = false, t = null;
      const go = () => { if (done) return; done = true; clearTimeout(t); next(); };
      u.onend = go; u.onerror = go;
      t = setTimeout(() => { if (id !== spkId) return; try { speechSynthesis.cancel(); } catch (e) { } go(); }, 5000 + part.length * 140); /* engine atak jaye to agle hisse par */
      speechSynthesis.speak(u);
    };
    next(); return true;
  }
  /* cloud awaaz: Gemini 24kHz PCM -> WAV bajao */
  function wavUrl(b64, mime) {
    const bin = atob(b64), n = bin.length;
    if (/wav|mpeg|mp3|ogg|webm/i.test(mime || "")) { const u8 = new Uint8Array(n); for (let i = 0; i < n; i++) u8[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u8], { type: mime })); }
    const m = /rate=(\d+)/.exec(mime || ""), rate = m ? +m[1] : 24000, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
    w(0, "RIFF"); v.setUint32(4, 36 + n, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n, true);
    const u8 = new Uint8Array(buf, 44); for (let i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
    return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
  }
  const CA = {}; /* text -> audio url (dobara sunne par quota nahi lagta) */
  async function ttsChunk(chunk, tag) {
    if (CA[chunk]) return CA[chunk];
    try {
      let key = ""; try { key = SUPABASE_KEY; } catch (e) { }
      const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", apikey: key, Authorization: "Bearer " + key }, body: JSON.stringify({ action: "tts", text: chunk, lang: tag }) });
      const j = await r.json(); if (!j || !j.audio) return null;
      return (CA[chunk] = wavUrl(j.audio, j.mime));
    } catch (e) { return null; }
  }
  /* cloud awaaz: poora jawab (max 6 hisse) ek ke baad ek; agla hissa peeche se pehle hi taiyar */
  async function cloud(text, tag) {
    if (!ENDPOINT) return false;
    const parts = chunksOf(text, 800).slice(0, 6); if (!parts.length) return false;
    stopSpeak(); const id = spkId;
    const first = await ttsChunk(parts[0], tag); if (!first) return false;
    if (id !== spkId) return true;
    let nextP = parts[1] ? ttsChunk(parts[1], tag) : null;
    const play = async (url, k) => {
      const a = new Audio(url); curAudio = a;
      a.onended = async () => {
        if (id !== spkId || !nextP) return;
        const u = await nextP; if (id !== spkId || !u) return;
        nextP = parts[k + 2] ? ttsChunk(parts[k + 2], tag) : null; play(u, k + 1);
      };
      await a.play();
    };
    try { await play(first, 0); return true; } catch (e) { return false; }
  }
  const warned = {};
  function noVoice(L) {
    if (warned[L.c]) return; warned[L.c] = 1;
    alert("इस फ़ोन में " + L.a + " (" + L.n + ") की आवाज़ उपलब्ध नहीं है, इसलिए जवाब सिर्फ़ पढ़ सकते हैं।\nअवाज़ जोड़ने के लिए: Settings → Language → Text-to-speech → Google → Voice data।\n\nVoice for " + L.n + " is not available on this phone - you can read the reply. (Settings > Language > Text-to-speech > Google > Voice data)");
  }
  async function speak(t, btn) {
    t = SP[t] || t;
    const L = LBY(LG[t] || guessLang(t)), tag = L.c === "hing" ? "hi-IN" : L.tt, dev = devVoices(tag), mode = ls("ayuVoice") || "auto", old = btn && btn.textContent;
    if (dev.fem) { if (say(t, dev.fem, tag)) return; }
    if (mode === "auto") {
      if (btn) btn.textContent = "⏳ …";
      const ok = await cloud(t, tag); if (btn) btn.textContent = old;
      if (ok) return;
    }
    if (dev.any && say(t, dev.any, tag)) return;
    for (const pt of (L.px || [])) { const d2 = devVoices(pt); const v = d2.fem || d2.any; if (v) { say(t, v, pt); return; } }
    if (!window.speechSynthesis) return alert("आपके ब्राउज़र में आवाज़ की सुविधा नहीं है।");
    noVoice(L);
  }
  const micTag = () => { const s = selLang(); return LBY(s === "auto" ? (lastLang || "hi") : s).sr; };
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
.aai-m img.pic{display:block;max-width:100%;max-height:220px;border-radius:10px;margin-bottom:6px}
.aai-hd #aaiLg{font-size:13px;padding:8px 10px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.aai-sh{position:fixed;inset:0;z-index:9700;background:rgba(0,0,0,.45);display:flex;align-items:flex-end}.aai-sc{background:#fbf7ec;width:100%;max-height:82vh;border-radius:18px 18px 0 0;display:flex;flex-direction:column;padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px))}
.aai-st{display:flex;align-items:center;gap:8px;margin-bottom:8px}.aai-st b{flex:1;font-size:17px;color:#123c2b}.aai-st button{border:0;background:#e6dec8;border-radius:50%;width:32px;height:32px;font-size:15px}
.aai-sl{overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:2px}.aai-sl button,.aai-sv button{border:1px solid #d9b36a;background:#fff;color:#123c2b;border-radius:12px;padding:10px 8px;font-size:14px;text-align:center;line-height:1.3}
.aai-sl button small{display:block;font-size:11px;color:#6f7466}.aai-sl button.on,.aai-sv button.on{background:#123c2b;color:#fff;border-color:#123c2b}.aai-sl button.on small{color:#e8d9a8}
.aai-sv{margin-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px}.aai-sv p{grid-column:1/-1;margin:2px 0;font-size:12.5px;color:#4a503f}`;
  function open() {
    if (document.getElementById("aaiPg")) return;
    const pg = document.createElement("div"); pg.className = "aai-pg"; pg.id = "aaiPg";
    pg.innerHTML = `<div class="aai-hd"><button id="aaiX">←</button><b>🌿 Ayurveda AI</b><button id="aaiLg" title="भाषा / Language">🌐</button><button id="aaiSp" title="जवाब सुनें">🔊</button></div><div class="aai-ms" id="aaiMs"></div><div class="aai-ft"><div class="aai-pv" id="aaiPv" hidden><img id="aaiPvI" alt=""><span>फोटो जुड़ गई। सवाल लिखें या सीधे भेजें ➤</span><button id="aaiPvX" aria-label="फोटो हटाएं">✕</button></div><div class="aai-in"><input id="aaiIn" placeholder="अपना सवाल लिखें या बोलें..." autocomplete="off"><input type="file" id="aaiFile" accept="image/*" hidden><button class="cam" id="aaiCam" aria-label="फोटो भेजें">📷</button><button class="mic" id="aaiMic">🎤</button><button id="aaiGo">➤</button></div><div class="aai-ds">${esc(DISC)}</div></div>`;
    document.body.appendChild(pg);
    try { history.pushState({ aai: 1 }, ""); } catch (e) { }
    const ms = pg.querySelector("#aaiMs"), inp = pg.querySelector("#aaiIn");
    const add = (r, t, pic) => { const d = document.createElement("div"); d.className = "aai-m " + (r === "user" ? "u" : "a"); if (pic) { const im = document.createElement("img"); im.className = "pic"; im.src = pic; d.appendChild(im); } d.appendChild(document.createTextNode(t)); if (r !== "user") { const b = document.createElement("button"); b.textContent = "🔊 सुनाएं"; b.onclick = () => speak(t, b); d.appendChild(b); } ms.appendChild(d); ms.scrollTop = ms.scrollHeight; return d; };
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
      w.remove(); const nd = add("assistant", a); if (speakOn) speak(a, nd.querySelector("button"));
    }
    pg.querySelector("#aaiCam").onclick = () => pg.querySelector("#aaiFile").click();
    pg.querySelector("#aaiFile").onchange = async e => {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      try { pic = await shrink(f); pg.querySelector("#aaiPvI").src = pic.url; pv.hidden = false; inp.focus(); }
      catch (x) { clearPic(); alert("यह फोटो खुल नहीं पाई। कृपया दूसरी फोटो (JPG/PNG) चुनें।"); }
    };
    pg.querySelector("#aaiPvX").onclick = clearPic;
    const close = () => { stopSpeak(); pg.remove(); };
    pg.querySelector("#aaiX").onclick = () => { close(); try { history.back(); } catch (e) { } };
    window.addEventListener("popstate", function f() { window.removeEventListener("popstate", f); if (document.getElementById("aaiPg")) close(); });
    pg.querySelector("#aaiGo").onclick = () => send();
    /* v57: bhasha + awaaz chunne ki sheet */
    const refreshLg = () => { const s = selLang(); pg.querySelector("#aaiLg").textContent = "🌐 " + (s === "auto" ? "Auto" : LBY(s).a); };
    const langSheet = () => {
      const sh = document.createElement("div"); sh.className = "aai-sh";
      const draw = () => {
        const s = selLang(), vm = ls("ayuVoice") || "auto";
        sh.innerHTML = `<div class="aai-sc"><div class="aai-st"><b>🌐 भाषा / Language</b><button id="aaiShX">✕</button></div><div class="aai-sl"><button data-l="auto" class="${s === "auto" ? "on" : ""}">Auto<small>जैसे आप लिखें</small></button>${LANGS.map(x => `<button data-l="${x.c}" class="${s === x.c ? "on" : ""}">${esc(x.a)}<small>${esc(x.n)}</small></button>`).join("")}</div><div class="aai-sv"><p>🔊 आवाज़ / Voice</p><button data-v="auto" class="${vm === "auto" ? "on" : ""}">महिला आवाज़<small>(Cloud + phone)</small></button><button data-v="phone" class="${vm === "phone" ? "on" : ""}">सिर्फ़ फ़ोन की आवाज़</button></div></div>`;
        sh.querySelector("#aaiShX").onclick = () => sh.remove();
        sh.onclick = e => { if (e.target === sh) sh.remove(); };
        sh.querySelectorAll("[data-l]").forEach(b => b.onclick = () => { ls("ayuLang", b.dataset.l); refreshLg(); sh.remove(); const L = b.dataset.l === "auto" ? null : LBY(b.dataset.l); add("assistant", L ? "✓ " + L.a + " (" + L.n + ")" : "✓ Auto"); });
        sh.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { ls("ayuVoice", b.dataset.v); draw(); });
      };
      draw(); pg.appendChild(sh);
    };
    pg.querySelector("#aaiLg").onclick = langSheet; refreshLg();
    inp.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
    pg.querySelector("#aaiSp").onclick = e => { speakOn = !speakOn; e.currentTarget.textContent = speakOn ? "🔊" : "🔇"; if (!speakOn) stopSpeak(); };
    pg.querySelector("#aaiMic").onclick = e => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return alert("इस ब्राउज़र में बोलकर लिखना नहीं चलता। Chrome इस्तेमाल करें।");
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = micTag(); rec.interimResults = false; const b = e.currentTarget; b.classList.add("on");
      rec.onresult = ev => { inp.value = ev.results[0][0].transcript; send(); };
      rec.onend = () => { b.classList.remove("on"); rec = null; };
      rec.onerror = ev => { b.classList.remove("on"); rec = null; if (ev && /language-not-supported|service-not-allowed/.test(ev.error)) alert("इस भाषा में बोलकर लिखना इस फ़ोन/ब्राउज़र में उपलब्ध नहीं है। कृपया टाइप करें।\nSpeaking is not supported for this language here - please type."); };
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
