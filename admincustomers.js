/* Admin > Customers: who buys how much (built from orders + login profiles). No SQL (admin can already read profiles and orders). */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const lc = v => String(v || "").toLowerCase();
  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });
  const dstr = s => { try { return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch (e) { return ""; } };
  let done = false, rows = [], flt = "all", sort = "recent", q = "";

  const css = document.createElement("style");
  css.textContent = `.cu-sum{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}
  .cu-sum div{background:#f6f9f4;border:1px solid #dfe8da;border-radius:12px;padding:9px;text-align:center}.cu-sum b{display:block;font-size:18px;color:#14402b}.cu-sum small{color:#5d7266;font-size:12px}
  .cu-in{width:100%;box-sizing:border-box;padding:12px;border:1px solid #cdd8cf;border-radius:10px;font:inherit;margin-bottom:10px}
  .cu-row{display:flex;gap:8px;align-items:center;margin-bottom:10px}.cu-row select{padding:9px;border:1px solid #cdd8cf;border-radius:10px;font:inherit;background:#fff}
  .cu-ch{display:flex;gap:6px;overflow-x:auto;flex:1}.cu-ch button{white-space:nowrap;border:1px solid #cfd9cb;background:#fff;border-radius:99px;padding:7px 12px;font:inherit;font-size:13px;color:#173d2e;cursor:pointer}.cu-ch button.on{background:#14402b;color:#fff;border-color:#14402b}
  .cu-c{border:1px solid #dfe8dc;border-radius:14px;padding:12px 13px;margin-bottom:10px;background:#fff}
  .cu-h{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.cu-h b{font-size:16px;color:#173d2e}.cu-h small{display:block;color:#6a7d70;font-size:12px;margin-top:2px}
  .cu-tag{font-size:11px;font-weight:700;border-radius:99px;padding:3px 9px;white-space:nowrap}.cu-tag.rep{background:#e3f4e6;color:#166534}.cu-tag.vip{background:#fff1cc;color:#8a5a00}.cu-tag.new{background:#eceeed;color:#5d6b63}
  .cu-st{display:flex;gap:14px;margin:9px 0;font-size:13px;color:#4b5d52}.cu-st b{display:block;font-size:15px;color:#14402b}
  .cu-ad{font-size:12.5px;color:#5d7266;line-height:1.45}
  .cu-ac{display:flex;gap:8px;margin-top:10px}.cu-ac a{flex:1;text-align:center;text-decoration:none;border:1px solid #cfd9cb;background:#fff;border-radius:10px;padding:10px 4px;font-weight:600;font-size:13px;color:#173d2e}
  .cu-ac a.wa{background:#e9f8ef;border-color:#a9dfbd;color:#14602f}
  .cu-none{text-align:center;color:#6a7d70;padding:26px 8px}`;
  document.head.appendChild(css);

  const ph10 = v => String(v || "").replace(/\D/g, "").slice(-10);

  async function load() {
    const host = $("apCustomers"); if (!host) return;
    host.innerHTML = `<div class="cu-none">Load ho raha hai…</div>`;
    const [o, p] = await Promise.all([
      supabaseClient.from("store_orders").select("user_id,customer_name,phone,customer_email,address,delivery_address,pincode,total,payment_status,order_status,created_at,order_no").order("created_at", { ascending: false }).limit(1500),
      supabaseClient.from("customer_profiles").select("*").limit(1500)
    ]);
    if (o.error) { host.innerHTML = `<div class="cu-none" style="color:#b42318">Orders load nahi hue: ${esc(o.error.message)}</div>`; return; }
    const map = new Map();
    const get = (uid, phone) => {
      const key = uid || (ph10(phone) ? "ph" + ph10(phone) : null); if (!key) return null;
      if (!map.has(key)) map.set(key, { key, uid, name: "", phone: "", email: "", addr: "", pin: "", orders: 0, spent: 0, last: null, lastNo: "", cancelled: 0 });
      return map.get(key);
    };
    (p.data || []).forEach(x => { const c = get(x.user_id, x.phone); if (!c) return; c.name = x.full_name || c.name; c.phone = x.phone || c.phone; c.addr = x.address || c.addr; c.joined = x.created_at; });
    (o.data || []).forEach(x => {
      const c = get(x.user_id, x.phone); if (!c) return;
      if (!c.name) c.name = x.customer_name || ""; if (!c.phone) c.phone = x.phone || "";
      if (!c.email) c.email = x.customer_email || ""; if (!c.pin) c.pin = x.pincode || "";
      if (!c.addr) c.addr = x.address || x.delivery_address || "";
      if (lc(x.order_status) === "cancelled") { c.cancelled++; return; }
      c.orders++; if (lc(x.payment_status) === "paid") c.spent += Number(x.total || 0);
      if (!c.last || new Date(x.created_at) > new Date(c.last)) { c.last = x.created_at; c.lastNo = x.order_no || ""; }
    });
    rows = [...map.values()];
    paint();
  }

  function view() {
    let r = rows.filter(c => {
      if (flt === "repeat" && c.orders < 2) return false;
      if (flt === "new" && c.orders > 0) return false;
      if (flt === "top" && c.spent < 1000) return false;
      if (q && ![c.name, c.phone, c.email, c.addr, c.pin].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
    const cmp = { recent: (a, b) => new Date(b.last || 0) - new Date(a.last || 0), spent: (a, b) => b.spent - a.spent, orders: (a, b) => b.orders - a.orders, name: (a, b) => String(a.name).localeCompare(String(b.name)) }[sort];
    return r.sort(cmp);
  }

  function paint() {
    const host = $("apCustomers"); if (!host) return;
    const buyers = rows.filter(c => c.orders > 0), rep = rows.filter(c => c.orders > 1);
    host.innerHTML = `<div class="cu-sum"><div><b>${rows.length}</b><small>Customers</small></div><div><b>${buyers.length}</b><small>Kharid chuke</small></div><div><b>${rep.length}</b><small>Repeat</small></div></div>
      <input class="cu-in" id="cuQ" placeholder="Naam, phone, city, pincode…" value="${esc(q)}">
      <div class="cu-row"><div class="cu-ch" id="cuCh">${[["all", "Sab"], ["repeat", "Repeat"], ["top", "₹1000+"], ["new", "Bina order"]].map(f => `<button type="button" data-f="${f[0]}" class="${flt === f[0] ? "on" : ""}">${f[1]}</button>`).join("")}</div>
      <select id="cuS"><option value="recent">Latest</option><option value="spent">Zyada kharcha</option><option value="orders">Zyada order</option><option value="name">Naam A-Z</option></select></div>
      <div id="cuL"></div>`;
    host.querySelector("#cuS").value = sort;
    host.querySelector("#cuQ").oninput = e => { q = e.target.value.trim().toLowerCase(); list(); };
    host.querySelector("#cuCh").onclick = e => { const b = e.target.closest("[data-f]"); if (!b) return; flt = b.dataset.f; paint(); };
    host.querySelector("#cuS").onchange = e => { sort = e.target.value; list(); };
    list();
  }

  function list() {
    const l = $("cuL"); if (!l) return;
    const r = view();
    l.innerHTML = r.length ? r.slice(0, 200).map(c => {
      const ph = ph10(c.phone), tag = c.orders >= 3 || c.spent >= 3000 ? `<span class="cu-tag vip">⭐ Best customer</span>` : c.orders > 1 ? `<span class="cu-tag rep">🔁 Repeat</span>` : c.orders === 1 ? "" : `<span class="cu-tag new">Abhi order nahi</span>`;
      const msg = encodeURIComponent("Namaste " + (c.name || "") + ", Aashapura Ayurveda ki taraf se. ");
      return `<div class="cu-c"><div class="cu-h"><div><b>${esc(c.name || "Customer")}</b><small>${ph ? "📞 " + esc(ph) : "Phone nahi"}${c.email ? " · " + esc(c.email) : ""}</small></div>${tag}</div>
        <div class="cu-st"><span><b>${c.orders}</b>Orders</span><span><b>${money(c.spent)}</b>Kul kharcha</span><span><b>${c.last ? esc(dstr(c.last)) : "—"}</b>Last order</span></div>
        ${c.addr ? `<div class="cu-ad">📍 ${esc(String(c.addr).slice(0, 140))}${c.pin && !String(c.addr).includes(c.pin) ? " · " + esc(c.pin) : ""}</div>` : ""}
        ${ph ? `<div class="cu-ac"><a class="wa" href="https://wa.me/91${ph}?text=${msg}" target="_blank" rel="noopener">💬 WhatsApp</a><a href="tel:+91${ph}">📞 Call</a></div>` : ""}</div>`;
    }).join("") + (r.length > 200 ? `<div class="cu-none">Pehle 200 dikh rahe hain. Search karo.</div>` : "") : `<div class="cu-none">👥<br>Koi customer nahi mila.</div>`;
  }

  async function render() {
    if (done || !$("apCustomers")) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true; load();
    document.addEventListener("aashapura-admin-sec", e => { if (e.detail === "customers") load(); });
  }
  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none") render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(render, 2400);
  }
})();
