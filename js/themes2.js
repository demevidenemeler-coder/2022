/* Prisma – 25 weitere Designs (eigene Steine, Hintergründe und Brett-Stile) */
(function () {
  'use strict';
  const P = window.PRISMA, B = P.BLOCKS, BG = P.BG;
  const rr = P.rr, star4 = P.star4, rgba = P.rgba, lighten = P.lighten, darken = P.darken, mix = P.mix;
  const { poly, bevel, innerShadow, vgrad, glow, vignette, DARK, LIGHT } = P.kit;
  const TAU = Math.PI * 2;

  /* ---------- Helfer ---------- */
  function lin(ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  }
  // radialer Verlauf um (x,y); optional versetzter Lichtpunkt (fx,fy)
  function rad(ctx, x, y, r, stops, fx, fy) {
    const g = ctx.createRadialGradient(fx == null ? x : fx, fy == null ? y : fy, 0, x, y, r);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    return g;
  }
  function disc(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function shadow(ctx, s, col) { ctx.shadowColor = col || 'rgba(0,0,0,0.42)'; ctx.shadowBlur = s * 0.07; ctx.shadowOffsetY = s * 0.035; }
  // quadratischer Grundkörper mit Schlagschatten
  function body(ctx, s, o) {
    const g = s * (o.g == null ? 0.04 : o.g), w = s - 2 * g, r = s * (o.r == null ? 0.1 : o.r);
    ctx.save();
    shadow(ctx, s, o.sh);
    rr(ctx, g, g, w, w, r);
    ctx.fillStyle = o.stops ? lin(ctx, g, g, o.diag ? g + w : g, g + w, o.stops) : o.fill;
    ctx.fill();
    ctx.restore();
    return { x: g, y: g, w, r };
  }
  // unregelmäßige, leicht eckige Fläche (Aquarellklecks, Kieselstein)
  function blob(ctx, cx, cy, R, sq, jit, rnd, n) {
    const p = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, q = Math.pow(Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))), sq), d = (R / q) * (1 + (rnd() - 0.5) * jit);
      p.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d]);
    }
    ctx.beginPath();
    ctx.moveTo((p[n - 1][0] + p[0][0]) / 2, (p[n - 1][1] + p[0][1]) / 2);
    for (let i = 0; i < n; i++) { const q = p[(i + 1) % n]; ctx.quadraticCurveTo(p[i][0], p[i][1], (p[i][0] + q[0]) / 2, (p[i][1] + q[1]) / 2); }
    ctx.closePath();
  }
  function heart(ctx, cx, cy, h) {
    ctx.beginPath(); ctx.moveTo(cx, cy + h);
    ctx.bezierCurveTo(cx - h * 1.5, cy - h * 0.1, cx - h * 0.7, cy - h * 1.2, cx, cy - h * 0.4);
    ctx.bezierCurveTo(cx + h * 0.7, cy - h * 1.2, cx + h * 1.5, cy - h * 0.1, cx, cy + h);
  }
  function hills(ctx, W, H, rnd, col, base, amp, f) {
    const ph = rnd() * TAU;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, H * (base + Math.sin((x / W) * f + ph) * amp));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }
  function stars(ctx, W, H, rnd, n, hMax) {
    for (let i = 0; i < n; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + rnd() * 0.6) + ')'; ctx.fillRect(rnd() * W, rnd() * H * hMax, 1.3, 1.3); }
  }

  /* =====================================================================
     Steine
     ===================================================================== */
  B.stone = function (ctx, s, c, rnd) {
    const b = mix(c, '#dcb97c', 0.5);
    const { x, y, w, r } = body(ctx, s, { r: 0.09, diag: true, stops: [lighten(b, 0.2), darken(b, 0.14)] });
    const cx = s / 2, cy = s / 2;
    ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
    for (let i = 0; i < 16; i++) { ctx.fillStyle = rgba(i % 2 ? darken(b, 0.5) : lighten(b, 0.5), 0.2); ctx.fillRect(x + rnd() * w, y + rnd() * w, s * 0.025, s * 0.025); }
    ctx.restore();
    bevel(ctx, x, y, w, r, s * 0.05, 'rgba(255,245,215,0.7)', 'rgba(70,40,10,0.5)');
    const k = (rnd() * 5) | 0;
    const glyph = () => {
      ctx.beginPath();
      if (k === 0) { // Auge
        ctx.moveTo(cx - w * 0.25, cy); ctx.quadraticCurveTo(cx, cy - w * 0.22, cx + w * 0.25, cy); ctx.quadraticCurveTo(cx, cy + w * 0.22, cx - w * 0.25, cy);
        ctx.moveTo(cx + w * 0.07, cy); ctx.arc(cx, cy, w * 0.07, 0, TAU);
      } else if (k === 1) { // Ankh
        ctx.arc(cx, cy - w * 0.13, w * 0.09, Math.PI / 2, Math.PI / 2 + TAU); ctx.lineTo(cx, cy + w * 0.26);
        ctx.moveTo(cx - w * 0.15, cy + w * 0.03); ctx.lineTo(cx + w * 0.15, cy + w * 0.03);
      } else if (k === 2) { // Sonne
        ctx.arc(cx, cy, w * 0.1, 0, TAU);
        for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ctx.moveTo(cx + Math.cos(a) * w * 0.17, cy + Math.sin(a) * w * 0.17); ctx.lineTo(cx + Math.cos(a) * w * 0.26, cy + Math.sin(a) * w * 0.26); }
      } else if (k === 3) { // Wasser
        for (let j = -1; j <= 1; j++) { ctx.moveTo(cx - w * 0.25, cy + j * w * 0.13); for (let i = 1; i <= 4; i++) ctx.lineTo(cx - w * 0.25 + i * w * 0.125, cy + j * w * 0.13 - (i % 2) * w * 0.07); }
      } else { // Pyramide
        ctx.moveTo(cx - w * 0.25, cy + w * 0.18); ctx.lineTo(cx, cy - w * 0.22); ctx.lineTo(cx + w * 0.25, cy + w * 0.18); ctx.closePath();
        ctx.moveTo(cx, cy - w * 0.22); ctx.lineTo(cx + w * 0.07, cy + w * 0.18);
      }
      ctx.stroke();
    };
    ctx.lineWidth = s * 0.05; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save(); ctx.translate(s * 0.014, s * 0.014); ctx.strokeStyle = 'rgba(255,246,220,0.65)'; glyph(); ctx.restore();
    ctx.strokeStyle = rgba(darken(b, 0.58), 0.9); glyph();
  };

  B.brick = function (ctx, s, c) {
    const { x, y, w, r } = body(ctx, s, { g: 0.035, r: 0.1, stops: [lighten(c, 0.14), darken(c, 0.1)] });
    bevel(ctx, x, y, w, r, s * 0.04, 'rgba(255,255,255,0.6)', rgba(darken(c, 0.6), 0.6));
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < 2; i++) {
        const px = x + w * (0.28 + i * 0.44), py = y + w * (0.28 + j * 0.44), R = w * 0.15;
        disc(ctx, px + s * 0.02, py + s * 0.03, R * 1.04); ctx.fillStyle = rgba(darken(c, 0.6), 0.5); ctx.fill();
        disc(ctx, px, py, R); ctx.fillStyle = rad(ctx, px, py, R * 1.3, [lighten(c, 0.38), c, darken(c, 0.14)], px - R * 0.4, py - R * 0.4); ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, R * 0.86, Math.PI * 1.05, Math.PI * 1.6);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = s * 0.022; ctx.lineCap = 'round'; ctx.stroke();
      }
  };

  B.lcd = function (ctx, s, c, rnd) {
    const g = Math.round(s * 0.05), u = (s - 2 * g) / 8, lite = '#8bac0f', k = (rnd() * 4) | 0;
    const px = (i, j, wi, hj, col) => {
      ctx.fillStyle = col;
      const x0 = Math.round(g + i * u), y0 = Math.round(g + j * u);
      ctx.fillRect(x0, y0, Math.round(g + (i + wi) * u) - x0, Math.round(g + (j + hj) * u) - y0);
    };
    px(0, 0, 8, 8, '#0f380f'); px(1, 1, 6, 6, c);
    if (k === 0) { px(2, 2, 4, 4, lite); px(3, 3, 2, 2, c); }
    else if (k === 1) { for (let j = 1; j < 7; j++) for (let i = 1; i < 7; i++) if ((i + j) % 2) px(i, j, 1, 1, lite); }
    else if (k === 2) { px(2, 2, 1, 1, lite); px(5, 2, 1, 1, lite); px(2, 5, 1, 1, lite); px(5, 5, 1, 1, lite); px(3, 3, 2, 2, lite); }
    else { for (let i = 1; i < 7; i++) px(i, 7 - i, 1, 1, lite); px(1, 1, 2, 1, lite); px(1, 2, 1, 1, lite); }
  };

  B.knit = function (ctx, s, c) {
    const { x, y, w, r } = body(ctx, s, { g: 0.05, r: 0.17, fill: c });
    ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
    const n = 5, q = w / n;
    ctx.lineCap = 'round'; ctx.lineWidth = q * 0.3;
    for (let j = -1; j <= n; j++)
      for (let i = 0; i < n; i++) {
        const px = x + i * q + q / 2, py = y + j * q + q * 0.5;
        ctx.strokeStyle = lighten(c, 0.24); ctx.beginPath(); ctx.moveTo(px - q * 0.3, py - q * 0.38); ctx.lineTo(px, py + q * 0.38); ctx.stroke();
        ctx.strokeStyle = darken(c, 0.18); ctx.beginPath(); ctx.moveTo(px + q * 0.3, py - q * 0.38); ctx.lineTo(px, py + q * 0.38); ctx.stroke();
      }
    ctx.restore();
    innerShadow(ctx, x, y, w, r, rgba(darken(c, 0.6), 0.5), s * 0.08, -s * 0.03, -s * 0.03);
    ctx.setLineDash([s * 0.05, s * 0.045]);
    rr(ctx, x + s * 0.02, y + s * 0.02, w - s * 0.04, w - s * 0.04, r * 0.85);
    ctx.strokeStyle = rgba(lighten(c, 0.6), 0.8); ctx.lineWidth = s * 0.022; ctx.stroke();
    ctx.setLineDash([]);
  };

  B.comic = function (ctx, s, c) {
    const g = s * 0.07, w = s - 2 * g - s * 0.04, r = s * 0.13, x = g, y = g;
    rr(ctx, x + s * 0.05, y + s * 0.05, w, w, r); ctx.fillStyle = '#111'; ctx.fill();
    rr(ctx, x, y, w, w, r); ctx.fillStyle = c; ctx.fill();
    ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
    ctx.fillStyle = rgba(darken(c, 0.5), 0.5);
    for (let j = 0; j < 6; j++)
      for (let i = 0; i < 6; i++) { const t = (i + j) / 10; if (t < 0.45) continue; disc(ctx, x + ((i + 0.5) * w) / 6, y + ((j + 0.5) * w) / 6, w * 0.07 * t); ctx.fill(); }
    ctx.restore();
    rr(ctx, x, y, w, w, r); ctx.strokeStyle = '#111'; ctx.lineWidth = s * 0.06; ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + w * 0.22, y + w * 0.22); ctx.lineTo(x + w * 0.48, y + w * 0.22); ctx.stroke();
    disc(ctx, x + w * 0.22, y + w * 0.4, s * 0.03); ctx.fillStyle = '#fff'; ctx.fill();
  };

  B.water = function (ctx, s, c, rnd) {
    const cx = s / 2, cy = s / 2;
    [[0.4, lighten(c, 0.25), 0.5], [0.385, c, 0.5], [0.36, darken(c, 0.08), 0.4]].forEach(l => {
      blob(ctx, cx + (rnd() - 0.5) * s * 0.03, cy + (rnd() - 0.5) * s * 0.03, s * l[0], 0.85, 0.12, rnd, 12);
      ctx.fillStyle = rgba(l[1], l[2]); ctx.fill();
    });
    blob(ctx, cx, cy, s * 0.395, 0.85, 0.08, rnd, 12);
    ctx.strokeStyle = rgba(darken(c, 0.35), 0.45); ctx.lineWidth = s * 0.022; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle = rad(ctx, cx - s * 0.12, cy - s * 0.14, s * 0.3, ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']); ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let i = 0; i < 10; i++) ctx.fillRect(s * (0.15 + rnd() * 0.7), s * (0.15 + rnd() * 0.7), s * 0.02, s * 0.02);
    ctx.restore();
  };

  B.choc = function (ctx, s, c) {
    const { x, y, w, r } = body(ctx, s, { g: 0.035, r: 0.09, stops: [lighten(c, 0.1), darken(c, 0.22)] });
    bevel(ctx, x, y, w, r, s * 0.045, rgba(lighten(c, 0.5), 0.6), rgba(darken(c, 0.65), 0.65));
    const i = w * 0.17, ix = x + i, iy = y + i, iw = w - 2 * i, cx = s / 2, cy = s / 2;
    rr(ctx, ix, iy, iw, iw, r * 0.7); ctx.fillStyle = lin(ctx, ix, iy, ix + iw, iy + iw, [lighten(c, 0.24), darken(c, 0.06)]); ctx.fill();
    bevel(ctx, ix, iy, iw, r * 0.7, s * 0.03, rgba(lighten(c, 0.65), 0.75), rgba(darken(c, 0.6), 0.6));
    ctx.save(); rr(ctx, ix, iy, iw, iw, r * 0.7); ctx.clip();
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff';
    poly(ctx, [[ix + iw * 0.5, iy], [ix + iw * 0.75, iy], [ix, iy + iw * 0.75], [ix, iy + iw * 0.5]]); ctx.fill();
    ctx.restore();
    poly(ctx, [[cx, cy - w * 0.11], [cx + w * 0.11, cy], [cx, cy + w * 0.11], [cx - w * 0.11, cy]]);
    ctx.strokeStyle = rgba(darken(c, 0.55), 0.55); ctx.lineWidth = s * 0.024; ctx.lineJoin = 'round'; ctx.stroke();
  };

  B.fruit = function (ctx, s, c) {
    const cx = s / 2, cy = s / 2, R = s * 0.44, cream = '#fff8e3';
    ctx.save(); shadow(ctx, s); disc(ctx, cx, cy, R); ctx.fillStyle = darken(c, 0.1); ctx.fill(); ctx.restore();
    disc(ctx, cx, cy, R * 0.9); ctx.fillStyle = cream; ctx.fill();
    disc(ctx, cx, cy, R * 0.82); ctx.fillStyle = rad(ctx, cx, cy, R * 0.82, [lighten(c, 0.5), lighten(c, 0.12), c]); ctx.fill();
    ctx.strokeStyle = cream; ctx.lineWidth = s * 0.03; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.2; ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R * 0.82, cy + Math.sin(a) * R * 0.82); }
    ctx.stroke();
    ctx.fillStyle = rgba(lighten(c, 0.7), 0.75);
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * TAU + 0.2;
      ctx.save(); ctx.translate(cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5); ctx.rotate(a);
      ctx.beginPath(); ctx.ellipse(0, 0, R * 0.12, R * 0.045, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    disc(ctx, cx, cy, R * 0.1); ctx.fillStyle = cream; ctx.fill();
    disc(ctx, cx, cy, R); ctx.strokeStyle = rgba(darken(c, 0.4), 0.6); ctx.lineWidth = s * 0.02; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.95, Math.PI * 1.1, Math.PI * 1.45); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = s * 0.025; ctx.stroke();
  };

  B.monster = function (ctx, s, c, rnd) {
    const g = s * 0.06, x = g, y = g + s * 0.04, w = s - 2 * g, h = w - s * 0.04, r = s * 0.28, cx = s / 2, ink = '#1b1b2a';
    if (rnd() < 0.6) {
      ctx.fillStyle = darken(c, 0.2);
      poly(ctx, [[x + w * 0.12, y + h * 0.2], [x + w * 0.2, y - s * 0.07], [x + w * 0.36, y + h * 0.1]]); ctx.fill();
      poly(ctx, [[x + w * 0.88, y + h * 0.2], [x + w * 0.8, y - s * 0.07], [x + w * 0.64, y + h * 0.1]]); ctx.fill();
    }
    ctx.save(); shadow(ctx, s); rr(ctx, x, y, w, h, r); ctx.fillStyle = lin(ctx, 0, y, 0, y + h, [lighten(c, 0.28), c, darken(c, 0.18)]); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.ellipse(cx, y + h * 0.16, w * 0.3, h * 0.08, 0, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
    const one = rnd() < 0.25, er = w * (one ? 0.17 : 0.125), ey = y + h * 0.42, dx = (rnd() - 0.5) * er * 0.6, dy = (rnd() - 0.5) * er * 0.5;
    (one ? [cx] : [cx - w * 0.19, cx + w * 0.19]).forEach(ex => {
      disc(ctx, ex, ey, er); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = rgba(darken(c, 0.5), 0.5); ctx.lineWidth = s * 0.015; ctx.stroke();
      disc(ctx, ex + dx, ey + dy, er * 0.5); ctx.fillStyle = ink; ctx.fill();
      disc(ctx, ex + dx - er * 0.18, ey + dy - er * 0.2, er * 0.17); ctx.fillStyle = '#fff'; ctx.fill();
    });
    const my = y + h * 0.72, k = (rnd() * 3) | 0;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (k === 0) { ctx.beginPath(); ctx.arc(cx, my - h * 0.07, w * 0.17, 0.25, Math.PI - 0.25); ctx.strokeStyle = ink; ctx.lineWidth = s * 0.035; ctx.stroke(); }
    else if (k === 1) {
      ctx.beginPath(); ctx.ellipse(cx, my, w * 0.14, h * 0.1, 0, 0, TAU); ctx.fillStyle = ink; ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(cx - w * 0.05, my - h * 0.1, w * 0.1, h * 0.07);
    } else {
      ctx.fillStyle = '#fff'; ctx.strokeStyle = ink; ctx.lineWidth = s * 0.02;
      ctx.beginPath(); ctx.moveTo(cx - w * 0.22, my - h * 0.04);
      for (let i = 1; i <= 6; i++) ctx.lineTo(cx - w * 0.22 + i * w * 0.0733, my - h * 0.04 + (i % 2 ? h * 0.1 : 0));
      ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255,120,150,0.4)';
    disc(ctx, x + w * 0.16, y + h * 0.62, w * 0.07); ctx.fill(); disc(ctx, x + w * 0.84, y + h * 0.62, w * 0.07); ctx.fill();
  };

  B.chip = function (ctx, s, c) {
    const g = s * 0.05, b = s * 0.18, iw = s - 2 * b, cx = s / 2, cy = s / 2, pw = s * 0.075;
    ctx.fillStyle = lin(ctx, 0, 0, s, s, ['#e6ebf0', '#9aa5b1']);
    for (let i = 0; i < 3; i++) {
      const p = b + (iw * (i + 0.5)) / 3 - pw / 2;
      ctx.fillRect(g, p, b - g, pw); ctx.fillRect(s - b, p, b - g, pw); ctx.fillRect(p, g, pw, b - g); ctx.fillRect(p, s - b, pw, b - g);
    }
    ctx.save(); shadow(ctx, s); rr(ctx, b, b, iw, iw, s * 0.06); ctx.fillStyle = lin(ctx, b, b, b + iw, b + iw, ['#333a44', '#14171c']); ctx.fill(); ctx.restore();
    rr(ctx, b, b, iw, iw, s * 0.06); ctx.strokeStyle = rgba(c, 0.85); ctx.lineWidth = s * 0.025; ctx.stroke();
    ctx.strokeStyle = rgba(c, 0.5); ctx.lineWidth = s * 0.016; ctx.lineJoin = 'round';
    ctx.beginPath();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(d => {
      ctx.moveTo(cx + d[0] * iw * 0.14, cy + d[1] * iw * 0.14); ctx.lineTo(cx + d[0] * iw * 0.3, cy + d[1] * iw * 0.3); ctx.lineTo(cx + d[0] * iw * 0.3, cy + d[1] * iw * 0.42);
    });
    ctx.stroke();
    const k = iw * 0.19;
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = s * 0.16;
    rr(ctx, cx - k, cy - k, k * 2, k * 2, s * 0.03); ctx.fillStyle = lin(ctx, cx - k, cy - k, cx + k, cy + k, [lighten(c, 0.7), c]); ctx.fill();
    ctx.restore();
    disc(ctx, b + s * 0.07, b + s * 0.07, s * 0.02); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
  };

  B.stained = function (ctx, s, c, rnd) {
    const g = s * 0.04, w = s - 2 * g, lead = '#14141b', i = s * 0.075, ix = g + i, iw = w - 2 * i, e = ix + iw;
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = s * 0.14; rr(ctx, g, g, w, w, s * 0.07); ctx.fillStyle = lead; ctx.fill(); ctx.restore();
    const mx = ix + iw * (0.38 + rnd() * 0.24), my = ix + iw * (0.38 + rnd() * 0.24);
    const tones = [lighten(c, 0.3), c, darken(c, 0.12), lighten(c, 0.12)];
    [[[ix, ix], [mx, ix], [mx, my], [ix, my]], [[mx, ix], [e, ix], [e, my], [mx, my]], [[ix, my], [mx, my], [mx, e], [ix, e]], [[mx, my], [e, my], [e, e], [mx, e]]]
      .forEach((p, k) => { poly(ctx, p); ctx.fillStyle = tones[k]; ctx.fill(); });
    ctx.fillStyle = rad(ctx, mx, my, iw * 0.75, ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']); ctx.fillRect(ix, ix, iw, iw);
    ctx.strokeStyle = lead; ctx.lineWidth = s * 0.045;
    ctx.beginPath(); ctx.moveTo(mx, ix); ctx.lineTo(mx, e); ctx.moveTo(ix, my); ctx.lineTo(e, my); ctx.stroke();
    const d = iw * 0.2;
    poly(ctx, [[mx, my - d], [mx + d, my], [mx, my + d], [mx - d, my]]);
    ctx.fillStyle = lighten(c, 0.6); ctx.fill(); ctx.lineWidth = s * 0.035; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(g + s * 0.03, g + w * 0.5); ctx.lineTo(g + s * 0.03, g + s * 0.03); ctx.lineTo(g + w * 0.5, g + s * 0.03);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = s * 0.015; ctx.stroke();
  };

  B.marble = function (ctx, s, c, rnd) {
    const m = mix(c, '#f7f3ee', 0.55);
    const { x, y, w, r } = body(ctx, s, { r: 0.08, diag: true, stops: [lighten(m, 0.3), m, darken(m, 0.1)] });
    ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 4; i++) {
      let px = x + rnd() * w, py = y - 2;
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let k = 0; k < 4; k++) { px += (rnd() - 0.5) * w * 0.4; py += w * 0.28; ctx.lineTo(px, py); }
      ctx.strokeStyle = rgba(darken(c, 0.35), 0.16 + rnd() * 0.2); ctx.lineWidth = s * (0.012 + rnd() * 0.03); ctx.stroke();
    }
    ctx.restore();
    bevel(ctx, x, y, w, r, s * 0.04, 'rgba(255,255,255,0.85)', rgba(darken(c, 0.6), 0.45));
    rr(ctx, x + w * 0.13, y + w * 0.13, w * 0.74, w * 0.74, s * 0.03);
    ctx.strokeStyle = lin(ctx, x, y, x + w, y + w, ['#fff3b8', '#d9a938', '#8f6a14', '#f1cf6a']); ctx.lineWidth = s * 0.03; ctx.stroke();
    disc(ctx, s / 2, s / 2, w * 0.1);
    ctx.fillStyle = rad(ctx, s / 2, s / 2, w * 0.1, [lighten(c, 0.6), c, darken(c, 0.3)], s / 2 - w * 0.03, s / 2 - w * 0.03); ctx.fill();
    ctx.strokeStyle = '#b98a22'; ctx.lineWidth = s * 0.018; ctx.stroke();
  };

  B.tile = function (ctx, s, c) {
    const { x, y, w, r } = body(ctx, s, { r: 0.06, diag: true, stops: [lighten(c, 0.14), darken(c, 0.14)] });
    const cx = s / 2, cy = s / 2, cream = '#fbf3df', corners = [[x, y], [x + w, y], [x, y + w], [x + w, y + w]];
    const star = (h, col) => {
      ctx.fillStyle = col;
      for (let k = 0; k < 2; k++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate((k * Math.PI) / 4); ctx.fillRect(-h, -h, h * 2, h * 2); ctx.restore(); }
    };
    ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
    ctx.fillStyle = rgba(cream, 0.9); corners.forEach(p => { disc(ctx, p[0], p[1], w * 0.2); ctx.fill(); });
    ctx.fillStyle = darken(c, 0.3); corners.forEach(p => { disc(ctx, p[0], p[1], w * 0.1); ctx.fill(); });
    star(w * 0.27, cream); star(w * 0.18, darken(c, 0.28)); star(w * 0.09, cream);
    ctx.fillStyle = lin(ctx, 0, y, 0, y + w * 0.5, ['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']); ctx.fillRect(x, y, w, w * 0.5);
    ctx.restore();
    bevel(ctx, x, y, w, r, s * 0.035, 'rgba(255,255,255,0.6)', rgba(darken(c, 0.6), 0.55));
  };

  B.holo = function (ctx, s, c, rnd) {
    const { x, y, w, r } = body(ctx, s, { g: 0.05, r: 0.2, fill: c, sh: rgba(c, 0.6) });
    ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
    ctx.globalAlpha = 0.6; ctx.fillStyle = lin(ctx, x, y + w, x + w, y, ['#7afcff', '#ff8bf0', '#fff38a', '#8affc1', '#8ab4ff']); ctx.fillRect(x, y, w, w);
    ctx.globalAlpha = 0.2; ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) { poly(ctx, [[x + rnd() * w, y + rnd() * w], [x + rnd() * w, y + rnd() * w], [x + rnd() * w, y + rnd() * w]]); ctx.fill(); }
    ctx.globalAlpha = 0.5; poly(ctx, [[x + w * 0.1, y + w], [x + w * 0.22, y + w], [x + w, y + w * 0.22], [x + w, y + w * 0.1]]); ctx.fill();
    ctx.globalAlpha = 0.3; poly(ctx, [[x, y + w * 0.5], [x, y + w * 0.62], [x + w * 0.62, y], [x + w * 0.5, y]]); ctx.fill();
    ctx.restore();
    rr(ctx, x, y, w, w, r); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = s * 0.03; ctx.stroke();
    star4(ctx, x + w * 0.74, y + w * 0.27, s * 0.1, '#ffffff', 0.95);
  };

  // handgezeichneter Stein: Kreide oder technische Zeichnung
  function sketch(ctx, s, ink, rnd, hatch, tech) {
    const g = s * 0.1, x = g, y = g, w = s - 2 * g, j = () => (rnd() - 0.5) * s * 0.035;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, w); ctx.clip();
    ctx.fillStyle = rgba(ink, hatch * 0.45); ctx.fillRect(x, y, w, w);
    ctx.strokeStyle = rgba(ink, hatch); ctx.lineWidth = s * 0.03;
    for (let i = -7; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x + i * s * 0.11 + j(), y + w + 2); ctx.lineTo(x + i * s * 0.11 + w + j(), y - 2); ctx.stroke(); }
    ctx.restore();
    for (let k = 0; k < 2; k++) {
      ctx.strokeStyle = rgba(ink, k ? 0.55 : 0.98); ctx.lineWidth = s * (k ? 0.022 : 0.045);
      ctx.beginPath(); ctx.moveTo(x + j(), y + j()); ctx.lineTo(x + w + j(), y + j()); ctx.lineTo(x + w + j(), y + w + j()); ctx.lineTo(x + j(), y + w + j()); ctx.closePath(); ctx.stroke();
    }
    if (tech) {
      const m = s * 0.07;
      ctx.strokeStyle = rgba(ink, 0.9); ctx.lineWidth = s * 0.018;
      ctx.beginPath(); ctx.moveTo(s / 2 - m, s / 2); ctx.lineTo(s / 2 + m, s / 2); ctx.moveTo(s / 2, s / 2 - m); ctx.lineTo(s / 2, s / 2 + m); ctx.stroke();
      ctx.setLineDash([s * 0.04, s * 0.035]); disc(ctx, s / 2, s / 2, s * 0.16); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  B.chalk = (ctx, s, c, rnd) => sketch(ctx, s, lighten(c, 0.3), rnd, 0.6, false);
  B.blueprint = (ctx, s, c, rnd) => sketch(ctx, s, lighten(c, 0.38), rnd, 0.5, true);

  B.pumpkin = function (ctx, s, c, rnd) {
    const cx = s / 2, cy = s * 0.55, rx = s * 0.43, ry = s * 0.37;
    rr(ctx, cx - s * 0.05, s * 0.06, s * 0.1, s * 0.16, s * 0.03); ctx.fillStyle = '#4f6b2a'; ctx.fill();
    ctx.save(); shadow(ctx, s);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fillStyle = rad(ctx, cx, cy, rx * 1.1, [lighten(c, 0.35), c, darken(c, 0.35)], cx - rx * 0.35, cy - ry * 0.45); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = rgba(darken(c, 0.5), 0.4); ctx.lineWidth = s * 0.02;
    [0.34, 0.7].forEach(f => { ctx.beginPath(); ctx.ellipse(cx, cy, rx * f, ry * 0.97, 0, 0, TAU); ctx.stroke(); });
    ctx.save(); ctx.shadowColor = '#ffb300'; ctx.shadowBlur = s * 0.14; ctx.fillStyle = '#fff3a8';
    const ey = cy - ry * 0.22, ex = rx * 0.42, e = s * 0.085;
    if (rnd() < 0.5) {
      poly(ctx, [[cx - ex - e, ey + e * 0.6], [cx - ex, ey - e], [cx - ex + e, ey + e * 0.6]]); ctx.fill();
      poly(ctx, [[cx + ex - e, ey + e * 0.6], [cx + ex, ey - e], [cx + ex + e, ey + e * 0.6]]); ctx.fill();
    } else { disc(ctx, cx - ex, ey, e * 0.8); ctx.fill(); disc(ctx, cx + ex, ey, e * 0.8); ctx.fill(); }
    const my = cy + ry * 0.3, mw = rx * 0.6, mh = ry * 0.2;
    ctx.beginPath(); ctx.moveTo(cx - mw, my - mh * 0.4);
    for (let i = 1; i <= 6; i++) ctx.lineTo(cx - mw + (i * mw) / 3, my - mh * 0.4 + (i % 2 ? mh * 0.5 : 0));
    for (let i = 5; i >= 0; i--) ctx.lineTo(cx - mw + (i * mw) / 3 + mw / 6, my + mh * 0.6 + (i % 2 ? mh * 0.5 : 0));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  B.gift = function (ctx, s, c, rnd) {
    const { x, y, w, r } = body(ctx, s, { g: 0.045, r: 0.08, stops: [lighten(c, 0.16), darken(c, 0.14)] });
    const cx = s / 2, cy = s / 2, rb = '#ffd45e', rd = '#c08f22', bw = w * 0.17, band = [rd, rb, '#fff1b8', rb, rd];
    ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    if (rnd() < 0.5) {
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { disc(ctx, x + (i + (j % 2 ? 0.5 : 0)) * w * 0.25, y + j * w * 0.25, w * 0.04); ctx.fill(); }
    } else {
      for (let i = -5; i < 6; i++) { const x0 = x + i * w * 0.24; poly(ctx, [[x0, y + w], [x0 + w * 0.09, y + w], [x0 + w * 1.09, y], [x0 + w, y]]); ctx.fill(); }
    }
    ctx.fillStyle = lin(ctx, cx - bw / 2, 0, cx + bw / 2, 0, band); ctx.fillRect(cx - bw / 2, y, bw, w);
    ctx.fillStyle = lin(ctx, 0, cy - bw / 2, 0, cy + bw / 2, band); ctx.fillRect(x, cy - bw / 2, w, bw);
    ctx.restore();
    bevel(ctx, x, y, w, r, s * 0.035, 'rgba(255,255,255,0.55)', rgba(darken(c, 0.6), 0.5));
    ctx.fillStyle = rb; ctx.strokeStyle = rd; ctx.lineWidth = s * 0.018;
    [-1, 1].forEach(d => {
      ctx.save(); ctx.translate(cx + d * w * 0.13, cy - w * 0.03); ctx.rotate(d * -0.5);
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.15, w * 0.085, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    });
    disc(ctx, cx, cy, w * 0.065); ctx.fillStyle = '#fff1b8'; ctx.fill(); ctx.stroke();
  };

  B.maki = function (ctx, s, c, rnd) {
    const cx = s / 2, cy = s / 2, R = s * 0.44, f = R * 0.44;
    ctx.save(); shadow(ctx, s); disc(ctx, cx, cy, R); ctx.fillStyle = '#17241d'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.95, Math.PI * 1.05, Math.PI * 1.5); ctx.strokeStyle = 'rgba(160,220,180,0.35)'; ctx.lineWidth = s * 0.02; ctx.stroke();
    disc(ctx, cx, cy, R * 0.86); ctx.fillStyle = '#fbf8f0'; ctx.fill();
    ctx.fillStyle = 'rgba(205,195,172,0.75)';
    for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU, d = R * (0.5 + rnd() * 0.3);
      ctx.save(); ctx.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d); ctx.rotate(rnd() * 3);
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.028, s * 0.014, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    ctx.save(); disc(ctx, cx, cy, f); ctx.clip();
    ctx.fillStyle = rad(ctx, cx, cy, f, [lighten(c, 0.35), c, darken(c, 0.15)], cx - f * 0.3, cy - f * 0.3); ctx.fillRect(cx - f, cy - f, f * 2, f * 2);
    ctx.fillStyle = rgba(lighten(c, 0.6), 0.6); ctx.translate(cx, cy); ctx.rotate(rnd() * 3); ctx.fillRect(-f, f * 0.15, f * 2, f);
    ctx.restore();
    disc(ctx, cx, cy, f); ctx.strokeStyle = rgba(darken(c, 0.4), 0.5); ctx.lineWidth = s * 0.015; ctx.stroke();
  };

  B.pebble = function (ctx, s, c, rnd) {
    const cx = s / 2, cy = s / 2;
    ctx.save(); ctx.shadowColor = 'rgba(40,30,10,0.45)'; ctx.shadowBlur = s * 0.09; ctx.shadowOffsetY = s * 0.05;
    blob(ctx, cx, cy, s * 0.4, 0.55, 0.1, rnd, 10);
    ctx.fillStyle = rad(ctx, cx, cy, s * 0.55, [lighten(c, 0.4), c, darken(c, 0.32)], cx - s * 0.14, cy - s * 0.16); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.clip();
    for (let i = 0; i < 18; i++) { ctx.fillStyle = i % 2 ? rgba(darken(c, 0.5), 0.25) : 'rgba(255,255,255,0.3)'; disc(ctx, s * (0.12 + rnd() * 0.76), s * (0.12 + rnd() * 0.76), s * (0.008 + rnd() * 0.014)); ctx.fill(); }
    const vy = s * (0.3 + rnd() * 0.4);
    ctx.beginPath(); ctx.moveTo(0, vy); ctx.bezierCurveTo(s * 0.3, vy + (rnd() - 0.5) * s * 0.3, s * 0.7, vy + (rnd() - 0.5) * s * 0.3, s, vy + (rnd() - 0.5) * s * 0.2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = s * 0.022; ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(cx - s * 0.1, cy - s * 0.15, s * 0.14, s * 0.07, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
  };

  B.poker = function (ctx, s, c, rnd) {
    const cx = s / 2, cy = s / 2, R = s * 0.45, ivory = '#fdf9ef';
    ctx.save(); shadow(ctx, s); disc(ctx, cx, cy, R); ctx.fillStyle = lin(ctx, 0, cy - R, 0, cy + R, [lighten(c, 0.18), darken(c, 0.16)]); ctx.fill(); ctx.restore();
    ctx.strokeStyle = ivory; ctx.lineWidth = R * 0.2;
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, a - 0.2, a + 0.2); ctx.stroke(); }
    ctx.setLineDash([s * 0.035, s * 0.035]); disc(ctx, cx, cy, R * 0.7); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = s * 0.018; ctx.stroke(); ctx.setLineDash([]);
    disc(ctx, cx, cy, R * 0.56); ctx.fillStyle = ivory; ctx.fill(); ctx.strokeStyle = rgba(darken(c, 0.4), 0.5); ctx.lineWidth = s * 0.015; ctx.stroke();
    const k = (rnd() * 3) | 0, h = R * 0.26;
    ctx.fillStyle = c;
    if (k === 0) { heart(ctx, cx, cy + h * 0.1, h); ctx.fill(); }
    else if (k === 1) { poly(ctx, [[cx, cy - h * 1.25], [cx + h * 0.9, cy], [cx, cy + h * 1.25], [cx - h * 0.9, cy]]); ctx.fill(); }
    else {
      ctx.save(); ctx.translate(cx, cy - h * 0.15); ctx.scale(1, -1); heart(ctx, 0, 0, h); ctx.fill(); ctx.restore();
      poly(ctx, [[cx, cy], [cx + h * 0.4, cy + h * 1.2], [cx - h * 0.4, cy + h * 1.2]]); ctx.fill();
    }
    disc(ctx, cx, cy, R); ctx.strokeStyle = rgba(darken(c, 0.45), 0.7); ctx.lineWidth = s * 0.02; ctx.stroke();
  };

  B.donut = function (ctx, s, c, rnd) {
    const cx = s / 2, cy = s / 2, R = s * 0.44, h = R * 0.3, p1 = rnd() * 6, p2 = rnd() * 6;
    const ring = (ro, ri, wob) => {
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) {
        const a = (i / 48) * TAU, d = ro * (1 + wob * (Math.sin(a * 7 + p1) * 0.045 + Math.sin(a * 4 + p2) * 0.035));
        if (i) ctx.lineTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); else ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d);
      }
      ctx.closePath(); ctx.moveTo(cx + ri, cy); ctx.arc(cx, cy, ri, 0, TAU, true);
    };
    ctx.save(); shadow(ctx, s); ring(R, h, 0); ctx.fillStyle = rad(ctx, cx, cy, R, ['#c98a3c', '#e9b970', '#d39a4c']); ctx.fill('evenodd'); ctx.restore();
    ring(R * 0.87, h * 1.3, 1); ctx.fillStyle = lin(ctx, 0, cy - R, 0, cy + R, [lighten(c, 0.3), c, darken(c, 0.1)]); ctx.fill('evenodd');
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.66, Math.PI * 1.1, Math.PI * 1.45); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = s * 0.035; ctx.stroke();
    const cols = ['#ffffff', '#ffe066', '#7bdff2', '#ff8fab', '#b5e48c'];
    ctx.lineWidth = s * 0.026;
    for (let i = 0; i < 11; i++) {
      const a = rnd() * TAU, d = R * (0.5 + rnd() * 0.28), t = rnd() * TAU, px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d;
      ctx.strokeStyle = cols[i % cols.length];
      ctx.beginPath(); ctx.moveTo(px - Math.cos(t) * s * 0.03, py - Math.sin(t) * s * 0.03); ctx.lineTo(px + Math.cos(t) * s * 0.03, py + Math.sin(t) * s * 0.03); ctx.stroke();
    }
  };

  B.disco = function (ctx, s, c) {
    const g = s * 0.06, x = g, y = g, w = s - 2 * g, r = s * 0.1, cx = s / 2, cy = s / 2;
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = s * 0.24; rr(ctx, x, y, w, w, r); ctx.fillStyle = c; ctx.fill(); ctx.restore();
    rr(ctx, x, y, w, w, r); ctx.fillStyle = rad(ctx, cx, cy, w * 0.75, [lighten(c, 0.8), lighten(c, 0.15), darken(c, 0.4)]); ctx.fill();
    ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = s * 0.018;
    ctx.beginPath(); ctx.moveTo(cx, y); ctx.lineTo(cx, y + w); ctx.moveTo(x, cy); ctx.lineTo(x + w, cy); ctx.stroke();
    ctx.globalAlpha = 0.22; ctx.fillStyle = '#fff';
    poly(ctx, [[x + w * 0.45, y], [x + w * 0.7, y], [x, y + w * 0.7], [x, y + w * 0.45]]); ctx.fill();
    ctx.restore();
    rr(ctx, x, y, w, w, r); ctx.strokeStyle = lighten(c, 0.65); ctx.lineWidth = s * 0.03; ctx.stroke();
  };

  B.panel = function (ctx, s, c) {
    const { x, y, w, r } = body(ctx, s, { r: 0.1, diag: true, stops: ['#dbe3ec', '#aab5c2', '#7b8795'] });
    const cx = s / 2, cy = s / 2;
    ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 12; i++) { ctx.moveTo(x, y + (i * w) / 12); ctx.lineTo(x + w, y + (i * w) / 12); }
    ctx.stroke(); ctx.restore();
    bevel(ctx, x, y, w, r, s * 0.04, 'rgba(255,255,255,0.8)', 'rgba(20,30,45,0.6)');
    [[0.15, 0.15], [0.85, 0.15], [0.15, 0.85], [0.85, 0.85]].forEach(p => {
      disc(ctx, x + w * p[0], y + w * p[1], w * 0.045); ctx.fillStyle = '#56606c'; ctx.fill();
      disc(ctx, x + w * p[0] - w * 0.012, y + w * p[1] - w * 0.012, w * 0.018); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    });
    disc(ctx, cx, cy, w * 0.3); ctx.fillStyle = '#2c3541'; ctx.fill();
    ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = s * 0.14;
    disc(ctx, cx, cy, w * 0.24); ctx.fillStyle = rad(ctx, cx, cy, w * 0.26, [lighten(c, 0.75), c, darken(c, 0.35)], cx - w * 0.07, cy - w * 0.08); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, w * 0.18, Math.PI * 1.1, Math.PI * 1.5); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = s * 0.025; ctx.lineCap = 'round'; ctx.stroke();
  };

  B.ink = function (ctx, s, c, rnd) {
    const g = s * 0.09, x = g, y = g, w = s - 2 * g, k = mix(c, '#17171c', 0.68), n = 5;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const yy = y + (w * (i + 0.5)) / n;
      ctx.strokeStyle = rgba(k, 0.82 + rnd() * 0.18); ctx.lineWidth = (w / n) * 1.12;
      ctx.beginPath(); ctx.moveTo(x + w * 0.1 + rnd() * w * 0.04, yy + (rnd() - 0.5) * s * 0.02); ctx.lineTo(x + w * 0.9 - rnd() * w * 0.07, yy + (rnd() - 0.5) * s * 0.03); ctx.stroke();
    }
    // Trockenpinsel: helle Streifen herauskratzen
    ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = Math.max(1, s * 0.012);
    for (let i = 0; i < 9; i++) { const yy = y + rnd() * w, x0 = x + w * (0.3 + rnd() * 0.4); ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w * (0.2 + rnd() * 0.3), yy + (rnd() - 0.5) * s * 0.02); ctx.stroke(); }
    ctx.globalCompositeOperation = 'source-over';
    // rotes Siegel in der Steinfarbe
    rr(ctx, x + w * 0.6, y + w * 0.6, w * 0.26, w * 0.26, s * 0.03); ctx.fillStyle = c; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, s * 0.016);
    ctx.beginPath(); ctx.moveTo(x + w * 0.66, y + w * 0.73); ctx.lineTo(x + w * 0.8, y + w * 0.73); ctx.moveTo(x + w * 0.73, y + w * 0.66); ctx.lineTo(x + w * 0.73, y + w * 0.8); ctx.stroke();
  };

  /* =====================================================================
     Hintergründe
     ===================================================================== */
  BG.pharao = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#ffd58a', '#f7a35c', '#d9663a']);
    const u = Math.min(W, H), base = H * 0.86;
    glow(ctx, W, H, W * 0.74, H * 0.2, Math.max(W, H) * 0.45, 'rgba(255,250,210,0.9)', 'rgba(255,250,210,0)');
    ctx.beginPath(); ctx.arc(W * 0.74, H * 0.2, u * 0.08, 0, TAU); ctx.fillStyle = '#fff6cf'; ctx.fill();
    [[0.22, 0.34, '#b5642f', '#8f4a22'], [0.62, 0.24, '#c47238', '#9a5226']].forEach(p => {
      const px = W * p[0], ph = u * p[1];
      poly(ctx, [[px - ph * 0.9, base], [px, base - ph], [px + ph * 0.9, base]]); ctx.fillStyle = p[2]; ctx.fill();
      poly(ctx, [[px, base - ph], [px + ph * 0.9, base], [px + ph * 0.25, base]]); ctx.fillStyle = p[3]; ctx.fill();
    });
    hills(ctx, W, H, rnd, '#d9924a', 0.85, 0.02, 3); hills(ctx, W, H, rnd, '#b8742f', 0.91, 0.022, 4);
    vignette(ctx, W, H, 0.3, '#5a2408');
  };

  BG.bricks = function (ctx, W, H) {
    vgrad(ctx, W, H, ['#2f9bf0', '#1976d2', '#0d58a8']);
    const d = Math.max(22, Math.min(W, H) / 14);
    for (let y = d / 2; y < H + d; y += d)
      for (let x = d / 2; x < W + d; x += d) {
        ctx.beginPath(); ctx.arc(x + 1.5, y + 2.5, d * 0.3, 0, TAU); ctx.fillStyle = 'rgba(0,30,80,0.3)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, d * 0.3, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fill();
      }
    vignette(ctx, W, H, 0.35, '#04255a');
  };

  BG.lcd = function (ctx, W, H) {
    ctx.fillStyle = '#9bbc0f'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(15,56,15,0.07)';
    for (let x = 0; x < W; x += 4) ctx.fillRect(x, 0, 1, H);
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    vignette(ctx, W, H, 0.3, '#0f380f');
  };

  BG.knit = function (ctx, W, H) {
    vgrad(ctx, W, H, ['#a3202f', '#8a1a28', '#701420']);
    const u = Math.max(4, Math.round(Math.min(W, H) / 46)), band = u * 14;
    ctx.fillStyle = 'rgba(255,240,225,0.5)';
    for (let y0 = 0; y0 < H + band; y0 += band) {
      for (let x = 0; x < W; x += u * 2) { ctx.fillRect(x, y0, u, u); ctx.fillRect(x + u, y0 + u, u, u); }
      for (let x = 0; x < W; x += u * 8)
        for (let k = 0; k < 4; k++) { ctx.fillRect(x + (3 - k) * u, y0 + (4 + k) * u, (k * 2 + 1) * u, u); if (k < 3) ctx.fillRect(x + (3 - k) * u, y0 + (10 - k) * u, (k * 2 + 1) * u, u); }
      for (let x = u * 4; x < W; x += u * 8) { ctx.fillRect(x + 3 * u, y0 + 6 * u, u, u); ctx.fillRect(x + 2 * u, y0 + 7 * u, u * 3, u); ctx.fillRect(x + 3 * u, y0 + 8 * u, u, u); }
    }
    vignette(ctx, W, H, 0.45, '#2a0409');
  };

  BG.popart = function (ctx, W, H) {
    ctx.fillStyle = '#ffd60a'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H * 0.42, R = Math.hypot(W, H), d = Math.max(10, Math.min(W, H) / 34);
    ctx.fillStyle = '#ffb703';
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a, a + TAU / 32); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(230,57,70,0.5)';
    for (let y = 0, j = 0; y < H; y += d, j++)
      for (let x = (j % 2) * d * 0.5; x < W; x += d) { const t = x / W + y / H - 1.05; if (t <= 0) continue; ctx.beginPath(); ctx.arc(x, y, Math.min(d * 0.45, d * t * 1.2), 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,150,199,0.4)';
    for (let y = 0, j = 0; y < H * 0.3; y += d, j++)
      for (let x = (j % 2) * d * 0.5; x < W * 0.45; x += d) { const t = 0.5 - (x / W + y / H); if (t <= 0) continue; ctx.beginPath(); ctx.arc(x, y, Math.min(d * 0.45, d * t * 1.5), 0, TAU); ctx.fill(); }
  };

  BG.aquarell = function (ctx, W, H, rnd) {
    ctx.fillStyle = '#fbf7ee'; ctx.fillRect(0, 0, W, H);
    const cols = ['255,143,171', '120,200,255', '255,214,102', '150,230,180', '190,160,255', '255,170,120'];
    for (let i = 0; i < 16; i++) {
      const x = rnd() * W, y = rnd() * H, r = Math.max(W, H) * (0.12 + rnd() * 0.22), c = cols[i % cols.length];
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(' + c + ',0.3)'); g.addColorStop(0.7, 'rgba(' + c + ',0.16)'); g.addColorStop(0.86, 'rgba(' + c + ',0.22)'); g.addColorStop(1, 'rgba(' + c + ',0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = 'rgba(120,100,80,0.05)';
    for (let i = 0; i < 700; i++) ctx.fillRect(rnd() * W, rnd() * H, 1.2, 1.2);
  };

  BG.schoko = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#4a2616', '#35190e', '#200e07']);
    ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const y = H * (0.2 + rnd() * 0.8);
      ctx.beginPath(); ctx.moveTo(-10, y);
      ctx.bezierCurveTo(W * 0.3, y - H * 0.08 * rnd(), W * 0.6, y + H * 0.1 * rnd(), W + 10, y - H * 0.05 + rnd() * H * 0.1);
      ctx.strokeStyle = 'rgba(150,90,50,' + (0.08 + rnd() * 0.1) + ')'; ctx.lineWidth = 6 + rnd() * 22; ctx.stroke();
    }
    // geschmolzene Schokolade tropft vom oberen Rand
    const n = Math.max(5, Math.round(W / 70)), top = H * 0.03;
    ctx.fillStyle = '#6b3a22'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, top);
    for (let i = 0; i < n; i++) {
      const x0 = (i / n) * W, x1 = ((i + 1) / n) * W, d = top + H * (0.02 + rnd() * 0.07), m = (x0 + x1) / 2, q = x1 - x0;
      ctx.bezierCurveTo(x0 + q * 0.2, top, m - q * 0.32, d, m, d); ctx.bezierCurveTo(m + q * 0.32, d, x1 - q * 0.2, top, x1, top);
    }
    ctx.lineTo(W, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,180,0.18)'; ctx.lineWidth = 2; ctx.stroke();
    vignette(ctx, W, H, 0.5);
  };

  BG.obst = function (ctx, W, H) {
    ctx.fillStyle = '#fffaf2'; ctx.fillRect(0, 0, W, H);
    const d = Math.max(20, Math.min(W, H) / 9);
    ctx.fillStyle = 'rgba(230,57,70,0.3)';
    for (let x = 0; x < W; x += d * 2) ctx.fillRect(x, 0, d, H);
    for (let y = 0; y < H; y += d * 2) ctx.fillRect(0, y, W, d);
    vignette(ctx, W, H, 0.22, '#7a1420');
  };

  BG.monster = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#4a1f8a', '#27408f', '#0f7f93']);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 3;
    const cols = ['163,255,92', '255,214,102', '255,120,180', '120,220,255'], u = Math.min(W, H) / 375;
    for (let i = 0; i < 46; i++) {
      const x = rnd() * W, y = rnd() * H, r = (8 + rnd() * 16) * Math.max(0.5, u), k = (rnd() * 4) | 0;
      ctx.strokeStyle = 'rgba(' + cols[i % 4] + ',' + (0.14 + rnd() * 0.14) + ')';
      ctx.beginPath();
      if (k === 0) ctx.arc(x, y, r, 0, TAU);
      else if (k === 1) { for (let j = 0; j < 5; j++) ctx.lineTo(x + j * r * 0.6, y + (j % 2 ? -r * 0.5 : r * 0.5)); }
      else if (k === 2) { ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); }
      else { ctx.moveTo(x - r, y + r * 0.7); ctx.lineTo(x, y - r); ctx.lineTo(x + r, y + r * 0.7); ctx.closePath(); }
      ctx.stroke();
    }
    vignette(ctx, W, H, 0.45, '#0a0626');
  };

  BG.platine = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#0d4a37', '#093626', '#052318']);
    const u = Math.max(8, Math.min(W, H) / 26), pad = Math.max(1.5, u * 0.24);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 46; i++) {
      let x = Math.round((rnd() * W) / u) * u, y = Math.round((rnd() * H) / u) * u;
      const sx = x, sy = y;
      ctx.strokeStyle = 'rgba(92,255,176,' + (0.1 + rnd() * 0.14) + ')'; ctx.lineWidth = pad * (rnd() < 0.3 ? 1.1 : 0.6);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < 4; k++) { const d = (rnd() * 4) | 0, len = u * (1 + ((rnd() * 4) | 0)); x += [1, 0, 1, -1][d] * len; y += [0, 1, 1, 1][d] * len; ctx.lineTo(x, y); }
      ctx.stroke();
      [[sx, sy], [x, y]].forEach(p => {
        ctx.fillStyle = 'rgba(255,214,102,0.5)'; ctx.beginPath(); ctx.arc(p[0], p[1], pad, 0, TAU); ctx.fill();
        ctx.fillStyle = '#052318'; ctx.beginPath(); ctx.arc(p[0], p[1], pad * 0.4, 0, TAU); ctx.fill();
      });
    }
    vignette(ctx, W, H, 0.5);
  };

  BG.kathedrale = function (ctx, W, H) {
    vgrad(ctx, W, H, ['#14102a', '#1c1436', '#0a0814']);
    const cx = W / 2, cy = H * 0.1, R = Math.min(W, H) * 0.3, dark = '#0a0812';
    const cols = ['#ff5a7a', '#ffb347', '#ffe066', '#5ce6a0', '#5cc8ff', '#8f7bff', '#e07bff'];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.2 + (i / 6) * 0.6), x1 = cx + Math.cos(a) * H * 1.2, y1 = cy + Math.sin(a) * H * 1.2, wv = H * 0.09;
      const g = ctx.createLinearGradient(cx, cy, x1, y1);
      g.addColorStop(0, rgba(cols[i], 0.3)); g.addColorStop(1, rgba(cols[i], 0));
      ctx.fillStyle = g; poly(ctx, [[cx, cy], [x1 - wv, y1], [x1 + wv, y1]]); ctx.fill();
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.08, 0, TAU); ctx.fillStyle = dark; ctx.fill();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a + 0.03, a + TAU / 12 - 0.03); ctx.closePath();
      ctx.fillStyle = rgba(cols[i % 7], 0.55); ctx.fill();
    }
    ctx.strokeStyle = dark; ctx.lineWidth = R * 0.07;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.62, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.34, 0, TAU); ctx.fillStyle = dark; ctx.fill();
    vignette(ctx, W, H, 0.6);
  };

  BG.olymp = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#8fd0ff', '#c9ecff', '#fff3d6']);
    glow(ctx, W, H, W * 0.5, H * 0.95, Math.max(W, H) * 0.6, 'rgba(255,236,170,0.8)', 'rgba(255,236,170,0)');
    const u = Math.min(W, H), cw = Math.max(10, u * 0.085);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 7; i++) {
      const x = rnd() * W, y = H * (0.08 + rnd() * 0.8), r = u * (0.05 + rnd() * 0.07);
      [[0, 0, 1], [-1, 0.25, 0.7], [1, 0.2, 0.75], [0.4, -0.35, 0.7]].forEach(p => { ctx.beginPath(); ctx.arc(x + p[0] * r, y + p[1] * r, r * p[2], 0, TAU); ctx.fill(); });
    }
    [cw * 0.2, W - cw * 1.2].forEach(x => {
      const g = ctx.createLinearGradient(x, 0, x + cw, 0);
      g.addColorStop(0, '#d9d4cb'); g.addColorStop(0.3, '#ffffff'); g.addColorStop(1, '#bdb6aa');
      ctx.fillStyle = g; ctx.fillRect(x, H * 0.05, cw, H);
      ctx.fillStyle = 'rgba(120,110,95,0.25)';
      for (let k = 1; k < 5; k++) ctx.fillRect(x + (k * cw) / 5, H * 0.07, 1.5, H);
      ctx.fillStyle = '#efeae2'; ctx.fillRect(x - cw * 0.2, H * 0.035, cw * 1.4, H * 0.022);
      ctx.fillStyle = '#cfc8bc'; ctx.fillRect(x - cw * 0.1, H * 0.057, cw * 1.2, H * 0.012);
    });
  };

  BG.marrakesch = function (ctx, W, H) {
    vgrad(ctx, W, H, ['#125a6b', '#134a66', '#1b2f52']);
    const d = Math.max(22, Math.min(W, H) / 8);
    ctx.strokeStyle = 'rgba(255,200,110,0.2)'; ctx.lineWidth = 1.5;
    for (let y = 0; y < H + d; y += d)
      for (let x = 0; x < W + d; x += d) {
        for (let k = 0; k < 2; k++) { ctx.save(); ctx.translate(x, y); ctx.rotate((k * Math.PI) / 4); ctx.strokeRect(-d * 0.3, -d * 0.3, d * 0.6, d * 0.6); ctx.restore(); }
        ctx.beginPath(); ctx.arc(x + d / 2, y + d / 2, d * 0.12, 0, TAU); ctx.stroke();
      }
    glow(ctx, W, H, W / 2, H * 0.25, Math.max(W, H) * 0.6, 'rgba(255,190,90,0.22)', 'rgba(255,190,90,0)');
    vignette(ctx, W, H, 0.55, '#050d1f');
  };

  BG.hologramm = function (ctx, W, H, rnd) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    ['#c9f7ff', '#e3d1ff', '#ffd6ef', '#fff6c9', '#cfffe5', '#cfe0ff'].forEach((c, i) => g.addColorStop(i / 5, c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const cols = ['160,240,255', '255,170,240', '255,245,170', '170,255,210', '190,180,255'];
    for (let i = 0; i < 9; i++) {
      const x = rnd() * W, y = rnd() * H, r = Math.max(W, H) * (0.15 + rnd() * 0.25), q = ctx.createRadialGradient(x, y, 0, x, y, r);
      q.addColorStop(0, 'rgba(' + cols[i % 5] + ',0.55)'); q.addColorStop(1, 'rgba(' + cols[i % 5] + ',0)');
      ctx.fillStyle = q; ctx.fillRect(0, 0, W, H);
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -H; x < W; x += 9) { ctx.moveTo(x, H); ctx.lineTo(x + H, 0); }
    ctx.stroke();
  };

  BG.kreide = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#2d4f3b', '#254232', '#1c3326']);
    for (let i = 0; i < 12; i++) {
      const x = rnd() * W, y = rnd() * H, r = Math.max(W, H) * (0.1 + rnd() * 0.2), q = ctx.createRadialGradient(x, y, 0, x, y, r);
      q.addColorStop(0, 'rgba(255,255,255,0.05)'); q.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = q; ctx.fillRect(0, 0, W, H);
    }
    const u = Math.min(W, H), fh = Math.max(4, H * 0.022);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = Math.max(1, u / 190); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < 14; i++) {
      const x = rnd() * W, y = rnd() * H, r = u * (0.025 + rnd() * 0.03), k = (rnd() * 5) | 0;
      ctx.beginPath();
      if (k === 0) { for (let j = 0; j < 5; j++) { const a = (j * 4 * Math.PI) / 5 - Math.PI / 2; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
      else if (k === 1) ctx.arc(x, y, r, 0.3, TAU + 0.1);
      else if (k === 2) { ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.5, y - r * 0.4); ctx.moveTo(x + r, y); ctx.lineTo(x + r * 0.5, y + r * 0.4); }
      else if (k === 3) { ctx.moveTo(x - r, y + r); ctx.lineTo(x - r, y - r); ctx.lineTo(x + r, y - r); ctx.lineTo(x + r, y + r); ctx.closePath(); }
      else { ctx.moveTo(x - r, y); ctx.quadraticCurveTo(x - r * 0.5, y - r, x, y); ctx.quadraticCurveTo(x + r * 0.5, y + r, x + r, y); }
      ctx.stroke();
    }
    ctx.fillStyle = '#7a5230'; ctx.fillRect(0, H - fh, W, fh);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, H - fh, W, Math.max(1, fh * 0.12));
    vignette(ctx, W, H, 0.4);
  };

  BG.blaupause = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#2460b8', '#1d4e9e', '#163d80']);
    const d = Math.max(5, Math.round(Math.min(W, H) / 32));
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    for (let x = 0; x < W; x += d) ctx.fillRect(x, 0, 1, H);
    for (let y = 0; y < H; y += d) ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    for (let x = 0; x < W; x += d * 5) ctx.fillRect(x, 0, 1.5, H);
    for (let y = 0; y < H; y += d * 5) ctx.fillRect(0, y, W, 1.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const x = rnd() * W, y = rnd() * H, r = d * (2 + rnd() * 4);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(x, y, r * 0.6, 0, TAU); ctx.moveTo(x - r * 1.3, y); ctx.lineTo(x + r * 1.3, y); ctx.moveTo(x, y - r * 1.3); ctx.lineTo(x, y + r * 1.3); ctx.stroke();
      ctx.setLineDash([]);
    }
    vignette(ctx, W, H, 0.4, '#061a40');
  };

  BG.geister = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#160a2c', '#2c1247', '#5a1f3c']);
    stars(ctx, W, H, rnd, 70, 0.7);
    const u = Math.min(W, H), mx = W * 0.78, my = H * 0.19, mr = u * 0.13, night = '#0d0618';
    glow(ctx, W, H, mx, my, mr * 3.5, 'rgba(255,225,150,0.35)', 'rgba(255,225,150,0)');
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fillStyle = '#ffe9a8'; ctx.fill();
    ctx.fillStyle = 'rgba(200,160,90,0.3)';
    [[-0.3, -0.2, 0.2], [0.35, 0.25, 0.14], [0.1, -0.45, 0.1]].forEach(p => { ctx.beginPath(); ctx.arc(mx + p[0] * mr, my + p[1] * mr, mr * p[2], 0, TAU); ctx.fill(); });
    ctx.fillStyle = night;
    for (let i = 0; i < 7; i++) { // Fledermäuse
      const x = rnd() * W, y = H * (0.05 + rnd() * 0.3), b = u * (0.02 + rnd() * 0.02);
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - b, y - b * 1.2, x - b * 2.2, y - b * 0.2); ctx.quadraticCurveTo(x - b * 1.4, y - b * 0.1, x - b * 1.1, y + b * 0.6);
      ctx.quadraticCurveTo(x - b * 0.5, y + b * 0.1, x, y + b * 0.5); ctx.quadraticCurveTo(x + b * 0.5, y + b * 0.1, x + b * 1.1, y + b * 0.6);
      ctx.quadraticCurveTo(x + b * 1.4, y - b * 0.1, x + b * 2.2, y - b * 0.2); ctx.quadraticCurveTo(x + b, y - b * 1.2, x, y);
      ctx.fill();
    }
    hills(ctx, W, H, rnd, night, 0.9, 0.02, 4);
    for (let i = 0; i < 6; i++) { // Grabsteine
      const x = W * (0.05 + i * 0.17 + rnd() * 0.05), gw = u * 0.05, gh = u * (0.06 + rnd() * 0.04), y = H * 0.91;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - gh); ctx.arc(x + gw / 2, y - gh, gw / 2, Math.PI, 0); ctx.lineTo(x + gw, y); ctx.closePath(); ctx.fill();
    }
    vignette(ctx, W, H, 0.5);
  };

  BG.winter = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#0b2238', '#12384d', '#1d5560']);
    stars(ctx, W, H, rnd, 80, 0.75);
    const u = Math.min(W, H);
    hills(ctx, W, H, rnd, '#9fc9dc', 0.86, 0.03, 4);
    for (let i = 0; i < 9; i++) { // Tannen
      const x = rnd() * W, h = u * (0.1 + rnd() * 0.1), y = H * (0.87 + rnd() * 0.03);
      ctx.fillStyle = i % 2 ? '#0f4a3a' : '#136049';
      for (let k = 0; k < 3; k++) { poly(ctx, [[x - h * (0.42 - k * 0.09), y - h * k * 0.28], [x, y - h * (0.5 + k * 0.25)], [x + h * (0.42 - k * 0.09), y - h * k * 0.28]]); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      poly(ctx, [[x - h * 0.08, y - h * 0.84], [x, y - h], [x + h * 0.08, y - h * 0.84]]); ctx.fill();
    }
    hills(ctx, W, H, rnd, '#e9f6fb', 0.92, 0.025, 5);
    // Lichterkette
    const n = Math.max(7, Math.round(W / 46)), cols = ['#ff5a5a', '#ffd45e', '#5ce68a', '#5cc8ff', '#ff8fe0'], bulb = Math.max(1.5, u / 110);
    const yAt = t => H * 0.012 + Math.pow(Math.sin(t * Math.PI * 3), 2) * H * 0.028;
    ctx.strokeStyle = 'rgba(20,30,30,0.8)'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) ctx.lineTo((i / 60) * W, yAt(i / 60));
    ctx.stroke();
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n, x = t * W, y = yAt(t) + bulb * 1.4, c = cols[i % 5], q = ctx.createRadialGradient(x, y, 0, x, y, bulb * 4.5);
      q.addColorStop(0, rgba(c, 0.55)); q.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = q; ctx.fillRect(x - bulb * 4.5, y - bulb * 4.5, bulb * 9, bulb * 9);
      ctx.beginPath(); ctx.arc(x, y, bulb, 0, TAU); ctx.fillStyle = c; ctx.fill();
    }
    vignette(ctx, W, H, 0.4);
  };

  BG.sushi = function (ctx, W, H, rnd) {
    ctx.fillStyle = '#c9b57a'; ctx.fillRect(0, 0, W, H);
    const d = Math.max(6, Math.min(W, H) / 30);
    for (let y = 0; y < H; y += d) {
      const g = ctx.createLinearGradient(0, y, 0, y + d);
      g.addColorStop(0, 'rgba(255,245,200,0.35)'); g.addColorStop(0.5, 'rgba(255,245,200,0)'); g.addColorStop(1, 'rgba(70,50,10,0.3)');
      ctx.fillStyle = g; ctx.fillRect(0, y, W, d);
      ctx.fillStyle = 'rgba(90,70,20,' + rnd() * 0.08 + ')'; ctx.fillRect(0, y, W, d);
    }
    ctx.fillStyle = 'rgba(245,240,225,0.75)';
    [0.12, 0.5, 0.88].forEach(f => { for (let y = 0; y < H; y += d) ctx.fillRect(W * f - d * 0.12, y + d * 0.15, d * 0.24, d * 0.7); });
    vignette(ctx, W, H, 0.3, '#3a2a08');
  };

  BG.zen = function (ctx, W, H) {
    vgrad(ctx, W, H, ['#efe6d2', '#e6dbc2', '#d9ccae']);
    const u = Math.min(W, H), step = Math.max(4, u / 42), dark = 'rgba(120,100,60,0.15)', lite = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = Math.max(1, step * 0.22);
    for (let y = 0; y < H; y += step) {
      ctx.strokeStyle = dark; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      ctx.strokeStyle = lite; ctx.beginPath(); ctx.moveTo(0, y + step * 0.25); ctx.lineTo(W, y + step * 0.25); ctx.stroke();
    }
    [[W * 0.18, H * 0.12], [W * 0.85, H * 0.5], [W * 0.3, H * 0.93]].forEach(p => {
      const R = u * 0.26;
      ctx.beginPath(); ctx.arc(p[0], p[1], R, 0, TAU); ctx.fillStyle = '#e6dbc2'; ctx.fill();
      for (let r = R; r > u * 0.05; r -= step) {
        ctx.strokeStyle = dark; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.stroke();
        ctx.strokeStyle = lite; ctx.beginPath(); ctx.arc(p[0], p[1], r - step * 0.25, 0, TAU); ctx.stroke();
      }
      ctx.beginPath(); ctx.ellipse(p[0], p[1], u * 0.045, u * 0.035, 0.4, 0, TAU); ctx.fillStyle = '#6f6a60'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(p[0] - u * 0.012, p[1] - u * 0.012, u * 0.02, u * 0.012, 0.4, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
    });
    vignette(ctx, W, H, 0.2, '#5a4a20');
  };

  BG.casino = function (ctx, W, H, rnd) {
    const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.75);
    g.addColorStop(0, '#24895a'); g.addColorStop(1, '#0a3320');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let i = 0; i < 1500; i++) ctx.fillRect(rnd() * W, rnd() * H, 1.5, 1.5);
    ctx.strokeStyle = 'rgba(255,212,94,0.35)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(W / 2, H * 1.02, W * 0.75, H * 0.2, 0, Math.PI, TAU); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(W / 2, -H * 0.02, W * 0.75, H * 0.14, 0, 0, Math.PI); ctx.stroke();
    const u = Math.min(W, H);
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    for (let i = 0; i < 8; i++) {
      const x = rnd() * W, y = rnd() * H, h = u * (0.03 + rnd() * 0.03);
      if (i % 2) heart(ctx, x, y, h); else poly(ctx, [[x, y - h * 1.3], [x + h, y], [x, y + h * 1.3], [x - h, y]]);
      ctx.fill();
    }
    vignette(ctx, W, H, 0.5);
  };

  BG.donut = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#fff0f5', '#ffe3ee', '#ffd3e4']);
    const u = Math.min(W, H), d = Math.max(14, u / 10), cols = ['#ff8fab', '#7bdff2', '#ffd166', '#b5e48c', '#c8a2ff'], sl = Math.max(3, u / 42);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let y = 0, j = 0; y < H + d; y += d, j++)
      for (let x = (j % 2) * d * 0.5; x < W + d; x += d) { ctx.beginPath(); ctx.arc(x, y, d * 0.13, 0, TAU); ctx.fill(); }
    ctx.lineCap = 'round'; ctx.lineWidth = sl * 0.45;
    for (let i = 0; i < 60; i++) {
      const x = rnd() * W, y = rnd() * H, a = rnd() * TAU;
      ctx.strokeStyle = rgba(cols[i % 5], 0.55);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * sl, y + Math.sin(a) * sl); ctx.stroke();
    }
    // gestreifte Markise am oberen Rand
    const sw = Math.max(12, W / 14), ah = H * 0.035;
    for (let x = 0, i = 0; x < W; x += sw, i++) {
      ctx.fillStyle = i % 2 ? '#ff8fb5' : '#ffffff'; ctx.fillRect(x, 0, sw + 0.5, ah);
      ctx.beginPath(); ctx.arc(x + sw / 2, ah, sw / 2, 0, Math.PI); ctx.fill();
    }
  };

  BG.disco = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#12021f', '#1c0433', '#0a0114']);
    const cols = ['255,79,216', '80,200,255', '255,220,90', '120,255,170', '170,120,255'];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const x0 = W * (0.1 + rnd() * 0.8), x1 = x0 + (rnd() - 0.5) * W * 0.9, wv = W * (0.1 + rnd() * 0.12), g = ctx.createLinearGradient(0, 0, 0, H * 0.95);
      g.addColorStop(0, 'rgba(' + cols[i % 5] + ',0.34)'); g.addColorStop(1, 'rgba(' + cols[i % 5] + ',0)');
      ctx.fillStyle = g; poly(ctx, [[x0 - 4, 0], [x0 + 4, 0], [x1 + wv, H * 0.95], [x1 - wv, H * 0.95]]); ctx.fill();
    }
    for (let i = 0; i < 40; i++) {
      const x = rnd() * W, y = rnd() * H, r = (3 + rnd() * 14) * Math.max(0.4, Math.min(W, H) / 375), q = ctx.createRadialGradient(x, y, 0, x, y, r);
      q.addColorStop(0, 'rgba(' + cols[i % 5] + ',0.5)'); q.addColorStop(1, 'rgba(' + cols[i % 5] + ',0)');
      ctx.fillStyle = q; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
    // Tanzfläche
    const hy = H * 0.86, n = 8, xs = (t, y) => W / 2 + (t - 0.5) * W * (0.9 + (0.6 * (y - hy)) / (H - hy));
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < n; i++) {
        const y0 = hy + ((H - hy) * j) / 3, y1 = hy + ((H - hy) * (j + 1)) / 3;
        ctx.fillStyle = 'rgba(' + cols[(i + j * 2) % 5] + ',' + (0.12 + rnd() * 0.2) + ')';
        poly(ctx, [[xs(i / n, y0), y0], [xs((i + 1) / n, y0), y0], [xs((i + 1) / n, y1), y1], [xs(i / n, y1), y1]]); ctx.fill();
      }
    vignette(ctx, W, H, 0.55);
  };

  BG.station = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#03050f', '#070d22', '#0b1634']);
    const n = Math.min(700, Math.round((W * H) / 3000)), u = Math.max(W, H), px = W * 0.12, py = H * 1.02, pr = u * 0.42;
    for (let i = 0; i < n; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + rnd() * 0.8) + ')'; ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.4 + rnd() * rnd() * 1.5, 0, TAU); ctx.fill(); }
    const g = ctx.createRadialGradient(px, py, pr * 0.9, px, py, pr * 1.18);
    g.addColorStop(0, 'rgba(110,200,255,0.5)'); g.addColorStop(1, 'rgba(110,200,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.clip();
    ctx.fillStyle = rad(ctx, px, py, pr, ['#6fd3ff', '#2f7fd6', '#0b2a66'], px + pr * 0.3, py - pr * 0.6); ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    for (let i = 0; i < 6; i++) { ctx.lineWidth = pr * (0.02 + rnd() * 0.05); ctx.beginPath(); ctx.ellipse(px, py - pr * (0.9 - i * 0.14), pr * 1.1, pr * 0.12, -0.15, 0, TAU); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = '#1a2230'; ctx.fillRect(0, 0, W, H * 0.012); ctx.fillRect(0, H * 0.988, W, H * 0.012);
    vignette(ctx, W, H, 0.5);
  };

  BG.tusche = function (ctx, W, H, rnd) {
    vgrad(ctx, W, H, ['#f6f0e2', '#f1e9d8', '#e9dfca']);
    ctx.fillStyle = 'rgba(120,100,70,0.05)';
    for (let i = 0; i < 600; i++) ctx.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1);
    const u = Math.min(W, H);
    ctx.beginPath(); ctx.arc(W * 0.78, H * 0.2, u * 0.1, 0, TAU); ctx.fillStyle = '#c8372d'; ctx.fill();
    // Tusche-Berge im Dunst
    [[0.72, 0.1, 'rgba(60,60,70,0.16)', 3], [0.8, 0.08, 'rgba(50,50,60,0.26)', 4], [0.88, 0.06, 'rgba(35,35,45,0.42)', 5]].forEach(l => {
      const ph = rnd() * 9;
      ctx.fillStyle = l[2]; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W + 6; x += 6) { const t = x / W; ctx.lineTo(x, H * (l[0] - Math.abs(Math.sin(t * l[3] + ph)) * l[1] - Math.sin(t * 17 + ph) * 0.006)); }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      const g = ctx.createLinearGradient(0, H * l[0], 0, H * (l[0] + 0.1));
      g.addColorStop(0, 'rgba(241,233,216,0)'); g.addColorStop(1, 'rgba(241,233,216,0.8)');
      ctx.fillStyle = g; ctx.fillRect(0, H * l[0], W, H * 0.1);
    });
    ctx.strokeStyle = 'rgba(30,30,40,0.6)'; ctx.lineWidth = Math.max(1, u / 230); ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { // Vögel
      const x = W * (0.15 + rnd() * 0.5), y = H * (0.2 + rnd() * 0.08), b = u * 0.018;
      ctx.beginPath(); ctx.moveTo(x - b, y - b * 0.4); ctx.quadraticCurveTo(x - b * 0.4, y - b * 0.7, x, y); ctx.quadraticCurveTo(x + b * 0.4, y - b * 0.7, x + b, y - b * 0.4); ctx.stroke();
    }
  };

  /* =====================================================================
     Die Designs
     ===================================================================== */
  const T = (id, name, block, bg, colors, ui, board, ambient, fx) => ({ id, name, block, bg: BG[bg], colors, ui, board, ambient, fx });
  const VIVID = ['#ff4d5e', '#ff9a2e', '#ffd43b', '#4cd964', '#34c6ff', '#5b7cff', '#c561ff'];

  P.THEMES.push(
    T('pharao', 'Pharao', 'stone', 'pharao', ['#e0563f', '#f08a2e', '#f2c94c', '#5fae5a', '#3aaecf', '#4f6fd1', '#a45fc9'],
      LIGHT('#5a2408', '#d9480f', '#ffd58a'),
      { a: '#8a5a2e', b: '#6e4420', cell: 'rgba(50,25,5,0.3)', cellLine: 'rgba(255,220,160,0.1)', frame: '#f2c46b', fw: 3, glow: 'rgba(120,50,10,0.5)', tray: 'rgba(120,74,36,0.72)', r: 0.03, cr: 0.08 },
      { shape: 'dot', n: 30, colors: ['#ffe9b8', '#ffd58a'], vx: [20, 60], vy: [-4, 8], size: [0.8, 2.2], alpha: 0.6 },
      { shape: 'square', n: 9, speed: [2, 7], grav: 18, drag: 1.2, life: [0.5, 0.9], size: [0.07, 0.18] }),

    T('bricks', 'Bausteine', 'brick', 'bricks', ['#e3000b', '#ff8a00', '#ffd500', '#00a650', '#00b4e6', '#0055bf', '#a05ac8'],
      DARK('#ffd500', '#1976d2'),
      { a: '#f4f6f8', b: '#dfe4ea', cell: 'rgba(20,60,120,0.1)', frame: '#ffffff', fw: 3, glow: 'rgba(0,30,90,0.5)', tray: 'rgba(255,255,255,0.8)', r: 0.03, cr: 0.08 },
      null,
      { shape: 'square', n: 9, speed: [3, 9], grav: 22, drag: 1, life: [0.5, 0.9], size: [0.1, 0.2] }),

    T('lcd', 'Retro-LCD', 'lcd', 'lcd', ['#306230', '#0f380f', '#306230', '#1f4a1f', '#0f380f', '#306230', '#1f4a1f'],
      LIGHT('#0f380f', '#306230', '#9bbc0f'),
      { a: '#8bac0f', b: '#8bac0f', cell: 'rgba(15,56,15,0.1)', frame: '#0f380f', fw: 3, glow: 'rgba(15,56,15,0.35)', tray: 'rgba(139,172,15,0.9)', r: 0, cr: 0 },
      null,
      { shape: 'pixel', n: 8, speed: [3, 8], grav: 22, drag: 1, life: [0.4, 0.8], size: [0.1, 0.18] }),

    T('knit', 'Strickpulli', 'knit', 'knit', ['#d8323c', '#f08a3c', '#f2c84b', '#3f9d5c', '#4aa3c7', '#3d5aa8', '#9a5fb0'],
      DARK('#ffe9c9', '#a3202f'),
      { a: '#f5ecdf', b: '#eadcc8', cell: 'rgba(120,30,40,0.1)', frame: '#fff8ec', fw: 3, glow: 'rgba(40,5,10,0.55)', tray: 'rgba(245,236,223,0.85)', r: 0.05, cr: 0.2 },
      { shape: 'dot', n: 36, colors: ['#ffffff'], vx: [-6, 6], vy: [18, 44], size: [1, 2.6], sway: 14, alpha: 0.8 },
      { shape: 'circle', n: 9, speed: [2, 6], grav: 8, drag: 2.2, life: [0.6, 1.1], size: [0.06, 0.14] }),

    T('popart', 'Pop-Art', 'comic', 'popart', ['#e63946', '#ff7b00', '#ffd60a', '#2dc653', '#00b4d8', '#3a5ce4', '#c44dff'],
      LIGHT('#111111', '#e63946', '#ffd60a'),
      { a: '#ffffff', b: '#ffffff', cell: 'rgba(17,17,17,0.07)', frame: '#111111', fw: 4, glow: 'rgba(0,0,0,0.35)', tray: 'rgba(255,255,255,0.9)', r: 0.03, cr: 0.12 },
      { shape: 'star4', n: 14, colors: ['#ffffff', '#e63946', '#00b4d8'], vx: [-4, 4], vy: [-6, 6], size: [4, 9], twinkle: 2.4, alpha: 0.8 },
      { shape: 'star4', n: 9, speed: [3, 9], grav: 8, drag: 1.6, life: [0.5, 0.9], size: [0.14, 0.3] }),

    T('aquarell', 'Aquarell', 'water', 'aquarell', ['#ef5d7a', '#f59a4c', '#f2c94c', '#63c08a', '#52b5e0', '#6a7fe0', '#b07ad9'],
      LIGHT('#3b4a5a', '#e76f8a', '#fbf7ee'),
      { a: '#fffdf8', b: '#f7f1e6', cell: 'rgba(60,74,90,0.06)', frame: '#c9bfae', fw: 2, glow: 'rgba(80,70,50,0.25)', tray: 'rgba(255,253,248,0.8)', r: 0.04, cr: 0.3 },
      { shape: 'dot', n: 16, colors: ['#ffb3c6', '#a8dcff', '#ffe08a', '#b8f0c8'], vx: [-5, 5], vy: [-8, 8], size: [4, 12], alpha: 0.25 },
      { shape: 'circle', n: 10, speed: [1.5, 6], grav: 6, drag: 2.4, life: [0.6, 1.2], size: [0.06, 0.2] }),

    T('schoko', 'Schokolade', 'choc', 'schoko', ['#7a4a2e', '#4a2618', '#f0dfc0', '#c96b7e', '#c98a3c', '#8f9a52', '#6f5596'],
      DARK('#ffcf8a', '#4a2616'),
      { a: '#2a140b', b: '#1c0d07', cell: 'rgba(255,200,140,0.05)', cellLine: 'rgba(255,200,140,0.1)', frame: '#d9a55a', fw: 2.5, glow: 'rgba(0,0,0,0.6)', tray: 'rgba(42,20,11,0.82)', r: 0.035, cr: 0.1 },
      { shape: 'dot', n: 18, colors: ['#ffd9a0', '#c98a3c'], vx: [-4, 4], vy: [10, 24], size: [1, 2.4], alpha: 0.5 },
      { shape: 'square', n: 9, speed: [2, 7], grav: 20, drag: 1.2, life: [0.5, 0.9], size: [0.08, 0.18] }),

    T('obst', 'Obstsalat', 'fruit', 'obst', ['#ef3e4a', '#ff9a1f', '#ffd92e', '#7ac943', '#2fc6c0', '#5a6ee0', '#b05ad6'],
      LIGHT('#7a1420', '#e63946', '#fffaf2'),
      { a: '#ffffff', b: '#fff4e6', cell: 'rgba(230,57,70,0.08)', frame: '#ffffff', fw: 3, glow: 'rgba(120,20,30,0.35)', tray: 'rgba(255,255,255,0.82)', r: 0.05, cr: 0.5 },
      { shape: 'leaf', n: 10, colors: ['#7ac943', '#4fa83a'], vx: [-10, 10], vy: [14, 34], size: [5, 9], spin: 1.2, sway: 22, alpha: 0.75 },
      { shape: 'circle', n: 10, speed: [2, 8], grav: 14, drag: 1.4, life: [0.5, 0.95], size: [0.05, 0.13] }),

    T('monster', 'Monsterchen', 'monster', 'monster', ['#ff5c7a', '#ff9f43', '#ffd93b', '#5fd068', '#3fc8f0', '#6c7bff', '#c86bff'],
      DARK('#a3ff5c', '#4a1f8a'),
      { a: '#221447', b: '#170d33', cell: 'rgba(255,255,255,0.05)', cellLine: 'rgba(163,255,92,0.1)', frame: '#a3ff5c', fw: 2.5, glow: 'rgba(163,255,92,0.4)', tray: 'rgba(34,20,71,0.78)', r: 0.05, cr: 0.3 },
      { shape: 'ring', n: 18, colors: ['#a3ff5c', '#ffd93b', '#ff8fd0'], vx: [-6, 6], vy: [-26, -8], size: [3, 9], sway: 10, alpha: 0.4 },
      { shape: 'circle', n: 10, speed: [2, 8], grav: 14, drag: 1.4, life: [0.5, 0.95], size: [0.06, 0.15] }),

    T('platine', 'Platine', 'chip', 'platine', ['#ff4d6d', '#ff9e2c', '#ffe14d', '#4dff9a', '#38d9ff', '#5b8cff', '#d06bff'],
      DARK('#5cffb0', '#0d4a37'),
      { a: '#082a1f', b: '#051a13', cell: 'rgba(92,255,176,0.05)', cellLine: 'rgba(92,255,176,0.14)', frame: '#5cffb0', fw: 2, glow: 'rgba(92,255,176,0.45)', tray: 'rgba(8,42,31,0.82)', r: 0.025, cr: 0.08 },
      { shape: 'square', n: 22, colors: ['#5cffb0', '#ffd45e'], vx: [0, 0], vy: [-30, -10], size: [2, 4], twinkle: 4, alpha: 0.7 },
      { shape: 'spark', n: 10, speed: [4, 12], grav: 0, drag: 3, life: [0.3, 0.6], size: [0.16, 0.36], add: true }),

    T('kathedrale', 'Kathedrale', 'stained', 'kathedrale', ['#e0284a', '#f58a1f', '#f5d033', '#2fb86a', '#2fb3e6', '#3b5fd9', '#a04be0'],
      DARK('#ffcf5c', '#14102a'),
      { a: '#16122a', b: '#0c0a18', cell: 'rgba(255,255,255,0.035)', cellLine: 'rgba(255,207,92,0.1)', frame: '#bfa15a', fw: 3, glow: 'rgba(255,200,100,0.35)', tray: 'rgba(22,18,42,0.82)', r: 0.03, cr: 0.06 },
      { shape: 'glow', add: true, n: 22, colors: ['#ffd98a', '#ff9ec3', '#9ecbff'], vx: [-4, 4], vy: [6, 18], size: [0.8, 2], twinkle: 1.5 },
      { shape: 'tri', n: 10, speed: [2, 8], grav: 16, drag: 1.2, life: [0.5, 0.95], size: [0.08, 0.2] }),

    T('olymp', 'Olymp', 'marble', 'olymp', ['#d94a5a', '#e8923a', '#e6c13a', '#4fae6a', '#3fa9d6', '#4a66c9', '#9a5bd0'],
      LIGHT('#2a3d66', '#c9981a', '#8fd0ff'),
      { a: '#fbfaf7', b: '#ece7de', cell: 'rgba(42,61,102,0.07)', frame: '#d9b54a', fw: 3, glow: 'rgba(40,70,120,0.3)', tray: 'rgba(251,250,247,0.82)', r: 0.03, cr: 0.08 },
      { shape: 'dot', n: 14, colors: ['#ffffff'], vx: [6, 16], vy: [-2, 2], size: [6, 16], alpha: 0.3 },
      { shape: 'tri', n: 9, speed: [2, 7], grav: 18, drag: 1.2, life: [0.5, 0.9], size: [0.08, 0.2] }),

    T('marrakesch', 'Marrakesch', 'tile', 'marrakesch', ['#d9413a', '#e88a2a', '#e8c23a', '#2f9e7a', '#2aa5c9', '#2f55b0', '#8a4ab0'],
      DARK('#ffb347', '#125a6b'),
      { a: '#f3e7d0', b: '#e6d6b8', cell: 'rgba(18,74,102,0.1)', frame: '#ffcf7a', fw: 3, glow: 'rgba(0,10,30,0.55)', tray: 'rgba(243,231,208,0.86)', r: 0.03, cr: 0.06 },
      { shape: 'glow', add: true, n: 20, colors: ['#ffc46b', '#ffe2a8'], vx: [-5, 5], vy: [-12, -3], size: [1, 2.4], twinkle: 1.8 },
      { shape: 'square', n: 9, speed: [2, 7], grav: 18, drag: 1.2, life: [0.5, 0.9], size: [0.08, 0.18] }),

    T('hologramm', 'Hologramm', 'holo', 'hologramm', ['#ff5c8a', '#ff9e5c', '#ffd95c', '#5ce6a0', '#5cd0ff', '#6f8cff', '#c77bff'],
      LIGHT('#3a2f5c', '#7b5cff', '#e3d1ff'),
      { a: '#fbf9ff', b: '#efeaff', cell: 'rgba(90,70,160,0.08)', frame: '#ffffff', fw: 3, glow: 'rgba(123,92,255,0.4)', tray: 'rgba(255,255,255,0.7)', r: 0.06, cr: 0.22 },
      { shape: 'star4', n: 20, colors: ['#ffffff', '#b3f5ff', '#ffc2f2'], vx: [-3, 3], vy: [-5, 5], size: [3, 8], twinkle: 2.6, alpha: 0.9 },
      { shape: 'star4', n: 9, speed: [2, 8], grav: 4, drag: 2, life: [0.5, 1], size: [0.12, 0.28] }),

    T('kreide', 'Kreidetafel', 'chalk', 'kreide', ['#ff6b7a', '#ffa24d', '#ffe066', '#7be08a', '#6fd4ff', '#8a9bff', '#d98aff'],
      DARK('#ffe27a', '#2d4f3b'),
      { a: '#1f382a', b: '#182c21', cell: 'rgba(255,255,255,0.04)', cellLine: 'rgba(255,255,255,0.14)', frame: '#f3efe2', fw: 2, glow: 'rgba(0,0,0,0.5)', tray: 'rgba(31,56,42,0.85)', r: 0.02, cr: 0.05 },
      { shape: 'dot', n: 26, colors: ['#ffffff'], vx: [-3, 3], vy: [6, 16], size: [0.6, 1.6], alpha: 0.5 },
      { shape: 'circle', n: 12, speed: [1.5, 6], grav: 6, drag: 2.6, life: [0.5, 1], size: [0.03, 0.09] }),

    T('blaupause', 'Blaupause', 'blueprint', 'blaupause', ['#ff8a9a', '#ffb86b', '#ffe98a', '#8af0a8', '#8ae4ff', '#b0bcff', '#e0a8ff'],
      DARK('#9fd4ff', '#2460b8'),
      { a: '#1a4690', b: '#153a7a', cell: 'rgba(255,255,255,0.04)', cellLine: 'rgba(255,255,255,0.2)', frame: '#ffffff', fw: 1.5, glow: 'rgba(4,20,60,0.6)', tray: 'rgba(26,70,144,0.85)', r: 0.01, cr: 0 },
      { shape: 'frame', n: 10, colors: ['#ffffff'], vx: [-4, 4], vy: [-8, -2], size: [4, 10], spin: 0.3, alpha: 0.25 },
      { shape: 'spark', n: 8, speed: [3, 9], grav: 0, drag: 3, life: [0.3, 0.6], size: [0.14, 0.3] }),

    T('geister', 'Geisterstunde', 'pumpkin', 'geister', ['#ff5a2e', '#ff9a1f', '#ffd23b', '#8bd44a', '#5fd0d0', '#8a7bff', '#c45cff'],
      DARK('#ff9a1f', '#160a2c'),
      { a: '#1d0f33', b: '#130923', cell: 'rgba(255,255,255,0.04)', cellLine: 'rgba(255,154,31,0.12)', frame: '#ff9a1f', fw: 2.5, glow: 'rgba(255,120,20,0.45)', tray: 'rgba(29,15,51,0.82)', r: 0.04, cr: 0.5 },
      { shape: 'glow', add: true, n: 18, colors: ['#b7ff7a', '#ffb347', '#d6a8ff'], vx: [-10, 10], vy: [-14, 4], size: [1.2, 3], twinkle: 1.4, sway: 12 },
      { shape: 'circle', n: 10, speed: [2, 7], grav: -4, drag: 2, life: [0.5, 1.1], size: [0.05, 0.12], add: true }),

    T('winter', 'Winterfest', 'gift', 'winter', ['#e0283c', '#f08a2e', '#eab730', '#2f9e5a', '#39b0d9', '#3d5fc4', '#a04fc0'],
      DARK('#ff6b6b', '#0b2238'),
      { a: '#0f2c40', b: '#0a2032', cell: 'rgba(255,255,255,0.05)', cellLine: 'rgba(200,235,255,0.12)', frame: '#e9f6fb', fw: 2.5, glow: 'rgba(150,220,255,0.4)', tray: 'rgba(15,44,64,0.82)', r: 0.04, cr: 0.1 },
      { shape: 'dot', n: 60, colors: ['#ffffff', '#e3f4ff'], vx: [-8, 8], vy: [22, 58], size: [0.8, 2.8], sway: 18, alpha: 0.9 },
      { shape: 'star4', n: 9, speed: [2, 8], grav: 10, drag: 1.5, life: [0.5, 1], size: [0.1, 0.24], add: true }),

    T('sushi', 'Sushi-Bar', 'maki', 'sushi', ['#f2644f', '#ff9d3c', '#f2d24a', '#7dbb4f', '#5cc7c0', '#6c7fd9', '#b06ad0'],
      LIGHT('#3a2c12', '#e85d4a', '#c9b57a'),
      { a: '#2b2620', b: '#1e1a15', cell: 'rgba(255,240,200,0.06)', cellLine: 'rgba(255,240,200,0.08)', frame: '#e85d4a', fw: 3, glow: 'rgba(40,25,5,0.55)', tray: 'rgba(43,38,32,0.86)', r: 0.03, cr: 0.5 },
      null,
      { shape: 'circle', n: 9, speed: [2, 7], grav: 16, drag: 1.3, life: [0.5, 0.9], size: [0.03, 0.08] }),

    T('zen', 'Zen-Garten', 'pebble', 'zen', ['#b8685a', '#c99a5b', '#d6c178', '#7f9d6c', '#6fa0aa', '#66739f', '#8d729f'],
      LIGHT('#4a4335', '#6f8f5f', '#efe6d2'),
      { a: '#d2c5a6', b: '#c4b694', cell: 'rgba(90,74,32,0.12)', frame: '#8a7a55', fw: 3, glow: 'rgba(90,74,32,0.4)', tray: 'rgba(210,197,166,0.85)', r: 0.03, cr: 0.5 },
      { shape: 'petal', n: 10, colors: ['#f7b7c8', '#ffffff'], vx: [-14, -4], vy: [12, 26], size: [3, 6], spin: 1.2, sway: 18, alpha: 0.8 },
      { shape: 'circle', n: 9, speed: [2, 6], grav: 18, drag: 1.4, life: [0.5, 0.9], size: [0.04, 0.1] }),

    T('casino', 'Casino', 'poker', 'casino', ['#d9263a', '#f08a1f', '#e8c12a', '#1f9e5a', '#22a7d6', '#2f4fc4', '#8a3fc4'],
      DARK('#ffd45e', '#0a3320'),
      { a: '#0d4029', b: '#092f1e', cell: 'rgba(255,255,255,0.045)', cellLine: 'rgba(255,212,94,0.12)', frame: '#ffd45e', fw: 3, glow: 'rgba(0,0,0,0.55)', tray: 'rgba(13,64,41,0.85)', r: 0.05, cr: 0.5 },
      { shape: 'star4', add: true, n: 14, colors: ['#ffe08a'], vx: [-3, 3], vy: [-4, 4], size: [1.5, 4], twinkle: 2.4 },
      { shape: 'circle', n: 9, speed: [3, 9], grav: 18, drag: 1.2, life: [0.5, 0.9], size: [0.05, 0.12] }),

    T('donut', 'Donut-Laden', 'donut', 'donut', ['#ff5c8a', '#ff9a4d', '#ffd84d', '#8fdc6a', '#5fd4f0', '#7a8cff', '#c98aff'],
      LIGHT('#7a2b4a', '#ff5c93', '#fff0f5'),
      { a: '#ffffff', b: '#fff3f8', cell: 'rgba(255,92,147,0.09)', frame: '#ffb3cc', fw: 3, glow: 'rgba(160,60,100,0.3)', tray: 'rgba(255,255,255,0.85)', r: 0.06, cr: 0.5 },
      { shape: 'dot', n: 16, colors: ['#ff8fab', '#7bdff2', '#ffd166', '#b5e48c'], vx: [-5, 5], vy: [10, 24], size: [2, 4], alpha: 0.7 },
      { shape: 'square', n: 10, speed: [2, 8], grav: 14, drag: 1.4, life: [0.5, 0.95], size: [0.05, 0.12] }),

    T('disco', 'Disco', 'disco', 'disco', ['#ff3d6e', '#ff8a1f', '#ffe62e', '#3dff7a', '#2ee6ff', '#5c7cff', '#e04bff'],
      DARK('#ff4fd8', '#12021f'),
      { a: '#0d0218', b: '#07010e', cell: 'rgba(255,255,255,0.04)', cellLine: 'rgba(255,79,216,0.14)', frame: '#ff4fd8', fw: 2, glow: 'rgba(255,79,216,0.6)', tray: 'rgba(13,2,24,0.82)', r: 0.035, cr: 0.1 },
      { shape: 'glow', add: true, n: 36, colors: ['#ff4fd8', '#50c8ff', '#ffdc5a', '#78ffaa'], vx: [-30, 30], vy: [-30, 30], size: [1, 2.6], twinkle: 5 },
      { shape: 'spark', n: 10, speed: [4, 12], grav: 0, drag: 3, life: [0.3, 0.6], size: [0.18, 0.4], add: true }),

    T('station', 'Raumstation', 'panel', 'station', VIVID,
      DARK('#6fd3ff', '#03050f'),
      { a: '#1a2230', b: '#111824', cell: 'rgba(111,211,255,0.05)', cellLine: 'rgba(111,211,255,0.14)', frame: '#8a97a8', fw: 3, glow: 'rgba(60,150,255,0.45)', tray: 'rgba(26,34,48,0.85)', r: 0.03, cr: 0.1 },
      { shape: 'star4', add: true, n: 18, colors: ['#ffffff', '#bcd4ff'], vx: [-2, 2], vy: [-2, 2], size: [1.5, 5], twinkle: 2, shooting: true },
      { shape: 'spark', n: 9, speed: [3, 10], grav: 0, drag: 2.6, life: [0.35, 0.7], size: [0.16, 0.34], add: true }),

    T('tusche', 'Tusche', 'ink', 'tusche', ['#c8372d', '#d9822b', '#c9a227', '#4f8a4f', '#3a8fa8', '#3f559e', '#7d4a9a'],
      LIGHT('#2a2a2e', '#c8372d', '#f6f0e2'),
      { a: '#fbf6ea', b: '#f1e9d6', cell: 'rgba(42,42,46,0.055)', frame: '#2a2a2e', fw: 2.5, glow: 'rgba(40,35,25,0.3)', tray: 'rgba(251,246,234,0.85)', r: 0.015, cr: 0.03 },
      { shape: 'petal', n: 9, colors: ['#c8372d', '#2a2a2e'], vx: [-12, -3], vy: [10, 22], size: [3, 5], spin: 1, sway: 16, alpha: 0.5 },
      { shape: 'circle', n: 11, speed: [2, 8], grav: 14, drag: 1.5, life: [0.5, 1], size: [0.03, 0.1] })
  );

  /* =====================================================================
     Ruhige Designs: schlichte Steine, weiche Verläufe, kaum Bewegung
     ===================================================================== */
  B.soft = function (ctx, s, c) {
    const { x, y, w, r } = body(ctx, s, { g: 0.05, r: 0.2, stops: [lighten(c, 0.16), darken(c, 0.08)], sh: rgba(darken(c, 0.6), 0.35) });
    rr(ctx, x + w * 0.08, y + w * 0.06, w * 0.84, w * 0.4, r * 0.8);
    ctx.fillStyle = lin(ctx, 0, y, 0, y + w * 0.5, ['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']); ctx.fill();
    rr(ctx, x, y, w, w, r); ctx.strokeStyle = rgba(lighten(c, 0.5), 0.5); ctx.lineWidth = Math.max(1, s * 0.02); ctx.stroke();
  };
  B.pearl = function (ctx, s, c) {
    const cx = s / 2, cy = s / 2, R = s * 0.42;
    ctx.save(); shadow(ctx, s, rgba(darken(c, 0.6), 0.4));
    disc(ctx, cx, cy, R); ctx.fillStyle = rad(ctx, cx, cy, R * 1.15, [lighten(c, 0.6), c, darken(c, 0.25)], cx - R * 0.35, cy - R * 0.4); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(cx - R * 0.3, cy - R * 0.38, R * 0.28, R * 0.16, -0.6, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
  };
  // Hintergrund aus Verlauf, optionalem Lichtschein, Gestirn, Sternen, Wolken und sanften Hügeln
  function calmBg(o) {
    return function (ctx, W, H, rnd) {
      vgrad(ctx, W, H, o.stops);
      if (o.stars) stars(ctx, W, H, rnd, o.stars, 0.6);
      if (o.glow) glow(ctx, W, H, W * o.glow[0], H * o.glow[1], Math.max(W, H) * o.glow[2], o.glow[3], o.glow[4]);
      if (o.disc) { ctx.beginPath(); ctx.arc(W * o.disc[0], H * o.disc[1], Math.min(W, H) * o.disc[2], 0, TAU); ctx.fillStyle = o.disc[3]; ctx.fill(); }
      if (o.clouds) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        for (let i = 0; i < o.clouds; i++) {
          const x = rnd() * W, y = H * (0.06 + rnd() * 0.85), r = Math.min(W, H) * (0.05 + rnd() * 0.06);
          [[0, 0, 1], [-1.1, 0.25, 0.7], [1.1, 0.2, 0.75], [0.4, -0.4, 0.7]].forEach(p => { ctx.beginPath(); ctx.arc(x + p[0] * r, y + p[1] * r, r * p[2], 0, TAU); ctx.fill(); });
        }
      }
      (o.hills || []).forEach(h => hills(ctx, W, H, rnd, h[0], h[1], h[2], h[3]));
      if (o.vig) vignette(ctx, W, H, o.vig[0], o.vig[1]);
    };
  }
  const WHITE0 = 'rgba(255,255,255,0)';
  BG.lavendel = calmBg({ stops: ['#f1e9fb', '#dccdf5', '#c2aee8'], glow: [0.5, 0.1, 0.6, 'rgba(255,255,255,0.6)', WHITE0], hills: [['rgba(150,120,210,0.45)', 0.86, 0.03, 4], ['rgba(120,90,190,0.5)', 0.92, 0.025, 5]] });
  BG.nebel = calmBg({ stops: ['#eef2f4', '#d5dee3', '#b9c7cf'], hills: [['rgba(130,150,165,0.35)', 0.78, 0.04, 3], ['rgba(105,128,145,0.45)', 0.85, 0.035, 4], ['rgba(80,105,122,0.55)', 0.92, 0.03, 5]] });
  BG.duene = calmBg({ stops: ['#f8ecd6', '#efd7b0', '#e3c08e'], glow: [0.72, 0.18, 0.45, 'rgba(255,250,225,0.8)', 'rgba(255,250,225,0)'], hills: [['#dcb682', 0.84, 0.035, 3], ['#cfa56e', 0.91, 0.03, 4]] });
  BG.mond = calmBg({ stops: ['#0a1030', '#141d4a', '#26336b'], stars: 60, glow: [0.76, 0.19, 0.4, 'rgba(230,235,255,0.22)', 'rgba(230,235,255,0)'], disc: [0.76, 0.19, 0.1, '#f3f0dc'], hills: [['#0c1436', 0.89, 0.025, 3]], vig: [0.4] });
  BG.minze = calmBg({ stops: ['#ecfbf5', '#cdf1e3', '#a9e2cf'], glow: [0.5, 0.08, 0.6, 'rgba(255,255,255,0.65)', WHITE0], hills: [['rgba(90,190,160,0.35)', 0.9, 0.025, 4]] });
  BG.abendrot = calmBg({ stops: ['#2f2a5a', '#7a4a7e', '#e58a6a', '#f7c08a'], glow: [0.5, 0.86, 0.5, 'rgba(255,225,170,0.5)', 'rgba(255,225,170,0)'], hills: [['#2a1f47', 0.9, 0.025, 3]], vig: [0.35] });
  BG.porzellan = calmBg({ stops: ['#f7f9fd', '#e6edf8', '#d3def2'], glow: [0.3, 0.15, 0.6, 'rgba(255,255,255,0.8)', WHITE0] });
  BG.waldsee = calmBg({ stops: ['#0d3434', '#104545', '#0a2626'], glow: [0.5, 0.3, 0.6, 'rgba(120,230,190,0.14)', 'rgba(120,230,190,0)'], hills: [['#082020', 0.9, 0.025, 4]], vig: [0.45] });
  BG.schiefer = calmBg({ stops: ['#2a2f37', '#20242b', '#16191e'], glow: [0.5, 0.1, 0.6, 'rgba(255,255,255,0.06)', WHITE0], vig: [0.4] });
  BG.wolken = calmBg({ stops: ['#a9d6f7', '#cfe9fb', '#f1f9ff'], clouds: 7 });

  const MUTED = ['#e8707a', '#eea05c', '#e9cb62', '#7cc48a', '#6bbfe0', '#7f8fe0', '#b78ad9'];
  const CALM_FX = { shape: 'circle', n: 9, speed: [2, 6], grav: 8, drag: 2, life: [0.5, 1], size: [0.05, 0.13] };
  const drift = (colors, add) => ({ shape: add ? 'glow' : 'dot', add: !!add, n: 10, colors, vx: [-4, 4], vy: [-7, -2], size: [1, 2.4], alpha: 0.45, twinkle: add ? 1.2 : 0 });
  const lightBoard = (a, b, cell, frame, glowC, cr) => ({ a, b, cell, frame, fw: 3, glow: glowC, tray: 'rgba(255,255,255,0.68)', r: 0.05, cr });
  const darkBoard = (a, b, frame, glowC, tray, cr) => ({ a, b, cell: 'rgba(255,255,255,0.045)', cellLine: 'rgba(255,255,255,0.08)', frame, fw: 2, glow: glowC, tray, r: 0.05, cr });

  P.THEMES.push(
    T('lavendel', 'Lavendelfeld', 'soft', 'lavendel', MUTED, LIGHT('#4a3a6b', '#8a6fd1', '#e9defa'),
      lightBoard('#fdfbff', '#f1eafc', 'rgba(110,80,180,0.08)', '#ffffff', 'rgba(90,60,160,0.3)', 0.24), drift(['#ffffff', '#d9c8ff']), CALM_FX),
    T('nebel', 'Nebelmorgen', 'glass', 'nebel', ['#f0645a', '#f5a23c', '#f0c93f', '#3fc98a', '#34bdea', '#5a84f2', '#b377f0'], LIGHT('#3d4a57', '#5f8fa8', '#dfe6ea'),
      lightBoard('#f8fafb', '#e8eef1', 'rgba(60,80,95,0.07)', '#ffffff', 'rgba(50,70,85,0.3)', 0.2), drift(['#ffffff']), CALM_FX),
    T('duene', 'Sanddüne', 'soft', 'duene', ['#d9705f', '#e29a55', '#e3c067', '#8fb87a', '#6fb3c4', '#7b8cc9', '#a983c2'], LIGHT('#5a4326', '#c08a4a', '#f3e2c4'),
      lightBoard('#fbf4e6', '#f1e4cb', 'rgba(120,85,40,0.08)', '#ffffff', 'rgba(120,85,40,0.3)', 0.2), drift(['#fff6dc']), CALM_FX),
    T('mond', 'Mondnacht', 'pearl', 'mond', ['#ff8e9e', '#ffb877', '#ffe08a', '#8fe0a8', '#8fd6ff', '#a3b0ff', '#cfa3ff'], DARK('#bcd0ff', '#0b1230'),
      darkBoard('#162050', '#0e1638', '#aebfff', 'rgba(120,150,255,0.4)', 'rgba(20,30,74,0.75)', 0.5), drift(['#dfe8ff', '#fff3c4'], true), CALM_FX),
    T('minze', 'Minze', 'soft', 'minze', MUTED, LIGHT('#1f5a4c', '#2fae8c', '#dff6ee'),
      lightBoard('#fbfffd', '#e9f8f2', 'rgba(30,120,95,0.08)', '#ffffff', 'rgba(30,110,90,0.28)', 0.24), drift(['#ffffff']), CALM_FX),
    T('abendrot', 'Abendrot', 'glass', 'abendrot', ['#ff7a8a', '#ffa25e', '#ffd76b', '#7fdba0', '#74cdf2', '#8d9bff', '#c58cf5'], DARK('#ffc59a', '#2f2a5a'),
      darkBoard('#2c2452', '#1e1838', '#ffc59a', 'rgba(255,170,120,0.35)', 'rgba(44,36,82,0.75)', 0.2), drift(['#ffe2c0'], true), CALM_FX),
    T('porzellan', 'Porzellan', 'pearl', 'porzellan', ['#d95f6f', '#e2924f', '#dcb94a', '#5fb37c', '#4fa6d6', '#3f6fd1', '#9a72cf'], LIGHT('#27407a', '#3f6fd1', '#eef3fb'),
      { a: '#ffffff', b: '#f0f4fb', cell: 'rgba(40,70,140,0.07)', frame: '#3f6fd1', fw: 2, glow: 'rgba(40,70,140,0.25)', tray: 'rgba(255,255,255,0.75)', r: 0.05, cr: 0.5 }, null, CALM_FX),
    T('waldsee', 'Waldsee', 'pebble', 'waldsee', ['#d9806f', '#e0aa66', '#dfcf7e', '#8fc98a', '#7cc4cf', '#8795cc', '#b08fc9'], DARK('#9fe8c4', '#0d3434'),
      darkBoard('#123f3f', '#0b2c2c', '#9fe8c4', 'rgba(100,220,180,0.3)', 'rgba(18,63,63,0.78)', 0.5), drift(['#c9ffe6'], true), CALM_FX),
    T('schiefer', 'Schiefer', 'soft', 'schiefer', ['#d9737c', '#dc9a5e', '#d8c069', '#7dbb8a', '#6fb4d2', '#7f8cd6', '#ac86cf'], DARK('#ffd98a', '#20242b'),
      darkBoard('#30363f', '#252a32', '#8b94a3', 'rgba(0,0,0,0.5)', 'rgba(40,45,54,0.82)', 0.18), null, CALM_FX),
    T('wolken', 'Wolkenhimmel', 'candy', 'wolken', ['#ff6f8f', '#ffa24d', '#ffd24d', '#6fd47a', '#4fc3f0', '#6f86f5', '#c07cf0'], LIGHT('#2c5278', '#3d8fd1', '#bfe1fa'),
      lightBoard('#ffffff', '#eef7fe', 'rgba(60,140,210,0.09)', '#ffffff', 'rgba(40,100,170,0.3)', 0.28), null, CALM_FX)
  );

  /* =====================================================================
     Süße Designs: Pastellfarben, weiche Formen, Süßigkeiten
     ===================================================================== */
  // Macaron: zwei weiche Schalen mit heller Füllung
  B.macaron = function (ctx, s, c) {
    const w = s * 0.86, x = (s - w) / 2, h = s * 0.34, r = h * 0.5, mid = s * 0.5;
    ctx.save(); shadow(ctx, s, rgba(darken(c, 0.6), 0.4));
    rr(ctx, x, mid + s * 0.05, w, h, r); ctx.fillStyle = lin(ctx, 0, mid, 0, mid + h, [darken(c, 0.06), darken(c, 0.24)]); ctx.fill();
    ctx.restore();
    rr(ctx, x + w * 0.05, mid - s * 0.06, w * 0.9, s * 0.12, s * 0.04); ctx.fillStyle = lighten(c, 0.62); ctx.fill();
    rr(ctx, x, mid - s * 0.05 - h, w, h, r); ctx.fillStyle = lin(ctx, 0, mid - h, 0, mid, [lighten(c, 0.18), darken(c, 0.04)]); ctx.fill();
    rr(ctx, x + w * 0.12, mid - s * 0.03 - h, w * 0.76, h * 0.32, h * 0.16); ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fill();
  };
  // Seifenblase: durchscheinende Kugel mit hellem Rand und Glanz
  B.bubble = function (ctx, s, c) {
    const cx = s / 2, cy = s / 2, R = s * 0.43;
    disc(ctx, cx, cy, R);
    ctx.fillStyle = rad(ctx, cx, cy, R, [rgba(lighten(c, 0.45), 0.4), rgba(c, 0.5), rgba(darken(c, 0.08), 0.9)]); ctx.fill();
    ctx.lineWidth = Math.max(1, s * 0.03); ctx.strokeStyle = rgba(lighten(c, 0.6), 0.95); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.8, 0.5, 1.7); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = s * 0.045; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx - R * 0.36, cy - R * 0.4, R * 0.3, R * 0.17, -0.7, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
  };
  // Gummibonbon: durchscheinender, glänzender Würfel
  B.gummi = function (ctx, s, c) {
    const { x, y, w, r } = body(ctx, s, { g: 0.07, r: 0.26, stops: [lighten(c, 0.1), c, darken(c, 0.18)], sh: rgba(darken(c, 0.5), 0.3) });
    rr(ctx, x + w * 0.12, y + w * 0.12, w * 0.76, w * 0.76, r * 0.8); ctx.fillStyle = rgba(lighten(c, 0.3), 0.35); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + w * 0.32, y + w * 0.26, w * 0.2, w * 0.1, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    rr(ctx, x, y, w, w, r); ctx.strokeStyle = rgba(darken(c, 0.3), 0.3); ctx.lineWidth = Math.max(1, s * 0.015); ctx.stroke();
  };
  // Hintergrund-Zutaten für die süßen Designs: Regenbogen, Streusel, Blümchen
  function sweetBg(o) {
    const base = calmBg(o);
    return function (ctx, W, H, rnd) {
      base(ctx, W, H, rnd);
      const u = Math.min(W, H);
      if (o.rainbow) {
        const cols = ['#ffb3b3', '#ffd3a8', '#fff2b0', '#c9f0c4', '#b8e4ff', '#c9c6ff', '#e5c4ff'], lw = W * 0.034;
        ctx.lineWidth = lw; ctx.globalAlpha = 0.5;
        cols.forEach((c, i) => { ctx.beginPath(); ctx.arc(W * 0.5, H * 0.6, W * 0.92 - i * lw, Math.PI, TAU); ctx.strokeStyle = c; ctx.stroke(); });
        ctx.globalAlpha = 1;
      }
      if (o.dots)
        for (let i = 0; i < o.dots.n; i++) {
          ctx.fillStyle = rgba(o.dots.colors[(rnd() * o.dots.colors.length) | 0], o.dots.alpha);
          disc(ctx, rnd() * W, rnd() * H, u * (o.dots.r[0] + rnd() * (o.dots.r[1] - o.dots.r[0]))); ctx.fill();
        }
      if (o.flowers)
        for (let i = 0; i < o.flowers; i++) {
          const x = rnd() * W, y = H * (0.72 + rnd() * 0.26), r = u * (0.008 + rnd() * 0.008);
          ctx.fillStyle = ['#ffffff', '#ffd1e0', '#fff0a8', '#d6e8ff'][(rnd() * 4) | 0];
          for (let k = 0; k < 5; k++) { disc(ctx, x + Math.cos((k / 5) * TAU) * r, y + Math.sin((k / 5) * TAU) * r, r * 0.75); ctx.fill(); }
          ctx.fillStyle = '#ffd34d'; disc(ctx, x, y, r * 0.5); ctx.fill();
        }
    };
  }
  const PASTEL = ['#ff8da1', '#ffb47a', '#ffe182', '#9ddf9a', '#8ad4f2', '#9aa8ff', '#d4a1ff'];
  const SPRINKLES = ['#ff9fb5', '#ffd27a', '#9fe0a8', '#8fd3f5', '#d1a8ff', '#ffffff'];
  BG.macaron = sweetBg({ stops: ['#fff6f9', '#ffe4ed', '#fbd0dd'], glow: [0.5, 0.1, 0.6, 'rgba(255,255,255,0.75)', WHITE0], dots: { n: 14, r: [0.03, 0.07], colors: ['#ffffff', '#ffd9e6', '#e6f2ff'], alpha: 0.45 } });
  BG.eiscreme = sweetBg({ stops: ['#fff9f0', '#fbead8', '#f2d8bf'], glow: [0.3, 0.12, 0.55, 'rgba(255,255,255,0.7)', WHITE0], dots: { n: 70, r: [0.004, 0.008], colors: SPRINKLES, alpha: 0.75 } });
  BG.zuckerwatte = sweetBg({ stops: ['#ffd9ec', '#f3dbff', '#d9ecff'], glow: [0.5, 0.2, 0.6, 'rgba(255,255,255,0.6)', WHITE0], clouds: 6 });
  BG.honig = sweetBg({ stops: ['#fff6dc', '#ffe6ad', '#f7cd78'], glow: [0.7, 0.15, 0.5, 'rgba(255,255,240,0.8)', WHITE0], hills: [['rgba(230,170,70,0.3)', 0.86, 0.03, 3], ['rgba(210,145,50,0.35)', 0.92, 0.025, 4]] });
  BG.seifenblasen = sweetBg({ stops: ['#eaf7ff', '#d4ecfb', '#c0e0f7'], glow: [0.4, 0.1, 0.6, 'rgba(255,255,255,0.7)', WHITE0], dots: { n: 18, r: [0.02, 0.06], colors: ['#ffffff'], alpha: 0.3 } });
  BG.pfirsich = sweetBg({ stops: ['#fff3ea', '#ffdcc6', '#ffc5a6'], glow: [0.5, 0.12, 0.55, 'rgba(255,255,255,0.7)', WHITE0], hills: [['rgba(240,150,110,0.3)', 0.86, 0.03, 3], ['rgba(225,125,90,0.35)', 0.92, 0.025, 4]] });
  BG.gummibaer = sweetBg({ stops: ['#fffbea', '#fff2cc', '#ffe8b3'], glow: [0.5, 0.1, 0.6, 'rgba(255,255,255,0.7)', WHITE0], dots: { n: 22, r: [0.012, 0.03], colors: SPRINKLES, alpha: 0.35 } });
  BG.regenbogen = sweetBg({ stops: ['#f4f9ff', '#e6f2ff', '#d7eaff'], rainbow: true, clouds: 4 });
  BG.marshmallow = sweetBg({ stops: ['#f6ebe3', '#ecd9cc', '#dcc2b0'], glow: [0.5, 0.1, 0.6, 'rgba(255,255,255,0.7)', WHITE0], dots: { n: 12, r: [0.03, 0.07], colors: ['#ffffff', '#ffe4ea'], alpha: 0.4 } });
  BG.wiese = sweetBg({ stops: ['#eefbf3', '#d9f3e4', '#c3ead2'], glow: [0.5, 0.08, 0.6, 'rgba(255,255,255,0.7)', WHITE0], hills: [['rgba(120,200,140,0.35)', 0.8, 0.035, 3], ['rgba(90,175,115,0.45)', 0.88, 0.03, 4]], flowers: 26 });

  P.THEMES.push(
    T('macaron', 'Macarons', 'macaron', 'macaron', PASTEL, LIGHT('#7a3b55', '#ff7fa3', '#ffe4ed'),
      lightBoard('#ffffff', '#fff1f5', 'rgba(255,127,163,0.09)', '#ffffff', 'rgba(200,90,130,0.28)', 0.3), drift(['#ffffff', '#ffd9e6']), CALM_FX),
    T('eiscreme', 'Eisdiele', 'pearl', 'eiscreme', ['#ff8fa3', '#ffb47a', '#fff0a0', '#a8e6a3', '#9cdcf5', '#b0b6ff', '#dcb0ff'], LIGHT('#6b4a33', '#ff8fa3', '#fbead8'),
      lightBoard('#fffdf9', '#fbf0e3', 'rgba(130,90,50,0.08)', '#ffffff', 'rgba(130,90,50,0.28)', 0.5), drift(['#ffffff', '#ffd9b3']), CALM_FX),
    T('zuckerwatte', 'Zuckerwatte', 'soft', 'zuckerwatte', PASTEL, LIGHT('#6a3e78', '#e58ad6', '#f3dbff'),
      lightBoard('#ffffff', '#fbf1ff', 'rgba(170,100,200,0.08)', '#ffffff', 'rgba(170,100,200,0.3)', 0.3), drift(['#ffffff', '#ffd1f0', '#d1ecff']), CALM_FX),
    T('honig', 'Honigwabe', 'candy', 'honig', ['#f07a7a', '#f7a24a', '#f8cf4d', '#9ccc6a', '#7cc6d8', '#8c9ee0', '#c08fd8'], LIGHT('#6b4410', '#f0a52a', '#ffe6ad'),
      lightBoard('#fffaf0', '#fdefd0', 'rgba(170,110,20,0.09)', '#ffffff', 'rgba(170,110,20,0.3)', 0.2), drift(['#fff4c2', '#ffffff']), CALM_FX),
    T('seifenblasen', 'Seifenblasen', 'bubble', 'seifenblasen', ['#ff8fa8', '#ffbd8a', '#ffe68f', '#a6e3b5', '#8fd3ff', '#a6b4ff', '#d6aaff'], LIGHT('#2f5a7a', '#5aaee0', '#d4ecfb'),
      lightBoard('#ffffff', '#eef7fe', 'rgba(70,150,210,0.08)', '#ffffff', 'rgba(70,150,210,0.28)', 0.5), drift(['#ffffff'], true), CALM_FX),
    T('pfirsich', 'Pfirsichgarten', 'clay', 'pfirsich', ['#ff8a80', '#ffae70', '#ffe08a', '#a8d98a', '#86cfe0', '#9ba6e8', '#d19be0'], LIGHT('#7a3d2a', '#ff9a6b', '#ffdcc6'),
      lightBoard('#fffaf7', '#fff0e8', 'rgba(200,110,70,0.08)', '#ffffff', 'rgba(200,110,70,0.3)', 0.26), drift(['#ffffff', '#ffd9c2']), CALM_FX),
    T('gummibaer', 'Gummibärchen', 'gummi', 'gummibaer', ['#ff6f80', '#ffa040', '#ffe14d', '#7ad66b', '#58c8f0', '#7a8cff', '#c77dff'], LIGHT('#5a4420', '#ff9a3c', '#fff2cc'),
      lightBoard('#fffdf5', '#fff5dd', 'rgba(160,110,20,0.08)', '#ffffff', 'rgba(160,110,20,0.28)', 0.3), drift(['#ffffff', '#ffe9a8']), CALM_FX),
    T('regenbogen', 'Pastell-Regenbogen', 'soft', 'regenbogen', PASTEL, LIGHT('#3d4f78', '#7fa6ff', '#e6f2ff'),
      lightBoard('#ffffff', '#f0f6ff', 'rgba(80,120,220,0.08)', '#ffffff', 'rgba(80,120,220,0.28)', 0.26), drift(['#ffffff']), CALM_FX),
    T('marshmallow', 'Marshmallow', 'soft', 'marshmallow', ['#ffb0bd', '#ffcba4', '#fff0b3', '#c4ecc4', '#bfe3f7', '#c7ccff', '#e6c6ff'], LIGHT('#5c3a2e', '#e38f9f', '#ecd9cc'),
      lightBoard('#fffaf7', '#f8ece5', 'rgba(120,70,50,0.08)', '#ffffff', 'rgba(120,70,50,0.28)', 0.34), drift(['#ffffff', '#ffe4ea']), CALM_FX),
    T('wiese', 'Frühlingswiese', 'clay', 'wiese', ['#ff8c9e', '#ffb070', '#ffe27a', '#8fd68a', '#7fcfe8', '#90a0f0', '#c99af0'], LIGHT('#2f5a3a', '#5fbf7a', '#d9f3e4'),
      lightBoard('#ffffff', '#eefbf2', 'rgba(60,150,90,0.08)', '#ffffff', 'rgba(60,150,90,0.28)', 0.3), drift(['#ffffff', '#ffd1e0']), CALM_FX)
  );

  // Unruhige, düstere oder technische Designs sind abgeschaltet. Zum Wiedereinschalten die Kennung hier entfernen.
  const OFF = ['neon', 'lava', 'pixel', 'bricks', 'knit', 'popart', 'obst', 'monster', 'platine', 'kathedrale', 'marrakesch', 'hologramm', 'disco', 'tusche',
    'lcd', 'casino', 'station', 'geister', 'blaupause', 'kreide', 'pharao', 'olymp', 'schiefer'];
  for (let i = P.THEMES.length - 1; i >= 0; i--) if (OFF.includes(P.THEMES[i].id)) P.THEMES.splice(i, 1);
})();
