/* Website Look: main colour + top bar text. Admin edits in admin panel; everyone sees it. Table: site_theme (supabase_v21.sql). */
(function () {
  const KEY = "aashapura_theme";
  const ADMIN = "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3";
  const PRESETS = { Green: "#123c2b", Saffron: "#8a4b0f", Maroon: "#6e1f2b", Blue: "#14385c", Purple: "#40285f", Black: "#1f2622" };
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const okHex = c => /^#[0-9a-f]{6}$/i.test(c || "");
  function lighten(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const ch = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(v + (255 - v) * f));
    return "#" + ch.map(v => v.toString(16).padStart(2, "0")).join("");
  }
  function apply(t) {
    t = t || {};
    const r = document.documentElement.style;
    if (okHex(t.color)) { r.setProperty("--green", t.color); r.setProperty("--green2", lighten(t.color, 0.14)); }
    else { r.removeProperty("--green"); r.removeProperty("--green2"); }
    const paint = () => {
      const bar = document.querySelector(".topbar"); if (!bar) return;
      if (!bar.hasAttribute("data-orig")) bar.setAttribute("data-orig", bar.textContent);
      bar.style.display = t.show_top === false ? "none" : "";
      if (t.top_text && t.top_text.trim()) { if (bar.textContent !== t.top_text) bar.textContent = t.top_text; }
    };
    if (document.body) paint(); else document.addEventListener("DOMContentLoaded", paint);
  }
  const cached = () => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } };
  const save = t => { try { t ? localStorage.setItem(KEY, JSON.stringify(t)) : localStorage.removeItem(KEY); } catch (e) {} };
  apply(cached());

  async function load() {
    if (typeof supabaseClient === "undefined") return;
    try {
      const { data, error } = await supabaseClient.from("site_theme").select("*").eq("id", 1).maybeSingle();
      if (error) return;
      save(data || null); apply(data || null);
    } catch (e) {}
  }
  let tries = 0;
  (function wait() { if (typeof supabaseClient !== "undefined") load(); else if (tries++ < 40) setTimeout(wait, 250); })();

  async function isAdmin() { try { const { data: { user } } = await supabaseClient.auth.getUser(); return !!user && user.id === ADMIN; } catch (e) { return false; } }
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };

  async function renderAdmin(host) {
    if (!host) return;
    let t = { color: "#123c2b", top_text: "", show_top: true };
    try { const { data } = await supabaseClient.from("site_theme").select("*").eq("id", 1).maybeSingle(); if (data) t = Object.assign(t, data); } catch (e) {}
    const cur = okHex(t.color) ? t.color : "#123c2b";
    host.innerHTML = `
      <label style="display:block;font-size:13px;margin:8px 0 4px">Website ka rang</label>
      <div id="thSw" style="display:flex;flex-wrap:wrap;gap:8px">${Object.entries(PRESETS).map(([n, c]) => `<button type="button" data-c="${c}" style="background:${c};color:#fff;border:2px solid ${c.toLowerCase() === cur.toLowerCase() ? "#e6a93b" : "transparent"};border-radius:8px;padding:9px 12px;font-size:13px">${n}</button>`).join("")}</div>
      <label style="display:flex;gap:8px;align-items:center;margin:10px 0;font-size:13px">Ya apna rang chuno: <input id="thCol" type="color" value="${esc(cur)}" style="width:54px;height:36px;padding:0;border:0"></label>
      <label style="display:block;font-size:13px;margin:8px 0 4px">Top text (hari patti)</label>
      <input id="thTxt" placeholder="Natural care • Easy ordering" value="${esc(t.top_text || "")}" style="width:100%;padding:10px;box-sizing:border-box">
      <label style="display:flex;gap:8px;align-items:center;margin:10px 0;font-size:13px"><input id="thShow" type="checkbox" style="width:auto"${t.show_top === false ? "" : " checked"}> Top text dikhao</label>
      <div style="display:flex;gap:8px"><button type="button" id="thSave" style="flex:1;padding:12px">Save Look</button><button type="button" id="thReset" style="padding:12px">Reset</button></div>`;
    const col = host.querySelector("#thCol");
    host.querySelectorAll("[data-c]").forEach(b => b.onclick = () => { col.value = b.dataset.c; host.querySelectorAll("[data-c]").forEach(x => x.style.borderColor = "transparent"); b.style.borderColor = "#e6a93b"; apply({ color: col.value, show_top: true }); });
    col.oninput = () => apply({ color: col.value, show_top: true });
    host.querySelector("#thSave").onclick = async () => {
      if (!(await isAdmin())) { alert("Admin login karo."); return; }
      const row = { id: 1, color: col.value, top_text: host.querySelector("#thTxt").value.trim(), show_top: host.querySelector("#thShow").checked, updated_at: new Date().toISOString() };
      const { error } = await supabaseClient.from("site_theme").upsert(row);
      if (error) { alert("Save nahi hua: " + error.message + "\n\n(Pehle supabase_v21.sql Supabase me run karo.)"); return; }
      save(row); apply(row); toast("Website look save ho gaya!");
    };
    host.querySelector("#thReset").onclick = async () => {
      if (!(await isAdmin())) { alert("Admin login karo."); return; }
      const { error } = await supabaseClient.from("site_theme").delete().eq("id", 1);
      if (error) { alert("Reset nahi hua: " + error.message); return; }
      save(null); apply(null); const bar = document.querySelector(".topbar"); if (bar && bar.hasAttribute("data-orig")) bar.textContent = bar.getAttribute("data-orig");
      toast("Purana look wapas aa gaya."); renderAdmin(host);
    };
  }
  window.aashapuraTheme = { renderAdmin, apply, load };
})();
