/* Admin extras: Edit Product (details + photos/videos) and Home Banner editor. Only works after admin login. */
(function () {
  const $ = id => document.getElementById(id);
  const ADMIN = "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const toast = (m, t) => { try { showStoreToast(m, t || "success"); } catch (e) { alert(m); } };
  const isVid = u => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(String(u || ""));
  const BUCKET = "product-images";
  const isAdmin = async () => { try { const { data: { user } } = await supabaseClient.auth.getUser(); return !!user && user.id === ADMIN; } catch (e) { return false; } };
  const ovApi = () => (window.aashapuraAddr && window.aashapuraAddr.ov) || null;

  const st = document.createElement("style");
  st.textContent = `
  .ap-ov{position:fixed;inset:0;z-index:100050;background:#f3f6f2;overflow-y:auto;color:#173d2e;font-family:inherit;-webkit-overflow-scrolling:touch}
  .ap-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:14px 16px;background:#fff;border-bottom:1px solid #e3eadf;font-size:18px}
  .ap-head .bk{border:0;background:none;font-size:24px;cursor:pointer;color:inherit}
  .ap-body{padding:14px 14px 90px;max-width:560px;margin:0 auto}
  .ap-body label{display:block;font-size:13px;color:#4b6455;margin:10px 0 3px}
  .ap-body input,.ap-body textarea,.ap-body select{width:100%;box-sizing:border-box;padding:11px;border:1px solid #cfd9cb;border-radius:8px;font:inherit;background:#fff}
  .ap-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .ap-media{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0}
  .ap-m{position:relative;width:78px;height:78px;border-radius:10px;overflow:hidden;border:2px solid #d5dfd1;background:#fff}
  .ap-m.main{border-color:#2f6b3a}
  .ap-m img,.ap-m video{width:100%;height:100%;object-fit:cover}
  .ap-m .x{position:absolute;top:2px;right:2px;width:22px;height:22px;border-radius:50%;border:0;background:#b42318;color:#fff;font-size:13px;line-height:1;cursor:pointer}
  .ap-m .mk{position:absolute;left:0;right:0;bottom:0;border:0;background:rgba(0,0,0,.55);color:#fff;font-size:10px;padding:3px 0;cursor:pointer}
  .ap-m .tg{position:absolute;left:3px;top:3px;background:#2f6b3a;color:#fff;font-size:10px;padding:1px 5px;border-radius:99px}
  .ap-foot{position:fixed;left:0;right:0;bottom:0;z-index:3;background:#fff;border-top:1px solid #e3eadf;padding:10px 14px;display:flex;gap:10px}
  .ap-foot button{flex:1;padding:13px;border-radius:10px;border:0;font-weight:700;font-size:15px;cursor:pointer}
  .ap-save{background:#2f6b3a;color:#fff}.ap-cancel{background:#eef2ec;color:#173d2e}
  .ap-btn{padding:9px 12px;border-radius:8px;border:1px solid #888;background:#fff;cursor:pointer}
  .ap-card{border:1px solid #e5e7eb;border-radius:10px;padding:10px;margin:8px 0;background:#fff;display:flex;gap:10px;align-items:center;justify-content:space-between}
  .ap-sec{margin-top:20px;padding-top:12px;border-top:2px solid #e3eadf}
  .ap-sec h3{margin:0 0 6px}`;
  document.head.appendChild(st);

  function overlay(title, html, onSave, saveText) {
    const el = document.createElement("div"); el.className = "ap-ov";
    el.innerHTML = `<div class="ap-head"><button type="button" class="bk" aria-label="Back">←</button><b>${esc(title)}</b></div><div class="ap-body">${html}</div><div class="ap-foot"><button type="button" class="ap-cancel">Cancel</button><button type="button" class="ap-save">${esc(saveText || "Save")}</button></div>`;
    document.body.appendChild(el);
    const A = ovApi(); let shut;
    if (A) { A.push(el); shut = () => A.close(el); } else shut = () => el.remove();
    el.querySelector(".bk").onclick = shut; el.querySelector(".ap-cancel").onclick = shut;
    const sv = el.querySelector(".ap-save");
    sv.onclick = async () => { sv.disabled = true; const t = sv.textContent; sv.textContent = "Saving…"; let ok = false; try { ok = await onSave(el); } finally { sv.disabled = false; sv.textContent = t; } if (ok) shut(); };
    return el;
  }

  async function uploadFile(file, folder) {
    const path = `${folder ? folder + "/" : ""}${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabaseClient.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw new Error((file.type.startsWith("video/") ? "Video" : "Image") + " upload failed: " + error.message);
    return supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  /* ================= EDIT PRODUCT ================= */
  const mediaOf = p => {
    let urls = [];
    try { const s = typeof p.images === "string" ? JSON.parse(p.images || "[]") : p.images; urls = Array.isArray(s) ? s.slice() : []; } catch (e) {}
    if (p.image_url && !urls.includes(p.image_url)) urls.unshift(p.image_url);
    return urls.filter(Boolean);
  };

  function editProduct(p, done) {
    let media = mediaOf(p);
    const html = `
      <label>Product name</label><input data-f="name" value="${esc(p.name)}">
      <label>Description</label><textarea data-f="description" rows="4">${esc(p.description || p.desc || "")}</textarea>
      <div class="ap-row"><div><label>Price ₹</label><input data-f="price" type="number" min="0" step="0.01" value="${esc(p.price)}"></div>
      <div><label>M.R.P. ₹ (optional)</label><input data-f="mrp" type="number" min="0" step="0.01" value="${p.mrp ? esc(p.mrp) : ""}"></div></div>
      <div class="ap-row"><div><label>Stock</label><input data-f="stock" type="number" min="0" step="1" value="${esc(p.stock == null ? 0 : p.stock)}"></div>
      <div><label>Weight</label><input data-f="weight" value="${esc(p.weight || "")}"></div></div>
      <label>Category</label><input data-f="category" value="${esc(p.category || "")}">
      <label>Video URL (optional link)</label><input data-f="video_url" type="url" value="${esc(p.video_url || "")}">
      <label style="margin-top:16px;font-weight:700">🌿 Ayurveda Info <small style="font-weight:400">(optional · ek line = ek point)</small></label>
      <label>Ingredients</label><textarea data-f="ay_ingredients" rows="2">${esc(p.ay_ingredients || "")}</textarea>
      <label>Benefits (fayde)</label><textarea data-f="ay_benefits" rows="3">${esc(p.ay_benefits || "")}</textarea>
      <label>Kaise use karein</label><textarea data-f="ay_usage" rows="3">${esc(p.ay_usage || "")}</textarea>
      <label>Dose (matra)</label><textarea data-f="ay_dose" rows="2">${esc(p.ay_dose || "")}</textarea>
      <label>Savdhaani (Precautions)</label><textarea data-f="ay_precautions" rows="3">${esc(p.ay_precautions || "")}</textarea>
      <label>Photos / Videos (✕ se hatao, ⭐ se main photo banao)</label>
      <div class="ap-media" id="apMedia"></div>
      <label>Naye photos/videos jodo</label>
      <input id="apNew" type="file" accept="image/*,video/mp4,video/webm" multiple>
      <small style="color:#5d7266">Photos max 10, videos max 2 (50 MB tak).</small>`;
    const el = overlay("Edit Product", html, async (root) => {
      if (!(await isAdmin())) { alert("Admin login karo."); return false; }
      const g = k => root.querySelector(`[data-f="${k}"]`).value.trim();
      const name = g("name"), price = Number(g("price")), stock = Number(g("stock")), mrp = Number(g("mrp"));
      if (!name || g("price") === "" || !(price >= 0) || g("stock") === "" || !Number.isInteger(stock) || stock < 0) { alert("Name, sahi price aur stock bharo."); return false; }
      const files = [...root.querySelector("#apNew").files];
      const newImgs = files.filter(f => f.type.startsWith("image/")), newVids = files.filter(f => f.type.startsWith("video/"));
      const big = newVids.find(f => f.size > 50 * 1024 * 1024); if (big) { alert("Video 50 MB se chhota ho: " + big.name); return false; }
      const have = media.filter(u => !isVid(u)).length + newImgs.length, haveV = media.filter(isVid).length + newVids.length;
      if (have > 10) { alert("Photos max 10."); return false; }
      if (haveV > 2) { alert("Videos max 2."); return false; }
      try {
        const up = []; for (const f of newImgs.concat(newVids)) up.push(await uploadFile(f));
        const all = media.concat(up);
        const photos = all.filter(u => !isVid(u)), vids = all.filter(isVid);
        const upd = {
          name, description: g("description"), price, stock, weight: g("weight"), category: g("category") || "herbal",
          video_url: g("video_url"),
          ay_ingredients: g("ay_ingredients"), ay_benefits: g("ay_benefits"), ay_usage: g("ay_usage"), ay_dose: g("ay_dose"), ay_precautions: g("ay_precautions"), image_url: photos[0] || "", images: JSON.stringify(photos.concat(vids)), mrp: mrp > 0 ? mrp : null
        };
        let { error } = await supabaseClient.from("products").update(upd).eq("id", p.id);
        if (error && /mrp/i.test(error.message)) { delete upd.mrp; ({ error } = await supabaseClient.from("products").update(upd).eq("id", p.id)); }
        if (error && /ay_/i.test(error.message)) {
          ["ay_ingredients", "ay_benefits", "ay_usage", "ay_dose", "ay_precautions"].forEach(k => delete upd[k]);
          ({ error } = await supabaseClient.from("products").update(upd).eq("id", p.id));
          if (!error) alert("Product save ho gaya, par Ayurveda info save nahi hui. Pehle supabase_v23.sql Supabase me run karo.");
        }
        if (error) { alert("Save nahi hua: " + error.message + "\n\n(Agar 'policy' likha hai to supabase_v19.sql run karo.)"); return false; }
        toast("Product update ho gaya!");
        try { await loadProducts(); } catch (e) {}
        done && done();
        return true;
      } catch (e) { alert(e.message || e); return false; }
    }, "Save Changes");
    const box = el.querySelector("#apMedia");
    const paint = () => {
      box.innerHTML = media.length ? "" : "<small>Koi photo/video nahi.</small>";
      const firstPhoto = media.findIndex(u => !isVid(u));
      media.forEach((u, i) => {
        const d = document.createElement("div"); d.className = "ap-m" + (i === firstPhoto ? " main" : "");
        d.innerHTML = (isVid(u) ? `<video src="${esc(u)}#t=0.1" muted playsinline preload="metadata"></video>` : `<img src="${esc(u)}" alt="">`) +
          (i === firstPhoto ? `<span class="tg">Main</span>` : isVid(u) ? `<span class="tg">Video</span>` : `<button type="button" class="mk">⭐ Main</button>`) + `<button type="button" class="x" aria-label="Remove">✕</button>`;
        d.querySelector(".x").onclick = () => { media.splice(i, 1); paint(); };
        const mk = d.querySelector(".mk"); if (mk) mk.onclick = () => { const [m] = media.splice(i, 1); media.unshift(m); paint(); };
        box.appendChild(d);
      });
    };
    paint();
  }

  async function renderList() {
    const host = $("adminProductList"); if (!host) return;
    host.innerHTML = "<p>Products load ho rahe hain…</p>";
    if (!(await isAdmin())) { host.innerHTML = ""; return; }
    let r = await supabaseClient.from("products").select("*").order("created_at", { ascending: false });
    if (r.error) r = await supabaseClient.from("products").select("*");
    if (r.error) { host.innerHTML = `<p style="color:#b42318">Products load nahi hue: ${esc(r.error.message)}</p>`; return; }
    const data = r.data || [];
    if (!data.length) { host.innerHTML = "<p>Abhi koi product nahi hai.</p>"; return; }
    host.innerHTML = `<h3 style="margin:6px 0">Products (${data.length})</h3>` + data.map(p => {
      const im = mediaOf(p).find(u => !isVid(u));
      return `<div class="ap-card"><div style="display:flex;gap:10px;align-items:center;min-width:0">${im ? `<img src="${esc(im)}" alt="" style="width:46px;height:46px;border-radius:8px;object-fit:cover;flex:none">` : `<span style="font-size:26px">🌿</span>`}
      <div style="min-width:0"><strong>${esc(p.name || "Unnamed")}</strong><div style="font-size:12px;color:#666">₹${Number(p.price || 0)} · ${esc(p.weight || "")} · ${esc(p.category || "")} · stock ${Number(p.stock || 0)}</div></div></div>
      <div style="display:flex;gap:6px;flex:none"><button type="button" class="ap-btn" data-edit="${esc(p.id)}">Edit</button><button type="button" data-del="${esc(p.id)}" style="background:#b42318;color:#fff;border:0;border-radius:8px;padding:9px 11px;cursor:pointer">Delete</button></div></div>`;
    }).join("");
    host.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => editProduct(data.find(p => String(p.id) === b.dataset.edit), renderList));
    host.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      const p = data.find(x => String(x.id) === b.dataset.del);
      if (!(await confirm(`“${p?.name || "Product"}” ko hamesha ke liye hatao?`))) return;
      b.disabled = true; b.textContent = "Deleting…";
      const { error } = await supabaseClient.from("products").delete().eq("id", b.dataset.del);
      if (error) { toast("Delete nahi hua: " + error.message, "error"); b.disabled = false; b.textContent = "Delete"; return; }
      toast("Product delete ho gaya."); try { await loadProducts(); } catch (e) {} renderList();
    });
  }
  window.renderAdminProducts = renderList;

  /* ================= HOME BANNERS ================= */
  const GRAD = { green: "linear-gradient(120deg,#2f6b3a,#7aa84f)", gold: "linear-gradient(120deg,#b9731f,#e6a93b)", brown: "linear-gradient(120deg,#6a3d1f,#a8683a)", blue: "linear-gradient(120deg,#1e4e8c,#4a90d9)", red: "linear-gradient(120deg,#a4262c,#e0605a)", purple: "linear-gradient(120deg,#5b3a8c,#9b6fd0)" };
  const GRAD_NAME = { green: "Green", gold: "Gold", brown: "Brown", blue: "Blue", red: "Red (sale)", purple: "Purple" };

  function bannerForm(b, done) {
    let imgUrl = b.image_url || "";
    const cats = [...new Set((window.__apProducts || []).map(p => String(p.category || "").trim().toLowerCase()).filter(Boolean))];
    const prods = window.__apProducts || [];
    let lt = "shop", lv = "";
    const bl = b.button_link || "#shop";
    if (bl.startsWith("cat:")) { lt = "cat"; lv = bl.slice(4); } else if (bl.startsWith("product:")) { lt = "product"; lv = bl.slice(8); } else if (/^https?:/i.test(bl)) { lt = "url"; lv = bl; }
    const html = `
      <label>Chhota text (jaise NEW COLLECTION / SALE)</label><input data-f="tag" value="${esc(b.tag || "")}">
      <label>Bada heading</label><input data-f="title" value="${esc(b.title || "")}">
      <label>Neeche ka text</label><input data-f="subtitle" value="${esc(b.subtitle || "")}">
      <label>Button ka naam (khali = button nahi)</label><input data-f="button_text" value="${esc(b.button_text == null ? "Shop Now" : b.button_text)}">
      <label>Button dabane par kahan jaye?</label>
      <select id="apLt"><option value="shop">Shop (saare products)</option><option value="cat">Ek category</option><option value="product">Ek product</option><option value="url">Koi link (https://…)</option></select>
      <div id="apLv" style="margin-top:6px"></div>
      <label>Background rang</label>
      <select data-f="bg_color">${Object.keys(GRAD).map(k => `<option value="${k}"${(b.bg_color || "green") === k ? " selected" : ""}>${GRAD_NAME[k]}</option>`).join("")}</select>
      <label>Photo (optional, photo ho to rang ki jagah photo dikhegi)</label>
      <div id="apImg"></div>
      <input id="apImgFile" type="file" accept="image/*">
      <label>Number (chhota number pehle dikhega)</label><input data-f="sort_order" type="number" value="${esc(b.sort_order == null ? 10 : b.sort_order)}">
      <label style="display:flex;gap:8px;align-items:center"><input data-f="is_active" type="checkbox" style="width:auto"${b.is_active === false ? "" : " checked"}> Home page par dikhao</label>`;
    const el = overlay(b.id ? "Edit Banner" : "New Banner", html, async (root) => {
      if (!(await isAdmin())) { alert("Admin login karo."); return false; }
      const g = k => root.querySelector(`[data-f="${k}"]`);
      const t = $("apLt").value, v = ($("apLvIn") && $("apLvIn").value || "").trim();
      let link = "#shop";
      if (t === "cat" && v) link = "cat:" + v; else if (t === "product" && v) link = "product:" + v;
      else if (t === "url") { if (!/^https?:\/\//i.test(v)) { alert("Link https:// se shuru hona chahiye."); return false; } link = v; }
      if (!g("title").value.trim() && !imgUrl && !root.querySelector("#apImgFile").files[0]) { alert("Heading ya photo daalo."); return false; }
      try {
        const f = root.querySelector("#apImgFile").files[0];
        if (f) imgUrl = await uploadFile(f, "banners");
        const row = { tag: g("tag").value.trim(), title: g("title").value.trim(), subtitle: g("subtitle").value.trim(), button_text: g("button_text").value.trim(), button_link: link, bg_color: g("bg_color").value, image_url: imgUrl, sort_order: Number(g("sort_order").value) || 0, is_active: g("is_active").checked };
        const q = b.id ? supabaseClient.from("home_banners").update(row).eq("id", b.id) : supabaseClient.from("home_banners").insert(row);
        const { error } = await q;
        if (error) { alert("Save nahi hua: " + error.message + "\n\n(Pehle supabase_v19.sql Supabase me run karo.)"); return false; }
        toast("Banner save ho gaya!"); try { localStorage.removeItem("aashapura_banners"); } catch (e) {}
        done && done(); return true;
      } catch (e) { alert(e.message || e); return false; }
    }, "Save Banner");
    const lvBox = el.querySelector("#apLv"), ltSel = el.querySelector("#apLt"); ltSel.value = lt;
    const drawLv = () => {
      const t = ltSel.value;
      if (t === "cat") lvBox.innerHTML = `<select id="apLvIn">${cats.map(c => `<option value="${esc(c)}"${c === lv ? " selected" : ""}>${esc(c)}</option>`).join("") || "<option value=''>(koi category nahi)</option>"}</select>`;
      else if (t === "product") lvBox.innerHTML = `<select id="apLvIn">${prods.map(p => `<option value="${esc(p.id)}"${String(p.id) === lv ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select>`;
      else if (t === "url") lvBox.innerHTML = `<input id="apLvIn" type="url" placeholder="https://" value="${esc(lv)}">`;
      else lvBox.innerHTML = "";
    };
    ltSel.onchange = () => { lv = ""; drawLv(); }; drawLv();
    const ib = el.querySelector("#apImg");
    const pi = () => { ib.innerHTML = imgUrl ? `<div class="ap-media"><div class="ap-m"><img src="${esc(imgUrl)}" alt=""><button type="button" class="x">✕</button></div></div>` : ""; const x = ib.querySelector(".x"); if (x) x.onclick = () => { imgUrl = ""; pi(); }; };
    pi();
  }

  async function renderBanners(host) {
    host.innerHTML = "<p>Banners load ho rahe hain…</p>";
    let r = await supabaseClient.from("home_banners").select("*").order("sort_order", { ascending: true });
    if (r.error) { host.innerHTML = `<p style="color:#b42318">Banner table nahi mili: ${esc(r.error.message)}<br>Supabase SQL Editor me <b>supabase_v19.sql</b> run karo.</p>`; return; }
    const rows = r.data || [];
    host.innerHTML = (rows.length ? "" : "<p style='font-size:13px;color:#555'>Abhi koi banner nahi hai — home par purane (default) 3 banners dikhte hain. Naya banner banate hi wo hat jayenge.</p>") +
      rows.map(b => `<div class="ap-card" style="${b.is_active === false ? "opacity:.5" : ""}"><div style="min-width:0"><strong>${esc(b.title || "(photo banner)")}</strong><div style="font-size:12px;color:#666">${esc(b.tag || "")} · #${b.sort_order}${b.is_active === false ? " · hidden" : ""}</div></div>
      <div style="display:flex;gap:6px;flex:none"><button type="button" class="ap-btn" data-be="${esc(b.id)}">Edit</button><button type="button" data-bd="${esc(b.id)}" style="background:#b42318;color:#fff;border:0;border-radius:8px;padding:9px 11px">Delete</button></div></div>`).join("") +
      `<button type="button" class="ap-btn" id="apAddB" style="width:100%;padding:12px;margin-top:6px">➕ Naya Banner</button>`;
    const again = () => renderBanners(host);
    host.querySelectorAll("[data-be]").forEach(x => x.onclick = () => bannerForm(rows.find(b => String(b.id) === x.dataset.be), again));
    host.querySelectorAll("[data-bd]").forEach(x => x.onclick = async () => {
      if (!(await confirm("Ye banner hatao?"))) return;
      const { error } = await supabaseClient.from("home_banners").delete().eq("id", x.dataset.bd);
      if (error) { toast("Delete nahi hua: " + error.message, "error"); return; }
      try { localStorage.removeItem("aashapura_banners"); } catch (e) {} again();
    });
    host.querySelector("#apAddB").onclick = () => bannerForm({ sort_order: (rows.length ? Math.max(...rows.map(b => b.sort_order || 0)) : 0) + 10 }, again);
  }

  /* ================= CATEGORY PHOTOS ================= */
  async function renderCatImgs(host) {
    host.innerHTML = "<p>Load ho raha hai…</p>";
    const r = await supabaseClient.from("category_images").select("*");
    if (r.error) { host.innerHTML = `<p style="color:#b42318">Table nahi mili: ${esc(r.error.message)}<br>Supabase SQL Editor me <b>supabase_v20.sql</b> run karo.</p>`; return; }
    const map = {}; (r.data || []).forEach(x => { map[String(x.category).toLowerCase()] = x.image_url; });
    const cats = ["all", ...new Set((window.__apProducts || []).map(p => String(p.category || "").trim().toLowerCase()).filter(Boolean))];
    const clear = () => { try { localStorage.removeItem("aashapura_catimgs"); } catch (e) {} };
    host.innerHTML = cats.map(c => `<div class="ap-card"><div style="display:flex;gap:10px;align-items:center;min-width:0"><div style="width:52px;height:52px;border-radius:50%;overflow:hidden;background:#e8efe3;flex:none;display:flex;align-items:center;justify-content:center">${map[c] ? `<img src="${esc(map[c])}" style="width:100%;height:100%;object-fit:cover" alt="">` : "🌿"}</div><strong style="text-transform:capitalize">${esc(c)}</strong></div>
      <div style="display:flex;gap:6px;flex:none"><label class="ap-btn" style="margin:0;font-size:13px;color:#173d2e">${map[c] ? "Change" : "Photo"}<input type="file" accept="image/*" data-cf="${esc(c)}" style="display:none"></label>${map[c] ? `<button type="button" class="ap-btn" data-cx="${esc(c)}">✕</button>` : ""}</div></div>`).join("");
    host.querySelectorAll("[data-cf]").forEach(inp => inp.onchange = async () => {
      const f = inp.files[0]; if (!f) return;
      if (!(await isAdmin())) { alert("Admin login karo."); return; }
      try {
        toast("Photo upload ho rahi hai…");
        const url = await uploadFile(f, "categories");
        const { error } = await supabaseClient.from("category_images").upsert({ category: inp.dataset.cf, image_url: url, updated_at: new Date().toISOString() });
        if (error) { alert("Save nahi hua: " + error.message + "\n\n(Pehle supabase_v20.sql run karo.)"); return; }
        clear(); toast("Category photo save ho gayi!"); renderCatImgs(host);
      } catch (e) { alert(e.message || e); }
    });
    host.querySelectorAll("[data-cx]").forEach(b => b.onclick = async () => {
      if (!(await confirm("Is category ki photo hatao?"))) return;
      const { error } = await supabaseClient.from("category_images").delete().eq("category", b.dataset.cx);
      if (error) { toast("Nahi hua: " + error.message, "error"); return; }
      clear(); renderCatImgs(host);
    });
  }

  /* ---- mount sections into admin panel ---- */
  let mounted = false;
  async function mount() {
    if (!$("adminProductList") || mounted) return;
    mounted = true;
    const refresh = async () => {
      if (!(await isAdmin())) return;
      try { const { data } = await supabaseClient.from("products").select("id,name,category"); window.__apProducts = data || []; } catch (e) { window.__apProducts = []; }
      renderBanners($("apBanners")); renderCatImgs($("apCatImgs"));
    };
    window.__apRefreshBanners = refresh;
    refresh();
  }
  const box = $("adminProductBox");
  if (box) {
    new MutationObserver(() => { if (box.style.display !== "none") mount(); }).observe(box, { attributes: true, attributeFilter: ["style"] });
    if (box.style.display !== "none") mount();
  }
})();
