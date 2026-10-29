import React, { useMemo } from "react";
import * as THREE from "three";
import { M, paint, std } from "./materials";
import { box, cyl, plane, rbox, rboxW, torus, worldUV } from "./geom";
import { BRICK_WORLD, ROOF_TILE_WORLD, cachedTexture } from "./textures";

type V3 = [number, number, number];

const PLINTH = 0.5;
const PLASTER_WORLD = 3.2;

// Roof slope: one bevelled slab with tile colour and normal maps in world units
const RoofSlope: React.FC<{ width: number; run: number; rise: number; side: 1 | -1; color: string; ridgeY: number }> = ({ width, run, rise, side, color, ridgeY }) => {
  const len = Math.hypot(run, rise);
  const ang = Math.atan2(rise, run);
  return (
    <group position={[0, ridgeY - rise / 2, (side * run) / 2]} rotation={[side * ang, 0, 0]}>
      <mesh position={[0, 0.06, 0]} geometry={rboxW(width, 0.12, len, 0.03, ROOF_TILE_WORLD[0], ROOF_TILE_WORLD[1])} material={M.roofTiles(color)} castShadow receiveShadow />
      {/* Rafter ends under the eave */}
      <mesh position={[0, -0.04, 0]} geometry={box(width - 0.1, 0.08, len - 0.1)} material={M.woodDark()} />
    </group>
  );
};

const Gable: React.FC<{ depth: number; rise: number; x: number; y: number; mat: THREE.Material }> = ({ depth, rise, x, y, mat }) => {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-depth / 2, 0);
    s.lineTo(depth / 2, 0);
    s.lineTo(0, rise);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: false });
    g.translate(0, 0, -0.08);
    return worldUV(g, `gable:${depth}:${rise}`, PLASTER_WORLD);
  }, [depth, rise]);
  return <mesh geometry={geo} position={[x, y, 0]} rotation={[0, Math.PI / 2, 0]} material={mat} castShadow receiveShadow />;
};

const Window: React.FC<{ position: V3; w?: number; h?: number; rotY?: number; shutters?: boolean }> = ({ position, w = 1.0, h = 1.15, rotY = 0, shutters = true }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh geometry={rbox(w + 0.16, h + 0.16, 0.1, 0.03)} material={M.woodDark()} castShadow />
    <mesh position={[0, 0, 0.052]} geometry={box(w - 0.04, h - 0.04, 0.01)} material={M.windowGlass()} />
    <mesh position={[0, 0, 0.065]} geometry={box(0.07, h, 0.03)} material={M.woodDark()} />
    <mesh position={[0, h * 0.12, 0.065]} geometry={box(w, 0.07, 0.03)} material={M.woodDark()} />
    <mesh position={[0, -h / 2 - 0.12, 0.1]} geometry={rbox(w + 0.3, 0.08, 0.22, 0.02)} material={M.curb()} castShadow />
    {shutters &&
      [-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 + 0.3), 0, 0.03]} geometry={rbox(0.44, h + 0.05, 0.06, 0.02)} material={M.wood()} castShadow />
      ))}
  </group>
);

const Door: React.FC<{ position: V3; color?: string }> = ({ position, color }) => (
  <group position={position}>
    <mesh geometry={rbox(1.15, 2.2, 0.1, 0.03)} material={M.woodDark()} castShadow />
    <mesh position={[0, -0.05, 0.05]} geometry={rbox(0.92, 2.0, 0.06, 0.02)} material={color ? paint(color, 0.6) : M.wood()} />
    <mesh position={[0.32, -0.05, 0.1]} geometry={cyl(0.04, 0.04, 0.05, 16)} rotation={[Math.PI / 2, 0, 0]} material={M.steel()} />
  </group>
);

// Fake AO: ground skirt plus dark gradient at the wall bases
export const AOFootprint: React.FC<{ w: number; d: number; spread?: number; walls?: number; y?: number }> = ({ w, d, spread = 1.2, walls = 0.7, y = 0 }) => (
  <group>
    {spread > 0 && <mesh position={[0, y + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={plane(w + 2 * spread, d + 2 * spread)} material={M.aoSkirt()} renderOrder={1} />}
    {walls > 0 &&
      [
        [0, d / 2 + 0.006, 0, w],
        [0, -d / 2 - 0.006, Math.PI, w],
        [w / 2 + 0.006, 0, Math.PI / 2, d],
        [-w / 2 - 0.006, 0, -Math.PI / 2, d],
      ].map(([x, z, r, len], k) => (
        <mesh key={k} position={[x, y + walls / 2, z]} rotation={[0, r, 0]} geometry={plane(len, walls)} material={M.aoWall()} renderOrder={1} />
      ))}
  </group>
);

export type HouseProps = {
  position: V3;
  rotY?: number;
  w?: number;
  d?: number;
  h?: number;
  rise?: number;
  wall?: string;
  roof?: string;
  door?: string;
  detail?: 0 | 1 | 2;
  porch?: boolean;
  windows?: number;
  brick?: boolean; // exposed brick walls instead of plaster
};

export const House: React.FC<HouseProps> = ({ position, rotY = 0, w = 6.4, d = 5.2, h = 2.8, rise = 1.7, wall = "#EFE3CC", roof = "#B9623F", door, detail = 2, porch = false, windows = 2, brick = false }) => {
  const top = PLINTH + h;
  const ov = 0.55;
  const run = d / 2 + ov;
  const drop = (ov / (d / 2)) * rise;
  const ridgeY = top + rise;
  const wallMat = brick ? M.brick() : M.plaster(wall);
  const wallGeo = brick ? rboxW(w, h, d, 0.05, BRICK_WORLD[0], BRICK_WORLD[1]) : rboxW(w, h, d, 0.05, PLASTER_WORLD);
  const winX = windows === 1 ? [w * 0.27] : [-w * 0.3, w * 0.3];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <AOFootprint w={w + 0.16} d={d + 0.16} walls={0} />
      <mesh position={[0, PLINTH / 2, 0]} geometry={rboxW(w + 0.16, PLINTH, d + 0.16, 0.04, BRICK_WORLD[0], BRICK_WORLD[1])} material={M.brick("#9C4A34")} castShadow receiveShadow />
      <mesh position={[0, PLINTH + h / 2, 0]} geometry={wallGeo} material={wallMat} castShadow receiveShadow />
      <group position={[0, PLINTH, 0]}>
        <AOFootprint w={w} d={d} spread={0} walls={0.8} />
      </group>
      {[-1, 1].map((s) => (
        <Gable key={s} depth={d} rise={rise} x={(s * w) / 2} y={top} mat={brick ? M.plaster(wall) : wallMat} />
      ))}
      <RoofSlope width={w + 2 * ov} run={run} rise={rise + drop} side={1} color={roof} ridgeY={ridgeY} />
      <RoofSlope width={w + 2 * ov} run={run} rise={rise + drop} side={-1} color={roof} ridgeY={ridgeY} />
      <mesh position={[0, ridgeY + 0.12, 0]} rotation={[0, 0, Math.PI / 2]} geometry={cyl(0.16, 0.16, w + 2 * ov + 0.05, 24)} material={M.clayRoofDark()} castShadow />
      {/* Fascia boards */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, top - drop + 0.0, s * (run + 0.02)]} geometry={rbox(w + 2 * ov, 0.18, 0.07, 0.02)} material={M.woodDark()} castShadow />
      ))}
      {detail >= 1 && (
        <>
          <Door position={[windows === 1 ? -w * 0.18 : 0, PLINTH + 1.1, d / 2 + 0.04]} color={door} />
          {winX.map((x, k) => (
            <Window key={k} position={[x, PLINTH + 1.55, d / 2 + 0.03]} shutters={detail >= 2} />
          ))}
          {detail >= 2 && <Window position={[w / 2 + 0.03, PLINTH + 1.55, 0]} rotY={Math.PI / 2} shutters={false} />}
        </>
      )}
      {porch && (
        <group position={[0, 0, d / 2]}>
          <mesh position={[0, 0.2, 1.3]} geometry={rboxW(w * 0.8, 0.4, 2.6, 0.04, 2)} material={M.concrete()} castShadow receiveShadow />
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * w * 0.37, 1.6, 2.4]} geometry={rbox(0.18, 2.6, 0.18, 0.03)} material={M.wood()} castShadow />
          ))}
          <group position={[0, 3.0, 1.35]} rotation={[0.18, 0, 0]}>
            <mesh geometry={rboxW(w * 0.86, 0.1, 2.9, 0.03, ROOF_TILE_WORLD[0], ROOF_TILE_WORLD[1])} material={M.roofTiles(roof)} castShadow receiveShadow />
          </group>
        </group>
      )}
    </group>
  );
};

const stripeTexture = (key: string, a: string, b: string) =>
  cachedTexture(key, 512, 512, (ctx, w, h) => {
    const n = 6;
    for (let k = 0; k < n; k++) {
      ctx.fillStyle = k % 2 ? a : b;
      ctx.fillRect((k * w) / n, 0, w / n, h);
    }
  });

// Small kampung stall, no real brands
export const Warung: React.FC<{ position: V3; rotY?: number }> = ({ position, rotY = 0 }) => {
  const awning = useMemo(() => std("awning", { map: stripeTexture("awning", "#E9573F", "#F6F0E4"), roughness: 0.8, side: THREE.DoubleSide }), []);
  const goods = ["#F2B632", "#5DA9E9", "#E9573F", "#7CCB5B", "#F28C38", "#B984D9"];
  return (
    <group position={position} rotation={[0, rotY, 0]}>
      <AOFootprint w={4.6} d={3.6} walls={0} />
      <mesh position={[0, 0.12, 0]} geometry={rboxW(4.6, 0.24, 3.6, 0.04, 2)} material={M.concrete()} receiveShadow castShadow />
      {/* Back wall and sides */}
      <mesh position={[0, 1.6, -1.6]} geometry={rboxW(4.4, 2.9, 0.2, 0.04, PLASTER_WORLD)} material={M.plaster("#F3D9A6")} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.1, 1.6, -0.4]} geometry={rboxW(0.2, 2.9, 2.6, 0.04, PLASTER_WORLD)} material={M.plaster("#F3D9A6")} castShadow receiveShadow />
      ))}
      {/* Shelves with goods */}
      {[0.9, 1.6, 2.3].map((y, row) => (
        <group key={y}>
          <mesh position={[0, y, -1.35]} geometry={rbox(3.8, 0.08, 0.4, 0.02)} material={M.wood()} castShadow />
          {Array.from({ length: 7 }, (_, k) => (
            <mesh key={k} position={[-1.6 + k * 0.53, y + 0.2, -1.35]} geometry={k % 3 === 0 ? cyl(0.13, 0.13, 0.32, 24) : rbox(0.34, 0.32, 0.26, 0.04)} material={paint(goods[(k + row * 2) % goods.length], 0.5)} castShadow />
          ))}
        </group>
      ))}
      {/* Counter */}
      <mesh position={[0, 0.75, 0.9]} geometry={rbox(4.0, 1.05, 0.7, 0.05)} material={M.woodCounter()} castShadow receiveShadow />
      <mesh position={[0, 1.32, 0.9]} geometry={rbox(4.2, 0.08, 0.85, 0.03)} material={M.woodDark()} castShadow />
      {/* Glass jars on the counter */}
      {[-1.4, -0.7, 0.9, 1.5].map((x, k) => (
        <group key={x} position={[x, 1.55, 0.9]}>
          <mesh geometry={cyl(0.17, 0.17, 0.36, 32)} material={M.jarGlass()} />
          <mesh position={[0, -0.05, 0]} geometry={cyl(0.15, 0.15, 0.22, 24)} material={paint(goods[k + 1], 0.5)} />
          <mesh position={[0, 0.2, 0]} geometry={cyl(0.18, 0.18, 0.06, 32)} material={paint("#E94F3D", 0.4)} />
        </group>
      ))}
      {/* Roof and awning */}
      <mesh position={[0, 3.15, -0.2]} rotation={[0.1, 0, 0]} geometry={rboxW(4.9, 0.12, 3.8, 0.03, ROOF_TILE_WORLD[0], ROOF_TILE_WORLD[1])} material={M.roofTiles("#B9623F")} castShadow receiveShadow />
      <mesh position={[0, 2.75, 2.0]} rotation={[0.45, 0, 0]} geometry={box(4.6, 0.04, 1.1)} material={awning} castShadow />
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 2.2, 1.45, 2.3]} geometry={cyl(0.05, 0.05, 2.7, 16)} material={M.steel()} castShadow />
      ))}
      {/* Hanging snack strips */}
      {[-1.2, -0.4, 0.4, 1.2].map((x, k) => (
        <mesh key={x} position={[x, 2.2, 1.6]} geometry={rbox(0.22, 0.75, 0.04, 0.02)} material={paint(goods[(k + 3) % goods.length], 0.5)} castShadow />
      ))}
      {/* Bench */}
      <mesh position={[0, 0.48, 2.05]} geometry={rbox(2.6, 0.09, 0.42, 0.03)} material={M.wood()} castShadow receiveShadow />
      {[-1.1, 1.1].map((x) => (
        <mesh key={x} position={[x, 0.24, 2.05]} geometry={rbox(0.09, 0.48, 0.36, 0.02)} material={M.woodDark()} castShadow />
      ))}
    </group>
  );
};

// Small motorbike workshop with tyres and a tool board
export const Bengkel: React.FC<{ position: V3; rotY?: number }> = ({ position, rotY = 0 }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <AOFootprint w={5.4} d={4.2} walls={0} />
    <mesh position={[0, 0.1, 0]} geometry={rboxW(5.4, 0.2, 4.2, 0.04, 2)} material={M.concrete()} receiveShadow castShadow />
    <mesh position={[0, 1.7, -1.95]} geometry={rboxW(5.2, 3.2, 0.2, 0.04, BRICK_WORLD[0])} material={M.brick("#A9573D")} castShadow receiveShadow />
    <mesh position={[-2.5, 1.7, -0.5]} geometry={rboxW(0.2, 3.2, 3.0, 0.04, BRICK_WORLD[0])} material={M.brick("#A9573D")} castShadow receiveShadow />
    {/* Corrugated roof: ribs as cylinders */}
    <group position={[0, 3.45, -0.1]} rotation={[0.12, 0, 0]}>
      <mesh geometry={box(5.8, 0.05, 4.6)} material={paint("#9AA3AD", 0.45, 0.5)} castShadow receiveShadow />
      {Array.from({ length: 12 }, (_, k) => (
        <mesh key={k} position={[-2.75 + k * 0.5, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={cyl(0.06, 0.06, 4.6, 12)} material={paint("#A9B2BC", 0.4, 0.5)} castShadow />
      ))}
    </group>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 2.6, 1.7, 1.9]} geometry={rbox(0.16, 3.4, 0.16, 0.03)} material={M.darkMetal()} castShadow />
    ))}
    {/* Tool board */}
    <mesh position={[0.6, 1.9, -1.83]} geometry={rbox(2.2, 1.2, 0.05, 0.02)} material={M.woodLight()} />
    {[-0.2, 0.3, 0.8, 1.3].map((x, k) => (
      <mesh key={x} position={[x, 1.9 + (k % 2) * 0.15, -1.78]} geometry={rbox(0.12, 0.6, 0.05, 0.02)} material={k % 2 ? M.steel() : paint("#E9573F", 0.4)} />
    ))}
    {/* Tyre stack */}
    {[0, 1, 2, 3].map((k) => (
      <mesh key={k} position={[-1.7, 0.32 + k * 0.24, -1.1]} rotation={[Math.PI / 2, 0, 0]} geometry={torus(0.42, 0.13, 16, 40)} material={M.rubber()} castShadow />
    ))}
    {/* Workbench */}
    <mesh position={[1.4, 0.95, -1.4]} geometry={rbox(1.8, 0.1, 0.8, 0.03)} material={M.wood()} castShadow receiveShadow />
    {[0.6, 2.2].map((x) => (
      <mesh key={x} position={[x, 0.5, -1.4]} geometry={rbox(0.1, 0.9, 0.7, 0.02)} material={M.darkMetal()} castShadow />
    ))}
  </group>
);

// Picket fence along x, instanced
export const Fence: React.FC<{ from: V3; length: number; rotY?: number; color?: string }> = ({ from, length, rotY = 0, color = "#F2EBDD" }) => {
  const n = Math.max(2, Math.round(length / 0.32));
  const mesh = useMemo(() => {
    const im = new THREE.InstancedMesh(rbox(0.14, 1.0, 0.07, 0.03, 2), paint(color, 0.65), n);
    const m4 = new THREE.Matrix4();
    for (let k = 0; k < n; k++) {
      m4.makeTranslation((k / (n - 1)) * length, 0.5, 0);
      im.setMatrixAt(k, m4);
    }
    im.castShadow = true;
    im.receiveShadow = true;
    im.instanceMatrix.needsUpdate = true;
    return im;
  }, [n, length, color]);
  return (
    <group position={from} rotation={[0, rotY, 0]}>
      <primitive object={mesh} />
      {[0.3, 0.75].map((y) => (
        <mesh key={y} position={[length / 2, y, -0.06]} geometry={box(length, 0.08, 0.04)} material={paint(color, 0.65)} castShadow />
      ))}
    </group>
  );
};
