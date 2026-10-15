/* Herb animation hero (v2): 18 herbs, 3 depth layers, sparkles + mist. Safe: does nothing if .herb-hero is missing. */
(function () {
  try {
    var hero = document.querySelector(".herb-hero");
    if (!hero || hero.dataset.ready) return;
    hero.dataset.ready = "1";
    var S = function (id, body) { return '<symbol id="hh-' + id + '" viewBox="0 0 40 40">' + body + '</symbol>'; };
    var defs = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<linearGradient id="hg-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9be08f"/><stop offset="1" stop-color="#2f8a46"/></linearGradient>' +
      '<linearGradient id="hg-d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6cc07a"/><stop offset="1" stop-color="#1f6b3a"/></linearGradient>' +
      '<linearGradient id="hg-o" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#d9731a"/></linearGradient>' +
      '<linearGradient id="hg-p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd1de"/><stop offset="1" stop-color="#e86f98"/></linearGradient>' +
      '<linearGradient id="hg-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7a6b"/><stop offset="1" stop-color="#c2262e"/></linearGradient>' +
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
      '</defs></svg>';
    hero.insertAdjacentHTML("afterbegin", defs);

    /* weights: common herbs appear more often */
    var herbs = ["tulsi", "tulsi", "neem", "neem", "ashwagandha", "amla", "brahmi", "giloy", "aloe", "moringa", "haldi", "shatavari", "pudina", "pudina", "kamal", "gudhal", "gulab", "dalchini", "elaichi", "methi"];
    var small = window.innerWidth < 600;
    var N = small ? 18 : 30;
    var r = function (a, b) { return a + Math.random() * (b - a); };
    var frag = document.createDocumentFragment();

    /* mist (2 slow drifting soft clouds) */
    for (var m = 0; m < 2; m++) {
      var mist = document.createElement("div");
      mist.className = "hh-mist";
      mist.style.cssText = "top:" + (m ? 55 : 15) + "%;animation-duration:" + (m ? 26 : 34) + "s;animation-delay:-" + (m * 11) + "s";
      frag.appendChild(mist);
    }
    /* sparkles */
    for (var k = 0; k < (small ? 14 : 24); k++) {
      var sp = document.createElement("i");
      sp.className = "hh-spark";
      var z = r(2, 5);
      sp.style.cssText = "left:" + r(0, 100) + "%;top:" + r(20, 100) + "%;width:" + z + "px;height:" + z + "px;animation-duration:" + r(5, 11) + "s;animation-delay:-" + r(0, 10) + "s";
      frag.appendChild(sp);
    }
    /* herbs: layer 0 far (small, blurry, slow), 1 mid, 2 near (big, fast, soft blur like depth of field) */
    for (var i = 0; i < N; i++) {
      var layer = i % 3, size, dur, blur, op;
      if (layer === 0) { size = r(16, 24); dur = r(18, 26); blur = 1.4; op = .5; }
      else if (layer === 1) { size = r(26, 38); dur = r(12, 17); blur = 0; op = .88; }
      else { size = r(44, 66); dur = r(8, 12); blur = 2.2; op = .95; }
      var d = document.createElement("div");
      d.className = "hh-item";
      d.style.cssText = "left:" + r(0, 100) + "%;width:" + size + "px;height:" + size + "px;opacity:" + op + ";" +
        "--dx:" + ((r(-80, 80)) | 0) + "px;--rot:" + ((Math.random() < .5 ? -1 : 1) * r(240, 600) | 0) + "deg;--rt:" + r(6, 70) + ";" +
        "animation-duration:" + dur + "s," + r(3, 6) + "s;animation-delay:-" + r(0, dur) + "s,0s;" +
        (blur ? "filter:blur(" + blur + "px);" : "") +
        "z-index:" + (layer === 2 ? 3 : 1) + ";";
      d.innerHTML = '<svg style="animation-duration:' + r(6, 14) + 's"><use href="#hh-' + herbs[(i * 7 + layer) % herbs.length] + '"/></svg>';
      frag.appendChild(d);
    }
    hero.appendChild(frag);

    /* how far a herb falls = hero height (fixes short fall) */
    var setFall = function () { hero.style.setProperty("--fall", Math.round(hero.offsetHeight * 1.3) + "px"); };
    setFall();
    window.addEventListener("resize", setFall);
  } catch (e) { /* never break the store */ }
})();
