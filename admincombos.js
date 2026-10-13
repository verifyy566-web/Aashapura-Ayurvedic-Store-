/* Admin > Combos: "Ashwagandha + Amla ek saath 15% sasta". Table combos (supabase_v40_combos.sql). */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  const rs = n => "₹" + (Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2));
  let done = false, list = [], prods = [];
  const css = document.createElement("style");
  css.textContent = `.cm-new{width:100%;border:0;background:#14402b;color:#fff;border-radius:12px;padding:14px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;margin-bottom:14px}
  .cm-warn{background:#fff4dc;border:1px solid #f0d58a;color:#7a5200;border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:12px;line-height:1.5}
  .cm-card{border:1px solid #dfe8dc;border-radius:14px;padding:13px;margin-bottom:11px;background:#fff}.cm-card.off{background:#f6f7f5}
  .cm-top{display:flex;align-items:center;gap:8px}.cm-top b{font-size:16px;color:#14402b}.cm-st{margin-left:auto;font-size:11px;font-weight:700;border-radius:99px;padding:3px 9px}.cm-st.on{background:#e3f4e6;color:#166534}.cm-st.off{background:#eceeed;color:#5d6b63}
  .cm-it{font-size:13px;color:#4b5d52;margin:6px 0}.cm-pr{font-size:15px;font-weight:700;color:#173d2e}.cm-pr s{font-weight:400;color:#8a998f;margin:0 6px}.cm-pr em{font-style:normal;color:#17853f}
  .cm-ac{display:flex;gap:8px;margin-top:10px}.cm-ac button{flex:1;border:1px solid #cfd9cb;background:#fff;border-radius:10px;padding:10px 4px;font:inherit;font-size:13px;font-weight:600;color:#173d2e;cursor:pointer}.cm-ac button.del{color:#b42318;border-color:#efc4bf}
  .cm-bk{position:fixed;inset:0;z-index:100600;background:rgba(10,25,18,.55);display:flex;align-items:flex-end;justify-content:center}
  .cm-sh{width:100%;max-width:560px;background:#fff;border-radius:22px 22px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0));max-height:92vh;overflow:auto}
  .cm-sh h3{margin:0 0 4px;color:#14301f}.cm-sh label{display:block;font-weight:700;font-size:14px;margin:13px 0 4px;color:#173d2e}
  .cm-sh input[type=text],.cm-sh input[type=number],.cm-sh select,.cm-sh textarea{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cdd8cf;border-radius:10px;font:inherit;font-size:15px}
  .cm-line{display:flex;gap:8px;margin-bottom:8px}.cm-line select{flex:1;min-width:0}.cm-line input{width:64px!important;flex:none}.cm-line button{border:1px solid #efc4bf;background:#fff;color:#b42318;border-radius:10px;padding:0 12px;font-size:16px}
  .cm-add{border:1px dashed #9bb89c;background:#f4faf2;color:#14402b;border-radius:10px;padding:10px;font:inherit;font-weight:700;width:100%;cursor:pointer}
  .cm-2{display:flex;gap:10px}.cm-2>div{flex:1}.cm-pv{margin-top:14px;background:#eef5ea;border-radius:12px;padding:11px 13px;color:#14402b;font-size:14px;line-height:1.5}
  .cm-ck{display:flex;align-items:center;gap:10px;margin-top:14px;font-weight:600}.cm-ck input{width:20px;height:20px}.cm-msg{color:#b42318;font-weight:600;font-size:14px;margin-top:10px}
  .cm-bt{display:flex;gap:10px;margin-top:16px}.cm-bt button{flex:1;padding:14px;border-radius:12px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;border:1px solid #cdd8cf;background:#fff}.cm-bt .pri{background:#14402b;border-color:#14402b;color:#fff}`;
  document.head.appendChild(css);

  const pName = p => p.name + (p.weight ? " (" + p.weight + ")" : "");
  const rowsOf = c => (Array.isArray(c.items) ? c.items : []).map(i => ({ p: prods.find(x => String(x.id) === String(i.id)), qty: Number(i.qty) || 1 }));
  const regOf = c => rowsOf(c).reduce((s, r) => s + (r.p ? Number(r.p.price || 0) * r.qty : 0), 0);

  async function load() {
    const host = $("apCombos"); if (!host) return;
    const [c, p] = await Promise.all([supabaseClient.from("combos").select("*").order("sort_order").order("id"), supabaseClient.from("products").select("id,name,weight,price,stock").order("name")]);
    if (c.error) { host.innerHTML = `<div class="cm-warn">Combos load nahi hue: ${esc(c.error.message)}<br>Pehle Supabase SQL Editor me <b>supabase_v40_combos.sql</b> chalao.</div>`; return; }
    list = c.data || []; prods = p.data || []; paint();
  }
  function paint() {
    const host = $("apCombos");
    host.innerHTML = `<button type="button" class="cm-new" id="cmNew">➕ Naya Combo</button>` + (list.length ? list.map(card).join("") : `<div style="text-align:center;color:#6a7d70;padding:28px 10px">🎁<br>Abhi koi combo nahi hai.<br><small>Jaise: Ashwagandha + Amla ek saath 15% sasta</small></div>`);
    $("cmNew").onclick = () => form(null);
    host.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => form(list.find(c => String(c.id) === b.dataset.ed)));
    host.querySelectorAll("[data-tg]").forEach(b => b.onclick = () => toggle(b.dataset.tg));
    host.querySelectorAll("[data-dl]").forEach(b => b.onclick = () => remove(b.dataset.dl));
  }
  function card(c) {
    const reg = regOf(c), pr = Number(c.price) || 0, sv = reg - pr, bad = rowsOf(c).some(r => !r.p);
    return `<div class="cm-card ${c.is_active ? "" : "off"}"><div class="cm-top"><b>🎁 ${esc(c.name)}</b><span class="cm-st ${c.is_active ? "on" : "off"}">${c.is_active ? "Active" : "Deactive"}</span></div>
      <div class="cm-it">${rowsOf(c).map(r => r.p ? esc(pName(r.p)) + (r.qty > 1 ? " ×" + r.qty : "") : "<span style='color:#b42318'>(product delete ho gaya)</span>").join(" + ")}</div>
      <div class="cm-pr">${rs(pr)}<s>${rs(reg)}</s><em>${sv > 0 ? Math.round(sv / reg * 100) + "% sasta · bachat " + rs(sv) : "⚠️ price regular se kam rakho"}</em></div>
      ${bad ? `<div class="cm-warn" style="margin:8px 0 0">Is combo ka product nahi mila. Edit karke theek karo, tab tak customers ko nahi dikhega.</div>` : ""}
      <div class="cm-ac"><button type="button" data-ed="${c.id}">✏️ Edit</button><button type="button" data-tg="${c.id}">${c.is_active ? "⏸ Deactive" : "▶ Active karo"}</button><button type="button" class="del" data-dl="${c.id}">🗑 Delete</button></div></div>`;
  }
  async function toggle(id) {
    const c = list.find(x => String(x.id) === String(id)); if (!c) return;
    const r = await supabaseClient.from("combos").update({ is_active: !c.is_active }).eq("id", c.id).select();
    if (r.error || !r.data || !r.data.length) return toast("Nahi hua: " + ((r.error && r.error.message) || "permission"), "error");
    toast(c.is_active ? "Combo deactive ho gaya" : "Combo active ho gaya"); load(); try { window.aashapuraCombos && window.aashapuraCombos.load(true); } catch (e) {}
  }
  async function remove(id) {
    const c = list.find(x => String(x.id) === String(id)); if (!c) return;
    if (!(await confirm(`Combo "${c.name}" delete karna hai?`))) return;
    const r = await supabaseClient.from("combos").delete().eq("id", c.id).select();
    if (r.error || !r.data || !r.data.length) return toast("Delete nahi hua: " + ((r.error && r.error.message) || "permission"), "error");
    toast("Combo delete ho gaya"); load();
  }

  function form(c) {
    const edit = !!c, items0 = edit ? rowsOf(c).filter(r => r.p).map(r => ({ id: r.p.id, qty: r.qty })) : [{ id: "", qty: 1 }, { id: "", qty: 1 }];
    const opts = sel => `<option value="">Product chuno…</option>` + prods.map(p => `<option value="${p.id}" ${String(p.id) === String(sel) ? "selected" : ""}>${esc(pName(p))} · ${rs(p.price)}</option>`).join("");
    const bk = document.createElement("div"); bk.className = "cm-bk";
    bk.innerHTML = `<div class="cm-sh"><h3>${edit ? "Combo edit karo" : "Naya Combo"}</h3>
      <label>Combo ka naam</label><input type="text" id="cmName" maxlength="80" placeholder="jaise Ashwagandha + Amla Combo" value="${edit ? esc(c.name) : ""}">
      <label>Products (kam se kam 2)</label><div id="cmLines"></div><button type="button" class="cm-add" id="cmAdd">➕ Ek aur product</button>
      <div class="cm-2"><div><label>Discount %</label><input type="number" id="cmPct" inputmode="decimal" min="1" max="90" placeholder="15"></div>
      <div><label>Combo price ₹</label><input type="number" id="cmPrice" inputmode="decimal" min="1" placeholder="auto" value="${edit ? esc(c.price) : ""}"></div></div>
      <small style="color:#6a7d70">% likho to price apne aap nikal jayegi, ya seedha price likho.</small>
      <div class="cm-pv" id="cmPv"></div>
      <label>Customer ko kya dikhega (optional)</label><textarea id="cmDs" style="min-height:60px" placeholder="jaise: Immunity ke liye best jodi">${edit ? esc(c.description || "") : ""}</textarea>
      <div class="cm-2"><div><label>Order (chhota = pehle)</label><input type="number" id="cmSort" value="${edit ? esc(c.sort_order == null ? 10 : c.sort_order) : 10}"></div><div></div></div>
      <label class="cm-ck"><input type="checkbox" id="cmAct" ${!edit || c.is_active ? "checked" : ""}> Active (customers ko dikhe)</label>
      <div class="cm-msg" id="cmMsg"></div><div class="cm-bt"><button type="button" id="cmCancel">Cancel</button><button type="button" class="pri" id="cmSave">Save</button></div></div>`;
    document.body.appendChild(bk);
    const g = id => bk.querySelector("#" + id), close = () => bk.remove(), msg = t => { g("cmMsg").textContent = t || ""; };
    const lines = g("cmLines");
    const addLine = it => { const d = document.createElement("div"); d.className = "cm-line"; d.innerHTML = `<select>${opts(it.id)}</select><input type="number" min="1" max="20" value="${it.qty || 1}"><button type="button">✕</button>`; lines.appendChild(d); d.querySelector("button").onclick = () => { if (lines.children.length > 2) { d.remove(); pv(); } }; d.addEventListener("input", pv); d.addEventListener("change", pv); };
    const read = () => { const m = {}; [...lines.children].forEach(d => { const id = d.querySelector("select").value, q = Math.max(1, Math.floor(Number(d.querySelector("input").value) || 1)); if (id) m[id] = (m[id] || 0) + q; }); return Object.keys(m).map(id => ({ id: Number(id), qty: m[id] })); };
    const reg = () => read().reduce((s, i) => s + Number((prods.find(p => p.id === i.id) || {}).price || 0) * i.qty, 0);
    let fromPct = false;
    function pv() {
      const r = reg();
      if (fromPct) { const pc = Number(g("cmPct").value); if (pc > 0 && r > 0) g("cmPrice").value = Math.round(r * (1 - pc / 100)); }
      const pr = Number(g("cmPrice").value);
      g("cmPv").innerHTML = r > 0 ? (pr > 0 ? `👀 Alag alag: <b>${rs(r)}</b> → Combo: <b>${rs(pr)}</b>${pr < r ? ` · customer <b>${rs(r - pr)} (${Math.round((r - pr) / r * 100)}%)</b> bachayega` : ` · <span style="color:#b42318">price ${rs(r)} se kam rakho</span>`}` : `Alag alag price: <b>${rs(r)}</b>. Ab discount % ya price likho.`) : "👀 Products chuno, yahan hisaab dikhega.";
    }
    items0.forEach(addLine); g("cmAdd").onclick = () => addLine({ id: "", qty: 1 });
    g("cmPct").addEventListener("input", () => { fromPct = true; pv(); });
    g("cmPrice").addEventListener("input", () => { fromPct = false; const r = reg(), pr = Number(g("cmPrice").value); g("cmPct").value = r > 0 && pr > 0 && pr < r ? Math.round((1 - pr / r) * 100) : ""; pv(); });
    if (edit) { const r = reg(), pr = Number(c.price); if (r > 0 && pr < r) g("cmPct").value = Math.round((1 - pr / r) * 100); } pv();
    g("cmCancel").onclick = close; bk.onclick = e => { if (e.target === bk) close(); };
    g("cmSave").onclick = async () => {
      const name = g("cmName").value.trim(), its = read(), price = Number(g("cmPrice").value), r = reg();
      if (!name) return msg("Combo ka naam likho.");
      if (its.length < 2) return msg("Kam se kam 2 alag products chuno.");
      if (!(price > 0)) return msg("Discount % ya combo price likho.");
      if (price >= r) return msg(`Combo price ${rs(r)} se kam rakho, tabhi saving hogi.`);
      const row = { name, description: g("cmDs").value.trim() || null, items: its, price, is_active: g("cmAct").checked, sort_order: Number(g("cmSort").value) || 10 };
      const b = g("cmSave"); b.disabled = true; b.textContent = "Saving…"; msg("");
      const q = edit ? supabaseClient.from("combos").update(row).eq("id", c.id).select() : supabaseClient.from("combos").insert(row).select();
      const res = await q;
      if (res.error || (edit && (!res.data || !res.data.length))) { b.disabled = false; b.textContent = "Save"; return msg("Save nahi hua: " + ((res.error && res.error.message) || "permission") + " — supabase_v40_combos.sql chalayi?"); }
      close(); toast(edit ? "Combo update ho gaya" : "Combo ban gaya"); load(); try { window.aashapuraCombos && window.aashapuraCombos.load(true); } catch (e) {}
    };
  }

  async function render() {
    if (done || !$("apCombos")) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true; load();
  }
  const ab = $("adminProductBox");
  if (ab) { new MutationObserver(() => { if (ab.style.display !== "none") render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] }); setTimeout(render, 2400); }
})();
