/* Admin gate: no more typing ?page=admin.
   - Sign In button opens a full-screen page: "Continue with Google" + "Enter your email" (-> password step, or email link). No visible "admin" wording.
   - Admin account (AASHAPURA_ADMIN_UID) -> admin panel opens automatically, ONLY if the session was created with the password (never via email code / link / Google).
   - Any other account -> normal customer store only. ?page=admin by a non-admin is bounced to the store.
   NOTE: real security is Supabase RLS (admin policies by UID); this only controls what is shown. */
(function () {
  const L = (en, hi) => (window.AASHAPURA_LANG === "hi" ? hi : en);
  const ADMIN = typeof AASHAPURA_ADMIN_UID !== "undefined" ? AASHAPURA_ADMIN_UID : "6eeb63cc-1cec-4ac5-bc4b-12a0e6f951c3";
  const isRoute = new URLSearchParams(location.search).get("page") === "admin";
  const FLAG = "aashapura_store_view";
  /* "link" = email contains a sign-in link (works with Supabase default email, no SMTP needed).
     "code" = 6-digit code (needs custom SMTP so the email template can contain {{ .Token }}). */
  const EMAIL_MODE = "link";
  const goAdmin = () => { try { sessionStorage.removeItem(FLAG); } catch (e) {} location.replace(location.pathname + "?page=admin"); };
  const goStore = () => { location.replace(location.pathname); };

  const G_LOGO = `<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>`;
  const css = document.createElement("style");
  css.textContent = `
  .ag-pg{position:fixed;inset:0;z-index:100050;background:#f8f7f4;color:#14301f;display:flex;flex-direction:column;align-items:center;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(18px + env(safe-area-inset-top,0px)) 22px calc(24px + env(safe-area-inset-bottom,0px));box-sizing:border-box}
  .ag-x{align-self:flex-start;border:0;background:none;font-size:28px;line-height:1;color:#14301f;cursor:pointer;padding:4px 8px 4px 0}
  .ag-in{width:100%;max-width:420px;margin:auto 0;display:flex;flex-direction:column;align-items:stretch}
  .ag-logo{text-align:center;margin-bottom:6px}.ag-logo span{font-size:30px}.ag-logo b{display:block;font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#14402b;margin-top:2px}
  .ag-logo small{letter-spacing:.35em;font-size:12px;color:#5d7266;font-weight:700}
  .ag-tag{text-align:center;color:#5d7266;margin:10px 0 36px;font-size:15px}
  .ag-gb{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;box-sizing:border-box;border:0;border-radius:12px;background:#111;color:#fff;font:inherit;font-weight:600;font-size:16px;padding:15px;cursor:pointer}
  .ag-or{display:flex;align-items:center;gap:12px;color:#6b7b72;font-size:13px;margin:16px 0}.ag-or:before,.ag-or:after{content:"";flex:1;height:1px;background:#d5dbd4}
  .ag-fld{position:relative;display:flex;align-items:center;border:1.5px solid #c9d3c7;border-radius:12px;background:#fff;transition:border-color .15s}
  .ag-fld:focus-within{border-color:#14402b}
  .ag-fld input{flex:1;min-width:0;border:0;outline:0;background:none;font:inherit;font-size:16px;padding:15px 14px;text-align:center;color:#14301f}
  .ag-fld .go{flex:none;width:38px;height:38px;margin-right:6px;border:0;border-radius:9px;background:#111;color:#fff;font-size:18px;cursor:pointer;display:none}
  .ag-fld.has .go{display:block}.ag-fld.has input{text-align:left}
  .ag-note{text-align:center;color:#5d7266;font-size:12.5px;line-height:1.5;margin-top:16px}
  .ag-em{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;color:#14301f;font-weight:600;word-break:break-all}
  .ag-em button{border:0;background:none;color:#14402b;text-decoration:underline;font:inherit;font-size:14px;cursor:pointer}
  .ag-lk{border:0;background:none;color:#14402b;text-decoration:underline;font:inherit;font-size:14px;cursor:pointer;margin-top:14px;align-self:center;padding:6px}
  .ag-ok{text-align:center;color:#166534;font-weight:600;font-size:14.5px;margin-top:14px;line-height:1.5}
  .ag-toast{position:fixed;left:50%;top:calc(72px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:100060;background:#fff;border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.18);padding:12px 14px;display:flex;align-items:center;gap:10px;font-size:14px;max-width:calc(100vw - 32px);width:max-content}
  .ag-pill{position:fixed;left:12px;bottom:calc(150px + env(safe-area-inset-bottom,0px));z-index:9000;border:0;border-radius:999px;background:#14402b;color:#fff;font:inherit;font-weight:700;font-size:14px;padding:10px 16px;box-shadow:0 4px 14px rgba(0,0,0,.25);cursor:pointer}`;
  document.head.appendChild(css);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function openSheet() {
    if (document.querySelector(".ag-pg")) return;
    const pg = document.createElement("div"); pg.className = "ag-pg";
    document.body.appendChild(pg);
    let email = "", tmr = null;
    const close = () => { pg.remove(); const t = document.querySelector(".ag-toast"); if (t) t.remove(); };
    const toast = m => {
      let t = document.querySelector(".ag-toast"); if (t) t.remove();
      t = document.createElement("div"); t.className = "ag-toast"; t.innerHTML = `<span>⚠️</span><span></span>`; t.lastChild.textContent = m;
      document.body.appendChild(t); clearTimeout(tmr); tmr = setTimeout(() => t.remove(), 3500);
    };
    const head = `<button type="button" class="ag-x" id="agX" aria-label="Close">←</button>`;
    const logo = `<div class="ag-logo"><span>🌿</span><b>Aashapura</b><small>AYURVEDA</small></div><p class="ag-tag">${L("Natural care • Easy ordering", "प्राकृतिक देखभाल • आसान ऑर्डर")}</p>`;
    const note = `<p class="ag-note">${L("By continuing, you agree to Aashapura Ayurveda's terms of use.", "जारी रखकर आप आशापुरा आयुर्वेद की शर्तों से सहमत होते हैं।")}</p>`;
    const wire = (fld, fn) => { const i = fld.querySelector("input"), g = fld.querySelector(".go"); i.oninput = () => fld.classList.toggle("has", !!i.value); g.onclick = fn; i.onkeydown = e => { if (e.key === "Enter") fn(); }; };

    const step1 = () => {
      pg.innerHTML = head + `<div class="ag-in">${logo}
        <button type="button" class="ag-gb" id="agG">${G_LOGO}<span>${L("Continue with Google", "Google से जारी रखें")}</span></button>
        <div class="ag-or">${L("OR", "या")}</div>
        <div class="ag-fld"><input id="agE" type="email" inputmode="email" placeholder="${L("Enter your email", "अपना ईमेल लिखें")}" autocapitalize="none" autocomplete="username" value="${email.replace(/"/g, "")}"><button type="button" class="go" aria-label="Next">→</button></div>
        ${note}</div>`;
      pg.querySelector("#agX").onclick = close;
      pg.querySelector("#agG").onclick = () => { close(); if (window.aashapuraGoogleLogin) window.aashapuraGoogleLogin(); };
      const f = pg.querySelector(".ag-fld"), i = f.querySelector("input"); if (i.value) f.classList.add("has");
      wire(f, () => { const v = i.value.trim(); if (!EMAIL_RE.test(v)) return toast(L("Please enter a valid email address", "कृपया सही ईमेल लिखें")); email = v; step2(true); });
    };

    const step2 = (autoSend) => {
      pg.innerHTML = head + `<div class="ag-in">${logo}
        <div class="ag-em"><span></span><button type="button" id="agCh">${L("Change", "बदलें")}</button></div>
        <p class="ag-ok" id="agOk" style="margin:0 0 12px;color:#5d7266;font-weight:500">${EMAIL_MODE === "code" ? L("Enter the 6-digit code we emailed you.", "ईमेल पर आया 6 अंकों का कोड लिखें।") : L("Sending your sign-in link…", "साइन-इन लिंक भेज रहे हैं…")}</p>
        <div class="ag-fld" ${EMAIL_MODE === "code" ? "" : "hidden"}><input id="agC" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="8" placeholder="${L("Enter code", "कोड लिखें")}" autocomplete="one-time-code"><button type="button" class="go" aria-label="Verify">→</button></div>
        <button type="button" class="ag-lk" id="agRe">${EMAIL_MODE === "code" ? L("Resend code", "कोड दोबारा भेजें") : L("Resend link", "लिंक दोबारा भेजें")}</button>
        <button type="button" class="ag-lk" id="agPwT" style="color:#7a8a80;font-size:13px;margin-top:0">${L("Use password", "पासवर्ड से साइन इन")}</button>
        <div class="ag-fld" id="agPf" hidden style="margin-top:6px"><input id="agP" type="password" placeholder="${L("Enter your password", "पासवर्ड लिखें")}" autocomplete="current-password"><button type="button" class="go" aria-label="Sign in">→</button></div>
        ${note}</div>`;
      pg.querySelector(".ag-em span").textContent = email;
      pg.querySelector("#agX").onclick = close;
      pg.querySelector("#agCh").onclick = step1;
      const oops = () => toast(L("Something went wrong. Try again.", "कुछ गड़बड़ हुई। फिर कोशिश करें।"));
      /* send code (new emails get an account once the code is verified) */
      let last = 0;
      const send = async () => {
        if (Date.now() - last < 30000) return toast(L("Please wait 30 seconds before resending.", "दोबारा भेजने से पहले 30 सेकंड रुकें।"));
        last = Date.now();
        try {
          const { error } = await supabaseClient.auth.signInWithOtp({ email, options: EMAIL_MODE === "code" ? { shouldCreateUser: true } : { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } });
          if (error) { last = 0; return toast(L("Could not send the email. Try Google sign-in.", "कोड नहीं भेज पाए। Google से साइन इन करें।")); }
          pg.querySelector("#agOk").textContent = EMAIL_MODE === "code" ? L("We sent a 6-digit code to your email.", "हमने आपके ईमेल पर 6 अंकों का कोड भेजा है।") : L("✅ We sent a sign-in link to your email. Open it on this phone to continue.", "✅ आपके ईमेल पर साइन-इन लिंक भेजा है। जारी रखने के लिए इसी फ़ोन पर खोलें।");
        } catch (e) { last = 0; oops(); }
      };
      if (autoSend) send();
      pg.querySelector("#agRe").onclick = send;
      const cf = pg.querySelector(".ag-fld"), ci = cf.querySelector("input"); if (EMAIL_MODE === "code") ci.focus();
      let vb = false;
      wire(cf, async () => {
        const t = ci.value.trim(); if (vb || !t) return; vb = true;
        try {
          const { data, error } = await supabaseClient.auth.verifyOtp({ email, token: t, type: "email" });
          if (error || !data || !data.user) { toast(L("Incorrect or expired code", "कोड गलत है या समाप्त हो गया")); return; }
          /* Admin can NEVER enter through an email code: password only. */
          if (data.user.id === ADMIN) { try { await supabaseClient.auth.signOut(); } catch (e) {} toast(L("Incorrect or expired code", "कोड गलत है या समाप्त हो गया")); return; }
          close(); location.replace(location.pathname);
        } catch (e) { oops(); }
        finally { vb = false; }
      });
      /* password path (admin) */
      const f = pg.querySelector("#agPf"), i = f.querySelector("input");
      pg.querySelector("#agPwT").onclick = () => { f.hidden = !f.hidden; if (!f.hidden) i.focus(); };
      let busy = false;
      wire(f, async () => {
        if (busy || !i.value) return; busy = true;
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: i.value });
          if (error || !data || !data.user) { toast(L("Email or password is incorrect", "ईमेल या पासवर्ड गलत है")); return; }
          if (data.user.id === ADMIN) { try { sessionStorage.setItem(FLAG, "1"); } catch (e) {} close(); location.replace(location.pathname); return; }   /* store first; Admin Panel button asks the 7-digit code */
          close(); location.replace(location.pathname);     /* any other account = customer store only */
        } catch (e) { oops(); }
        finally { busy = false; }
      });
    };
    step1();
  }

  /* all "Sign In" entry points -> the sheet (Google still reachable from it) */
  if (typeof window.startGoogleLogin === "function") window.aashapuraGoogleLogin = window.startGoogleLogin;
  window.startGoogleLogin = openSheet;
  const btn = document.getElementById("googleLoginBtn");
  if (btn) btn.addEventListener("click", e => { e.stopImmediatePropagation(); e.preventDefault(); openSheet(); }, true);

  /* ---- v71: 7-digit admin code. Asked EVERY time the "Admin Panel" button is tapped. Admin picks the code on first use; only a salted hash is kept on this device. ---- */
  const CK = "aashapura_adm_code", OK = "aashapura_adm_ok", LK = "aashapura_adm_lock", TK = "aashapura_adm_try";
  const ls = { get: k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} }, del: k => { try { localStorage.removeItem(k); } catch (e) {} } };
  const unlocked = () => { try { return Date.now() - Number(sessionStorage.getItem(OK) || 0) < 8 * 36e5; } catch (e) { return false; } };
  const hashOf = async (salt, code) => {
    const t = salt + ":" + code + ":" + ADMIN;
    try { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
    catch (e) { let h = 5381; for (const c of t) h = ((h << 5) + h + c.charCodeAt(0)) | 0; return "f" + h; }
  };
  const cst = document.createElement("style");
  cst.textContent = ".ag-code-pg .ag-fld input{text-align:center;font-size:24px;letter-spacing:.35em}.ag-code-pg .ag-fld input::placeholder{letter-spacing:.2em;font-size:18px}";
  document.head.appendChild(cst);
  function askCode() {
    if (document.querySelector(".ag-code-pg")) return;
    let rec = null; try { rec = JSON.parse(ls.get(CK) || "null"); } catch (e) {}
    let mode = rec && rec.h ? "check" : "set", first = "", forgot = false;
    const pg = document.createElement("div"); pg.className = "ag-pg ag-code-pg"; document.body.appendChild(pg);
    const open = () => { try { sessionStorage.setItem(OK, String(Date.now())); } catch (e) {} pg.remove(); goAdmin(); };
    const draw = note => {
      const T = forgot ? [L("Forgot code?", "कोड भूल गए?"), L("Enter your admin password to set a new code.", "नया कोड बनाने के लिए एडमिन पासवर्ड डालें।")]
        : mode === "check" ? [L("Enter admin code", "एडमिन कोड डालें"), L("Enter your 7-digit code to open the admin panel.", "एडमिन पैनल खोलने के लिए 7 अंकों का कोड डालें।")]
        : mode === "set" ? [L("Create admin code", "एडमिन कोड बनाएँ"), L("Choose a 7-digit code. It will be asked every time you open the admin panel.", "7 अंकों का कोड चुनें। एडमिन पैनल खोलते समय हर बार यही पूछा जाएगा।")]
        : [L("Confirm code", "कोड दोबारा डालें"), L("Type the same 7-digit code again.", "वही 7 अंकों का कोड फिर से डालें।")];
      pg.innerHTML = `<button type="button" class="ag-x" aria-label="Close">×</button><div class="ag-in"><div class="ag-logo"><span>🔐</span><b>${T[0]}</b></div><p class="ag-tag">${T[1]}</p><div class="ag-fld"><input type="password" autocomplete="off" ${forgot ? `placeholder="${L("Password", "पासवर्ड")}"` : 'inputmode="numeric" maxlength="7" placeholder="• • • • • • •"'}></div><button type="button" class="ag-gb" data-go style="margin-top:16px">${L("Continue", "आगे बढ़ें")}</button>${mode === "check" && !forgot ? `<button type="button" class="ag-lk" data-f>${L("Forgot code?", "कोड भूल गए?")}</button>` : ""}<div class="ag-note" data-m>${note || ""}</div></div>`;
      const inp = pg.querySelector("input"), msg = pg.querySelector("[data-m]"), say = t => { msg.textContent = t; };
      pg.querySelector(".ag-x").onclick = () => pg.remove();
      const f = pg.querySelector("[data-f]"); if (f) f.onclick = () => { forgot = true; draw(); };
      inp.oninput = () => { if (!forgot) inp.value = inp.value.replace(/\D/g, "").slice(0, 7); };
      let busy = false;
      const go = async () => {
        if (busy) return; const v = inp.value; busy = true;
        try {
          if (forgot) {
            if (!v) return;
            const ss = (await supabaseClient.auth.getSession()).data.session, em = ss && ss.user && ss.user.email;
            const r = await supabaseClient.auth.signInWithPassword({ email: em, password: v });
            if (r.error || !r.data || !r.data.user || r.data.user.id !== ADMIN) { say(L("Password is incorrect", "पासवर्ड गलत है")); return; }
            ls.del(CK); ls.del(TK); ls.del(LK); forgot = false; mode = "set"; draw(); return;
          }
          if (!/^\d{7}$/.test(v)) { say(L("Enter all 7 digits", "पूरे 7 अंक डालें")); return; }
          if (mode === "set") { if (/^(\d)\1{6}$/.test(v)) { say(L("Choose a harder code (not all same digits)", "ऐसा कोड चुनें जिसमें सारे अंक एक जैसे न हों")); return; } first = v; mode = "again"; draw(); return; }
          if (mode === "again") {
            if (v !== first) { mode = "set"; first = ""; draw(L("Codes did not match. Start again.", "कोड मेल नहीं खाए। फिर से बनाएँ।")); return; }
            const salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
            ls.set(CK, JSON.stringify({ s: salt, h: await hashOf(salt, v) })); open(); return;
          }
          const lock = Number(ls.get(LK) || 0);
          if (Date.now() < lock) { say(L("Too many wrong tries. Try again in ", "बहुत गलत कोशिशें। दोबारा कोशिश करें: ") + Math.ceil((lock - Date.now()) / 60000) + L(" min", " मिनट बाद")); return; }
          if (await hashOf(rec.s, v) === rec.h) { ls.del(TK); open(); return; }
          const n = Number(ls.get(TK) || 0) + 1;
          if (n >= 5) { ls.set(LK, String(Date.now() + 10 * 6e4)); ls.del(TK); say(L("Too many wrong tries. Locked for 10 minutes.", "बहुत गलत कोशिशें। 10 मिनट के लिए बंद।")); }
          else { ls.set(TK, String(n)); say(L("Wrong code. Tries left: ", "कोड गलत है। बचे मौके: ") + (5 - n)); }
          inp.value = "";
        } catch (e) { say(L("Something went wrong. Try again.", "कुछ गड़बड़ हुई। फिर कोशिश करें।")); }
        finally { busy = false; }
      };
      pg.querySelector("[data-go]").onclick = go; inp.onkeydown = e => { if (e.key === "Enter") go(); };
      setTimeout(() => { try { inp.focus(); } catch (e) {} }, 50);
    };
    draw();
  }

  /* hide the admin panel until we know the visitor is the admin */
  if (isRoute) { const s = document.createElement("style"); s.id = "agHide"; s.textContent = "#adminPanel{visibility:hidden}"; document.head.appendChild(s); }

  function pill() {
    try { sessionStorage.removeItem(OK); } catch (e) {}      /* back in the store = admin must enter the code again */
    if (document.querySelector(".ag-pill")) return;
    const p = document.createElement("button"); p.type = "button"; p.className = "ag-pill"; p.textContent = "⚙ " + L("Admin Panel", "एडमिन पैनल");
    p.onclick = askCode; document.body.appendChild(p);
  }

  /* JWT "amr" lists how the session was created; admin is accepted only when it includes "password" */
  const viaPassword = session => {
    try {
      const p = JSON.parse(atob(session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return (p.amr || []).some(a => (a && a.method ? a.method : a) === "password");
    } catch (e) { return false; }
  };
  (async () => {
    let u = null, ses = null;
    try { ses = (await supabaseClient.auth.getSession()).data.session; u = ses?.user || null; } catch (e) {}
    if (u && u.id === ADMIN && !viaPassword(ses)) {      /* admin session from Google / email link / code = not allowed */
      try { await supabaseClient.auth.signOut(); } catch (e) {}
      u = null;
    }
    const isAdm = !!u && u.id === ADMIN;
    if (isRoute) {
      if (!isAdm) { goStore(); return; }
      if (!unlocked()) { try { sessionStorage.setItem(FLAG, "1"); } catch (e) {} goStore(); return; }   /* direct ?page=admin without the code -> store */
      const h = document.getElementById("agHide"); if (h) h.remove();
      return;
    }
    if (isAdm) {
      let v = null; try { v = sessionStorage.getItem(FLAG); } catch (e) {}
      if (!v) { try { sessionStorage.setItem(FLAG, "1"); } catch (e) {} }
      pill();
    }
  })();
  window.aashapuraGate = { goAdmin, goStore };
})();
