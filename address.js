/* v15: Address book (Myntra-style). Many saved addresses per profile, add/edit/remove, default address,
   "Use my current location", "Search location", "Select Delivery Location" sheet, "Select Address" page.
   Saved in Supabase table customer_addresses (supabase_v15.sql). If that table is missing, addresses are kept on this phone (localStorage). */
(function () {
  "use strict";
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const loc = () => (window.AASHAPURA_LANG === "hi" ? "hi-IN" : "en-IN");
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) {} };
  const uid = () => (typeof signedInUser !== "undefined" && signedInUser && signedInUser.id) || "guest";

  /* ---------- overlay stack (phone Back button closes the top screen) ---------- */
  const stack = []; let skip = 0;
  const ov = {
    push(el, onClose) { stack.push({ el, onClose }); try { history.pushState({ aaov: stack.length }, "", location.href); } catch (e) {} },
    close(el) {
      const i = stack.findIndex(s => s.el === el);
      if (i < 0) { el.remove(); return; }
      const n = stack.length - i, gone = stack.splice(i, n);
      gone.forEach(s => { s.el.remove(); try { s.onClose && s.onClose(); } catch (e) {} });
      skip++; try { history.go(-n); } catch (e) { skip--; }
    },
    closeAll() { stack.splice(0).forEach(s => s.el.remove()); },
    drop(el) { const i = stack.findIndex(s => s.el === el); if (i >= 0) stack.splice(i, 1); el.remove(); }
  };
  window.addEventListener("popstate", () => {
    if (skip > 0) { skip--; return; }
    const s = stack.pop(); if (s) { s.el.remove(); try { s.onClose && s.onClose(); } catch (e) {} }
  });

  /* ---------- storage ---------- */
  let cache = null, cacheUid = null, local = false;
  const LSK = () => "aashapura_addr_" + uid();
  const SELK = () => "aashapura_addr_sel_" + uid();
  const readLocal = () => { try { return JSON.parse(localStorage.getItem(LSK()) || "[]"); } catch (e) { return []; } };
  const writeLocal = l => { try { localStorage.setItem(LSK(), JSON.stringify(l)); } catch (e) {} };
  const missingTable = er => er && (/42P01|PGRST205/.test(er.code || "") || /Could not find the table|relation .* does not exist/i.test(er.message || ""));
  const sortList = l => l.slice().sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0) || String(a.created_at || a.id).localeCompare(String(b.created_at || b.id)));

  async function loadAddrs(force) {
    const u = uid();
    if (!force && cache && cacheUid === u) return cache;
    let list = [];
    if (u !== "guest" && !local) {
      const { data, error } = await supabaseClient.from("customer_addresses").select("*").eq("user_id", u).order("created_at", { ascending: true });
      if (error) { if (missingTable(error)) local = true; else { console.warn(error.message); local = true; } } else list = data || [];
    }
    if (u === "guest" || local) list = readLocal();
    cache = sortList(list); cacheUid = u; return cache;
  }
  const selectedOf = list => {
    let id = null; try { id = localStorage.getItem(SELK()); } catch (e) {}
    return list.find(a => String(a.id) === id) || list.find(a => a.is_default) || list[0] || null;
  };
  const setSelected = id => { try { localStorage.setItem(SELK(), String(id)); } catch (e) {} };
  const addrLine = a => [a.house, a.address, a.locality, a.city].filter(Boolean).join(", ") + (a.state ? ", " + a.state : "") + " - " + a.pincode;
  const addrHTML = a => `<div class="aa-lines">${esc([a.house, a.address].filter(Boolean).join(", "))}<br>${a.locality ? esc(a.locality) + "<br>" : ""}${esc(a.city)} - ${esc(a.pincode)}<br>${esc(a.state)}</div>`;
  const typeChip = a => `<span class="aa-chip">${a.address_type === "office" ? L("OFFICE", "ऑफिस") : L("HOME", "घर")}</span>`;

  async function syncProfile() {
    const d = (cache || []).find(a => a.is_default) || (cache || [])[0], text = d ? addrLine(d) : "";
    const pa = document.getElementById("profileAddress"); if (pa) pa.value = text;
    const ca = document.getElementById("customerAddress"); if (ca && text) ca.value = text;
    if (uid() !== "guest") { try { await supabaseClient.from("customer_profiles").update({ address: text, updated_at: new Date().toISOString() }).eq("user_id", uid()); } catch (e) {} }
  }

  async function saveAddr(rec) {
    const u = uid(), list = await loadAddrs(), old = rec.id ? list.find(a => String(a.id) === String(rec.id)) : null;
    const body = {
      name: rec.name, phone: rec.phone, pincode: rec.pincode, state: rec.state, house: rec.house, address: rec.address, locality: rec.locality, city: rec.city,
      address_type: rec.address_type || "home", open_sat: !!rec.open_sat, open_sun: !!rec.open_sun,
      is_default: !!rec.is_default || !list.length || !!(old && old.is_default && list.length === 1), lat: rec.lat || null, lng: rec.lng || null
    };
    let saved;
    if (u !== "guest" && !local) {
      const r = rec.id
        ? await supabaseClient.from("customer_addresses").update({ ...body, updated_at: new Date().toISOString() }).eq("id", rec.id).eq("user_id", u).select().single()
        : await supabaseClient.from("customer_addresses").insert({ ...body, user_id: u }).select().single();
      if (r.error) { if (missingTable(r.error)) { local = true; return saveAddr(rec); } throw r.error; }
      saved = r.data;
      if (saved.is_default) await supabaseClient.from("customer_addresses").update({ is_default: false }).eq("user_id", u).neq("id", saved.id);
    } else {
      const l = readLocal();
      if (rec.id) { const i = l.findIndex(a => String(a.id) === String(rec.id)); saved = { ...(l[i] || {}), ...body, id: rec.id }; if (i >= 0) l[i] = saved; else l.push(saved); }
      else { saved = { ...body, id: "l" + Date.now(), created_at: new Date().toISOString() }; l.push(saved); }
      if (saved.is_default) l.forEach(x => { if (x.id !== saved.id) x.is_default = false; });
      writeLocal(l);
    }
    await loadAddrs(true); syncProfile(); return saved;
  }
  async function makeDefault(id) {
    const u = uid();
    if (u !== "guest" && !local) {
      await supabaseClient.from("customer_addresses").update({ is_default: true }).eq("id", id).eq("user_id", u);
      await supabaseClient.from("customer_addresses").update({ is_default: false }).eq("user_id", u).neq("id", id);
    } else { const l = readLocal(); l.forEach(x => { x.is_default = String(x.id) === String(id); }); writeLocal(l); }
  }
  async function deleteAddr(id) {
    const u = uid(), was = (await loadAddrs()).find(a => String(a.id) === String(id));
    if (u !== "guest" && !local) { const { error } = await supabaseClient.from("customer_addresses").delete().eq("id", id).eq("user_id", u); if (error) throw error; }
    else writeLocal(readLocal().filter(a => String(a.id) !== String(id)));
    const left = await loadAddrs(true);
    try { const sp = savedPin(); if (was && sp && sp.pin === was.pincode && !left.some(a => a.pincode === sp.pin)) localStorage.removeItem("aashapura_pin"); } catch (e) {}
    if (was && was.is_default && left.length) { await makeDefault(left[0].id); await loadAddrs(true); }
    syncProfile();
  }

  /* ---------- delivery estimate / pin sync ---------- */
  const sd = d => d.toLocaleDateString(loc(), { day: "numeric", month: "short" });
  const estimate = state => { try { const e = window.aashapuraEta(state); return sd(e.min) + " – " + sd(e.max); } catch (x) { return ""; } };
  const deliverTo = a => { try { window.aashapuraSavePin && window.aashapuraSavePin(a.pincode, { area: [a.city, a.state].filter(Boolean).join(", "), state: a.state }); } catch (e) {} };
  const savedPin = () => { try { return JSON.parse(localStorage.getItem("aashapura_pin") || "null"); } catch (e) { return null; } };

  /* ---------- styles ---------- */
  const css = document.createElement("style");
  css.textContent = `
  .aa-ov{position:fixed;inset:0;z-index:100020;background:#f3f6f2;display:flex;flex-direction:column;color:#173d2e;font-family:inherit}
  .aa-ov.z3{z-index:100040}
  .aa-oh{display:flex;align-items:center;gap:12px;padding:14px 14px;background:#fff;border-bottom:1px solid #e3eadf;flex:none}
  .aa-oh b{font-size:17px;letter-spacing:.4px}.aa-oh button,.aa-bk{border:0;background:none;font-size:24px;line-height:1;padding:2px 8px;color:var(--green);cursor:pointer}
  .aa-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding-bottom:24px}
  .aa-blk{background:#fff;padding:6px 18px 18px;margin-bottom:10px}
  .aa-f{display:block;position:relative;margin:22px 0 0}
  .aa-f input{width:100%;box-sizing:border-box;border:0;border-bottom:1.5px solid #cdd5cb;border-radius:0;padding:12px 0 8px;font:inherit;font-size:16px;background:transparent;outline:none;color:#173d2e}
  .aa-f input:focus{border-bottom-color:var(--green)}
  .aa-f span{position:absolute;left:0;top:12px;color:#8a978f;font-size:16px;pointer-events:none;transition:.15s}
  .aa-f input:focus+span,.aa-f input:not(:placeholder-shown)+span{top:-9px;font-size:12px}
  .aa-two{display:flex;gap:28px}.aa-two .aa-f{flex:1;min-width:0}
  .aa-msg{display:block;font-size:13px;margin-top:6px;min-height:0}.aa-msg.ok{color:#166534}.aa-msg.bad{color:#b42318}
  .aa-q{color:#8a978f;margin:18px 0 8px;font-size:15px}
  .aa-radios{display:flex;gap:34px}.aa-radios label,.aa-ck{display:flex;align-items:center;gap:10px;font-size:16px;margin:8px 0;cursor:pointer}
  .aa-ov input[type=radio],.aa-ov input[type=checkbox],.aa-page input[type=radio]{width:20px;height:20px;accent-color:var(--green);flex:none;margin:0}
  .aa-ov hr{border:0;border-top:1px solid #e3eadf;margin:16px 0}
  .aa-foot{display:flex;flex:none;border-top:1px solid #dfe8dc;background:#fff;padding-bottom:env(safe-area-inset-bottom,0)}
  .aa-foot button{flex:1;border:0;background:#fff;padding:18px;font:inherit;font-weight:800;letter-spacing:.5px;color:#2b3b33;cursor:pointer}
  .aa-foot button#fSave,.aa-foot .aa-go{background:var(--green);color:#fff}.aa-foot button:disabled{background:#c0c4c7!important;color:#fff!important}
  .aa-locrow{display:flex;gap:10px;padding:12px 18px;background:#fff;margin-bottom:10px;flex-wrap:wrap}
  .aa-locrow button{flex:1;min-width:150px;border:1.5px solid var(--green);border-radius:10px;background:#fff;color:var(--green);padding:11px 8px;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
  .aa-steps{display:flex;align-items:center;gap:6px;padding:14px 22px 10px;background:#fff;font-size:12px;color:#8a978f}
  .aa-steps span{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:46px}.aa-steps i{width:14px;height:14px;border-radius:50%;border:2px solid #c3cdc1;background:#fff;display:block}
  .aa-steps .done i{background:var(--green);border-color:var(--green)}.aa-steps .on i{border-color:var(--green);box-shadow:inset 0 0 0 3px #fff;background:var(--green)}.aa-steps .on,.aa-steps .done{color:var(--green);font-weight:700}
  .aa-steps u{flex:1;height:2px;background:#c3cdc1;margin-bottom:18px}.aa-steps u.done{background:var(--green)}
  .aa-lbl{padding:14px 16px 8px;font-weight:800;font-size:13px;letter-spacing:.5px;color:#2b3b33}
  .aa-card{background:#fff;padding:14px 16px;margin-bottom:8px;border-bottom:1px solid #edf1eb}
  .aa-top{display:flex;align-items:center;gap:8px;margin-bottom:8px}.aa-top b{font-size:16px;flex:1}
  .aa-chip{background:#eef2ec;color:#4c5d54;border-radius:99px;padding:4px 12px;font-size:12px;font-weight:800;letter-spacing:.4px}
  .aa-lines{color:#4a5a51;line-height:1.55;font-size:15px}.aa-mob{margin-top:8px;font-size:15px;color:#4a5a51}
  .aa-chg{border:0;background:none;color:var(--green);font-weight:800;font-size:15px;cursor:pointer;padding:4px 6px}
  .aa-btns{display:flex;border-top:1px solid #e6ece3;margin:12px -16px -14px}.aa-btns button{flex:1;border:0;background:#fff;color:#2f5fb3;font:inherit;font-weight:800;padding:15px;cursor:pointer;letter-spacing:.4px}.aa-btns button+button{border-left:1px solid #e6ece3}
  .aa-add{display:block;width:100%;background:#fff;border:0;border-bottom:1px solid #e3eadf;padding:18px 16px;text-align:left;color:#2f5fb3;font:inherit;font-weight:800;letter-spacing:.3px;cursor:pointer;margin-bottom:6px}
  .aa-rad{display:flex;gap:12px;align-items:flex-start;cursor:pointer}.aa-rad .aa-body{flex:1;min-width:0}
  .aa-mini{display:flex;gap:10px;margin-top:12px}.aa-mini button{border:1px solid #6b7f74;background:#fff;border-radius:6px;padding:8px 22px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;color:var(--green)}
  .aa-est{display:flex;align-items:center;gap:12px;background:#fff;padding:14px 16px;font-size:15px}
  .aa-est .th{display:flex}.aa-est img,.aa-est .em{width:44px;height:44px;border-radius:8px;object-fit:cover;background:#e8f1e6;display:flex;align-items:center;justify-content:center;margin-right:-8px;border:2px solid #fff;font-size:22px}
  .aa-cta{position:fixed;left:0;right:0;bottom:0;z-index:2;background:#fff;border-top:1px solid #dfe8dc;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0))}
  .aa-cta button{display:block;width:100%;max-width:640px;margin:0 auto;border:0;border-radius:10px;background:var(--green);color:#fff;padding:16px;font:inherit;font-weight:800;letter-spacing:.6px;font-size:16px;cursor:pointer}
  .aa-cta button:disabled{background:#c0c4c7}
  /* checkout page */
  .aa-page{position:fixed;inset:0;z-index:100010;overflow-y:auto;background:#f3f6f2;color:#173d2e;font-family:inherit;-webkit-overflow-scrolling:touch}
  .aa-wrap{max-width:640px;margin:0 auto;padding-bottom:110px}
  .aa-wrap .aa-oh{position:sticky;top:0;z-index:3}
  .aa-bill{background:#fff;border-radius:14px;padding:14px 16px;margin:10px 12px;border:1px solid #e6ece3}.aa-bill h4{margin:0 0 8px;font-size:16px}
  .aa-bill div{display:flex;justify-content:space-between;padding:6px 0;font-size:15px}.aa-bill .g{color:#17853f;font-weight:700}
  .aa-bill .t{border-top:1px dashed #cfdacb;margin-top:6px;padding-top:12px;font-size:18px;font-weight:800}
  .aa-pay{padding:0 12px 12px}.aa-pay .aa-card{border-radius:14px;border:1px solid #e6ece3;margin:10px 0}
  .aa-pay .primary-btn,.aa-pay .secondary-btn,.aa-pay .premium-checkout-submit{box-sizing:border-box}
  .aa-pay .premium-checkout-submit{width:100%;margin-top:6px}
  /* bottom sheet */
  .aa-sbk{position:fixed;inset:0;z-index:100015;background:rgba(10,25,18,.55);display:flex;align-items:flex-end;justify-content:center}
  .aa-sheet{background:#fff;width:100%;max-width:640px;max-height:88vh;overflow-y:auto;border-radius:18px 18px 0 0;padding:18px 16px calc(18px + env(safe-area-inset-bottom,0));color:#173d2e;animation:aasu .22s ease}
  @keyframes aasu{from{transform:translateY(40px);opacity:.4}}
  .aa-sh-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}.aa-sh-h b{font-size:17px}.aa-sh-h button{border:0;background:none;font-size:22px;cursor:pointer}
  .aa-sh-pin{display:flex;border:1.5px solid #d3dad0;border-radius:8px;overflow:hidden}.aa-sh-pin input{flex:1;border:0;padding:13px;font:inherit;outline:none;min-width:0}.aa-sh-pin button{border:0;background:none;color:var(--green);font-weight:800;padding:0 14px;cursor:pointer;font:inherit;font-weight:800}
  .aa-link{display:block;width:100%;text-align:left;border:0;background:none;color:var(--green);font:inherit;font-weight:700;padding:13px 2px;cursor:pointer}
  .aa-or{display:flex;align-items:center;gap:12px;margin:8px 0 12px;color:#6b7f74;font-weight:700}.aa-or:before,.aa-or:after{content:"";flex:1;border-top:1px solid #dfe5dc}
  .aa-sh-sub{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.aa-sh-sub button{border:0;background:none;color:var(--green);font-weight:800;cursor:pointer;font:inherit;font-weight:800}
  .aa-sc{border:1.5px solid #e1e7de;border-radius:12px;padding:12px;margin-bottom:12px}.aa-sc.on{border-color:var(--green);background:#f4faf5}
  .aa-cur{display:inline-block;background:#e4f4e8;color:#17653a;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:800;letter-spacing:.4px;margin-bottom:6px}
  .aa-sc .row{display:flex;gap:10px;margin-top:10px;align-items:center}.aa-sc .row button{border:1.5px solid var(--green);background:#fff;color:var(--green);border-radius:8px;padding:9px 14px;font:inherit;font-weight:700;cursor:pointer}
  .aa-sc .row button.here{flex:1}.aa-sc .row button:disabled{border-color:#d3dad0;color:#8a978f;background:#f4f4f4}.aa-sc .row .ed{border:0;color:var(--green);text-decoration:underline}
  .aa-sr{padding:10px 14px;background:#fff}.aa-sr input{width:100%;box-sizing:border-box;border:1.5px solid #d3dad0;border-radius:10px;padding:13px;font:inherit;font-size:16px;outline:none}
  .aa-res button{display:block;width:100%;text-align:left;background:#fff;border:0;border-bottom:1px solid #edf1eb;padding:14px 16px;font:inherit;font-size:14.5px;line-height:1.4;color:#173d2e;cursor:pointer}
  .aa-hint{color:#8a978f;font-size:12px;text-align:center;padding:12px}
  /* cart address bar */
  .ct-addr{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #e6ece3;border-radius:14px;padding:12px 14px;margin-bottom:10px;cursor:pointer}
  .ct-addr .tx{flex:1;min-width:0}.ct-addr b{display:block;font-size:15px}.ct-addr small{display:block;color:#6b7f74;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}.ct-addr .ar{color:var(--green);font-weight:800}
  .ct-cp .cp-on{display:flex;align-items:center;gap:8px;justify-content:space-between;margin-top:8px;color:#166534;font-weight:700}.ct-cp .cp-on button{border:1px solid #b42318;background:#fff;color:#b42318;border-radius:8px;padding:6px 10px;font-weight:700;cursor:pointer}
  .profile-addr .aa-card{border:1px solid #e1e5dc;border-radius:14px;margin-bottom:12px}.profile-addr .aa-add{border:1px solid #e1e5dc;border-radius:14px;margin-bottom:14px}.profile-addr .aa-lbl{padding:6px 2px}
  `;
  document.head.appendChild(css);

  const stepper = n => {
    const names = [L("Bag", "कार्ट"), L("Address", "पता"), L("Payment", "पेमेंट")];
    return `<div class="aa-steps">${names.map((t, i) => `${i ? `<u class="${i < n ? "done" : ""}"></u>` : ""}<span class="${i + 1 < n ? "done" : i + 1 === n ? "on" : ""}"><i></i>${t}</span>`).join("")}</div>`;
  };
  const mkOv = (cls, html) => { const el = document.createElement("div"); el.className = "aa-ov " + (cls || ""); el.innerHTML = html; document.body.appendChild(el); return el; };

  /* ---------- location helpers (OpenStreetMap / Nominatim) ---------- */
  const mapPlace = j => {
    const a = j.address || {}, pin = String(a.postcode || "").replace(/\D/g, "").slice(0, 6);
    return {
      pincode: /^[1-9][0-9]{5}$/.test(pin) ? pin : "", state: a.state || "",
      city: a.city || a.town || a.village || a.state_district || a.county || "",
      locality: a.suburb || a.neighbourhood || a.village || a.city_district || a.hamlet || "",
      address: [a.house_number, a.road].filter(Boolean).join(", "),
      display: j.display_name || "", lat: Number(j.lat), lng: Number(j.lon)
    };
  };
  async function reverse(lat, lng) {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=en&lat=${lat}&lon=${lng}`);
    return mapPlace(await r.json());
  }
  const geolocate = () => new Promise((res, rej) => {
    if (!navigator.geolocation) return rej({ code: 0 });
    navigator.geolocation.getCurrentPosition(p => res(p.coords), e => rej(e), { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  });
  async function useCurrent() {
    toast(L("Detecting your location…", "आपकी लोकेशन ढूँढ रहे हैं…"));
    try {
      const c = await geolocate(), r = await reverse(c.latitude, c.longitude);
      if (!r.pincode) toast(L("Pincode not found for this spot. Please type it.", "इस जगह का पिनकोड नहीं मिला। कृपया खुद भरें।"), "error");
      return r;
    } catch (e) {
      toast(e && e.code === 1 ? L("Location permission denied. Please allow location for this site in browser settings.", "लोकेशन की अनुमति नहीं मिली। ब्राउज़र सेटिंग में इस साइट के लिए लोकेशन allow करें।")
        : L("Could not get your location. Try again or use Search location.", "लोकेशन नहीं मिली। फिर कोशिश करें या 'लोकेशन खोजें' इस्तेमाल करें।"), "error");
      return null;
    }
  }
  function openSearch() {
    return new Promise(resolve => {
      let finished = false, timer = null, ctl = null;
      const el = mkOv("z3", `<div class="aa-oh"><button type="button" class="aa-bk" aria-label="Back">←</button><b>${L("SEARCH LOCATION", "लोकेशन खोजें")}</b></div>
        <div class="aa-sr"><input type="search" placeholder="${L("Search area, street, landmark or city…", "इलाका, गली, लैंडमार्क या शहर खोजें…")}" autocomplete="off"></div>
        <div class="aa-scroll aa-res"></div><p class="aa-hint">${L("Map data © OpenStreetMap contributors", "मैप डेटा © OpenStreetMap")}</p>`);
      const done = v => { if (finished) return; finished = true; ov.close(el); resolve(v); };
      ov.push(el, () => { if (!finished) { finished = true; resolve(null); } });
      el.querySelector(".aa-bk").onclick = () => done(null);
      const inp = el.querySelector("input"), res = el.querySelector(".aa-res"); inp.focus();
      const run = async q => {
        if (ctl) ctl.abort(); ctl = new AbortController();
        res.innerHTML = `<p class="aa-hint">${L("Searching…", "खोज रहे हैं…")}</p>`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&countrycodes=in&accept-language=en&q=${encodeURIComponent(q)}`, { signal: ctl.signal });
          const j = await r.json();
          if (!j.length) { res.innerHTML = `<p class="aa-hint">${L("No results. Try a different spelling.", "कोई नतीजा नहीं। दूसरे शब्द से खोजें।")}</p>`; return; }
          res.innerHTML = j.map((x, i) => `<button type="button" data-i="${i}">📍 ${esc(x.display_name)}</button>`).join("");
          res.querySelectorAll("button").forEach(b => b.onclick = async () => {
            let p = mapPlace(j[Number(b.dataset.i)]);
            if (!p.pincode) { try { const q2 = await reverse(p.lat, p.lng); p = { ...q2, ...Object.fromEntries(Object.entries(p).filter(([, v]) => v)) , pincode: q2.pincode || "" }; } catch (e) {} }
            if (!p.pincode) toast(L("Pincode not found for this place. Please type it.", "इस जगह का पिनकोड नहीं मिला। कृपया खुद भरें।"), "error");
            done(p);
          });
        } catch (e) { if (e.name !== "AbortError") res.innerHTML = `<p class="aa-hint">${L("Search failed. Check your internet.", "सर्च नहीं हो पाई। इंटरनेट जाँचें।")}</p>`; }
      };
      inp.oninput = () => { clearTimeout(timer); const q = inp.value.trim(); if (q.length < 3) { res.innerHTML = ""; return; } timer = setTimeout(() => run(q), 700); };
    });
  }

  /* ---------- add / edit address form (like screenshot) ---------- */
  function openForm(opts) {
    opts = opts || {};
    return new Promise(resolve => {
      const a = opts.addr || {}, editing = !!a.id, first = !!opts.first || !(cache || []).length;
      const isDefaultNow = !!a.is_default || (first && !editing) || (editing && (cache || []).length === 1);
      const legacy = (!editing && first && document.getElementById("profileAddress")?.value) || "";
      const sp = savedPin();
      const pre = {
        name: a.name || document.getElementById("profileName")?.value || (typeof signedInUser !== "undefined" && signedInUser?.user_metadata?.full_name) || "",
        phone: a.phone || document.getElementById("profilePhone")?.value || "",
        pincode: a.pincode || (legacy.match(/\b[1-9][0-9]{5}\b/) || [""])[0] || (!editing && sp && sp.pin) || "",
        state: a.state || "", house: a.house || "", address: a.address || legacy, locality: a.locality || "", city: a.city || ""
      };
      if (opts.prefill) { const p = opts.prefill; if (p.pincode) pre.pincode = p.pincode; if (p.state) pre.state = p.state; if (p.city) pre.city = p.city; if (p.locality) pre.locality = p.locality; if (p.address) pre.address = p.address; }
      const F = (id, label, v, extra) => `<label class="aa-f"><input id="${id}" value="${esc(v)}" placeholder=" " ${extra || ""}><span>${label}</span></label>`;
      const el = mkOv("", `<div class="aa-oh"><button type="button" class="aa-bk" aria-label="Back">←</button><b>${editing ? L("EDIT ADDRESS", "पता बदलें") : L("ADD NEW ADDRESS", "नया पता जोड़ें")}</b></div>
        <div class="aa-scroll">
          <div class="aa-locrow"><button type="button" id="fCur">📍 ${L("Use my current location", "मेरी वर्तमान लोकेशन")}</button><button type="button" id="fSea">🔍 ${L("Search location", "लोकेशन खोजें")}</button></div>
          <div class="aa-blk">${F("fName", L("Name *", "नाम *"), pre.name, 'autocomplete="name"')}${F("fPhone", L("Mobile *", "मोबाइल *"), pre.phone, 'inputmode="tel" autocomplete="tel" maxlength="15"')}</div>
          <div class="aa-blk">
            <div class="aa-two">${F("fPin", L("Pincode *", "पिनकोड *"), pre.pincode, 'inputmode="numeric" maxlength="6" autocomplete="postal-code"')}${F("fState", L("State *", "राज्य *"), pre.state)}</div>
            <small class="aa-msg" id="fPinMsg"></small>
            ${F("fHouse", L("House Number/Tower/Block*", "मकान नंबर / टावर / ब्लॉक *"), pre.house)}
            ${F("fAddr", L("Address (Building, Street, Area) *", "पता (बिल्डिंग, गली, एरिया) *"), pre.address)}
            ${F("fLoc", L("Locality/ Town *", "मोहल्ला / कस्बा *"), pre.locality)}
            ${F("fCity", L("City/ District *", "शहर / ज़िला *"), pre.city)}
          </div>
          <div class="aa-blk">
            <div class="aa-q">${L("Type of Address *", "पते का प्रकार *")}</div>
            <div class="aa-radios"><label><input type="radio" name="fType" value="home" ${a.address_type === "office" ? "" : "checked"}> ${L("Home", "घर")}</label><label><input type="radio" name="fType" value="office" ${a.address_type === "office" ? "checked" : ""}> ${L("Office", "ऑफिस")}</label></div>
            <div id="fWk" ${a.address_type === "office" ? "" : "hidden"}><div class="aa-q">${L("Is your office open on weekends?", "क्या आपका ऑफिस वीकेंड पर खुला रहता है?")}</div>
              <label class="aa-ck"><input type="checkbox" id="fSat" ${a.open_sat ? "checked" : ""}> ${L("Open on Saturday", "शनिवार को खुला")}</label>
              <label class="aa-ck"><input type="checkbox" id="fSun" ${a.open_sun ? "checked" : ""}> ${L("Open on Sunday", "रविवार को खुला")}</label></div>
            <hr><label class="aa-ck"><input type="checkbox" id="fDef" ${isDefaultNow ? "checked disabled" : ""}> ${L("Make this as my default address", "इसे मेरा डिफ़ॉल्ट पता बनाएँ")}</label>
          </div>
        </div>
        <div class="aa-foot"><button type="button" id="fCancel">${L("CANCEL", "रद्द करें")}</button><button type="button" id="fSave" disabled>${L("SAVE", "सेव करें")}</button></div>`);
      let finished = false, pinOk = false, lat = a.lat || (opts.prefill && opts.prefill.lat) || null, lng = a.lng || (opts.prefill && opts.prefill.lng) || null;
      const done = v => { if (finished) return; finished = true; ov.close(el); resolve(v); };
      ov.push(el, () => { if (!finished) { finished = true; resolve(null); } });
      const g = id => el.querySelector("#" + id), save = g("fSave"), msg = g("fPinMsg");
      const type = () => el.querySelector('input[name="fType"]:checked')?.value || "home";
      const val = () => {
        const v = { name: g("fName").value.trim(), phone: g("fPhone").value.trim(), pincode: g("fPin").value.trim(), state: g("fState").value.trim(), house: g("fHouse").value.trim(), address: g("fAddr").value.trim(), locality: g("fLoc").value.trim(), city: g("fCity").value.trim() };
        const ok = v.name && /^[0-9+\-\s]{10,15}$/.test(v.phone) && /^[1-9][0-9]{5}$/.test(v.pincode) && pinOk && v.state && v.house && v.address && v.locality && v.city;
        save.disabled = !ok; return ok ? v : null;
      };
      const checkPin = async fill => {
        const pin = g("fPin").value.trim();
        if (!/^[1-9][0-9]{5}$/.test(pin)) { pinOk = false; msg.className = "aa-msg bad"; msg.textContent = pin ? L("Enter a valid 6-digit pincode", "6 अंकों का सही पिनकोड भरें") : ""; val(); return; }
        msg.className = "aa-msg"; msg.textContent = L("Checking…", "जाँच हो रही है…");
        const r = window.aashapuraPinLookup ? await window.aashapuraPinLookup(pin) : { ok: true };
        if (g("fPin").value.trim() !== pin) return;
        if (!r.ok) { pinOk = false; msg.className = "aa-msg bad"; msg.textContent = "❌ " + (r.msg || ""); val(); return; }
        pinOk = true; msg.className = "aa-msg ok"; msg.textContent = r.area ? "✅ " + L("Delivery available: ", "डिलीवरी उपलब्ध: ") + r.area : "";
        if (r.area) {
          const dist = r.area.split(",")[0].trim();
          if (fill === "all") { if (r.state) g("fState").value = r.state; g("fCity").value = dist; }
          else { if (!g("fState").value && r.state) g("fState").value = r.state; if (!g("fCity").value) g("fCity").value = dist; }
        }
        val();
      };
      const fillFrom = p => {
        if (!p) return;
        if (p.pincode) g("fPin").value = p.pincode;
        if (p.state) g("fState").value = p.state;
        if (p.city) g("fCity").value = p.city;
        if (p.locality) g("fLoc").value = p.locality;
        if (p.address) g("fAddr").value = p.address;
        lat = p.lat || lat; lng = p.lng || lng;
        checkPin(true); val();
      };
      el.querySelectorAll("input").forEach(i => i.addEventListener("input", () => { if (i.id === "fPin") { i.value = i.value.replace(/\D/g, "").slice(0, 6); pinOk = false; checkPin("all"); } else val(); }));
      el.querySelectorAll('input[name="fType"]').forEach(r => r.onchange = () => { g("fWk").hidden = type() !== "office"; });
      g("fCur").onclick = async () => fillFrom(await useCurrent());
      g("fSea").onclick = async () => fillFrom(await openSearch());
      el.querySelector(".aa-bk").onclick = g("fCancel").onclick = () => done(null);
      save.onclick = async () => {
        const v = val(); if (!v) return;
        save.disabled = true; save.textContent = L("SAVING…", "सेव हो रहा है…");
        try {
          const saved = await saveAddr({ id: a.id, ...v, address_type: type(), open_sat: type() === "office" && g("fSat").checked, open_sun: type() === "office" && g("fSun").checked, is_default: g("fDef").checked, lat, lng });
          if (opts.select) { setSelected(saved.id); deliverTo(saved); }
          toast(L("Address saved.", "पता सेव हो गया।")); done(saved);
        } catch (e) { toast(L("Could not save address: ", "पता सेव नहीं हुआ: ") + (e.message || e), "error"); save.disabled = false; save.textContent = L("SAVE", "सेव करें"); }
      };
      if (pre.pincode) checkPin(editing ? false : true); val();
    });
  }

  /* ---------- "Select Address" page (video) ---------- */
  function openSelect() {
    return new Promise(async resolve => {
      let finished = false, list = await loadAddrs(true), sel = (selectedOf(list) || {}).id;
      const el = mkOv("", `<div class="aa-oh"><button type="button" class="aa-bk" aria-label="Back">←</button><b>${L("SELECT ADDRESS", "पता चुनें")}</b></div>${stepper(2)}<div class="aa-scroll" id="slBody"></div>
        <div class="aa-foot"><button type="button" class="aa-go" id="slOk">${L("CONFIRM", "पक्का करें")}</button></div>`);
      const done = v => { if (finished) return; finished = true; ov.close(el); resolve(v); };
      ov.push(el, () => { if (!finished) { finished = true; resolve(null); } });
      el.querySelector(".aa-bk").onclick = () => done(null);
      const card = a => `<div class="aa-card"><label class="aa-rad"><input type="radio" name="slA" value="${esc(a.id)}" ${String(a.id) === String(sel) ? "checked" : ""}><span class="aa-body">
        <div class="aa-top"><b>${esc(a.name)}</b>${typeChip(a)}</div>
        <div class="aa-lines">${esc(addrLine(a))}</div>
        ${String(a.id) === String(sel) ? `<div class="aa-mob">${L("Mobile", "मोबाइल")}: <b>${esc(a.phone)}</b></div><div class="aa-mini"><button type="button" data-rm="${esc(a.id)}">${L("REMOVE", "हटाएँ")}</button><button type="button" data-ed="${esc(a.id)}">${L("EDIT", "बदलें")}</button></div>` : ""}
        </span></label></div>`;
      const paint = () => {
        const def = list.filter(a => a.is_default), oth = list.filter(a => !a.is_default);
        el.querySelector("#slBody").innerHTML = `<button type="button" class="aa-add" id="slAdd">+ ${L("ADD NEW ADDRESS", "नया पता जोड़ें")}</button>
          ${def.length ? `<div class="aa-lbl">${L("DEFAULT ADDRESS", "डिफ़ॉल्ट पता")}</div>${def.map(card).join("")}` : ""}
          ${oth.length ? `<div class="aa-lbl">${L("OTHER ADDRESS", "दूसरे पते")}</div>${oth.map(card).join("")}` : ""}`;
        const b = el.querySelector("#slBody");
        b.querySelectorAll('input[name="slA"]').forEach(r => r.onchange = () => { sel = r.value; paint(); });
        b.querySelector("#slAdd").onclick = async () => { const s = await openForm({ select: false }); list = await loadAddrs(true); if (s) sel = s.id; paint(); };
        b.querySelectorAll("[data-ed]").forEach(x => x.onclick = async e => { e.preventDefault(); e.stopPropagation(); const s = await openForm({ addr: list.find(y => String(y.id) === x.dataset.ed) }); list = await loadAddrs(true); paint(); });
        b.querySelectorAll("[data-rm]").forEach(x => x.onclick = async e => {
          e.preventDefault(); e.stopPropagation();
          if (!(await confirm(L("Remove this address?", "इस पते को हटाएँ?")))) return;
          try { await deleteAddr(x.dataset.rm); } catch (er) { return toast(L("Could not remove: ", "हटाया नहीं जा सका: ") + (er.message || er), "error"); }
          list = await loadAddrs(true); if (!list.length) return done(null);
          sel = (selectedOf(list) || {}).id; paint(); toast(L("Address removed.", "पता हटा दिया गया।"));
        });
      };
      paint();
      el.querySelector("#slOk").onclick = () => { const a = list.find(x => String(x.id) === String(sel)); if (!a) return toast(L("Please select an address.", "कृपया एक पता चुनें।"), "error"); setSelected(a.id); deliverTo(a); done(a); };
    });
  }

  /* ---------- "Select Delivery Location" bottom sheet (video) ---------- */
  async function openSheet(opts) {
    opts = opts || {};
    let list = await loadAddrs(true);
    const el = document.createElement("div"); el.className = "aa-sbk";
    el.innerHTML = `<div class="aa-sheet"><div class="aa-sh-h"><b>${L("Select Delivery Location", "डिलीवरी लोकेशन चुनें")}</b><button type="button" id="shX" aria-label="Close">✕</button></div>
      <div class="aa-sh-pin"><input id="shPin" inputmode="numeric" maxlength="6" placeholder="${L("Enter Pincode", "पिनकोड भरें")}"><button type="button" id="shChk">${L("Check Pincode", "पिनकोड जाँचें")}</button></div>
      <p class="aa-msg" id="shMsg" style="margin:8px 0 0"></p>
      <button type="button" class="aa-link" id="shCur">◎ ${L("Use my current location", "मेरी वर्तमान लोकेशन इस्तेमाल करें")} ›</button>
      <button type="button" class="aa-link" id="shSea">⌕ ${L("Search Location", "लोकेशन खोजें")} ›</button>
      <div class="aa-or"><span>${L("Or", "या")}</span></div>
      <div class="aa-sh-sub"><b>${L("Select Saved Address", "सेव किया हुआ पता चुनें")}</b><button type="button" id="shAdd">${L("Add New", "नया जोड़ें")}</button></div>
      <div id="shList"></div></div>`;
    document.body.appendChild(el);
    let finished = false;
    const close = () => { if (finished) return; finished = true; ov.close(el); };
    ov.push(el, () => { finished = true; });
    const q = s => el.querySelector(s), msg = q("#shMsg");
    el.onclick = e => { if (e.target === el) close(); };
    q("#shX").onclick = close;
    const changed = () => { try { opts.onChange && opts.onChange(); } catch (e) {} };
    const paintList = () => {
      const cur = selectedOf(list), sp = savedPin(), pinOverride = sp && cur && sp.pin !== cur.pincode;
      q("#shList").innerHTML = list.length ? list.map(a => {
        const on = cur && String(cur.id) === String(a.id) && !pinOverride;
        return `<div class="aa-sc ${on ? "on" : ""}">${on ? `<span class="aa-cur">${L("CURRENTLY SELECTED", "अभी चुना हुआ")}</span>` : ""}
          <div class="aa-top"><b>${esc(a.name)}, ${esc(a.pincode)}</b>${typeChip(a)}</div>
          <div class="aa-lines">${esc(addrLine(a))}</div><div class="aa-mob">${L("Mob", "मोबाइल")}: <b>${esc(a.phone)}</b></div>
          <div class="row"><button type="button" class="here" data-here="${esc(a.id)}" ${on ? "disabled" : ""}>${on ? L("Delivering Here", "यहीं डिलीवरी") : L("Deliver Here", "यहाँ डिलीवर करें")}</button><button type="button" class="ed" data-ed="${esc(a.id)}">${L("Edit", "बदलें")}</button></div></div>`;
      }).join("") : `<p class="aa-hint">${L("No saved address yet. Tap “Add New”.", "अभी कोई पता सेव नहीं है। “नया जोड़ें” दबाएँ।")}</p>`;
      el.querySelectorAll("[data-here]").forEach(b => b.onclick = () => { const a = list.find(x => String(x.id) === b.dataset.here); setSelected(a.id); deliverTo(a); toast(L("Delivering to ", "डिलीवरी यहाँ: ") + a.pincode); changed(); close(); });
      el.querySelectorAll("[data-ed]").forEach(b => b.onclick = async () => { await openForm({ addr: list.find(x => String(x.id) === b.dataset.ed), select: false }); list = await loadAddrs(true); paintList(); changed(); });
    };
    paintList();
    const runPin = async () => {
      const pin = q("#shPin").value.trim();
      if (!/^[1-9][0-9]{5}$/.test(pin)) { msg.className = "aa-msg bad"; msg.textContent = L("Enter a valid 6-digit pincode", "6 अंकों का सही पिनकोड भरें"); return; }
      msg.className = "aa-msg"; msg.textContent = L("Checking…", "जाँच हो रही है…");
      const r = window.aashapuraPinLookup ? await window.aashapuraPinLookup(pin) : { ok: true };
      if (!r.ok) { msg.className = "aa-msg bad"; msg.textContent = "❌ " + (r.msg || ""); return; }
      window.aashapuraSavePin && window.aashapuraSavePin(pin, r);
      msg.className = "aa-msg ok"; msg.innerHTML = `${r.area ? "✅ " + L("Delivery available: ", "डिलीवरी उपलब्ध: ") + esc(r.area) + "<br>" : ""}📦 ${L("Delivery between", "डिलीवरी")} <b>${esc(estimate(r.state))}</b>`;
      paintList(); changed();
    };
    q("#shPin").oninput = () => { const i = q("#shPin"); i.value = i.value.replace(/\D/g, "").slice(0, 6); if (i.value.length === 6) runPin(); };
    q("#shChk").onclick = runPin;
    const useFound = async p => {
      if (!p || !p.pincode) return;
      q("#shPin").value = p.pincode; await runPin();
      msg.insertAdjacentHTML("beforeend", `<br>📍 ${esc(p.display).slice(0, 120)}<br><button type="button" class="aa-link" id="shHere" style="padding:6px 0;text-decoration:underline">+ ${L("Save full address for this location", "इस लोकेशन का पूरा पता सेव करें")}</button>`);
      const hb = msg.querySelector("#shHere");
      if (hb) hb.onclick = async () => {
        const s = await openForm({ select: true, addr: null, prefill: p });
        if (s) { list = await loadAddrs(true); paintList(); changed(); }
      };
    };
    q("#shCur").onclick = async () => useFound(await useCurrent());
    q("#shSea").onclick = async () => useFound(await openSearch());
    q("#shAdd").onclick = async () => { const s = await openForm({ select: true }); if (s) { list = await loadAddrs(true); paintList(); changed(); close(); } };
  }

  /* ---------- profile page: saved addresses ---------- */
  async function renderProfile() {
    const box = document.getElementById("profileAddrBox"); if (!box) return;
    box.className = "profile-addr";
    box.innerHTML = `<p class="small-note">${L("Loading addresses…", "पते लोड हो रहे हैं…")}</p>`;
    let list = [];
    try { list = await loadAddrs(true); } catch (e) {}
    syncProfile();
    const card = a => `<div class="aa-card"><div class="aa-top"><b>${esc(a.name)}</b>${typeChip(a)}</div>${addrHTML(a)}<div class="aa-mob">${L("Mobile", "मोबाइल")}: ${esc(a.phone)}</div>
      <div class="aa-btns"><button type="button" data-ed="${esc(a.id)}">${L("EDIT", "बदलें")}</button><button type="button" data-rm="${esc(a.id)}">${L("REMOVE", "हटाएँ")}</button></div></div>`;
    const def = list.filter(a => a.is_default), oth = list.filter(a => !a.is_default);
    box.innerHTML = `<h3 style="margin:22px 0 10px">${L("My Addresses", "मेरे पते")}</h3>
      <button type="button" class="aa-add" id="pfAdd">+ ${L("ADD NEW ADDRESS", "नया पता जोड़ें")}</button>
      ${def.length ? `<div class="aa-lbl">${L("DEFAULT ADDRESS", "डिफ़ॉल्ट पता")}</div>${def.map(card).join("")}` : ""}
      ${oth.length ? `<div class="aa-lbl">${L("OTHER ADDRESSES", "दूसरे पते")}</div>${oth.map(card).join("")}` : ""}
      ${!list.length ? `<p class="small-note">${L("No saved address yet.", "अभी कोई पता सेव नहीं है।")}</p>` : ""}
      ${local && uid() !== "guest" ? `<p class="small-note">${L("Addresses are saved on this phone only.", "पते सिर्फ़ इस फ़ोन में सेव हैं।")}</p>` : ""}`;
    box.querySelector("#pfAdd").onclick = async () => { await openForm({}); renderProfile(); };
    box.querySelectorAll("[data-ed]").forEach(b => b.onclick = async () => { await openForm({ addr: list.find(x => String(x.id) === b.dataset.ed) }); renderProfile(); });
    box.querySelectorAll("[data-rm]").forEach(b => b.onclick = async () => {
      if (!(await confirm(L("Remove this address?", "इस पते को हटाएँ?")))) return;
      try { await deleteAddr(b.dataset.rm); toast(L("Address removed.", "पता हटा दिया गया।")); } catch (er) { toast(L("Could not remove: ", "हटाया नहीं जा सका: ") + (er.message || er), "error"); }
      renderProfile();
    });
  }
  window.aashapuraRenderProfileAddr = renderProfile;

  window.aashapuraAddr = { ov, load: loadAddrs, cached: () => cache, selected: selectedOf, setSelected, deliverTo, openForm, openSelect, openSheet, stepper, text: addrLine, html: addrHTML, chip: typeChip, estimate, savedPin, reset: () => { cache = null; } };
  /* forget cached addresses when user signs in/out */
  try { supabaseClient.auth.onAuthStateChange(() => { cache = null; local = false; }); } catch (e) {}
})();
