/* Photo/video picker + upload (Supabase Storage bucket: store-media) + lightbox. Used by reviews and returns. */
(function () {
  const T = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const BUCKET = "store-media", MAX_VIDEO = 20 * 1024 * 1024;
  const toast = (m, t) => { try { showStoreToast(m, t || "error"); } catch (e) { alert(m); } };
  const st = document.createElement("style");
  st.textContent = `.md-box{margin:8px 0}.md-add{display:inline-block;padding:10px 14px;border:1px dashed var(--green2);border-radius:10px;color:var(--green2);font-weight:600;font-size:14px;background:#fff}
  .md-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.md-th{position:relative;width:72px;height:72px;border-radius:10px;overflow:hidden;background:#eee;border:1px solid #ddd}
  .md-th img,.md-th video{width:100%;height:100%;object-fit:cover;display:block}.md-th b{position:absolute;top:2px;right:2px;width:22px;height:22px;border-radius:50%;background:rgba(0,0,0,.65);color:#fff;text-align:center;line-height:22px;font-size:13px}
  .md-th i{position:absolute;left:4px;bottom:2px;color:#fff;font-style:normal;font-size:16px;text-shadow:0 0 3px #000}
  .md-lb{position:fixed;inset:0;z-index:100100;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:12px}
  .md-lb img,.md-lb video{max-width:100%;max-height:92vh;border-radius:8px}`;
  document.head.appendChild(st);

  const isVid = f => (f.type || "").startsWith("video/");
  async function shrink(file) {
    if (isVid(file) || file.type === "image/gif") return file;
    try {
      const bmp = await createImageBitmap(file);
      const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
      const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.8));
      return blob && blob.size < file.size ? new File([blob], "p.jpg", { type: "image/jpeg" }) : file;
    } catch (e) { return file; }
  }

  function open(url, type) {
    const lb = document.createElement("div"); lb.className = "md-lb";
    lb.innerHTML = type === "video" ? `<video src="${url}" controls autoplay playsinline></video>` : `<img src="${url}" alt="">`;
    lb.onclick = e => { if (e.target === lb) lb.remove(); };
    document.body.appendChild(lb);
  }
  const thumbs = list => (list || []).map(m => `<div class="md-th" data-md-url="${encodeURI(m.url)}" data-md-type="${m.type === "video" ? "video" : "image"}">${m.type === "video" ? `<video src="${encodeURI(m.url)}#t=0.1" preload="metadata" muted></video><i>▶</i>` : `<img src="${encodeURI(m.url)}" loading="lazy" alt="">`}</div>`).join("");
  document.addEventListener("click", e => { const t = e.target.closest("[data-md-url]"); if (t) open(decodeURI(t.dataset.mdUrl), t.dataset.mdType); });

  /* picker(host, {max, video, existing}) -> { files(), existing(), reset() } */
  function picker(host, o) {
    const max = o.max || 4, allowVideo = o.video !== false;
    let files = [], keep = (o.existing || []).slice();
    host.innerHTML = `<div class="md-box"><label class="md-add">📷 ${allowVideo ? T("Add photo / video", "फोटो / वीडियो जोड़ें") : T("Add photo", "फोटो जोड़ें")}<input type="file" accept="image/*${allowVideo ? ",video/*" : ""}" multiple hidden></label><div class="md-row"></div></div>`;
    const inp = host.querySelector("input"), row = host.querySelector(".md-row");
    const paint = () => {
      row.innerHTML = "";
      keep.forEach((m, i) => row.appendChild(cell(m.type, m.url, () => { keep.splice(i, 1); paint(); })));
      files.forEach((f, i) => row.appendChild(cell(isVid(f) ? "video" : "image", URL.createObjectURL(f), () => { files.splice(i, 1); paint(); })));
    };
    const cell = (type, url, rm) => {
      const d = document.createElement("div"); d.className = "md-th";
      d.innerHTML = (type === "video" ? `<video src="${url}#t=0.1" preload="metadata" muted></video><i>▶</i>` : `<img src="${url}" alt="">`) + "<b>✕</b>";
      d.querySelector("b").onclick = rm; return d;
    };
    inp.onchange = () => {
      [...inp.files].forEach(f => {
        if (keep.length + files.length >= max) return toast(T(`Maximum ${max} files.`, `ज़्यादा से ज़्यादा ${max} फाइलें।`));
        if (isVid(f) && f.size > MAX_VIDEO) return toast(T("Video must be under 20 MB.", "वीडियो 20 MB से छोटा होना चाहिए।"));
        if (!isVid(f) && !(f.type || "").startsWith("image/")) return;
        files.push(f);
      });
      inp.value = ""; paint();
    };
    paint();
    return { files: () => files, existing: () => keep, reset() { files = []; keep = []; paint(); } };
  }

  async function upload(files, folder) {
    const u = signedInUser; if (!u) throw new Error("Sign in first");
    const out = [];
    for (const f0 of files) {
      const f = await shrink(f0);
      const ext = (f.type.split("/")[1] || "bin").replace("quicktime", "mov").replace("jpeg", "jpg");
      const path = `${u.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabaseClient.storage.from(BUCKET).upload(path, f, { contentType: f.type, upsert: false });
      if (error) throw error;
      out.push({ url: supabaseClient.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, type: isVid(f) ? "video" : "image" });
    }
    return out;
  }
  window.AashapuraMedia = { picker, upload, thumbs, open };
})();
