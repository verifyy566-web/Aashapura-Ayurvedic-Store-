/* Refunds: customer page (request + status) and admin refund manager. Table: store_refunds */
(function () {
  const $ = id => document.getElementById(id);
  const WA = "916367561630";
  const T = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  const user = () => { try { return signedInUser; } catch (e) { return null; } };
  const sb = () => { try { return supabaseClient; } catch (e) { return null; } };
  const money = n => "₹" + Number(n || 0).toFixed(2);
  const dt = d => d ? new Date(d).toLocaleDateString(window.AASHAPURA_LANG === "hi" ? "hi-IN" : "en-IN") : "";
  const wa = t => window.open(`https://wa.me/${WA}?text=${encodeURIComponent(t)}`, "_blank", "noopener");

  const STATUS = {
    requested: [T("Requested", "निवेदन भेजा"), "#b45309", "#fef3c7"],
    approved: [T("Approved", "मंज़ूर"), "#1d4ed8", "#dbeafe"],
    rejected: [T("Rejected", "अस्वीकार"), "#b42318", "#fee4e2"],
    refunded: [T("Refunded", "रिफंड हो गया"), "#166534", "#dcfce7"],
    cancelled: [T("Cancelled", "रद्द किया"), "#555", "#eee"]
  };
  const badge = s => { const x = STATUS[s] || STATUS.requested; return `<span class="rf-badge" style="color:${x[1]};background:${x[2]}">${x[0]}</span>`; };
  const REASONS = [
    ["Wrong product received", "गलत प्रोडक्ट मिला"],
    ["Product not as described", "प्रोडक्ट वैसा नहीं जैसा बताया था"],
    ["Quality not good", "क्वालिटी अच्छी नहीं है"],
    ["Expired / near expiry", "एक्सपायरी डेट पास या खत्म"],
    ["Allergy / side effect", "एलर्जी / साइड इफेक्ट"],
    ["Damaged / leaking product", "प्रोडक्ट टूटा / लीक है"],
    ["Product not received", "प्रोडक्ट नहीं मिला"],
    ["Order cancelled after payment", "पेमेंट के बाद ऑर्डर कैंसल किया"],
    ["Paid twice", "दो बार पेमेंट हो गया"],
    ["Other (write your reason)", "अन्य (कारण लिखें)"]
  ];

  /* ---------- styles ---------- */
  const st = document.createElement("style");
  st.textContent = `
  .rf-wrap{position:fixed;inset:0;z-index:10050;background:#faf7f2;display:flex;flex-direction:column}
  .rf-head{display:flex;align-items:center;gap:10px;padding:12px 14px;background:#fff;border-bottom:1px solid #eee;font-weight:700}
  .rf-head button{border:0;background:#f1ece4;border-radius:10px;padding:8px 12px;font-size:15px}
  .rf-body{flex:1;overflow:auto;padding:14px;-webkit-overflow-scrolling:touch}
  .rf-card{background:#fff;border:1px solid #eee;border-radius:14px;padding:12px;margin-bottom:10px;font-size:14px;line-height:1.5}
  .rf-card small{color:#666;display:block}
  .rf-row{display:flex;justify-content:space-between;align-items:center;gap:8px}
  .rf-badge{padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700}
  .rf-note{margin-top:6px;padding:8px;background:#f6f6f6;border-radius:8px;font-size:13px}
  .rf-btn{display:block;width:100%;padding:13px;border:0;border-radius:12px;background:#2f6b3a;color:#fff;font-size:16px;font-weight:700;margin:8px 0}
  .rf-btn.alt{background:#fff;color:#2f6b3a;border:1px solid #2f6b3a}
  .rf-form label{display:block;margin:10px 0 4px;font-weight:600;font-size:14px}
  .rf-form select,.rf-form input,.rf-form textarea{width:100%;box-sizing:border-box;padding:11px;border:1px solid #ccc;border-radius:10px;font-size:16px;background:#fff}
  .rf-empty{text-align:center;color:#666;padding:30px 10px}
  .rf-admin{margin-top:18px;border-top:2px solid #ccc;padding-top:12px}
  .rf-admin .rf-acts{display:flex;gap:6px;margin-top:8px;flex-wrap:wrap}
  .rf-admin .rf-acts button{flex:1;padding:9px;border-radius:8px;border:1px solid #999;background:#fff}`;
  document.head.appendChild(st);

  /* ---------- customer page ---------- */
  let wrap = null;
  const shut = () => { if (wrap) { wrap.remove(); wrap = null; } };

  function frame(title, onBack) {
    if (wrap) wrap.remove();
    wrap = document.createElement("div"); wrap.className = "rf-wrap";
    wrap.innerHTML = `<div class="rf-head"><button type="button" id="rfBack">←</button><span>${esc(title)}</span></div><div class="rf-body" id="rfBody"></div>`;
    wrap.querySelector("#rfBack").onclick = onBack || shut;
    document.body.appendChild(wrap);
    return wrap.querySelector("#rfBody");
  }

  async function openRefunds() {
    const u = user();
    if (!u) { try { $("googleLoginBtn").click(); } catch (e) {} return; }
    const body = frame(T("Returns & Refunds", "रिटर्न और रिफंड"));
    body.innerHTML = `<div class="rf-empty">${T("Loading…", "लोड हो रहा है…")}</div>`;
    const { data, error } = await sb().from("store_refunds").select("*").eq("user_id", u.id).order("created_at", { ascending: false });
    if (error) {
      body.innerHTML = `<div class="rf-empty">${T("Could not load refunds.", "रिफंड लोड नहीं हुए।")}<br><small>${esc(error.message)}</small></div>`;
      return;
    }
    body.innerHTML = "";
    const add = document.createElement("button");
    add.type = "button"; add.className = "rf-btn"; add.textContent = T("+ New Return / Refund Request", "+ नया रिटर्न / रिफंड निवेदन");
    add.onclick = () => openForm();
    body.appendChild(add);
    if (!data.length) {
      const e = document.createElement("div"); e.className = "rf-empty";
      e.textContent = T("No refund requests yet.", "अभी कोई रिफंड निवेदन नहीं है।");
      body.appendChild(e);
    }
    data.forEach(r => {
      const c = document.createElement("div"); c.className = "rf-card";
      c.innerHTML = `<div class="rf-row"><b>${T("Order", "ऑर्डर")} #${esc(r.order_id)}</b>${badge(r.status)}</div>
        <small>${esc(dt(r.created_at))} · ${money(r.amount)}</small>
        <div>${esc(r.reason)}</div>
        ${r.admin_note ? `<div class="rf-note"><b>${T("Store note:", "दुकान का संदेश:")}</b> ${esc(r.admin_note)}</div>` : ""}
        ${r.details ? `<small>${esc(r.details)}</small>` : ""}
        ${Array.isArray(r.photos) && r.photos.length ? `<div class="md-row">${AashapuraMedia.thumbs(r.photos)}</div>` : ""}
        ${r.status === "refunded" ? `<small>${T("Money sent to", "पैसे भेजे गए")}: ${esc(r.refund_upi)}</small>` : ""}`;
      if (r.status === "requested") {
        const x = document.createElement("button"); x.type = "button"; x.className = "rf-btn alt";
        x.textContent = T("Cancel this request", "यह निवेदन रद्द करें");
        x.onclick = async () => {
          if (!(await confirm(T("Cancel this return request?", "यह रिटर्न निवेदन रद्द करें?")))) return;
          const { error: e2 } = await sb().rpc("cancel_my_return", { p_id: r.id });
          if (e2) return toast(e2.message, "error");
          toast(T("Request cancelled.", "निवेदन रद्द हो गया।")); openRefunds();
        };
        c.appendChild(x);
      }
      body.appendChild(c);
    });
    const help = document.createElement("button");
    help.type = "button"; help.className = "rf-btn alt"; help.textContent = T("💬 Chat with us on WhatsApp", "💬 WhatsApp पर बात करें");
    help.onclick = () => wa("Hello Aashapura Aurveda, I need help with a refund.");
    body.appendChild(help);
  }

  async function openForm() {
    const u = user();
    const body = frame(T("Return / Refund Request", "रिटर्न / रिफंड निवेदन"), openRefunds);
    body.innerHTML = `<div class="rf-empty">${T("Loading your orders…", "आपके ऑर्डर लोड हो रहे हैं…")}</div>`;
    const [o, r] = await Promise.all([
      sb().from("store_orders").select("id,order_no,total,payment_status,order_status,created_at").eq("user_id", u.id).order("created_at", { ascending: false }),
      sb().from("store_refunds").select("order_id,status").eq("user_id", u.id)
    ]);
    if (o.error) { body.innerHTML = `<div class="rf-empty">${esc(o.error.message)}</div>`; return; }
    const blocked = new Set((r.data || []).filter(x => ["requested", "approved", "refunded"].includes(x.status)).map(x => String(x.order_id)));
    const lc = v => String(v || "").toLowerCase();
    const orders = (o.data || []).filter(x => !blocked.has(String(x.id)) && (lc(x.payment_status) === "paid" || lc(x.order_status) === "delivered"));
    if (!orders.length) {
      body.innerHTML = `<div class="rf-empty">${T("No orders available for refund.", "रिफंड के लिए कोई ऑर्डर उपलब्ध नहीं है।")}</div>`;
      return;
    }
    body.innerHTML = `<div class="rf-form">
      <label>${T("Select order", "ऑर्डर चुनें")}</label>
      <select id="rfOrder">${orders.map(x => `<option value="${esc(x.id)}">#${esc(x.order_no || x.id)} · ${money(x.total)} · ${esc(x.payment_status || "pending")} · ${esc(dt(x.created_at))}</option>`).join("")}</select>
      <label>${T("Reason", "कारण")}</label>
      <select id="rfReason">${REASONS.map(x => `<option value="${esc(x[0])}">${esc(T(x[0], x[1]))}</option>`).join("")}</select>
      <div id="rfOtherBox" hidden><label>${T("Write your reason", "अपना कारण लिखें")}</label><input id="rfOther" maxlength="150"></div>
      <label>${T("Details (optional)", "विवरण (वैकल्पिक)")}</label>
      <textarea id="rfDetails" rows="3"></textarea>
      <label>${T("Photos / video of the product (needed for wrong, damaged or quality issues)", "प्रोडक्ट की फोटो / वीडियो (गलत, टूटा या क्वालिटी की समस्या में ज़रूरी)")}</label>
      <div id="rfMedia"></div>
      <label>${T("Your UPI ID (refund will be sent here)", "आपकी UPI ID (रिफंड यहीं आएगा)")}</label>
      <input id="rfUpi" placeholder="name@bank" autocapitalize="none" autocomplete="off">
      <button type="button" class="rf-btn" id="rfSend">${T("Submit Request", "निवेदन भेजें")}</button>
      <p class="small-note">${T("Refunds are checked by the store and sent to your UPI after approval. Tip: send photos of the product on WhatsApp for faster help.", "रिफंड दुकान जाँचकर मंज़ूरी के बाद आपकी UPI पर भेजेगी। जल्दी मदद के लिए प्रोडक्ट की फोटो WhatsApp पर भेजें।")}</p>
    </div>`;
    const pk = AashapuraMedia.picker(body.querySelector("#rfMedia"), { max: 4 });
    const rs = body.querySelector("#rfReason");
    rs.onchange = () => { body.querySelector("#rfOtherBox").hidden = !rs.value.startsWith("Other"); };
    body.querySelector("#rfSend").onclick = async () => {
      const id = body.querySelector("#rfOrder").value;
      const order = orders.find(x => String(x.id) === String(id));
      let reason = rs.value;
      if (reason.startsWith("Other")) {
        const t = body.querySelector("#rfOther").value.trim();
        if (!t) return toast(T("Please write your reason.", "कृपया अपना कारण लिखें।"), "error");
        reason = "Other: " + t;
      }
      const needPhoto = /^(Wrong|Damaged|Product not as|Quality|Expired|Allergy)/.test(reason);
      if (needPhoto && !pk.files().length) return toast(T("Please add at least one photo.", "कम से कम एक फोटो जोड़ें।"), "error");
      const details = body.querySelector("#rfDetails").value.trim();
      const upi = body.querySelector("#rfUpi").value.trim();
      if (!/^[\w.\-]{2,}@[A-Za-z][\w.\-]{1,}$/.test(upi)) return toast(T("Enter a valid UPI ID, like name@bank", "सही UPI ID भरें, जैसे name@bank"), "error");
      const btn = body.querySelector("#rfSend"); btn.disabled = true; btn.textContent = T("Sending…", "भेज रहे हैं…");
      let photos = [];
      try { photos = await AashapuraMedia.upload(pk.files(), "returns"); }
      catch (e) { btn.disabled = false; btn.textContent = T("Submit Request", "निवेदन भेजें"); return toast(T("Photo upload failed: ", "फोटो अपलोड नहीं हुई: ") + e.message, "error"); }
      const { error } = await sb().from("store_refunds").insert({
        order_id: String(id), user_id: u.id, reason, details: details || null, refund_upi: upi, amount: order ? order.total : null, status: "requested", photos
      });
      if (error) {
        btn.disabled = false; btn.textContent = T("Submit Request", "निवेदन भेजें");
        return toast(error.code === "23505" ? T("A refund request already exists for this order.", "इस ऑर्डर का रिफंड निवेदन पहले से है।") : T("Could not send: ", "भेज नहीं पाए: ") + error.message, "error");
      }
      toast(T("Refund request sent.", "रिफंड निवेदन भेज दिया गया।"));
      openRefunds();
    };
  }

  window.openRefunds = openRefunds;

  /* ---------- admin refund manager (only on ?page=admin after admin login) ---------- */
  async function adminRefunds() {
    const box = $("adminProductBox");
    if (!box || box.style.display === "none") return;
    let uid = null;
    try { uid = (await sb().auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    let host = $("adminRefunds");
    if (!host) {
      host = document.createElement("div"); host.id = "adminRefunds"; host.className = "rf-admin";
      const logout = box.querySelector('button[onclick="adminLogout()"]');
      logout ? box.insertBefore(host, logout) : box.appendChild(host);
    }
    host.innerHTML = "<h3>Refund Requests</h3><p>Loading…</p>";
    const { data, error } = await sb().from("store_refunds").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) { host.innerHTML = `<h3>Refund Requests</h3><p>${esc(error.message)}</p>`; return; }
    let orders = {};
    try {
      const ids = [...new Set(data.map(r => r.order_id))];
      if (ids.length) {
        const q = await sb().from("store_orders").select("id,order_no,customer_name,phone,total,payment_status").in("id", ids);
        (q.data || []).forEach(x => { orders[String(x.id)] = x; });
      }
    } catch (e) {}
    host.innerHTML = `<div class="rf-row"><h3 style="margin:0">Refund Requests</h3><button type="button" id="rfReload">↻</button></div>`;
    host.querySelector("#rfReload").onclick = adminRefunds;
    if (!data.length) host.insertAdjacentHTML("beforeend", "<p>No refund requests.</p>");
    data.forEach(r => {
      const o = orders[String(r.order_id)] || {};
      const c = document.createElement("div"); c.className = "rf-card"; c.style.marginTop = "10px";
      c.innerHTML = `<div class="rf-row"><b>Order #${esc(o.order_no || r.order_id)}</b>${badge(r.status)}</div>
        <small>${esc(o.customer_name || "")} ${o.phone ? "· " + esc(o.phone) : ""} · paid status: ${esc(o.payment_status || "?")}</small>
        <div><b>${money(r.amount)}</b> · ${esc(r.reason)}</div>
        ${r.details ? `<div>${esc(r.details)}</div>` : ""}
        ${Array.isArray(r.photos) && r.photos.length ? `<div class="md-row">${AashapuraMedia.thumbs(r.photos)}</div>` : ""}
        <div>UPI: <b>${esc(r.refund_upi)}</b></div>
        ${r.admin_note ? `<div class="rf-note">${esc(r.admin_note)}</div>` : ""}
        <div class="rf-acts"></div>`;
      const acts = c.querySelector(".rf-acts");
      (r.status === "cancelled" ? [] : [["approved", "Approve"], ["rejected", "Reject"], ["refunded", "Mark Refunded"]]).forEach(([s, label]) => {
        if (r.status === s) return;
        const b = document.createElement("button"); b.type = "button"; b.textContent = label;
        b.onclick = async () => {
          const note = window.prompt("Message for customer (optional):", r.admin_note || "");
          if (note === null) return;
          const up = await sb().from("store_refunds").update({ status: s, admin_note: note.trim() || null, updated_at: new Date().toISOString() }).eq("id", r.id);
          if (up.error) return toast(up.error.message, "error");
          toast("Updated"); adminRefunds();
        };
        acts.appendChild(b);
      });
      host.appendChild(c);
    });
  }

  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none" && !$("adminRefunds")) adminRefunds(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(adminRefunds, 1500);
  }
})();
