/* Admin > Coupons: create, edit, activate / deactivate, delete. Needs supabase_v36_coupons.sql (admin policy + description column). */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  const rs = n => "₹" + (Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2));
  let done = false, list = [], noDesc = false, rlsBad = false;

  const css = document.createElement("style");
  css.textContent = `.cp-new{width:100%;border:0;background:#14402b;color:#fff;border-radius:12px;padding:14px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;margin-bottom:14px}
  .cp-warn{background:#fff4dc;border:1px solid #f0d58a;color:#7a5200;border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:12px;line-height:1.5}
  .cp-card{border:1px solid #dfe8dc;border-radius:14px;padding:13px;margin-bottom:11px;background:#fff}
  .cp-card.off{background:#f6f7f5}.cp-card.off .cp-code{color:#8a968f}
  .cp-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .cp-code{font-weight:800;font-size:17px;letter-spacing:.5px;color:#14402b;border:1.5px dashed #9bb89c;border-radius:8px;padding:3px 10px}
  .cp-st{font-size:11px;font-weight:700;border-radius:99px;padding:3px 9px;margin-left:auto}
  .cp-st.on{background:#e3f4e6;color:#166534}.cp-st.off{background:#eceeed;color:#5d6b63}.cp-st.exp{background:#fde8e6;color:#b42318}
  .cp-big{font-size:15px;font-weight:700;color:#173d2e;margin:9px 0 2px}
  .cp-ds{font-size:13px;color:#4b5d52;line-height:1.5}.cp-mt{font-size:12px;color:#6a7d70;margin-top:4px}
  .cp-ac{display:flex;gap:8px;margin-top:11px}
  .cp-ac button{flex:1;border:1px solid #cfd9cb;background:#fff;border-radius:10px;padding:10px 4px;font:inherit;font-size:13px;font-weight:600;color:#173d2e;cursor:pointer}
  .cp-ac button.del{color:#b42318;border-color:#efc4bf}
  .cp-none{text-align:center;color:#6a7d70;padding:28px 10px}
  .cp-bk{position:fixed;inset:0;z-index:100600;background:rgba(10,25,18,.55);display:flex;align-items:flex-end;justify-content:center}
  .cp-sh{width:100%;max-width:560px;background:#fff;border-radius:22px 22px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0));max-height:92vh;overflow:auto}
  .cp-sh h3{margin:0 0 4px;color:#14301f}.cp-sh label{display:block;font-weight:700;font-size:14px;margin:13px 0 4px;color:#173d2e}
  .cp-sh input[type=text],.cp-sh input[type=number],.cp-sh input[type=date],.cp-sh select,.cp-sh textarea{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cdd8cf;border-radius:10px;font:inherit;background:#fff}
  .cp-sh textarea{min-height:70px;resize:vertical}.cp-sh input:disabled{background:#f1f3f0;color:#6a7d70}
  .cp-2{display:flex;gap:10px}.cp-2>div{flex:1}
  .cp-sh small{display:block;color:#6a7d70;font-size:12px;margin-top:4px}
  .cp-pv{margin-top:14px;background:#eef5ea;border-radius:12px;padding:11px 13px;color:#14402b;font-size:14px;line-height:1.5}
  .cp-ck{display:flex;align-items:center;gap:10px;margin-top:14px;font-weight:600;color:#173d2e}.cp-ck input{width:20px;height:20px}
  .cp-msg{color:#b42318;font-weight:600;font-size:14px;margin-top:10px}
  .cp-bt{display:flex;gap:10px;margin-top:16px}.cp-bt button{flex:1;padding:14px;border-radius:12px;font:inherit;font-weight:700;font-size:15px;cursor:pointer;border:1px solid #cdd8cf;background:#fff;color:#14301f}
  .cp-bt .pri{background:#14402b;border-color:#14402b;color:#fff}`;
  document.head.appendChild(css);

  const expired = c => c.expires_at && new Date(c.expires_at) < new Date();
  const val = c => Number(c.discount_amount) > 0 ? rs(c.discount_amount) + " FLAT OFF" : Number(c.discount_percent || 0) + "% OFF";
  const dstr = s => { try { return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }); } catch (e) { return s; } };
  const isoDate = s => { try { return new Date(new Date(s).getTime() + 5.5 * 3600e3).toISOString().slice(0, 10); } catch (e) { return ""; } };
  const auto = (type, v, min) => (type === "flat" ? `${rs(v || 0)} ki flat chhoot` : `${Number(v || 0)}% chhoot`) + (Number(min) > 0 ? `, kam se kam ${rs(min)} ke order par` : ", kisi bhi order par");

  async function load() {
    const host = $("apCoupons"); if (!host) return;
    let r = await supabaseClient.from("coupons").select("*");
    if (r.error) { host.innerHTML = `<div class="cp-warn">Coupons load nahi hue: ${esc(r.error.message || "")}</div>`; return; }
    list = (r.data || []).slice().sort((a, b) => (b.is_active - a.is_active) || String(a.code).localeCompare(String(b.code)));
    noDesc = list.length ? !("description" in list[0]) : noDesc;
    paint();
  }

  function paint() {
    const host = $("apCoupons"); if (!host) return;
    host.innerHTML = `${(noDesc || rlsBad) ? `<div class="cp-warn">⚠️ Pehle Supabase SQL Editor me <b>supabase_v36_coupons.sql</b> chalao (ek baar), tabhi save / edit / delete sahi chalega.</div>` : ""}
      <button type="button" class="cp-new" id="cpNew">➕ Naya Coupon</button>
      ${list.length ? list.map(card).join("") : `<div class="cp-none">🏷️<br>Abhi koi coupon nahi hai.</div>`}`;
    $("cpNew").onclick = () => form(null);
    host.querySelectorAll("[data-ed]").forEach(b => b.onclick = () => form(list.find(c => c.code === b.dataset.ed)));
    host.querySelectorAll("[data-tg]").forEach(b => b.onclick = () => toggle(b.dataset.tg));
    host.querySelectorAll("[data-dl]").forEach(b => b.onclick = () => remove(b.dataset.dl));
  }

  function card(c) {
    const ex = expired(c), on = c.is_active && !ex;
    const st = ex ? `<span class="cp-st exp">Expired</span>` : `<span class="cp-st ${c.is_active ? "on" : "off"}">${c.is_active ? "Active" : "Deactive"}</span>`;
    const min = Number(c.min_order || 0);
    return `<div class="cp-card ${on ? "" : "off"}"><div class="cp-top"><span class="cp-code">${esc(c.code)}</span>${st}</div>
      <div class="cp-big">${esc(val(c))}</div>
      ${c.description ? `<div class="cp-ds">${esc(c.description)}</div>` : ""}
      <div class="cp-mt">${min > 0 ? "Min order " + rs(min) : "Koi minimum order nahi"}${c.expires_at ? " · Khatam: " + esc(dstr(c.expires_at)) : " · Expiry nahi"}</div>
      <div class="cp-ac"><button type="button" data-ed="${esc(c.code)}">✏️ Edit</button><button type="button" data-tg="${esc(c.code)}">${c.is_active ? "⏸ Deactive" : "▶ Active karo"}</button><button type="button" class="del" data-dl="${esc(c.code)}">🗑 Delete</button></div></div>`;
  }

  function fail(e) {
    const m = (e && e.message) || String(e);
    if (/row-level|policy|permission/i.test(m)) { rlsBad = true; paint(); return toast("Permission nahi mili. Pehle supabase_v36_coupons.sql chalao.", "error"); }
    toast("Nahi hua: " + m, "error");
  }

  async function toggle(code) {
    const c = list.find(x => x.code === code); if (!c) return;
    const want = !c.is_active;
    const r = await supabaseClient.from("coupons").update({ is_active: want }).eq("code", code).select();
    if (r.error) return fail(r.error);
    if (!r.data || !r.data.length) return fail({ message: "row-level security: update nahi hua" });
    c.is_active = want; toast(want ? `${code} active ho gaya` : `${code} deactive ho gaya`); load();
  }

  async function remove(code) {
    const ok = await confirm(`Coupon "${code}" delete karna hai? Ye wapas nahi aayega. (Purane orders par koi asar nahi padega.)`);
    if (!ok) return;
    const r = await supabaseClient.from("coupons").delete().eq("code", code).select();
    if (r.error) return fail(r.error);
    if (!r.data || !r.data.length) return fail({ message: "row-level security: delete nahi hua" });
    toast(`${code} delete ho gaya`); load();
  }

  function form(c) {
    const edit = !!c;
    const type0 = edit && Number(c.discount_amount) > 0 ? "flat" : "percent";
    const v0 = edit ? (type0 === "flat" ? c.discount_amount : c.discount_percent) : "";
    const bk = document.createElement("div"); bk.className = "cp-bk";
    bk.innerHTML = `<div class="cp-sh"><h3>${edit ? "Coupon edit karo" : "Naya Coupon"}</h3>
      <label>Coupon code</label><input type="text" id="cpCode" maxlength="20" autocapitalize="characters" autocomplete="off" placeholder="jaise DIWALI20" value="${edit ? esc(c.code) : ""}" ${edit ? "disabled" : ""}>
      <small>${edit ? "Code badla nahi ja sakta. Naya code chahiye to naya coupon banao." : "Sirf A-Z aur 0-9 (3 se 20 akshar). Customer yahi likhega."}</small>
      <div class="cp-2"><div><label>Discount type</label><select id="cpType"><option value="percent" ${type0 === "percent" ? "selected" : ""}>Percent (%)</option><option value="flat" ${type0 === "flat" ? "selected" : ""}>Flat (₹)</option></select></div>
      <div><label id="cpVl">Kitna</label><input type="number" id="cpVal" inputmode="decimal" min="0" placeholder="10" value="${esc(v0)}"></div></div>
      <div class="cp-2"><div><label>Minimum order ₹</label><input type="number" id="cpMin" inputmode="decimal" min="0" placeholder="0" value="${edit ? esc(c.min_order || 0) : ""}"></div>
      <div><label>Expire kab hoga</label><select id="cpEm"><option value="none">Kabhi nahi</option><option value="days">Itne din baad</option><option value="date">Fixed date par</option></select></div></div>
      <div id="cpEdays" style="display:none"><label>Kitne din baad expire ho</label><input type="number" id="cpDays" inputmode="numeric" min="1" max="3650" placeholder="jaise 7"><small id="cpDsm"></small></div>
      <div id="cpEdate" style="display:none"><label>Last date</label><input type="date" id="cpExp" value="${edit && c.expires_at ? isoDate(c.expires_at) : ""}"><small>Is din raat 11:59 tak chalega.</small></div>
      <label>Customer ko kya dikhega (optional)</label><textarea id="cpDs" placeholder="jaise: Diwali offer! 500 se upar ke order par 20% chhoot">${edit ? esc(c.description || "") : ""}</textarea>
      <small>Khali chhodo to apne aap likh jayega.</small>
      <div class="cp-pv" id="cpPv"></div>
      <label class="cp-ck"><input type="checkbox" id="cpAct" ${!edit || c.is_active ? "checked" : ""}> Active (customers use kar sakte hain)</label>
      <div class="cp-msg" id="cpMsg"></div>
      <div class="cp-bt"><button type="button" id="cpCancel">Cancel</button><button type="button" class="pri" id="cpSave">Save</button></div></div>`;
    document.body.appendChild(bk);
    const g = id => bk.querySelector("#" + id), close = () => bk.remove();
    const pv = () => {
      const t = g("cpType").value; g("cpVl").textContent = t === "flat" ? "Kitne ₹" : "Kitne %";
      const v = Number(g("cpVal").value);
      g("cpPv").innerHTML = v > 0 ? `👀 Is coupon se <b>${esc(auto(t, v, g("cpMin").value))}</b> milegi.` : "👀 Discount likho, yahan preview dikhega.";
    };
    ["cpType", "cpVal", "cpMin"].forEach(id => g(id).addEventListener("input", pv)); pv();
    const daysDate = n => { const t = new Date(Date.now() + 5.5 * 3600e3 + n * 86400e3).toISOString().slice(0, 10); return t; };
    const em = () => {
      const m = g("cpEm").value; g("cpEdays").style.display = m === "days" ? "block" : "none"; g("cpEdate").style.display = m === "date" ? "block" : "none";
      const n = Number(g("cpDays").value); g("cpDsm").textContent = m === "days" && n >= 1 ? "Khatam hoga: " + dstr(daysDate(n) + "T12:00:00+05:30") + " (raat 11:59 tak chalega)" : "";
    };
    if (edit && c.expires_at) g("cpEm").value = "date";
    g("cpEm").addEventListener("change", em); g("cpDays").addEventListener("input", em); em();
    g("cpCode").addEventListener("input", e => { e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
    g("cpCancel").onclick = close; bk.onclick = e => { if (e.target === bk) close(); };
    const msg = t => { g("cpMsg").textContent = t || ""; };
    g("cpSave").onclick = async () => {
      const code = g("cpCode").value.trim().toUpperCase(), type = g("cpType").value, v = Number(g("cpVal").value), min = Number(g("cpMin").value || 0);
      if (!edit && !/^[A-Z0-9]{3,20}$/.test(code)) return msg("Code 3 se 20 akshar ka ho (sirf A-Z, 0-9).");
      if (!(v > 0)) return msg("Discount 0 se zyada likho.");
      if (type === "percent" && v > 100) return msg("Percent 100 se zyada nahi ho sakta.");
      if (min < 0) return msg("Minimum order galat hai.");
      if (type === "flat" && min > 0 && v > min) return msg("Flat discount minimum order se zyada nahi hona chahiye.");
      const mode = g("cpEm").value; let d = "";
      if (mode === "days") { const n = Math.floor(Number(g("cpDays").value)); if (!(n >= 1 && n <= 3650)) return msg("Din 1 se 3650 ke beech likho."); d = daysDate(n); }
      else if (mode === "date") { d = g("cpExp").value; if (!d) return msg("Last date chuno."); if (d < daysDate(0)) return msg("Date aaj ya aage ki chuno."); }
      const row = {
        discount_percent: type === "percent" ? v : 0, discount_amount: type === "flat" ? v : 0,
        min_order: min, is_active: g("cpAct").checked, expires_at: d ? d + "T23:59:59+05:30" : null,
        description: g("cpDs").value.trim() || null
      };
      if (!edit) row.code = code;
      const b = g("cpSave"); b.disabled = true; b.textContent = "Saving…"; msg("");
      try {
        const run = r => edit ? supabaseClient.from("coupons").update(r).eq("code", c.code).select() : supabaseClient.from("coupons").insert(r).select();
        let r = await run(row);
        if (r.error && /description/i.test(r.error.message || "")) { const r2 = Object.assign({}, row); delete r2.description; r = await run(r2); if (!r.error) noDesc = true; }
        if (r.error) {
          if (r.error.code === "23505" || /duplicate/i.test(r.error.message || "")) throw new Error("Ye code pehle se hai. Dusra code chuno.");
          throw r.error;
        }
        if (edit && (!r.data || !r.data.length)) throw new Error("row-level security: update nahi hua");
        close(); toast(edit ? "Coupon update ho gaya" : "Coupon ban gaya"); load();
      } catch (e) {
        b.disabled = false; b.textContent = "Save";
        if (/row-level|policy|permission/i.test(e.message || "")) { rlsBad = true; msg("Permission nahi mili. Pehle supabase_v36_coupons.sql chalao."); paint(); }
        else msg("Save nahi hua: " + (e.message || e));
      }
    };
  }

  async function render() {
    if (done || !$("apCoupons")) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true; load();
  }
  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none") render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(render, 2200);
  }
})();
