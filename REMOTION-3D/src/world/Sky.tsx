import React, { useMemo } from "react";
import * as THREE from "three";
import { MOODS, type MoodName } from "./Lighting";
import { cachedTexture } from "./textures";
import { rng } from "./noise";
import { custom, sphere } from "./geom";
import { fbm } from "./noise";
import { foliageGeometry } from "./nature";
import { M, std } from "./materials";

const skyDomeTexture = (name: MoodName) => {
  const m = MOODS[name];
  return cachedTexture(
    `skydome:${name}`,
    16,
    1024,
    (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, m.skyTop);
      g.addColorStop(0.3, m.skyTop);
      g.addColorStop(0.43, m.skyMid);
      g.addColorStop(0.5, m.skyBottom);
      g.addColorStop(0.52, m.fog);
      g.addColorStop(1, m.fog);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { anisotropy: 1 },
  );
};

// Soft painted cumulus with shaded underside
const cloudTexture = (variant: number) =>
  cachedTexture(
    `cloud:${variant}`,
    1024,
    512,
    (ctx, w, h) => {
      const r = rng(`cloud-${variant}`);
      const puffs: [number, number, number][] = [];
      const n = 9 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) {
        const t = k / (n - 1);
        const x = w * (0.14 + 0.72 * t + (r() - 0.5) * 0.05);
        const bulge = Math.sin(t * Math.PI);
        const rad = h * (0.13 + 0.2 * bulge * (0.7 + 0.5 * r()));
        const y = h * 0.68 - rad * (0.45 + 0.35 * r());
        puffs.push([x, y, rad]);
      }
      for (let k = 0; k < 5; k++) puffs.push([w * (0.3 + r() * 0.4), h * (0.62 + r() * 0.05), h * (0.12 + r() * 0.06)]);
      for (const [x, y, rad] of puffs) {
        const g = ctx.createRadialGradient(x, y, rad * 0.2, x, y, rad);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.72, "rgba(255,255,255,0.96)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // Flat-ish base: fade the very bottom
      ctx.globalCompositeOperation = "destination-out";
      const fb = ctx.createLinearGradient(0, h * 0.66, 0, h * 0.8);
      fb.addColorStop(0, "rgba(0,0,0,0)");
      fb.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = fb;
      ctx.fillRect(0, h * 0.66, w, h * 0.34);
      // Shade the underside
      ctx.globalCompositeOperation = "source-atop";
      const sh = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.75);
      sh.addColorStop(0, "rgba(255,255,255,0)");
      sh.addColorStop(0.55, "rgba(205,218,232,0.35)");
      sh.addColorStop(1, "rgba(170,188,210,0.75)");
      ctx.fillStyle = sh;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    },
    {},
  );

type CloudSpec = { pos: [number, number, number]; scale: number; variant: number; speed: number };

const CLOUDS: CloudSpec[] = (() => {
  const r = rng("clouds");
  const out: CloudSpec[] = [];
  for (let k = 0; k < 16; k++) {
    const ang = (k / 16) * Math.PI * 2 + r() * 0.3;
    const rad = 170 + r() * 90;
    out.push({ pos: [Math.cos(ang) * rad, 38 + r() * 55, Math.sin(ang) * rad], scale: 55 + r() * 45, variant: k % 4, speed: 0.6 + r() * 0.8 });
  }
  return out;
})();

// Mountain ridge ring: smooth slopes, peaks from low-frequency noise.
// Vertex colours fade the foot into the haze (aerial perspective).
const ridgeGeometry = (key: string, radius: number, base: number, amp: number, seed: number, foot: THREE.Color, peak: THREE.Color) => {
  const N = 240;
  const ROWS = 8;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const ang = t * Math.PI * 2;
    const n = fbm(t, 0.37 * seed, 6, 3, seed);
    const hgt = base + amp * Math.pow(Math.max(0, n - 0.25) / 0.75, 1.5) * 1.6;
    for (let j = 0; j <= ROWS; j++) {
      const f = j / ROWS; // 0 foot, 1 ridge
      const rr = radius + (1 - f) * hgt * 2.2;
      const y = hgt * Math.pow(f, 0.8) - 3;
      pos.push(Math.cos(ang) * rr, y, Math.sin(ang) * rr);
      c.copy(foot).lerp(peak, Math.pow(f, 0.6));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < ROWS; j++) {
      const a0 = i * (ROWS + 1) + j;
      const b0 = (i + 1) * (ROWS + 1) + j;
      idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
    }
  }
  return custom(`ridge:${key}`, () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  });
};

export const Sky: React.FC<{ mood: MoodName; frame: number }> = ({ mood, frame }) => {
  const dome = skyDomeTexture(mood);
  const m = MOODS[mood];
  const cloudTint = mood === "golden" ? "#FFE4C6" : mood === "dim" ? "#D8DEE4" : "#FFFFFF";
  // Hazy ridges: unlit vertex colours pre-mixed with the horizon, scene fog off so they never vanish
  const ridgeMat = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide, toneMapped: true }), []);
  const haze = new THREE.Color(m.fog);
  const farPeak = new THREE.Color(m.skyBottom).lerp(new THREE.Color("#6E8DAE"), 0.42);
  const nearPeak = new THREE.Color(m.skyBottom).lerp(new THREE.Color("#5A8270"), 0.5);
  return (
    <group>
      <mesh geometry={sphere(480, 32, 32)} renderOrder={-10}>
        <meshBasicMaterial map={dome} side={THREE.BackSide} fog={false} depthWrite={false} toneMapped={false} />
      </mesh>
      {CLOUDS.map((c, k) => (
        <sprite key={k} position={[c.pos[0] + frame * c.speed * 0.02 - 30, c.pos[1], c.pos[2]]} scale={[c.scale, c.scale * 0.5, 1]} renderOrder={-9}>
          <spriteMaterial map={cloudTexture(c.variant)} color={cloudTint} transparent depthWrite={false} fog={false} toneMapped={false} />
        </sprite>
      ))}
      <mesh geometry={ridgeGeometry(`far:${mood}`, 320, 6, 44, 3, haze, farPeak)} material={ridgeMat} renderOrder={-8} />
      <mesh geometry={ridgeGeometry(`near:${mood}`, 245, 2, 22, 7, haze, nearPeak)} material={ridgeMat} renderOrder={-7} />
    </group>
  );
};

// Ring of far tree canopies for depth (instanced)
export const TreeLine: React.FC<{ radius?: number; count?: number }> = ({ radius = 120, count = 140 }) => {
  const mesh = useMemo(() => {
    const geo = foliageGeometry(1, 1);
    const im = new THREE.InstancedMesh(geo, std("treeline", { color: "#ffffff", roughness: 0.9 }), count);
    const r = rng("treeline");
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    for (let k = 0; k < count; k++) {
      const ang = (k / count) * Math.PI * 2 + r() * 0.05;
      const rad = radius + r() * 25;
      const s = 2.6 + r() * 3.2;
      m4.compose(new THREE.Vector3(Math.cos(ang) * rad, s * 0.6, Math.sin(ang) * rad), q, new THREE.Vector3(s * 1.2, s, s * 1.2));
      im.setMatrixAt(k, m4);
      im.setColorAt(k, c.set(r() > 0.5 ? "#5C9A48" : "#4C873E"));
    }
    im.instanceMatrix.needsUpdate = true;
    return im;
  }, [count, radius]);
  return <primitive object={mesh} />;
};
