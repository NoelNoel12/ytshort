// Geometry cache. Smooth, bevelled primitives shared across the whole video.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const cache = new Map<string, THREE.BufferGeometry>();
const get = <T extends THREE.BufferGeometry>(key: string, make: () => T): T => {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const g = make();
  cache.set(key, g);
  return g;
};
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// Bevelled box (edges catch light)
export const rbox = (w: number, h: number, d: number, r = Math.min(w, h, d) * 0.12, seg = 2) =>
  get(`rbox:${r3(w)}:${r3(h)}:${r3(d)}:${r3(r)}:${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, Math.min(w, h, d) / 2 - 0.0005)));

export const box = (w: number, h: number, d: number) => get(`box:${r3(w)}:${r3(h)}:${r3(d)}`, () => new THREE.BoxGeometry(w, h, d));

export const cyl = (rt: number, rb: number, h: number, seg = 48, open = false) =>
  get(`cyl:${r3(rt)}:${r3(rb)}:${r3(h)}:${seg}:${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));

export const sphere = (r: number, ws = 32, hs = 24) => get(`sph:${r3(r)}:${ws}:${hs}`, () => new THREE.SphereGeometry(r, ws, hs));

export const hemi = (r: number, ws = 40, hs = 16) => get(`hemi:${r3(r)}:${ws}:${hs}`, () => new THREE.SphereGeometry(r, ws, hs, 0, Math.PI * 2, 0, Math.PI / 2));

export const capsule = (r: number, len: number, cap = 12, radial = 28) => get(`cap:${r3(r)}:${r3(len)}:${cap}:${radial}`, () => new THREE.CapsuleGeometry(r, len, cap, radial));

export const cone = (r: number, h: number, seg = 32) => get(`cone:${r3(r)}:${r3(h)}:${seg}`, () => new THREE.ConeGeometry(r, h, seg));

export const torus = (r: number, tube: number, rs = 16, ts = 48, arc = Math.PI * 2) => get(`tor:${r3(r)}:${r3(tube)}:${rs}:${ts}:${r3(arc)}`, () => new THREE.TorusGeometry(r, tube, rs, ts, arc));

export const plane = (w: number, h: number) => get(`plane:${r3(w)}:${r3(h)}`, () => new THREE.PlaneGeometry(w, h));

export const circle = (r: number, seg = 40) => get(`circle:${r3(r)}:${seg}`, () => new THREE.CircleGeometry(r, seg));

// Faceted rock (flat shading on purpose)
export const rock = (r: number, detail = 0) => get(`rock:${r3(r)}:${detail}`, () => new THREE.DodecahedronGeometry(r, detail));

export const lathe = (key: string, pts: [number, number][], seg = 56) =>
  get(`lathe:${key}`, () => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg));

export const extrude = (key: string, shape: () => THREE.Shape, depth: number, bevel = 0.02) =>
  get(`ext:${key}:${r3(depth)}:${r3(bevel)}`, () => {
    const g = new THREE.ExtrudeGeometry(shape(), { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 24 });
    g.center();
    return g;
  });

export const tube = (key: string, points: THREE.Vector3[], radius: number, tubular = 48, radial = 10) =>
  get(`tube:${key}`, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), tubular, radius, radial, false));

export const custom = <T extends THREE.BufferGeometry>(key: string, make: () => T) => get(`custom:${key}`, make);

// Box-mapped UVs in world units: texel density stays the same on every size of mesh.
export const worldUV = (base: THREE.BufferGeometry, key: string, su: number, sv: number = su) =>
  get(`wuv:${key}:${r3(su)}:${r3(sv)}`, () => {
    const g = base.clone();
    const p = g.attributes.position as THREE.BufferAttribute;
    const n = g.attributes.normal as THREE.BufferAttribute;
    const uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) {
      const ax = Math.abs(n.getX(i));
      const ay = Math.abs(n.getY(i));
      const az = Math.abs(n.getZ(i));
      let u: number;
      let v: number;
      if (ay >= ax && ay >= az) {
        u = p.getX(i);
        v = p.getZ(i);
      } else if (ax >= az) {
        u = p.getZ(i);
        v = p.getY(i);
      } else {
        u = p.getX(i);
        v = p.getY(i);
      }
      uv[i * 2] = u / su;
      uv[i * 2 + 1] = v / sv;
    }
    g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    return g;
  });

// Bevelled box with world-scaled UVs
export const rboxW = (w: number, h: number, d: number, r: number, su: number, sv: number = su) => worldUV(rbox(w, h, d, r), `rbox:${r3(w)}:${r3(h)}:${r3(d)}:${r3(r)}`, su, sv);
export const boxW = (w: number, h: number, d: number, su: number, sv: number = su) => worldUV(box(w, h, d), `box:${r3(w)}:${r3(h)}:${r3(d)}`, su, sv);
