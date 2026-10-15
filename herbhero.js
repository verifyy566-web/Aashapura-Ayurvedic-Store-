/* Seasonal background (v6): full-page animated background + headline text. 7 season combos.
   Admin picks the season (Admin menu > Season Theme), saved in table site_season (supabase_v66_season.sql).
   Shows the cached season instantly, then checks Supabase. Never breaks the store. */
(function () {
  try {
    if (window.aashapuraSeasons) return;
    var KEY = "aashapura_season";
    var HERB_ALL = ["tulsi", "tulsi", "neem", "neem", "ashwagandha", "amla", "brahmi", "giloy", "aloe", "moringa", "haldi", "shatavari", "pudina", "pudina", "kamal", "gudhal", "gulab", "dalchini", "elaichi", "methi"];

    /* ---------- the 7 combos: colours + particles + headline text ---------- */
    var SEASONS = [
      { id: "herbal", emoji: "🌿", name: "Herbal Green", note: "Classic Ayurveda, all year",
        tint: ["rgba(217,179,106,.30)", "rgba(60,140,90,.20)", "rgba(255,255,255,.35)"], herbs: HERB_ALL, extra: null, density: 1,
        spark: { n: [14, 24], color: "#f3c85a", glow: "rgba(230,180,70,.65)" }, mist: "rgba(120,180,140,.20)",
        c: { ink: "#123c2b", accent: "#8f6a22", sub: "#3f4a40", halo: "251,247,236", b1: "#d9b36a", b2: "#b8893b", bi: "#2b1d05", chip: "#c9a45a" },
        t: { eye: "AASHAPURA AYURVEDA", h: "Nature's power,", em: "Ayurveda's tradition", sub: "Tulsi, Neem, Ashwagandha, Amla — made from pure herbs.", btn: "Shop Now", chips: ["🌿 Tulsi", "🍃 Neem", "🌱 Ashwagandha", "🟡 Haldi", "🌸 Rose", "🪷 Lotus"] } },
      { id: "monsoon", emoji: "🌧️", name: "Monsoon", note: "Rain + fresh green leaves",
        tint: ["rgba(110,170,200,.30)", "rgba(70,150,110,.22)", "rgba(255,255,255,.30)"], herbs: ["tulsi", "pudina", "brahmi", "neem", "giloy", "moringa", "methi", "aloe"], extra: "rain", density: .55,
        spark: { n: [4, 8], color: "#9ad0e6", glow: "rgba(110,170,210,.6)" }, mist: "rgba(100,150,190,.26)",
        c: { ink: "#0e3b43", accent: "#1b6a7a", sub: "#37484c", halo: "243,248,247", b1: "#8fd6cb", b2: "#4fb0a6", bi: "#021c1a", chip: "#7db8b2" },
        t: { eye: "MONSOON WELLNESS", h: "Fresh as the rain,", em: "strong from within", sub: "Giloy, Tulsi, Neem & Brahmi — immunity care for the rainy season.", btn: "Boost Immunity", chips: ["🌧️ Giloy", "🌿 Tulsi", "🍃 Neem", "🌱 Brahmi", "🍵 Kadha", "🛡️ Immunity"] } },
      { id: "winter", emoji: "❄️", name: "Winter", note: "Soft snow + warming herbs",
        tint: ["rgba(150,180,220,.32)", "rgba(200,170,120,.20)", "rgba(255,255,255,.40)"], herbs: ["ashwagandha", "giloy", "haldi", "dalchini", "elaichi", "tulsi", "shatavari", "amla", "flake", "flake"], extra: "snow", density: .6,
        spark: { n: [8, 14], color: "#f3c85a", glow: "rgba(230,180,70,.6)" }, mist: "rgba(140,170,210,.24)",
        c: { ink: "#1c2f4d", accent: "#8a5a14", sub: "#3d4a5e", halo: "246,248,252", b1: "#e6c36a", b2: "#b8893b", bi: "#2b1d05", chip: "#a9b8d0" },
        t: { eye: "WINTER WARMTH", h: "Warm from within,", em: "protected all season", sub: "Ashwagandha, Haldi, Dalchini & Elaichi — warmth and immunity for cold days.", btn: "Shop Winter Care", chips: ["❄️ Ashwagandha", "🟡 Haldi", "🍁 Dalchini", "🌿 Tulsi", "🛡️ Immunity", "💪 Strength"] } },
      { id: "spring", emoji: "🌸", name: "Spring Bloom", note: "Falling flower petals",
        tint: ["rgba(244,170,190,.34)", "rgba(150,205,140,.24)", "rgba(255,255,255,.38)"], herbs: ["gulab", "kamal", "gudhal", "gulab", "tulsi", "pudina", "kamal", "gudhal", "brahmi", "shatavari"], extra: null, density: 1,
        spark: { n: [12, 20], color: "#f7a8c0", glow: "rgba(240,130,170,.6)" }, mist: "rgba(240,160,185,.22)",
        c: { ink: "#5a1f3b", accent: "#a02c5a", sub: "#5a4350", halo: "253,246,248", b1: "#f7b3c8", b2: "#e0668d", bi: "#2a0716", chip: "#e3a3ba" },
        t: { eye: "VASANT · SPRING", h: "Bloom with", em: "nature's freshness", sub: "Rose, Lotus & Hibiscus care — skin and hair glow for the new season.", btn: "Shop Skin & Hair", chips: ["🌹 Rose", "🪷 Lotus", "🌺 Hibiscus", "🌿 Aloe", "✨ Skin Care", "💇 Hair Care"] } },
      { id: "summer", emoji: "☀️", name: "Summer Cool", note: "Sun rays + cooling herbs",
        tint: ["rgba(255,220,120,.36)", "rgba(120,200,170,.26)", "rgba(255,255,255,.40)"], herbs: ["pudina", "aloe", "pudina", "tulsi", "amla", "kamal", "moringa", "brahmi", "shatavari"], extra: "rays", density: .9,
        spark: { n: [12, 22], color: "#ffd84d", glow: "rgba(255,200,60,.7)" }, mist: "rgba(130,210,180,.22)",
        c: { ink: "#0f4a3a", accent: "#8a5d00", sub: "#3f4f45", halo: "252,250,238", b1: "#7fd6b0", b2: "#2fa27a", bi: "#052e22", chip: "#8fd0b4" },
        t: { eye: "GRISHMA · SUMMER", h: "Stay cool,", em: "stay refreshed", sub: "Pudina, Aloe, Amla & Brahmi — cooling care for the hot season.", btn: "Shop Cooling Care", chips: ["🍃 Pudina", "🌵 Aloe Vera", "🍋 Amla", "🌿 Brahmi", "🧊 Cooling", "✨ Skin Care"] } },
      { id: "autumn", emoji: "🍂", name: "Autumn", note: "Golden falling leaves",
        tint: ["rgba(235,160,80,.36)", "rgba(170,90,50,.18)", "rgba(255,255,255,.32)"], herbs: ["maple", "aleaf", "aleaf2", "maple", "aleaf", "aleaf2", "haldi", "dalchini", "tulsi"], extra: null, density: 1,
        spark: { n: [10, 18], color: "#f0a23a", glow: "rgba(230,140,40,.65)" }, mist: "rgba(220,150,90,.22)",
        c: { ink: "#4a2412", accent: "#9a4a10", sub: "#5a463a", halo: "253,247,238", b1: "#f2b25c", b2: "#cf7a1f", bi: "#2d1503", chip: "#e0b27e" },
        t: { eye: "SHARAD · AUTUMN", h: "Golden days,", em: "grounded wellness", sub: "Haldi, Dalchini & Tulsi — gentle immunity as the seasons turn.", btn: "Shop Immunity", chips: ["🍂 Haldi", "🍁 Dalchini", "🌿 Tulsi", "🍵 Digestion", "🛡️ Immunity", "💪 Wellness"] } },
      { id: "festive", emoji: "🪔", name: "Festive Diwali", note: "Marigold + golden sparks",
        tint: ["rgba(255,170,60,.40)", "rgba(190,40,60,.16)", "rgba(255,235,190,.40)"], herbs: ["genda", "genda", "gulab", "gudhal", "genda", "kamal", "genda"], extra: null, density: .9,
        spark: { n: [28, 46], color: "#ffcf4d", glow: "rgba(255,190,50,.8)" }, mist: "rgba(255,190,90,.24)",
        c: { ink: "#5a1218", accent: "#9b4a06", sub: "#5a3a2a", halo: "255,247,232", b1: "#ffd36a", b2: "#e8942a", bi: "#3a1503", chip: "#e6b36a" },
        t: { eye: "FESTIVE SPECIAL", h: "Light up your", em: "festive wellness", sub: "Pure herbal gifts and care for you and your family.", btn: "Shop Festive Gifts", chips: ["🪔 Festive Gifts", "🌼 Genda", "🌹 Rose", "✨ Pure Herbal", "🎁 Combos", "🛍️ Offers"] } }
    ];
    var byId = function (id) { for (var i = 0; i < SEASONS.length; i++) if (SEASONS[i].id === id) return SEASONS[i]; return SEASONS[0]; };
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
    var r = function (a, b) { return a + Math.random() * (b - a); };

    /* ---------- svg symbols ---------- */
    var S = function (id, body) { return '<symbol id="hh-' + id + '" viewBox="0 0 40 40">' + body + '</symbol>'; };
    var grad = function (id, a, b, v) { return '<linearGradient id="hg-' + id + '" x1="0" y1="0" x2="' + (v ? 0 : 1) + '" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; };
    var defs = '<svg data-hh="defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      grad("g", "#9be08f", "#2f8a46") + grad("d", "#6cc07a", "#1f6b3a") + grad("o", "#ffb347", "#d9731a") + grad("p", "#ffd1de", "#e86f98", 1) + grad("r", "#ff7a6b", "#c2262e") +
      grad("a", "#ffb15c", "#c4571a") + grad("y", "#ffe08a", "#e0a21a") + grad("b", "#e57a4a", "#a8321f") +
      S("tulsi", '<ellipse cx="20" cy="20" rx="13" ry="17" fill="url(#hg-d)"/><path d="M20 4V36M20 14l-7-4M20 22l-8-4M20 14l7-4M20 22l8-4" stroke="#1d5a30" stroke-width="1.3" fill="none"/>') +
      S("neem", '<path d="M20 38V4" stroke="#2f7a3f" stroke-width="1.4"/><g fill="url(#hg-g)"><path d="M20 6c-6 0-9 4-9 4s4 4 9 3z"/><path d="M20 6c6 0 9 4 9 4s-4 4-9 3z"/><path d="M20 15c-7 0-10 5-10 5s4 4 10 3z"/><path d="M20 15c7 0 10 5 10 5s-4 4-10 3z"/><path d="M20 25c-6 0-9 4-9 4s4 4 9 3z"/><path d="M20 25c6 0 9 4 9 4s-4 4-9 3z"/></g>') +
      S("ashwagandha", '<path d="M20 4c-9 0-13 8-12 15s6 15 12 15 11-8 12-15S29 4 20 4z" fill="#a8c66c" opacity=".85"/><circle cx="20" cy="21" r="8.5" fill="url(#hg-r)"/><circle cx="17" cy="18" r="2.2" fill="#fff" opacity=".35"/><path d="M20 4v6" stroke="#5a7a2a" stroke-width="2"/>') +
      S("amla", '<circle cx="20" cy="22" r="13" fill="#c5dc6e"/><path d="M20 9v26M10 14c6 8 6 12 0 16M30 14c-6 8-6 12 0 16" stroke="#8fae3a" stroke-width="1.1" fill="none"/><circle cx="15" cy="17" r="3.5" fill="#f0f7bd" opacity=".6"/><path d="M20 9c0-4 3-6 6-6" stroke="#3f7a2a" stroke-width="2" fill="none"/>') +
      S("brahmi", '<path d="M8 36C14 24 20 16 33 6" stroke="#3a8a4c" stroke-width="1.6" fill="none"/><g fill="url(#hg-g)"><circle cx="12" cy="30" r="4.5"/><circle cx="17" cy="23" r="4.5"/><circle cx="23" cy="17" r="4.5"/><circle cx="29" cy="10" r="4.5"/><circle cx="19" cy="31" r="3.5"/><circle cx="26" cy="23" r="3.5"/></g>') +
      S("giloy", '<path d="M20 36C4 24 2 12 11 7c5-3 8 0 9 3 1-3 4-6 9-3 9 5 7 17-9 29z" fill="url(#hg-d)"/><path d="M20 35V12M20 26l-8-8M20 26l8-8" stroke="#1d5a30" stroke-width="1.2" fill="none"/>') +
      S("aloe", '<g fill="url(#hg-g)"><path d="M20 38C16 24 17 10 20 3c3 7 4 21 0 35z"/><path d="M18 38C8 30 5 18 6 9c7 5 13 17 12 29z"/><path d="M22 38c10-8 13-20 12-29-7 5-13 17-12 29z"/></g><g fill="#e8f7d8"><circle cx="20" cy="16" r="1"/><circle cx="19.5" cy="24" r="1"/><circle cx="11" cy="22" r="1"/><circle cx="29" cy="22" r="1"/></g>') +
      S("moringa", '<path d="M20 38V3" stroke="#3a8a4c" stroke-width="1.4"/><g fill="#7bd17f"><ellipse cx="14" cy="8" rx="4" ry="2.6"/><ellipse cx="26" cy="8" rx="4" ry="2.6"/><ellipse cx="13" cy="15" rx="4.5" ry="3"/><ellipse cx="27" cy="15" rx="4.5" ry="3"/><ellipse cx="12" cy="23" rx="5" ry="3.2"/><ellipse cx="28" cy="23" rx="5" ry="3.2"/><ellipse cx="13" cy="31" rx="4.5" ry="3"/><ellipse cx="27" cy="31" rx="4.5" ry="3"/></g>') +
      S("haldi", '<path d="M6 28c-1-6 4-10 9-10l9-9c3-3 8 0 7 4l-3 6c4 1 7 5 5 9-3 5-10 6-14 4-6 2-12 1-13-4z" fill="url(#hg-o)"/><path d="M14 22l4 4M22 14l3 3M26 24l-4 4" stroke="#b85a10" stroke-width="1.2" fill="none"/>') +
      S("shatavari", '<path d="M20 38V4" stroke="#4e9a52" stroke-width="1.2"/><g stroke="#6dc277" stroke-width="1.5" stroke-linecap="round"><path d="M20 10L9 4M20 10l11-6M20 18L7 11M20 18l13-7M20 26L6 19M20 26l14-7M20 33L8 27M20 33l12-6"/></g>') +
      S("pudina", '<path d="M20 38C6 28 4 14 12 8l4 2 4-7 4 7 4-2c8 6 6 20-8 30z" fill="url(#hg-g)"/><path d="M20 36V10M20 26l-7-6M20 26l7-6M20 18l-5-4M20 18l5-4" stroke="#1f6b3a" stroke-width="1.1" fill="none"/>') +
      S("kamal", '<g fill="url(#hg-p)" stroke="#d4577f" stroke-width=".6"><path d="M20 4c6 7 6 18 0 28-6-10-6-21 0-28z"/><path d="M6 12c10 1 17 9 14 20C10 28 5 21 6 12z"/><path d="M34 12c-10 1-17 9-14 20 10-4 15-11 14-20z"/><path d="M2 22c8 0 14 5 18 12C10 36 3 31 2 22z"/><path d="M38 22c-8 0-14 5-18 12 10 2 17-3 18-12z"/></g><circle cx="20" cy="30" r="3" fill="#ffd96a"/>') +
      S("gudhal", '<g fill="url(#hg-r)"><ellipse cx="20" cy="9" rx="7" ry="9"/><ellipse cx="31" cy="17" rx="9" ry="7" transform="rotate(30 31 17)"/><ellipse cx="27" cy="30" rx="7" ry="9" transform="rotate(-30 27 30)"/><ellipse cx="13" cy="30" rx="7" ry="9" transform="rotate(30 13 30)"/><ellipse cx="9" cy="17" rx="9" ry="7" transform="rotate(-30 9 17)"/></g><path d="M20 20l8-12" stroke="#ffd96a" stroke-width="1.6"/><circle cx="28" cy="8" r="2" fill="#ffd96a"/><circle cx="20" cy="20" r="3" fill="#7a0f1a"/>') +
      S("gulab", '<path d="M20 36C6 28 3 14 14 7c4-2 7 0 6 4 4-4 9-3 11 1 3 8-3 18-11 24z" fill="url(#hg-p)"/><path d="M14 12c4 2 7 7 6 14" stroke="#d4577f" stroke-width="1" fill="none" opacity=".7"/>') +
      S("dalchini", '<g><path d="M6 30L30 6l5 5L11 35z" fill="#b5703a"/><path d="M6 30L11 35" stroke="#7a4420" stroke-width="2"/><path d="M12 24l14-14M16 28l14-14" stroke="#d9a066" stroke-width="1.4" opacity=".8"/><ellipse cx="8.5" cy="32.5" rx="3.5" ry="2" transform="rotate(-45 8.5 32.5)" fill="#5a3315"/></g>') +
      S("elaichi", '<path d="M20 3c9 4 13 13 8 24-3 6-6 9-8 10-2-1-5-4-8-10C7 16 11 7 20 3z" fill="url(#hg-g)"/><path d="M20 4v32M14 12c3 6 3 14 0 20M26 12c-3 6-3 14 0 20" stroke="#2f7a3f" stroke-width="1" fill="none"/>') +
      S("methi", '<g fill="url(#hg-g)"><ellipse cx="20" cy="11" rx="7" ry="9"/><ellipse cx="11" cy="24" rx="7" ry="9" transform="rotate(-50 11 24)"/><ellipse cx="29" cy="24" rx="7" ry="9" transform="rotate(50 29 24)"/></g><path d="M20 22v16M20 11v8M12 24l7 0M28 24l-7 0" stroke="#1f6b3a" stroke-width="1" fill="none"/>') +
      S("maple", '<path d="M20 3l3.5 7 6-2-2 7 7 1-5 5 4 6-8-1v7h-3v-7l-8 1 4-6-5-5 7-1-2-7 6 2z" fill="url(#hg-a)"/><path d="M20 12v24" stroke="#8a3a10" stroke-width="1.3"/>') +
      S("aleaf", '<path d="M20 38C6 28 4 14 20 2c16 12 14 26 0 36z" fill="url(#hg-b)"/><path d="M20 36V8M20 24l-6-6M20 24l6-6M20 30l-5-4M20 30l5-4" stroke="#7a2a12" stroke-width="1.1" fill="none"/>') +
      S("aleaf2", '<path d="M20 38C6 28 4 14 20 2c16 12 14 26 0 36z" fill="url(#hg-y)"/><path d="M20 36V8M20 24l-6-6M20 24l6-6M20 30l-5-4M20 30l5-4" stroke="#a8791a" stroke-width="1.1" fill="none"/>') +
      S("genda", '<g fill="#ffc247"><circle cx="20" cy="8" r="6.5"/><circle cx="20" cy="32" r="6.5"/><circle cx="8" cy="20" r="6.5"/><circle cx="32" cy="20" r="6.5"/><circle cx="11.5" cy="11.5" r="6"/><circle cx="28.5" cy="11.5" r="6"/><circle cx="11.5" cy="28.5" r="6"/><circle cx="28.5" cy="28.5" r="6"/></g><circle cx="20" cy="20" r="9" fill="#ff9a1f"/><circle cx="20" cy="20" r="4" fill="#d9731a"/>') +
      S("flake", '<g stroke="#8fb0d3" stroke-width="2" stroke-linecap="round" fill="none"><path d="M20 3v34M5.3 11.5l29.4 17M5.3 28.5l29.4-17"/><path d="M16 6l4 4 4-4M16 34l4-4 4 4M5 15.5l5.5 1.5-1.5 5.5M35 24.5l-5.5-1.5 1.5-5.5M5 24.5l5.5-1.5-1.5-5.5M35 15.5l-5.5 1.5 1.5 5.5"/></g>') +
      '</defs></svg>';

    /* ---------- the fixed full-page layer ---------- */
    var bg = document.querySelector(".herb-bg");
    if (!bg) {
      bg = document.createElement("div");
      bg.className = "herb-bg";
      bg.setAttribute("aria-hidden", "true");
      document.body.insertBefore(bg, document.body.firstChild);
    }
    bg.insertAdjacentHTML("afterbegin", defs);

    var setFall = function () { bg.style.setProperty("--fall", Math.round(window.innerHeight * 1.3) + "px"); };
    setFall();
    window.addEventListener("resize", setFall);

    var cur = null;

    function paintVars(s) {
      var rt = document.documentElement.style, c = s.c;
      rt.setProperty("--sz-ink", c.ink); rt.setProperty("--sz-accent", c.accent); rt.setProperty("--sz-sub", c.sub);
      rt.setProperty("--sz-halo", c.halo); rt.setProperty("--sz-b1", c.b1); rt.setProperty("--sz-b2", c.b2);
      rt.setProperty("--sz-bi", c.bi); rt.setProperty("--sz-chip", c.chip);
      bg.style.setProperty("--sz-spark", s.spark.color); bg.style.setProperty("--sz-sparkg", s.spark.glow); bg.style.setProperty("--sz-mist", s.mist);
      bg.style.background = "radial-gradient(70% 45% at 88% 0%," + s.tint[0] + ",transparent 70%),radial-gradient(60% 40% at 4% 100%," + s.tint[1] + ",transparent 70%),radial-gradient(50% 35% at 50% 50%," + s.tint[2] + ",transparent 70%)";
    }

    function paintText(s, animate) {
      var h = document.querySelector(".herb-hero"); if (!h) return;
      var t = s.t, q = function (sel) { return h.querySelector(sel); };
      var eye = q(".hh-eye"), h2 = q("h2"), sub = q(".hh-sub"), btn = q(".hh-btn"), names = q(".hh-names");
      if (eye) eye.textContent = t.eye;
      if (h2) h2.innerHTML = esc(t.h) + "<br><em>" + esc(t.em) + "</em>";
      if (sub) sub.textContent = t.sub;
      if (btn) btn.textContent = t.btn;
      if (names) names.innerHTML = t.chips.map(function (x) { return "<span>" + esc(x) + "</span>"; }).join("");
      if (animate) {
        var els = h.querySelectorAll(".hh-r");
        els.forEach(function (e) { e.classList.remove("hh-r"); });
        void h.offsetWidth;
        els.forEach(function (e) { e.classList.add("hh-r"); });
      }
    }

    function build(s) {
      var small = window.innerWidth < 600;
      Array.prototype.slice.call(bg.children).forEach(function (n) { if (!(n.getAttribute && n.getAttribute("data-hh") === "defs")) bg.removeChild(n); });
      var frag = document.createDocumentFragment(), el;
      if (s.extra === "rays") { el = document.createElement("div"); el.className = "hh-rays"; frag.appendChild(el); }
      for (var m = 0; m < 2; m++) {
        el = document.createElement("div"); el.className = "hh-mist";
        el.style.cssText = "top:" + (m ? 55 : 15) + "%;animation-duration:" + (m ? 26 : 34) + "s;animation-delay:-" + (m * 11) + "s";
        frag.appendChild(el);
      }
      var sn = small ? s.spark.n[0] : s.spark.n[1];
      for (var k = 0; k < sn; k++) {
        var z = r(2, 5); el = document.createElement("i"); el.className = "hh-spark";
        el.style.cssText = "left:" + r(0, 100) + "%;top:" + r(20, 100) + "%;width:" + z + "px;height:" + z + "px;animation-duration:" + r(5, 11) + "s;animation-delay:-" + r(0, 10) + "s";
        frag.appendChild(el);
      }
      var i;
      if (s.extra === "rain") {
        for (i = 0; i < (small ? 26 : 44); i++) {
          el = document.createElement("i"); el.className = "hh-rain";
          var hh = r(16, 34);
          el.style.cssText = "left:" + r(-5, 105) + "%;height:" + hh + "px;--dx:-" + ((r(20, 60)) | 0) + "px;--rt:" + r(6, 80) + ";animation-duration:" + r(.9, 1.7) + "s;animation-delay:-" + r(0, 1.7) + "s;opacity:" + r(.35, .8);
          frag.appendChild(el);
        }
      }
      if (s.extra === "snow") {
        for (i = 0; i < (small ? 26 : 44); i++) {
          el = document.createElement("i"); el.className = "hh-snow";
          var sz = r(3, 8);
          el.style.cssText = "left:" + r(0, 100) + "%;width:" + sz + "px;height:" + sz + "px;--dx:" + ((r(-60, 60)) | 0) + "px;--rt:" + r(6, 80) + ";animation-duration:" + r(9, 18) + "s," + r(3, 6) + "s;animation-delay:-" + r(0, 16) + "s,0s;opacity:" + r(.6, 1);
          frag.appendChild(el);
        }
      }
      var N = Math.round((small ? 22 : 36) * (s.density || 1));
      for (i = 0; i < N; i++) {
        var layer = i % 3, size, dur, blur, op;
        if (layer === 0) { size = r(16, 24); dur = r(20, 30); blur = 1.2; op = .5; }
        else if (layer === 1) { size = r(26, 38); dur = r(14, 20); blur = 0; op = .92; }
        else { size = r(46, 70); dur = r(10, 15); blur = 3; op = .4; }
        el = document.createElement("div"); el.className = "hh-item";
        el.style.cssText = "left:" + r(0, 100) + "%;width:" + size + "px;height:" + size + "px;opacity:" + op + ";" +
          "--dx:" + ((r(-80, 80)) | 0) + "px;--rot:" + ((Math.random() < .5 ? -1 : 1) * r(240, 600) | 0) + "deg;--rt:" + r(6, 70) + ";" +
          "animation-duration:" + dur + "s," + r(3, 6) + "s;animation-delay:-" + r(0, dur) + "s,0s;" +
          (blur ? "filter:blur(" + blur + "px);" : "") + "z-index:" + (layer === 2 ? 3 : 1) + ";";
        el.innerHTML = '<svg style="animation-duration:' + r(6, 14) + 's"><use href="#hh-' + s.herbs[(i * 7 + layer) % s.herbs.length] + '"/></svg>';
        frag.appendChild(el);
      }
      bg.appendChild(frag);
    }

    function apply(id, opt) {
      opt = opt || {};
      var s = byId(id);
      if (cur === s.id && !opt.force) return;
      var first = cur === null;
      cur = s.id;
      var go = function () { paintVars(s); build(s); paintText(s, !first); bg.classList.remove("hh-swap"); };
      if (first || opt.instant) go();
      else { bg.classList.add("hh-swap"); setTimeout(go, 480); }
    }

    var cached = function () { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } };
    var remember = function (id) { try { localStorage.setItem(KEY, id); } catch (e) {} };
    var saved = cached() || "herbal";

    window.aashapuraSeasons = {
      list: SEASONS,
      current: function () { return cur; },
      saved: function () { return saved; },
      apply: function (id) { apply(id); },                       /* live preview (not saved) */
      setSaved: function (id) { saved = byId(id).id; remember(saved); apply(saved); }
    };

    apply(saved, { instant: true });

    /* check what the admin has set for everyone */
    function load() {
      if (typeof supabaseClient === "undefined") return;
      supabaseClient.from("site_season").select("season").eq("id", 1).maybeSingle().then(function (res) {
        if (!res || res.error || !res.data || !res.data.season) return;
        var id = byId(res.data.season).id;
        saved = id; remember(id);
        if (!window.aashapuraSeasons.previewing) apply(id);
      }, function () {});
    }
    var tries = 0;
    (function wait() { if (typeof supabaseClient !== "undefined") load(); else if (tries++ < 40) setTimeout(wait, 250); })();
  } catch (e) { /* never break the store */ }
})();
