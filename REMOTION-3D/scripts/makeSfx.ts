// Procedural sound effects (no downloads, no third-party recordings). Deterministic: seeded noise.
// Usage: tsx scripts/makeSfx.ts            -> public/sfx/*.wav (48 kHz mono, peak -3 dBFS)
import fs from "node:fs";
import path from "node:path";
import { PUBLIC } from "./paths";

const SR = 48000;
const TAU = Math.PI * 2;

// ---------- tiny DSP kit ----------
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const buf = (sec: number) => new Float32Array(Math.round(sec * SR));
const expDecay = (t: number, tau: number) => Math.exp(-t / tau);
const ar = (t: number, a: number, r: number) => (t < a ? t / a : Math.exp(-(t - a) / r));

// Sine with a frequency function f(t); phase accumulates so sweeps stay smooth
const sweep = (out: Float32Array, f: (t: number) => number, amp: (t: number) => number, start = 0, phase0 = 0) => {
  let ph = phase0;
  for (let i = Math.round(start * SR); i < out.length; i++) {
    const t = i / SR - start;
    ph += (TAU * f(t)) / SR;
    out[i] += Math.sin(ph) * amp(t);
  }
};

// Biquad filter with per-sample cutoff (RBJ cookbook)
type FType = "lp" | "hp" | "bp";
const biquad = (x: Float32Array, type: FType, fc: (t: number) => number, q = 0.707) => {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const w0 = (TAU * Math.min(SR * 0.45, Math.max(20, fc(i / SR)))) / SR;
    const cs = Math.cos(w0);
    const al = Math.sin(w0) / (2 * q);
    let b0: number, b1: number, b2: number;
    if (type === "lp") {
      b0 = (1 - cs) / 2;
      b1 = 1 - cs;
      b2 = (1 - cs) / 2;
    } else if (type === "hp") {
      b0 = (1 + cs) / 2;
      b1 = -(1 + cs);
      b2 = (1 + cs) / 2;
    } else {
      b0 = al;
      b1 = 0;
      b2 = -al;
    }
    const a0 = 1 + al;
    const a1 = -2 * cs;
    const a2 = 1 - al;
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = v;
    y[i] = v;
  }
  return y;
};

const noise = (sec: number, seed: number) => {
  const r = mulberry32(seed);
  const o = buf(sec);
  for (let i = 0; i < o.length; i++) o[i] = r() * 2 - 1;
  return o;
};

// Small Schroeder room so effects sit in the same space
const reverb = (x: Float32Array, mix = 0.18, size = 1) => {
  // Fade the dry tail first: a hard cut there would be a click inside the reverb tail
  const fade = Math.round(0.04 * SR);
  for (let i = Math.max(0, x.length - fade); i < x.length; i++) x[i] *= (x.length - i) / fade;
  const tail = Math.round(0.6 * SR);
  const y = new Float32Array(x.length + tail);
  y.set(x);
  const combs = [1557, 1617, 1491, 1422].map((d) => Math.round(d * size));
  const wet = new Float32Array(y.length);
  for (const d of combs) {
    const line = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < y.length; i++) {
      const out = line[idx];
      line[idx] = y[i] + out * 0.78;
      idx = (idx + 1) % d;
      wet[i] += out / combs.length;
    }
  }
  for (const d of [225, 556]) {
    const line = new Float32Array(d);
    let idx = 0;
    for (let i = 0; i < wet.length; i++) {
      const bufOut = line[idx];
      const v = -wet[i] + bufOut;
      line[idx] = wet[i] + bufOut * 0.5;
      idx = (idx + 1) % d;
      wet[i] = v;
    }
  }
  for (let i = 0; i < y.length; i++) y[i] = y[i] * (1 - mix) + wet[i] * mix;
  return y;
};

const add = (a: Float32Array, b: Float32Array, gain = 1, offsetSec = 0) => {
  const o = Math.round(offsetSec * SR);
  for (let i = 0; i < b.length && i + o < a.length; i++) a[i + o] += b[i] * gain;
  return a;
};
const env = (x: Float32Array, e: (t: number) => number) => {
  for (let i = 0; i < x.length; i++) x[i] *= e(i / SR);
  return x;
};

// Normalise to a peak, trim trailing silence, 3 ms fades so nothing clicks
const finish = (x: Float32Array, peakDb = -3) => {
  let peak = 0;
  for (const v of x) peak = Math.max(peak, Math.abs(v));
  const g = peak > 0 ? Math.pow(10, peakDb / 20) / peak : 1;
  let end = x.length;
  while (end > 1 && Math.abs(x[end - 1] * g) < 0.0005) end--;
  const y = x.slice(0, Math.min(x.length, end + Math.round(0.01 * SR)));
  const f = Math.round(0.003 * SR);
  for (let i = 0; i < y.length; i++) {
    let k = g;
    if (i < f) k *= i / f;
    if (i > y.length - f) k *= (y.length - i) / f;
    y[i] = Math.tanh(y[i] * k * 1.05) / Math.tanh(1.05);
  }
  return y;
};

const writeWav = (file: string, x: Float32Array) => {
  const data = Buffer.alloc(x.length * 2);
  for (let i = 0; i < x.length; i++) data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(x[i] * 32767))), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, data]));
};

// ---------- the effects ----------
const FX: Record<string, () => Float32Array> = {
  // Heavy metal box landing: inharmonic partials, transient, low thump
  clang: () => {
    const o = buf(1.6);
    const parts: [number, number, number][] = [
      [196, 0.9, 0.55],
      [523, 0.6, 0.38],
      [887, 0.45, 0.3],
      [1373, 0.3, 0.22],
      [2011, 0.18, 0.14],
    ];
    for (const [f, a, tau] of parts) sweep(o, () => f, (t) => a * expDecay(t, tau) * (1 + 0.12 * Math.sin(TAU * 5.5 * t)));
    add(o, env(biquad(noise(0.08, 3), "hp", () => 1800), (t) => expDecay(t, 0.015)), 0.9);
    sweep(o, (t) => 70 - 20 * t, (t) => 1.1 * expDecay(t, 0.09));
    return reverb(o, 0.22);
  },
  // Elevator chime, two soft bell tones
  ding: () => {
    const o = buf(2.0);
    for (const [f0, at] of [
      [1318.5, 0],
      [1046.5, 0.32],
    ] as [number, number][]) {
      for (const [m, a, tau] of [
        [1, 0.8, 0.7],
        [2.01, 0.25, 0.35],
        [3.02, 0.1, 0.2],
      ] as [number, number, number][])
        sweep(o, () => f0 * m, (t) => (t < 0.004 ? t / 0.004 : 1) * a * expDecay(t, tau), at);
    }
    return reverb(o, 0.25);
  },
  // Cartoon pop for things appearing
  pop: () => {
    const o = buf(0.25);
    sweep(o, (t) => 900 * Math.exp(-t * 28) + 180, (t) => ar(t, 0.002, 0.05));
    add(o, env(biquad(noise(0.02, 5), "bp", () => 3000, 1.2), (t) => expDecay(t, 0.004)), 0.5);
    return o;
  },
  // Bigger pop for the end card
  bigPop: () => {
    const o = buf(0.5);
    sweep(o, (t) => 600 * Math.exp(-t * 18) + 110, (t) => ar(t, 0.003, 0.09));
    sweep(o, (t) => 1200 * Math.exp(-t * 22) + 300, (t) => 0.4 * ar(t, 0.002, 0.05));
    add(o, env(biquad(noise(0.04, 9), "bp", () => 2200, 0.9), (t) => expDecay(t, 0.008)), 0.6);
    return reverb(o, 0.2);
  },
  // Rubber-ball bounce of a ring off the wall
  boing: () => {
    const o = buf(0.7);
    sweep(o, (t) => 180 + 260 * Math.exp(-t * 6) + 35 * Math.sin(TAU * 18 * t) * Math.exp(-t * 4), (t) => ar(t, 0.004, 0.18));
    return reverb(o, 0.15);
  },
  // Signal wave leaving the tower: soft rising wub with tremolo
  wave: () => {
    const o = buf(0.9);
    sweep(o, (t) => 320 + 340 * t, (t) => Math.sin(Math.PI * Math.min(1, t / 0.85)) * (0.6 + 0.4 * Math.sin(TAU * 14 * t)) * 0.7);
    sweep(o, (t) => 640 + 680 * t, (t) => Math.sin(Math.PI * Math.min(1, t / 0.85)) * 0.18);
    return reverb(o, 0.3);
  },
  // Signal bars dropping: three falling beeps
  barsDown: () => {
    const o = buf(0.9);
    [988, 740, 494].forEach((f, k) => sweep(o, () => f, (t) => (t < 0 ? 0 : ar(t, 0.003, 0.06)) * 0.7, k * 0.17));
    return o;
  },
  // Rising arpeggio, bars back to full
  barsUp: () => {
    const o = buf(1.0);
    [523, 659, 784, 1047].forEach((f, k) => {
      sweep(o, () => f, (t) => ar(t, 0.004, 0.12) * 0.6, k * 0.09);
      sweep(o, () => f * 2, (t) => ar(t, 0.004, 0.06) * 0.15, k * 0.09);
    });
    return reverb(o, 0.2);
  },
  // Call dropped: three short tone pulses
  callDrop: () => {
    const o = buf(1.0);
    for (let k = 0; k < 3; k++) sweep(o, () => 425, (t) => (t < 0.18 ? Math.min(1, t / 0.005, (0.18 - t) / 0.005) : 0) * 0.6, k * 0.3);
    return biquad(o, "lp", () => 3200);
  },
  // Glints and shimmer
  sparkle: () => {
    const o = buf(1.0);
    const r = mulberry32(21);
    for (let k = 0; k < 9; k++) {
      const f = 2200 + r() * 2600;
      sweep(o, () => f, (t) => ar(t, 0.002, 0.09) * (0.25 + 0.3 * r()), k * 0.06 + r() * 0.03);
    }
    return reverb(o, 0.35);
  },
  // Charges shifting: low wobbling ripple
  ripple: () => {
    const o = buf(1.1);
    sweep(o, (t) => 140 + 40 * Math.sin(TAU * 7 * t), (t) => Math.sin(Math.PI * Math.min(1, t / 1.0)) * 0.7);
    sweep(o, (t) => 280 + 70 * Math.sin(TAU * 7 * t + 1), (t) => Math.sin(Math.PI * Math.min(1, t / 1.0)) * 0.25);
    return reverb(o, 0.25);
  },
  // Fast camera move or object flying past
  whoosh: () => {
    const n = noise(0.6, 31);
    const shaped = biquad(n, "bp", (t) => 400 + 3200 * Math.sin(Math.PI * Math.min(1, t / 0.55)), 1.3);
    return env(shaped, (t) => Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.55)), 2));
  },
  // Rings fading out inside the box
  fadeOut: () => {
    const n = noise(1.2, 41);
    return env(biquad(n, "bp", (t) => 2400 - 1900 * t, 2.5), (t) => Math.sin(Math.PI * Math.min(1, t / 1.15)) * 0.8);
  },
  // Weak single bar buzzing
  buzz: () => {
    const o = buf(0.8);
    let ph = 0;
    for (let i = 0; i < o.length; i++) {
      const t = i / SR;
      ph += (TAU * 118) / SR;
      const saw = 2 * ((ph / TAU) % 1) - 1;
      o[i] = saw * (0.5 + 0.5 * Math.sin(TAU * 9 * t)) * Math.min(1, t / 0.01, (0.8 - t) / 0.05) * 0.5;
    }
    return biquad(o, "lp", () => 1400);
  },
  // Antenna motor turning
  servo: () => {
    const o = buf(0.9);
    let ph = 0;
    for (let i = 0; i < o.length; i++) {
      const t = i / SR;
      ph += (TAU * (180 + 220 * Math.min(1, t / 0.3) - 120 * Math.max(0, t - 0.6))) / SR;
      const saw = 2 * ((ph / TAU) % 1) - 1;
      o[i] = saw * Math.min(1, t / 0.03, (0.9 - t) / 0.08) * 0.4;
    }
    return biquad(o, "bp", () => 900, 0.8);
  },
  // Cable crawling down: rising zip
  zip: () => {
    const n = noise(0.9, 51);
    const z = biquad(n, "bp", (t) => 800 + 2600 * t, 4);
    return env(z, (t) => Math.min(1, t / 0.05, (0.9 - t) / 0.1) * (0.6 + 0.4 * Math.sin(TAU * 32 * t)));
  },
  // Lift motor while the cabin races up and down
  rumble: () => {
    const n = noise(2.4, 61);
    const lo = biquad(n, "lp", (t) => 220 + 120 * Math.sin(TAU * 1.2 * t), 0.9);
    const o = env(lo, (t) => Math.min(1, t / 0.2, (2.4 - t) / 0.3));
    sweep(o, (t) => 55 + 25 * Math.sin(TAU * 1.2 * t), (t) => 0.35 * Math.min(1, t / 0.2, (2.4 - t) / 0.3));
    return o;
  },
  // Soft body bump
  thud: () => {
    const o = buf(0.4);
    sweep(o, (t) => 95 * Math.exp(-t * 9) + 45, (t) => ar(t, 0.002, 0.08));
    add(o, env(biquad(noise(0.03, 71), "lp", () => 900), (t) => expDecay(t, 0.006)), 0.6);
    return o;
  },
  // Repeater LED blink tick
  blip: () => {
    const o = buf(0.15);
    sweep(o, () => 1760, (t) => ar(t, 0.002, 0.025) * 0.6);
    return o;
  },
  // Phone hang-up click
  click: () => {
    const o = env(biquad(noise(0.05, 81), "bp", () => 2500, 1.5), (t) => expDecay(t, 0.006));
    sweep(o, () => 1200, (t) => ar(t, 0.001, 0.01) * 0.4);
    return o;
  },
  // Pigeon "ghost": breathy wobbling woo
  ghost: () => {
    const o = buf(1.4);
    sweep(o, (t) => 520 - 140 * t + 26 * Math.sin(TAU * 5.2 * t), (t) => Math.sin(Math.PI * Math.min(1, t / 1.35)) * 0.55);
    add(o, env(biquad(noise(1.4, 91), "bp", (t) => 600 - 150 * t, 3), (t) => Math.sin(Math.PI * Math.min(1, t / 1.35)) * 0.35), 1);
    return reverb(o, 0.35);
  },
  // Puff of disappearing
  poof: () => {
    const n = noise(0.5, 101);
    return reverb(env(biquad(n, "lp", (t) => 2600 * Math.exp(-t * 5) + 300), (t) => ar(t, 0.005, 0.1)), 0.2);
  },
  // Wing flaps: soft low noise bursts
  flap: () => {
    const o = buf(0.6);
    for (let k = 0; k < 4; k++) add(o, env(biquad(noise(0.09, 111 + k), "lp", () => 700), (t) => Math.sin(Math.PI * Math.min(1, t / 0.08))), 0.8, k * 0.12);
    return o;
  },
  // Correct answer: two bright notes up
  correct: () => {
    const o = buf(1.0);
    [784, 1175].forEach((f, k) => {
      sweep(o, () => f, (t) => ar(t, 0.004, 0.22) * 0.6, k * 0.13);
      sweep(o, () => f * 2.01, (t) => ar(t, 0.004, 0.12) * 0.18, k * 0.13);
    });
    return reverb(o, 0.25);
  },
};

const dir = path.join(PUBLIC, "sfx");
fs.mkdirSync(dir, { recursive: true });
for (const [name, make] of Object.entries(FX)) {
  const x = finish(make());
  writeWav(path.join(dir, `${name}.wav`), x);
  console.log(`${name.padEnd(9)} ${(x.length / SR).toFixed(2)} s`);
}
console.log(`makeSfx: ${Object.keys(FX).length} effects -> public/sfx`);
