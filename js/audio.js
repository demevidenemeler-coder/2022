/* Prisma – Soundeffekte, komplett per WebAudio synthetisiert (keine Dateien nötig) */
(function () {
  'use strict';
  const P = (window.PRISMA = window.PRISMA || {});
  let ac = null, master = null, enabled = true, noiseBuf = null;

  function unlock() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = 0.55;
        const comp = ac.createDynamicsCompressor();
        master.connect(comp); comp.connect(ac.destination);
        noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      } catch (e) { ac = null; }
    }
    // iOS meldet nach einer Unterbrechung "interrupted" statt "suspended"
    if (ac && ac.state !== 'running') { try { ac.resume(); } catch (e) { /* ignorieren */ } }
  }

  function tone(o) {
    if (!ac || !enabled) return;
    const t0 = ac.currentTime + (o.t || 0), d = o.d || 0.15;
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f, t0);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t0 + d);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.v || 0.2, t0 + (o.a || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    osc.connect(g); g.connect(master);
    osc.start(t0); osc.stop(t0 + d + 0.03);
  }

  function noise(o) {
    if (!ac || !enabled) return;
    const t0 = ac.currentTime + (o.t || 0), d = o.d || 0.1;
    const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf;
    f.type = 'bandpass'; f.frequency.setValueAtTime(o.f || 3000, t0); f.Q.value = o.q || 0.8;
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t0 + d);
    g.gain.setValueAtTime(o.v || 0.15, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + d + 0.03);
  }

  /* =====================================================================
     Hintergrundmusik – vier ruhige Stücke, live erzeugt (Akkorde, Bass, Melodie, leises Schlagzeug)
     ===================================================================== */
  let mBus = null, mOut = null, mDelay = null, mTimer = 0, mNext = 0, mStep = 0, mTrack = 0, mOn = false, mSwitchAt = 0, mFading = false;
  const TRACK_SECS = 95; // nach dieser Zeit blendet die Musik von selbst zum nächsten Stück über
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const pick = a => a[(Math.random() * a.length) | 0];

  function musicBus() {
    if (mBus || !ac) return;
    mOut = ac.createGain(); mOut.gain.value = 0.0001;
    const soft = ac.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 7000;
    mBus = ac.createGain();
    mBus.connect(soft); soft.connect(mOut); mOut.connect(master);
    // weiches Echo für Glocken und Arpeggios
    mDelay = ac.createDelay(1); mDelay.delayTime.value = 0.36;
    const fb = ac.createGain(); fb.gain.value = 0.36;
    const dark = ac.createBiquadFilter(); dark.type = 'lowpass'; dark.frequency.value = 2600;
    mDelay.connect(dark); dark.connect(fb); fb.connect(mDelay); dark.connect(soft);
  }
  // Ein Ton: m = MIDI-Note, d = Dauer, v = Lautstärke; o: a (Anschlag), lp (Filter), send (Echo), det, hold
  function mNote(m, t, d, v, type, o) {
    o = o || {};
    const osc = ac.createOscillator(), g = ac.createGain(), a = o.a || 0.012;
    osc.type = type; osc.frequency.value = mtof(m);
    if (o.det) osc.detune.value = o.det;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v, t + a);
    if (o.hold) { g.gain.setValueAtTime(v, t + d * 0.7); g.gain.linearRampToValueAtTime(0.0001, t + d); }
    else g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    let out = g;
    if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; g.connect(f); out = f; }
    osc.connect(g); out.connect(mBus);
    if (o.send) { const s = ac.createGain(); s.gain.value = o.send; out.connect(s); s.connect(mDelay); }
    osc.start(t); osc.stop(t + d + 0.05);
  }
  function mNoise(t, d, v, type, f) {
    const src = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = noiseBuf; fl.type = type; fl.frequency.value = f;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(fl); fl.connect(g); g.connect(mBus);
    src.start(t, Math.random() * 0.3); src.stop(t + d + 0.03);
  }
  const V = { // Instrumente
    ep(m, t, d, v) { mNote(m, t, d, v, 'triangle', { lp: 1800, send: 0.15 }); mNote(m, t, d * 0.6, v * 0.4, 'sine', { det: 6 }); },
    bass(m, t, d, v) { mNote(m, t, d, v, 'sine', { a: 0.02 }); mNote(m, t, d, v * 0.35, 'triangle', { a: 0.02, lp: 320 }); },
    bell(m, t, d, v) { mNote(m, t, d, v, 'sine', { send: 0.5 }); mNote(m + 12, t, d * 0.5, v * 0.25, 'sine', { send: 0.4 }); },
    pad(m, t, d, v) { mNote(m, t, d, v, 'sawtooth', { a: d * 0.3, lp: 760, hold: true, send: 0.2 }); mNote(m, t, d, v, 'sawtooth', { a: d * 0.3, lp: 760, hold: true, det: 9 }); },
    pluck(m, t, d, v) { mNote(m, t, d, v, 'triangle', { lp: 2600, send: 0.35 }); },
    arp(m, t, d, v) { mNote(m, t, d, v, 'sawtooth', { lp: 1500, send: 0.3 }); },
    kick(t, v) {
      const osc = ac.createOscillator(), g = ac.createGain();
      osc.frequency.setValueAtTime(110, t); osc.frequency.exponentialRampToValueAtTime(45, t + 0.18);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
      osc.connect(g); g.connect(mBus); osc.start(t); osc.stop(t + 0.28);
    },
    hat(t, v) { mNoise(t, 0.04, v, 'highpass', 7000); },
    snare(t, v) { mNoise(t, 0.13, v, 'bandpass', 1800); },
  };
  // b = Bassnote, n = Akkordtöne (MIDI)
  const TRACKS = [
    {
      name: 'Lo-Fi Lounge', bpm: 72, swing: 0.28, bars: 1,
      chords: [{ b: 38, n: [53, 57, 60, 64] }, { b: 43, n: [53, 57, 59, 64] }, { b: 36, n: [52, 55, 59, 62] }, { b: 33, n: [52, 55, 59, 60] }],
      step(s, c, t) {
        if (s === 0) { c.n.forEach((m, i) => V.ep(m, t + i * 0.012, 2.6, 0.075)); V.bass(c.b, t, 0.9, 0.2); }
        if (s === 10) c.n.forEach((m, i) => V.ep(m, t + i * 0.01, 1.2, 0.04));
        if (s === 7) V.bass(c.b, t, 0.4, 0.13);
        if (s === 14) V.bass(c.b + 7, t, 0.4, 0.12);
        if (s === 0 || s === 10) V.kick(t, 0.4);
        if (s === 4 || s === 12) V.snare(t, 0.07);
        if (s % 2 === 0) V.hat(t, s % 4 === 2 ? 0.045 : 0.025);
        if ((s === 3 || s === 6 || s === 8 || s === 11 || s === 13) && Math.random() < 0.32) V.bell(pick(c.n) + (Math.random() < 0.3 ? 24 : 12), t, 1.4, 0.06);
      },
    },
    {
      name: 'Traumwolken', bpm: 60, bars: 2,
      chords: [{ b: 41, n: [57, 60, 64, 69] }, { b: 45, n: [55, 60, 64, 67] }, { b: 38, n: [53, 57, 60, 64] }, { b: 43, n: [55, 59, 62, 66] }],
      step(s, c, t, sd) {
        if (s === 0) { c.n.forEach(m => V.pad(m, t, sd * 18, 0.034)); V.bass(c.b, t, sd * 14, 0.16); }
        if (s % 2 === 0 && Math.random() < 0.42) V.bell(pick(c.n) + (Math.random() < 0.4 ? 24 : 12), t, 2.6, 0.055);
      },
    },
    {
      name: 'Sonnendeck', bpm: 104, bars: 1,
      chords: [{ b: 45, n: [57, 60, 64, 67] }, { b: 41, n: [53, 57, 60, 64] }, { b: 36, n: [55, 60, 64, 67] }, { b: 43, n: [55, 59, 62, 64] }],
      pat: [0, -1, -1, 1, -1, -1, 2, -1, 3, -1, -1, 2, -1, -1, 1, -1],
      step(s, c, t, sd) {
        if (s === 0) c.n.forEach(m => V.pad(m, t, sd * 15, 0.022));
        if (s % 4 === 0) V.kick(t, 0.38);
        if (s % 4 === 2) { V.hat(t, 0.04); V.bass(c.b, t, sd * 1.6, 0.17); }
        if (s === 4 || s === 12) V.snare(t, 0.05);
        if (this.pat[s] >= 0) V.pluck(c.n[this.pat[s]] + 12, t, 0.32, 0.085);
      },
    },
    {
      name: 'Sternenstaub', bpm: 88, bars: 1,
      chords: [{ b: 40, n: [52, 55, 59, 64] }, { b: 36, n: [52, 55, 60, 64] }, { b: 43, n: [50, 55, 59, 62] }, { b: 38, n: [50, 54, 57, 62] }],
      pat: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, 2, 1, 3],
      step(s, c, t, sd) {
        if (s === 0) c.n.forEach(m => V.pad(m, t, sd * 16, 0.028));
        if (s % 2 === 0) mNote(c.b, t, sd * 1.7, 0.11, 'sawtooth', { lp: 420 });
        V.arp(c.n[this.pat[s]] + 12, t, sd * 1.5, 0.04);
        if (s === 0 || s === 8) V.kick(t, 0.36);
        if (s === 4 || s === 12) V.snare(t, 0.06);
      },
    },
  ];
  function mTick() {
    if (!ac || ac.state !== 'running') return;
    if (!mFading && ac.currentTime > mSwitchAt) {
      // ausblenden, nächstes Stück wählen, wieder einblenden
      mFading = true;
      mOut.gain.setTargetAtTime(0.0001, ac.currentTime, 0.5);
      setTimeout(() => {
        mFading = false;
        if (!mOn) return;
        mTrack = (mTrack + 1) % TRACKS.length; mStep = 0; mNext = 0; mSwitchAt = ac.currentTime + TRACK_SECS;
        mOut.gain.setTargetAtTime(0.6, ac.currentTime, 0.6);
      }, 2200);
    }
    if (mFading) return;
    const trk = TRACKS[mTrack], sd = 60 / trk.bpm / 4;
    if (mNext < ac.currentTime) mNext = ac.currentTime + 0.05;
    while (mNext < ac.currentTime + 0.35) {
      const s = mStep % 16, bar = (mStep / 16) | 0;
      trk.step(s, trk.chords[((bar / trk.bars) | 0) % trk.chords.length], mNext + (trk.swing && s % 2 ? sd * trk.swing : 0), sd);
      mStep++; mNext += sd;
    }
  }
  function musicStart(i) {
    if (!ac) return;
    musicBus();
    if (i != null && i !== mTrack) { mTrack = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length; mStep = 0; mSwitchAt = ac.currentTime + TRACK_SECS; }
    if (mOn) return;
    mOn = true; mNext = 0; mSwitchAt = ac.currentTime + TRACK_SECS;
    mOut.gain.cancelScheduledValues(ac.currentTime);
    mOut.gain.setTargetAtTime(0.6, ac.currentTime, 0.5);
    mTimer = setInterval(mTick, 60);
    mTick();
  }
  function musicStop() {
    if (!mOn) return;
    mOn = false; clearInterval(mTimer);
    if (ac && mOut) { mOut.gain.cancelScheduledValues(ac.currentTime); mOut.gain.setTargetAtTime(0.0001, ac.currentTime, 0.12); }
  }

  // C-Dur-Pentatonik – jede Combo-Stufe klingt eine Stufe höher
  const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760, 2093];

  P.audio = {
    unlock,
    setEnabled(v) { enabled = !!v; },
    musicStart, musicStop,
    musicNames: TRACKS.map(t => t.name),
    musicState() { return { on: mOn, track: mTrack, step: mStep, ctx: ac ? ac.state : 'none' }; },
    pick() { tone({ f: 520, f2: 800, d: 0.08, v: 0.16 }); },
    place() { tone({ f: 200, f2: 85, type: 'triangle', d: 0.13, v: 0.42 }); noise({ d: 0.05, v: 0.1, f: 2200 }); },
    back() { tone({ f: 320, f2: 190, d: 0.12, v: 0.13 }); },
    click() { tone({ f: 900, f2: 620, d: 0.05, v: 0.11 }); },
    clear(lines, streak) {
      const base = Math.min(Math.max(streak - 1, 0), 5), n = Math.min(lines + 2, 6);
      for (let i = 0; i < n; i++) {
        const f = SCALE[Math.min(base + i, SCALE.length - 1)];
        tone({ f, t: i * 0.065, d: 0.5, v: 0.2 });
        tone({ f: f * 2, type: 'triangle', t: i * 0.065, d: 0.3, v: 0.06 });
      }
      noise({ d: 0.3, v: 0.09, f: 5000, f2: 9000, q: 0.5 });
      tone({ f: 120, f2: 50, type: 'sine', d: 0.22, v: 0.3 + Math.min(lines, 4) * 0.05 });
    },
    whoosh() { noise({ d: 0.55, v: 0.07, f: 500, f2: 5000, q: 0.7 }); tone({ f: 280, f2: 900, d: 0.4, v: 0.05 }); },
    theme() { [660, 880, 1320].forEach((f, i) => tone({ f, t: i * 0.05, d: 0.28, v: 0.13 })); },
    over() { [392, 329.63, 261.63, 196].forEach((f, i) => tone({ f, type: 'triangle', t: i * 0.17, d: 0.4, v: 0.24 })); },
    record() {
      [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
        tone({ f, type: 'triangle', t: i * 0.09, d: 0.35, v: 0.2 });
        tone({ f: f * 2, t: i * 0.09, d: 0.25, v: 0.06 });
      });
    },
  };
})();
