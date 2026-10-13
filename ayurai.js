/* Ayurveda AI - chat + voice (bolna/sunna). Works NOW with built-in herb knowledge + your store products.
   Real AI mode: put Supabase Edge Function URL in ENDPOINT below (see AYURVEDA-AI-SETUP.txt). Empty = local mode. */
(function () {
  const ENDPOINT = "https://rvygarzpdacnhxwxsgxo.supabase.co/functions/v1/bright-api"; /* Gemini AI (Supabase Edge Function). Khali "" = sirf free local mode */
  const DISC = "Ayurveda AI is AI and can make mistakes. यह डॉक्टर की सलाह नहीं है।";
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
  function local(q) {
    if (RED.test(q)) return "⚠️ यह गंभीर हो सकता है। आयुर्वेदिक उपाय का इंतज़ार न करें, तुरंत डॉक्टर या इमरजेंसी (112) से संपर्क करें।";
    const herbs = pick(q), ps = prods(q, herbs);
    let out = "";
    herbs.forEach(h => { out += `🌿 ${h.n}\n• जानकारी: ${h.b}\n• कैसे लें: ${h.u}\n• सावधानी: ${h.p}\n\n`; });
    ps.forEach(p => {
      const f = (v, n) => String(v).split("\n").slice(0, n).join(", ");
      const bits = [p.ay_benefits && "फ़ायदे: " + f(p.ay_benefits, 3), p.ay_usage && "उपयोग: " + f(p.ay_usage, 2), p.ay_dose && "मात्रा: " + f(p.ay_dose, 1), p.ay_precautions && "सावधानी: " + f(p.ay_precautions, 2)].filter(Boolean);
      out += `🛍️ हमारे स्टोर में: ${p.name}${p.price ? " (₹" + p.price + ")" : ""}\n${bits.join("\n")}\n\n`;
    });
    if (!out) return "इस सवाल का पक्का जवाब मेरे पास अभी नहीं है। कृपया अपना सवाल थोड़ा अलग तरह से लिखें (जैसे \"बाल झड़ना\", \"अश्वगंधा के फ़ायदे\"), या Help Desk से हमारी टीम से पूछें। मैं अंदाज़े से गलत जानकारी नहीं देना चाहता।";
    if (CARE.test(q)) out += "⚠️ गर्भावस्था, बच्चों, लंबी बीमारी या चल रही दवा में पहले अपने डॉक्टर/वैद्य से ज़रूर पूछें।\n";
    return out.trim();
  }
  async function answer(q) {
    if (ENDPOINT) {
      try {
        const herbs = pick(q), ps = prods(q, herbs).map(p => ({ name: p.name, price: p.price, benefits: p.ay_benefits, usage: p.ay_usage, dose: p.ay_dose, precautions: p.ay_precautions, ingredients: p.ay_ingredients }));
        let key = ""; try { key = SUPABASE_KEY; } catch (e) { }
        const r = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", apikey: key, Authorization: "Bearer " + key }, body: JSON.stringify({ messages: msgs.slice(-6).map(m => ({ role: m.r, content: m.t })), products: ps }) });
        const j = await r.json();
        if (j && j.reply) return j.reply;
      } catch (e) { }
    }
    return local(q);
  }
  let voices = [];
  const loadV = () => { voices = (window.speechSynthesis && speechSynthesis.getVoices()) || []; };
  if (window.speechSynthesis) { loadV(); speechSynthesis.onvoiceschanged = loadV; }
  function bestVoice() {
    const hi = voices.filter(v => /^hi[-_]?IN/i.test(v.lang) || /hindi|हिन्दी|हिंदी/i.test(v.name));
    return hi.find(v => /google/i.test(v.name)) || hi.find(v => /female|lekha|kalpana|swara|neerja/i.test(v.name)) || hi[0] || null;
  }
  function speak(t) {
    if (!window.speechSynthesis) return alert("इस फ़ोन में बोलने की सुविधा नहीं है।");
    speechSynthesis.cancel(); loadV();
    const v = bestVoice();
    if (!v) alert("आपके फ़ोन में हिन्दी आवाज़ नहीं मिली। Settings → Language → Text-to-speech → Google → Voice data → Hindi (भारत) डाउनलोड करें।");
    const clean = String(t).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF•]/gu, " ").replace(/\n+/g, "। ");
    clean.match(/[^।.!?]+[।.!?]?/g).filter(x => x.trim()).forEach(part => {
      const u = new SpeechSynthesisUtterance(part.trim()); u.lang = "hi-IN"; u.rate = .92; u.pitch = 1; if (v) u.voice = v; speechSynthesis.speak(u);
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
.aai-ds{margin:7px 2px 0;text-align:center;font-size:11.5px;color:#6f7466}`;
  function open() {
    if (document.getElementById("aaiPg")) return;
    const pg = document.createElement("div"); pg.className = "aai-pg"; pg.id = "aaiPg";
    pg.innerHTML = `<div class="aai-hd"><button id="aaiX">←</button><b>🌿 Ayurveda AI</b><button id="aaiSp" title="जवाब सुनें">🔇</button></div><div class="aai-ms" id="aaiMs"></div><div class="aai-ft"><div class="aai-in"><input id="aaiIn" placeholder="अपना सवाल लिखें या बोलें..." autocomplete="off"><button class="mic" id="aaiMic">🎤</button><button id="aaiGo">➤</button></div><div class="aai-ds">${esc(DISC)}</div></div>`;
    document.body.appendChild(pg);
    try { history.pushState({ aai: 1 }, ""); } catch (e) { }
    const ms = pg.querySelector("#aaiMs"), inp = pg.querySelector("#aaiIn");
    const add = (r, t) => { const d = document.createElement("div"); d.className = "aai-m " + (r === "user" ? "u" : "a"); d.textContent = t; if (r !== "user") { const b = document.createElement("button"); b.textContent = "🔊 सुनाएं"; b.onclick = () => speak(t); d.appendChild(b); } ms.appendChild(d); ms.scrollTop = ms.scrollHeight; return d; };
    add("assistant", "नमस्ते 🙏 मैं आयुर्वेद AI हूँ। जड़ी-बूटी, फ़ायदे, कैसे लें, सावधानी, बाल, त्वचा, पाचन जैसे किसी भी सवाल के बारे में पूछिए।\n\n" + DISC);
    const ch = document.createElement("div"); ch.className = "aai-ch";
    ["अश्वगंधा के फ़ायदे", "नींद के लिए क्या लें?", "दाढ़ी कैसे बढ़ाएं?", "पाचन और कब्ज", "बाल झड़ना"].forEach(t => { const b = document.createElement("button"); b.textContent = t; b.onclick = () => { ch.remove(); send(t); }; ch.appendChild(b); });
    ms.appendChild(ch);
    async function send(t) {
      t = (t || inp.value).trim(); if (!t) return; inp.value = ""; ch.remove();
      msgs.push({ r: "user", t }); add("user", t);
      const w = add("assistant", "सोच रहा हूँ…"); w.querySelector("button") && w.querySelector("button").remove();
      const a = await answer(t.slice(0, 500)); msgs.push({ r: "assistant", t: a });
      w.remove(); add("assistant", a); if (speakOn) speak(a);
    }
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
