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
    picked_up: [T("Refund started", "रिफंड शुरू"), "#6d28d9", "#ede9fe"],
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


  /* ---------- tracker + timeline helpers ---------- */
  const LOC = () => (window.AASHAPURA_LANG === "hi" ? "hi-IN" : "en-IN");
  const sd = d => d ? new Date(d).toLocaleDateString(LOC(), { day: "numeric", month: "short" }) : "";
  const sdl = d => d ? new Date(d).toLocaleDateString(LOC(), { weekday: "short", day: "numeric", month: "short" }) : "";
  const stime = d => d ? new Date(d).toLocaleTimeString(LOC(), { hour: "numeric", minute: "2-digit" }) : "";
  const isCancelRef = r => /^Order cancelled/i.test(r.reason || "");
  const LVL = { requested: 0, approved: 1, picked_up: 2, refunded: 3 };
  const credit24 = r => T(`A refund of ${money(r.amount)} will be credited to your account within next 24 hours.`, `${money(r.amount)} का रिफंड अगले 24 घंटे में आपके अकाउंट में क्रेडिट हो जाएगा।`);

  const tst = document.createElement("style");
  tst.textContent = `
  .rf-trk{display:flex;margin:14px 0 6px}
  .rf-st{position:relative;flex:1;text-align:center;font-size:12px;color:#777;line-height:1.3}
  .rf-st i{display:flex;width:26px;height:26px;border-radius:50%;margin:0 auto 6px;align-items:center;justify-content:center;background:#d5d9d6;color:#fff;font-style:normal;font-size:13px;position:relative;z-index:1}
  .rf-st:not(:first-child)::before{content:"";position:absolute;top:12px;right:50%;width:100%;height:3px;background:#d5d9d6}
  .rf-st.done i{background:#1f8a4c}.rf-st.cur i{background:#1d4ed8}
  .rf-st.done:not(:first-child)::before,.rf-st.cur:not(:first-child)::before{background:#1f8a4c}
  .rf-st.done,.rf-st.cur{color:#222}.rf-st b{display:block;font-weight:600}.rf-st small{display:block;color:#777}
  .rf-msg{border-radius:10px;padding:10px 12px;margin:8px 0;font-size:14px;line-height:1.45}
  .rf-msg.y{background:#fef3c7;color:#7a4b00}.rf-msg.g{background:#dcfce7;color:#14532d;font-weight:600}.rf-msg.r{background:#fee4e2;color:#8a1c12}.rf-msg.n{background:#f2f5ff;color:#222}
  .rf-msg ul{margin:6px 0 0;padding-left:18px}
  .rf-amt{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-top:1px solid #eee;margin-top:8px}.rf-amt b{font-size:20px}
  .tl{padding:6px 2px}.tl-r{display:flex;gap:10px;position:relative;padding-bottom:16px}
  .tl-d{width:48px;flex:none;text-align:right;font-size:13px;color:#555;padding-top:1px}
  .tl-dot{width:20px;height:20px;border-radius:50%;background:#1f8a4c;color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;flex:none;position:relative;z-index:1}
  .tl-r.p .tl-dot{background:#cfd4d1}.tl-r:not(:last-child)::after{content:"";position:absolute;left:67px;top:20px;bottom:0;width:2px;background:#1f8a4c}.tl-r.p:not(:last-child)::after{background:#d5d9d6}
  .tl-c{flex:1;min-width:0;font-size:14px;line-height:1.4}.tl-c p{margin:4px 0 0}.tl-c small{display:block;color:#777;margin-top:2px}
  .tl-chip{display:inline-block;padding:3px 10px;border-radius:99px;font-size:13px;font-weight:600;background:#dbeafe;color:#1d4ed8}
  .tl-chip.green{background:#dcfce7;color:#166534}.tl-chip.red{background:#fee4e2;color:#b42318}.tl-chip.grey{background:#eee;color:#666}
  .tl-r.p .tl-c{color:#888}`;
  document.head.appendChild(tst);

  function trackerHTML(r) {
    if (r.status === "rejected" || r.status === "cancelled") return "";
    const c = isCancelRef(r), lvl = LVL[r.status] ?? 0;
    const list = c
      ? [[T("Refund Requested", "रिफंड निवेदन"), r.created_at], [T("Refund Started", "रिफंड शुरू"), r.approved_at], [T("Refund Success", "रिफंड सफल"), r.refunded_at]]
      : [[T("Return Requested", "रिटर्न निवेदन"), r.created_at], [T("Out for Pickup", "पिकअप"), r.pickup_by || r.approved_at], [T("Refund Started", "रिफंड शुरू"), r.picked_up_at], [T("Refund Success", "रिफंड सफल"), r.refunded_at]];
    const idx = c ? ({ requested: 0, approved: 1, picked_up: 1, refunded: 2 }[r.status] ?? 0) : lvl, last = list.length - 1;
    return `<div class="rf-trk">${list.map((x, i) => {
      const cls = r.status === "refunded" || i < idx ? "done" : i === idx ? "cur" : "";
      const ic = cls === "done" ? "✓" : (cls === "cur" ? (!c && i === 1 ? "🚚" : "●") : "");
      return `<div class="rf-st ${cls}"><i>${ic}</i><b>${esc(x[0])}</b><small>${esc(sd(x[1]))}</small></div>`;
    }).join("")}</div>`;
  }

  function messageHTML(r) {
    const c = isCancelRef(r);
    if (r.status === "requested") return `<div class="rf-msg y">⏳ ${T("Waiting for store approval. Your request is not accepted yet. We will update the status after checking.", "दुकान की मंज़ूरी का इंतज़ार है। आपका निवेदन अभी मंज़ूर नहीं हुआ है। जाँच के बाद स्टेटस अपडेट होगा।")}</div>`;
    if (r.status === "approved") return c
      ? `<div class="rf-msg n">✅ ${T("Approved. Your refund has started.", "मंज़ूर हो गया। आपका रिफंड शुरू हो गया है।")}</div>`
      : `<div class="rf-msg n"><b>${T("Please Note", "ज़रूरी बातें")}</b><ul><li>${T("Please keep your item ready for pickup", "कृपया प्रोडक्ट पिकअप के लिए तैयार रखें")}</li><li>${T("Our team will do a quick quality check during pickup", "पिकअप के समय हमारी टीम क्वालिटी चेक करेगी")}</li><li>${T("We'll process your refund right after collecting the item", "प्रोडक्ट मिलते ही हम रिफंड प्रोसेस करेंगे")}</li></ul></div>`;
    if (r.status === "picked_up") return `<div class="rf-msg g">💸 ${credit24(r)}</div>`;
    if (r.status === "refunded") return `<div class="rf-msg g">✅ ${T(`Refund successful. ${money(r.amount)} was sent to ${r.refund_upi}.`, `रिफंड सफल। ${money(r.amount)} ${r.refund_upi} पर भेज दिए गए।`)}</div>`;
    if (r.status === "rejected") return `<div class="rf-msg r">❌ ${T("Request rejected by the store.", "दुकान ने निवेदन अस्वीकार किया।")}</div>`;
    return `<div class="rf-msg n">${T("Request cancelled.", "निवेदन रद्द हुआ।")}</div>`;
  }

  function refundEvents(r) {
    const c = isCancelRef(r), a = money(r.amount), st = r.status, ev = [];
    ev.push({ at: r.created_at, title: c ? T("Refund Requested", "रिफंड निवेदन") : T("Return Requested", "रिटर्न निवेदन"), sub: T("Request sent. Waiting for store approval.", "निवेदन भेजा गया। दुकान की मंज़ूरी का इंतज़ार।"), tone: "blue", done: true });
    if (st === "rejected") { ev.push({ at: r.rejected_at || r.updated_at, title: T("Request Rejected", "निवेदन अस्वीकार"), sub: r.admin_note || "", tone: "red", done: true }); return ev; }
    if (st === "cancelled") { ev.push({ at: r.updated_at, title: T("Request Cancelled", "निवेदन रद्द"), sub: "", tone: "grey", done: true }); return ev; }
    const lvl = LVL[st] ?? 0, mk = (done, tone) => ({ done, tone: done ? tone : "grey" });
    if (c) {
      ev.push({ at: r.approved_at, title: T("Refund Started", "रिफंड शुरू"), sub: credit24(r), ...mk(lvl >= 1, "blue") });
      ev.push({ at: r.refunded_at, title: T("Refund Success", "रिफंड सफल"), sub: T(`${a} sent to ${r.refund_upi}`, `${a} ${r.refund_upi} पर भेजे गए`), ...mk(lvl >= 3, "green") });
    } else {
      ev.push({ at: r.approved_at, title: T("Pickup Scheduled", "पिकअप तय"), sub: r.pickup_by ? T(`Return pick-up will be done by ${sd(r.pickup_by)}. Refund will be processed after pickup.`, `रिटर्न पिकअप ${sd(r.pickup_by)} तक होगा। पिकअप के बाद रिफंड प्रोसेस होगा।`) : T("Your return is approved.", "आपका रिटर्न मंज़ूर हो गया।"), ...mk(lvl >= 1, "blue") });
      ev.push({ at: r.picked_up_at, title: T("Picked Up", "पिकअप हो गया"), sub: T("Item received by our team.", "प्रोडक्ट हमारी टीम को मिल गया।"), ...mk(lvl >= 2, "blue") });
      ev.push({ at: r.picked_up_at, title: T("Refund Started", "रिफंड शुरू"), sub: credit24(r), ...mk(lvl >= 2, "blue") });
      ev.push({ at: r.refunded_at, title: T("Refund Success", "रिफंड सफल"), sub: T(`${a} sent to ${r.refund_upi}`, `${a} ${r.refund_upi} पर भेजे गए`), ...mk(lvl >= 3, "green") });
    }
    return ev;
  }

  function orderEvents(o, withFuture) {
    const lc = v => String(v || "").toLowerCase(), os = lc(o.order_status) || "pending", ps = lc(o.payment_status) || "pending";
    const tm = (ts, stage) => ts || (os === stage ? o.updated_at : null);
    const ev = [{ at: o.created_at, title: T("Order Placed", "ऑर्डर हुआ"), sub: T("Your order has been placed.", "आपका ऑर्डर हो गया है।"), tone: "blue", done: true }];
    if (ps === "paid") ev.push({ at: o.paid_at, title: T("Payment Received", "पेमेंट मिला"), sub: T("We received your payment.", "हमें आपका पेमेंट मिल गया।"), tone: "green", done: true });
    else if (o.utr && os !== "cancelled") ev.push({ at: null, title: T("Payment Verifying", "पेमेंट जाँच में"), sub: T("Verification will take a few minutes.", "वेरिफिकेशन में कुछ मिनट लगेंगे।"), tone: "blue", done: true });
    if (os === "cancelled") { ev.push({ at: o.cancelled_at || o.updated_at, title: T("Order Cancelled", "ऑर्डर रद्द"), sub: o.cancel_reason || "", tone: "red", done: true }); return ev; }
    [["confirmed", ["confirmed", "shipped", "delivered"], T("Order Confirmed", "ऑर्डर कन्फर्म"), T("Your order is confirmed.", "आपका ऑर्डर कन्फर्म हो गया है।"), o.confirmed_at, "blue"],
      ["shipped", ["shipped", "delivered"], T("Shipped", "शिप हो गया"), T("Your item has been shipped.", "आपका प्रोडक्ट शिप हो गया है।"), o.shipped_at, "blue"],
      ["delivered", ["delivered"], T("Delivered", "डिलीवर हुआ"), T("Your item has been delivered.", "आपका प्रोडक्ट डिलीवर हो गया है।"), o.delivered_at, "green"]].forEach(([stage, ok, title, sub, ts, tone]) => {
      if (ok.includes(os)) ev.push({ at: tm(ts, stage), title, sub, tone, done: true });
      else if (withFuture) ev.push({ at: null, title, sub: "", tone: "grey", done: false });
    });
    return ev;
  }

  function openTrack(title, events, onBack) {
    const body = frame(title, onBack);
    body.innerHTML = `<div class="rf-card tl">${events.map(e => `<div class="tl-r ${e.done ? "" : "p"}"><div class="tl-d">${esc(e.done ? sd(e.at) : "")}</div><div class="tl-dot">${e.done ? "✓" : ""}</div><div class="tl-c"><span class="tl-chip ${e.tone || "blue"}">${esc(e.title)}</span>${e.done && e.sub ? `<p>${esc(e.sub)}</p>` : ""}${e.done && e.at ? `<small>${esc(stime(e.at))}</small>` : ""}</div></div>`).join("")}</div>`;
  }

  window.openOrderTrack = async function (od) {
    const u = user(); let refs = [];
    try { const q = await sb().from("store_refunds").select("*").eq("order_id", String(od.id)).eq("user_id", u.id).order("created_at", { ascending: true }); refs = q.data || []; } catch (e) {}
    const ev = orderEvents(od, !refs.length);
    refs.forEach(r => ev.push(...refundEvents(r)));
    openTrack(T("Track order", "ऑर्डर ट्रैक करें") + " #" + (od.order_no || od.id), ev, shut);
  };

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
      const ret = !isCancelRef(r);
      c.innerHTML = `<div class="rf-row"><b>${ret ? T("Return", "रिटर्न") : T("Refund", "रिफंड")} · ${T("Order", "ऑर्डर")} #${esc(r.order_id)}</b>${badge(r.status)}</div>
        <small>${esc(dt(r.created_at))}${r.status === "approved" && ret && r.pickup_by ? " · " + T("Pickup by", "पिकअप") + " " + esc(sdl(r.pickup_by)) : ""}</small>
        ${trackerHTML(r)}${messageHTML(r)}
        ${r.admin_note ? `<div class="rf-note"><b>${T("Store note:", "दुकान का संदेश:")}</b> ${esc(r.admin_note)}</div>` : ""}
        <div class="rf-amt"><span>${T("Refund amount", "रिफंड राशि")}<small>UPI: ${esc(r.refund_upi)}</small></span><b>${money(r.amount)}</b></div>
        <div><small style="display:inline">${T("Reason for return", "कारण")}:</small> ${esc(r.reason)}</div>
        ${r.details ? `<small>${esc(r.details)}</small>` : ""}
        ${Array.isArray(r.photos) && r.photos.length ? `<div class="md-row">${AashapuraMedia.thumbs(r.photos)}</div>` : ""}`;
      const trk = document.createElement("button"); trk.type = "button"; trk.className = "rf-btn alt"; trk.textContent = "📍 " + T("View all updates", "सभी अपडेट देखें");
      trk.onclick = () => openTrack(T("Refund updates", "रिफंड अपडेट") + " #" + r.order_id, refundEvents(r), openRefunds);
      c.appendChild(trk);
      if (r.status === "requested" || r.status === "approved") {
        const x = document.createElement("button"); x.type = "button"; x.className = "rf-btn alt";
        x.textContent = ret ? T("Cancel Return", "रिटर्न रद्द करें") : T("Cancel this request", "यह निवेदन रद्द करें");
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
    const blocked = new Set((r.data || []).filter(x => ["requested", "approved", "picked_up", "refunded"].includes(x.status)).map(x => String(x.order_id)));
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
      c.innerHTML = `<div class="rf-row"><b>${isCancelRef(r) ? "Refund (cancelled order)" : "Return"} · Order #${esc(o.order_no || r.order_id)}</b>${badge(r.status)}</div>
        ${r.pickup_by ? `<div>Pickup by: <b>${esc(r.pickup_by)}</b></div>` : ""}
        <small>${esc(o.customer_name || "")} ${o.phone ? "· " + esc(o.phone) : ""} · paid status: ${esc(o.payment_status || "?")}</small>
        <div><b>${money(r.amount)}</b> · ${esc(r.reason)}</div>
        ${r.details ? `<div>${esc(r.details)}</div>` : ""}
        ${Array.isArray(r.photos) && r.photos.length ? `<div class="md-row">${AashapuraMedia.thumbs(r.photos)}</div>` : ""}
        <div>UPI: <b>${esc(r.refund_upi)}</b></div>
        ${r.admin_note ? `<div class="rf-note">${esc(r.admin_note)}</div>` : ""}
        <div class="rf-acts"></div>`;
      const acts = c.querySelector(".rf-acts");
      const cType = isCancelRef(r);
      let btns = [];
      if (r.status === "requested") btns = cType ? [["approved", "▶ Start refund"], ["refunded", "💸 Mark Refunded"], ["rejected", "Reject"]] : [["approved", "✅ Approve & set pickup date"], ["rejected", "Reject"]];
      else if (r.status === "approved") btns = cType ? [["refunded", "💸 Mark Refunded"]] : [["picked_up", "📦 Pickup done – start refund"], ["rejected", "Reject"]];
      else if (r.status === "picked_up") btns = [["refunded", "💸 Money sent – Mark Refunded"]];
      btns.forEach(([s2, label]) => {
        const b = document.createElement("button"); b.type = "button"; b.textContent = label;
        b.onclick = async () => {
          const now = new Date().toISOString(), ts = {};
          if (s2 === "approved") {
            ts.approved_at = now;
            if (!cType) {
              const def = new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10);
              const d = window.prompt("Pickup by (date, YYYY-MM-DD):", def);
              if (d === null) return;
              if (!/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) return toast("Date aise likho: 2026-10-14", "error");
              ts.pickup_by = d.trim();
            }
          }
          if (s2 === "picked_up") ts.picked_up_at = now;
          if (s2 === "refunded") ts.refunded_at = now;
          if (s2 === "rejected") ts.rejected_at = now;
          const note = window.prompt("Message for customer (optional):", r.admin_note || "");
          if (note === null) return;
          const base = { status: s2, admin_note: note.trim() || null, updated_at: now };
          let up = await sb().from("store_refunds").update({ ...base, ...ts }).eq("id", r.id);
          if (up.error && /column|schema/i.test(up.error.message || "")) {
            up = await sb().from("store_refunds").update(base).eq("id", r.id);
            if (!up.error) toast("Status save hua, par dates ke liye supabase_v12.sql chalao.", "error");
          }
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
