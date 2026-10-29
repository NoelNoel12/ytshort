// Procedural textures. Built once per tab and cached: never recreated per frame.
// Only large, low-frequency features (no 1 to 2 px speckle) so mipmaps keep them stable.
import * as THREE from "three";
import { fbm, rng } from "./noise";

const cache = new Map<string, THREE.Texture>();

type Opts = { repeat?: [number, number]; srgb?: boolean; anisotropy?: number };

export const cachedTexture = (key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, opts: Opts = {}): THREE.CanvasTexture => {
  const hit = cache.get(key);
  if (hit) return hit as THREE.CanvasTexture;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (opts.repeat) tex.repeat.set(opts.repeat[0], opts.repeat[1]);
  tex.colorSpace = opts.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = opts.anisotropy ?? 8;
  tex.needsUpdate = true;
  cache.set(key, tex);
  return tex;
};

const hexToRgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

// Paint a tileable noise field at low resolution, then upscale smoothly
const noiseField = (ctx: CanvasRenderingContext2D, w: number, h: number, colorAt: (u: number, v: number) => [number, number, number], lowRes = 256) => {
  const c = document.createElement("canvas");
  c.width = lowRes;
  c.height = Math.round((lowRes * h) / w);
  const cx = c.getContext("2d")!;
  const img = cx.createImageData(c.width, c.height);
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      const [r, g, b] = colorAt(x / c.width, y / c.height);
      const i = (y * c.width + x) * 4;
      img.data[i] = r;
      img.data[i + 1] = g;
      img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  cx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // Draw with wrap padding so the upscale stays tileable
  ctx.drawImage(c, 0, 0, w, h);
};

export const grassTexture = () =>
  cachedTexture("grass", 1024, 1024, (ctx, w, h) => {
    const a = hexToRgb("#67B347");
    const b = hexToRgb("#93CF62");
    const d = hexToRgb("#4A8E36");
    noiseField(ctx, w, h, (u, v) => {
      const n = fbm(u, v, 3, 3, 11);
      const m = fbm(u, v, 6, 2, 29);
      let c = mix(a, b, Math.min(1, Math.max(0, (n - 0.35) * 2)));
      c = mix(c, d, Math.max(0, (0.45 - m) * 2.4));
      return c;
    });
  });

export const dirtTexture = () =>
  cachedTexture("dirt", 1024, 1024, (ctx, w, h) => {
    const a = hexToRgb("#B98A5E");
    const b = hexToRgb("#D0A779");
    const d = hexToRgb("#9A6E47");
    noiseField(ctx, w, h, (u, v) => {
      const n = fbm(u, v, 4, 3, 5);
      let c = mix(a, b, n);
      c = mix(c, d, Math.max(0, (0.4 - fbm(u, v, 8, 2, 7)) * 1.5));
      return c;
    });
  });

export const asphaltTexture = () =>
  cachedTexture("asphalt", 1024, 1024, (ctx, w, h) => {
    const a = hexToRgb("#474B55");
    const b = hexToRgb("#5A5E68");
    noiseField(ctx, w, h, (u, v) => mix(a, b, fbm(u, v, 3, 3, 3)));
    // Patch repairs, large and soft
    const r = rng("asphalt-patch");
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = `rgba(${r() < 0.5 ? "35,37,43" : "98,101,110"},0.35)`;
      const x = r() * w;
      const y = r() * h;
      ctx.beginPath();
      ctx.ellipse(x, y, 60 + r() * 90, 40 + r() * 60, r() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // A few wide cracks (6 to 9 px, survive mipmapping)
    ctx.strokeStyle = "rgba(25,26,30,0.55)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let k = 0; k < 3; k++) {
      ctx.lineWidth = 6 + r() * 3;
      let x = r() * w;
      let y = r() * h;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 6; s++) {
        x += (r() - 0.5) * 140;
        y += 30 + r() * 60;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });

export const woodTexture = (key = "wood", base = "#B07A4A", dark = "#8A5A33", planks = 4, vertical = true) =>
  cachedTexture(key, 1024, 1024, (ctx, w, h) => {
    const a = hexToRgb(base);
    const d = hexToRgb(dark);
    const l = mix(a, [255, 230, 190], 0.18);
    noiseField(
      ctx,
      w,
      h,
      (u, v) => {
        const along = vertical ? v : u;
        const across = vertical ? u : v;
        const grain = fbm(across * 6, along * 0.6, 4, 3, 41); // stretched grain
        const blot = fbm(u, v, 3, 2, 43);
        let c = mix(d, l, grain);
        c = mix(c, a, 0.5 + 0.3 * blot);
        return c;
      },
      512,
    );
    // Plank seams (8 px)
    ctx.fillStyle = "rgba(60,36,18,0.55)";
    for (let k = 0; k < planks; k++) {
      const p = (k / planks) * (vertical ? w : h);
      if (vertical) ctx.fillRect(p - 4, 0, 8, h);
      else ctx.fillRect(0, p - 4, w, 8);
    }
  });

export const plasterTexture = (key = "plaster", base = "#EFE3CC") =>
  cachedTexture(key, 1024, 1024, (ctx, w, h) => {
    const a = hexToRgb(base);
    const stain = mix(a, [140, 112, 84], 0.55);
    const light = mix(a, [255, 250, 240], 0.3);
    noiseField(ctx, w, h, (u, v) => {
      const n = fbm(u, v, 3, 3, 61);
      let c = mix(light, a, Math.min(1, n * 1.5));
      c = mix(c, stain, Math.max(0, n - 0.5) * 2.2);
      // Faint vertical weathering streaks
      const s2 = fbm(u * 6, v * 0.5, 4, 2, 63);
      c = mix(c, stain, Math.max(0, s2 - 0.6) * 0.9);
      return c;
    }, 384);
  });

export const concreteTexture = () =>
  cachedTexture("concrete", 1024, 1024, (ctx, w, h) => {
    const a = hexToRgb("#C9C3B8");
    const b = hexToRgb("#A9A398");
    noiseField(ctx, w, h, (u, v) => mix(a, b, Math.max(0, fbm(u, v, 4, 3, 71) - 0.35) * 1.5));
    // Slab joints
    ctx.fillStyle = "rgba(90,85,78,0.5)";
    ctx.fillRect(0, h / 2 - 4, w, 8);
    ctx.fillRect(w / 2 - 4, 0, 8, h);
  });

export const soilTexture = () =>
  cachedTexture("soil", 1024, 1024, (ctx, w, h) => {
    const a = hexToRgb("#8A5A3C");
    const b = hexToRgb("#A9744F");
    const d = hexToRgb("#6B4329");
    noiseField(ctx, w, h, (u, v) => {
      let c = mix(a, b, fbm(u, v, 4, 3, 81));
      c = mix(c, d, Math.max(0, (0.38 - fbm(u, v, 7, 2, 83)) * 2));
      return c;
    });
  });

export const fabricTexture = (key: string, base: string) =>
  cachedTexture(key, 512, 512, (ctx, w, h) => {
    const a = hexToRgb(base);
    const b = mix(a, [0, 0, 0], 0.12);
    noiseField(ctx, w, h, (u, v) => mix(a, b, fbm(u, v, 4, 2, 91)), 128);
  });

// Soft round contact shadow (alpha)
export const blobTexture = () =>
  cachedTexture(
    "blob",
    256,
    256,
    (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(0,0,0,0.55)");
      g.addColorStop(0.45, "rgba(0,0,0,0.32)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { srgb: false },
  );

// Vertical sky gradient for the dome
export const skyGradientTexture = (key: string, top: string, mid: string, bottom: string) =>
  cachedTexture(
    key,
    16,
    512,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, top);
      g.addColorStop(0.55, mid);
      g.addColorStop(1, bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { anisotropy: 1 },
  );

// ---------- height-field based maps (colour + normal), world-scaled via box-mapped UVs ----------

type HeightFn = (u: number, v: number) => number; // u,v in [0,1) tileable, returns 0..1

const normalFromHeight = (ctx: CanvasRenderingContext2D, w: number, h: number, height: HeightFn, strength: number) => {
  const H = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) H[y * w + x] = height(x / w, y / h);
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const l = H[y * w + ((x - 1 + w) % w)];
      const r = H[y * w + ((x + 1) % w)];
      const t = H[((y - 1 + h) % h) * w + x];
      const b = H[((y + 1) % h) * w + x];
      let nx = (l - r) * strength;
      let ny = (b - t) * strength;
      let nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;
      nz /= len;
      const i = (y * w + x) * 4;
      img.data[i] = (nx * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny * 0.5 + 0.5) * 255;
      img.data[i + 2] = (nz * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
};

const frac = (x: number) => x - Math.floor(x);
const cellHash = (a: number, b: number, s: number) => {
  let h = Math.imul(a, 73856093) ^ Math.imul(b, 19349663) ^ Math.imul(s, 83492791);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// Clay roof tiles: 4 across x 4 rows per texture. Texture world size: ROOF_TILE_WORLD
export const ROOF_TILE_WORLD: [number, number] = [1.7, 1.9];
const TILE_N = 4;
const roofHeight: HeightFn = (u, v) => {
  const across = 0.5 + 0.5 * Math.cos(2 * Math.PI * u * TILE_N);
  const along = frac(v * TILE_N); // 0 at row top, 1 at overlap lip
  const lip = along > 0.86 ? (1 - along) / 0.14 : along / 0.86;
  return 0.45 * across + 0.75 * Math.pow(lip, 0.8);
};
export const roofTileMaps = (key: string, base: string) => {
  const color = cachedTexture(`roofC:${key}`, 1024, 1024, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const a = hexToRgb(base);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const v = y / h;
        const cx = Math.floor(u * TILE_N);
        const cy = Math.floor(v * TILE_N);
        const tone = 0.86 + 0.24 * cellHash(cx, cy, 7) + 0.1 * (fbm(u, v, 3, 2, 5) - 0.5);
        const along = frac(v * TILE_N);
        const across = 0.5 + 0.5 * Math.cos(2 * Math.PI * u * TILE_N);
        // Shadowed valleys and the dark gap under each lip
        const occl = (0.84 + 0.16 * across) * (along > 0.86 ? 0.72 + 0.16 * Math.cos(((along - 0.86) / 0.14) * Math.PI) : 0.88 + 0.12 * (along / 0.86));
        const i = (y * w + x) * 4;
        img.data[i] = Math.min(255, a[0] * tone * occl);
        img.data[i + 1] = Math.min(255, a[1] * tone * occl);
        img.data[i + 2] = Math.min(255, a[2] * tone * occl);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  const normal = cachedTexture("roofN", 1024, 1024, (ctx, w, h) => normalFromHeight(ctx, w, h, roofHeight, 6), { srgb: false });
  return { color, normal };
};

// Running-bond bricks: texture world size BRICK_WORLD
export const BRICK_WORLD: [number, number] = [1.8, 1.8];
const BR = { rows: 8, cols: 3, mortar: 0.1 };
const brickCell = (u: number, v: number) => {
  const row = Math.floor(v * BR.rows);
  const off = row % 2 ? 0.5 : 0;
  const col = Math.floor(u * BR.cols + off);
  const fu = frac(u * BR.cols + off);
  const fv = frac(v * BR.rows);
  const m = BR.mortar;
  const edge = Math.min(fu / (m * 0.5), (1 - fu) / (m * 0.5), fv / m, (1 - fv) / m);
  return { row, col, edge };
};
export const brickMaps = (key: string, base = "#B4543A") => {
  const color = cachedTexture(`brickC:${key}`, 1024, 1024, (ctx, w, h) => {
    const img = ctx.createImageData(w, h);
    const a = hexToRgb(base);
    const mortar = hexToRgb("#B99A84");
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w;
        const v = y / h;
        const { row, col, edge } = brickCell(u, v);
        const tone = 0.8 + 0.35 * cellHash(col, row, 3) + 0.12 * (fbm(u, v, 4, 2, 9) - 0.5);
        const c: [number, number, number] = edge < 1 ? mortar : [a[0] * tone, a[1] * tone, a[2] * tone];
        const i = (y * w + x) * 4;
        img.data[i] = Math.min(255, c[0]);
        img.data[i + 1] = Math.min(255, c[1]);
        img.data[i + 2] = Math.min(255, c[2]);
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
  const normal = cachedTexture(
    "brickN",
    1024,
    1024,
    (ctx, w, h) =>
      normalFromHeight(
        ctx,
        w,
        h,
        (u, v) => {
          const { edge } = brickCell(u, v);
          return Math.min(1, edge) * 0.8 + 0.2 * fbm(u, v, 8, 1, 4);
        },
        3.5,
      ),
    { srgb: false },
  );
  return { color, normal };
};

// Ambient occlusion skirt: dark at the inner rectangle edge, fading outwards (alpha)
export const aoSkirtTexture = () =>
  cachedTexture(
    "aoSkirt",
    512,
    512,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      const inner = 0.3; // inner rectangle half-size in uv (0..0.5)
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const dx = Math.max(0, Math.abs(x / w - 0.5) - inner);
          const dy = Math.max(0, Math.abs(y / h - 0.5) - inner);
          const d = Math.hypot(dx, dy) / (0.5 - inner);
          const inside = Math.abs(x / w - 0.5) < inner && Math.abs(y / h - 0.5) < inner;
          const a = inside ? 0.6 : Math.max(0, 1 - d) ** 2 * 0.6;
          const i = (y * w + x) * 4;
          img.data[i] = 0;
          img.data[i + 1] = 0;
          img.data[i + 2] = 0;
          img.data[i + 3] = a * 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    { srgb: false, anisotropy: 4 },
  );

// Vertical AO gradient for wall bases (alpha, dark at the bottom)
export const aoWallTexture = () =>
  cachedTexture(
    "aoWall",
    8,
    256,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, "rgba(0,0,0,0.55)");
      g.addColorStop(0.35, "rgba(0,0,0,0.18)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { srgb: false, anisotropy: 1 },
  );
