// Deterministic noise helpers (no Math.random anywhere in the render path).

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const hashString = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

// Seeded PRNG keyed by a string
export const rng = (key: string) => mulberry32(hashString(key));

const hash2 = (x: number, y: number, seed: number) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

// Tileable value noise on a period grid
export const valueNoise = (x: number, y: number, period: number, seed = 1) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smooth(x - xi);
  const yf = smooth(y - yi);
  const p = (n: number) => ((n % period) + period) % period;
  const a = hash2(p(xi), p(yi), seed);
  const b = hash2(p(xi + 1), p(yi), seed);
  const c = hash2(p(xi), p(yi + 1), seed);
  const d = hash2(p(xi + 1), p(yi + 1), seed);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
};

// Low-frequency fractal noise, 0..1, tileable when u,v in [0,1)
export const fbm = (u: number, v: number, baseCells = 4, octaves = 3, seed = 1) => {
  let amp = 0.5;
  let sum = 0;
  let norm = 0;
  let cells = baseCells;
  for (let o = 0; o < octaves; o++) {
    sum += amp * valueNoise(u * cells, v * cells, cells, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    cells *= 2;
  }
  return sum / norm;
};
