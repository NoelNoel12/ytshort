// Static batching: merges every plain mesh under it into one mesh per (material, flags, spatial cell).
// Cuts draw calls from thousands to about a hundred, which is what software GL (SwiftShader) needs.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const CELL = 24; // metres; keeps frustum culling useful

type Bucket = { material: THREE.Material; cast: boolean; receive: boolean; order: number; geoms: THREE.BufferGeometry[] };

// Same attribute set for every piece so they can be merged
const normalise = (g: THREE.BufferGeometry): THREE.BufferGeometry => {
  let out = g.index ? g.toNonIndexed() : g.clone();
  for (const name of Object.keys(out.attributes)) if (!["position", "normal", "uv"].includes(name)) out.deleteAttribute(name);
  if (!out.attributes.normal) out.computeVertexNormals();
  if (!out.attributes.uv) out.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(out.attributes.position.count * 2), 2));
  out.clearGroups();
  out.morphAttributes = {};
  return out;
};

export const StaticBatch: React.FC<{ children: React.ReactNode; name?: string }> = ({ children, name = "batch" }) => {
  const src = useRef<THREE.Group>(null);
  const [merged, setMerged] = useState<THREE.Group | null>(null);
  const holder = useMemo(() => new THREE.Group(), []);
  // Hold the frame until the batch exists, so every captured frame uses the same geometry
  const [handle] = useState(() => delayRender(`StaticBatch ${name}`));
  useEffect(() => {
    if (merged) continueRender(handle);
  }, [merged, handle]);

  useLayoutEffect(() => {
    const root = src.current;
    if (!root || merged) return;
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
    const buckets = new Map<string, Bucket>();
    const keep: THREE.Object3D[] = [];
    const m = new THREE.Matrix4();
    const centre = new THREE.Vector3();
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      // Instanced meshes are already a single draw call each
      // Transparent overlays (AO strips, blob shadows, glass) keep their own draw order, so they stay separate
      if ((mesh as unknown as THREE.InstancedMesh).isInstancedMesh || Array.isArray(mesh.material) || !mesh.visible || (mesh.material as THREE.Material).transparent) {
        keep.push(mesh);
        return;
      }
      m.multiplyMatrices(inv, mesh.matrixWorld);
      const g = normalise(mesh.geometry).applyMatrix4(m);
      g.computeBoundingSphere();
      centre.copy(g.boundingSphere!.center);
      const cell = `${Math.floor(centre.x / CELL)}:${Math.floor(centre.z / CELL)}`;
      const mat = mesh.material as THREE.Material;
      const key = `${mat.uuid}|${mesh.castShadow ? 1 : 0}${mesh.receiveShadow ? 1 : 0}|${mesh.renderOrder}|${cell}`;
      let b = buckets.get(key);
      if (!b) {
        b = { material: mat, cast: mesh.castShadow, receive: mesh.receiveShadow, order: mesh.renderOrder, geoms: [] };
        buckets.set(key, b);
      }
      b.geoms.push(g);
    });
    const out = new THREE.Group();
    out.name = name;
    for (const b of buckets.values()) {
      const geo = mergeGeometries(b.geoms, false);
      b.geoms.forEach((g) => g.dispose());
      if (!geo) continue;
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, b.material);
      mesh.castShadow = b.cast;
      mesh.receiveShadow = b.receive;
      mesh.renderOrder = b.order;
      mesh.matrixAutoUpdate = false;
      out.add(mesh);
    }
    // Instanced meshes move to the merged group with their transforms baked relative to the root
    for (const k of keep) {
      const im = k as THREE.Mesh;
      const clone = im.clone();
      clone.matrixAutoUpdate = false;
      clone.matrix.multiplyMatrices(inv, im.matrixWorld);
      clone.matrixWorldNeedsUpdate = true;
      out.add(clone);
    }
    holder.add(out);
    // Hide the source right away so no frame ever draws both copies
    root.visible = false;
    setMerged(out);
    if (typeof window !== "undefined" && (window as unknown as { __batchStats?: boolean }).__batchStats !== false) {
      const tri = (g: THREE.BufferGeometry, n = 1) => ((g.index ? g.index.count : g.attributes.position.count) / 3) * n;
      const per = new Map<string, number>();
      out.children.forEach((c) => {
        const mm = c as THREE.Mesh;
        const n = (mm as unknown as THREE.InstancedMesh).isInstancedMesh ? (mm as unknown as THREE.InstancedMesh).count : 1;
        const k = (mm.material as THREE.Material).name || (mm.material as THREE.MeshStandardMaterial).color?.getHexString() || "?";
        per.set(k + ((mm as unknown as THREE.InstancedMesh).isInstancedMesh ? " (inst)" : ""), (per.get(k) ?? 0) + tri(mm.geometry, n));
      });
      const total = [...per.values()].reduce((a, b) => a + b, 0);
      const top = [...per.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}=${Math.round(v / 1000)}k`).join(" ");
      console.log(`StaticBatch ${name}: ${buckets.size} merged, ${keep.length} kept, ${Math.round(total / 1000)}k triangles. Top: ${top}`);
    }
  }, [merged, holder, name]);

  return (
    <>
      {!merged && <group ref={src}>{children}</group>}
      <primitive object={holder} />
    </>
  );
};
