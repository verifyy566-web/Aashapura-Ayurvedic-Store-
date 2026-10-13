/* Admin > Activity Log (reads admin_audit) + Backup (CSV / full JSON download). Needs supabase_v34_security.sql (already run). No new SQL. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  let done = false;

  const css = document.createElement("style");
  css.textContent = `.lg-chips{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 12px}
  .lg-chips button{border:1px solid #cfd9cb;background:#fff;border-radius:99px;padding:7px 13px;font:inherit;font-size:13px;color:#173d2e;cursor:pointer}
  .lg-chips button.on{background:#14402b;color:#fff;border-color:#14402b}
  .lg-row{border:1px solid #dfe8dc;border-radius:12px;padding:11px 13px;margin-bottom:9px;background:#fff}
  .lg-top{display:flex;justify-content:space-between;gap:8px;font-size:12px;color:#6a7d70;margin-bottom:4px}
  .lg-tag{font-weight:700;border-radius:6px;padding:1px 7px;font-size:11px}
  .lg-tag.UPDATE{background:#e8f1e4;color:#166534}.lg-tag.INSERT{background:#e3effd;color:#1d4ed8}.lg-tag.DELETE{background:#fde8e6;color:#b42318}
  .lg-t{font-size:14px;color:#173d2e;line-height:1.45}.lg-t b{color:#0f2a1e}
  .lg-d{font-size:13px;color:#4b5d52;margin-top:3px;line-height:1.5}
  .lg-more,.lg-ref{width:100%;border:1px solid #cfd9cb;background:#fff;border-radius:10px;padding:12px;font:inherit;font-weight:600;cursor:pointer;color:#173d2e;margin-top:4px}
  .lg-msg{font-size:14px;margin:8px 0;color:#5d7266}.lg-msg.bad{color:#b42318;font-weight:600}
  .bk-box{max-width:560px}.bk-box p.s{color:#5d7266;font-size:14px;margin:0 0 12px}
  .bk-row{display:flex;align-items:center;gap:10px;border:1px solid #dfe8dc;border-radius:12px;padding:12px 13px;margin-bottom:9px;background:#fff}
  .bk-row .n{flex:1;font-weight:700;color:#173d2e}.bk-row .n small{display:block;font-weight:400;color:#6a7d70;font-size:12px}
  .bk-row button,.bk-all{border:1px solid #cfd9cb;background:#fff;border-radius:10px;padding:10px 14px;font:inherit;font-weight:600;cursor:pointer;color:#173d2e}
  .bk-all{width:100%;background:#14402b;color:#fff;border-color:#14402b;padding:14px;margin-top:6px}
  .bk-row button:disabled,.bk-all:disabled{opacity:.6}`;
  document.head.appendChild(css);

  /* ---------- Activity Log ---------- */
  const TBL = { store_orders: "Order", products: "Product", store_refunds: "Refund", coupons: "Coupon" };
  const FIELD = { order_status: "Order status", payment_status: "Payment status", price: "Price", mrp: "MRP", name: "Name", courier: "Courier", tracking_id: "Tracking ID", status: "Status", is_active: "Active", discount: "Discount", min_order: "Min order", utr: "UTR / screenshot", refund_status: "Refund status", pickup_by: "Pickup by", admin_note: "Admin note", description: "Description", category: "Category", weight: "Weight", expires_at: "Expires" };
  const SKIP = new Set(["stock_deducted", "updated_at", "paid_at", "confirmed_at", "shipped_at", "delivered_at", "cancelled_at", "exp_min", "exp_max"]);
  const FILTERS = [["all", "Sab"], ["store_orders", "Orders"], ["products", "Products"], ["store_refunds", "Refunds"], ["coupons", "Coupons"]];
  const PAGE = 40;
  let flt = "all", rows = [], names = {}, more = false;

  const when = s => { try { return new Date(s).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit", hour12: true }); } catch (e) { return String(s || ""); } };
  const val = v => { if (v == null || v === "") return "(khali)"; if (typeof v === "object") v = JSON.stringify(v); v = String(v); return v.length > 60 ? v.slice(0, 57) + "…" : v; };
  const label = k => FIELD[k] || k.replace(/_/g, " ");

  function title(r) {
    const kind = TBL[r.tbl] || r.tbl, key = r.row_key, nm = names[r.tbl + ":" + key];
    let who = "";
    if (r.tbl === "store_orders") who = nm ? "#" + esc(nm) : "ID " + esc(String(key).slice(0, 8));
    else if (r.tbl === "products") who = nm ? esc(nm) : (r.action === "DELETE" && r.changes && r.changes.name ? esc(r.changes.name) : "ID " + esc(String(key).slice(0, 8)));
    else if (r.tbl === "coupons") who = esc(key);
    else who = "ID " + esc(String(key).slice(0, 8));
    const verb = r.action === "DELETE" ? "delete hua" : r.action === "INSERT" ? "naya bana" : "badla";
    return `<b>${esc(kind)}</b> ${who} ${verb}`;
  }
  function detail(r) {
    const c = r.changes || {};
    if (r.action === "UPDATE") {
      const parts = Object.keys(c).filter(k => !SKIP.has(k)).map(k => {
        const d = c[k] || {}; return `${esc(label(k))}: ${esc(val(d.from))} → <b>${esc(val(d.to))}</b>`;
      });
      return parts.join("<br>");
    }
    const bits = [];
    ["name", "code", "price", "discount", "order_status"].forEach(k => { if (c[k] != null) bits.push(`${esc(label(k))}: ${esc(val(c[k]))}`); });
    return bits.join(" · ");
  }

  async function loadNames(list) {
    const ids = t => [...new Set(list.filter(r => r.tbl === t && r.row_key).map(r => r.row_key))];
    const jobs = [];
    const o = ids("store_orders"), p = ids("products");
    if (o.length) jobs.push(supabaseClient.from("store_orders").select("id,order_no").in("id", o).then(x => (x.data || []).forEach(d => { names["store_orders:" + d.id] = d.order_no; })).catch(() => {}));
    if (p.length) jobs.push(supabaseClient.from("products").select("id,name").in("id", p).then(x => (x.data || []).forEach(d => { names["products:" + d.id] = d.name; })).catch(() => {}));
    await Promise.all(jobs);
  }

  async function fetchLog(reset) {
    const msg = $("lgMsg"); msg.className = "lg-msg"; msg.textContent = "Load ho raha hai…";
    if (reset) rows = [];
    let q = supabaseClient.from("admin_audit").select("id,at,actor,tbl,row_key,action,changes").order("at", { ascending: false }).range(rows.length, rows.length + PAGE - 1);
    if (flt !== "all") q = q.eq("tbl", flt);
    const r = await q;
    if (r.error) {
      msg.className = "lg-msg bad";
      msg.textContent = /admin_audit|relation|schema/i.test(r.error.message || "") ? "Pehle supabase_v34_security.sql chalao." : "Log nahi khula: " + (r.error.message || "error");
      return;
    }
    const got = r.data || [];
    await loadNames(got);
    rows = rows.concat(got); more = got.length === PAGE; paint();
  }

  function paint() {
    const list = $("lgList"), msg = $("lgMsg");
    msg.className = "lg-msg"; msg.textContent = rows.length ? "" : "Abhi koi activity nahi hai.";
    const visible = rows.filter(r => r.action !== "UPDATE" || Object.keys(r.changes || {}).some(k => !SKIP.has(k)));
    list.innerHTML = visible.map(r => {
      const d = detail(r);
      return `<div class="lg-row"><div class="lg-top"><span>${esc(when(r.at))}</span><span class="lg-tag ${esc(r.action)}">${esc(r.action)}</span></div><div class="lg-t">${title(r)}</div>${d ? `<div class="lg-d">${d}</div>` : ""}</div>`;
    }).join("");
    $("lgMore").style.display = more ? "block" : "none";
  }

  function renderLog() {
    const host = $("apLog"); if (!host) return;
    host.innerHTML = `<div class="lg-chips" id="lgChips">${FILTERS.map(f => `<button type="button" data-f="${f[0]}" class="${f[0] === flt ? "on" : ""}">${f[1]}</button>`).join("")}</div>
      <div class="lg-msg" id="lgMsg"></div><div id="lgList"></div>
      <button type="button" class="lg-more" id="lgMore" style="display:none">Aur purani dikhao</button>
      <button type="button" class="lg-ref" id="lgRef">🔄 Refresh</button>`;
    $("lgChips").onclick = e => { const b = e.target.closest("button[data-f]"); if (!b) return; flt = b.dataset.f; [...$("lgChips").children].forEach(x => x.classList.toggle("on", x === b)); fetchLog(true); };
    $("lgMore").onclick = () => fetchLog(false);
    $("lgRef").onclick = () => fetchLog(true);
    fetchLog(true);
  }

  /* ---------- Backup ---------- */
  const TABLES = [
    ["store_orders", "Orders", "Sare orders, address, payment status", "created_at"],
    ["products", "Products", "Naam, price, stock, photos links", "created_at"],
    ["customer_profiles", "Customers", "Naam, phone, address", null],
    ["store_refunds", "Refunds / Returns", "Refund aur return requests", "created_at"],
    ["coupons", "Coupons", "Sare coupon codes", null]
  ];

  async function fetchAll(table, orderCol) {
    const out = []; let from = 0; const step = 1000;
    for (;;) {
      let q = supabaseClient.from(table).select("*").range(from, from + step - 1);
      if (orderCol) q = q.order(orderCol, { ascending: false });
      const r = await q;
      if (r.error) throw r.error;
      out.push(...(r.data || []));
      if (!r.data || r.data.length < step) break;
      from += step;
    }
    return out;
  }
  const cell = v => {
    if (v == null) return "";
    let s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (/^[=@]/.test(s) || (/^[+\-]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s))) s = "'" + s; // stop Excel formulas
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  function toCsv(data) {
    const cols = []; data.forEach(r => Object.keys(r).forEach(k => { if (!cols.includes(k)) cols.push(k); }));
    return "﻿" + [cols.map(cell).join(",")].concat(data.map(r => cols.map(k => cell(r[k])).join(","))).join("\r\n");
  }
  function save(name, text, type) {
    const a = document.createElement("a"), url = URL.createObjectURL(new Blob([text], { type }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
  }
  const stamp = () => new Date().toISOString().slice(0, 10);

  function renderBackup() {
    const host = $("apBackup"); if (!host) return;
    host.innerHTML = `<div class="bk-box"><p class="s">Apne data ki copy phone me download karo. Excel / Google Sheets me khul jayegi. Hafte me ek baar le lena.</p>
      ${TABLES.map((t, i) => `<div class="bk-row"><div class="n">${t[1]}<small>${t[2]}</small></div><button type="button" data-i="${i}">⬇ CSV</button></div>`).join("")}
      <button type="button" class="bk-all" id="bkAll">⬇ Sab ek file me (JSON)</button>
      <div class="lg-msg" id="bkMsg"></div></div>`;
    const msg = (t, bad) => { const m = $("bkMsg"); m.textContent = t || ""; m.className = "lg-msg" + (bad ? " bad" : ""); };
    host.onclick = async e => {
      const b = e.target.closest("button[data-i]"); if (!b) return;
      const t = TABLES[+b.dataset.i], old = b.textContent; b.disabled = true; b.textContent = "…"; msg("");
      try {
        const data = await fetchAll(t[0], t[3]);
        if (!data.length) msg(t[1] + ": abhi koi data nahi hai.");
        else { save(`aashapura-${t[0]}-${stamp()}.csv`, toCsv(data), "text/csv;charset=utf-8"); msg(`✅ ${t[1]}: ${data.length} rows download ho gayi.`); }
      } catch (er) { msg(`${t[1]} nahi aaya: ${er.message || er}`, true); }
      finally { b.disabled = false; b.textContent = old; }
    };
    $("bkAll").onclick = async () => {
      const b = $("bkAll"), old = b.textContent; b.disabled = true; b.textContent = "Ho raha hai…"; msg("");
      const all = { exported_at: new Date().toISOString() }, fail = [];
      for (const t of TABLES) { try { all[t[0]] = await fetchAll(t[0], t[3]); } catch (er) { fail.push(t[1]); all[t[0]] = null; } }
      save(`aashapura-backup-${stamp()}.json`, JSON.stringify(all, null, 2), "application/json");
      msg(fail.length ? "Download hui, par ye nahi aaye: " + fail.join(", ") : "✅ Poora backup download ho gaya.", !!fail.length);
      b.disabled = false; b.textContent = old;
    };
  }

  async function render() {
    if (done) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true; renderLog(); renderBackup();
  }

  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none") render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(render, 2000);
  }
})();
