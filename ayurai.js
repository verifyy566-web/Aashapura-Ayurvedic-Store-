/* Ayurveda AI - chat + voice (bolna/sunna). Works NOW with built-in herb knowledge + your store products.
   Real AI mode: put Supabase Edge Function URL in ENDPOINT below (see AYURVEDA-AI-SETUP.txt). Empty = local mode. */
(function () {
  const ENDPOINT = ""; /* e.g. https://xxxx.supabase.co/functions/v1/ayurveda-ai */
  const DISC = "Ayurveda AI is AI and can make mistakes. Ye doctor ki salah nahi hai.";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KB = [
    { k: ["ashwagandha", "अश्वगंधा", "ashwagandh"], n: "Ashwagandha", b: "Tanav kam karne, achhi neend, stamina aur kamzori me paramparik roop se use hoti hai.", u: "Aam taur par powder/capsule doodh ya pani ke saath, raat ya subah. Matra product label ke hisaab se lein.", p: "Pregnancy, thyroid, autoimmune rog ya neend/BP ki dawai me pehle doctor se poochein." },
    { k: ["amla", "आंवला", "amlaa"], n: "Amla", b: "Vitamin C se bharpoor; immunity, pachan, baal aur aankhon ki sehat ke liye jaana jata hai.", u: "Juice, powder ya murabba. Khali pet ya khane ke baad, label ke anusar.", p: "Acidity zyada ho ya sugar ki dawai le rahe hon to doctor se poochein." },
    { k: ["triphala", "त्रिफला"], n: "Triphala", b: "Kabz, pachan aur pet saaf rakhne me paramparik use. Amla, bibhitaki, haritaki ka mel.", u: "Aam taur par raat ko garam pani ke saath. Shuru me kam matra lein.", p: "Pregnancy, dast (loose motion) ya kamzori me na lein bina salah ke." },
    { k: ["tulsi", "तुलसी", "basil"], n: "Tulsi", b: "Sardi-khansi, gale ki takleef aur immunity ke liye paramparik use.", u: "Kadha/chai ya ras, shahad ke saath. Label ke anusar.", p: "Pregnancy, blood thinner ya sugar ki dawai me doctor se poochein." },
    { k: ["giloy", "गिलोय", "guduchi"], n: "Giloy", b: "Immunity aur mausami bukhar me paramparik use.", u: "Ras, kadha ya capsule, label ke anusar.", p: "Diabetes, autoimmune rog, pregnancy ya surgery se pehle doctor se poochein." },
    { k: ["brahmi", "ब्राह्मी"], n: "Brahmi", b: "Yaaddasht, focus aur mansik shanti ke liye paramparik use.", u: "Powder/syrup/capsule, label ke anusar. Aam taur par doodh ya pani ke saath.", p: "Thyroid, slow heart rate ya pregnancy me doctor se poochein." },
    { k: ["neem", "नीम"], n: "Neem", b: "Twacha (pimple, kharish) aur blood shuddhi ke liye paramparik use.", u: "Capsule/powder/ras, label ke anusar. Lagatar lambe samay tak na lein.", p: "Pregnancy, bachon aur garbh-dharan ki koshish me na lein bina salah ke." },
    { k: ["moringa", "सहजन", "sahjan", "drumstick"], n: "Moringa (Sahjan)", b: "Poshan, iron aur energy ke liye jaana jata hai.", u: "Powder pani/smoothie me, label ke anusar.", p: "BP ki dawai ya pregnancy me doctor se poochein." },
    { k: ["haldi", "हल्दी", "turmeric", "curcumin"], n: "Haldi", b: "Soojan, chot, immunity aur twacha ke liye paramparik use.", u: "Garam doodh me ya kadhe me, label ke anusar.", p: "Pittashay ki pathri, blood thinner ya surgery se pehle doctor se poochein." },
    { k: ["shatavari", "शतावरी"], n: "Shatavari", b: "Mahilaon ki sehat aur dugdh vridhi me paramparik use.", u: "Powder doodh ke saath, label ke anusar.", p: "Hormone-sensitive rog ya kidney problem me doctor se poochein." },
    { k: ["arjuna", "अर्जुन"], n: "Arjuna", b: "Dil ki sehat ke liye paramparik use.", u: "Chhaal ka kadha/powder, label ke anusar.", p: "Dil ya BP ki dawai le rahe hon to pehle doctor se poochein." }
  ];
  const CONCERN = [
    [/neend|नींद|sleep|tanav|stress|तनाव|anxiety|chinta/i, ["ashwagandha", "brahmi"]],
    [/pachan|पाचन|kabz|कब्ज|gas|pet|digest|constipation/i, ["triphala"]],
    [/immun|sardi|सर्दी|khansi|खांसी|cold|cough|zukam|bukhar/i, ["tulsi", "giloy", "amla"]],
    [/baal|बाल|hair|dandruff/i, ["amla", "brahmi"]],
    [/twacha|त्वचा|skin|pimple|kharish|daag/i, ["neem", "haldi"]],
    [/thakan|थकान|kamzor|कमज़ोर|weakness|energy|stamina/i, ["ashwagandha", "moringa"]],
    [/dil|दिल|heart|bp|blood pressure/i, ["arjuna"]],
    [/yaad|याद|memory|focus/i, ["brahmi"]],
    [/mahila|women|periods|dugdh|doodh badhana/i, ["shatavari"]]
  ];
  const RED = /chest pain|seene me dard|सीने|saans|सांस फूल|behosh|बेहोश|khoon|खून|emergency|suicide|zeher|overdose/i;
  const CARE = /pregnan|garbh|गर्भ|bacha|bachcha|baby|child|bachon|cancer|diabet|sugar|thyroid|kidney|liver|dialysis|blood thinner|dawai|dawa le|medicine/i;
  let msgs = [], speakOn = false, rec = null;

  function pick(q) {
    const hit = [];
    KB.forEach(e => { if (e.k.some(w => q.toLowerCase().includes(w.toLowerCase()))) hit.push(e.k[0]); });
    if (!hit.length) CONCERN.forEach(c => { if (c[0].test(q)) c[1].forEach(x => { if (!hit.includes(x)) hit.push(x); }); });
    return hit.map(h => KB.find(e => e.k[0] === h)).filter(Boolean).slice(0, 3);
  }
  function prods(q, herbs) {
    let list = [];
    try { list = products || []; } catch (e) { }
    const toks = q.toLowerCase().split(/[^a-z0-9\u0900-\u097f]+/).filter(t => t.length >= 3);
    return list.map(p => {
      const hay = [p.name, p.category, p.description, p.ay_benefits, p.ay_ingredients, p.ay_usage].join(" ").toLowerCase();
      let s = toks.filter(t => hay.includes(t)).length;
      herbs.forEach(h => { if ((p.name || "").toLowerCase().includes(h.k[0])) s += 3; });
      return { p, s };
    }).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.p);
  }
  function local(q) {
    if (RED.test(q)) return "⚠️ Ye gambhir ho sakta hai. Ayurvedic upay ka intezaar na karein, turant doctor ya emergency (112) se sampark karein.";
    const herbs = pick(q), ps = prods(q, herbs);
    let out = "";
    herbs.forEach(h => { out += `🌿 ${h.n}\n• Fayda: ${h.b}\n• Kaise lein: ${h.u}\n• Savdhani: ${h.p}\n\n`; });
    ps.forEach(p => {
      const bits = [p.ay_benefits && "Fayda: " + String(p.ay_benefits).split("\n").slice(0, 3).join(", "), p.ay_usage && "Upyog: " + String(p.ay_usage).split("\n").slice(0, 2).join(", "), p.ay_dose && "Matra: " + String(p.ay_dose).split("\n")[0], p.ay_precautions && "Savdhani: " + String(p.ay_precautions).split("\n").slice(0, 2).join(", ")].filter(Boolean);
      out += `🛍️ Hamare store me: ${p.name}${p.price ? " (₹" + p.price + ")" : ""}\n${bits.join("\n")}\n\n`;
    });
    if (!out) return "Is baare me meri paas pakki jankari nahi hai. Aap kisi jadi-buti ya takleef ka naam likhiye (jaise Ashwagandha, neend, pachan), ya WhatsApp par hamse poochiye.";
    if (CARE.test(q)) out += "⚠️ Pregnancy, bachon, lambi bimari ya chal rahi dawai me pehle apne doctor/vaidya se zaroor poochein.\n";
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
  function speak(t) {
    if (!window.speechSynthesis) return alert("Is phone me bolne ki suvidha nahi hai.");
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(t).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF•]/gu, " ").replace(/\n+/g, ". "));
    u.lang = "hi-IN"; u.rate = .95;
    const v = speechSynthesis.getVoices().find(x => /hi[-_]IN/i.test(x.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
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
    pg.innerHTML = `<div class="aai-hd"><button id="aaiX">←</button><b>🌿 Ayurveda AI</b><button id="aaiSp" title="Jawab bol kar sunao">🔇</button></div><div class="aai-ms" id="aaiMs"></div><div class="aai-ft"><div class="aai-in"><input id="aaiIn" placeholder="Apna sawal likhein ya bolein..." autocomplete="off"><button class="mic" id="aaiMic">🎤</button><button id="aaiGo">➤</button></div><div class="aai-ds">${esc(DISC)}</div></div>`;
    document.body.appendChild(pg);
    try { history.pushState({ aai: 1 }, ""); } catch (e) { }
    const ms = pg.querySelector("#aaiMs"), inp = pg.querySelector("#aaiIn");
    const add = (r, t) => { const d = document.createElement("div"); d.className = "aai-m " + (r === "user" ? "u" : "a"); d.textContent = t; if (r !== "user") { const b = document.createElement("button"); b.textContent = "🔊 Sunao"; b.onclick = () => speak(t); d.appendChild(b); } ms.appendChild(d); ms.scrollTop = ms.scrollHeight; return d; };
    add("assistant", "Namaste 🙏 Main Ayurveda AI hoon. Jadi-buti, unke fayde, kaise lein aur savdhani ke baare me poochiye.\n\n" + DISC);
    const ch = document.createElement("div"); ch.className = "aai-ch";
    ["Ashwagandha ke fayde", "Neend ke liye kya lein?", "Pachan/kabz", "Immunity badhane ke liye", "Baalon ke liye"].forEach(t => { const b = document.createElement("button"); b.textContent = t; b.onclick = () => { ch.remove(); send(t); }; ch.appendChild(b); });
    ms.appendChild(ch);
    async function send(t) {
      t = (t || inp.value).trim(); if (!t) return; inp.value = ""; ch.remove();
      msgs.push({ r: "user", t }); add("user", t);
      const w = add("assistant", "Soch raha hoon…"); w.querySelector("button") && w.querySelector("button").remove();
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
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return alert("Is browser me bolkar likhna nahi chalta. Chrome use karein.");
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
