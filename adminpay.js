/* Admin > Payment (UPI & QR): edit UPI ID, payee name and QR image. Saved in table payment_settings (supabase_v28.sql). */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  const BUCKET = "product-images";
  let done = false;

  const css = document.createElement("style");
  css.textContent = `.pay-box{max-width:520px}.pay-box h3{margin:0 0 4px}.pay-box p.s{color:#5d7266;font-size:14px;margin:0 0 12px}
  .pay-box label{display:block;font-weight:700;font-size:14px;margin:12px 0 4px}
  .pay-box input[type=text]{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cdd8cf;border-radius:10px;font:inherit}
  .pay-qr{display:flex;gap:14px;align-items:center;margin-top:6px}.pay-qr img{width:130px;height:130px;object-fit:contain;border:1px solid #dfe8dc;border-radius:12px;background:#fff}
  .pay-qr .b{flex:1;display:flex;flex-direction:column;gap:8px}
  .pay-box button{border:1px solid #cfd9cb;background:#fff;border-radius:10px;padding:11px;font:inherit;font-weight:600;cursor:pointer;color:#173d2e}
  .pay-box button.pri{background:#14402b;color:#fff;border-color:#14402b;width:100%;margin-top:16px;padding:14px;font-weight:700}
  .pay-msg{font-size:14px;margin-top:10px;font-weight:600}.pay-msg.bad{color:#b42318}.pay-msg.ok{color:#166534}`;
  document.head.appendChild(css);

  async function render() {
    const host = $("apPay"); if (!host || done) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true;
    let cur = { upi_id: UPI_ID, payee_name: (typeof UPI_NAME !== "undefined" ? UPI_NAME : "Aashapura Ayurveda"), qr_url: "" };
    let missing = false;
    const r = await supabaseClient.from("payment_settings").select("upi_id,payee_name,qr_url").eq("id", 1).maybeSingle();
    if (r.error && /payment_settings|schema|relation/i.test(r.error.message || "")) missing = true;
    else if (r.data) cur = { upi_id: r.data.upi_id || cur.upi_id, payee_name: r.data.payee_name || cur.payee_name, qr_url: r.data.qr_url || "" };
    let file = null, clearQr = false;

    host.innerHTML = `<div class="pay-box">
      <p class="s">Yahan se UPI ID aur QR badlo. Naye orders me turant dikhega.</p>
      ${missing ? `<div class="pay-msg bad">Pehle Supabase SQL Editor me <b>supabase_v28.sql</b> chalao, phir page refresh karo.</div>` : ""}
      <label>UPI ID</label><input type="text" id="payUpi" value="${esc(cur.upi_id)}" autocapitalize="none" autocomplete="off" placeholder="name@bank">
      <label>Payee name (UPI app me dikhega)</label><input type="text" id="payName" value="${esc(cur.payee_name)}" placeholder="Aashapura Ayurveda">
      <label>QR code</label>
      <div class="pay-qr"><img id="payImg" src="${esc(cur.qr_url || "upi-qr.jpg")}" alt="QR">
        <div class="b"><button type="button" id="payPick">📷 QR photo chuno</button><button type="button" id="payDef">Purana (default) QR</button><input type="file" id="payFile" accept="image/*" hidden></div></div>
      <div class="pay-msg" id="payMsg"></div>
      <button type="button" class="pri" id="paySave">Save</button></div>`;
    const msg = (t, c) => { const m = $("payMsg"); m.textContent = t || ""; m.className = "pay-msg " + (c || ""); };
    $("payPick").onclick = () => $("payFile").click();
    $("payFile").onchange = e => { const f = e.target.files[0]; if (!f) return; if (!/^image\//.test(f.type)) return msg("Sirf image chuno.", "bad"); if (f.size > 5 * 1024 * 1024) return msg("Image 5 MB se chhoti honi chahiye.", "bad"); file = f; clearQr = false; $("payImg").src = URL.createObjectURL(f); msg(""); };
    $("payDef").onclick = () => { file = null; clearQr = true; $("payImg").src = "upi-qr.jpg"; msg("Save karne par site ka default QR (upi-qr.jpg) lagega.", "ok"); };
    $("paySave").onclick = async () => {
      const upi = $("payUpi").value.trim(), name = $("payName").value.trim() || "Aashapura Ayurveda";
      if (!/^[A-Za-z0-9._\-]{2,}@[A-Za-z][A-Za-z0-9]{1,}$/.test(upi)) return msg("UPI ID sahi likho, jaise name@bank", "bad");
      const ok = await confirm(`UPI ID "${upi}" par naye payments aayenge. Pakka save karna hai?`);
      if (!ok) return;
      const b = $("paySave"); b.disabled = true; b.textContent = "Saving…"; msg("");
      try {
        let qr = clearQr ? "" : cur.qr_url;
        if (file) {
          const path = `upi-qr-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
          const up = await supabaseClient.storage.from(BUCKET).upload(path, file, { contentType: file.type });
          if (up.error) throw up.error;
          qr = supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        }
        const row = { id: 1, upi_id: upi, payee_name: name, qr_url: qr || null, updated_at: new Date().toISOString() };
        const s = await supabaseClient.from("payment_settings").upsert(row);
        if (s.error) throw s.error;
        cur = { upi_id: upi, payee_name: name, qr_url: qr }; file = null; clearQr = false;
        try { localStorage.setItem("aashapura_pay", JSON.stringify(cur)); } catch (e) {}
        if (typeof window.aashapuraApplyPay === "function") window.aashapuraApplyPay(cur);
        msg("✅ Save ho gaya. Ab naye orders me yahi UPI/QR dikhega.", "ok"); toast("Payment settings saved");
      } catch (e) {
        msg(/payment_settings|schema|relation/i.test(e.message || "") ? "Pehle supabase_v28.sql chalao." : "Save nahi hua: " + (e.message || e), "bad");
      } finally { b.disabled = false; b.textContent = "Save"; }
    };
  }

  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none") render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(render, 1800);
  }
})();
