import React, { useMemo } from "react";
import * as THREE from "three";
import { M, paint } from "./materials";
import { box, boxW, rbox, rock } from "./geom";
import { rng } from "./noise";

export const ROAD = { halfWidth: 3.6, length: 260, walk: 2.0 };

// Raise every parallel layer by a real offset (anti z-fighting)
const Y = { ground: 0, road: 0.06, mark: 0.125, walk: 0.16 };

export const Ground: React.FC = () => {
  const dashes = useMemo(() => {
    const out: number[] = [];
    for (let x = -ROAD.length / 2 + 2; x < ROAD.length / 2; x += 5) out.push(x);
    return out;
  }, []);
  const dashMesh = useMemo(() => {
    // Dashes are real slabs, 0.22 wide, so they never fall under 2 px at normal distances
    const im = new THREE.InstancedMesh(rbox(2.4, 0.03, 0.22, 0.012, 2), paint("#F4F1E8", 0.6), dashes.length);
    const m4 = new THREE.Matrix4();
    dashes.forEach((x, k) => {
      m4.makeTranslation(x, Y.mark, 0);
      im.setMatrixAt(k, m4);
    });
    im.instanceMatrix.needsUpdate = true;
    im.receiveShadow = true;
    return im;
  }, [dashes]);

  return (
    <group>
      {/* Grass base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, Y.ground, 0]} receiveShadow material={M.grass()}>
        <planeGeometry args={[520, 520]} />
      </mesh>
      {/* Main road with thickness */}
      <mesh position={[0, Y.road - 0.05, 0]} receiveShadow material={M.asphaltW()} geometry={boxW(ROAD.length, 0.1, ROAD.halfWidth * 2, 7)} />
      {/* Edge lines */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, Y.mark, s * (ROAD.halfWidth - 0.3)]} receiveShadow geometry={box(ROAD.length, 0.03, 0.18)} material={paint("#ECE7DA", 0.6)} />
      ))}
      <primitive object={dashMesh} />
      {/* Sidewalks with curbs */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[0, Y.walk / 2, s * (ROAD.halfWidth + ROAD.walk / 2)]} receiveShadow castShadow geometry={boxW(ROAD.length, Y.walk, ROAD.walk, 2)} material={M.concrete()} />
          <mesh position={[0, Y.walk / 2 + 0.01, s * (ROAD.halfWidth + 0.09)]} receiveShadow geometry={rbox(ROAD.length, Y.walk + 0.02, 0.2, 0.04, 2)} material={M.curb()} />
        </group>
      ))}
    </group>
  );
};

// Dirt path / yard patch
export const DirtPatch: React.FC<{ position: [number, number, number]; size: [number, number]; rotation?: number }> = ({ position, size, rotation = 0 }) => (
  <mesh position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, rotation]} receiveShadow material={M.dirt()}>
    <planeGeometry args={size} />
  </mesh>
);

// Instanced grass tufts: three bent blades per tuft, real geometry (no noisy texture)
export const GrassTufts: React.FC<{ area: [number, number, number, number]; count: number; seed: string; avoid?: (x: number, z: number) => boolean }> = ({ area, count, seed, avoid }) => {
  const mesh = useMemo(() => {
    const blade = new THREE.ConeGeometry(0.035, 0.24, 5, 1);
    blade.translate(0, 0.12, 0);
    const parts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 3; k++) {
      const g = blade.clone();
      g.rotateZ((k - 1) * 0.35);
      g.rotateY(k * 2.1);
      parts.push(g);
    }
    const merged = mergeGeoms(parts);
    const im = new THREE.InstancedMesh(merged, M.leafLight(), count);
    const r = rng(seed);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    let k = 0;
    let guard = 0;
    while (k < count && guard++ < count * 10) {
      const x = area[0] + r() * (area[2] - area[0]);
      const z = area[1] + r() * (area[3] - area[1]);
      if (avoid && avoid(x, z)) continue;
      const s = 0.6 + r() * 0.7;
      q.setFromEuler(new THREE.Euler(0, r() * Math.PI * 2, 0));
      m4.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(s, s * (0.8 + r() * 0.6), s));
      im.setMatrixAt(k, m4);
      im.setColorAt(k, c.set(r() > 0.5 ? "#5FA845" : "#78BE55"));
      k++;
    }
    im.count = k;
    im.instanceMatrix.needsUpdate = true;
    im.castShadow = false;
    im.receiveShadow = true;
    return im;
  }, [area[0], area[1], area[2], area[3], count, seed, avoid]);
  return <primitive object={mesh} />;
};

// Instanced pebbles (faceted on purpose)
export const Pebbles: React.FC<{ area: [number, number, number, number]; count: number; seed: string }> = ({ area, count, seed }) => {
  const mesh = useMemo(() => {
    const im = new THREE.InstancedMesh(rock(0.12), paint("#A59C90", 0.9), count);
    const r = rng(seed);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const c = new THREE.Color();
    for (let k = 0; k < count; k++) {
      const x = area[0] + r() * (area[2] - area[0]);
      const z = area[1] + r() * (area[3] - area[1]);
      const s = 0.4 + r() * 1.1;
      q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
      m4.compose(new THREE.Vector3(x, 0.03, z), q, new THREE.Vector3(s, s * 0.6, s));
      im.setMatrixAt(k, m4);
      im.setColorAt(k, c.set(r() > 0.5 ? "#B3AA9C" : "#8F877C"));
    }
    im.instanceMatrix.needsUpdate = true;
    im.receiveShadow = true;
    im.castShadow = true;
    return im;
  }, [area[0], area[1], area[2], area[3], count, seed]);
  return <primitive object={mesh} />;
};

// Minimal geometry merge (positions, normals, uvs) to avoid an extra dependency
export const mergeGeoms = (geoms: THREE.BufferGeometry[]): THREE.BufferGeometry => {
  const ng = geoms.map((g) => (g.index ? g.toNonIndexed() : g));
  const total = ng.reduce((a, g) => a + g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3);
  const nor = new Float32Array(total * 3);
  const uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of ng) {
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array as Float32Array, o * 3);
    nor.set(g.attributes.normal.array as Float32Array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array as Float32Array, o * 2);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  out.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return out;
};
