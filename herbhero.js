/* Aashapura background (v8): ONE fixed 3D-style animated background for the whole store - slowly tumbling herb leaves,
   soft petals and golden pollen with depth + scroll parallax. No themes, no seasons, no admin settings.
   Pure canvas (no library, works offline). Light on phones: fewer items, 30 fps, pauses in background tab,
   static picture if "reduce motion" is on. Never breaks the store. */
(function () {
  try {
    if (window.aashapuraBg) return;
    window.aashapuraBg = true;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var cv = document.createElement("canvas");
    cv.className = "herb-bg";
    cv.setAttribute("aria-hidden", "true");
    document.body.insertBefore(cv, document.body.firstChild);
    var ctx = cv.getContext("2d");
    if (!ctx) return;

    var W = 0, H = 0, DPR = 1, items = [], dust = [], t = 0, last = 0, lastW = 0;
    var LIGHT = (function () { var x = -0.4, y = -0.6, z = 0.7, l = Math.sqrt(x * x + y * y + z * z); return [x / l, y / l, z / l]; })();
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var lean = function () { return innerWidth < 700 || (navigator.hardwareConcurrency || 4) <= 3; };

    /* leaf / petal outlines (unit size, base at y=-0.5, tip at y=+0.5) */
    function outline(widthAt, N) {
      var pts = [], i, tt, w;
      for (i = 0; i <= N; i++) { tt = i / N; w = widthAt(tt); pts.push([-w, tt - 0.5]); }
      for (i = N; i >= 0; i--) { tt = i / N; w = widthAt(tt); pts.push([w, tt - 0.5]); }
      return pts;
    }
    var SHAPE = {
      leaf: outline(function (u) { return Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.9) * 0.30 * (1 - 0.25 * u); }, 9),
      petal: outline(function (u) { return Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 0.7) * 0.40; }, 9)
    };
    var PAL = {
      leaf1: [[30, 98, 60], [98, 172, 114]],
      leaf2: [[78, 112, 46], [172, 202, 112]],
      petal: [[216, 128, 152], [252, 224, 230]]
    };

    function size() {
      W = innerWidth; H = innerHeight;
      DPR = Math.min(window.devicePixelRatio || 1, W < 700 ? 1.5 : 2);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function make(kind) {
      var z = Math.random(), pal = kind === "petal" ? PAL.petal : (Math.random() < 0.7 ? PAL.leaf1 : PAL.leaf2);
      var base = kind === "petal" ? rnd(34, 58) : rnd(48, 96);
      return {
        kind: kind, pal: pal, z: z,
        s: base * (1.2 - 0.7 * z) * (lean() ? 0.85 : 1),
        x: rnd(0, W), y: rnd(0, H),
        rx: rnd(0, 6.28), ry: rnd(0, 6.28), rz: rnd(0, 6.28),
        wx: rnd(-0.7, 0.7), wy: rnd(-0.9, 0.9), wz: rnd(-0.4, 0.4),
        vy: rnd(9, 24) * (1.2 - 0.6 * z),
        amp: rnd(16, 46), fr: rnd(0.25, 0.7), ph: rnd(0, 6.28),
        curl: rnd(0.2, 0.55), par: 0.03 + 0.12 * (1 - z)
      };
    }

    function build() {
      var l = lean(), nl = l ? 16 : 30, np = l ? 6 : 10, nd = l ? 26 : 50, i;
      items = []; dust = [];
      for (i = 0; i < nl; i++) items.push(make("leaf"));
      for (i = 0; i < np; i++) items.push(make("petal"));
      items.sort(function (a, b) { return b.z - a.z; }); /* far first */
      for (i = 0; i < nd; i++) dust.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.8, 2.4), vy: rnd(5, 16), ph: rnd(0, 6.28), sp: rnd(0.6, 1.6) });
    }

    function mix(p, k) { return "rgb(" + Math.round(p[0][0] + (p[1][0] - p[0][0]) * k) + "," + Math.round(p[0][1] + (p[1][1] - p[0][1]) * k) + "," + Math.round(p[0][2] + (p[1][2] - p[0][2]) * k) + ")"; }

    function step(dt) {
      var i, o, d;
      for (i = 0; i < items.length; i++) {
        o = items[i];
        o.y += o.vy * dt;
        o.rx += o.wx * dt; o.ry += o.wy * dt; o.rz += o.wz * dt;
        if (o.y > H + o.s * 1.5) { o.y = -o.s * 1.5; o.x = rnd(0, W); }
      }
      for (i = 0; i < dust.length; i++) {
        d = dust[i]; d.y -= d.vy * dt;
        if (d.y < -10) { d.y = H + 10; d.x = rnd(0, W); }
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var sy = window.pageYOffset || 0, i, j, o, d, span, X, Y, pts, p, c1, c2, c3, s1, s2, s3, x, y, zz, nx, ny, nz, lam, a, tw;
      for (i = 0; i < items.length; i++) {
        o = items[i];
        span = H + o.s * 3;
        Y = ((((o.y - sy * o.par) % span) + span) % span) - o.s * 1.5;
        X = o.x + Math.sin(t * o.fr + o.ph) * o.amp;
        c1 = Math.cos(o.rz); s1 = Math.sin(o.rz);
        c2 = Math.cos(o.rx); s2 = Math.sin(o.rx);
        c3 = Math.cos(o.ry); s3 = Math.sin(o.ry);
        nx = c2 * s3; ny = -s2; nz = c2 * c3;
        lam = Math.abs(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
        a = 0.2 + 0.36 * (1 - o.z);
        ctx.beginPath();
        pts = SHAPE[o.kind];
        for (j = 0; j < pts.length; j++) {
          p = pts[j];
          x = p[0] * c1 - p[1] * s1; y = p[0] * s1 + p[1] * c1; zz = o.curl * p[0] * p[0] * (o.kind === "petal" ? 1.6 : 1);
          var y2 = y * c2 - zz * s2, z2 = y * s2 + zz * c2;
          var x3 = x * c3 + z2 * s3;
          if (j === 0) ctx.moveTo(X + x3 * o.s, Y + y2 * o.s); else ctx.lineTo(X + x3 * o.s, Y + y2 * o.s);
        }
        ctx.closePath();
        ctx.globalAlpha = a;
        ctx.fillStyle = mix(o.pal, lam);
        ctx.fill();
        if (o.kind === "leaf" && o.s > 38) { /* midrib */
          var bx = -0.5 * -s1, by = -0.5 * c1, tx = 0.5 * -s1, ty = 0.5 * c1;
          var by2 = by * c2, bx3 = bx * c3, ty2 = ty * c2, tx3 = tx * c3;
          ctx.beginPath(); ctx.moveTo(X + bx3 * o.s, Y + by2 * o.s); ctx.lineTo(X + tx3 * o.s, Y + ty2 * o.s);
          ctx.strokeStyle = "rgb(20,70,42)"; ctx.globalAlpha = a * 0.55; ctx.lineWidth = 0.9; ctx.stroke();
        }
      }
      for (i = 0; i < dust.length; i++) {
        d = dust[i];
        tw = 0.5 + 0.5 * Math.sin(t * d.sp + d.ph);
        ctx.fillStyle = "rgb(232,184,74)";
        ctx.globalAlpha = 0.05 + 0.10 * tw; ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 2.6, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.25 + 0.5 * tw; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame(ts) {
      requestAnimationFrame(frame);
      var gap = (ts - last) / 1000;
      if (gap < (lean() ? 0.031 : 0.015)) return;
      last = ts; gap = Math.min(gap, 0.05); t += gap;
      step(gap); draw();
    }

    size(); lastW = W; build();
    if (reduce) { draw(); } else { requestAnimationFrame(frame); }
    var timer = 0;
    addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var changed = Math.abs(innerWidth - lastW) > 80;
        size(); if (changed) { lastW = W; build(); }
        if (reduce) draw();
      }, 150);
    });
    if (reduce) addEventListener("scroll", function () { draw(); }, { passive: true });
  } catch (e) { /* never break the store */ }
})();
