/* Admin > Reviews: approve / hide, reply to customers, delete. Needs supabase_v38_reviews.sql (approved, admin_reply columns + policies). */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  const stars = n => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
  const dstr = s => { try { return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch (e) { return ""; } };
  let done = false, list = [], pn = {}, tab = "pending", noCol = false;

  const css = document.createElement("style");
  css.textContent = `.rvw-tabs{display:flex;gap:6px;margin-bottom:12px;overflow-x:auto}.rvw-tabs button{white-space:nowrap;border:1px solid #cfd9cb;background:#fff;border-radius:99px;padding:8px 14px;font:inherit;font-size:13px;color:#173d2e;cursor:pointer}.rvw-tabs button.on{background:#14402b;color:#fff;border-color:#14402b}
  .rvw-warn{background:#fff4dc;border:1px solid #f0d58a;color:#7a5200;border-radius:10px;padding:10px 12px;font-size:13px;margin-bottom:12px;line-height:1.5}
  .rvw-c{border:1px solid #dfe8dc;border-radius:14px;padding:12px 13px;margin-bottom:11px;background:#fff}
  .rvw-h{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}.rvw-h b{color:#173d2e;font-size:15px}.rvw-h small{display:block;color:#6a7d70;font-size:12px;margin-top:2px}
  .rvw-st{color:#e0a100;font-size:16px;letter-spacing:1px;white-space:nowrap}
  .rvw-tag{font-size:11px;font-weight:700;border-radius:99px;padding:3px 9px;white-space:nowrap}.rvw-tag.p{background:#fff1cc;color:#8a5a00}.rvw-tag.a{background:#e3f4e6;color:#166534}
  .rvw-t{margin:8px 0;font-size:14px;line-height:1.5;color:#2d3f35;white-space:pre-wrap;word-break:break-word}
  .rvw-rp{margin:8px 0;background:#eef5ea;border-left:3px solid #2f6b3a;border-radius:6px;padding:8px 10px;font-size:13.5px;color:#14402b}
  .rvw-ac{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.rvw-ac button{flex:1;min-width:84px;border:1px solid #cfd9cb;background:#fff;border-radius:10px;padding:10px 4px;font:inherit;font-size:13px;font-weight:600;color:#173d2e;cursor:pointer}
  .rvw-ac .ok{background:#14402b;color:#fff;border-color:#14402b}.rvw-ac .del{color:#b42318;border-color:#efc4bf}
  .rvw-none{text-align:center;color:#6a7d70;padding:26px 8px}`;
  document.head.appendChild(css);

  async function load() {
    const host = $("apReviews"); if (!host) return;
    const r = await supabaseClient.from("reviews").select("*").order("created_at", { ascending: false }).limit(500);
    if (r.error) { host.innerHTML = `<div class="rvw-warn">Reviews load nahi hue: ${esc(r.error.message)}</div>`; return; }
    list = r.data || [];
    noCol = list.length ? !("approved" in list[0]) : false;
    const ids = [...new Set(list.map(x => x.product_id))];
    if (ids.length) { const p = await supabaseClient.from("products").select("id,name,weight").in("id", ids); (p.data || []).forEach(x => { pn[x.id] = x.name; }); }
    paint();
  }

  const isOk = r => r.approved !== false;
  function paint() {
    const host = $("apReviews"); if (!host) return;
    const pend = list.filter(r => !isOk(r)), ok = list.filter(isOk);
    const shown = tab === "pending" ? pend : tab === "approved" ? ok : list;
    host.innerHTML = `${noCol ? `<div class="rvw-warn">⚠️ Pehle Supabase SQL Editor me <b>supabase_v38_reviews.sql</b> chalao (ek baar). Tab tak approve / reply kaam nahi karega.</div>` : ""}
      <div class="rvw-tabs" id="rvwTabs">${[["pending", "⏳ Approval baaki (" + pend.length + ")"], ["approved", "✅ Approved (" + ok.length + ")"], ["all", "Sab (" + list.length + ")"]].map(t => `<button type="button" data-t="${t[0]}" class="${tab === t[0] ? "on" : ""}">${t[1]}</button>`).join("")}</div>
      ${shown.length ? shown.map(card).join("") : `<div class="rvw-none">⭐<br>${tab === "pending" ? "Approval ke liye koi review nahi." : "Koi review nahi."}</div>`}`;
    $("rvwTabs").onclick = e => { const b = e.target.closest("[data-t]"); if (b) { tab = b.dataset.t; paint(); } };
    host.querySelectorAll("[data-ap]").forEach(b => b.onclick = () => setAp(b.dataset.ap, true));
    host.querySelectorAll("[data-hd]").forEach(b => b.onclick = () => setAp(b.dataset.hd, false));
    host.querySelectorAll("[data-rp]").forEach(b => b.onclick = () => reply(b.dataset.rp));
    host.querySelectorAll("[data-dl]").forEach(b => b.onclick = () => del(b.dataset.dl));
    host.querySelectorAll(".md-th").forEach(() => {});
  }

  function card(r) {
    const ok = isOk(r), media = Array.isArray(r.media) && r.media.length && window.AashapuraMedia ? `<div class="md-row">${AashapuraMedia.thumbs(r.media)}</div>` : "";
    return `<div class="rvw-c"><div class="rvw-h"><div><b>${esc(pn[r.product_id] || "Product #" + r.product_id)}</b><small>${esc(r.user_name || "Customer")} · ${esc(dstr(r.created_at))}</small></div><div style="text-align:right"><div class="rvw-st">${stars(r.rating)}</div><span class="rvw-tag ${ok ? "a" : "p"}">${ok ? "Approved" : "Approval baaki"}</span></div></div>
      ${r.comment ? `<div class="rvw-t">${esc(r.comment)}</div>` : `<div class="rvw-t" style="color:#8a968f">(Sirf rating, comment nahi)</div>`}${media}
      ${r.admin_reply ? `<div class="rvw-rp"><b>Aapka jawab:</b> ${esc(r.admin_reply)}</div>` : ""}
      <div class="rvw-ac">${ok ? `<button type="button" data-hd="${r.id}">🙈 Chhupao</button>` : `<button type="button" class="ok" data-ap="${r.id}">✅ Approve</button>`}<button type="button" data-rp="${r.id}">💬 ${r.admin_reply ? "Jawab badlo" : "Jawab do"}</button><button type="button" class="del" data-dl="${r.id}">🗑 Delete</button></div></div>`;
  }

  async function upd(id, patch, msg) {
    const r = await supabaseClient.from("reviews").update(patch).eq("id", id).select();
    if (r.error) { toast(/column|schema/i.test(r.error.message || "") ? "Pehle supabase_v38_reviews.sql chalao." : r.error.message, "error"); return false; }
    if (!r.data || !r.data.length) { toast("Update nahi hua. supabase_v38_reviews.sql chalayi?", "error"); return false; }
    toast(msg); await load(); return true;
  }
  const setAp = (id, v) => upd(id, { approved: v }, v ? "Review approve ho gaya" : "Review chhupa diya");
  async function reply(id) {
    const r = list.find(x => String(x.id) === String(id)); if (!r) return;
    const t = await window.prompt("Customer ko jawab likho (khali chhodo = jawab hata do):", r.admin_reply || "");
    if (t === null || t === undefined) return;
    const txt = String(t).trim().slice(0, 400);
    await upd(id, { admin_reply: txt || null, replied_at: txt ? new Date().toISOString() : null }, txt ? "Jawab save ho gaya" : "Jawab hata diya");
  }
  async function del(id) {
    if (!(await confirm("Ye review delete karna hai? Wapas nahi aayega."))) return;
    const r = await supabaseClient.from("reviews").delete().eq("id", id).select();
    if (r.error) return toast(r.error.message, "error");
    if (!r.data || !r.data.length) return toast("Delete nahi hua.", "error");
    toast("Review delete ho gaya"); load();
  }

  async function render() {
    if (done || !$("apReviews")) return;
    let uid = null; try { uid = (await supabaseClient.auth.getUser()).data.user?.id; } catch (e) {}
    if (!uid || uid !== AASHAPURA_ADMIN_UID) return;
    done = true; load();
    document.addEventListener("aashapura-admin-sec", e => { if (e.detail === "reviews") load(); });
  }
  const ab = $("adminProductBox");
  if (ab) {
    new MutationObserver(() => { if (ab.style.display !== "none") render(); }).observe(ab, { attributes: true, attributeFilter: ["style"] });
    setTimeout(render, 2600);
  }
})();
