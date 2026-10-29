import React, { useMemo } from "react";
import * as THREE from "three";
import { M, std } from "./materials";
import { custom, cyl, sphere, torus } from "./geom";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng } from "./noise";

type V3 = [number, number, number];

// Curved leaf ribbon: outward along +z, drooping. width(t) gives the outline.
const leafGeometry = (key: string, len: number, width: number, a0: number, bend: number, fold: number, outline: "frond" | "paddle") =>
  custom(`leaf:${key}`, () => {
    const segL = 16;
    const segW = outline === "frond" ? 6 : 4;
    const g = new THREE.PlaneGeometry(1, 1, segW, segL);
    const pos = g.attributes.position as THREE.BufferAttribute;
    // Centreline
    const pts: { y: number; z: number; a: number }[] = [];
    let y = 0;
    let z = 0;
    for (let i = 0; i <= segL; i++) {
      const t = i / segL;
      const a = a0 - bend * t * t;
      pts.push({ y, z, a });
      const ds = len / segL;
      z += Math.cos(a) * ds;
      y += Math.sin(a) * ds;
    }
    for (let v = 0; v < pos.count; v++) {
      const u = pos.getX(v); // -0.5..0.5 across
      const t = pos.getY(v) + 0.5; // 0..1 along
      const i = Math.round(t * segL);
      const p = pts[i];
      const w = outline === "frond" ? width * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.05)), 0.7) * (1 - 0.35 * t) : width * Math.pow(Math.sin(Math.PI * t), 0.55);
      const x = u * w;
      // Fold the leaf into a shallow V for depth; normal of the centreline
      const ny = Math.cos(p.a);
      const nz = -Math.sin(p.a);
      const f = -Math.abs(u) * fold * w;
      pos.setXYZ(v, x, p.y + ny * f, p.z + nz * f);
    }
    g.computeVertexNormals();
    return g;
  });

// Lumpy foliage blob: icosphere displaced by a few low-frequency waves, smooth normals
export const foliageGeometry = (variant: number, detail = 3) =>
  custom(`foliage:${variant}:${detail}`, () => {
    let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(1, detail);
    g.deleteAttribute("normal");
    g.deleteAttribute("uv");
    g = mergeVertices(g);
    const r = rng(`foliage-${variant}`);
    const waves = Array.from({ length: 7 }, () => {
      const d = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      return { d, k: 2.5 + r() * 3.5, a: 0.05 + r() * 0.06, p: r() * 6.28 };
    });
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      let disp = 0;
      for (const w of waves) disp += w.a * Math.sin(v.dot(w.d) * w.k + w.p);
      // Flatter underside like a real canopy
      const sq = v.y < 0 ? 0.75 : 1;
      v.multiplyScalar(1 + disp);
      v.y *= sq;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });

export const CoconutTree: React.FC<{ position: V3; height?: number; lean?: number; rotY?: number; seed?: string }> = ({ position, height = 7, lean = 0.25, rotY = 0, seed = "palm" }) => {
  const { trunkGeo, rings, top } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(Math.sin(t * 1.2) * lean * height * 0.35, t * height, 0));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = custom(`palmtrunk:${height}:${lean}`, () => {
      const tg = new THREE.TubeGeometry(curve, 40, 0.2, 14, false);
      // Taper toward the top
      const p = tg.attributes.position as THREE.BufferAttribute;
      for (let v = 0; v < p.count; v++) {
        const yy = p.getY(v) / height;
        const c = curve.getPointAt(Math.min(1, Math.max(0, yy)));
        const k = 1.25 - 0.45 * yy;
        p.setX(v, c.x + (p.getX(v) - c.x) * k);
        p.setZ(v, c.z + (p.getZ(v) - c.z) * k);
      }
      tg.computeVertexNormals();
      return tg;
    });
    const r: V3[] = [];
    for (let i = 1; i < 14; i++) {
      const c = curve.getPointAt(i / 14);
      r.push([c.x, c.y, c.z]);
    }
    const t = curve.getPointAt(1);
    return { trunkGeo: g, rings: r, top: [t.x, t.y, t.z] as V3 };
  }, [height, lean]);
  const r = rng(seed);
  const fronds = Array.from({ length: 10 }, (_, k) => ({ yaw: (k / 10) * Math.PI * 2 + r() * 0.3, pitch: r() * 0.2, len: 2.6 + r() * 0.8, v: k % 3 }));
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh geometry={trunkGeo} material={M.palmTrunk()} castShadow receiveShadow />
      {rings.map((p, k) => (
        <mesh key={k} position={p} rotation={[Math.PI / 2, 0, 0]} geometry={torus(0.2 * (1.22 - 0.4 * (p[1] / height)), 0.035, 8, 24)} material={M.bark()} />
      ))}
      <group position={top}>
        {fronds.map((f, k) => (
          <mesh key={k} rotation={[f.pitch, f.yaw, 0]} geometry={leafGeometry(`frond:${f.v}`, f.len, 0.95, 0.55, 1.9, 0.35, "frond")} material={k % 2 ? M.palmLeaf() : M.leaf()} castShadow />
        ))}
        {[0, 2.1, 4.2].map((a, k) => (
          <mesh key={k} position={[Math.cos(a) * 0.25, -0.25, Math.sin(a) * 0.25]} geometry={sphere(0.2, 20, 14)} material={std("coconut", { color: "#7C8F3A", roughness: 0.6 })} castShadow />
        ))}
      </group>
    </group>
  );
};

export const BananaTree: React.FC<{ position: V3; height?: number; rotY?: number; seed?: string }> = ({ position, height = 2.6, rotY = 0, seed = "banana" }) => {
  const r = rng(seed);
  const leaves = Array.from({ length: 7 }, (_, k) => ({ yaw: (k / 7) * Math.PI * 2 + r() * 0.4, len: 1.8 + r() * 0.6, v: k % 2, y: height - 0.1 - r() * 0.4 }));
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <mesh position={[0, height / 2, 0]} geometry={cyl(0.13, 0.19, height, 24)} material={std("bananaStem", { color: "#8DAA4F", roughness: 0.7 })} castShadow receiveShadow />
      {leaves.map((l, k) => (
        <mesh key={k} position={[0, l.y, 0]} rotation={[0, l.yaw, 0]} geometry={leafGeometry(`banana:${l.v}`, l.len, 0.75, 0.9, 2.2, 0.12, "paddle")} material={M.bananaLeaf()} castShadow />
      ))}
    </group>
  );
};

export const RoundTree: React.FC<{ position: V3; scale?: number; seed?: string; tone?: 0 | 1 }> = ({ position, scale = 1, seed = "tree", tone = 0 }) => {
  const r = rng(seed);
  const blobs = Array.from({ length: 6 }, (_, k) => {
    const a = (k / 6) * Math.PI * 2 + r();
    const rad = k === 0 ? 0 : 0.9 + r() * 0.5;
    return { p: [Math.cos(a) * rad, 3.3 + r() * 1.1 + (k === 0 ? 0.6 : 0), Math.sin(a) * rad] as V3, s: k === 0 ? 1.6 : 1.0 + r() * 0.5, light: r() > 0.5 };
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.4, 0]} geometry={cyl(0.16, 0.26, 2.8, 20)} material={M.bark()} castShadow receiveShadow />
      <mesh position={[0.35, 2.5, 0]} rotation={[0, 0, -0.6]} geometry={cyl(0.07, 0.11, 1.2, 12)} material={M.bark()} castShadow />
      {blobs.map((b, k) => (
        <mesh key={k} position={b.p} scale={[b.s, b.s * 0.85, b.s]} rotation={[0, k * 1.3, 0]} geometry={foliageGeometry(k % 4)} material={(b.light ? tone === 0 : tone === 1) ? M.leafLight() : M.leaf()} castShadow receiveShadow />
      ))}
    </group>
  );
};

export const Bush: React.FC<{ position: V3; scale?: number; seed?: string }> = ({ position, scale = 1, seed = "bush" }) => {
  const r = rng(seed);
  return (
    <group position={position} scale={scale}>
      {Array.from({ length: 4 }, (_, k) => {
        const a = (k / 4) * Math.PI * 2 + r();
        const s = 0.45 + r() * 0.25;
        return <mesh key={k} position={[Math.cos(a) * 0.4, s * 0.7, Math.sin(a) * 0.4]} scale={[s, s * 0.85, s]} rotation={[0, k, 0]} geometry={foliageGeometry((k + 2) % 4)} material={k % 2 ? M.leaf() : M.leafLight()} castShadow receiveShadow />;
      })}
    </group>
  );
};

// Terracotta pot with a leafy plant (porch decoration)
export const PottedPlant: React.FC<{ position: V3; scale?: number; seed?: string }> = ({ position, scale = 1, seed = "pot" }) => {
  const r = rng(seed);
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} geometry={cyl(0.26, 0.19, 0.44, 32)} material={std("pot", { color: "#B5643E", roughness: 0.8 })} castShadow receiveShadow />
      <mesh position={[0, 0.45, 0]} geometry={torus(0.26, 0.035, 8, 32)} rotation={[Math.PI / 2, 0, 0]} material={std("pot", { color: "#B5643E", roughness: 0.8 })} />
      {Array.from({ length: 6 }, (_, k) => (
        <mesh key={k} position={[0, 0.44, 0]} rotation={[0, (k / 6) * Math.PI * 2 + r(), 0]} geometry={leafGeometry(`pot:${k % 2}`, 0.7, 0.32, 1.1, 2.4, 0.15, "paddle")} material={k % 2 ? M.leaf() : M.leafLight()} castShadow />
      ))}
    </group>
  );
};
