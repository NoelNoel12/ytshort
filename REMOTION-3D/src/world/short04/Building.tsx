// Cutaway office building (maket) with a lift shaft, lobby and furnished floors. Front face (+z) is cut open.
import React from "react";
import * as THREE from "three";
import { M, paint, std } from "../materials";
import { box, boxW, cyl, rbox, rboxW } from "../geom";
import { cachedTexture } from "../textures";
import { AOFootprint } from "../buildings";
import { PottedPlant } from "../nature";

type V3 = [number, number, number];

export const BLD = {
  x0: -5.5,
  x1: 3.5,
  zBack: -15,
  zFront: -8,
  floorH: 3.2,
  floors: 5,
  slab: 0.3,
  groundY: 0.35,
  wall: 0.25,
  shaft: { x0: -1.95, x1: 0.35, zBack: -10.7 },
};
export const floorY = (i: number) => BLD.groundY + i * BLD.floorH;
export const ROOF_Y = floorY(BLD.floors);
export const SHAFT_CX = (BLD.shaft.x0 + BLD.shaft.x1) / 2;
export const SHAFT_CZ = (BLD.shaft.zBack + BLD.zFront) / 2;

const PLASTER = 3.2;
const wallMat = () => M.plaster("#ECE6DA");
const cutMat = () => std("cutFace", { color: "#8E8A84", roughness: 0.95 });

// Lobby floor tiles: large squares with soft joints (no thin lines)
const tileTexture = () =>
  cachedTexture("lobbyTile", 512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#D9D2C4";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#CFC7B8";
    ctx.fillRect(0, 0, w / 2, h / 2);
    ctx.fillRect(w / 2, h / 2, w / 2, h / 2);
    ctx.fillStyle = "rgba(120,110,95,0.45)";
    ctx.fillRect(0, h / 2 - 3, w, 6);
    ctx.fillRect(w / 2 - 3, 0, 6, h);
  });

const Window: React.FC<{ position: V3; rotY?: number; w?: number; h?: number }> = ({ position, rotY = 0, w = 1.4, h = 1.5 }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh geometry={rbox(w + 0.14, h + 0.14, 0.12, 0.03)} material={paint("#5B6470", 0.5, 0.3)} />
    <mesh position={[0, 0, 0.04]} geometry={box(w - 0.04, h - 0.04, 0.02)} material={M.windowGlass()} />
    <mesh position={[0, 0, 0.065]} geometry={box(0.06, h, 0.03)} material={paint("#5B6470", 0.5, 0.3)} />
  </group>
);

// Simple office furniture so every floor reads as a real room
const Desk: React.FC<{ position: V3; rotY?: number; tone?: string }> = ({ position, rotY = 0, tone = "#C08552" }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.75, 0]} geometry={rbox(1.3, 0.06, 0.65, 0.02)} material={paint(tone, 0.55)} castShadow receiveShadow />
    {[-0.58, 0.58].map((x) => (
      <mesh key={x} position={[x, 0.37, 0]} geometry={rbox(0.06, 0.74, 0.6, 0.02)} material={M.darkMetal()} castShadow />
    ))}
    <mesh position={[0, 1.02, -0.18]} geometry={rbox(0.55, 0.36, 0.04, 0.015)} material={paint("#2B2F36", 0.3)} castShadow />
    <mesh position={[0, 1.02, -0.155]} geometry={box(0.5, 0.31, 0.005)} material={std("screenGlow", { color: "#9FD3FF", emissive: "#5FA8E8", emissiveIntensity: 0.5, roughness: 0.3 })} />
    <mesh position={[0, 0.45, 0.55]} geometry={rbox(0.45, 0.08, 0.45, 0.03)} material={paint("#3C7DD9", 0.5)} castShadow />
    <mesh position={[0, 0.75, 0.75]} geometry={rbox(0.45, 0.55, 0.06, 0.03)} material={paint("#3C7DD9", 0.5)} castShadow />
  </group>
);

const Shelf: React.FC<{ position: V3; rotY?: number }> = ({ position, rotY = 0 }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.9, 0]} geometry={rbox(1.2, 1.8, 0.4, 0.03)} material={M.woodLight()} castShadow receiveShadow />
    {[0.45, 0.95, 1.45].map((y, k) => (
      <group key={y}>
        {[-0.35, -0.05, 0.3].map((x, j) => (
          <mesh key={x} position={[x, y + 0.12, 0.05]} geometry={rbox(0.2, 0.28, 0.25, 0.02)} material={paint(["#E9573F", "#F2B632", "#5DA9E9", "#7CCB5B"][(k + j) % 4], 0.6)} />
        ))}
      </group>
    ))}
  </group>
);

const Sofa: React.FC<{ position: V3; rotY?: number; color?: string }> = ({ position, rotY = 0, color = "#5E9BD6" }) => (
  <group position={position} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.25, 0]} geometry={rbox(1.6, 0.4, 0.75, 0.12)} material={M.bag(color)} castShadow receiveShadow />
    <mesh position={[0, 0.6, -0.3]} geometry={rbox(1.6, 0.55, 0.18, 0.08)} material={M.bag(color)} castShadow />
    {[-0.82, 0.82].map((x) => (
      <mesh key={x} position={[x, 0.45, 0]} geometry={rbox(0.18, 0.5, 0.75, 0.07)} material={M.bag(color)} castShadow />
    ))}
  </group>
);

// Floor slab with a hole where the shaft runs
const Slab: React.FC<{ y: number; hole?: boolean; mat?: THREE.Material }> = ({ y, hole = true, mat }) => {
  const { x0, x1, zBack, zFront, slab, shaft } = BLD;
  const m = mat ?? M.concrete();
  const pieces: [number, number, number, number][] = hole
    ? [
        [x0, shaft.x0, zBack, zFront],
        [shaft.x1, x1, zBack, zFront],
        [shaft.x0, shaft.x1, zBack, shaft.zBack],
      ]
    : [[x0, x1, zBack, zFront]];
  return (
    <group>
      {pieces.map(([a, b, c, d], k) => (
        <mesh key={k} position={[(a + b) / 2, y - slab / 2, (c + d) / 2]} geometry={boxW(b - a, slab, d - c, 2)} material={m} castShadow receiveShadow />
      ))}
      {/* Cut face of the slab, slightly darker so the section reads */}
      {pieces
        .filter((p) => p[3] === zFront)
        .map(([a, b], k) => (
          <mesh key={`c${k}`} position={[(a + b) / 2, y - slab / 2, zFront + 0.006]} geometry={box(b - a, slab, 0.012)} material={cutMat()} />
        ))}
    </group>
  );
};

export const Building: React.FC = () => {
  const { x0, x1, zBack, zFront, wall, shaft, floorH, floors } = BLD;
  const W = x1 - x0;
  const D = zFront - zBack;
  const H = ROOF_Y;
  const cx = (x0 + x1) / 2;
  const cz = (zBack + zFront) / 2;
  const tileMat = React.useMemo(() => {
    const t = tileTexture().clone();
    t.repeat.set(4, 4);
    t.needsUpdate = true;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, metalness: 0.05 });
  }, []);
  const floorsArr = Array.from({ length: floors }, (_, i) => i);
  return (
    <group>
      <AOFootprint w={W + 0.6} d={D + 0.6} spread={1.6} walls={0} y={0} />
      {/* Plinth */}
      <group position={[cx, 0, cz]}>
        <mesh position={[0, BLD.groundY / 2, 0]} geometry={rboxW(W + 0.4, BLD.groundY, D + 0.4, 0.04, 2)} material={M.concrete()} castShadow receiveShadow />
      </group>
      {/* Lobby floor tiles (ground, left bay and behind the shaft) */}
      <mesh position={[(x0 + shaft.x0) / 2, BLD.groundY + 0.01, cz]} rotation={[-Math.PI / 2, 0, 0]} material={tileMat} receiveShadow>
        <planeGeometry args={[shaft.x0 - x0 - wall, D - wall]} />
      </mesh>
      {/* Back and side walls, full height */}
      <mesh position={[cx, H / 2 + BLD.groundY / 2, zBack + wall / 2]} geometry={boxW(W, H - BLD.groundY, wall, PLASTER)} material={wallMat()} castShadow receiveShadow />
      {[x0 + wall / 2, x1 - wall / 2].map((x) => (
        <mesh key={x} position={[x, H / 2 + BLD.groundY / 2, cz]} geometry={boxW(wall, H - BLD.groundY, D, PLASTER)} material={wallMat()} castShadow receiveShadow />
      ))}
      {/* Cut faces of the outer walls */}
      {[x0 + wall / 2, x1 - wall / 2].map((x) => (
        <mesh key={`cut${x}`} position={[x, H / 2 + BLD.groundY / 2, zFront + 0.006]} geometry={box(wall, H - BLD.groundY, 0.012)} material={cutMat()} />
      ))}
      {/* Windows: side walls (outside and inside) and back wall */}
      {floorsArr.map((i) => (
        <group key={i}>
          {[-0.9, 0.9].map((dz) => (
            <group key={dz}>
              <Window position={[x0 - 0.02, floorY(i) + 1.6, cz + dz * 1.6]} rotY={-Math.PI / 2} />
              <Window position={[x1 + 0.02, floorY(i) + 1.6, cz + dz * 1.6]} rotY={Math.PI / 2} />
            </group>
          ))}
          {[x0 + 1.6, x1 - 1.5].map((x) => (
            <Window key={x} position={[x, floorY(i) + 1.6, zBack + wall + 0.02]} />
          ))}
        </group>
      ))}
      {/* Floor slabs and roof */}
      {floorsArr.slice(1).map((i) => (
        <Slab key={i} y={floorY(i)} />
      ))}
      <Slab y={ROOF_Y} />
      {/* Ceiling lamps on every floor (emissive panels, no extra lights) */}
      {floorsArr.map((i) =>
        [(x0 + shaft.x0) / 2, (shaft.x1 + x1) / 2].map((x) => (
          <mesh key={`${i}:${x}`} position={[x, floorY(i + 1) - BLD.slab - 0.03, cz]} geometry={rbox(1.2, 0.05, 0.5, 0.02)} material={std("ceilLamp", { color: "#FFF8E8", emissive: "#FFF1D0", emissiveIntensity: 1.2 })} />
        )),
      )}
      {/* Shaft: back, right and left walls (left has a landing door opening on each floor) */}
      <mesh position={[SHAFT_CX, H / 2 + BLD.groundY / 2, shaft.zBack - 0.1]} geometry={boxW(shaft.x1 - shaft.x0 + 0.2, H - BLD.groundY, 0.2, PLASTER)} material={M.plaster("#D4D0C8")} castShadow receiveShadow />
      <mesh position={[shaft.x1 + 0.1, H / 2 + BLD.groundY / 2, (shaft.zBack + zFront) / 2]} geometry={boxW(0.2, H - BLD.groundY, zFront - shaft.zBack, PLASTER)} material={M.plaster("#D4D0C8")} castShadow receiveShadow />
      {floorsArr.map((i) => {
        const y0 = floorY(i);
        const dz = zFront - shaft.zBack;
        const open = 1.1; // opening width along z
        const segA = (dz - open) / 2;
        return (
          <group key={`lw${i}`}>
            {/* Wall pieces around the opening */}
            <mesh position={[shaft.x0 - 0.1, y0 + floorH / 2, shaft.zBack + segA / 2]} geometry={boxW(0.2, floorH, segA, PLASTER)} material={M.plaster("#D4D0C8")} castShadow receiveShadow />
            <mesh position={[shaft.x0 - 0.1, y0 + floorH / 2, zFront - segA / 2]} geometry={boxW(0.2, floorH, segA, PLASTER)} material={M.plaster("#D4D0C8")} castShadow receiveShadow />
            <mesh position={[shaft.x0 - 0.1, y0 + 2.3 + (floorH - 2.3) / 2, SHAFT_CZ]} geometry={boxW(0.2, floorH - 2.3, open, PLASTER)} material={M.plaster("#D4D0C8")} castShadow receiveShadow />
            {/* Steel door frame */}
            <mesh position={[shaft.x0 - 0.21, y0 + 2.3, SHAFT_CZ]} geometry={rbox(0.04, 0.1, open + 0.2, 0.015)} material={M.steel()} />
            {[-1, 1].map((s) => (
              <mesh key={s} position={[shaft.x0 - 0.21, y0 + 1.15, SHAFT_CZ + s * (open / 2 + 0.05)]} geometry={rbox(0.04, 2.3, 0.1, 0.015)} material={M.steel()} />
            ))}
            {/* Closed landing doors on the upper floors (the ground floor door is animated by the scenes) */}
            {i > 0 && (
              <mesh position={[shaft.x0 - 0.12, y0 + 1.15, SHAFT_CZ]} geometry={rbox(0.05, 2.28, open, 0.015)} material={M.steel()} />
            )}
            {/* Call button panel */}
            <mesh position={[shaft.x0 - 0.22, y0 + 1.25, SHAFT_CZ - open / 2 - 0.35]} geometry={rbox(0.03, 0.25, 0.12, 0.01)} material={M.darkMetal()} />
            <mesh position={[shaft.x0 - 0.24, y0 + 1.28, SHAFT_CZ - open / 2 - 0.35]} geometry={cyl(0.025, 0.025, 0.01, 16)} rotation={[0, 0, Math.PI / 2]} material={std("callBtn", { color: "#FFD23F", emissive: "#FFB000", emissiveIntensity: 0.8 })} />
          </group>
        );
      })}
      {/* Guide rails inside the shaft */}
      {[SHAFT_CX - 0.75, SHAFT_CX + 0.75].map((x) => (
        <mesh key={x} position={[x, H / 2, shaft.zBack + 0.05]} geometry={box(0.08, H, 0.08)} material={M.darkMetal()} />
      ))}
      {/* Lobby: reception desk, sofa, plants */}
      <group position={[x0 + 1.4, BLD.groundY, zBack + 0.75]}>
        <mesh position={[0, 0.55, 0]} geometry={rboxW(1.8, 1.1, 0.7, 0.05, 1.2)} material={M.woodCounter()} castShadow receiveShadow />
        <mesh position={[0, 1.12, 0]} geometry={rbox(2.0, 0.06, 0.85, 0.02)} material={paint("#F4F1E8", 0.4)} castShadow />
      </group>
      <Sofa position={[x0 + 1.0, BLD.groundY, zBack + 2.2]} rotY={Math.PI / 2} color="#E9853F" />
      <PottedPlant position={[x0 + 0.6, BLD.groundY, zBack + 0.8]} seed="lob1" />
      <PottedPlant position={[shaft.x0 - 0.7, BLD.groundY, zFront - 0.5]} seed="lob2" scale={0.8} />
      {/* Upper floors: offices on both sides of the shaft */}
      {floorsArr.slice(1).map((i) => (
        <group key={`f${i}`} position={[0, floorY(i), 0]}>
          <Desk position={[x0 + 1.5, 0, cz + 0.3]} rotY={Math.PI / 2} tone={i % 2 ? "#C08552" : "#D9D2C4"} />
          <Shelf position={[shaft.x1 + 1.6, 0, zBack + 0.5]} />
          <Desk position={[x1 - 1.2, 0, cz + 0.8]} rotY={-Math.PI / 2} tone={i % 2 ? "#D9D2C4" : "#C08552"} />
          <PottedPlant position={[x0 + 0.5, 0, zFront - 0.6]} seed={`fp${i}`} scale={0.7} />
        </group>
      ))}
      {/* Ground floor right bay: small cafe corner */}
      <group position={[0, BLD.groundY, 0]}>
        <mesh position={[(shaft.x1 + x1) / 2, 0.5, zBack + 0.5]} geometry={rboxW(2.6, 1.0, 0.6, 0.04, 1.2)} material={M.woodCounter()} castShadow />
        <Sofa position={[(shaft.x1 + x1) / 2, 0, zFront - 1.3]} rotY={Math.PI} color="#7CCB5B" />
      </group>
      {/* Roof: parapet, water tank, lift machine room */}
      {[
        [cx, zBack + 0.1, W, 0.2],
        [cx, zFront - 0.1, W, 0.2],
      ].map(([x, z, w, d], k) => (
        <mesh key={k} position={[x, ROOF_Y + 0.45, z]} geometry={rboxW(w, 0.9, d, 0.04, 2)} material={wallMat()} castShadow receiveShadow />
      ))}
      {[x0 + 0.1, x1 - 0.1].map((x) => (
        <mesh key={x} position={[x, ROOF_Y + 0.45, cz]} geometry={rboxW(0.2, 0.9, D, 0.04, 2)} material={wallMat()} castShadow receiveShadow />
      ))}
      <group position={[x0 + 1.4, ROOF_Y, zBack + 1.6]}>
        {[-0.45, 0.45].map((x) =>
          [-0.45, 0.45].map((z) => <mesh key={`${x}${z}`} position={[x, 0.6, z]} geometry={box(0.08, 1.2, 0.08)} material={M.darkMetal()} castShadow />),
        )}
        <mesh position={[0, 1.7, 0]} geometry={cyl(0.75, 0.75, 1.1, 40)} material={paint("#3C7DD9", 0.4, 0.2)} castShadow />
      </group>
      <mesh position={[shaft.x1 + 1.1, ROOF_Y + 0.9, shaft.zBack - 0.9]} geometry={rboxW(1.8, 1.8, 1.8, 0.05, 2)} material={wallMat()} castShadow receiveShadow />
    </group>
  );
};

// Free-standing lattice telecom tower (generic, no operator branding)
export const TOWER = { pos: [10.6, 0, -9.8] as V3, h: 15 };
export const towerTop = (): V3 => [TOWER.pos[0], TOWER.h - 1.2, TOWER.pos[2]];

export const Tower: React.FC = () => {
  const { h } = TOWER;
  const legs = 4;
  const base = 1.1;
  const top = 0.45;
  const levels = 6;
  const legMat = paint("#C9CDD3", 0.45, 0.5);
  const brace = paint("#B7BCC3", 0.5, 0.5);
  const legPos = (k: number, y: number): V3 => {
    const r = base + (top - base) * (y / h);
    const a = (k / legs) * Math.PI * 2 + Math.PI / 4;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  const seg = (a: V3, b: V3, key: string, mat: THREE.Material, r = 0.05) => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const len = va.distanceTo(vb);
    const mid = va.clone().add(vb).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
    return <mesh key={key} position={mid.toArray() as V3} quaternion={q} geometry={cyl(r, r, len, 10)} material={mat} castShadow />;
  };
  const parts: React.ReactNode[] = [];
  for (let k = 0; k < legs; k++) parts.push(seg(legPos(k, 0), legPos(k, h), `leg${k}`, legMat, 0.09));
  for (let l = 0; l < levels; l++) {
    const y0 = (l / levels) * h;
    const y1 = ((l + 1) / levels) * h;
    for (let k = 0; k < legs; k++) {
      const n = (k + 1) % legs;
      parts.push(seg(legPos(k, y1), legPos(n, y1), `ring${l}${k}`, brace, 0.045));
      parts.push(seg(legPos(k, y0), legPos(n, y1), `x${l}${k}`, brace, 0.035));
    }
  }
  return (
    <group position={TOWER.pos}>
      <mesh position={[0, 0.2, 0]} geometry={rbox(2.8, 0.4, 2.8, 0.05)} material={M.concrete()} castShadow receiveShadow />
      {parts}
      {/* Panel antennas (three sectors) and a red obstruction light */}
      {[0, 1, 2].map((k) => {
        const a = (k / 3) * Math.PI * 2;
        return (
          <mesh key={k} position={[Math.cos(a) * 0.75, h - 1.6, Math.sin(a) * 0.75]} rotation={[0, -a, 0]} geometry={rbox(0.18, 1.5, 0.4, 0.05)} material={paint("#EDEFF2", 0.45)} castShadow />
        );
      })}
      <mesh position={[0, h + 0.4, 0]} geometry={cyl(0.04, 0.04, 1.2, 10)} material={legMat} />
      <mesh position={[0, h + 1.05, 0]} geometry={cyl(0.12, 0.12, 0.16, 20)} material={std("towerLight", { color: "#FF5A4E", emissive: "#FF2A1E", emissiveIntensity: 1.5 })} />
    </group>
  );
};
