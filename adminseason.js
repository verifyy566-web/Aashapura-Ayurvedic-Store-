/* Admin > Season Theme: pick one of 12 background + colour + text combos (7 seasons + Holi, Raksha Bandhan, Independence Day, Navratri, Republic Day). Tap a card = live preview on the page behind;
   "Save" = goes live for every visitor. Needs supabase_v66_season.sql (run once in Supabase SQL Editor). */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  let done = false, sel = null, live = null, busy = false, warn = "";

  const css = document.createElement("style");
  css.textContent = `.sz-hint{background:#eef6ec;border:1px solid #cfe2cb;color:#2d5a3c;border-radius:12px;padding:11px 13px;font-size:13px;line-height:1.55;margin-bottom:14px}
  .sz-warn{background:#fff4dc;border:1px solid #f0d58a;color:#7a5200;border-radius:12px;padding:11px 13px;font-size:13px;line-height:1.55;margin-bottom:14px}
  .sz-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
  .sz-card{position:relative;text-align:left;border:2px solid #e1e8de;border-radius:16px;background:#fff;padding:0;overflow:hidden;cursor:pointer;font:inherit;color:#173d2e}
  .sz-card.sel{border-color:#14402b;box-shadow:0 0 0 3px rgba(20,64,43,.15)}
  .sz-sw{height:64px;display:flex;align-items:center;justify-content:center;font-size:30px;margin:6px;border-radius:12px}
  .sz-bd{padding:9px 11px 11px}.sz-bd b{display:block;font-size:14.5px}.sz-bd small{display:block;color:#5d6f64;font-size:11.5px;margin-top:2px;line-height:1.35}
  .sz-pill{position:absolute;top:7px;right:7px;background:#14402b;color:#fff;font-size:10px;font-weight:800;letter-spacing:.4px;border-radius:99px;padding:3px 8px}
  .sz-prev{margin:16px 0 4px;border:1px dashed #b9ccb6;border-radius:14px;padding:13px;background:#fff}
  .sz-prev small{display:block;color:#6a7d70;font-size:11px;letter-spacing:.8px;text-transform:uppercase;margin-bottom:6px}
  .sz-prev strong{display:block;font-size:17px;line-height:1.3}.sz-prev span{display:block;font-size:13px;color:#4a554a;margin-top:5px;line-height:1.5}
  .sz-save{width:100%;border:0;background:#14402b;color:#fff;border-radius:12px;padding:14px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;margin-top:12px}
  .sz-save:disabled{opacity:.55}.sz-rev{width:100%;border:1px solid #cfd9cb;background:#fff;color:#173d2e;border-radius:12px;padding:12px;font:inherit;font-weight:600;font-size:14px;cursor:pointer;margin-top:8px}`;
  document.head.appendChild(css);

  function api() { return window.aashapuraSeasons; }

  function paint() {
    const host = $("apSeason"), A = api(); if (!host) return;
    if (!A) { host.innerHTML = '<div class="sz-warn">Season theme load nahi hua. herbhero.js upload hui hai ya nahi dekho.</div>'; return; }
    if (!sel) sel = live;
    const cur = A.list.find(s => s.id === sel) || A.list[0];
    host.innerHTML =
      '<div class="sz-hint">Kisi bhi season par tap karo: peeche ka background, rang aur upar ka text turant badal ke dikhega. ' +
      'Pasand aaye to <b>Save</b> dabao, tab sab customers ko wahi dikhega.</div>' +
      (warn ? '<div class="sz-warn">' + esc(warn) + '</div>' : "") +
      '<div class="sz-grid">' + A.list.map(s =>
        '<button type="button" class="sz-card' + (s.id === sel ? " sel" : "") + '" data-id="' + s.id + '">' +
        (s.id === live ? '<span class="sz-pill">LIVE</span>' : "") +
        '<div class="sz-sw" style="background:linear-gradient(135deg,rgb(' + s.z.p1 + '),rgb(' + s.z.p2 + '));box-shadow:inset 0 0 0 2px ' + s.z.g1 + '">' + s.emoji + '</div>' +
        '<div class="sz-bd"><b>' + esc(s.name) + '</b><small>' + esc(s.note) + '</small></div></button>').join("") + '</div>' +
      '<div class="sz-prev"><small>Is season ka text</small><strong style="color:' + cur.c.ink + '">' + esc(cur.t.h) + ' <span style="display:inline;color:' + cur.c.accent + ';font-style:italic;font-size:inherit;margin:0">' + esc(cur.t.em) + '</span></strong><span>' + esc(cur.t.sub) + '</span></div>' +
      '<button type="button" class="sz-save" id="szSave"' + (sel === live || busy ? " disabled" : "") + '>' + (busy ? "Saving…" : sel === live ? "✅ Ye season abhi LIVE hai" : "✅ Save — " + esc(cur.name) + " ko LIVE karo") + '</button>' +
      (sel !== live ? '<button type="button" class="sz-rev" id="szRev">↩️ Wapas LIVE season dekho</button>' : "");
    host.querySelectorAll(".sz-card").forEach(b => b.onclick = () => { sel = b.dataset.id; A.previewing = sel !== live; A.apply(sel); paint(); });
    const sv = $("szSave"); if (sv) sv.onclick = save;
    const rv = $("szRev"); if (rv) rv.onclick = () => { sel = live; A.previewing = false; A.apply(live); paint(); };
  }

  async function save() {
    const A = api(); if (!A || !sel || busy) return;
    busy = true; warn = ""; paint();
    try {
      const { error } = await supabaseClient.from("site_season").upsert({ id: 1, season: sel, updated_at: new Date().toISOString() });
      if (error) throw error;
      live = sel; A.previewing = false; A.setSaved(sel);
      toast("Season LIVE ho gaya ✅");
    } catch (e) {
      const m = (e && (e.message || e.details)) || String(e);
      if (/relation|does not exist|schema cache|42P01/i.test(m)) warn = "Table nahi mili. Pehle supabase_v66_season.sql ko Supabase SQL Editor me paste karke Run karo.";
      else if (/row-level|policy|permission/i.test(m)) warn = "Permission nahi mili. Admin account se login karo, ya supabase_v66_season.sql dobara chalao.";
      else warn = "Save nahi hua: " + m;
      toast("Season save nahi hua", "error");
    }
    busy = false; paint();
  }

  async function render() {
    if (done || !$("apSeason")) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true;
    const A = api(); live = A ? A.saved() : "herbal"; sel = live;
    paint();
  }
  /* leaving this section / page: show the live season again (preview is never saved by itself) */
  document.addEventListener("aashapura-admin-sec", e => {
    const A = api(); if (!A) return;
    if (e.detail === "season") { render(); if (done) paint(); }
    else if (A.previewing) { A.previewing = false; A.apply(live || A.saved()); sel = live; }
  });
  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none") render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(render, 2200);
  }
})();
