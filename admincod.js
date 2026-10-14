/* Admin > COD Settings: COD on/off for the whole store, COD fee (default ₹99), and Available / Not available per product.
   Needs supabase_v58_cod.sql (products.cod_available, store_rules.cod_fee / cod_enabled). */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  let done = false, rows = [], q = "", filt = "all";

  const css = document.createElement("style");
  css.textContent = `.cd-box{max-width:620px}.cd-card{background:#fff;border:1px solid #dfe8dc;border-radius:14px;padding:14px;margin-bottom:12px}
  .cd-card h4{margin:0 0 4px;font-size:16px}.cd-s{color:#5d7266;font-size:13px;margin:0 0 10px}
  .cd-row{display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap}
  .cd-card input[type=number],.cd-card input[type=search]{padding:11px;border:1px solid #cdd8cf;border-radius:10px;font:inherit;box-sizing:border-box}
  .cd-card input[type=number]{width:110px}.cd-card input[type=search]{width:100%}
  .cd-btn{border:1px solid #cfd9cb;background:#fff;border-radius:10px;padding:10px 13px;font:inherit;font-weight:600;cursor:pointer;color:#173d2e}
  .cd-btn.pri{background:#14402b;color:#fff;border-color:#14402b}
  .cd-sw{position:relative;width:52px;height:30px;flex:none}.cd-sw input{opacity:0;position:absolute;inset:0;width:100%;height:100%;margin:0;cursor:pointer;z-index:2}
  .cd-sw i{position:absolute;inset:0;background:#c9d2cc;border-radius:99px;transition:.2s}.cd-sw i:after{content:"";position:absolute;top:3px;left:3px;width:24px;height:24px;background:#fff;border-radius:50%;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.3)}
  .cd-sw input:checked+i{background:#2f6b3a}.cd-sw input:checked+i:after{left:25px}
  .cd-p{display:flex;gap:10px;align-items:center;justify-content:space-between;padding:11px 0;border-top:1px solid #edf1ec}.cd-p:first-child{border-top:0}
  .cd-p b{display:block;font-size:14px}.cd-p small{color:#6a7d70;font-size:12px}
  .cd-st{font-size:12px;font-weight:700;margin-right:8px}.cd-st.on{color:#166534}.cd-st.off{color:#b42318}
  .cd-tabs{display:flex;gap:6px;margin:8px 0}.cd-tabs button{flex:1}.cd-tabs button.on{background:#14402b;color:#fff;border-color:#14402b}
  .cd-msg{font-size:13px;font-weight:600;margin-top:8px}.cd-msg.bad{color:#b42318}.cd-msg.ok{color:#166534}`;
  document.head.appendChild(css);

  async function render() {
    const host = $("apCod"); if (!host) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true;
    let rule = { cod_enabled: true, cod_fee: 99 }, missing = false;
    const rr = await supabaseClient.from("store_rules").select("cod_fee,cod_enabled").eq("id", 1).maybeSingle();
    if (rr.error) missing = true; else if (rr.data) rule = { cod_enabled: rr.data.cod_enabled !== false, cod_fee: Number(rr.data.cod_fee) >= 0 ? Number(rr.data.cod_fee) : 99 };
    const pr = await supabaseClient.from("products").select("id,name,weight,category,cod_available").order("name");
    if (pr.error) { missing = true; const p2 = await supabaseClient.from("products").select("id,name,weight,category").order("name"); rows = (p2.data || []).map(p => ({ ...p, cod_available: true })); }
    else rows = (pr.data || []).map(p => ({ ...p, cod_available: p.cod_available !== false }));

    host.innerHTML = `<div class="cd-box">
      ${missing ? `<div class="cd-card"><div class="cd-msg bad">Pehle Supabase SQL Editor me <b>supabase_v58_cod.sql</b> chalao, phir page refresh karo.</div></div>` : ""}
      <div class="cd-card"><h4>💵 Cash on Delivery (poori site)</h4><p class="cd-s">Band karoge to checkout me Cash On Delivery option dikhega hi nahi.</p>
        <div class="cd-row"><span><b id="cdState"></b></span><label class="cd-sw"><input type="checkbox" id="cdOn"${rule.cod_enabled ? " checked" : ""}><i></i></label></div>
        <div class="cd-row" style="margin-top:12px"><label for="cdFee"><b>Cash On Delivery fee (₹)</b><br><small style="color:#6a7d70">Customer ke order total me judega</small></label><input type="number" id="cdFee" min="0" step="1" value="${esc(rule.cod_fee)}"></div>
        <button type="button" class="cd-btn pri" id="cdSave" style="width:100%;margin-top:12px;padding:13px">Save Cash On Delivery settings</button><div class="cd-msg" id="cdMsg"></div></div>
      <div class="cd-card"><h4>📦 Product-wise Cash On Delivery</h4><p class="cd-s">Jis product par Cash On Delivery nahi dena, uska switch band karo. Order me ek bhi aisa product hua to us order me Cash On Delivery nahi milega.</p>
        <input type="search" id="cdQ" placeholder="Product search…">
        <div class="cd-tabs"><button type="button" class="cd-btn on" data-f="all">Sab</button><button type="button" class="cd-btn" data-f="on">Cash On Delivery available</button><button type="button" class="cd-btn" data-f="off">Cash On Delivery nahi</button></div>
        <div class="cd-row" style="margin:6px 0 4px"><button type="button" class="cd-btn" id="cdAllOn" style="flex:1">Sabhi par Cash On Delivery ON</button><button type="button" class="cd-btn" id="cdAllOff" style="flex:1">Sabhi par Cash On Delivery OFF</button></div>
        <div id="cdList"></div></div></div>`;
    const stTxt = () => { $("cdState").textContent = $("cdOn").checked ? "Cash On Delivery chalu hai ✅" : "Cash On Delivery band hai ⛔"; };
    stTxt(); $("cdOn").onchange = stTxt;
    const msg = (t, c) => { const m = $("cdMsg"); m.textContent = t || ""; m.className = "cd-msg " + (c || ""); };
    $("cdSave").onclick = async () => {
      const fee = Number($("cdFee").value);
      if (!(fee >= 0) || fee > 2000 || $("cdFee").value === "") return msg("Sahi fee likho (0 se 2000).", "bad");
      const b = $("cdSave"); b.disabled = true; b.textContent = "Saving…";
      const r = await supabaseClient.from("store_rules").upsert({ id: 1, cod_enabled: $("cdOn").checked, cod_fee: fee });
      b.disabled = false; b.textContent = "Save Cash On Delivery settings";
      if (r.error) return msg("Save nahi hua: " + r.error.message + " (supabase_v58_cod.sql chalayi?)", "bad");
      try { if (window.AASHAPURA_COD) { window.AASHAPURA_COD.enabled = $("cdOn").checked; window.AASHAPURA_COD.fee = fee; } } catch (e) {}
      msg("✅ Save ho gaya.", "ok"); toast("Cash On Delivery settings saved");
    };
    const paint = () => {
      const l = rows.filter(p => (filt === "all" || (filt === "on") === p.cod_available) && (!q || (p.name + " " + (p.weight || "") + " " + (p.category || "")).toLowerCase().includes(q)));
      $("cdList").innerHTML = l.map(p => `<div class="cd-p"><div style="min-width:0"><b>${esc(p.name)}${p.weight ? " · " + esc(p.weight) : ""}</b><small>${esc(p.category || "")}</small></div>
        <div style="display:flex;align-items:center"><span class="cd-st ${p.cod_available ? "on" : "off"}">${p.cod_available ? "Cash On Delivery ✓" : "Cash On Delivery ✗"}</span><label class="cd-sw"><input type="checkbox" data-id="${esc(p.id)}"${p.cod_available ? " checked" : ""}><i></i></label></div></div>`).join("") || "<p>Koi product nahi mila.</p>";
    };
    const refreshStore = () => { try { loadProducts(); } catch (e) {} };
    const setMany = async (ids, val) => {
      const r = await supabaseClient.from("products").update({ cod_available: val }).in("id", ids);
      if (r.error) { toast("Save nahi hua: " + r.error.message, "error"); return false; }
      rows.forEach(p => { if (ids.includes(p.id)) p.cod_available = val; }); refreshStore(); return true;
    };
    $("cdList").onchange = async e => {
      const i = e.target.closest("[data-id]"); if (!i) return;
      const id = isNaN(Number(i.dataset.id)) ? i.dataset.id : Number(i.dataset.id), val = i.checked;
      i.disabled = true;
      const ok = await setMany([id], val);
      if (!ok) i.checked = !val;
      paint();
    };
    $("cdQ").oninput = e => { q = e.target.value.trim().toLowerCase(); paint(); };
    host.querySelectorAll(".cd-tabs button").forEach(b => b.onclick = () => { filt = b.dataset.f; host.querySelectorAll(".cd-tabs button").forEach(x => x.classList.toggle("on", x === b)); paint(); });
    const bulk = async val => { const ids = rows.map(p => p.id); if (!ids.length) return; if (!(await confirm(val ? "Sabhi products par Cash On Delivery chalu karna hai?" : "Sabhi products par Cash On Delivery band karna hai?"))) return; if (await setMany(ids, val)) { toast("Ho gaya"); paint(); } };
    $("cdAllOn").onclick = () => bulk(true); $("cdAllOff").onclick = () => bulk(false);
    paint();
  }

  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none" && !done) render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    document.addEventListener("aashapura-admin-sec", e => { if (e.detail === "cod") { done = false; render(); } });
    setTimeout(() => { if (ab.style.display !== "none" && !done) render(); }, 2000);
  }
})();
