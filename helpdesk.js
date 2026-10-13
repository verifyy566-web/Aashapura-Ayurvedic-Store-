/* Help Desk: order samasya hal -> na hui to Customer Care number + WhatsApp par chat transfer (poori baat ke saath).
   Number admin menu "Contact & Store Info" se aata hai. Har customer ka apna phone = ek saath kitne bhi customers use kar sakte hain. */
(function () {
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cfg = () => window.AASHAPURA_CONFIG || {};
  const num = () => String(cfg().support || "916367561630").replace(/\D/g, "");
  const pretty = () => { const n = num(); return n.length === 12 ? "+" + n.slice(0, 2) + " " + n.slice(2, 7) + " " + n.slice(7) : "+" + n; };
  const ST = { pending: "Order place hua, confirm hone ka intezaar", confirmed: "Order confirm ho gaya, jald ship hoga", shipped: "Order ship ho chuka hai", delivered: "Order deliver ho chuka hai", cancelled: "Order cancel ho gaya" };
  const PAY = { pending: "Payment verify hona baaki", paid: "Payment mil gaya ✅", failed: "Payment fail", refunded: "Refund ho chuka" };
  let log = [], order = null, orders = [], tries = 0;

  async function loadOrders() {
    try { if (typeof signedInUser === "undefined" || !signedInUser) return []; const r = await supabaseClient.from("store_orders").select("*").eq("user_id", signedInUser.id).order("created_at", { ascending: false }).limit(5); return r.data || []; } catch (e) { return []; }
  }
  const who = () => { try { return (document.getElementById("profileName") || {}).value || (signedInUser && signedInUser.email) || "Customer"; } catch (e) { return "Customer"; } };
  function summary(issue) {
    return `Namaste Aashapura Ayurveda, mujhe help chahiye.\nNaam: ${who()}\n${order ? "Order: #" + order.order_no + " (" + (ST[order.order_status] || order.order_status) + ", " + (PAY[order.payment_status] || order.payment_status) + ")\n" : ""}Samasya: ${issue || "-"}\n\nHelp Desk chat:\n` + log.slice(-8).map(l => "- " + l).join("\n");
  }
  function css() {
    if (document.getElementById("hdCss")) return;
    const s = document.createElement("style"); s.id = "hdCss";
    s.textContent = `.hd-pg{position:fixed;inset:0;z-index:9650;background:#fbf7ec;display:flex;flex-direction:column;font-family:'DM Sans',sans-serif}
.hd-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(90deg,#123c2b,#1e6245);color:#f3e2b3;border-bottom:2px solid #d9b36a}.hd-hd b{flex:1;font:700 20px 'Cormorant Garamond',Georgia,serif}.hd-hd button{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:10px;padding:8px 11px;font-size:16px}
.hd-ms{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.hd-m{max-width:90%;padding:11px 14px;border-radius:16px;line-height:1.55;font-size:14.5px;white-space:pre-wrap;word-break:break-word}.hd-m.u{align-self:flex-end;background:#123c2b;color:#fff}.hd-m.a{align-self:flex-start;background:#fff;border:1px solid #e6dec8;box-shadow:0 2px 10px rgba(60,48,20,.07)}
.hd-ch{display:flex;flex-wrap:wrap;gap:8px}.hd-ch button,.hd-b{border:1px solid #d9b36a;background:#fff;color:#123c2b;border-radius:99px;padding:9px 14px;font:inherit;font-size:13.5px;text-decoration:none;cursor:pointer}
.hd-b.p{background:#123c2b;color:#fff;border-color:#123c2b}.hd-b.w{background:#25d366;color:#fff;border-color:#25d366}
.hd-care{align-self:stretch;background:#fff;border:1.5px solid #d9b36a;border-radius:18px;padding:16px;box-shadow:0 6px 20px rgba(60,48,20,.1)}.hd-care h4{margin:0 0 6px;font:700 20px 'Cormorant Garamond',Georgia,serif;color:#123c2b}.hd-care .n{font-size:22px;font-weight:700;color:#123c2b;margin:6px 0}.hd-care .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.hd-ft{padding:8px 12px calc(10px + env(safe-area-inset-bottom,0px));background:#fff;border-top:1px solid #e6dec8}.hd-in{display:flex;gap:8px}.hd-in input{flex:1;min-width:0;padding:12px 14px;border:1px solid #e6dec8;border-radius:14px;font:inherit;background:#fbf7ec}.hd-in button{border:0;border-radius:14px;padding:0 16px;font-size:18px;background:#123c2b;color:#fff}`;
    document.head.appendChild(s);
  }
  async function open() {
    if (document.getElementById("hdPg")) return;
    css(); log = []; order = null; tries = 0; orders = await loadOrders();
    const pg = document.createElement("div"); pg.className = "hd-pg"; pg.id = "hdPg";
    pg.innerHTML = `<div class="hd-hd"><button id="hdX">←</button><b>🎧 Help Desk</b><button id="hdAi" title="Ayurveda AI">🌿</button></div><div class="hd-ms" id="hdMs"></div><div class="hd-ft"><div class="hd-in"><input id="hdIn" placeholder="Apni samasya likhein..." autocomplete="off"><button id="hdGo">➤</button></div></div>`;
    document.body.appendChild(pg);
    try { history.pushState({ hd: 1 }, ""); } catch (e) { }
    const ms = pg.querySelector("#hdMs"), inp = pg.querySelector("#hdIn");
    const say = (t, cls) => { const d = document.createElement("div"); d.className = "hd-m " + (cls || "a"); d.textContent = t; ms.appendChild(d); ms.scrollTop = ms.scrollHeight; if (cls !== "u") log.push("Help Desk: " + t.split("\n")[0].slice(0, 80)); return d; };
    const btns = (arr) => { const w = document.createElement("div"); w.className = "hd-ch"; arr.forEach(([t, f, c]) => { const b = document.createElement("button"); b.className = c || ""; b.textContent = t; b.onclick = () => { w.remove(); f(); }; w.appendChild(b); }); ms.appendChild(w); ms.scrollTop = ms.scrollHeight; };
    const close = () => { pg.remove(); };
    const go = (fn) => { close(); try { history.back(); } catch (e) { } setTimeout(fn, 150); };
    const care = (issue) => {
      const d = document.createElement("div"); d.className = "hd-care";
      const hrs = cfg().hours ? `<div style="font-size:12.5px;color:#6f7466">Samay: ${esc(cfg().hours)}</div>` : "";
      d.innerHTML = `<h4>🙏 Hamari team aapki madad karegi</h4><div style="font-size:14px">Customer Care number:</div><div class="n">${esc(pretty())}</div>${hrs}<div class="row"><a class="hd-b p" href="tel:+${num()}">📞 Call karein</a><a class="hd-b w" target="_blank" rel="noopener" href="https://wa.me/${num()}?text=${encodeURIComponent(summary(issue))}">💬 WhatsApp par chat transfer</a></div><div style="font-size:12px;color:#6f7466;margin-top:10px">WhatsApp khulne par aapki order details aur ye poori baat pehle se likhi hogi, bas Send dabayein.</div>`;
      ms.appendChild(d); ms.scrollTop = ms.scrollHeight; log.push("Chat customer care ko transfer");
    };
    const solved = (issue) => {
      say("Kya aapki samasya hal hui?");
      btns([["✅ Haan, hal ho gayi", () => { say("Haan, hal ho gayi", "u"); say("Bahut accha 😊 Aur koi madad chahiye to bataiye."); menu(); }], ["❌ Nahi", () => { say("Nahi", "u"); tries++; care(issue); }]]);
    };
    const need = (cb) => { if (order || !orders.length) return cb(); say("Kis order ke baare me?"); btns(orders.map(o => [`#${o.order_no} • ${o.order_status}`, () => { order = o; say("#" + o.order_no, "u"); cb(); }]).concat([["Order nahi mila", () => cb()]])); };
    const A = {
      track: () => need(() => {
        if (!order) { say("Order ID ke bina main status nahi dekh sakta. Sign in karke My Orders me dekhein, ya customer care se baat karein."); return care("Order status"); }
        const ex = order.exp_min && order.exp_max ? `\nAnumanit delivery: ${order.exp_min} - ${order.exp_max}` : "", cr = order.courier ? `\nCourier: ${order.courier}${order.tracking_id ? " • ID " + order.tracking_id : ""}` : "";
        say(`📦 #${order.order_no}\n${ST[order.order_status] || order.order_status}\n${PAY[order.payment_status] || ""}${cr}${ex}`);
        if (window.openOrderTrack) btns([["🔎 Poora tracking dekhein", () => go(() => window.openOrderTrack(order))], ["Aage", () => solved("Order tracking")]]); else solved("Order tracking");
      }),
      cancel: () => need(() => {
        const s = order && order.order_status;
        if (s === "shipped" || s === "delivered") { say("Ship ya deliver ho chuka order cancel nahi hota. Delivered order ke liye Return kar sakte hain."); return solved("Cancel (shipped)"); }
        if (s === "cancelled") { say("Ye order pehle hi cancel ho chuka hai. Refund 'Returns & Refunds' me dekhein."); return solved("Cancel done"); }
        say("Order cancel karne ke liye: My Orders kholein → order me 'Cancel Order' dabayein → wajah aur refund UPI bharein. Pending/confirmed order hi cancel hota hai. Refund 24 ghante me.");
        btns([["📦 My Orders kholein", () => go(() => { const b = document.getElementById("openMyOrdersBtn"); b && b.click(); })], ["Aage", () => solved("Order cancel")]]);
      }),
      pay: () => need(() => {
        say("Payment ke baad 'Send order & payment screenshot on WhatsApp' dabana zaroori hai. Hamari team screenshot dekh kar order confirm karti hai (aam taur par kuch ghanton me)." + (order ? `\n\nAapka payment status: ${PAY[order.payment_status] || order.payment_status}` : ""));
        btns([["💬 Screenshot bhejein", () => window.open(`https://wa.me/${num()}?text=${encodeURIComponent("Namaste, mera payment screenshot." + (order ? " Order #" + order.order_no : ""))}`, "_blank", "noopener")], ["Aage", () => solved("Payment confirm nahi")]]);
      }),
      ret: () => { say("Galat, tuta ya kharab product aaya ho to Returns & Refunds me request daalein. Damage/quality ke liye photo ya video zaroori hai. Pehle team approve karti hai, phir pickup hota hai."); btns([["↩️ Return / Refund kholein", () => go(() => window.openRefunds && window.openRefunds())], ["Aage", () => solved("Return / damaged")]]); },
      refund: () => { say("Cancel kiye order ka refund 24 ghante me aapke diye UPI par aata hai. Return me pickup confirm hone ke baad 24 ghante me. Status 'Returns & Refunds' me dikhta hai."); btns([["↩️ Refund status dekhein", () => go(() => window.openRefunds && window.openRefunds())], ["Aage", () => solved("Refund kab")]]); },
      late: () => need(() => { say("Delivery me deri ke liye pehle tracking dekhein. Pincode ke hisaab se aam taur par Maharashtra 4-5 din, baaki India 6-7 din lagte hain."); btns([["🔎 Tracking dekhein", () => A.track()], ["Phir bhi deri hai", () => { tries++; care("Delivery late"); }]]); }),
      addr: () => { say("Address sirf order ship hone se pehle badal sakta hai, aur ye hamari team hi kar sakti hai."); care("Address badalna"); },
      other: () => { say("Theek hai, aap apni samasya hamari team ko batayein."); care("Anya samasya"); }
    };
    function menu() { btns([["📦 Order kahan hai?", A.track], ["❌ Order cancel karna hai", A.cancel], ["💳 Payment ho gaya, confirm nahi", A.pay], ["🎁 Galat/kharab product", A.ret], ["💰 Refund kab milega?", A.refund], ["🚚 Delivery late", A.late], ["📍 Address badalna", A.addr], ["💬 Kuch aur", A.other]]); }
    const route = (t) => { const s = t.toLowerCase(); if (/cancel|रद्द/.test(s)) return A.cancel(); if (/refund|paisa|पैसे|वापस/.test(s)) return A.refund(); if (/return|damage|toot|tuta|kharab|galat|wrong|broken|खराब|टूट/.test(s)) return A.ret(); if (/payment|paid|screenshot|utr|upi/.test(s)) return A.pay(); if (/late|der|deri|delay|kab aayega|कब/.test(s)) return A.late(); if (/address|पता/.test(s)) return A.addr(); if (/track|status|kahan|कहां|order/.test(s)) return A.track(); A.other(); };
    const send = () => { const t = inp.value.trim(); if (!t) return; inp.value = ""; log.push("Customer: " + t.slice(0, 120)); say(t, "u"); route(t); };
    say("Namaste 🙏 Main Help Desk hoon. Order se judi koi bhi samasya batayein, main hal karne ki koshish karunga. Na hui to hamari customer care team se seedha jod dunga.");
    menu();
    pg.querySelector("#hdGo").onclick = send; inp.addEventListener("keydown", e => { if (e.key === "Enter") send(); });
    pg.querySelector("#hdX").onclick = () => { close(); try { history.back(); } catch (e) { } };
    pg.querySelector("#hdAi").onclick = () => go(() => { const b = document.querySelector(".aai-fab"); b && b.click(); });
    window.addEventListener("popstate", function f() { window.removeEventListener("popstate", f); if (document.getElementById("hdPg")) close(); });
  }
  window.aashapuraHelpDesk = { open };
})();
