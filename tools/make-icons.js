// Erzeugt die App-Symbole (PNG) für Home-Bildschirm und Manifest – ohne Zusatzpakete.
// Aufruf: node tools/make-icons.js
const fs = require('fs'), path = require('path'), zlib = require('zlib');

const GEMS = ['#ff3b4e', '#ffd92e', '#27c7ff', '#3ddc5a'];
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const BG = [hex('#0e4f4c'), hex('#0b2c58'), hex('#0a1233')];

// Farbe eines Punktes (u, v in 0..1): Verlauf mit vier facettierten Juwelen
function pixel(u, v) {
  let col = v < 0.55 ? mix(BG[0], BG[1], v / 0.55) : mix(BG[1], BG[2], (v - 0.55) / 0.45);
  const size = 0.3, gap = 0.035, start = 0.5 - size - gap / 2;
  for (let i = 0; i < 4; i++) {
    const x0 = start + (i % 2) * (size + gap), y0 = start + ((i / 2) | 0) * (size + gap);
    const x = (u - x0) / size, y = (v - y0) / size;
    if (x < 0 || x > 1 || y < 0 || y > 1) continue;
    // abgerundete Ecken
    const r = 0.17, cx = Math.min(Math.max(x, r), 1 - r), cy = Math.min(Math.max(y, r), 1 - r);
    if (Math.hypot(x - cx, y - cy) > r) continue;
    const base = hex(GEMS[i]), b = 0.2, white = [255, 255, 255], black = [0, 0, 0];
    const d = Math.min(x, y, 1 - x, 1 - y);
    if (d >= b) col = mix(mix(base, white, 0.2), mix(base, black, 0.12), (x + y) / 2);
    else if (y === d) col = mix(base, white, 0.56);
    else if (x === d) col = mix(base, white, 0.24);
    else if (1 - x === d) col = mix(base, black, 0.2);
    else col = mix(base, black, 0.44);
  }
  return col;
}

function crc32(buf) {
  let c, crc = ~0;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return ~crc >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function png(n) {
  const raw = Buffer.alloc((n * 3 + 1) * n), S = 3; // 3×3-Überabtastung für glatte Kanten
  for (let y = 0; y < n; y++) {
    raw[y * (n * 3 + 1)] = 0;
    for (let x = 0; x < n; x++) {
      const acc = [0, 0, 0];
      for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const c = pixel((x + (i + 0.5) / S) / n, (y + (j + 0.5) / S) / n); acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; }
      const o = y * (n * 3 + 1) + 1 + x * 3;
      raw[o] = acc[0] / 9; raw[o + 1] = acc[1] / 9; raw[o + 2] = acc[2] / 9;
    }
  }
  const head = Buffer.alloc(13);
  head.writeUInt32BE(n, 0); head.writeUInt32BE(n, 4); head[8] = 8; head[9] = 2; // 8 Bit, RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', head), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const dir = path.join(__dirname, '..', 'icons');
fs.mkdirSync(dir, { recursive: true });
for (const n of [180, 192, 512]) {
  fs.writeFileSync(path.join(dir, 'icon-' + n + '.png'), png(n));
  console.log('icon-' + n + '.png');
}
