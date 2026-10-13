/* Available Offers page (Myntra-style). Loads after cart2.js.
   Shows active coupons from Supabase table `coupons`. Wrong code -> "Coupon doesn't exist". */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rs = n => "₹" + (Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) {} };

  const css = document.createElement("style");
  css.textContent = `
  .ct-offers h4{margin:0 0 10px;font-size:18px}
  .of-row{display:flex;align-items:center;gap:12px;cursor:pointer}
  .of-ic{width:40px;height:40px;border-radius:50%;background:#e7f3ea;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none}
  .of-row .tx{flex:1;min-width:0}.of-row .tx b{display:block;font-size:16px}.of-row .tx small{display:block;color:#2f5d8a;margin-top:2px;font-size:13.5px}.of-row .tx small.g{color:#166534;font-weight:700}
  .of-row .ar{font-size:22px;color:#123c2b;font-weight:800}
  .of-row .of-rm{border:1px solid #b42318;background:#fff;color:#b42318;border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer}
  .of-pg{position:fixed;inset:0;z-index:100030;background:#fff;display:flex;flex-direction:column;color:#173d2e;font-family:inherit}
  .of-hd{display:flex;align-items:center;gap:14px;padding:14px 14px;background:#fff;border-bottom:1px solid #eef1ec}
  .of-hd button{border:0;background:none;font-size:26px;line-height:1;cursor:pointer;color:#173d2e}.of-hd b{font-size:19px}
  .of-sc{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 0 150px;background:#fff}
  .of-bn{background:#ecfdf3;padding:14px 16px;color:#166534}.of-bn b{display:block;font-size:17px}.of-bn span{color:#2d4a3a}
  .of-in{display:flex;align-items:center;margin:14px 14px 4px;border:1px solid #cfd6cc;border-radius:14px;padding:4px 6px 4px 14px}
  .of-in input{flex:1;border:0;outline:0;font:inherit;font-size:16px;padding:12px 0;min-width:0;background:none;text-transform:uppercase}
  .of-in button{border:0;background:none;color:var(--green,#123c2b);font-weight:800;font-size:17px;padding:10px 12px;cursor:pointer}
  .of-msg{margin:6px 18px 0;font-size:14px;line-height:1.45;min-height:4px}.of-msg.bad{color:#b42318;font-weight:600}.of-msg.ok{color:#166534;font-weight:600}
  .of-sec{margin:18px 14px 8px;font-size:19px;font-weight:800}
  .of-cd{margin:0 14px 12px;border:1px solid #e3e8e1;border-radius:14px;padding:14px}
  .of-cd.sel{border:1.5px solid var(--green,#123c2b)}
  .of-cd.dis .of-code,.of-cd.dis .of-ds{color:#9aa8a0}
  .of-top{display:flex;align-items:center;gap:10px}
  .of-sv{background:#22c55e;color:#fff;border-radius:6px;padding:3px 9px;font-weight:800;font-size:14px;flex:none}
  .of-cd.dis .of-sv{background:#c3cbc6}
  .of-code{flex:1;min-width:0;font-weight:800;font-size:16px;letter-spacing:.3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .of-ap{border:0;background:none;color:var(--green,#123c2b);font-weight:800;font-size:16px;cursor:pointer;padding:4px 2px}
  .of-ap:disabled{color:#b5beb8}
  .of-ds{margin:8px 0 0;font-size:15px;color:#3b5246}
  .of-lock{margin:6px 0 0;font-size:13.5px;color:#b45309;font-weight:600}
  .of-none{margin:30px 20px;text-align:center;color:#6b7f74}
  .of-ft{position:absolute;left:0;right:0;bottom:0;background:#fff;box-shadow:0 -2px 12px rgba(0,0,0,.08)}
  .of-sl{background:#e8f3ec;padding:12px 14px;display:flex;align-items:center;gap:10px;font-size:15px}
  .of-sl i{font-style:normal;background:#fff;border:1px solid var(--green,#123c2b);border-radius:20px;padding:6px 12px;font-weight:800;font-size:14px}
  .of-sl i em{font-style:normal;color:#166534;margin-left:8px;padding-left:8px;border-left:1px solid #cfd6cc}
  .of-bt{display:flex;align-items:center;gap:14px;padding:12px 14px calc(12px + env(safe-area-inset-bottom,0))}
  .of-bt small{display:block;color:#3b5246;font-weight:600}.of-bt strong{font-size:24px}
  .of-bt button{flex:1;border:0;border-radius:14px;background:var(--green,#123c2b);color:#fff;font-size:18px;font-weight:800;padding:16px;cursor:pointer}
  .of-bt button:disabled{background:#c3cbc6}`;
  document.head.appendChild(css);

  const isOk = (c, sub) => { const exp = c.expires_at && new Date(c.expires_at) < new Date(); return !exp && sub >= Number(c.min_order || 0); };
  const saving = (c, sub) => Math.min(sub, c.discount_amount ? Number(c.discount_amount) : sub * Number(c.discount_percent || 0) / 100);
  const descOf = c => {
    if (c.description && String(c.description).trim()) return String(c.description).trim();
    const min = Number(c.min_order || 0);
    const base = c.discount_amount ? L(`Flat ${rs(c.discount_amount)} off`, `${rs(c.discount_amount)} की फ्लैट छूट`) : L(`${Number(c.discount_percent || 0)}% off`, `${Number(c.discount_percent || 0)}% छूट`);
    return base + (min > 0 ? L(` on minimum purchase of Rs. ${min}`, ` कम से कम Rs. ${min} की खरीद पर`) : "");
  };

  async function fetchCoupons() {
    let { data, error } = await supabaseClient.from("coupons")
      .select("code, discount_percent, discount_amount, min_order, is_active, expires_at, description").eq("is_active", true);
    if (error) ({ data, error } = await supabaseClient.from("coupons")
      .select("code, discount_percent, discount_amount, min_order, is_active, expires_at").eq("is_active", true));
    if (error) throw error;
    return data || [];
  }

  /* opts: { sub, onDone } */
  function openOffers(opts) {
    const sub = Number(opts.sub) || 0;
    const OV = window.aashapuraAddr && window.aashapuraAddr.ov;
    const pg = document.createElement("div"); pg.className = "of-pg";
    document.body.appendChild(pg);
    let list = null, failed = false, sel = appliedCoupon ? appliedCoupon.code : null, msg = null, inputVal = "";
    let closed = false;
    const close = () => { if (closed) return; closed = true; if (OV) OV.close(pg); else pg.remove(); };
    if (OV) OV.push(pg);

    const card = c => {
      const ok = isOk(c, sub), sv = saving(c, sub), isSel = sel === c.code, isApplied = appliedCoupon && appliedCoupon.code === c.code;
      const need = Number(c.min_order || 0) - sub;
      return `<div class="of-cd ${isSel ? "sel" : ""} ${ok ? "" : "dis"}" data-card="${esc(c.code)}">
        <div class="of-top"><span class="of-sv">${L("Save", "बचत")} ${rs(Math.round(sv * 100) / 100)}</span><span class="of-code">${esc(c.code)}</span>
        ${isApplied ? `<button type="button" class="of-ap" data-rm="${esc(c.code)}" style="color:#173d2e">${L("Remove", "हटाएँ")}</button>` : `<button type="button" class="of-ap" data-ap="${esc(c.code)}" ${ok ? "" : "disabled"}>${isSel ? L("Selected", "चुना") : L("Apply", "लगाएँ")}</button>`}</div>
        <p class="of-ds">${esc(descOf(c))}</p>
        ${!ok && need > 0 ? `<p class="of-lock">🔒 ${L(`Add ${rs(need)} more to unlock`, `अनलॉक के लिए ${rs(need)} और जोड़ें`)}</p>` : ""}
      </div>`;
    };

    const draw = () => {
      const keep = pg.querySelector("#ofIn"); if (keep) inputVal = keep.value;
      const valid = (list || []).filter(c => !(c.expires_at && new Date(c.expires_at) < new Date()));
      const sorted = valid.slice().sort((a, b) => (isOk(b, sub) - isOk(a, sub)) || (saving(b, sub) - saving(a, sub)));
      const best = sorted.length && isOk(sorted[0], sub) ? sorted[0] : null;
      const rest = sorted.filter(c => c !== best);
      const chosen = sel && valid.find(c => c.code === sel);
      const selSv = chosen && isOk(chosen, sub) ? saving(chosen, sub) : 0;
      let body = "";
      if (list === null && !failed) body = `<p class="of-none">${L("Loading offers…", "ऑफ़र लोड हो रहे हैं…")}</p>`;
      else if (failed) body = `<p class="of-none">${L("Could not load offers. Check internet. You can still type a code above.", "ऑफ़र लोड नहीं हुए। इंटरनेट जाँचें। आप ऊपर कोड लिख सकते हैं।")}</p>`;
      else if (!sorted.length) body = `<p class="of-none">🏷️<br>${L("No coupons available right now.", "अभी कोई कूपन उपलब्ध नहीं है।")}</p>`;
      else body = (best ? `<div class="of-sec">🏅 ${L("Best Offer", "बेस्ट ऑफ़र")}</div>${card(best)}` : "") + (rest.length ? `<div class="of-sec">${best ? L("More Offers", "और ऑफ़र") : L("Offers", "ऑफ़र")}</div>${rest.map(card).join("")}` : "");
      pg.innerHTML = `<div class="of-hd"><button type="button" id="ofBack" aria-label="${L("Back", "वापस")}">←</button><b>${L("Available Offers", "उपलब्ध ऑफ़र")}</b></div>
      <div class="of-sc">
        <div class="of-bn"><b>🎟️ ${L("Save more on this order", "इस ऑर्डर पर और बचाएँ")}</b><span>${L("Pick a coupon or type your code", "कूपन चुनें या कोड लिखें")}</span></div>
        <div class="of-in"><input id="ofIn" placeholder="${L("Enter coupon code", "कूपन कोड लिखें")}" autocapitalize="characters" autocomplete="off" value="${esc(inputVal)}"><button type="button" id="ofCheck">${L("Check", "जाँचें")}</button></div>
        <div class="of-msg ${msg ? msg.t : ""}" id="ofMsg">${msg ? esc(msg.m) : ""}</div>
        ${body}
      </div>
      <div class="of-ft">
        ${chosen && selSv > 0 ? `<div class="of-sl">${L("Selected Offer", "चुना हुआ ऑफ़र")}: <i>${esc(chosen.code)}<em>${rs(Math.round(selSv * 100) / 100)} ${L("Off", "छूट")}</em></i></div>` : ""}
        <div class="of-bt"><div><small>${L("Total Savings", "कुल बचत")}</small><strong>${rs(Math.round(selSv * 100) / 100)}</strong></div>
        <button type="button" id="ofDone" ${chosen && selSv > 0 ? "" : "disabled"}>${L("Apply", "लगाएँ")}${chosen && selSv > 0 ? ` (1 ${L("offer", "ऑफ़र")})` : ""}</button></div>
      </div>`;
      wire();
    };

    const finish = async code => {
      const r = await validateStoreCoupon(code, sub);
      if (!r.ok) { appliedCoupon = null; msg = { t: "bad", m: L("This coupon can't be applied right now.", "यह कूपन अभी लागू नहीं हो सकता।") }; draw(); return; }
      appliedCoupon.forSub = sub;
      toast(L(`Coupon ${appliedCoupon.code} applied: you save ${rs(Math.round(appliedCoupon.discount * 100) / 100)}`, `कूपन ${appliedCoupon.code} लागू: ${rs(Math.round(appliedCoupon.discount * 100) / 100)} की बचत`));
      close(); try { opts.onDone && opts.onDone(); } catch (e) {}
    };

    const check = async () => {
      const inp = pg.querySelector("#ofIn"), code = (inp.value || "").trim().toUpperCase(); inputVal = inp.value;
      if (!code) { msg = { t: "bad", m: L("Please enter a coupon code.", "कृपया कूपन कोड लिखें।") }; return draw(); }
      if (list === null || failed) {
        try { list = await fetchCoupons(); failed = false; } catch (e) { failed = true; }
      }
      if (failed) { // offline fallback: server-side check only
        const r = await validateStoreCoupon(code, sub).catch(() => ({ ok: false }));
        if (r.ok) { appliedCoupon.forSub = sub; toast(r.message); close(); try { opts.onDone && opts.onDone(); } catch (e) {} return; }
        msg = { t: "bad", m: L("Coupon doesn't exist", "यह कूपन मौजूद नहीं है") }; return draw();
      }
      const c = list.find(x => String(x.code).toUpperCase() === code);
      if (!c) { sel = null; msg = { t: "bad", m: L(`Coupon "${code}" doesn't exist`, `कूपन "${code}" मौजूद नहीं है`) }; return draw(); }
      if (c.expires_at && new Date(c.expires_at) < new Date()) { msg = { t: "bad", m: L("This coupon has expired", "इस कूपन की अवधि समाप्त हो गई है") }; return draw(); }
      if (sub < Number(c.min_order || 0)) { msg = { t: "bad", m: L(`Minimum order of ${rs(c.min_order)} needed for this coupon`, `इस कूपन के लिए कम से कम ${rs(c.min_order)} का ऑर्डर चाहिए`) }; return draw(); }
      sel = c.code; inputVal = "";
      msg = { t: "ok", m: L(`✅ ${c.code} selected. You save ${rs(Math.round(saving(c, sub) * 100) / 100)}. Tap Apply below.`, `✅ ${c.code} चुना गया। आप ${rs(Math.round(saving(c, sub) * 100) / 100)} बचाएँगे। नीचे लगाएँ दबाएँ।`) };
      draw();
    };

    const wire = () => {
      pg.querySelector("#ofBack").onclick = close;
      pg.querySelector("#ofCheck").onclick = check;
      pg.querySelector("#ofIn").onkeydown = e => { if (e.key === "Enter") check(); };
      pg.querySelectorAll("[data-ap]").forEach(b => b.onclick = () => { sel = b.dataset.ap; msg = null; draw(); });
      pg.querySelectorAll("[data-rm]").forEach(b => b.onclick = () => { appliedCoupon = null; sel = null; msg = null; try { opts.onDone && opts.onDone(); } catch (e) {} draw(); });
      const dn = pg.querySelector("#ofDone"); if (dn) dn.onclick = () => { if (sel) finish(sel); };
    };

    draw();
    fetchCoupons().then(d => { list = d; draw(); }).catch(() => { failed = true; draw(); });
  }

  window.aashapuraOffers = { open: openOffers };
})();
