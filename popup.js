/* Premium popups: replaces the browser's alert / confirm / prompt on the whole site. */
(function () {
  const tr = s => (window.I18N ? window.I18N.t(String(s)) : String(s));
  const css = document.createElement("style");
  css.textContent = ".pp-back{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,25,18,.55);backdrop-filter:blur(4px);animation:ppf .18s ease}" +
    ".pp-card{width:min(92vw,380px);background:#fff;border-radius:22px;padding:28px 24px 20px;text-align:center;box-shadow:0 24px 60px rgba(0,0,0,.3);animation:ppu .22s cubic-bezier(.2,.9,.3,1.2)}" +
    ".pp-ic{width:60px;height:60px;border-radius:50%;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:28px;background:#e8f3e6}" +
    ".pp-ic.warn{background:#fdecea}.pp-ic.ask{background:#fff4dc}" +
    ".pp-card h3{margin:0 0 8px;font-size:20px;color:#14301f}.pp-card p{margin:0 0 20px;color:#555;line-height:1.5;word-break:break-word;white-space:pre-line}" +
    ".pp-card input{width:100%;box-sizing:border-box;padding:12px 14px;margin:-8px 0 18px;border:1px solid #cdd8cf;border-radius:12px;font:inherit}" +
    ".pp-row{display:flex;gap:10px}.pp-row button{flex:1;padding:13px;border-radius:999px;font:inherit;font-weight:700;cursor:pointer;border:1px solid #cdd8cf;background:#fff;color:#14301f}" +
    ".pp-row .pp-ok{background:#14402b;border-color:#14402b;color:#fff}.pp-row .pp-danger{background:#b42318;border-color:#b42318;color:#fff}" +
    "@keyframes ppf{from{opacity:0}}@keyframes ppu{from{opacity:0;transform:translateY(16px) scale(.94)}}";
  document.head.appendChild(css);

  function kind(m) {
    if (/fail|not |could not|error|invalid|nahi|नहीं|permission|only|required/i.test(m)) return ["warn", "⚠️", "Something went wrong"];
    if (/saved|deleted|success|copied|done|ho gaya/i.test(m)) return ["", "✅", "Done"];
    return ["", "ℹ️", "Notice"];
  }
  function show(msg, opts) {
    return new Promise(resolve => {
      const m = tr(msg), k = opts.confirm ? ["ask", /delet|remov|permanent/i.test(m) ? "🗑️" : "❓", "Please confirm"] : kind(m);
      const danger = opts.confirm && /delet|remov|permanent/i.test(m);
      const back = document.createElement("div"); back.className = "pp-back"; back.setAttribute("role", "dialog");
      back.innerHTML = `<div class="pp-card"><div class="pp-ic ${k[0]}">${k[1]}</div><h3></h3><p></p>${opts.prompt ? "<input>" : ""}<div class="pp-row"></div></div>`;
      back.querySelector("h3").textContent = opts.prompt ? "Enter details" : k[2];
      back.querySelector("p").textContent = m;
      const inp = back.querySelector("input"); if (inp) inp.value = opts.def || "";
      const row = back.querySelector(".pp-row");
      const done = v => { back.remove(); resolve(v); };
      const mk = (txt, cls, v) => { const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.className = cls; b.onclick = () => done(v()); row.appendChild(b); return b; };
      if (opts.confirm || opts.prompt) mk("Cancel", "", () => (opts.prompt ? null : false));
      const ok = mk(opts.confirm ? (danger ? "Delete" : "Yes") : "OK", danger ? "pp-danger" : "pp-ok", () => (opts.prompt ? inp.value : true));
      back.onclick = e => { if (e.target === back && !opts.confirm && !opts.prompt) done(undefined); };
      back.onkeydown = e => { if (e.key === "Escape") done(opts.prompt ? null : (opts.confirm ? false : undefined)); if (e.key === "Enter") ok.click(); };
      document.body.appendChild(back);
      (inp || ok).focus();
    });
  }
  window.alert = m => { show(m, {}); };
  window.confirm = m => show(m, { confirm: true });   /* returns a Promise: use  await confirm(...)  */
  window.prompt = (m, d) => show(m, { prompt: true, def: d });
})();
