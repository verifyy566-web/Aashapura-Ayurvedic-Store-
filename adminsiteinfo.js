/* Admin > Contact & Store Info: WhatsApp / customer-care number, email, address, hours, GST, FSSAI, links.
   Saved in table store_info (supabase_v42_storeinfo.sql). Only admin can change. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  let done = false;
  const css = document.createElement("style");
  css.textContent = `.si-box{max-width:560px}.si-box p.s{color:#5d7266;font-size:14px;margin:0 0 10px}
  .si-box label{display:block;font-weight:700;font-size:14px;margin:13px 0 4px;color:#173d2e}.si-box small{display:block;color:#6a7d70;font-size:12px;margin-top:3px}
  .si-box input[type=text],.si-box input[type=number],.si-box input[type=tel],.si-box textarea{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cdd8cf;border-radius:10px;font:inherit}
  .si-num{display:flex;align-items:center;gap:8px}.si-num span{background:#eef5ea;border:1px solid #cdd8cf;border-radius:10px;padding:12px;font-weight:700}
  .si-box h4{margin:20px 0 0;color:#14402b;border-top:1px solid #e3eadf;padding-top:14px}
  .si-box button.pri{width:100%;margin-top:18px;padding:14px;border:0;border-radius:12px;background:#14402b;color:#fff;font:inherit;font-weight:700;font-size:15px;cursor:pointer}
  .si-warn{background:#fff4dc;border:1px solid #f0d58a;color:#7a5200;border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:10px}.si-m{font-weight:600;margin-top:10px;font-size:14px}.si-m.bad{color:#b42318}.si-m.ok{color:#166534}`;
  document.head.appendChild(css);

  async function render() {
    const host = $("apSite"); if (!host || done) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true;
    const cfg = window.AASHAPURA_CONFIG || {};
    let cur = { support: cfg.support || "916367561630", email: cfg.email || "", address: cfg.address || "", hours: cfg.hours || "", gst: cfg.gst || "", fssai: cfg.fssai || "", ayush: cfg.ayush || "", return_days: cfg.returnDays || 7, instagram: cfg.instagram || "", facebook: cfg.facebook || "", youtube: cfg.youtube || "" };
    let missing = false;
    const r = await supabaseClient.from("store_info").select("*").eq("id", 1).maybeSingle();
    if (r.error && /store_info|schema|relation/i.test(r.error.message || "")) missing = true; else if (r.data) cur = Object.assign(cur, Object.fromEntries(Object.entries(r.data).map(([k, v]) => [k, v == null ? "" : v])));
    const ten = String(cur.support).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
    host.innerHTML = `<div class="si-box"><p class="s">Yahan se customer-care / WhatsApp number aur store ki details badlo. Website par turant badal jayega (footer, Contact, WhatsApp button, order messages).</p>
      ${missing ? `<div class="si-warn">Pehle Supabase SQL Editor me <b>supabase_v42_storeinfo.sql</b> chalao, phir page refresh karo.</div>` : ""}
      <label>Customer care / WhatsApp number</label><div class="si-num"><span>+91</span><input type="tel" id="siPhone" inputmode="numeric" maxlength="10" placeholder="10 digit number" value="${esc(ten)}"></div>
      <small>Isi number par customers ke WhatsApp message, Call button aur "order bhejo" jayenge. Number me WhatsApp chalu hona chahiye.</small>
      <label>Support time</label><input type="text" id="siHours" value="${esc(cur.hours)}" placeholder="10 AM – 7 PM (Mon–Sat)">
      <label>Email (optional)</label><input type="text" id="siEmail" value="${esc(cur.email)}" autocapitalize="none" placeholder="name@gmail.com">
      <label>Shop / office address (optional)</label><textarea id="siAddr" style="min-height:64px" placeholder="Shop no, area, city, pincode">${esc(cur.address)}</textarea>
      <h4>Licence / GST (khali = website par nahi dikhega)</h4>
      <label>GST number</label><input type="text" id="siGst" value="${esc(cur.gst)}" autocapitalize="characters" placeholder="27ABCDE1234F1Z5">
      <label>FSSAI number</label><input type="text" id="siFssai" value="${esc(cur.fssai)}" placeholder="14 digit">
      <label>AYUSH / Drug licence</label><input type="text" id="siAyush" value="${esc(cur.ayush)}">
      <h4>Policy &amp; social</h4>
      <label>Return ke din (delivery ke baad)</label><input type="number" id="siRet" min="1" max="60" value="${esc(cur.return_days || 7)}">
      <label>Instagram link</label><input type="text" id="siIg" value="${esc(cur.instagram)}" placeholder="https://instagram.com/…" autocapitalize="none">
      <label>Facebook link</label><input type="text" id="siFb" value="${esc(cur.facebook)}" placeholder="https://facebook.com/…" autocapitalize="none">
      <label>YouTube link</label><input type="text" id="siYt" value="${esc(cur.youtube)}" placeholder="https://youtube.com/…" autocapitalize="none">
      <div class="si-m" id="siMsg"></div><button type="button" class="pri" id="siSave">Save</button></div>`;
    const msg = (t, c) => { const m = $("siMsg"); m.textContent = t || ""; m.className = "si-m " + (c || ""); };
    $("siPhone").addEventListener("input", e => { e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10); });
    $("siSave").onclick = async () => {
      const num = $("siPhone").value.replace(/\D/g, "");
      if (!/^[6-9]\d{9}$/.test(num)) return msg("10 digit ka sahi mobile number likho (6-9 se shuru).", "bad");
      const link = v => { v = v.trim(); return v && !/^https?:\/\//i.test(v) ? "https://" + v : v; };
      const row = { id: 1, support: "91" + num, hours: $("siHours").value.trim() || null, email: $("siEmail").value.trim() || null, address: $("siAddr").value.trim() || null,
        gst: $("siGst").value.trim().toUpperCase() || null, fssai: $("siFssai").value.trim() || null, ayush: $("siAyush").value.trim() || null,
        return_days: Math.min(60, Math.max(1, Math.floor(Number($("siRet").value) || 7))), instagram: link($("siIg").value) || null, facebook: link($("siFb").value) || null, youtube: link($("siYt").value) || null, updated_at: new Date().toISOString() };
      if (row.support !== String(cur.support) && !(await confirm(`Customers ab +91 ${num} par message karenge. Pakka save karna hai?`))) return;
      const b = $("siSave"); b.disabled = true; b.textContent = "Saving…"; msg("");
      const s = await supabaseClient.from("store_info").upsert(row);
      b.disabled = false; b.textContent = "Save";
      if (s.error) return msg(/store_info|schema|relation/i.test(s.error.message || "") ? "Pehle supabase_v42_storeinfo.sql chalao." : "Save nahi hua: " + s.error.message, "bad");
      cur = Object.assign(cur, row);
      if (typeof window.aashapuraApplyInfo === "function") window.aashapuraApplyInfo(row);
      msg("✅ Save ho gaya. Website par ab naya number dikhega.", "ok"); toast("Contact info saved");
    };
  }
  const ab = $("adminProductBox");
  if (ab) { new MutationObserver(() => { if (ab.style.display !== "none") render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] }); setTimeout(render, 2600); }
})();
