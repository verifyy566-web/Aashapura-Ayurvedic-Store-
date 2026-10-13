/* Admin gate: no more typing ?page=admin.
   - Sign In button opens a sheet: "Continue with Google" (customers) + "Admin login" (email + password).
   - Admin account (AASHAPURA_ADMIN_UID) -> admin panel opens automatically.
   - Any other account -> normal customer store only. ?page=admin by a non-admin is bounced to the store.
   NOTE: real security is Supabase RLS (admin policies by UID); this only controls what is shown. */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const ADMIN = typeof AASHAPURA_ADMIN_UID !== "undefined" ? AASHAPURA_ADMIN_UID : "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3";
  const isRoute = new URLSearchParams(location.search).get("page") === "admin";
  const FLAG = "aashapura_store_view";
  const goAdmin = () => { try { sessionStorage.removeItem(FLAG); } catch (e) {} location.replace(location.pathname + "?page=admin"); };
  const goStore = () => { location.replace(location.pathname); };

  const css = document.createElement("style");
  css.textContent = `
  .ag-back{position:fixed;inset:0;z-index:100050;background:rgba(10,25,18,.55);display:flex;align-items:flex-end;justify-content:center}
  .ag-sheet{width:100%;max-width:480px;background:#fff;border-radius:22px 22px 0 0;padding:22px 20px calc(22px + env(safe-area-inset-bottom,0px));box-sizing:border-box;color:#14301f;animation:agu .22s ease-out}
  @keyframes agu{from{transform:translateY(40px);opacity:0}}
  .ag-sheet h3{margin:0 0 4px;font-size:21px}.ag-sheet p{margin:0 0 16px;color:#5d7266;font-size:14px}
  .ag-sheet button{width:100%;box-sizing:border-box;border-radius:14px;font:inherit;font-weight:700;padding:14px;cursor:pointer}
  .ag-g{border:1px solid #cdd8cf;background:#fff;color:#14301f}
  .ag-p{border:0;background:#14402b;color:#fff;margin-top:8px}
  .ag-or{text-align:center;color:#8a9a90;font-size:13px;margin:14px 0 4px}
  .ag-lk{border:0!important;background:none!important;color:#14402b;text-decoration:underline;padding:8px!important;font-weight:600!important}
  .ag-sheet input{width:100%;box-sizing:border-box;padding:13px;margin-top:8px;border:1px solid #cdd8cf;border-radius:12px;font:inherit}
  .ag-err{color:#b42318;font-size:14px;font-weight:600;min-height:4px;margin-top:8px}
  .ag-pill{position:fixed;left:12px;bottom:86px;z-index:9000;border:0;border-radius:999px;background:#14402b;color:#fff;font:inherit;font-weight:700;font-size:14px;padding:10px 16px;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer}`;
  document.head.appendChild(css);

  function openSheet() {
    if (document.querySelector(".ag-back")) return;
    const bk = document.createElement("div"); bk.className = "ag-back";
    bk.innerHTML = `<div class="ag-sheet">
      <h3>${L("Sign in", "साइन इन")}</h3><p>${L("Continue to your account", "अपने अकाउंट में जाएँ")}</p>
      <button type="button" class="ag-g" id="agGoogle">🔐 ${L("Continue with Google", "Google से जारी रखें")}</button>
      <div class="ag-or">${L("or", "या")}</div>
      <button type="button" class="ag-lk" id="agAdminLink">${L("Admin login (email & password)", "एडमिन लॉगिन (ईमेल और पासवर्ड)")}</button>
      <div id="agAdminBox" hidden>
        <input id="agEmail" type="email" placeholder="Admin email" autocomplete="username">
        <input id="agPass" type="password" placeholder="Password" autocomplete="current-password">
        <div class="ag-err" id="agErr"></div>
        <button type="button" class="ag-p" id="agLogin">${L("Login", "लॉगिन")}</button>
      </div>
      <button type="button" class="ag-lk" id="agClose" style="margin-top:6px">${L("Cancel", "रद्द करें")}</button>
    </div>`;
    document.body.appendChild(bk);
    const $ = id => bk.querySelector("#" + id), close = () => bk.remove();
    bk.onclick = e => { if (e.target === bk) close(); };
    $("agClose").onclick = close;
    $("agGoogle").onclick = () => { close(); if (window.aashapuraGoogleLogin) window.aashapuraGoogleLogin(); };
    $("agAdminLink").onclick = () => { $("agAdminBox").hidden = !$("agAdminBox").hidden; if (!$("agAdminBox").hidden) $("agEmail").focus(); };
    const err = m => { $("agErr").textContent = m || ""; };
    const login = async () => {
      const email = $("agEmail").value.trim(), password = $("agPass").value;
      if (!email || !password) return err(L("Enter email and password.", "ईमेल और पासवर्ड भरें।"));
      const b = $("agLogin"); b.disabled = true; b.textContent = "…"; err("");
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) { err(L("Login failed: ", "लॉगिन नहीं हुआ: ") + error.message); return; }
        if (data.user && data.user.id === ADMIN) { goAdmin(); return; }
        close(); location.replace(location.pathname);      /* any other account = customer store only */
      } catch (e) { err(String(e && e.message || e)); }
      finally { b.disabled = false; b.textContent = L("Login", "लॉगिन"); }
    };
    $("agLogin").onclick = login;
    bk.addEventListener("keydown", e => { if (e.key === "Enter" && !$("agAdminBox").hidden) login(); });
  }

  /* all "Sign In" entry points -> the sheet (Google still reachable from it) */
  if (typeof window.startGoogleLogin === "function") window.aashapuraGoogleLogin = window.startGoogleLogin;
  window.startGoogleLogin = openSheet;
  const btn = document.getElementById("googleLoginBtn");
  if (btn) btn.addEventListener("click", e => { e.stopImmediatePropagation(); e.preventDefault(); openSheet(); }, true);

  /* hide the admin panel until we know the visitor is the admin */
  if (isRoute) { const s = document.createElement("style"); s.id = "agHide"; s.textContent = "#adminPanel{visibility:hidden}"; document.head.appendChild(s); }

  function pill() {
    if (document.querySelector(".ag-pill")) return;
    const p = document.createElement("button"); p.type = "button"; p.className = "ag-pill"; p.textContent = "⚙ " + L("Admin Panel", "एडमिन पैनल");
    p.onclick = goAdmin; document.body.appendChild(p);
  }

  (async () => {
    let u = null;
    try { u = (await supabaseClient.auth.getSession()).data.session?.user || null; } catch (e) {}
    const isAdm = !!u && u.id === ADMIN;
    if (isRoute) {
      if (!isAdm) { goStore(); return; }
      const h = document.getElementById("agHide"); if (h) h.remove();
      return;
    }
    if (isAdm) {
      let v = null; try { v = sessionStorage.getItem(FLAG); } catch (e) {}
      if (!v) { goAdmin(); return; }
      pill();
    }
  })();
  window.aashapuraGate = { goAdmin, goStore };
})();
