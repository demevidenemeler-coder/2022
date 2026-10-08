/* Prisma – Spiellogik, Rendering, Effekte und Eingabe */
(function () {
  'use strict';
  const P = window.PRISMA;
  const THEMES = P.THEMES, sfx = P.audio, M = P.SPRITE_MARGIN;
  const rr = P.rr, rgba = P.rgba, lighten = P.lighten, darken = P.darken, star4 = P.star4;
  const TAU = Math.PI * 2;
  const FONT = 'Fredoka, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const $ = id => document.getElementById(id);

  /* ---------- Speicher ---------- */
  const LS = 'prisma.v1';
  const store = { best: {}, theme: 'jewel', sound: true, haptic: true, auto: true, music: true, track: 0, saves: {} };
  try {
    const raw = JSON.parse(localStorage.getItem(LS) || 'null');
    if (raw && typeof raw === 'object') Object.assign(store, raw);
  } catch (e) { /* kein Speicher verfügbar */ }
  if (!store.best || typeof store.best !== 'object') store.best = {};
  if (!store.saves || typeof store.saves !== 'object') store.saves = {};
  function persist() { try { localStorage.setItem(LS, JSON.stringify(store)); } catch (e) { /* ignorieren */ } }

  /* ---------- Helfer ---------- */
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const easeInCubic = t => t * t * t;
  const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const fmt = n => Math.round(n).toLocaleString('de-DE');
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Audio nach einer Nutzeraktion freischalten und die Hintergrundmusik passend zu den Einstellungen starten/stoppen
  let musicInit = false; // das gespeicherte Stück nur beim ersten Start vorgeben – danach wechselt die Musik von selbst
  function syncMusic() {
    if (store.music && !document.hidden) { sfx.musicStart(musicInit ? null : store.track | 0); musicInit = sfx.musicState().on; }
    else sfx.musicStop();
  }
  function wake() { sfx.unlock(); syncMusic(); }
  function vib(p) { if (store.haptic && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignorieren */ } } }

  /* ---------- Formen ---------- */
  // Die Gewichte (w) sind auf das 8×8-Feld abgestimmt: kleine und mittlere Teile kommen oft, sperrige selten.
  // Die Reihenfolge nicht ändern – gespeicherte Spielstände merken sich die Teile über ihren Index.
  const DEFS = [
    { m: ['#'], w: 1.6 },
    { m: ['##'], w: 2.6 }, { m: ['#', '#'], w: 2.6 },
    { m: ['###'], w: 2.6 }, { m: ['#', '#', '#'], w: 2.6 },
    { m: ['####'], w: 1.4 }, { m: ['#', '#', '#', '#'], w: 1.4 },
    { m: ['#####'], w: 0.5 }, { m: ['#', '#', '#', '#', '#'], w: 0.5 },
    { m: ['##', '##'], w: 3.6 },
    { m: ['###', '###', '###'], w: 0.5 },
    { m: ['###', '###'], w: 0.8 }, { m: ['##', '##', '##'], w: 0.8 },
    // kleines L
    { m: ['#.', '##'], w: 1.6 }, { m: ['.#', '##'], w: 1.6 }, { m: ['##', '#.'], w: 1.6 }, { m: ['##', '.#'], w: 1.6 },
    // großes L
    { m: ['#..', '#..', '###'], w: 0.45 }, { m: ['..#', '..#', '###'], w: 0.45 }, { m: ['###', '#..', '#..'], w: 0.45 }, { m: ['###', '..#', '..#'], w: 0.45 },
    // L-Tetromino
    { m: ['#.', '#.', '##'], w: 0.8 }, { m: ['.#', '.#', '##'], w: 0.8 }, { m: ['##', '#.', '#.'], w: 0.8 }, { m: ['##', '.#', '.#'], w: 0.8 },
    { m: ['###', '#..'], w: 0.8 }, { m: ['###', '..#'], w: 0.8 }, { m: ['#..', '###'], w: 0.8 }, { m: ['..#', '###'], w: 0.8 },
    // T
    { m: ['###', '.#.'], w: 0.9 }, { m: ['.#.', '###'], w: 0.9 }, { m: ['#.', '##', '#.'], w: 0.9 }, { m: ['.#', '##', '.#'], w: 0.9 },
    // S / Z
    { m: ['##.', '.##'], w: 0.7 }, { m: ['.##', '##.'], w: 0.7 }, { m: ['#.', '##', '.#'], w: 0.7 }, { m: ['.#', '##', '#.'], w: 0.7 },
  ];
  const PIECES = DEFS.map((d, id) => {
    const cells = [];
    d.m.forEach((row, r) => { for (let c = 0; c < row.length; c++) if (row[c] === '#') cells.push([r, c]); });
    return { id, cells, h: d.m.length, w: d.m[0].length, wt: d.w };
  });
  const WSUM = PIECES.reduce((a, p) => a + p.wt, 0);
  function randomPiece() {
    let x = Math.random() * WSUM;
    for (const p of PIECES) { x -= p.wt; if (x <= 0) return p; }
    return PIECES[0];
  }

  /* ---------- Zustand ---------- */
  const cv = $('game'), ctx = cv.getContext('2d');
  const topCv = $('fxTop'), tctx = topCv.getContext('2d');
  const elScore = $('score'), elBest = $('best'), elStreak = $('streak'), elBestPill = $('bestPill'), elToast = $('toast');

  let W = 0, H = 0, DPR = 1, L = null, T = performance.now() / 1000, last = performance.now();
  let theme = THEMES.find(t => t.id === store.theme) || THEMES[0];
  const N = 8; // Spielfeld 8 × 8
  // Reihen-Auflösung: Farbwechsel (umklappen) → kurz halten → zerplatzen
  const FLIP = 0.2, HOLD = 0.1, OUT = 0.36;
  let grid, pop, grey, hlSet, tmpGrid;
  let tray = [null, null, null];
  let score = 0, shown = 0, streak = 0, sinceClear = 0;
  let stats = { lines: 0, combo: 0, designs: 0 }; // Statistik der laufenden Partie
  let seriesSwitched = false; // in der laufenden Combo-Serie wurde das Design schon gewechselt
  let over = false, overAt = 0, overShown = false, startBest = 0, recordHit = false, recordRun = false;
  let drag = null, shake = 0, sweepT0 = -9;
  const hlRows = [], hlCols = [];

  let sprites = [], shadowSp = null, bgCv = null, boardCv = null;
  let cur = null;    // Ebenen des aktuellen Designs (Sprites, Hintergrund, Brett)
  let nextL = null;  // schon vorbereitete Ebenen des nächsten Designs
  let tr = null;     // laufender Design-Wechsel: Kreisblende vom gelegten Teil aus
  let bag = [], prepTimer = 0;
  const BM = 46; // Rand um das Brett-Bitmap (für den Leuchtschein)
  let amb = [], shoots = [], nextShoot = 3;
  let parts = [], conf = [], topDirty = false;
  const dying = [], beams = [], rings = [], floaters = [], banners = [], glints = [];
  let nextGlint = 1;

  function alloc() {
    grid = new Uint8Array(N * N); tmpGrid = new Uint8Array(N * N); hlSet = new Uint8Array(N * N);
    pop = new Float64Array(N * N); grey = new Float64Array(N * N);
  }

  /* =====================================================================
     Spiellogik
     ===================================================================== */
  function canPlace(pc, r0, c0) {
    if (r0 < 0 || c0 < 0 || r0 + pc.h > N || c0 + pc.w > N) return false;
    for (const [r, c] of pc.cells) if (grid[(r0 + r) * N + c0 + c]) return false;
    return true;
  }
  function fitsAnywhere(pc) {
    for (let r = 0; r <= N - pc.h; r++) for (let c = 0; c <= N - pc.w; c++) if (canPlace(pc, r, c)) return true;
    return false;
  }
  function refill() {
    // Auf dem engen 8×8-Feld möglichst drei Teile wählen, von denen jedes für sich noch Platz findet
    let set = null, most = -1;
    for (let i = 0; i < 40 && most < 3; i++) {
      const cand = [randomPiece(), randomPiece(), randomPiece()], n = cand.filter(fitsAnywhere).length;
      if (n > most) { most = n; set = cand; }
    }
    if (!most) set[0] = PIECES[0];
    for (let i = 0; i < 3; i++)
      tray[i] = { piece: set[i], color: 1 + ((Math.random() * 7) | 0), born: T + 0.1 + i * 0.09, ret: null, fits: true };
  }
  function updFits() { tray.forEach(t => { if (t) t.fits = fitsAnywhere(t.piece); }); }

  function resetRun() {
    over = false; overShown = false; drag = null; shake = 0;
    dying.length = beams.length = rings.length = floaters.length = banners.length = glints.length = 0;
    hlRows.length = hlCols.length = 0;
    startBest = store.best[N] || 0;
  }
  function newGame() {
    alloc(); resetRun();
    score = 0; shown = 0; streak = 0; sinceClear = 0; seriesSwitched = false; recordHit = false; recordRun = false;
    stats = { lines: 0, combo: 0, designs: 0 };
    refill(); updFits();
    sweepT0 = T;
    refreshHud(); saveGame();
  }
  function saveGame() {
    store.saves[N] = {
      g: Array.from(grid), s: score, k: streak, m: sinceClear, w: seriesSwitched ? 1 : 0, st: stats,
      t: tray.map(t => (t ? { p: t.piece.id, c: t.color } : null)),
    };
    persist();
  }
  function loadGame() {
    const s = store.saves[N];
    if (!s || !Array.isArray(s.g) || s.g.length !== N * N || !Array.isArray(s.t)) return false;
    alloc(); resetRun();
    for (let i = 0; i < s.g.length; i++) grid[i] = clamp(s.g[i] | 0, 0, 7);
    score = Math.max(0, s.s | 0); shown = score; streak = Math.max(0, s.k | 0); sinceClear = Math.max(0, s.m | 0);
    seriesSwitched = !!s.w && streak > 0;
    const st = s.st || {};
    stats = { lines: st.lines | 0, combo: st.combo | 0, designs: st.designs | 0 };
    recordHit = recordRun = score > 0 && score >= startBest;
    tray = [0, 1, 2].map(i => {
      const x = s.t[i];
      return x && PIECES[x.p] ? { piece: PIECES[x.p], color: clamp(x.c | 0, 1, 7), born: T + 0.1 + i * 0.09, ret: null, fits: true } : null;
    });
    if (!tray.some(Boolean)) refill();
    updFits();
    if (!tray.some(t => t && t.fits)) return false;
    refreshHud();
    return true;
  }

  function place(i, r0, c0) {
    const t = tray[i], pc = t.piece, c = L.cell, col = theme.colors[t.color - 1];
    tray[i] = null;
    pc.cells.forEach(([r, q], k) => {
      const idx = (r0 + r) * N + c0 + q;
      grid[idx] = t.color; pop[idx] = -(T + k * 0.012);
    });
    store.tut = true;
    score += pc.cells.length;
    const cx = L.gx + (c0 + pc.w / 2) * c, cy = L.gy + (r0 + pc.h / 2) * c;
    sfx.place(); vib(12);
    rings.push({ x: cx, y: cy, t0: T, dur: 0.38, r0: c * 0.4, r1: c * Math.max(pc.w, pc.h) * 0.85, col, lw: c * 0.09 });

    const rows = [], cols = [];
    for (let r = r0; r < r0 + pc.h; r++) {
      let full = true;
      for (let q = 0; q < N; q++) if (!grid[r * N + q]) { full = false; break; }
      if (full) rows.push(r);
    }
    for (let q = c0; q < c0 + pc.w; q++) {
      let full = true;
      for (let r = 0; r < N; r++) if (!grid[r * N + q]) { full = false; break; }
      if (full) cols.push(q);
    }
    if (rows.length + cols.length) clearLines(rows, cols, cx, cy, t.color);
    else { sinceClear++; if (sinceClear >= 3) { streak = 0; seriesSwitched = false; } }
    updStreak();
    checkRecord();
    if (!tray[0] && !tray[1] && !tray[2]) refill();
    updFits();
    elScore.classList.remove('bump'); void elScore.offsetWidth; elScore.classList.add('bump');
    if (!tray.some(x => x && x.fits)) endGame(); else saveGame();
  }

  const LINE_WORDS = ['', '', 'Doppelt!', 'Dreifach!', 'Vierfach!', 'Wahnsinn!', 'Legendär!'];
  // Alle Steine der fertigen Reihen nehmen erst die Farbe des gelegten Teils an (to) und zerplatzen dann.
  function clearLines(rows, cols, cx, cy, to) {
    const lines = rows.length + cols.length;
    streak++; sinceClear = 0;
    stats.lines += lines; stats.combo = Math.max(stats.combo, streak);
    // Bei einer Combo (Reihe in Folge oder mehrere Reihen auf einmal) wechselt zusätzlich das ganze Design,
    // aber nur einmal pro Serie: erst wenn die Serie abreißt, kann die nächste Combo wieder wechseln
    if ((streak >= 2 || lines >= 2) && !seriesSwitched) { seriesSwitched = true; autoSwitch(cx, cy); }
    const c = L.cell, set = new Set(), col = theme.colors[to - 1];
    rows.forEach(r => { for (let q = 0; q < N; q++) set.add(r * N + q); });
    cols.forEach(q => { for (let r = 0; r < N; r++) set.add(r * N + q); });
    let gain = Math.round(N * 10 * lines * (1 + (lines - 1) * 0.5) * (1 + (streak - 1) * 0.5));

    const pr = (cy - L.gy) / c - 0.5, pq = (cx - L.gx) / c - 0.5;
    const dens = set.size > 30 ? 0.55 : 1;
    set.forEach(i => {
      const r = (i / N) | 0, q = i % N;
      dying.push({ r, q, ci: grid[i], to, t0: T + 0.04 + Math.hypot(r - pr, q - pq) * 0.04, b: false, dens, spin: rand(-3, 3) });
      grid[i] = 0; pop[i] = 0;
    });
    rows.forEach(r => beams.push({ row: true, i: r, t0: T + 0.04, col }));
    cols.forEach(q => beams.push({ row: false, i: q, t0: T + 0.04, col }));
    rings.push({ x: cx, y: cy, t0: T + 0.03, dur: 0.65, r0: c * 0.5, r1: c * (2.6 + lines * 1.3), col, lw: c * 0.24 });
    shake = REDUCED ? 0 : Math.min(18, 4 + lines * 4);
    sfx.clear(lines, streak); vib(lines > 1 ? [18, 40, 28] : 22);

    let text = lines >= 2 ? LINE_WORDS[Math.min(lines, LINE_WORDS.length - 1)] : streak >= 2 ? 'Combo ×' + streak : '';
    let sub = lines >= 2 && streak >= 2 ? 'Combo ×' + streak : '';
    let empty = true;
    for (let i = 0; i < grid.length; i++) if (grid[i]) { empty = false; break; }
    if (empty) { gain += 300; text = 'Perfekt!'; sub = '+300 Bonus'; confetti(90); }
    if (text) pushBanner(text, sub, col);
    floaters.push({ text: '+' + fmt(gain), x: cx, y: cy, t0: T + 0.1, col });
    score += gain;
  }

  function checkRecord() {
    if (score <= (store.best[N] || 0)) return;
    store.best[N] = score; recordRun = true;
    elBest.textContent = fmt(score);
    if (!recordHit && startBest > 0) {
      recordHit = true;
      pushBanner('Neuer Rekord!', '', '#ffc93c');
      sfx.record(); confetti(80);
      elBestPill.classList.remove('glow'); void elBestPill.offsetWidth; elBestPill.classList.add('glow');
    }
  }

  function endGame() {
    over = true; drag = null; clearPreview();
    const start = T + 0.75;
    for (let r = 0; r < N; r++)
      for (let q = 0; q < N; q++) { const i = r * N + q; grey[i] = grid[i] ? start + (N - 1 - r) * 0.07 + q * 0.012 : 0; }
    overAt = start + N * 0.07 + 0.6; overShown = false;
    setTimeout(() => { if (over) sfx.over(); }, 750);
    delete store.saves[N]; persist();
  }
  function showOver() {
    overShown = true;
    const rec = recordRun && score > 0;
    $('overScore').textContent = fmt(score);
    $('overBest').textContent = fmt(store.best[N] || 0);
    $('stLines').textContent = fmt(stats.lines);
    $('stCombo').textContent = stats.combo >= 2 ? '×' + stats.combo : '–';
    $('stDesigns').textContent = fmt(stats.designs);
    $('overTitle').textContent = rec ? 'Neuer Rekord!' : 'Keine Züge mehr';
    $('ovOver').classList.toggle('record', rec);
    openOv('ovOver');
    if (rec) { confetti(130); sfx.record(); }
  }

  /* =====================================================================
     Layout + gecachte Ebenen
     ===================================================================== */
  function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  // iOS gibt Canvas-Speicher nur zögerlich frei – verworfene Ebenen sofort leeren
  function freeCanvas(c) { if (c) c.width = c.height = 0; }

  function layout() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = topCv.width = Math.round(W * DPR); cv.height = topCv.height = Math.round(H * DPR);
    // Notch / Home-Balken
    const cs = getComputedStyle($('safe'));
    const st = parseFloat(cs.paddingTop) || 0, avail = H - (parseFloat(cs.paddingBottom) || 0);
    const colW = Math.min(W, 560);
    const hudH = st + clamp((H - st) * 0.17, 104, 150);
    const gap = 14;
    const bs = Math.max(180, Math.floor(Math.min(colW - 24, (avail - hudH - gap - 22) / 1.34)));
    const trayH = bs * 0.34;
    const by = hudH + Math.max(0, (avail - hudH - bs - gap - trayH - 14) * 0.4);
    const bp = bs * 0.022, bx = (W - bs) / 2;
    L = { hudH, bs, bx, by, bp, gap, cell: (bs - 2 * bp) / N, gx: bx + bp, gy: by + bp, trayY: by + bs + gap, trayH, slotW: bs / 3 };
    document.documentElement.style.setProperty('--hud-h', hudH + 'px');
    rebuild(); initAmbient();
    topDirty = true;
  }

  // Alle vorgerenderten Ebenen eines Designs: Stein-Sprites (Index 0 = grau), Hintergrund, Brett
  function buildLayers(th) {
    const s = Math.max(4, Math.round(L.cell * DPR));
    const o = { theme: th, sprites: [P.makeSprite(th.block, '#868b96', s, 99)] };
    th.colors.forEach((c, i) => o.sprites.push(P.makeSprite(th.block, c, s, 7 + i * 13)));
    o.bgCv = makeCanvas(W * DPR, H * DPR);
    let g = o.bgCv.getContext('2d'); g.scale(DPR, DPR);
    th.bg(g, W, H, P.rng(1234));
    o.boardCv = makeCanvas((L.bs + 2 * BM) * DPR, (L.bs + L.gap + L.trayH + 2 * BM) * DPR);
    g = o.boardCv.getContext('2d'); g.scale(DPR, DPR); g.translate(BM, BM);
    P.paintBoard(g, L, N, th, DPR);
    return o;
  }
  function freeLayers(o) { if (o) { o.sprites.forEach(freeCanvas); freeCanvas(o.bgCv); freeCanvas(o.boardCv); } }
  function useLayers(o) { cur = o; theme = o.theme; sprites = o.sprites; bgCv = o.bgCv; boardCv = o.boardCv; }

  function rebuild() {
    if (tr) { freeLayers(tr.old); tr = null; }
    freeLayers(nextL); nextL = null;
    freeLayers(cur);
    useLayers(buildLayers(theme));
    // weicher Schatten unter dem gezogenen Teil
    const s = Math.max(4, Math.round(L.cell * DPR));
    freeCanvas(shadowSp);
    shadowSp = makeCanvas(sprites[0].width, sprites[0].height);
    const g = shadowSp.getContext('2d'), off = (shadowSp.width - s) / 2;
    g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = s * 0.2;
    g.fillStyle = 'rgba(0,0,0,0.4)';
    rr(g, off + s * 0.06, off + s * 0.06, s * 0.88, s * 0.88, s * 0.16); g.fill();
    prepNext();
  }

  /* ---------- Design-Wechsel ---------- */
  function nextTheme() {
    if (!bag.length) {
      bag = THEMES.filter(t => t !== theme);
      for (let i = bag.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0, t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
    }
    const th = bag.pop();
    return th === theme ? nextTheme() : th;
  }
  // Das nächste Design in einer ruhigen Phase vorbereiten, damit der Wechsel selbst nicht ruckelt
  function prepNext() {
    clearTimeout(prepTimer);
    if (!store.auto || THEMES.length < 2) return;
    prepTimer = setTimeout(() => { if (!nextL && L) nextL = buildLayers(nextTheme()); }, 1100);
  }
  // Blendet das Design o kreisförmig von (x, y) aus ein
  function switchTheme(o, x, y) {
    if (tr) freeLayers(tr.old);
    const R = Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y)) + 24;
    tr = { old: cur, amb, x, y, t0: T, dur: 0.85, R, r: 0, r2: 0 };
    useLayers(o);
    store.theme = theme.id;
    applyUi(); initAmbient();
    // jeder Stein hüpft kurz, wenn ihn die Blende erreicht
    const c = L.cell;
    for (let i = 0; i < grid.length; i++) {
      if (!grid[i]) continue;
      const d = Math.hypot(L.gx + ((i % N) + 0.5) * c - x, L.gy + (((i / N) | 0) + 0.5) * c - y);
      pop[i] = -(T + tr.dur * (1 - Math.sqrt(Math.max(0, 1 - d / R))));
    }
    showToast(theme.name);
  }
  function autoSwitch(x, y) {
    if (!store.auto || THEMES.length < 2) return;
    let o = nextL;
    nextL = null;
    if (!o || o.theme === theme) { freeLayers(o); o = buildLayers(nextTheme()); }
    switchTheme(o, x, y);
    stats.designs++;
    sfx.whoosh();
    prepNext();
  }

  /* =====================================================================
     Effekte
     ===================================================================== */
  function initAmbient() {
    amb = []; shoots = [];
    const a = theme.ambient;
    if (!a) return;
    const n = Math.round(a.n * clamp((W * H) / (400 * 800), 0.6, 2.2));
    for (let i = 0; i < n; i++)
      amb.push({
        x: Math.random() * W, y: Math.random() * H, vx: rand(a.vx[0], a.vx[1]), vy: rand(a.vy[0], a.vy[1]),
        size: rand(a.size[0], a.size[1]), rot: Math.random() * TAU, vr: rand(-1, 1) * (a.spin || 0), ph: Math.random() * TAU,
        color: a.colors[(Math.random() * a.colors.length) | 0],
      });
  }
  const glowCache = {};
  function glowSprite(color) {
    let c = glowCache[color];
    if (!c) {
      c = glowCache[color] = makeCanvas(64, 64);
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.14, rgba(color, 0.9));
      gr.addColorStop(0.4, rgba(color, 0.25)); gr.addColorStop(1, rgba(color, 0));
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    }
    return c;
  }
  // list/a: Partikel und Einstellungen eines Designs; main = aktuelles Design (mit Sternschnuppen)
  function updAmbient(list, a, dt, main) {
    if (!a) return;
    for (const p of list) {
      p.x += (p.vx + (a.sway ? Math.sin(T * 0.9 + p.ph) * a.sway : 0)) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y > H + 30) { p.y = -20; p.x = Math.random() * W; } else if (p.y < -30) { p.y = H + 20; p.x = Math.random() * W; }
      if (p.x > W + 30) p.x = -20; else if (p.x < -30) p.x = W + 20;
    }
    if (main && a.shooting) {
      nextShoot -= dt;
      if (nextShoot <= 0) { nextShoot = rand(2.5, 6); shoots.push({ x: rand(0, W * 0.8), y: rand(0, H * 0.4), vx: rand(500, 800), vy: rand(200, 380), life: 0, max: rand(0.5, 0.9) }); }
      for (let i = shoots.length - 1; i >= 0; i--) {
        const s = shoots[i]; s.life += dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.life >= s.max) shoots.splice(i, 1);
      }
    }
  }
  function drawAmbient(list, a, main) {
    if (!a) return;
    ctx.globalCompositeOperation = a.add ? 'lighter' : 'source-over';
    for (const p of list) {
      const tw = a.twinkle ? 0.5 + 0.5 * Math.sin(T * a.twinkle + p.ph) : 1;
      const al = (a.alpha || 1) * (a.twinkle ? 0.25 + 0.75 * tw : 1), s = p.size;
      ctx.globalAlpha = al; ctx.fillStyle = p.color; ctx.strokeStyle = p.color;
      switch (a.shape) {
        case 'glow': ctx.drawImage(glowSprite(p.color), p.x - s * 5, p.y - s * 5, s * 10, s * 10); break;
        case 'dot': ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.fill(); break;
        case 'ring':
          ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.stroke();
          ctx.beginPath(); ctx.arc(p.x - s * 0.35, p.y - s * 0.35, s * 0.2, 0, TAU); ctx.fill();
          break;
        case 'petal':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(T * 1.3 + p.ph)));
          ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.62, 0, 0, TAU); ctx.fill(); ctx.restore();
          break;
        case 'leaf':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, 0.4 + 0.6 * Math.abs(Math.sin(T * 1.1 + p.ph)));
          ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.75, s, 0); ctx.quadraticCurveTo(0, s * 0.75, -s, 0); ctx.fill(); ctx.restore();
          break;
        case 'star4': star4(ctx, p.x, p.y, s * (0.4 + 0.6 * tw), p.color, 1); break;
        case 'square': ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(s), Math.round(s)); break;
        case 'frame':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.lineWidth = 1.6; ctx.strokeRect(-s, -s, s * 2, s * 2); ctx.restore();
          break;
        case 'tri':
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.9, s * 0.7); ctx.lineTo(-s * 0.9, s * 0.7); ctx.closePath(); ctx.fill(); ctx.restore();
          break;
      }
    }
    for (const s of main ? shoots : []) {
      const k = Math.sin((Math.PI * s.life) / s.max), tx = s.x - s.vx * 0.13, ty = s.y - s.vy * 0.13;
      const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, 'rgba(255,255,255,' + k + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tx, ty); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function burst(x, y, col, dens) {
    if (parts.length > 1400) return;
    const fx = theme.fx, c = L.cell, n = Math.max(2, Math.round(fx.n * dens));
    for (let i = 0; i < n; i++) {
      const ang = Math.random() * TAU, sp = rand(fx.speed[0], fx.speed[1]) * c;
      parts.push({
        x: x + rand(-0.3, 0.3) * c, y: y + rand(-0.3, 0.3) * c,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (fx.grav > 0 ? c * 3 : 0),
        g: fx.grav * c, drag: fx.drag || 1.5, life: 0, max: rand(fx.life[0], fx.life[1]),
        size: rand(fx.size[0], fx.size[1]) * c, rot: Math.random() * TAU, vr: rand(-9, 9),
        color: Math.random() < 0.3 ? lighten(col, 0.55) : col, shape: fx.shape, add: !!fx.add,
      });
    }
  }
  function confetti(n) {
    for (let i = 0; i < n; i++) {
      const left = i % 2 === 0, ang = left ? rand(-1.4, -0.8) : rand(-2.35, -1.75), sp = rand(520, 1150) * clamp(H / 760, 0.7, 1.4);
      conf.push({
        x: left ? L.bx - 10 : L.bx + L.bs + 10, y: L.by + L.bs * 0.6,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, g: 950, drag: 2.2, life: 0, max: rand(2, 3.2),
        size: rand(7, 13), rot: Math.random() * TAU, vr: rand(-6, 6), flip: rand(6, 14),
        color: theme.colors[(Math.random() * theme.colors.length) | 0], shape: 'confetti', add: false,
      });
    }
  }
  function stepParts(list, dt) {
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life += dt;
      if (p.life >= p.max) { list[i] = list[list.length - 1]; list.pop(); continue; }
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vy = p.vy * d + p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
  }
  function drawParts(g, list) {
    for (const p of list) {
      const k = p.life / p.max, s = p.size * (1 - k * 0.35);
      g.globalAlpha = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      g.globalCompositeOperation = p.add ? 'lighter' : 'source-over';
      g.fillStyle = p.color;
      switch (p.shape) {
        case 'tri':
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
          g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.85, s * 0.7); g.lineTo(-s * 0.7, s * 0.5); g.closePath(); g.fill(); g.restore();
          break;
        case 'square':
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-s / 2, -s / 2, s, s * 0.7); g.restore();
          break;
        case 'pixel': { const q = Math.max(2, Math.round(s)); g.fillRect(Math.round(p.x - q / 2), Math.round(p.y - q / 2), q, q); break; }
        case 'circle': g.beginPath(); g.arc(p.x, p.y, s, 0, TAU); g.fill(); break;
        case 'ring': g.strokeStyle = p.color; g.lineWidth = 1.6; g.beginPath(); g.arc(p.x, p.y, s, 0, TAU); g.stroke(); break;
        case 'spark':
          g.strokeStyle = p.color; g.lineWidth = Math.max(1.2, s * 0.22); g.lineCap = 'round';
          g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05); g.stroke();
          break;
        case 'star4': star4(g, p.x, p.y, s, p.color, 1); break;
        case 'petal':
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, 0.4 + 0.6 * Math.abs(Math.cos(p.life * 6)));
          g.beginPath(); g.ellipse(0, 0, s, s * 0.6, 0, 0, TAU); g.fill(); g.restore();
          break;
        case 'confetti':
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(1, Math.cos(p.life * p.flip));
          g.fillRect(-s / 2, -s / 4, s, s / 2); g.restore();
          break;
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }

  function pushBanner(text, sub, col) {
    if (banners.length >= 2) banners.pop();
    banners.push({ text, sub, col, t0: banners.length ? 0 : T + 0.1 });
  }

  /* =====================================================================
     Update
     ===================================================================== */
  function update(dt) {
    if (shake) { shake *= Math.pow(0.002, dt); if (shake < 0.15) shake = 0; }
    if (shown !== score) {
      shown += (score - shown) * Math.min(1, dt * 12);
      if (Math.abs(score - shown) < 0.6) shown = score;
      elScore.textContent = fmt(shown);
    }
    updAmbient(amb, theme.ambient, dt, true);
    if (tr) {
      const k = (T - tr.t0) / tr.dur;
      if (k >= 1) { freeLayers(tr.old); tr = null; }
      else { tr.r = tr.R * (1 - (1 - k) * (1 - k)); tr.r2 = tr.r * tr.r; updAmbient(tr.amb, tr.old.theme.ambient, dt, false); }
    }
    stepParts(parts, dt); stepParts(conf, dt);
    for (let i = dying.length - 1; i >= 0; i--) {
      const d = dying[i];
      if (!d.b && T >= d.t0 + FLIP + HOLD) {
        d.b = true;
        burst(L.gx + (d.q + 0.5) * L.cell, L.gy + (d.r + 0.5) * L.cell, theme.colors[d.to - 1], d.dens);
      }
      if (T - d.t0 >= FLIP + HOLD + OUT) dying.splice(i, 1);
    }
    if (drag) updDrag();
    nextGlint -= dt;
    if (nextGlint <= 0) {
      nextGlint = rand(0.3, 1);
      const i = (Math.random() * grid.length) | 0;
      if (grid[i] && !over) glints.push({ i, t0: T });
    }
    if (over && !overShown && T >= overAt) showOver();
  }

  function updDrag() {
    const d = drag, pc = d.t.piece, c = L.cell;
    const e = easeOutCubic(clamp((T - d.t0) / 0.11, 0, 1));
    const tx = d.px, ty = d.py - (d.touch ? c * 1.25 + (pc.h * c) / 2 : 0);
    d.x = lerp(d.hx, tx, e); d.y = lerp(d.hy, ty, e); d.sc = lerp(trayScale(pc), 1, e);
    // Einrasten: nächstgelegene gültige Position im Umkreis einer Zelle
    const fc = (tx - (pc.w * c) / 2 - L.gx) / c, fr = (ty - (pc.h * c) / 2 - L.gy) / c;
    const rc = Math.round(fc), rw = Math.round(fr);
    let best = null, bd = 1e9;
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        const r0 = rw + dr, c0 = rc + dc;
        if (!canPlace(pc, r0, c0)) continue;
        const dist = Math.hypot(r0 - fr, c0 - fc);
        if (dist < bd) { bd = dist; best = [r0, c0]; }
      }
    if (best && bd > 0.85) best = null;
    const key = best ? best[0] * 100 + best[1] : -1;
    if (key !== d.key) { d.key = key; d.snap = best; computePreview(); }
  }
  function clearPreview() { hlRows.length = hlCols.length = 0; if (hlSet) hlSet.fill(0); }
  function computePreview() {
    clearPreview();
    const d = drag;
    if (!d || !d.snap) return;
    const r0 = d.snap[0], c0 = d.snap[1], pc = d.t.piece;
    tmpGrid.set(grid);
    for (const [r, c] of pc.cells) tmpGrid[(r0 + r) * N + c0 + c] = 1;
    for (let r = r0; r < r0 + pc.h; r++) {
      let full = true;
      for (let c = 0; c < N; c++) if (!tmpGrid[r * N + c]) { full = false; break; }
      if (full) hlRows.push(r);
    }
    for (let c = c0; c < c0 + pc.w; c++) {
      let full = true;
      for (let r = 0; r < N; r++) if (!tmpGrid[r * N + c]) { full = false; break; }
      if (full) hlCols.push(c);
    }
    hlRows.forEach(r => { for (let c = 0; c < N; c++) hlSet[r * N + c] = 1; });
    hlCols.forEach(c => { for (let r = 0; r < N; r++) hlSet[r * N + c] = 1; });
  }

  /* =====================================================================
     Rendering
     ===================================================================== */
  function blit(sp, cx, cy, sz, alpha, rot) {
    if (sz <= 0.05 || alpha <= 0.003) return;
    const full = sz * (1 + 2 * M);
    ctx.globalAlpha = alpha;
    if (rot) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.drawImage(sp, -full / 2, -full / 2, full, full); ctx.restore(); }
    else ctx.drawImage(sp, cx - full / 2, cy - full / 2, full, full);
  }
  // Sprite der Farbe ci an der Stelle (x, y): außerhalb der Kreisblende gilt noch das alte Design
  function spr(ci, x, y) {
    if (tr) { const dx = x - tr.x, dy = y - tr.y; if (dx * dx + dy * dy > tr.r2) return tr.old.sprites[ci]; }
    return sprites[ci];
  }
  function slotC(i) { return { x: L.bx + L.slotW * (i + 0.5), y: L.trayY + L.trayH / 2 }; }
  // Maßstab eines Teils in der Ablage (1 = Feldgröße): jedes Teil füllt sein Fach so gut wie möglich aus
  function trayScale(pc) { return Math.min(0.68, (L.slotW - 16) / pc.w / L.cell, (L.trayH - 18) / pc.h / L.cell); }
  function drawPiece(pc, ci, cx, cy, cs, alpha, shadow) {
    if (shadow)
      for (const [r, c] of pc.cells) blit(shadowSp, cx + (c - (pc.w - 1) / 2) * cs + cs * 0.1, cy + (r - (pc.h - 1) / 2) * cs + cs * 0.32, cs, 0.75);
    for (const [r, c] of pc.cells) {
      const px = cx + (c - (pc.w - 1) / 2) * cs, py = cy + (r - (pc.h - 1) / 2) * cs;
      blit(spr(ci, px, py), px, py, cs, alpha);
    }
    ctx.globalAlpha = 1;
  }

  // Einstiegshilfe vor dem allerersten Zug: ein Geister-Teil wandert samt "Finger" aus der Ablage aufs Feld
  function drawTutorial() {
    if (store.tut || drag || over) return;
    const i = tray.findIndex(t => t && t.fits);
    if (i < 0) return;
    const t = tray[i], pc = t.piece, c = L.cell;
    let best = null, bd = 1e9;
    for (let r = 0; r <= N - pc.h; r++)
      for (let q = 0; q <= N - pc.w; q++) {
        if (!canPlace(pc, r, q)) continue;
        const d = Math.hypot(r + pc.h / 2 - N / 2, q + pc.w / 2 - N / 2);
        if (d < bd) { bd = d; best = [r, q]; }
      }
    if (!best) return;
    const h = slotC(i), k = (T % 2.6) / 2.6, m = clamp((k - 0.15) / 0.55, 0, 1), e = m * m * (3 - 2 * m);
    const a = k < 0.1 ? k / 0.1 : k > 0.85 ? (1 - k) / 0.15 : 1, sc = lerp(trayScale(pc), 1, e);
    const x = lerp(h.x, L.gx + (best[1] + pc.w / 2) * c, e), y = lerp(h.y, L.gy + (best[0] + pc.h / 2) * c, e);
    drawPiece(pc, t.color, x, y, c * sc, 0.55 * a, false);
    const fy = y + (pc.h * c * sc) / 2 + c * 0.3;
    ctx.globalAlpha = a * 0.25; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x, fy, c * (0.34 + 0.06 * Math.sin(T * 6)), 0, TAU); ctx.fill();
    ctx.globalAlpha = a * 0.95; ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, fy, c * 0.2, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawSweep() {
    const dt = T - sweepT0;
    if (dt < 0 || dt > 1.6) return;
    const c = L.cell, gap = c * 0.045, cr = c * (theme.board.cr == null ? 0.14 : theme.board.cr);
    ctx.fillStyle = theme.ui.accent;
    for (let r = 0; r < N; r++)
      for (let q = 0; q < N; q++) {
        const t = (dt - (r + q) * 0.04) / 0.42;
        if (t <= 0 || t >= 1) continue;
        ctx.globalAlpha = Math.sin(Math.PI * t) * 0.4;
        rr(ctx, L.gx + q * c + gap, L.gy + r * c + gap, c - 2 * gap, c - 2 * gap, cr); ctx.fill();
      }
    ctx.globalAlpha = 1;
  }

  function drawPreview() {
    if (!drag || !drag.snap || (!hlRows.length && !hlCols.length)) return;
    const c = L.cell;
    ctx.fillStyle = rgba(theme.colors[drag.t.color - 1], 0.22 + 0.1 * Math.sin(T * 9));
    for (const r of hlRows) { rr(ctx, L.gx, L.gy + r * c, c * N, c, c * 0.18); ctx.fill(); }
    for (const q of hlCols) { rr(ctx, L.gx + q * c, L.gy, c, c * N, c * 0.18); ctx.fill(); }
  }

  function drawCells() {
    const c = L.cell, pulse = 0.3 + 0.22 * Math.sin(T * 10);
    // Vorschau: Reihen, die gleich fertig werden, zeigen schon die Farbe des gezogenen Teils
    const hot = drag && drag.snap ? drag.t.color : 0;
    for (let i = 0; i < grid.length; i++) {
      const ci = grid[i];
      if (!ci) continue;
      const cx = L.gx + ((i % N) + 0.5) * c, cy = L.gy + (((i / N) | 0) + 0.5) * c;
      let sc = 1, sp = spr(hot && hlSet[i] ? hot : ci, cx, cy);
      const p = pop[i];
      if (p > 0) { const t = (T - p) / 0.32; if (t >= 1) pop[i] = 0; else sc = t <= 0 ? 0.5 : 0.5 + 0.5 * easeOutBack(t); }
      else if (p < 0) { const t = (T + p) / 0.24; if (t >= 1) pop[i] = 0; else if (t > 0) sc = 1 + 0.17 * Math.sin(Math.PI * t); }
      if (over && grey[i] && T >= grey[i]) {
        sp = spr(0, cx, cy);
        const t = (T - grey[i]) / 0.26;
        if (t < 1) sc *= 1 + 0.2 * Math.sin(Math.PI * t);
      }
      blit(sp, cx, cy, c * sc, 1);
      if (hlSet[i]) { ctx.globalCompositeOperation = 'lighter'; blit(sp, cx, cy, c * sc, pulse); ctx.globalCompositeOperation = 'source-over'; }
    }
    ctx.globalAlpha = 1;
    // Glanzlichter
    for (let k = glints.length - 1; k >= 0; k--) {
      const g = glints[k], t = (T - g.t0) / 0.6;
      if (t >= 1 || !grid[g.i]) { glints.splice(k, 1); continue; }
      star4(ctx, L.gx + ((g.i % N) + 0.27) * c, L.gy + (((g.i / N) | 0) + 0.27) * c, c * 0.34 * Math.sin(Math.PI * t), '#ffffff', 0.95);
    }
  }

  function drawGhost() {
    if (!drag || !drag.snap) return;
    const c = L.cell, pc = drag.t.piece, hot = hlRows.length + hlCols.length > 0;
    for (const [r, q] of pc.cells) {
      const px = L.gx + (drag.snap[1] + q + 0.5) * c, py = L.gy + (drag.snap[0] + r + 0.5) * c;
      blit(spr(drag.t.color, px, py), px, py, c, hot ? 0.8 : 0.45);
    }
    ctx.globalAlpha = 1;
  }

  function drawDying() {
    const c = L.cell, full = c * (1 + 2 * M);
    for (const d of dying) {
      const t = T - d.t0;
      const cx = L.gx + (d.q + 0.5) * c, cy = L.gy + (d.r + 0.5) * c;
      if (t < 0) { blit(spr(d.ci, cx, cy), cx, cy, c, 1); continue; }
      const sp = spr(d.to, cx, cy);
      if (t < FLIP) {
        // Farbwechsel: der Stein klappt um und kommt in der neuen Farbe zurück
        const u = t / FLIP, k = Math.sin(Math.PI * u), sc = 1 + 0.14 * k;
        ctx.save();
        ctx.translate(cx, cy); ctx.scale(Math.max(0.03, Math.abs(1 - 2 * u)) * sc, sc);
        ctx.globalAlpha = 1; ctx.drawImage(u < 0.5 ? spr(d.ci, cx, cy) : sp, -full / 2, -full / 2, full, full);
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * 0.9; ctx.drawImage(sp, -full / 2, -full / 2, full, full);
        ctx.restore();
        star4(ctx, cx, cy, c * 0.66 * k, '#ffffff', 0.9 * k);
        continue;
      }
      if (t < FLIP + HOLD) {
        blit(sp, cx, cy, c * 1.04, 1);
        ctx.globalCompositeOperation = 'lighter'; blit(sp, cx, cy, c * 1.04, 0.3); ctx.globalCompositeOperation = 'source-over';
        continue;
      }
      const u = (t - FLIP - HOLD) / OUT;
      if (u >= 1) continue;
      let sc, a = 1, flash, rot = 0;
      if (u < 0.3) { const v = u / 0.3; sc = 1.04 + 0.16 * v; flash = 0.3 + 0.7 * v; }
      else { const v = (u - 0.3) / 0.7; sc = 1.2 * (1 - easeInCubic(v)); a = 1 - v * v; flash = 1 - v; rot = v * d.spin * 0.5; }
      blit(sp, cx, cy, c * sc, a, rot);
      ctx.globalCompositeOperation = 'lighter';
      blit(sp, cx, cy, c * sc, a * flash * 0.85, rot);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
  }

  function drawBeams() {
    const c = L.cell;
    ctx.globalCompositeOperation = theme.ui.dark ? 'lighter' : 'source-over';
    for (let i = beams.length - 1; i >= 0; i--) {
      const b = beams[i], t = (T - b.t0) / 0.5;
      if (t < 0) continue;
      if (t >= 1) { beams.splice(i, 1); continue; }
      const th = c * (1.05 * (1 - t) + 0.1), ext = c * 0.9, len = L.bs + ext * 2;
      ctx.globalAlpha = (1 - t) * 0.95;
      ctx.save();
      if (b.row) ctx.translate(L.bx - ext, L.gy + (b.i + 0.5) * c);
      else { ctx.translate(L.gx + (b.i + 0.5) * c, L.by - ext); ctx.rotate(Math.PI / 2); }
      const g = ctx.createLinearGradient(0, 0, len, 0);
      g.addColorStop(0, rgba(b.col, 0)); g.addColorStop(0.14, rgba(b.col, 0.9)); g.addColorStop(0.5, 'rgba(255,255,255,1)');
      g.addColorStop(0.86, rgba(b.col, 0.9)); g.addColorStop(1, rgba(b.col, 0));
      ctx.fillStyle = g;
      rr(ctx, 0, -th / 2, len, th, th / 2); ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function drawRings() {
    ctx.globalCompositeOperation = theme.ui.dark ? 'lighter' : 'source-over';
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i], t = (T - r.t0) / r.dur;
      if (t < 0) continue;
      if (t >= 1) { rings.splice(i, 1); continue; }
      ctx.globalAlpha = (1 - t) * 0.85; ctx.strokeStyle = r.col; ctx.lineWidth = Math.max(0.5, r.lw * (1 - t));
      ctx.beginPath(); ctx.arc(r.x, r.y, lerp(r.r0, r.r1, easeOutCubic(t)), 0, TAU); ctx.stroke();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  }

  function drawTray() {
    for (let i = 0; i < 3; i++) {
      const t = tray[i];
      if (!t || (drag && drag.i === i)) continue;
      const h = slotC(i), k = (T - t.born) / 0.38;
      const grow = k <= 0 ? 0 : k >= 1 ? 1 : easeOutBack(k);
      let x = h.x, y = h.y, sc = trayScale(t.piece);
      if (t.ret) {
        const u = (T - t.ret.t0) / 0.2;
        if (u >= 1) t.ret = null;
        else { const e = easeOutCubic(u); x = lerp(t.ret.x, h.x, e); y = lerp(t.ret.y, h.y, e); sc = lerp(1, sc, e); }
      } else y += Math.sin(T * 2.2 + i * 1.7) * 1.6;
      drawPiece(t.piece, t.color, x, y, L.cell * sc * grow, t.fits ? 1 : 0.36, false);
    }
  }

  function drawFloaters() {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    const fs = L.cell * 0.8;
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i], t = T - f.t0;
      if (t < 0) continue;
      if (t >= 1) { floaters.splice(i, 1); continue; }
      const sc = t < 0.2 ? easeOutBack(t / 0.2) : 1;
      ctx.save();
      ctx.translate(clamp(f.x, L.bx + fs * 1.4, L.bx + L.bs - fs * 1.4), f.y - easeOutCubic(t) * L.cell * 1.7);
      ctx.scale(sc, sc);
      ctx.globalAlpha = t > 0.65 ? 1 - (t - 0.65) / 0.35 : 1;
      ctx.font = '700 ' + fs + 'px ' + FONT;
      ctx.lineWidth = fs * 0.2; ctx.strokeStyle = 'rgba(12,14,36,0.88)'; ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = lighten(f.col, 0.6); ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawBanner() {
    const b = banners[0];
    if (!b) return;
    if (!b.t0) b.t0 = T;
    const t = T - b.t0;
    if (t < 0) return;
    if (t > 1.3) { banners.shift(); return; }
    let sc = 1, a = 1, dy = 0;
    if (t < 0.3) { sc = lerp(2.5, 1, easeOutBack(t / 0.3)); a = Math.min(1, t / 0.12); }
    else if (t > 0.9) { const u = (t - 0.9) / 0.4; a = 1 - u; dy = -L.cell * u; sc = 1 + 0.12 * u; }
    let fs = L.bs * 0.15;
    ctx.save();
    ctx.font = '700 ' + fs + 'px ' + FONT;
    const tw = ctx.measureText(b.text).width, maxW = Math.min(W - 24, L.bs * 1.02);
    if (tw > maxW) { fs *= maxW / tw; ctx.font = '700 ' + fs + 'px ' + FONT; }
    ctx.translate(W / 2, L.by + L.bs * 0.42 + dy); ctx.scale(sc, sc); ctx.globalAlpha = a;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.lineWidth = fs * 0.17; ctx.strokeStyle = 'rgba(10,12,34,0.9)'; ctx.strokeText(b.text, 0, 0);
    const g = ctx.createLinearGradient(0, -fs * 0.5, 0, fs * 0.5);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, lighten(b.col, 0.25));
    ctx.shadowColor = b.col; ctx.shadowBlur = 22 * DPR; ctx.fillStyle = g; ctx.fillText(b.text, 0, 0);
    ctx.shadowBlur = 0;
    if (b.sub) {
      const f2 = fs * 0.46;
      ctx.font = '700 ' + f2 + 'px ' + FONT;
      ctx.lineWidth = f2 * 0.22; ctx.strokeText(b.sub, 0, fs * 0.82);
      ctx.fillStyle = '#ffffff'; ctx.fillText(b.sub, 0, fs * 0.82);
    }
    ctx.restore();
  }

  // Beschneidet auf das Innere (inside) oder Äußere der Kreisblende; Aufrufer macht ctx.restore()
  function clipWipe(inside) {
    ctx.save(); ctx.beginPath();
    if (!inside) ctx.rect(-40, -40, W + 80, H + 80);
    ctx.arc(tr.x, tr.y, tr.r, 0, TAU);
    ctx.clip('evenodd');
  }
  function drawWipeRim() {
    if (!tr) return;
    const k = clamp((T - tr.t0) / tr.dur, 0, 1);
    ctx.save();
    ctx.globalAlpha = (1 - k) * 0.7; ctx.strokeStyle = theme.ui.accent; ctx.lineWidth = 4 + 14 * (1 - k);
    ctx.beginPath(); ctx.arc(tr.x, tr.y, tr.r, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5 + 4 * (1 - k);
    ctx.shadowColor = theme.ui.accent; ctx.shadowBlur = 20 * DPR;
    ctx.stroke();
    ctx.restore();
  }

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(bgCv, 0, 0, W, H);
    if (tr) {
      // außerhalb des Kreises noch das alte Design, innerhalb schon das neue
      clipWipe(false); ctx.drawImage(tr.old.bgCv, 0, 0, W, H); drawAmbient(tr.amb, tr.old.theme.ambient, false); ctx.restore();
      clipWipe(true); drawAmbient(amb, theme.ambient, true); ctx.restore();
    } else drawAmbient(amb, theme.ambient, true);
    ctx.save();
    if (shake) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    ctx.drawImage(boardCv, L.bx - BM, L.by - BM, boardCv.width / DPR, boardCv.height / DPR);
    if (tr) { clipWipe(false); ctx.drawImage(tr.old.boardCv, L.bx - BM, L.by - BM, boardCv.width / DPR, boardCv.height / DPR); ctx.restore(); }
    drawSweep();
    drawPreview();
    drawCells();
    drawGhost();
    drawDying();
    drawBeams();
    drawRings();
    drawTray();
    ctx.restore();
    drawWipeRim();
    drawTutorial();
    drawParts(ctx, parts);
    if (drag) drawPiece(drag.t.piece, drag.t.color, drag.x, drag.y, L.cell * drag.sc, 1, true);
    drawFloaters();
    drawBanner();

    if (conf.length || topDirty) {
      tctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      tctx.clearRect(0, 0, W, H);
      drawParts(tctx, conf);
      topDirty = conf.length > 0;
    }
  }

  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now; T = now / 1000;
    update(dt); render();
    requestAnimationFrame(frame);
  }

  /* =====================================================================
     Eingabe
     ===================================================================== */
  function slotAt(x, y) {
    if (y < L.trayY - 14 || y > L.trayY + L.trayH + 34 || x < L.bx - 12 || x > L.bx + L.bs + 12) return -1;
    return clamp(Math.floor((x - L.bx) / L.slotW), 0, 2);
  }
  function onDown(e) {
    if (over || drag) return;
    wake();
    const i = slotAt(e.clientX, e.clientY);
    if (i < 0 || !tray[i]) return;
    const t = tray[i], h = slotC(i);
    drag = {
      i, t, id: e.pointerId, px: e.clientX, py: e.clientY, touch: e.pointerType !== 'mouse', t0: T,
      hx: h.x, hy: h.y, x: h.x, y: h.y, sc: trayScale(t.piece), key: -2, snap: null,
    };
    t.ret = null;
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignorieren */ }
    cv.style.cursor = 'grabbing';
    sfx.pick(); vib(8);
    e.preventDefault();
  }
  function onMove(e) {
    if (drag) { if (e.pointerId === drag.id) { drag.px = e.clientX; drag.py = e.clientY; } return; }
    if (e.pointerType === 'mouse') { const i = slotAt(e.clientX, e.clientY); cv.style.cursor = !over && i >= 0 && tray[i] ? 'grab' : ''; }
  }
  function onUp(e) {
    wake();
    if (!drag || e.pointerId !== drag.id) return;
    drag.px = e.clientX; drag.py = e.clientY;
    updDrag();
    const d = drag;
    drag = null; clearPreview(); cv.style.cursor = '';
    if (d.snap && e.type === 'pointerup') place(d.i, d.snap[0], d.snap[1]);
    else { d.t.ret = { x: d.x, y: d.y, t0: T }; sfx.back(); }
  }

  /* =====================================================================
     Oberfläche
     ===================================================================== */
  function openOv(id) { $(id).classList.add('open'); }
  function closeOv(id) { $(id).classList.remove('open'); }

  function refreshHud() {
    elScore.textContent = fmt(shown);
    elBest.textContent = fmt(store.best[N] || 0);
    $('startBest').textContent = fmt(store.best[N] || 0);
    updStreak();
  }
  function updStreak() {
    $('streakTxt').textContent = streak >= 2 ? 'Combo ×' + streak : '';
    document.querySelectorAll('#pips i').forEach((p, i) => p.classList.toggle('on', i < 3 - sinceClear));
    elStreak.classList.toggle('on', streak >= 2);
  }

  function applyUi() {
    const u = theme.ui, s = document.documentElement.style;
    s.setProperty('--txt', u.text); s.setProperty('--txt-sub', u.sub);
    const bright = lum(u.accent) > 0.3; // helle Akzentfarbe → dunkle Button-Schrift, sonst weiße
    s.setProperty('--accent', u.accent); s.setProperty('--accent-l', lighten(u.accent, bright ? 0.4 : 0.18)); s.setProperty('--accent-d', darken(u.accent, 0.38));
    s.setProperty('--btn-txt', bright ? '#10142c' : '#ffffff');
    s.setProperty('--pill-bg', u.dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)');
    s.setProperty('--pill-bd', u.dark ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.9)');
    s.setProperty('--txt-shadow', u.dark ? '0 2px 14px rgba(0,0,0,.45)' : '0 1px 0 rgba(255,255,255,.7)');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', u.meta);
    document.body.style.background = u.meta;
    [...$('logo').children].forEach((el, i) => {
      const c = theme.colors[i % theme.colors.length];
      el.style.background = 'linear-gradient(160deg,' + lighten(c, 0.28) + ',' + c + ' 55%,' + darken(c, 0.22) + ')';
    });
    document.querySelectorAll('.theme-card').forEach(el => el.classList.toggle('active', el.dataset.id === theme.id));
  }

  function lum(hex) {
    const n = parseInt(hex.slice(1), 16), f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
  }
  function showToast(text) {
    elToast.textContent = text;
    elToast.classList.remove('show'); void elToast.offsetWidth; elToast.classList.add('show');
  }

  // Design von Hand wählen (Design-Auswahl)
  function setTheme(id) {
    const th = THEMES.find(t => t.id === id);
    if (!th || th === theme) return;
    let o = null;
    if (nextL && nextL.theme === th) { o = nextL; nextL = null; }
    switchTheme(o || buildLayers(th), W / 2, L.by + L.bs / 2);
    persist(); sfx.theme(); prepNext();
  }

  let gridBuilt = false;
  function buildThemeGrid() {
    if (gridBuilt) return;
    gridBuilt = true;
    const host = $('themeGrid'), dpr = Math.min(window.devicePixelRatio || 1, 2), pw = 156, ph = 108, s = 21;
    const pattern = [[0, 0, 1], [1, 0, 1], [3, 0, 3], [0, 1, 4], [1, 1, 2], [2, 1, 2], [3, 1, 3], [0, 2, 4], [1, 2, 5], [2, 2, 6], [3, 2, 7]];
    const addCard = th => {
      const btn = document.createElement('button');
      btn.className = 'theme-card' + (th.id === theme.id ? ' active' : '');
      btn.dataset.id = th.id;
      const c = makeCanvas(pw * dpr, ph * dpr), g = c.getContext('2d');
      g.scale(dpr, dpr);
      th.bg(g, pw, ph, P.rng(5));
      const bw = s * 4 + 10, bh = s * 3 + 10, bx = (pw - bw) / 2, by = (ph - bh) / 2;
      g.save(); g.shadowColor = th.board.glow; g.shadowBlur = 10 * dpr;
      rr(g, bx, by, bw, bh, bw * (th.board.r == null ? 0.035 : th.board.r) * 1.6); g.fillStyle = th.board.a; g.fill(); g.restore();
      g.strokeStyle = th.board.frame; g.lineWidth = 1.5; g.stroke();
      const full = s * (1 + 2 * M);
      pattern.forEach((p, k) => {
        const sp = P.makeSprite(th.block, th.colors[p[2] - 1], Math.round(s * dpr), 7 + k * 13);
        g.drawImage(sp, bx + 5 + p[0] * s - M * s, by + 5 + p[1] * s - M * s, full, full);
        freeCanvas(sp);
      });
      const label = document.createElement('span');
      label.textContent = th.name;
      btn.appendChild(c); btn.appendChild(label);
      btn.addEventListener('click', () => setTheme(th.id));
      host.appendChild(btn);
    };
    // in kleinen Portionen aufbauen, damit das Öffnen nicht hakt
    let idx = 0;
    const step = () => {
      for (let n = 0; n < 5 && idx < THEMES.length; n++, idx++) addCard(THEMES[idx]);
      if (idx < THEMES.length) setTimeout(step, 16);
    };
    step();
  }
  function openThemes() { syncSettings(); buildThemeGrid(); openOv('ovThemes'); }

  function syncSettings() { $('optSound').checked = !!store.sound; $('optHaptic').checked = !!store.haptic; $('optAuto').checked = !!store.auto; $('optMusic').checked = !!store.music;
    document.querySelectorAll('#optTrack button').forEach((b, i) => b.classList.toggle('on', i === (sfx.musicState().on ? sfx.musicState().track : store.track | 0)));
  }

  function bind() {
    cv.addEventListener('pointerdown', onDown);
    cv.addEventListener('pointermove', onMove);
    cv.addEventListener('pointerup', onUp);
    cv.addEventListener('pointercancel', onUp);
    cv.addEventListener('contextmenu', e => e.preventDefault());
    // iOS: kein Scrollen, Zoomen oder Markieren während des Ziehens
    ['touchstart', 'touchmove'].forEach(ev => cv.addEventListener(ev, e => e.preventDefault(), { passive: false }));
    document.addEventListener('gesturestart', e => e.preventDefault());

    const tap = (id, fn) => $(id).addEventListener('click', () => { wake(); sfx.click(); fn(); });
    tap('btnPlay', () => closeOv('ovStart'));
    tap('btnStartThemes', openThemes);
    tap('btnThemes', openThemes);
    tap('btnOverThemes', openThemes);
    tap('btnSettings', () => { syncSettings(); openOv('ovSettings'); });
    tap('btnAgain', () => { closeOv('ovOver'); newGame(); });
    tap('btnNew', () => { closeOv('ovSettings'); closeOv('ovOver'); newGame(); });
    $('optSound').addEventListener('change', e => { store.sound = e.target.checked; sfx.setEnabled(store.sound); persist(); wake(); sfx.click(); });
    $('optHaptic').addEventListener('change', e => { store.haptic = e.target.checked; persist(); vib(20); });
    $('optMusic').addEventListener('change', e => { store.music = e.target.checked; persist(); wake(); });
    sfx.musicNames.forEach((name, i) => {
      const b = document.createElement('button');
      b.textContent = name;
      b.addEventListener('click', () => { store.track = i; store.music = true; persist(); sfx.unlock(); sfx.musicStart(i); musicInit = true; sfx.click(); syncSettings(); });
      $('optTrack').appendChild(b);
    });
    $('optAuto').addEventListener('change', e => {
      store.auto = e.target.checked; persist(); wake(); sfx.click();
      if (store.auto) prepNext(); else { clearTimeout(prepTimer); freeLayers(nextL); nextL = null; }
    });
    // Sheets schließen: X-Button oder Tipp neben das Sheet
    document.querySelectorAll('.overlay.top').forEach(ov => {
      ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('[data-close]')) { sfx.click(); ov.classList.remove('open'); } });
    });

    let rt = 0;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
    document.addEventListener('visibilitychange', () => { last = performance.now(); if (document.hidden && !over && grid) saveGame(); syncMusic(); });
  }

  /* ---------- Start ---------- */
  sfx.setEnabled(store.sound);
  alloc();
  applyUi();
  layout();
  if (!loadGame()) newGame();
  syncSettings();
  bind();
  requestAnimationFrame(frame);
  // Offline-Betrieb: Service Worker nur auf einer echten Web-Adresse (nicht in der lokalen Vorschau, außer mit ?sw=1)
  if ('serviceWorker' in navigator && /^https?:/.test(location.protocol) && (!/^(localhost|127.0.0.1)$/.test(location.hostname) || /[?&]sw=1/.test(location.search)))
    navigator.serviceWorker.register('sw.js').catch(() => { /* z. B. in eingebetteten Ansichten nicht erlaubt */ });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { topDirty = true; });
})();
