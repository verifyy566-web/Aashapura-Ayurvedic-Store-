/* Seasonal background (v7): full-page animated background + premium hero card + headline text. 12 season combos (7 seasons + Holi, Raksha Bandhan, Independence Day, Navratri, Republic Day).
   Admin picks the season (Admin menu > Season Theme), saved in table site_season (supabase_v66_season.sql).
   Shows the cached season instantly, then checks Supabase. Never breaks the store. */
(function () {
  try {
    if (window.aashapuraSeasons) return;
    var KEY = "aashapura_season";
    var HERB_ALL = ["tulsi", "tulsi", "neem", "neem", "ashwagandha", "amla", "brahmi", "giloy", "aloe", "moringa", "haldi", "shatavari", "pudina", "pudina", "kamal", "gudhal", "gulab", "dalchini", "elaichi", "methi"];

    /* ---------- the 12 combos: colours + particles + headline text ---------- */
    /* z = hero card colours (jewel panel). Z() fills the chip colours + gold foil. dark=1: deep jewel panel, dark=0: light frosted panel */
    var Z = function (p1, p2, ink, sub, g1, g2, ln, m1, m2, dark, glow, foil) {
      return { p1: p1, p2: p2, ink: ink, sub: sub, g1: g1, g2: g2, ln: ln, m1: m1, m2: m2, glow: glow, a: dark ? .95 : .86,
        cbg: dark ? "rgba(255,255,255,.09)" : "rgba(255,255,255,.78)", cln: dark ? "rgba(255,255,255,.30)" : "rgba(60,40,20,.16)", cink: ink, foil: foil || [g1, g2] };
    };
    var SEASONS = [
      { id: "herbal", emoji: "🌿", name: "Herbal Green", note: "Classic Ayurveda, all year", em: "herbal", mand: "lotus",
        z: Z("12,52,37", "24,84,58", "#fbf3d8", "rgba(251,243,216,.86)", "#f3d27a", "#c9952f", ["#f3d27a", "#a87a22", "#f3d27a"], "#0e3b2a", "#1d6b4a", 1, "rgba(201,149,47,.5)"),
        tint: ["rgba(217,179,106,.30)", "rgba(60,140,90,.20)", "rgba(255,255,255,.35)"], herbs: HERB_ALL, extra: null, density: 1,
        spark: { n: [14, 24], color: "#f3c85a", glow: "rgba(230,180,70,.65)" }, mist: "rgba(120,180,140,.20)",
        c: { ink: "#123c2b", accent: "#8f6a22", sub: "#3f4a40", halo: "251,247,236", b1: "#d9b36a", b2: "#b8893b", bi: "#2b1d05", chip: "#c9a45a" },
        t: { eye: "AASHAPURA AYURVEDA", h: "Nature's power,", em: "Ayurveda's tradition", sub: "Tulsi, Neem, Ashwagandha, Amla — made from pure herbs.", btn: "Shop Now", chips: ["🌿 Tulsi", "🍃 Neem", "🌱 Ashwagandha", "🟡 Haldi", "🌸 Rose", "🪷 Lotus"] } },
      { id: "monsoon", emoji: "🌧️", name: "Monsoon", note: "Rain + fresh green leaves", em: "monsoon", mand: "ripple",
        z: Z("16,44,66", "28,82,104", "#eaf8f7", "rgba(234,248,247,.86)", "#d3f3ec", "#6fc9c0", ["#cdeee8", "#5fb6ae", "#cdeee8"], "#0e3350", "#2a7a86", 1, "rgba(95,182,174,.5)"),
        tint: ["rgba(110,170,200,.30)", "rgba(70,150,110,.22)", "rgba(255,255,255,.30)"], herbs: ["tulsi", "pudina", "brahmi", "neem", "giloy", "moringa", "methi", "aloe"], extra: "rain", density: .55,
        spark: { n: [4, 8], color: "#9ad0e6", glow: "rgba(110,170,210,.6)" }, mist: "rgba(100,150,190,.26)",
        c: { ink: "#0e3b43", accent: "#1b6a7a", sub: "#37484c", halo: "243,248,247", b1: "#8fd6cb", b2: "#4fb0a6", bi: "#021c1a", chip: "#7db8b2" },
        t: { eye: "MONSOON WELLNESS", h: "Fresh as the rain,", em: "strong from within", sub: "Giloy, Tulsi, Neem & Brahmi — immunity care for the rainy season.", btn: "Boost Immunity", chips: ["🌧️ Giloy", "🌿 Tulsi", "🍃 Neem", "🌱 Brahmi", "🍵 Kadha", "🛡️ Immunity"] } },
      { id: "winter", emoji: "❄️", name: "Winter", note: "Soft snow + warming herbs", em: "winter", mand: "flake",
        z: Z("246,249,255", "214,228,246", "#1c2f4d", "#3d4a5e", "#a9741c", "#e0b44f", ["#d9b45a", "#8a5a14", "#d9b45a"], "#1c2f4d", "#3a5d99", 0, "rgba(58,93,153,.35)"),
        tint: ["rgba(150,180,220,.32)", "rgba(200,170,120,.20)", "rgba(255,255,255,.40)"], herbs: ["ashwagandha", "giloy", "haldi", "dalchini", "elaichi", "tulsi", "shatavari", "amla", "flake", "flake"], extra: "snow", density: .6,
        spark: { n: [8, 14], color: "#f3c85a", glow: "rgba(230,180,70,.6)" }, mist: "rgba(140,170,210,.24)",
        c: { ink: "#1c2f4d", accent: "#8a5a14", sub: "#3d4a5e", halo: "246,248,252", b1: "#e6c36a", b2: "#b8893b", bi: "#2b1d05", chip: "#a9b8d0" },
        t: { eye: "WINTER WARMTH", h: "Warm from within,", em: "protected all season", sub: "Ashwagandha, Haldi, Dalchini & Elaichi — warmth and immunity for cold days.", btn: "Shop Winter Care", chips: ["❄️ Ashwagandha", "🟡 Haldi", "🍁 Dalchini", "🌿 Tulsi", "🛡️ Immunity", "💪 Strength"] } },
      { id: "spring", emoji: "🌸", name: "Spring Bloom", note: "Falling flower petals", em: "spring", mand: "life",
        z: Z("255,245,248", "251,224,234", "#5a1f3b", "#5a4350", "#a02c5a", "#e0668d", ["#e8a0ba", "#a02c5a", "#e8a0ba"], "#7d2a52", "#c9568a", 0, "rgba(160,44,90,.35)"),
        tint: ["rgba(244,170,190,.34)", "rgba(150,205,140,.24)", "rgba(255,255,255,.38)"], herbs: ["gulab", "kamal", "gudhal", "gulab", "tulsi", "pudina", "kamal", "gudhal", "brahmi", "shatavari"], extra: null, density: 1,
        spark: { n: [12, 20], color: "#f7a8c0", glow: "rgba(240,130,170,.6)" }, mist: "rgba(240,160,185,.22)",
        c: { ink: "#5a1f3b", accent: "#a02c5a", sub: "#5a4350", halo: "253,246,248", b1: "#f7b3c8", b2: "#e0668d", bi: "#2a0716", chip: "#e3a3ba" },
        t: { eye: "VASANT · SPRING", h: "Bloom with", em: "nature's freshness", sub: "Rose, Lotus & Hibiscus care — skin and hair glow for the new season.", btn: "Shop Skin & Hair", chips: ["🌹 Rose", "🪷 Lotus", "🌺 Hibiscus", "🌿 Aloe", "✨ Skin Care", "💇 Hair Care"] } },
      { id: "summer", emoji: "☀️", name: "Summer Cool", note: "Sun rays + cooling herbs", em: "summer", mand: "sun",
        z: Z("255,252,232", "212,244,228", "#0f4a3a", "#3f4f45", "#b57a00", "#f2b90c", ["#f0c63d", "#2fa27a", "#f0c63d"], "#0a5a4a", "#2fa27a", 0, "rgba(242,185,12,.4)"),
        tint: ["rgba(255,220,120,.36)", "rgba(120,200,170,.26)", "rgba(255,255,255,.40)"], herbs: ["pudina", "aloe", "pudina", "tulsi", "amla", "kamal", "moringa", "brahmi", "shatavari"], extra: "rays", density: .9,
        spark: { n: [12, 22], color: "#ffd84d", glow: "rgba(255,200,60,.7)" }, mist: "rgba(130,210,180,.22)",
        c: { ink: "#0f4a3a", accent: "#8a5d00", sub: "#3f4f45", halo: "252,250,238", b1: "#7fd6b0", b2: "#2fa27a", bi: "#052e22", chip: "#8fd0b4" },
        t: { eye: "GRISHMA · SUMMER", h: "Stay cool,", em: "stay refreshed", sub: "Pudina, Aloe, Amla & Brahmi — cooling care for the hot season.", btn: "Shop Cooling Care", chips: ["🍃 Pudina", "🌵 Aloe Vera", "🍋 Amla", "🌿 Brahmi", "🧊 Cooling", "✨ Skin Care"] } },
      { id: "autumn", emoji: "🍂", name: "Autumn", note: "Golden falling leaves", em: "autumn", mand: "leafring",
        z: Z("74,36,18", "112,56,24", "#fff1d8", "rgba(255,241,216,.86)", "#ffd28a", "#e8892a", ["#ffcf80", "#b8651c", "#ffcf80"], "#4a2412", "#9a4a10", 1, "rgba(232,137,42,.5)"),
        tint: ["rgba(235,160,80,.36)", "rgba(170,90,50,.18)", "rgba(255,255,255,.32)"], herbs: ["maple", "aleaf", "aleaf2", "maple", "aleaf", "aleaf2", "haldi", "dalchini", "tulsi"], extra: null, density: 1,
        spark: { n: [10, 18], color: "#f0a23a", glow: "rgba(230,140,40,.65)" }, mist: "rgba(220,150,90,.22)",
        c: { ink: "#4a2412", accent: "#9a4a10", sub: "#5a463a", halo: "253,247,238", b1: "#f2b25c", b2: "#cf7a1f", bi: "#2d1503", chip: "#e0b27e" },
        t: { eye: "SHARAD · AUTUMN", h: "Golden days,", em: "grounded wellness", sub: "Haldi, Dalchini & Tulsi — gentle immunity as the seasons turn.", btn: "Shop Immunity", chips: ["🍂 Haldi", "🍁 Dalchini", "🌿 Tulsi", "🍵 Digestion", "🛡️ Immunity", "💪 Wellness"] } },
      { id: "festive", emoji: "🪔", name: "Festive Diwali", note: "Marigold + golden sparks", em: "festive", mand: "star",
        z: Z("68,10,22", "112,22,30", "#fff0cf", "rgba(255,240,207,.88)", "#ffe08a", "#f0a02a", ["#ffe08a", "#d9861c", "#ffe08a"], "#4a0d16", "#a82a25", 1, "rgba(240,160,42,.55)"),
        tint: ["rgba(255,170,60,.40)", "rgba(190,40,60,.16)", "rgba(255,235,190,.40)"], herbs: ["genda", "genda", "gulab", "gudhal", "genda", "kamal", "genda"], extra: null, density: .9,
        spark: { n: [28, 46], color: "#ffcf4d", glow: "rgba(255,190,50,.8)" }, mist: "rgba(255,190,90,.24)",
        c: { ink: "#5a1218", accent: "#9b4a06", sub: "#5a3a2a", halo: "255,247,232", b1: "#ffd36a", b2: "#e8942a", bi: "#3a1503", chip: "#e6b36a" },
        t: { eye: "FESTIVE SPECIAL", h: "Light up your", em: "festive wellness", sub: "Pure herbal gifts and care for you and your family.", btn: "Shop Festive Gifts", chips: ["🪔 Festive Gifts", "🌼 Genda", "🌹 Rose", "✨ Pure Herbal", "🎁 Combos", "🛍️ Offers"] } },

      /* ===== NEW in v7: 5 occasion combos ===== */
      { id: "holi", emoji: "🎨", name: "Holi", note: "Gulaal colours + petals", em: "holi", mand: "dots",
        z: Z("46,22,92", "86,38,128", "#fff7ec", "rgba(255,247,236,.88)", "#ffd23f", "#ff7a45", ["#ff3d81", "#ffd23f", "#3ddc84", "#2dc4ff", "#b455ff", "#ff3d81"], "#3a1a74", "#8a3fd0", 1, "rgba(255,122,69,.5)", ["#ffd23f", "#ff7ab8", "#7ae0ff", "#8bf08e", "#ffd23f"]),
        tint: ["rgba(255,100,170,.30)", "rgba(70,190,240,.24)", "rgba(255,230,90,.30)"], bgx: "radial-gradient(60% 40% at 92% 2%,rgba(255,80,150,.34),transparent 70%),radial-gradient(55% 40% at 2% 98%,rgba(40,190,245,.30),transparent 70%),radial-gradient(50% 35% at 50% 46%,rgba(255,225,70,.26),transparent 70%),radial-gradient(45% 35% at 100% 68%,rgba(60,220,130,.22),transparent 70%),radial-gradient(45% 30% at 0% 28%,rgba(170,90,255,.22),transparent 70%)",
        blobs: ["rgba(255,61,129,.42)", "rgba(45,196,255,.36)", "rgba(255,210,63,.46)", "rgba(61,220,132,.34)"],
        herbs: ["puffp", "puffy", "puffg", "puffb", "puffo", "gulab", "genda", "puffp", "gudhal", "puffy", "puffb", "puffg"], extra: null, density: .75,
        spark: { n: [16, 28], color: "#ffe066", glow: "rgba(255,150,80,.7)" }, mist: "rgba(255,120,200,.20)",
        c: { ink: "#3a1a5e", accent: "#a8266e", sub: "#4a3a5a", halo: "253,246,250", b1: "#ffd23f", b2: "#ff7a45", bi: "#3a0f1a", chip: "#e3a3d0" },
        t: { eye: "HOLI SPECIAL", h: "Play with colours,", em: "protect with herbs", sub: "Haldi, Aloe, Gulab & Neem — gentle skin and hair care for the festival of colours.", btn: "Shop Holi Care", chips: ["🎨 Holi Care", "🟡 Haldi", "🌵 Aloe Vera", "🌹 Gulab", "💇 Hair Care", "🎁 Combos"] } },
      { id: "rakhi", emoji: "🎀", name: "Raksha Bandhan", note: "Rakhi threads + gifting", em: "rakhi", mand: "beads",
        z: Z("255,248,240", "255,228,216", "#7a1428", "#5a3a3e", "#b8892b", "#e5b64f", ["#e5b64f", "#c2262e", "#e5b64f"], "#9b1d2c", "#d9454f", 0, "rgba(194,38,46,.35)", ["#9b6a12", "#e5b64f", "#a8761a"]),
        tint: ["rgba(240,140,150,.34)", "rgba(235,190,100,.24)", "rgba(255,255,255,.40)"], herbs: ["rakhi", "gulab", "kamal", "moti", "genda", "rakhi", "gulab", "moti", "gudhal"], extra: null, density: .8,
        spark: { n: [14, 24], color: "#ffcf6a", glow: "rgba(240,150,120,.7)" }, mist: "rgba(245,150,160,.22)",
        c: { ink: "#7a1428", accent: "#b01e3a", sub: "#5a3a3e", halo: "255,247,242", b1: "#f2c86a", b2: "#d9892a", bi: "#3a0a10", chip: "#e5b08a" },
        t: { eye: "RAKSHA BANDHAN", h: "A thread of love,", em: "a gift of health", sub: "Gift your brother or sister pure Ayurvedic care — wellness combos made with love.", btn: "Shop Rakhi Gifts", chips: ["🎀 Rakhi Gifts", "🎁 Combos", "🌹 Rose", "🪷 Lotus", "💪 Strength", "✨ Pure Herbal"] } },
      { id: "independence", emoji: "🇮🇳", name: "Independence Day", note: "Tiranga + rising kites", em: "independence", mand: "chakra",
        z: Z("255,255,255", "228,242,255", "#0a2a6b", "#3a4a66", "#e8800c", "#1a7a1a", ["#ff9933", "#ffd8a8", "#a8e0a8", "#138808"], "#0a2a6b", "#2450b8", 0, "rgba(255,153,51,.4)", ["#e8800c", "#f59a2a", "#1a7a1a"]),
        tint: ["rgba(255,153,51,.30)", "rgba(19,136,8,.22)", "rgba(255,255,255,.4)"], bgx: "linear-gradient(180deg,rgba(255,153,51,.34) 0%,rgba(255,153,51,.08) 24%,rgba(255,255,255,.10) 48%,rgba(19,136,8,.10) 72%,rgba(19,136,8,.30) 100%)", bgch: true,
        herbs: ["kite", "genda", "mogra", "tulsi", "kite", "genda", "mogra", "neem", "kite"], extra: "up", density: .7,
        spark: { n: [10, 18], color: "#ffb347", glow: "rgba(255,153,51,.7)" }, mist: "rgba(120,180,255,.20)",
        c: { ink: "#0a2a6b", accent: "#b8560a", sub: "#3a4a66", halo: "250,252,255", b1: "#ffb04a", b2: "#ff8c1a", bi: "#3a1a00", chip: "#a9bbe0" },
        t: { eye: "INDEPENDENCE DAY", h: "Proudly Indian,", em: "purely Ayurvedic", sub: "15 August — Tulsi, Neem, Ashwagandha & Amla, India's own wisdom of wellness.", btn: "Shop Indian Herbs", chips: ["🇮🇳 Indian Herbs", "🌿 Tulsi", "🍃 Neem", "💪 Strength", "🛡️ Immunity", "🎁 Combos"] } },
      { id: "navratri", emoji: "🪔", name: "Navratri", note: "Nine nights, garba colours", em: "navratri", mand: "nine",
        z: Z("92,14,52", "150,28,70", "#fff1dc", "rgba(255,241,220,.88)", "#ffd36a", "#ff9a2e", ["#ffd36a", "#ff6aa0", "#ff9a2e", "#ffd36a"], "#7a0f3a", "#d6336c", 1, "rgba(255,154,46,.55)"),
        tint: ["rgba(255,120,60,.34)", "rgba(200,30,90,.20)", "rgba(255,220,140,.34)"], bgx: "radial-gradient(65% 42% at 90% 0%,rgba(255,120,60,.36),transparent 70%),radial-gradient(60% 40% at 4% 100%,rgba(214,51,108,.26),transparent 70%),radial-gradient(50% 36% at 50% 48%,rgba(255,215,120,.34),transparent 70%)",
        herbs: ["genda", "gudhal", "rang", "genda", "gulab", "rang", "genda", "gudhal", "rang"], extra: null, density: .9,
        spark: { n: [28, 46], color: "#ffcf4d", glow: "rgba(255,150,60,.85)" }, mist: "rgba(255,120,120,.22)",
        c: { ink: "#6a0f2e", accent: "#b3265c", sub: "#5a3a3a", halo: "255,246,240", b1: "#ffd36a", b2: "#ff8c2e", bi: "#3a0a14", chip: "#e6a06a" },
        t: { eye: "NAVRATRI SPECIAL", h: "Nine nights of", em: "shakti & wellness", sub: "Shatavari, Ashwagandha, Amla & Giloy — strength and energy for the festive days.", btn: "Shop Navratri Care", chips: ["🪔 Navratri", "💪 Strength", "🌼 Genda", "🌿 Giloy", "🛡️ Immunity", "🎁 Combos"] } },
      { id: "republic", emoji: "🇮🇳", name: "Republic Day", note: "Navy, gold + Ashoka Chakra", em: "republic", mand: "chakra",
        z: Z("10,30,84", "22,52,128", "#fff8e6", "rgba(255,248,230,.88)", "#ffd36a", "#e8a52a", ["#ff9933", "#ffffff", "#138808"], "#08205e", "#2450b8", 1, "rgba(255,211,106,.5)", ["#ffd36a", "#fff6cf", "#ffd36a"]),
        tint: ["rgba(255,153,51,.26)", "rgba(19,136,8,.20)", "rgba(255,255,255,.4)"], bgx: "linear-gradient(180deg,rgba(255,153,51,.26) 0%,rgba(255,255,255,.08) 34%,rgba(255,255,255,.08) 62%,rgba(19,136,8,.26) 100%),radial-gradient(60% 38% at 50% 30%,rgba(20,50,140,.14),transparent 72%)", bgch: true,
        herbs: ["genda", "mogra", "chakra", "tulsi", "genda", "mogra", "chakra", "pudina", "genda"], extra: null, density: .85,
        spark: { n: [14, 24], color: "#ffd36a", glow: "rgba(255,190,70,.75)" }, mist: "rgba(120,150,230,.20)",
        c: { ink: "#0a2a6b", accent: "#a35208", sub: "#3a4a66", halo: "250,252,255", b1: "#ffd36a", b2: "#f0a42a", bi: "#2b1d05", chip: "#a9bbe0" },
        t: { eye: "REPUBLIC DAY", h: "Healthy citizens,", em: "a strong Republic", sub: "26 January — honour the day with India's oldest science of wellness, pure Ayurvedic care for every family.", btn: "Shop Ayurvedic Care", chips: ["🇮🇳 Jai Hind", "🌿 Tulsi", "💪 Strength", "🛡️ Immunity", "🍵 Digestion", "🎁 Combos"] } }
    ];
    var byId = function (id) { for (var i = 0; i < SEASONS.length; i++) if (SEASONS[i].id === id) return SEASONS[i]; return SEASONS[0]; };
    var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
    var r = function (a, b) { return a + Math.random() * (b - a); };

    /* ---------- svg symbols ---------- */
    var S = function (id, body) { return '<symbol id="hh-' + id + '" viewBox="0 0 40 40">' + body + '</symbol>'; };
    var grad = function (id, a, b, v) { return '<linearGradient id="hg-' + id + '" x1="0" y1="0" x2="' + (v ? 0 : 1) + '" y2="1"><stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>'; };
    /* ---------- v7 helpers: mandala, emblems, new particle symbols ---------- */
    var rot = function (n, f, off, span, c) { var o = "", i; c = c || "0 0"; for (i = 0; i < n; i++) o += '<g transform="rotate(' + ((off || 0) + i * (span || 360) / n) + " " + c + ')">' + f + "</g>"; return o; };
    var petal = function (len, w) { return '<path d="M0 0C' + w + " " + (-len * .35) + " " + w + " " + (-len * .75) + " 0 " + (-len) + "C" + (-w) + " " + (-len * .75) + " " + (-w) + " " + (-len * .35) + ' 0 0z"/>'; };
    var MAND = {
      lotus: function () { return rot(12, petal(92, 16)) + rot(12, petal(68, 12), 15) + rot(8, petal(44, 10)) + '<circle r="96"/><circle r="30"/><circle r="10"/>'; },
      ripple: function () { return '<circle r="14"/><circle r="30"/><circle r="48" stroke-dasharray="3 5"/><circle r="68"/><circle r="90" stroke-dasharray="2 6"/>' + rot(12, '<path d="M0 -14V-30M0 -68V-90"/>'); },
      flake: function () { return rot(6, '<path d="M0 0V-92M0 -30L-14 -44M0 -30L14 -44M0 -55L-20 -75M0 -55L20 -75M0 -76L-12 -90M0 -76L12 -90"/>') + '<circle r="96"/><circle r="20"/>'; },
      life: function () { return '<circle r="30"/>' + rot(6, '<circle cy="-30" r="30"/>') + rot(6, '<circle cy="-60" r="30"/>', 30) + '<circle r="92"/>'; },
      sun: function () { return rot(16, '<path d="M0 -38L7 -62L0 -92L-7 -62z"/>') + rot(16, '<path d="M0 -38L4 -50L0 -62L-4 -50z"/>', 11.25) + '<circle r="38"/><circle r="30"/>'; },
      leafring: function () { return rot(8, petal(92, 26)) + rot(8, petal(60, 18), 22.5) + '<circle r="96"/><circle r="14"/>'; },
      star: function () { return rot(8, '<rect x="-52" y="-52" width="104" height="104"/>', 0, 90) + '<circle r="92"/><circle r="50"/><circle r="20"/>'; },
      dots: function () { var o = '<circle r="94"/><circle r="8"/>', rr = [22, 44, 66, 86], nn = [8, 14, 20, 26], i; for (i = 0; i < 4; i++) o += rot(nn[i], '<circle cy="' + (-rr[i]) + '" r="3.4"/>'); return o; },
      nine: function () { return rot(9, petal(90, 20)) + rot(9, petal(62, 14), 20) + rot(9, '<circle cy="-40" r="7"/>') + rot(9, '<circle cy="-76" r="3"/>', 20) + '<circle r="96"/><circle r="18"/>'; },
      beads: function () { return rot(12, petal(88, 15)) + rot(24, '<circle cy="-70" r="4"/>') + '<circle r="96"/><circle r="36"/><circle r="12"/>'; },
      chakra: function () { return '<circle r="94"/><circle r="88"/><circle r="12"/><circle r="5"/>' + rot(24, '<path d="M0 -14V-80"/>') + rot(24, '<circle cy="-84" r="2.4"/>', 7.5) + rot(24, '<path d="M-2.2 -80L0 -87L2.2 -80"/>'); }
    };
    var mandala = function (t) { return '<svg viewBox="-100 -100 200 200" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' + (MAND[t] || MAND.lotus)() + "</svg>"; };

    var E = function (id, body) { return '<symbol id="he-' + id + '" viewBox="0 0 64 64">' + body + "</symbol>"; };
    var S6 = function (id, body) { return '<symbol id="hh-' + id + '" viewBox="0 0 64 64">' + body + "</symbol>"; };
    var band = function (y0, y1, fill) { return '<path d="M17 ' + y0 + " C25 " + (y0 - 5) + " 31 " + (y0 + 5) + " 39 " + y0 + " C47 " + (y0 - 5) + " 51 " + (y0 - 4) + " 55 " + (y0 + 1) + " L55 " + (y1 + 1) + " C51 " + (y1 - 4) + " 47 " + (y1 - 5) + " 39 " + y1 + " C31 " + (y1 + 5) + " 25 " + (y1 - 5) + " 17 " + y1 + 'z" fill="' + fill + '"/>'; };
    var holiDots = function () { var cols = ["#ff3d81", "#ffd23f", "#3ddc84", "#2dc4ff", "#ff8a2b", "#b455ff", "#ff3d81", "#ffd23f"], o = "", i, a, x, y; for (i = 0; i < 8; i++) { a = i * Math.PI / 4; x = 32 + 20 * Math.sin(a); y = 32 - 20 * Math.cos(a); o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6.2" fill="' + cols[i] + '"/>'; a += Math.PI / 8; x = 32 + 28.5 * Math.sin(a); y = 32 - 28.5 * Math.cos(a); o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.4" fill="' + cols[(i + 3) % 8] + '"/>'; } return o + '<circle cx="32" cy="32" r="10" fill="#ff3d81"/><circle cx="32" cy="32" r="5" fill="#ffd23f"/>'; };
    var rakhiBody = '<path d="M16 36C5 38 4 51 12 57" stroke="#ff6a5a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M48 36C59 38 60 51 52 57" stroke="#ff6a5a" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="12" cy="58" r="3.2" fill="url(#hg-gold)"/><circle cx="52" cy="58" r="3.2" fill="url(#hg-gold)"/>' +
      rot(8, '<circle cx="32" cy="14" r="6.5" fill="url(#hg-gold)" stroke="#7a5412" stroke-width=".7"/>', 0, 360, "32 28") +
      '<circle cx="32" cy="28" r="10.5" fill="#c2262e" stroke="url(#hg-gold)" stroke-width="2"/><circle cx="32" cy="28" r="4.6" fill="url(#hg-gold)"/><circle cx="30" cy="26" r="1.4" fill="#fff" opacity=".7"/>';
    var puff = function (k, col) { return '<radialGradient id="hp-' + k + '"><stop offset="0" stop-color="' + col + '" stop-opacity=".95"/><stop offset=".6" stop-color="' + col + '" stop-opacity=".55"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></radialGradient>'; };
    var puffSym = function (k) { return S("puff" + k, '<circle cx="20" cy="20" r="19" fill="url(#hp-' + k + ')"/><circle cx="12" cy="24" r="10" fill="url(#hp-' + k + ')"/><circle cx="27" cy="13" r="9" fill="url(#hp-' + k + ')"/>'); };

    var EXTRA =
      '<linearGradient id="hg-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff2b8"/><stop offset=".55" stop-color="#f0c04e"/><stop offset="1" stop-color="#b9801f"/></linearGradient>' +
      '<linearGradient id="hg-sil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b8c9de"/></linearGradient>' +
      '<linearGradient id="hg-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".6" stop-color="#ffb52e"/><stop offset="1" stop-color="#ff6a1a"/></linearGradient>' +
      '<radialGradient id="hg-glow"><stop offset="0" stop-color="#ffd96a" stop-opacity=".85"/><stop offset="1" stop-color="#ffd96a" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="hg-pearl" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#f3e9ee"/><stop offset="1" stop-color="#cdb9c4"/></radialGradient>' +
      puff("p", "#ff3d81") + puff("y", "#ffd23f") + puff("g", "#3ddc84") + puff("b", "#2dc4ff") + puff("o", "#ff8a2b") +
      puffSym("p") + puffSym("y") + puffSym("g") + puffSym("b") + puffSym("o") +
      S("rang", rot(8, '<ellipse cx="20" cy="9" rx="3.4" ry="7" fill="#ff4f8b"/>', 0, 360, "20 20") + rot(8, '<circle cx="20" cy="4.5" r="1.7" fill="#ffd23f"/>', 22.5, 360, "20 20") + '<circle cx="20" cy="20" r="4.6" fill="#ffb000"/><circle cx="20" cy="20" r="2" fill="#c2185b"/>') +
      S("kite", '<path d="M20 2L32 14L20 14.5z" fill="#ff9933"/><path d="M20 2L8 14L20 14.5z" fill="#ff9933"/><path d="M8 14L20 27L20 14.5z" fill="#fff"/><path d="M32 14L20 27L20 14.5z" fill="#138808"/><path d="M20 2L32 14L20 27L8 14z" fill="none" stroke="#6b4310" stroke-width=".9"/><path d="M20 2V27M8 14H32" stroke="#6b4310" stroke-width=".6"/><path d="M20 27C15 29 25 31 20 33S15 36 20 38" stroke="#ff9933" fill="none" stroke-width="1.5"/><circle cx="20" cy="33" r="1.3" fill="#138808"/>') +
      S("mogra", rot(5, '<ellipse cx="20" cy="11" rx="4.6" ry="8" fill="#fff" stroke="#e3dcc4" stroke-width=".8"/>', 0, 360, "20 20") + '<circle cx="20" cy="20" r="3" fill="#ffd96a"/>') +
      S("chakra", '<circle cx="20" cy="20" r="14" fill="none" stroke="#1d3f99" stroke-width="2"/><circle cx="20" cy="20" r="2.4" fill="#1d3f99"/>' + rot(12, '<path d="M20 8V17" stroke="#1d3f99" stroke-width="1.1"/>', 0, 360, "20 20")) +
      S6("rakhi", rakhiBody) +
      S("moti", '<circle cx="20" cy="20" r="11" fill="url(#hg-pearl)"/><circle cx="16.5" cy="16.5" r="2.6" fill="#fff" opacity=".85"/>') +
      /* emblems for the hero medallion (64 x 64) */
      E("herbal", '<g fill="url(#hg-gold)" stroke="#7a5412" stroke-width=".8" stroke-linejoin="round"><path d="M32 10C41 20 41 34 32 46C23 34 23 20 32 10z"/><path d="M32 46C19 45 9 36 10 24C21 25 29 33 32 46z"/><path d="M32 46C45 45 55 36 54 24C43 25 35 33 32 46z"/></g><path d="M32 49C22 51 14 49 7 43C17 40 26 42 32 49z" fill="#8fd49a" stroke="#1f6b3a" stroke-width=".8"/><path d="M32 49C42 51 50 49 57 43C47 40 38 42 32 49z" fill="#8fd49a" stroke="#1f6b3a" stroke-width=".8"/>') +
      E("monsoon", '<path d="M20 40h24a9 9 0 0 0 1.5-17.9A12 12 0 0 0 22 20a10 10 0 0 0-2 20z" fill="url(#hg-sil)"/><path d="M22 46l-3 8M32 46l-3 8M42 46l-3 8" stroke="#8fe0ff" stroke-width="3" stroke-linecap="round"/>') +
      E("winter", '<g stroke="#eaf4ff" stroke-width="2.6" stroke-linecap="round" fill="none">' + rot(6, '<path d="M32 32V9M32 19l-6-5M32 19l6-5M32 27l-8-6M32 27l8-6"/>', 0, 360, "32 32") + '</g><circle cx="32" cy="32" r="3.4" fill="#bfe0ff"/>') +
      E("spring", rot(5, '<ellipse cx="32" cy="17" rx="8.6" ry="12" fill="url(#hg-p)" stroke="#d4577f" stroke-width=".8"/>', 0, 360, "32 32") + '<circle cx="32" cy="32" r="6" fill="url(#hg-gold)"/>' + rot(5, '<circle cx="32" cy="25.5" r="1.6" fill="#fff"/>', 36, 360, "32 32")) +
      E("summer", '<circle cx="32" cy="32" r="12" fill="url(#hg-gold)"/><circle cx="32" cy="32" r="16" fill="none" stroke="#ffe08a" stroke-width="1" stroke-dasharray="2 3"/>' + rot(12, '<path d="M32 7v9" stroke="#ffd96a" stroke-width="3.2" stroke-linecap="round"/>', 0, 360, "32 32") + rot(12, '<path d="M32 3v2" stroke="#ffd96a" stroke-width="2" stroke-linecap="round"/>', 15, 360, "32 32")) +
      E("autumn", '<g transform="translate(0 0) scale(1.6)"><path d="M20 3l3.5 7 6-2-2 7 7 1-5 5 4 6-8-1v7h-3v-7l-8 1 4-6-5-5 7-1-2-7 6 2z" fill="url(#hg-a)"/><path d="M20 12v24" stroke="#8a3a10" stroke-width="1.3"/></g>') +
      E("festive", '<circle cx="32" cy="26" r="20" fill="url(#hg-glow)"/><path d="M32 8C40 17 41 26 32 33C23 26 24 17 32 8z" fill="url(#hg-flame)"/><path d="M32 18C35.5 22 35.5 26 32 29C28.5 26 28.5 22 32 18z" fill="#fff6c8"/><path d="M8 37C10 49 22 55 32 55C42 55 54 49 56 37C46 42 18 42 8 37z" fill="url(#hg-gold)" stroke="#7a5412" stroke-width=".9"/><ellipse cx="32" cy="37" rx="24" ry="4" fill="#8a4a0a"/><path d="M30 35.5h4" stroke="#3a1a05" stroke-width="2" stroke-linecap="round"/>') +
      E("holi", holiDots()) +
      E("navratri", '<path d="M32 22C22 20 16 14 15 8C24 9 30 14 32 22z" fill="#3fa35a"/><path d="M32 22C42 20 48 14 49 8C40 9 34 14 32 22z" fill="#2f8a46"/><path d="M32 22C28 15 28 9 32 4C36 9 36 15 32 22z" fill="#58c071"/><path d="M21 26C13 36 15 52 25 56H39C49 52 51 36 43 26z" fill="url(#hg-gold)" stroke="#7a5412" stroke-width=".9"/><rect x="22" y="22" width="20" height="5" rx="2" fill="#f0c04e" stroke="#7a5412" stroke-width=".8"/><path d="M17.5 37Q32 44 46.5 37" stroke="#c2262e" stroke-width="2.2" fill="none"/><g fill="#c2262e"><circle cx="24" cy="47" r="1.5"/><circle cx="32" cy="49" r="1.5"/><circle cx="40" cy="47" r="1.5"/></g><circle cx="32" cy="15" r="6.8" fill="#8a5a2a" stroke="#4a2c10" stroke-width=".8"/><circle cx="30" cy="13" r="2" fill="#c89a62" opacity=".8"/>') +
      E("rakhi", rakhiBody) +
      E("independence", '<path d="M16 8V58" stroke="#f3d27a" stroke-width="3" stroke-linecap="round"/><circle cx="16" cy="7.5" r="3" fill="#f3d27a"/>' + band(10, 22, "#ff9933") + band(22, 34, "#ffffff") + band(34, 46, "#138808") + '<circle cx="36" cy="28" r="4.6" fill="none" stroke="#0a2a6b" stroke-width="1.2"/><circle cx="36" cy="28" r=".9" fill="#0a2a6b"/>' + rot(8, '<path d="M36 23.8V32.2" stroke="#0a2a6b" stroke-width=".7"/>', 0, 180, "36 28")) +
      E("republic", '<circle cx="32" cy="32" r="21" fill="none" stroke="#ffd36a" stroke-width="2.8"/><circle cx="32" cy="32" r="26" fill="none" stroke="#ffd36a" stroke-width="1" stroke-dasharray="1.5 3.5"/><circle cx="32" cy="32" r="3.6" fill="#ffd36a"/>' + rot(24, '<path d="M32 13.5V28" stroke="#ffd36a" stroke-width="1.3"/>', 0, 360, "32 32"));

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
      EXTRA + '</defs></svg>';

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

    /* premium hero card: jewel panel + gold frame + medallion emblem + faint mandala (built once, filled per season) */
    (function dress() {
      var h = document.querySelector(".herb-hero"); if (!h || h.querySelector(".hh-card")) return;
      var card = document.createElement("div"); card.className = "hh-card";
      while (h.firstChild) card.appendChild(h.firstChild);
      card.insertAdjacentHTML("afterbegin", '<div class="hh-mw" aria-hidden="true"></div><i class="hh-dm a"></i><i class="hh-dm b"></i><i class="hh-dm c"></i><i class="hh-dm d"></i><div class="hh-medal" aria-hidden="true"><svg viewBox="0 0 64 64"><use href="#he-herbal"/></svg></div>');
      h.appendChild(card);
    })();

    var cur = null;

    function paintVars(s) {
      var rt = document.documentElement.style, c = s.c;
      rt.setProperty("--sz-ink", c.ink); rt.setProperty("--sz-accent", c.accent); rt.setProperty("--sz-sub", c.sub);
      rt.setProperty("--sz-halo", c.halo); rt.setProperty("--sz-b1", c.b1); rt.setProperty("--sz-b2", c.b2);
      rt.setProperty("--sz-bi", c.bi); rt.setProperty("--sz-chip", c.chip);
      bg.style.setProperty("--sz-spark", s.spark.color); bg.style.setProperty("--sz-sparkg", s.spark.glow); bg.style.setProperty("--sz-mist", s.mist);
      bg.style.background = s.bgx || "radial-gradient(70% 45% at 88% 0%," + s.tint[0] + ",transparent 70%),radial-gradient(60% 40% at 4% 100%," + s.tint[1] + ",transparent 70%),radial-gradient(50% 35% at 50% 50%," + s.tint[2] + ",transparent 70%)";
      var z = s.z, P = function (k, v) { rt.setProperty("--hz-" + k, v); };
      P("p1", z.p1); P("p2", z.p2); P("a", z.a); P("ink", z.ink); P("sub", z.sub); P("g1", z.g1); P("g2", z.g2); P("m1", z.m1); P("m2", z.m2);
      P("glow", z.glow); P("cbg", z.cbg); P("cln", z.cln); P("cink", z.cink);
      P("ln", "linear-gradient(135deg," + z.ln.join(",") + ")"); P("foil", "linear-gradient(100deg," + z.foil.join(",") + ")");
    }

    function paintText(s, animate) {
      var h = document.querySelector(".herb-hero"); if (!h) return;
      var t = s.t, q = function (sel) { return h.querySelector(sel); };
      var eye = q(".hh-eye"), h2 = q("h2"), sub = q(".hh-sub"), btn = q(".hh-btn"), names = q(".hh-names");
      var use = h.querySelector(".hh-medal use"), mw = h.querySelector(".hh-mw");
      if (use) use.setAttribute("href", "#he-" + s.em);
      if (mw) mw.innerHTML = mandala(s.mand);
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
      if (s.blobs) s.blobs.forEach(function (col, bi) {
        el = document.createElement("div"); el.className = "hh-blob";
        el.style.cssText = "background:radial-gradient(circle," + col + " 0%,transparent 66%);left:" + [-18, 52, 6, 58][bi % 4] + "%;top:" + [-6, -8, 52, 46][bi % 4] + "%;animation-duration:" + (16 + bi * 5) + "s;animation-delay:-" + (bi * 4) + "s";
        frag.appendChild(el);
      });
      if (s.bgch) { el = document.createElement("div"); el.className = "hh-bgch"; el.innerHTML = mandala("chakra"); frag.appendChild(el); }
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
        el = document.createElement("div"); el.className = "hh-item" + (s.extra === "up" ? " up" : "");
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
