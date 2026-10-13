/* Reviews & ratings (Supabase table: reviews) */
(function () {
  const ADMIN = "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3";
  let agg = {};
  const stars = n => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
  const grid = $("productGrid");

  async function loadAgg() {
    let { data, error } = await supabaseClient.from("reviews").select("product_id,rating").eq("approved", true);
    if (error) ({ data, error } = await supabaseClient.from("reviews").select("product_id,rating"));
    if (error) { console.warn("reviews:", error.message); return; }
    agg = {};
    (data || []).forEach(r => { const a = agg[r.product_id] || (agg[r.product_id] = { sum: 0, n: 0 }); a.sum += r.rating; a.n++; });
    decorate();
  }

  function decorate() {
    document.querySelectorAll("#productGrid .product-card").forEach(card => {
      const id = card.querySelector("[data-wish]")?.dataset.wish;
      if (!id) return;
      const a = agg[primaryId(id)];
      let el = card.querySelector(".rating-line");
      if (!a) { el?.remove(); return; }
      if (!el) { el = document.createElement("div"); el.className = "rating-line"; card.querySelector(".product-buy").before(el); }
      el.innerHTML = `<span class="stars">${stars(a.sum / a.n)}</span> ${(a.sum / a.n).toFixed(1)} (${a.n})`;
    });
  }
  if (grid) new MutationObserver(decorate).observe(grid, { childList: true });

  new MutationObserver(() => {
    const page = document.getElementById("productFullPage");
    if (page && !page.querySelector(".reviews-box")) mount(page);
  }).observe(document.body, { childList: true });

  async function mount(page) {
    const pid = primaryId(Number(new URL(location.href).searchParams.get("product")));
    if (!pid) return;
    const box = document.createElement("section");
    box.className = "reviews-box";
    page.appendChild(box);
    await render(box, pid);
  }

  async function render(box, pid) {
    box.innerHTML = "<p>रिव्यू लोड हो रहे हैं…</p>";
    let res = await supabaseClient.from("reviews")
      .select("id,user_id,user_name,rating,comment,created_at,media,approved,admin_reply")
      .eq("product_id", pid).order("created_at", { ascending: false });
    if (res.error) res = await supabaseClient.from("reviews")
      .select("id,user_id,user_name,rating,comment,created_at,media")
      .eq("product_id", pid).order("created_at", { ascending: false });
    const { error } = res;
    if (error) { box.innerHTML = `<p class="small-note">रिव्यू लोड नहीं हुए: ${escapeHTML(error.message)}</p>`; return; }
    const all = res.data || [];
    const isOk = r => r.approved !== false;                       // older DB without the column = all visible
    const mine = signedInUser && all.find(r => r.user_id === signedInUser.id);
    const shown = all.filter(r => isOk(r) || (signedInUser && r.user_id === signedInUser.id));
    const okOnly = all.filter(isOk);
    const data = shown;
    const n = okOnly.length, avg = n ? okOnly.reduce((s, r) => s + r.rating, 0) / n : 0;
    let pick = mine ? mine.rating : 0;
    box.innerHTML = `<h3>ग्राहक रिव्यू</h3>
      ${n ? `<p><span class="stars">${stars(avg)}</span> <strong>${avg.toFixed(1)}</strong> / 5 · ${n} रिव्यू</p>` : "<p>अभी कोई रिव्यू नहीं है।</p>"}
      <div class="rv-form">
        <strong>${mine ? "अपना रिव्यू बदलें" : "अपना रिव्यू लिखें"}</strong>
        <div class="rv-pick" id="rvPick">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-s="${i}">★</button>`).join("")}</div>
        <textarea id="rvText" maxlength="500" placeholder="उत्पाद कैसा लगा? (वैकल्पिक)">${escapeHTML(mine?.comment || "")}</textarea>
        <div id="rvMedia"></div>
        <button type="button" id="rvSubmit" class="primary-btn">${signedInUser ? "रिव्यू सबमिट करें" : "रिव्यू लिखने के लिए Sign In करें"}</button>
      </div>
      <div class="rv-list">${data.map(r => `<article class="rv-item">
        <div><strong>${escapeHTML(r.user_name || "ग्राहक")}</strong> <span class="stars">${stars(r.rating)}</span></div>
        ${r.comment ? `<p>${escapeHTML(r.comment)}</p>` : ""}
        ${Array.isArray(r.media) && r.media.length ? `<div class="md-row">${AashapuraMedia.thumbs(r.media)}</div>` : ""}
        <small>${new Date(r.created_at).toLocaleDateString("hi-IN")}</small>
        ${!isOk(r) ? `<div style="margin-top:6px;font-size:12px;font-weight:700;color:#8a5a00;background:#fff4dc;border-radius:8px;padding:5px 9px;display:inline-block">⏳ Approval ke baad sabko dikhega</div>` : ""}
        ${r.admin_reply ? `<div style="margin-top:8px;background:#eef5ea;border-left:3px solid #2f6b3a;border-radius:6px;padding:8px 10px;font-size:14px"><strong style="color:#14402b">Aashapura Ayurveda:</strong> ${escapeHTML(r.admin_reply)}</div>` : ""}
        ${signedInUser && (signedInUser.id === r.user_id || signedInUser.id === ADMIN) ? `<button type="button" class="rv-del" data-del="${r.id}">हटाएँ</button>` : ""}
      </article>`).join("")}</div>`;
    const rt = document.getElementById("ppRate");
    if (rt) rt.innerHTML = n ? `<span class="stars">${stars(avg)}</span> <strong>${avg.toFixed(1)}</strong> <a href="#" onclick="document.querySelector('.reviews-box').scrollIntoView({behavior:'smooth'});return false">(${n} रिव्यू)</a>` : "<small>अभी कोई रिव्यू नहीं</small>";
    const pk = AashapuraMedia.picker(box.querySelector("#rvMedia"), { max: 4, existing: Array.isArray(mine?.media) ? mine.media : [] });
    const paint = () => box.querySelectorAll("#rvPick button").forEach(b => b.classList.toggle("on", Number(b.dataset.s) <= pick));
    paint();
    box.querySelector("#rvPick").onclick = e => { const b = e.target.closest("[data-s]"); if (b) { pick = Number(b.dataset.s); paint(); } };
    box.querySelector("#rvSubmit").onclick = async () => {
      if (!signedInUser) { startGoogleLogin(); return; }
      if (!pick) return showStoreToast("पहले स्टार रेटिंग चुनें।", "error");
      const name = $("profileName")?.value.trim() || signedInUser.user_metadata?.full_name || "ग्राहक";
      const sub = box.querySelector("#rvSubmit"); sub.disabled = true;
      let media = pk.existing();
      try { media = media.concat(await AashapuraMedia.upload(pk.files(), "reviews")); }
      catch (e) { sub.disabled = false; return showStoreToast("Upload failed: " + e.message, "error"); }
      const { error: err } = await supabaseClient.from("reviews").upsert({
        product_id: pid, user_id: signedInUser.id, user_name: name,
        rating: pick, comment: box.querySelector("#rvText").value.trim(), media
      }, { onConflict: "product_id,user_id" });
      sub.disabled = false;
      if (err) return showStoreToast("रिव्यू सेव नहीं हुआ: " + err.message, "error");
      showStoreToast("रिव्यू सेव हो गया। धन्यवाद!", "success");
      await render(box, pid); loadAgg();
    };
    box.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
      if (!(await confirm("यह रिव्यू हटाएँ?"))) return;
      const { error: err } = await supabaseClient.from("reviews").delete().eq("id", b.dataset.del);
      if (err) return showStoreToast("हट नहीं पाया: " + err.message, "error");
      await render(box, pid); loadAgg();
    });
  }
  loadAgg();
})();
