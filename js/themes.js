/* Prisma – Designs: Block-Renderer, Hintergründe und Brett-Stile */
(function () {
  'use strict';
  const P = (window.PRISMA = window.PRISMA || {});
  const TAU = Math.PI * 2;

  /* ---------- deterministischer Zufall für Texturen ---------- */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- Farb-Helfer ---------- */
  const _rgb = {};
  function rgb(c) {
    let v = _rgb[c];
    if (v) return v;
    if (c[0] === '#') {
      let h = c.slice(1);
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      const n = parseInt(h, 16);
      v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    } else {
      const m = c.match(/[\d.]+/g);
      v = [+m[0], +m[1], +m[2]];
    }
    return (_rgb[c] = v);
  }
  function mix(a, b, t) {
    const A = rgb(a), B = rgb(b);
    return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * t) + ',' + Math.round(A[1] + (B[1] - A[1]) * t) + ',' + Math.round(A[2] + (B[2] - A[2]) * t) + ')';
  }
  const lighten = (c, t) => mix(c, '#ffffff', t);
  const darken = (c, t) => mix(c, '#000000', t);
  function rgba(c, a) { const A = rgb(c); return 'rgba(' + A[0] + ',' + A[1] + ',' + A[2] + ',' + a + ')'; }

  /* ---------- Pfad-Helfer ---------- */
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  function poly(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
  }
  function star4(ctx, x, y, r, color, alpha) {
    if (r <= 0) return;
    const k = r * 0.2;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + k, y - k, x + r, y);
    ctx.quadraticCurveTo(x + k, y + k, x, y + r);
    ctx.quadraticCurveTo(x - k, y + k, x - r, y);
    ctx.quadraticCurveTo(x - k, y - k, x, y - r);
    ctx.fill();
    ctx.restore();
  }
  // Lichtkante oben links, Schattenkante unten rechts
  function bevel(ctx, x, y, w, r, lw, light, dark) {
    ctx.save();
    rr(ctx, x, y, w, w, r); ctx.clip();
    const g = ctx.createLinearGradient(x, y, x + w, y + w);
    g.addColorStop(0, light); g.addColorStop(0.5, 'rgba(128,128,128,0)'); g.addColorStop(1, dark);
    ctx.strokeStyle = g; ctx.lineWidth = lw * 2;
    rr(ctx, x, y, w, w, r); ctx.stroke();
    ctx.restore();
  }
  function innerShadow(ctx, x, y, w, r, color, blur, ox, oy) {
    ctx.save();
    rr(ctx, x, y, w, w, r); ctx.clip();
    ctx.shadowColor = color; ctx.shadowBlur = blur; ctx.shadowOffsetX = ox; ctx.shadowOffsetY = oy;
    ctx.lineWidth = blur * 2; ctx.strokeStyle = color;
    rr(ctx, x - blur, y - blur, w + blur * 2, w + blur * 2, r + blur); ctx.stroke();
    ctx.restore();
  }

  /* =====================================================================
     Block-Renderer – zeichnen einen Stein in die Box [0,s]×[0,s] (Gerätepixel)
     ===================================================================== */
  const BLOCKS = {
    jewel(ctx, s, c) {
      const g = s * 0.04, x = g, y = g, w = s - 2 * g, r = s * 0.17, b = w * 0.21;
      const x1 = x + b, y1 = y + b, x2 = x + w - b, y2 = y + w - b;
      ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
      ctx.fillStyle = c; ctx.fillRect(x, y, w, w);
      poly(ctx, [[x, y], [x + w, y], [x2, y1], [x1, y1]]); ctx.fillStyle = lighten(c, 0.58); ctx.fill();
      poly(ctx, [[x, y], [x1, y1], [x1, y2], [x, y + w]]); ctx.fillStyle = lighten(c, 0.24); ctx.fill();
      poly(ctx, [[x + w, y], [x + w, y + w], [x2, y2], [x2, y1]]); ctx.fillStyle = darken(c, 0.2); ctx.fill();
      poly(ctx, [[x, y + w], [x1, y2], [x2, y2], [x + w, y + w]]); ctx.fillStyle = darken(c, 0.44); ctx.fill();
      ctx.restore();
      let gr = ctx.createLinearGradient(x1, y1, x2, y2);
      gr.addColorStop(0, lighten(c, 0.22)); gr.addColorStop(0.55, c); gr.addColorStop(1, darken(c, 0.14));
      rr(ctx, x1, y1, x2 - x1, y2 - y1, s * 0.04); ctx.fillStyle = gr; ctx.fill();
      ctx.save(); rr(ctx, x1, y1, x2 - x1, y2 - y1, s * 0.04); ctx.clip();
      const iw = x2 - x1;
      ctx.globalAlpha = 0.32; ctx.fillStyle = '#fff';
      poly(ctx, [[x1, y1 + iw * 0.5], [x1 + iw * 0.5, y1], [x1 + iw * 0.82, y1], [x1, y1 + iw * 0.82]]); ctx.fill();
      ctx.globalAlpha = 0.16;
      poly(ctx, [[x1 + iw * 0.35, y2], [x2, y1 + iw * 0.35], [x2, y1 + iw * 0.5], [x1 + iw * 0.5, y2]]); ctx.fill();
      ctx.restore();
      star4(ctx, x + w * 0.25, y + w * 0.25, s * 0.1, '#ffffff', 0.95);
      rr(ctx, x, y, w, w, r); ctx.strokeStyle = rgba(darken(c, 0.6), 0.75); ctx.lineWidth = Math.max(1, s * 0.028); ctx.stroke();
    },

    neon(ctx, s, c) {
      const g = s * 0.1, x = g, y = g, w = s - 2 * g, r = s * 0.15;
      rr(ctx, x, y, w, w, r); ctx.fillStyle = rgba(darken(c, 0.72), 0.92); ctx.fill();
      const gr = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, w * 0.72);
      gr.addColorStop(0, rgba(c, 0.55)); gr.addColorStop(1, rgba(c, 0.04));
      ctx.fillStyle = gr; ctx.fill();
      ctx.save();
      ctx.shadowColor = c; ctx.shadowBlur = s * 0.24; ctx.strokeStyle = c; ctx.lineWidth = s * 0.075;
      rr(ctx, x, y, w, w, r); ctx.stroke(); ctx.stroke();
      ctx.restore();
      rr(ctx, x, y, w, w, r); ctx.strokeStyle = lighten(c, 0.78); ctx.lineWidth = Math.max(1, s * 0.026); ctx.stroke();
      const i = w * 0.3;
      ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = s * 0.12;
      rr(ctx, x + i, y + i, w - 2 * i, w - 2 * i, s * 0.05); ctx.fillStyle = rgba(lighten(c, 0.6), 0.85); ctx.fill();
      ctx.restore();
    },

    candy(ctx, s, c) {
      const g = s * 0.055, x = g, y = g, w = s - 2 * g, r = s * 0.3;
      ctx.save();
      ctx.shadowColor = rgba(darken(c, 0.6), 0.5); ctx.shadowBlur = s * 0.08; ctx.shadowOffsetY = s * 0.045;
      const gr = ctx.createRadialGradient(x + w * 0.35, y + w * 0.3, w * 0.05, x + w * 0.5, y + w * 0.5, w * 0.82);
      gr.addColorStop(0, lighten(c, 0.5)); gr.addColorStop(0.5, c); gr.addColorStop(1, darken(c, 0.32));
      rr(ctx, x, y, w, w, r); ctx.fillStyle = gr; ctx.fill();
      ctx.restore();
      ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
      ctx.globalAlpha = 0.17; ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.09;
      ctx.beginPath();
      for (let i = -3; i < 4; i++) { ctx.moveTo(x + i * s * 0.28, y + w); ctx.lineTo(x + i * s * 0.28 + w, y); }
      ctx.stroke();
      ctx.restore();
      const gl = ctx.createLinearGradient(0, y + w * 0.08, 0, y + w * 0.46);
      gl.addColorStop(0, 'rgba(255,255,255,0.9)'); gl.addColorStop(1, 'rgba(255,255,255,0.04)');
      ctx.beginPath(); ctx.ellipse(x + w * 0.5, y + w * 0.27, w * 0.36, w * 0.18, 0, 0, TAU); ctx.fillStyle = gl; ctx.fill();
      ctx.beginPath(); ctx.arc(x + w * 0.77, y + w * 0.78, w * 0.05, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
    },

    wood(ctx, s, c, rnd) {
      const g = s * 0.035, x = g, y = g, w = s - 2 * g, r = s * 0.1;
      ctx.save();
      ctx.shadowColor = 'rgba(40,20,5,0.5)'; ctx.shadowBlur = s * 0.06; ctx.shadowOffsetY = s * 0.035;
      const gr = ctx.createLinearGradient(x, y, x + w, y + w);
      gr.addColorStop(0, lighten(c, 0.2)); gr.addColorStop(1, darken(c, 0.14));
      rr(ctx, x, y, w, w, r); ctx.fillStyle = gr; ctx.fill();
      ctx.restore();
      ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
      for (let i = 0; i < 7; i++) {
        const yy = y + (w * (i + 0.5)) / 7 + (rnd() - 0.5) * w * 0.07;
        ctx.beginPath(); ctx.moveTo(x - 2, yy);
        ctx.bezierCurveTo(x + w * 0.3, yy + (rnd() - 0.5) * w * 0.18, x + w * 0.7, yy + (rnd() - 0.5) * w * 0.18, x + w + 2, yy + (rnd() - 0.5) * w * 0.1);
        ctx.strokeStyle = rgba(darken(c, 0.5), 0.14 + rnd() * 0.2); ctx.lineWidth = s * (0.012 + rnd() * 0.022); ctx.stroke();
      }
      if (rnd() < 0.65) {
        const kx = x + w * (0.25 + rnd() * 0.5), ky = y + w * (0.25 + rnd() * 0.5);
        for (let k = 3; k > 0; k--) {
          ctx.beginPath(); ctx.ellipse(kx, ky, w * 0.05 * k, w * 0.03 * k, 0.3, 0, TAU);
          ctx.strokeStyle = rgba(darken(c, 0.55), 0.24); ctx.lineWidth = s * 0.015; ctx.stroke();
        }
      }
      ctx.restore();
      bevel(ctx, x, y, w, r, s * 0.05, 'rgba(255,240,210,0.65)', 'rgba(50,25,5,0.5)');
    },

    glass(ctx, s, c) {
      const g = s * 0.05, x = g, y = g, w = s - 2 * g, r = s * 0.22;
      let gr = ctx.createLinearGradient(0, y, 0, y + w);
      gr.addColorStop(0, rgba(lighten(c, 0.4), 0.9)); gr.addColorStop(1, rgba(darken(c, 0.12), 0.78));
      rr(ctx, x, y, w, w, r); ctx.fillStyle = gr; ctx.fill();
      ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
      gr = ctx.createRadialGradient(x + w / 2, y + w * 0.9, 0, x + w / 2, y + w * 0.9, w * 0.75);
      gr.addColorStop(0, rgba(lighten(c, 0.75), 0.7)); gr.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = gr; ctx.fillRect(x, y, w, w);
      ctx.globalAlpha = 0.26; ctx.fillStyle = '#fff';
      poly(ctx, [[x + w * 0.55, y], [x + w * 0.8, y], [x, y + w * 0.8], [x, y + w * 0.55]]); ctx.fill();
      ctx.restore();
      gr = ctx.createLinearGradient(0, y + w * 0.06, 0, y + w * 0.4);
      gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      rr(ctx, x + w * 0.12, y + w * 0.07, w * 0.76, w * 0.32, w * 0.16); ctx.fillStyle = gr; ctx.fill();
      // kleine Luftblasen
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(x + w * 0.72, y + w * 0.68, w * 0.055, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + w * 0.6, y + w * 0.8, w * 0.03, 0, TAU); ctx.fill();
      rr(ctx, x, y, w, w, r); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
    },

    ice(ctx, s, c, rnd) {
      const g = s * 0.04, x = g, y = g, w = s - 2 * g, r = s * 0.13;
      const ic = mix(c, '#e2f6ff', 0.4);
      const gr = ctx.createLinearGradient(x, y, x + w, y + w);
      gr.addColorStop(0, lighten(ic, 0.55)); gr.addColorStop(0.5, ic); gr.addColorStop(1, darken(c, 0.12));
      rr(ctx, x, y, w, w, r); ctx.fillStyle = gr; ctx.fill();
      ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      poly(ctx, [[x, y], [x + w * 0.62, y], [x + w * 0.2, y + w * 0.5], [x, y + w * 0.36]]); ctx.fill();
      ctx.fillStyle = rgba(darken(c, 0.4), 0.22);
      poly(ctx, [[x + w, y + w], [x + w * 0.35, y + w], [x + w * 0.75, y + w * 0.55], [x + w, y + w * 0.6]]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.78)'; ctx.lineWidth = Math.max(1, s * 0.018); ctx.lineJoin = 'round';
      for (let i = 0; i < 2; i++) {
        let px = x + w * (0.2 + rnd() * 0.6), py = y + w * i;
        ctx.beginPath(); ctx.moveTo(px, py);
        for (let k = 0; k < 3; k++) { px += (rnd() - 0.5) * w * 0.36; py += (i ? -1 : 1) * w * (0.12 + rnd() * 0.12); ctx.lineTo(px, py); }
        ctx.stroke();
      }
      ctx.restore();
      star4(ctx, x + w * 0.74, y + w * 0.28, s * 0.085, '#ffffff', 0.9);
      innerShadow(ctx, x, y, w, r, rgba(darken(c, 0.55), 0.45), s * 0.07, -s * 0.03, -s * 0.03);
      rr(ctx, x, y, w, w, r); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
    },

    orb(ctx, s, c, rnd) {
      const g = s * 0.05, x = g, y = g, w = s - 2 * g, r = s * 0.24;
      let gr = ctx.createLinearGradient(0, y, 0, y + w);
      gr.addColorStop(0, mix(c, '#0e0a2a', 0.7)); gr.addColorStop(1, mix(c, '#05030f', 0.86));
      rr(ctx, x, y, w, w, r); ctx.fillStyle = gr; ctx.fill();
      ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.35 + rnd() * 0.55) + ')';
        ctx.beginPath(); ctx.arc(x + rnd() * w, y + rnd() * w, Math.max(0.6, s * 0.012), 0, TAU); ctx.fill();
      }
      ctx.restore();
      ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = s * 0.2;
      gr = ctx.createRadialGradient(s * 0.44, s * 0.42, 0, s / 2, s / 2, w * 0.3);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.3, lighten(c, 0.45)); gr.addColorStop(0.8, c); gr.addColorStop(1, darken(c, 0.25));
      ctx.beginPath(); ctx.arc(s / 2, s / 2, w * 0.27, 0, TAU); ctx.fillStyle = gr; ctx.fill();
      ctx.restore();
      ctx.save(); ctx.translate(s / 2, s / 2); ctx.rotate(-0.45);
      ctx.beginPath(); ctx.ellipse(0, 0, w * 0.42, w * 0.12, 0, 0.12, Math.PI - 0.12);
      ctx.strokeStyle = rgba(lighten(c, 0.65), 0.9); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
      ctx.restore();
      rr(ctx, x, y, w, w, r); ctx.strokeStyle = rgba(lighten(c, 0.2), 0.85); ctx.lineWidth = Math.max(1, s * 0.03); ctx.stroke();
    },

    lava(ctx, s, c, rnd) {
      const g = s * 0.045, x = g, y = g, w = s - 2 * g, r = s * 0.11;
      ctx.save(); ctx.shadowColor = c; ctx.shadowBlur = s * 0.2;
      rr(ctx, x, y, w, w, r); ctx.fillStyle = '#1a100e'; ctx.fill();
      ctx.restore();
      let gr = ctx.createLinearGradient(x, y, x + w, y + w);
      gr.addColorStop(0, '#4a3833'); gr.addColorStop(1, '#150d0b');
      rr(ctx, x, y, w, w, r); ctx.fillStyle = gr; ctx.fill();
      ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
      gr = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, w * 0.34);
      gr.addColorStop(0, rgba(lighten(c, 0.5), 0.95)); gr.addColorStop(0.5, rgba(c, 0.6)); gr.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = gr; ctx.fillRect(x, y, w, w);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0; i < 4; i++) {
        const a0 = rnd() * TAU;
        const px = s / 2 + Math.cos(a0) * w * 0.62, py = s / 2 + Math.sin(a0) * w * 0.62;
        const tx = s / 2 + (rnd() - 0.5) * w * 0.2, ty = s / 2 + (rnd() - 0.5) * w * 0.2;
        ctx.beginPath(); ctx.moveTo(px, py);
        for (let k = 1; k <= 4; k++) {
          const t = k / 4, j = k < 4 ? w * 0.15 : 0;
          ctx.lineTo(px + (tx - px) * t + (rnd() - 0.5) * j, py + (ty - py) * t + (rnd() - 0.5) * j);
        }
        ctx.shadowColor = c; ctx.shadowBlur = s * 0.12;
        ctx.strokeStyle = c; ctx.lineWidth = s * 0.065; ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = lighten(c, 0.72); ctx.lineWidth = Math.max(1, s * 0.022); ctx.stroke();
      }
      ctx.restore();
      bevel(ctx, x, y, w, r, s * 0.035, 'rgba(255,220,190,0.35)', 'rgba(0,0,0,0.6)');
    },

    pixel(ctx, s, c) {
      const g = Math.round(s * 0.04), u = (s - 2 * g) / 8;
      const px = (i, j, wi, hj, col) => {
        ctx.fillStyle = col;
        const x0 = Math.round(g + i * u), y0 = Math.round(g + j * u);
        ctx.fillRect(x0, y0, Math.round(g + (i + wi) * u) - x0, Math.round(g + (j + hj) * u) - y0);
      };
      px(1, 0, 6, 8, darken(c, 0.62)); px(0, 1, 8, 6, darken(c, 0.62));
      px(1, 1, 6, 6, c);
      px(1, 1, 6, 1, lighten(c, 0.5)); px(1, 2, 1, 5, lighten(c, 0.3));
      px(1, 6, 6, 1, darken(c, 0.38)); px(6, 1, 1, 5, darken(c, 0.24));
      px(1, 1, 1, 1, lighten(c, 0.85));
      px(3, 3, 2, 1, lighten(c, 0.55)); px(3, 4, 1, 1, lighten(c, 0.55));
      px(5, 5, 1, 1, darken(c, 0.2));
    },

    royal(ctx, s, c) {
      const g = s * 0.04, x = g, y = g, w = s - 2 * g, r = s * 0.15;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = s * 0.07; ctx.shadowOffsetY = s * 0.03;
      let gr = ctx.createLinearGradient(x, y, x + w, y + w);
      gr.addColorStop(0, '#fff6c2'); gr.addColorStop(0.3, '#e9bd4a'); gr.addColorStop(0.62, '#8f5f14'); gr.addColorStop(0.85, '#f3d374'); gr.addColorStop(1, '#a8741c');
      rr(ctx, x, y, w, w, r); ctx.fillStyle = gr; ctx.fill();
      ctx.restore();
      const b = w * 0.15;
      rr(ctx, x + b, y + b, w - 2 * b, w - 2 * b, r * 0.6); ctx.fillStyle = darken(c, 0.68); ctx.fill();
      const b2 = w * 0.19, gx = x + b2, gy = y + b2, gw = w - 2 * b2;
      gr = ctx.createRadialGradient(gx + gw * 0.3, gy + gw * 0.28, 0, gx + gw / 2, gy + gw / 2, gw * 0.85);
      gr.addColorStop(0, lighten(c, 0.75)); gr.addColorStop(0.45, c); gr.addColorStop(1, darken(c, 0.5));
      rr(ctx, gx, gy, gw, gw, r * 0.45); ctx.fillStyle = gr; ctx.fill();
      ctx.save(); rr(ctx, gx, gy, gw, gw, r * 0.45); ctx.clip();
      const m = gw * 0.26;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = Math.max(1, s * 0.016);
      ctx.beginPath();
      ctx.moveTo(gx, gy); ctx.lineTo(gx + m, gy + m); ctx.moveTo(gx + gw, gy); ctx.lineTo(gx + gw - m, gy + m);
      ctx.moveTo(gx, gy + gw); ctx.lineTo(gx + m, gy + gw - m); ctx.moveTo(gx + gw, gy + gw); ctx.lineTo(gx + gw - m, gy + gw - m);
      ctx.rect(gx + m, gy + m, gw - 2 * m, gw - 2 * m);
      ctx.stroke();
      ctx.restore();
      star4(ctx, gx + gw * 0.3, gy + gw * 0.3, s * 0.09, '#ffffff', 0.95);
      rr(ctx, x, y, w, w, r); ctx.strokeStyle = 'rgba(70,42,6,0.85)'; ctx.lineWidth = Math.max(1, s * 0.022); ctx.stroke();
      ctx.save(); rr(ctx, x, y, w, w, r); ctx.clip();
      ctx.strokeStyle = 'rgba(255,250,210,0.75)'; ctx.lineWidth = Math.max(1, s * 0.03);
      ctx.beginPath(); ctx.moveTo(x + w * 0.1, y + w * 0.5); ctx.lineTo(x + w * 0.1, y + w * 0.1); ctx.lineTo(x + w * 0.5, y + w * 0.1); ctx.stroke();
      ctx.restore();
    },

    clay(ctx, s, c) {
      const g = s * 0.06, x = g, y = g, w = s - 2 * g, r = s * 0.27;
      ctx.save();
      ctx.shadowColor = rgba(darken(c, 0.55), 0.4); ctx.shadowBlur = s * 0.1; ctx.shadowOffsetY = s * 0.055;
      const gr = ctx.createLinearGradient(x, y, x + w, y + w);
      gr.addColorStop(0, lighten(c, 0.12)); gr.addColorStop(1, darken(c, 0.06));
      rr(ctx, x, y, w, w, r); ctx.fillStyle = gr; ctx.fill();
      ctx.restore();
      innerShadow(ctx, x, y, w, r, 'rgba(255,255,255,0.85)', s * 0.1, s * 0.055, s * 0.055);
      innerShadow(ctx, x, y, w, r, rgba(darken(c, 0.5), 0.5), s * 0.1, -s * 0.055, -s * 0.055);
      // eingeprägte Blüte
      ctx.save(); ctx.translate(s / 2, s / 2);
      for (let i = 0; i < 5; i++) {
        ctx.rotate(TAU / 5);
        ctx.beginPath(); ctx.ellipse(0, -w * 0.13, w * 0.065, w * 0.1, 0, 0, TAU);
        ctx.fillStyle = 'rgba(255,255,255,0.42)'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(0, 0, w * 0.05, 0, TAU); ctx.fillStyle = rgba(darken(c, 0.25), 0.55); ctx.fill();
      ctx.restore();
    },

    paper(ctx, s, c) {
      const g = s * 0.055, x = g, y = g, w = s - 2 * g, cx = s / 2, cy = s / 2;
      ctx.save();
      ctx.shadowColor = 'rgba(30,30,50,0.35)'; ctx.shadowBlur = s * 0.07; ctx.shadowOffsetY = s * 0.04;
      ctx.fillStyle = c; ctx.fillRect(x, y, w, w);
      ctx.restore();
      poly(ctx, [[x, y], [x + w, y], [cx, cy]]); ctx.fillStyle = lighten(c, 0.3); ctx.fill();
      poly(ctx, [[x, y], [cx, cy], [x, y + w]]); ctx.fillStyle = lighten(c, 0.1); ctx.fill();
      poly(ctx, [[x + w, y], [x + w, y + w], [cx, cy]]); ctx.fillStyle = darken(c, 0.1); ctx.fill();
      poly(ctx, [[x, y + w], [cx, cy], [x + w, y + w]]); ctx.fillStyle = darken(c, 0.26); ctx.fill();
      // umgeknickte Ecke
      const k = w * 0.26;
      poly(ctx, [[x + w - k, y], [x + w, y], [x + w, y + k]]); ctx.fillStyle = darken(c, 0.34); ctx.fill();
      poly(ctx, [[x + w - k, y], [x + w - k, y + k], [x + w, y + k]]); ctx.fillStyle = lighten(c, 0.5); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = Math.max(1, s * 0.014);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y + w); ctx.moveTo(x, y + w); ctx.lineTo(x + w - k, y + k); ctx.stroke();
    },
  };

  const SPRITE_MARGIN = 0.22;
  function makeSprite(style, color, s, seed) {
    const full = Math.ceil(s * (1 + 2 * SPRITE_MARGIN));
    const cv = document.createElement('canvas');
    cv.width = cv.height = full;
    const g = cv.getContext('2d'), off = (full - s) / 2;
    g.translate(off, off);
    BLOCKS[style](g, s, color, rng(seed || 1));
    return cv;
  }

  /* =====================================================================
     Hintergründe – malen in CSS-Pixeln (ctx ist bereits skaliert)
     ===================================================================== */
  function vgrad(ctx, W, H, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function glow(ctx, W, H, x, y, r, c0, c1) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c0); g.addColorStop(1, c1);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function vignette(ctx, W, H, a, col) {
    const r = Math.hypot(W, H) / 2;
    const g = ctx.createRadialGradient(W / 2, H / 2, r * 0.45, W / 2, H / 2, r);
    g.addColorStop(0, rgba(col || '#000000', 0)); g.addColorStop(1, rgba(col || '#000000', a));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function leaf(ctx, x, y, len, wid, ang, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(len * 0.45, -wid * 2, len, 0);
    ctx.quadraticCurveTo(len * 0.45, wid * 2, 0, 0);
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len * 0.96, 0); ctx.stroke();
    ctx.restore();
  }
  function flower(ctx, x, y, r, petal, heart) {
    ctx.fillStyle = petal;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU - Math.PI / 2;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.78, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = heart; ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, TAU); ctx.fill();
  }
  function mountains(ctx, W, H, rnd, baseY, amp, color, n) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, baseY);
    for (let i = 0; i <= n; i++) ctx.lineTo((i / n) * W, baseY - (i % 2 ? amp * (0.5 + rnd() * 0.6) : amp * rnd() * 0.3));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
  }

  const BG = {
    jewel(ctx, W, H, rnd) {
      vgrad(ctx, W, H, ['#0e4f4c', '#0b2c58', '#0a1233']);
      const ts = Math.max(30, W / 11);
      ctx.fillStyle = 'rgba(255,255,255,0.022)';
      for (let y = 0, row = 0; y < H; y += ts, row++)
        for (let x = row % 2 ? -ts / 2 : 0; x < W; x += ts) { rr(ctx, x + 2, y + 2, ts - 4, ts - 4, ts * 0.14); ctx.fill(); }
      glow(ctx, W, H, W / 2, 0, Math.max(W, H) * 0.75, 'rgba(110,255,200,0.24)', 'rgba(110,255,200,0)');
      const greens = ['#17693b', '#1f8a4c', '#2fae5e', '#3bc46f', '#0f5230'];
      const len = Math.min(W, H) * 0.34;
      for (let side = 0; side < 2; side++)
        for (let i = 0; i < 7; i++) {
          const ang = 0.08 + i * 0.2 + rnd() * 0.08;
          leaf(ctx, side ? W + 6 : -6, -6, len * (0.65 + rnd() * 0.5), len * (0.1 + rnd() * 0.06), side ? Math.PI - ang : ang, greens[(rnd() * greens.length) | 0]);
        }
      for (let i = 0; i < 4; i++)
        flower(ctx, i < 2 ? W * (0.08 + rnd() * 0.16) : W * (0.76 + rnd() * 0.16), H * (0.02 + rnd() * 0.05), Math.max(4, Math.min(W, H) * 0.016), '#ffffff', '#ffd84a');
      vignette(ctx, W, H, 0.5);
    },

    neon(ctx, W, H, rnd) {
      vgrad(ctx, W, H, ['#0d0221', '#1b0540', '#090014']);
      for (let i = 0; i < 90; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + rnd() * 0.6) + ')'; ctx.fillRect(rnd() * W, rnd() * H * 0.6, 1.2, 1.2); }
      const hy = H * 0.64;
      glow(ctx, W, H, W / 2, hy, Math.max(W, H) * 0.55, 'rgba(255,46,136,0.36)', 'rgba(255,46,136,0)');
      const g = ctx.createLinearGradient(0, hy, 0, H);
      g.addColorStop(0, '#2a0550'); g.addColorStop(1, '#07000f');
      ctx.fillStyle = g; ctx.fillRect(0, hy, W, H - hy);
      ctx.strokeStyle = 'rgba(255,60,200,0.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = -14; i <= 14; i++) { ctx.moveTo(W / 2 + i * W * 0.035, hy); ctx.lineTo(W / 2 + i * W * 0.32, H); }
      for (let k = 0; k < 12; k++) { const y = hy + (H - hy) * Math.pow(k / 11, 2.2); ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(34,230,255,0.9)'; ctx.fillRect(0, hy - 1, W, 2);
      vignette(ctx, W, H, 0.55);
    },

    candy(ctx, W, H, rnd) {
      vgrad(ctx, W, H, ['#ff86bd', '#ffac9c', '#ffd58a']);
      ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(14, W * 0.05);
      ctx.beginPath();
      for (let x = -H; x < W; x += Math.max(40, W * 0.14)) { ctx.moveTo(x, H); ctx.lineTo(x + H, 0); }
      ctx.stroke(); ctx.restore();
      for (let i = 0; i < 16; i++) {
        ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, (0.05 + rnd() * 0.16) * W, 0, TAU);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.05 + rnd() * 0.1) + ')'; ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.36)'; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * 0.95);
      const n = 6;
      for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(((i - 0.5) / n) * W, H * (0.9 - rnd() * 0.05), (i / n) * W, H * 0.95);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      glow(ctx, W, H, W * 0.5, H * 0.1, Math.max(W, H) * 0.7, 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0)');
    },

    wood(ctx, W, H, rnd) {
      vgrad(ctx, W, H, ['#f4e2c2', '#e8cc9c', '#d9b47c']);
      const pw = Math.max(48, W / 6);
      for (let x = 0; x < W; x += pw) {
        ctx.fillStyle = rgba('#8a5a2b', 0.02 + rnd() * 0.08); ctx.fillRect(x, 0, pw, H);
        for (let k = 0; k < 9; k++) {
          const gx = x + rnd() * pw;
          ctx.beginPath(); ctx.moveTo(gx, 0);
          ctx.bezierCurveTo(gx + (rnd() - 0.5) * pw * 0.4, H * 0.3, gx + (rnd() - 0.5) * pw * 0.4, H * 0.7, gx + (rnd() - 0.5) * pw * 0.3, H);
          ctx.strokeStyle = rgba('#7a4a20', 0.05 + rnd() * 0.07); ctx.lineWidth = 0.6 + rnd() * 1.3; ctx.stroke();
        }
        ctx.fillStyle = 'rgba(90,50,20,0.22)'; ctx.fillRect(x, 0, 1.5, H);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x + 1.5, 0, 1, H);
      }
      glow(ctx, W, H, W * 0.2, H * 0.1, Math.max(W, H) * 0.8, 'rgba(255,250,235,0.45)', 'rgba(255,250,235,0)');
      vignette(ctx, W, H, 0.28, '#5a3414');
    },

    ice(ctx, W, H, rnd) {
      vgrad(ctx, W, H, ['#050f2a', '#0c2752', '#1a5586']);
      for (let i = 0; i < 110; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + rnd() * 0.7) + ')';
        const s = 0.6 + rnd() * 1.2; ctx.fillRect(rnd() * W, rnd() * H * 0.7, s, s);
      }
      const cols = ['90,255,190', '120,200,255', '190,130,255'];
      for (let b = 0; b < 3; b++) {
        const base = H * (0.13 + b * 0.09), amp = H * 0.035, f = ((1.5 + rnd() * 2) / W) * TAU, ph = rnd() * TAU, hh = H * (0.16 + rnd() * 0.08);
        for (let x = 0; x < W; x += 3) {
          const y = base + Math.sin(x * f + ph) * amp + Math.sin(x * f * 2.3 + ph) * amp * 0.4;
          const a = 0.1 + 0.08 * Math.sin(x * f * 3.1 + ph * 2);
          const g = ctx.createLinearGradient(0, y - hh, 0, y + hh * 0.25);
          g.addColorStop(0, 'rgba(' + cols[b] + ',0)'); g.addColorStop(0.75, 'rgba(' + cols[b] + ',' + a + ')'); g.addColorStop(1, 'rgba(' + cols[b] + ',0)');
          ctx.fillStyle = g; ctx.fillRect(x, y - hh, 3.5, hh * 1.25);
        }
      }
      mountains(ctx, W, H, rnd, H * 0.82, H * 0.1, '#2f6ea6', 7);
      mountains(ctx, W, H, rnd, H * 0.9, H * 0.07, '#bfe3fb', 5);
      const g2 = ctx.createLinearGradient(0, H * 0.9, 0, H);
      g2.addColorStop(0, 'rgba(232,246,255,0)'); g2.addColorStop(1, 'rgba(232,246,255,0.9)');
      ctx.fillStyle = g2; ctx.fillRect(0, H * 0.9, W, H * 0.1);
      vignette(ctx, W, H, 0.4);
    },

    galaxy(ctx, W, H, rnd) {
      vgrad(ctx, W, H, ['#04010d', '#130a33', '#260d45']);
      const neb = ['255,63,164', '91,107,255', '34,211,238', '168,85,247'];
      for (let i = 0; i < 7; i++) {
        const x = rnd() * W, y = rnd() * H, r = Math.max(W, H) * (0.18 + rnd() * 0.3), c = neb[i % neb.length];
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, 'rgba(' + c + ',' + (0.14 + rnd() * 0.14) + ')'); g.addColorStop(1, 'rgba(' + c + ',0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      const n = Math.min(900, Math.round((W * H) / 2600));
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + rnd() * 0.75) + ')';
        ctx.beginPath(); ctx.arc(rnd() * W, rnd() * H, 0.4 + rnd() * rnd() * 1.6, 0, TAU); ctx.fill();
      }
      for (let i = 0; i < 6; i++) star4(ctx, rnd() * W, rnd() * H, 4 + rnd() * 6, '#ffffff', 0.8);
      vignette(ctx, W, H, 0.55);
    },

    lava(ctx, W, H, rnd) {
      vgrad(ctx, W, H, ['#0e0302', '#260704', '#5a1304']);
      glow(ctx, W, H, W / 2, H * 1.08, Math.max(W, H) * 0.8, 'rgba(255,120,20,0.6)', 'rgba(255,80,0,0)');
      for (let side = 0; side < 2; side++) {
        const sx = side ? W : 0, dir = side ? -1 : 1;
        ctx.fillStyle = '#0a0202'; ctx.beginPath(); ctx.moveTo(sx, 0);
        let y = 0;
        while (y < H) { ctx.lineTo(sx + dir * W * (0.02 + rnd() * 0.09), y); y += H * (0.03 + rnd() * 0.05); }
        ctx.lineTo(sx, H); ctx.closePath(); ctx.fill();
      }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 0; i < 9; i++) {
        let x = rnd() * W, y = H;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let k = 0; k < 5; k++) { x += (rnd() - 0.5) * W * 0.12; y -= H * (0.015 + rnd() * 0.03); ctx.lineTo(x, y); }
        ctx.strokeStyle = 'rgba(255,150,40,0.35)'; ctx.lineWidth = 4; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,230,150,0.6)'; ctx.lineWidth = 1.2; ctx.stroke();
      }
      vignette(ctx, W, H, 0.55);
    },

    pixel(ctx, W, H, rnd) {
      ctx.fillStyle = '#14143a'; ctx.fillRect(0, 0, W, H);
      const u = Math.max(2, Math.round(Math.min(W, H) / 110));
      const sn = v => Math.round(v / u) * u;
      ['#191948', '#1e1e56', '#252566', '#2d2d78'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, sn(H * (0.4 + i * 0.12)), W, H); });
      const sc = ['#ffffff', '#fee761', '#2ce8f5', '#ff6b97'];
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = sc[(rnd() * sc.length) | 0]; ctx.globalAlpha = 0.3 + rnd() * 0.7;
        ctx.fillRect(sn(rnd() * W), sn(rnd() * H * 0.75), u, u);
      }
      ctx.globalAlpha = 1;
      const mx = sn(W * 0.84), my = sn(H * 0.2), mr = 6;
      for (let y = -mr; y <= mr; y++)
        for (let x = -mr; x <= mr; x++)
          if (x * x + y * y <= mr * mr) { ctx.fillStyle = x + y < -2 ? '#fff7c9' : '#fee761'; ctx.fillRect(mx + x * u, my + y * u, u, u); }
      [['#1f6f50', 0.87, 0.04], ['#2a9d5c', 0.93, 0.03]].forEach(l => {
        ctx.fillStyle = l[0]; const ph = rnd() * 9;
        for (let x = 0; x < W; x += u * 3) { const y = sn(H * (l[1] + Math.sin((x / W) * 9 + ph) * l[2])); ctx.fillRect(x, y, u * 3, H - y); }
      });
      ctx.fillStyle = 'rgba(0,0,0,0.13)';
      for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1.5);
    },

    ocean(ctx, W, H, rnd) {
      vgrad(ctx, W, H, ['#1cc8da', '#0c82bd', '#063c7c', '#03143a']);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 8; i++) {
        const x0 = W * rnd(), w0 = W * (0.02 + rnd() * 0.05), x1 = x0 + (rnd() - 0.5) * W * 0.6, w1 = w0 * 4.5;
        const g = ctx.createLinearGradient(0, 0, 0, H * 0.85);
        g.addColorStop(0, 'rgba(255,255,255,0.17)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        poly(ctx, [[x0, 0], [x0 + w0, 0], [x1 + w1, H * 0.85], [x1, H * 0.85]]); ctx.fill();
      }
      ctx.restore();
      [['#052a5c', 0.9], ['#03183d', 0.94]].forEach(l => {
        const base = l[1], n = 5;
        ctx.fillStyle = l[0]; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, H * base);
        for (let i = 1; i <= n; i++) ctx.quadraticCurveTo(((i - 0.5) / n) * W, H * (base - 0.03 + rnd() * 0.06), (i / n) * W, H * (base + (rnd() - 0.5) * 0.02));
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      });
      ctx.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const x = rnd() * W, h = H * (0.04 + rnd() * 0.08);
        ctx.beginPath(); ctx.moveTo(x, H);
        ctx.bezierCurveTo(x - 10, H - h * 0.4, x + 12, H - h * 0.7, x + (rnd() - 0.5) * 14, H - h);
        ctx.strokeStyle = rnd() < 0.5 ? 'rgba(40,200,150,0.5)' : 'rgba(20,140,130,0.6)'; ctx.lineWidth = 2 + rnd() * 3; ctx.stroke();
      }
      vignette(ctx, W, H, 0.4, '#01082a');
    },

    royal(ctx, W, H) {
      vgrad(ctx, W, H, ['#2c1049', '#1a0930', '#0c0417']);
      const d = Math.max(30, W / 11);
      ctx.strokeStyle = 'rgba(255,215,120,0.075)'; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = -H; x < W + H; x += d) { ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.moveTo(x, 0); ctx.lineTo(x - H, H); }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,215,120,0.17)';
      for (let k = 0; (k * d) / 2 < H + d; k++)
        for (let x = ((k % 2) * d) / 2; x < W + d; x += d) { ctx.beginPath(); ctx.arc(x, (k * d) / 2, 1.4, 0, TAU); ctx.fill(); }
      glow(ctx, W, H, W / 2, H * 0.3, Math.max(W, H) * 0.65, 'rgba(255,200,120,0.2)', 'rgba(255,200,120,0)');
      vignette(ctx, W, H, 0.65);
    },

    sakura(ctx, W, H, rnd) {
      vgrad(ctx, W, H, ['#fff1f6', '#ffd6e6', '#f8b4d0']);
      glow(ctx, W, H, W * 0.72, H * 0.2, Math.max(W, H) * 0.5, 'rgba(255,255,255,0.9)', 'rgba(255,255,255,0)');
      // sanfte Hügel
      [['rgba(244,160,196,0.55)', 0.86, 0.035], ['rgba(236,128,176,0.6)', 0.92, 0.03]].forEach(l => {
        const ph = rnd() * TAU;
        ctx.fillStyle = l[0]; ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W + 8; x += 8) ctx.lineTo(x, H * (l[1] + Math.sin((x / W) * 5 + ph) * l[2]));
        ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      });
      const u = Math.min(W, H), by = H * 0.03;
      ctx.strokeStyle = '#6b3b3b'; ctx.lineCap = 'round';
      const br = (x0, y0, x1, y1, x2, y2, lw) => { ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x1, y1, x2, y2); ctx.stroke(); };
      br(W + 4, by, W - u * 0.2, by + u * 0.02, W - u * 0.42, by + u * 0.12, Math.max(2.5, u * 0.012));
      br(W - u * 0.2, by + u * 0.035, W - u * 0.22, by + u * 0.12, W - u * 0.14, by + u * 0.2, Math.max(1.5, u * 0.007));
      br(W - u * 0.32, by + u * 0.075, W - u * 0.4, by + u * 0.03, W - u * 0.5, by + u * 0.04, Math.max(1.5, u * 0.006));
      [[0.42, 0.12], [0.3, 0.07], [0.2, 0.04], [0.14, 0.2], [0.2, 0.13], [0.5, 0.04], [0.4, 0.045], [0.1, 0.03], [0.36, 0.1], [0.25, 0.055]]
        .forEach(p => flower(ctx, W - u * p[0], by + u * p[1], Math.max(2, u * (0.012 + rnd() * 0.008)), rnd() < 0.5 ? '#ff9ec3' : '#ffc4dc', '#ffe27a'));
    },

    origami(ctx, W, H, rnd) {
      ctx.fillStyle = '#f4f0e6'; ctx.fillRect(0, 0, W, H);
      const pal = ['#ef476f', '#ffd166', '#06d6a0', '#3bb5e8', '#b565d9', '#f78c3b'];
      const cs = Math.max(26, W / 6), rows = Math.ceil(H / cs), cols = Math.ceil(W / cs);
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const edge = Math.min(r, rows - 1 - r), k = edge === 0 ? 0.3 : edge === 1 ? 0.16 : 0.035;
          const x = c * cs, y = r * cs, flip = rnd() < 0.5;
          for (let t = 0; t < 2; t++) {
            ctx.fillStyle = rgba(pal[(rnd() * pal.length) | 0], k * (0.5 + rnd()));
            if (flip) poly(ctx, t ? [[x, y], [x + cs, y], [x, y + cs]] : [[x + cs, y], [x + cs, y + cs], [x, y + cs]]);
            else poly(ctx, t ? [[x, y], [x + cs, y], [x + cs, y + cs]] : [[x, y], [x + cs, y + cs], [x, y + cs]]);
            ctx.fill();
          }
        }
      ctx.strokeStyle = 'rgba(90,80,60,0.05)'; ctx.lineWidth = 0.6;
      ctx.beginPath();
      for (let i = 0; i < 900; i++) { const x = rnd() * W, y = rnd() * H, a = rnd() * TAU; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); }
      ctx.stroke();
      vignette(ctx, W, H, 0.12, '#6b5a3a');
    },
  };

  /* =====================================================================
     Brett + Ablage (Ursprung = linke obere Brett-Ecke, CSS-Pixel)
     ===================================================================== */
  function paintBoard(ctx, L, N, th, dpr) {
    const b = th.board, bs = L.bs, r = bs * (b.r == null ? 0.035 : b.r), fw = b.fw || 2;
    ctx.save();
    ctx.shadowColor = b.glow; ctx.shadowBlur = 28 * dpr; ctx.shadowOffsetY = 6 * dpr;
    rr(ctx, 0, 0, bs, bs, r); ctx.fillStyle = b.a; ctx.fill();
    ctx.restore();
    const g = ctx.createLinearGradient(0, 0, 0, bs);
    g.addColorStop(0, b.a); g.addColorStop(1, b.b);
    rr(ctx, 0, 0, bs, bs, r); ctx.fillStyle = g; ctx.fill();
    const c = L.cell, gap = Math.max(1, c * 0.045), cr = c * (b.cr == null ? 0.14 : b.cr);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        rr(ctx, L.bp + x * c + gap, L.bp + y * c + gap, c - 2 * gap, c - 2 * gap, cr);
        ctx.fillStyle = b.cell; ctx.fill();
        if (b.cellLine) { ctx.strokeStyle = b.cellLine; ctx.lineWidth = 1; ctx.stroke(); }
      }
    rr(ctx, fw / 2, fw / 2, bs - fw, bs - fw, r); ctx.strokeStyle = b.frame; ctx.lineWidth = fw; ctx.stroke();
    // Ablage
    const ty = bs + L.gap;
    ctx.save();
    ctx.shadowColor = b.glow; ctx.shadowBlur = 14 * dpr; ctx.shadowOffsetY = 4 * dpr;
    rr(ctx, 0, ty, bs, L.trayH, r * 1.3); ctx.fillStyle = b.tray; ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 0.55;
    rr(ctx, 0.75, ty + 0.75, bs - 1.5, L.trayH - 1.5, r * 1.3); ctx.strokeStyle = b.frame; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /* =====================================================================
     Die Designs
     ===================================================================== */
  const DARK = (accent, meta) => ({ dark: true, text: '#ffffff', sub: 'rgba(255,255,255,0.72)', accent, meta });
  const LIGHT = (text, accent, meta) => ({ dark: false, text, sub: rgba(text, 0.7), accent, meta });

  const THEMES = [
    {
      id: 'jewel', name: 'Juwelen-Dschungel', block: 'jewel', bg: BG.jewel,
      colors: ['#ff3b4e', '#ff9a1f', '#ffd92e', '#3ddc5a', '#27c7ff', '#4a6bff', '#c24bff'],
      ui: DARK('#4dffb8', '#0e4f4c'),
      board: { a: '#143a6b', b: '#0c2150', cell: 'rgba(4,14,40,0.42)', cellLine: 'rgba(130,200,255,0.10)', frame: '#8fe0ff', fw: 2.5, glow: 'rgba(80,200,255,0.55)', tray: 'rgba(8,26,66,0.74)', r: 0.04, cr: 0.14 },
      ambient: { shape: 'glow', add: true, n: 30, colors: ['#d8ff7a', '#9dffb0', '#fff3a0'], vx: [-10, 10], vy: [-12, 6], size: [1.2, 3], twinkle: 1.6, sway: 10 },
      fx: { shape: 'tri', n: 9, speed: [2, 8], grav: 16, drag: 1.2, life: [0.5, 0.95], size: [0.1, 0.24] },
    },
    {
      id: 'neon', name: 'Neon-Nacht', block: 'neon', bg: BG.neon,
      colors: ['#ff2e88', '#ff7a1a', '#f6ff3a', '#3dff8a', '#22e6ff', '#6a7dff', '#d04bff'],
      ui: DARK('#22e6ff', '#0d0221'),
      board: { a: '#0f0326', b: '#07010f', cell: 'rgba(255,255,255,0.035)', cellLine: 'rgba(255,46,200,0.16)', frame: '#ff2ee0', fw: 2, glow: 'rgba(255,46,224,0.7)', tray: 'rgba(15,3,38,0.78)', r: 0.035, cr: 0.14 },
      ambient: { shape: 'frame', add: true, n: 16, colors: ['#ff2e88', '#22e6ff', '#d04bff'], vx: [-6, 6], vy: [-22, -8], size: [4, 11], spin: 0.6, alpha: 0.55, twinkle: 1.2 },
      fx: { shape: 'spark', n: 10, speed: [4, 12], grav: 0, drag: 3, life: [0.3, 0.6], size: [0.18, 0.4], add: true },
    },
    {
      id: 'candy', name: 'Candy-Land', block: 'candy', bg: BG.candy,
      colors: ['#ff4f86', '#ff9838', '#ffcf3f', '#62d44f', '#38c6ff', '#8a74ff', '#f968dc'],
      ui: LIGHT('#7a1f55', '#ff3d8b', '#ff86bd'),
      board: { a: '#fff7fb', b: '#ffe1ee', cell: 'rgba(255,92,141,0.14)', frame: '#ffffff', fw: 3, glow: 'rgba(214,40,110,0.45)', tray: 'rgba(255,255,255,0.62)', r: 0.06, cr: 0.28 },
      ambient: { shape: 'dot', n: 26, colors: ['#ffffff', '#fff0a8', '#ffd0ea'], vx: [-6, 6], vy: [-20, -6], size: [2, 6], alpha: 0.6, sway: 8 },
      fx: { shape: 'circle', n: 9, speed: [2, 7], grav: 12, drag: 1.4, life: [0.5, 0.9], size: [0.07, 0.18] },
    },
    {
      id: 'wood', name: 'Holz & Zen', block: 'wood', bg: BG.wood,
      colors: ['#e3b877', '#d09a55', '#b97a3b', '#9c5f2c', '#c96f45', '#7d4a26', '#edcf9a'],
      ui: LIGHT('#5a3414', '#c0702a', '#f4e2c2'),
      board: { a: '#8c5c30', b: '#6d4320', cell: 'rgba(40,18,4,0.32)', cellLine: 'rgba(255,220,170,0.07)', frame: '#c9955a', fw: 3, glow: 'rgba(70,35,8,0.55)', tray: 'rgba(120,78,40,0.72)', r: 0.035, cr: 0.1 },
      ambient: { shape: 'leaf', n: 12, colors: ['#d98a3a', '#b5651d', '#e3a857', '#8fa650'], vx: [-12, 12], vy: [18, 42], size: [5, 10], spin: 1.2, sway: 26, alpha: 0.8 },
      fx: { shape: 'square', n: 8, speed: [2, 7], grav: 20, drag: 1.2, life: [0.5, 0.9], size: [0.08, 0.2] },
    },
    {
      id: 'ice', name: 'Polar-Eis', block: 'ice', bg: BG.ice,
      colors: ['#58d8ff', '#3f9dff', '#8e7bff', '#3fe6c0', '#ff7fc0', '#ffd95e', '#a6e9ff'],
      ui: DARK('#7fe3ff', '#050f2a'),
      board: { a: '#123a6e', b: '#0a2450', cell: 'rgba(190,235,255,0.07)', cellLine: 'rgba(190,235,255,0.14)', frame: '#c9f1ff', fw: 2.5, glow: 'rgba(120,220,255,0.6)', tray: 'rgba(14,44,90,0.72)', r: 0.04, cr: 0.14 },
      ambient: { shape: 'dot', n: 60, colors: ['#ffffff', '#d8f3ff'], vx: [-8, 8], vy: [22, 60], size: [0.8, 2.6], sway: 18, alpha: 0.85 },
      fx: { shape: 'tri', n: 10, speed: [2, 8], grav: 14, drag: 1.2, life: [0.5, 0.95], size: [0.09, 0.22] },
    },
    {
      id: 'galaxy', name: 'Galaxie', block: 'orb', bg: BG.galaxy,
      colors: ['#ff5fa2', '#ffa74f', '#ffe45c', '#5cf2a0', '#4fd8ff', '#7b8cff', '#c86bff'],
      ui: DARK('#c9a6ff', '#04010d'),
      board: { a: '#140b33', b: '#090420', cell: 'rgba(255,255,255,0.04)', cellLine: 'rgba(150,130,255,0.14)', frame: '#9f8cff', fw: 2, glow: 'rgba(140,110,255,0.65)', tray: 'rgba(20,11,51,0.74)', r: 0.045, cr: 0.22 },
      ambient: { shape: 'star4', add: true, n: 26, colors: ['#ffffff', '#bcd4ff', '#ffd6f5'], vx: [-2, 2], vy: [-2, 2], size: [2, 6], twinkle: 2.2, shooting: true },
      fx: { shape: 'star4', n: 8, speed: [2, 8], grav: 0, drag: 2.5, life: [0.5, 1.0], size: [0.12, 0.3], add: true },
    },
    {
      id: 'lava', name: 'Vulkan', block: 'lava', bg: BG.lava,
      colors: ['#ff3d1f', '#ff7a00', '#ffc400', '#ff2e6a', '#ff9e4a', '#ffe36e', '#ff5ad0'],
      ui: DARK('#ffb300', '#0e0302'),
      board: { a: '#1c0805', b: '#0d0302', cell: 'rgba(255,120,40,0.05)', cellLine: 'rgba(255,110,30,0.14)', frame: '#ff7a1a', fw: 2.5, glow: 'rgba(255,90,10,0.65)', tray: 'rgba(28,8,5,0.8)', r: 0.03, cr: 0.1 },
      ambient: { shape: 'glow', add: true, n: 38, colors: ['#ff7a00', '#ffc400', '#ff3d1f'], vx: [-10, 10], vy: [-70, -22], size: [1, 2.8], twinkle: 5, sway: 16 },
      fx: { shape: 'circle', n: 10, speed: [2, 7], grav: -6, drag: 2, life: [0.5, 1.1], size: [0.05, 0.13], add: true },
    },
    {
      id: 'pixel', name: 'Retro-Pixel', block: 'pixel', bg: BG.pixel,
      colors: ['#e43b44', '#f77622', '#fee761', '#63c74d', '#2ce8f5', '#0095e9', '#b55088'],
      ui: DARK('#fee761', '#14143a'),
      board: { a: '#0d0d26', b: '#0d0d26', cell: '#191946', frame: '#fee761', fw: 3, glow: 'rgba(0,0,0,0.55)', tray: 'rgba(13,13,38,0.88)', r: 0, cr: 0 },
      ambient: { shape: 'square', n: 20, colors: ['#fee761', '#2ce8f5', '#ff6b97', '#ffffff'], vx: [0, 0], vy: [-18, -6], size: [3, 6], twinkle: 3, alpha: 0.7 },
      fx: { shape: 'pixel', n: 9, speed: [3, 8], grav: 22, drag: 1, life: [0.4, 0.8], size: [0.12, 0.2] },
    },
    {
      id: 'ocean', name: 'Tiefsee', block: 'glass', bg: BG.ocean,
      colors: ['#ff6f5b', '#ffab3d', '#ffe055', '#4fe39c', '#3fd4ff', '#4f83ff', '#bf7dff'],
      ui: DARK('#7ff5ff', '#0c82bd'),
      board: { a: '#0a4a8c', b: '#062a60', cell: 'rgba(255,255,255,0.06)', cellLine: 'rgba(140,230,255,0.14)', frame: '#7fe9ff', fw: 2.5, glow: 'rgba(20,90,160,0.7)', tray: 'rgba(6,42,96,0.68)', r: 0.045, cr: 0.2 },
      ambient: { shape: 'ring', n: 26, colors: ['#e8fbff'], vx: [-4, 4], vy: [-55, -18], size: [2, 8], sway: 10, alpha: 0.55 },
      fx: { shape: 'ring', n: 8, speed: [1, 5], grav: -8, drag: 2, life: [0.6, 1.2], size: [0.08, 0.2] },
    },
    {
      id: 'royal', name: 'Gold Royal', block: 'royal', bg: BG.royal,
      colors: ['#e0115f', '#ff7a1a', '#ffd700', '#00a86b', '#1ca9ff', '#3b4cca', '#9b30ff'],
      ui: DARK('#f1cf6a', '#2c1049'),
      board: { a: '#231038', b: '#140822', cell: 'rgba(255,215,120,0.045)', cellLine: 'rgba(255,215,120,0.14)', frame: '#f1cf6a', fw: 3, glow: 'rgba(241,190,80,0.5)', tray: 'rgba(35,16,56,0.8)', r: 0.035, cr: 0.14 },
      ambient: { shape: 'star4', add: true, n: 30, colors: ['#ffe08a', '#fff3c4', '#f1cf6a'], vx: [-5, 5], vy: [4, 16], size: [1.5, 4.5], twinkle: 2.6 },
      fx: { shape: 'star4', n: 9, speed: [2, 8], grav: 10, drag: 1.4, life: [0.5, 1.0], size: [0.1, 0.26], add: true },
    },
    {
      id: 'sakura', name: 'Sakura', block: 'clay', bg: BG.sakura,
      colors: ['#ff7d9f', '#ffa873', '#ffd56b', '#8fdc8a', '#79c8ff', '#a596ff', '#ef92ff'],
      ui: LIGHT('#7a2148', '#f0589a', '#fff1f6'),
      board: { a: '#fffafc', b: '#ffeaf2', cell: 'rgba(226,92,150,0.11)', frame: '#ffffff', fw: 3, glow: 'rgba(200,60,120,0.38)', tray: 'rgba(255,255,255,0.64)', r: 0.06, cr: 0.26 },
      ambient: { shape: 'petal', n: 26, colors: ['#ff9ec3', '#ffc4dc', '#ffffff', '#f77fb0'], vx: [-20, -4], vy: [20, 48], size: [4, 8], spin: 1.4, sway: 24, alpha: 0.9 },
      fx: { shape: 'petal', n: 8, speed: [1.5, 6], grav: 6, drag: 2.5, life: [0.7, 1.3], size: [0.14, 0.28] },
    },
    {
      id: 'origami', name: 'Origami', block: 'paper', bg: BG.origami,
      colors: ['#ef476f', '#f78c3b', '#ffc94d', '#06d6a0', '#3bb5e8', '#5a6ff0', '#b565d9'],
      ui: LIGHT('#2c3440', '#ef476f', '#f4f0e6'),
      board: { a: '#ffffff', b: '#f6f3ec', cell: 'rgba(44,52,64,0.065)', frame: '#2c3440', fw: 2, glow: 'rgba(40,40,60,0.28)', tray: 'rgba(255,255,255,0.74)', r: 0.02, cr: 0.04 },
      ambient: { shape: 'tri', n: 14, colors: ['#ef476f', '#ffd166', '#06d6a0', '#3bb5e8', '#b565d9'], vx: [-8, 8], vy: [-14, -4], size: [5, 11], spin: 0.5, alpha: 0.45 },
      fx: { shape: 'tri', n: 9, speed: [2, 7], grav: 10, drag: 2, life: [0.6, 1.1], size: [0.12, 0.26] },
    },
  ];

  Object.assign(P, {
    THEMES, BLOCKS, BG, makeSprite, paintBoard, SPRITE_MARGIN, rng, rr, star4, rgba, lighten, darken, mix,
    // Werkzeuge für weitere Design-Dateien (themes2.js)
    kit: { poly, bevel, innerShadow, vgrad, glow, vignette, flower, DARK, LIGHT },
  });
})();
