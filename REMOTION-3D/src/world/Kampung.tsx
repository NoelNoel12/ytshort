// The shared kampung diorama. Road along x at z = 0, north side is z < 0.
import React from "react";
import { Bengkel, Fence, House, Warung } from "./buildings";
import { DirtPatch, Ground, GrassTufts, Pebbles } from "./Ground";
import { BananaTree, Bush, CoconutTree, RoundTree } from "./nature";
import { Bench, Motorbike, PlasticChair, PowerLine, StreetLamp } from "./street";
import { TreeLine } from "./Sky";
import { Building, Tower } from "./short04/Building";

// Named spots that scenes use
export const SPOTS = {
  desk: [0, 0, 0.4] as [number, number, number],
  stage: [-6.5, 0, 0.6] as [number, number, number], // installment and jar stage on the road
  garden: [27, 0, -10] as [number, number, number], // cutaway soil block (S6)
  dodiHouse: [-21, 0, -11] as [number, number, number], // porch (S7)
};

const WALLS = ["#EDD9B8", "#F0C98E", "#CFE0C8", "#F2D3B0", "#E6CFAE", "#F1DDBF", "#D6DCCB", "#F3CDA4"];
const ROOFS = ["#B9623F", "#A8573A", "#C47248", "#9E5236"];

const avoidRoadNorth = (_x: number, z: number) => z > -6 || z < -9.6;
const avoidRoadSouth = (_x: number, z: number) => z < 6 || z > 9.4;
const avoidGarden = (x: number, z: number) => Math.abs(x - SPOTS.garden[0]) < 3.6 && Math.abs(z - SPOTS.garden[2]) < 2.6;

// Static world: memoised so React never re-renders it per frame
export type KampungVariant = "default" | "short04";

export const Kampung: React.FC<{ variant?: KampungVariant }> = React.memo(({ variant = "default" }) => {
  const s04 = variant === "short04";
  return (
    <group>
      <Ground />
      {s04 && (
        <>
          <Building />
          <Tower />
        </>
      )}
      {/* Row 1 north, facing the road */}
      <House position={[-31, 0, -11.5]} wall={WALLS[0]} roof={ROOFS[0]} brick />
      <House position={SPOTS.dodiHouse} wall={WALLS[1]} roof={ROOFS[1]} door="#4F86C6" porch w={7} />
      <Bengkel position={[-11.5, 0, -9.6]} />
      {!s04 && <House position={[-2.5, 0, -11.8]} wall={WALLS[2]} roof={ROOFS[2]} windows={1} w={5.6} />}
      <Warung position={[6.5, 0, -8.6]} />
      <House position={[15.5, 0, -11.6]} wall={WALLS[3]} roof={ROOFS[3]} />
      <House position={[38, 0, -11.5]} wall={WALLS[4]} roof={ROOFS[0]} />
      <House position={[-41, 0, -11.5]} wall={WALLS[5]} roof={ROOFS[2]} />

      {/* Row 2 north, a bit rotated for variety */}
      {[-36, -24, -12, 0, 12, 24, 36].map((x, k) => (
        <House key={x} position={[x + (k % 2) * 2, 0, -25 - (k % 3)]} rotY={(k % 2 ? 0.08 : -0.06)} wall={WALLS[(k + 3) % WALLS.length]} roof={ROOFS[(k + 1) % ROOFS.length]} detail={1} w={6 + (k % 3) * 0.6} brick={k % 3 === 1} />
      ))}
      {/* Row 3, simple shapes in the haze */}
      {[-42, -28, -14, 0, 14, 28, 42].map((x, k) => (
        <House key={x} position={[x + 4, 0, -40]} rotY={0.1 * ((k % 3) - 1)} wall={WALLS[(k + 5) % WALLS.length]} roof={ROOFS[k % ROOFS.length]} detail={0} />
      ))}
      {/* South row, facing the road */}
      {[-30, -18, -6, 6, 18, 30].map((x, k) => (
        <House key={x} position={[x, 0, 14]} rotY={Math.PI} wall={WALLS[(k + 1) % WALLS.length]} roof={ROOFS[(k + 2) % ROOFS.length]} detail={k % 2 ? 1 : 2} brick={k === 3} />
      ))}
      {[-24, -12, 0, 12, 24].map((x, k) => (
        <House key={x} position={[x + 3, 0, 26]} rotY={Math.PI + 0.07 * (k % 2 ? 1 : -1)} wall={WALLS[(k + 4) % WALLS.length]} roof={ROOFS[(k + 3) % ROOFS.length]} detail={0} />
      ))}

      {/* Yards */}
      {[-31, -21, -2.5, 15.5, 38].map((x) => (
        <DirtPatch key={x} position={[x, 0, -7.6]} size={[6.5, 2.6]} />
      ))}
      <Pebbles area={[-44, -8.8, 44, -6.4]} count={160} seed="peb-n" />
      <GrassTufts area={[-46, -9.6, 46, -5.8]} count={700} seed="tuft-n" avoid={avoidRoadNorth} />
      <GrassTufts area={[-46, 5.8, 46, 9.4]} count={600} seed="tuft-s" avoid={avoidRoadSouth} />

      {/* Fences */}
      <Fence from={[-34.2, 0, -8.9]} length={2.4} />
      <Fence from={[-30.2, 0, -8.9]} length={2.4} />
      <Fence from={[-17.6, 0, -8.9]} length={2.2} color="#E6D3B0" />
      <Fence from={[12.4, 0, -8.9]} length={2.2} />
      <Fence from={[17.4, 0, -8.9]} length={2.4} />

      {/* Garden lot (S6) */}
      <RoundTree position={[22.5, 0, -14.5]} seed="g1" />
      <RoundTree position={[31.5, 0, -15]} seed="g2" scale={0.9} tone={1} />
      <Bush position={[24, 0, -7.4]} seed="gb1" />
      <Bush position={[30.5, 0, -7.6]} seed="gb2" scale={0.8} />
      <Bench position={[33, 0, -9]} rotY={-0.6} />
      <GrassTufts area={[21, -15, 34, -6]} count={500} seed="tuft-g" avoid={avoidGarden} />

      {/* Palms and bananas */}
      <CoconutTree position={[-26, 0, -15.5]} height={8} lean={0.3} seed="p1" />
      <CoconutTree position={[-7, 0, -16.5]} height={9} lean={-0.25} rotY={0.4} seed="p2" />
      <CoconutTree position={[10.5, 0, -15.2]} height={7.5} lean={0.2} rotY={1.2} seed="p3" />
      <CoconutTree position={[20.5, 0, -17]} height={8.5} lean={0.35} rotY={2.2} seed="p4" />
      <CoconutTree position={[-37, 0, -17]} height={7.2} lean={0.2} rotY={2.8} seed="p5" />
      <CoconutTree position={[42, 0, -16]} height={8.2} lean={-0.3} seed="p6" />
      <CoconutTree position={[-12, 0, 16]} height={8} lean={0.25} rotY={3.4} seed="p7" />
      <CoconutTree position={[13, 0, 16.5]} height={7.6} lean={-0.2} rotY={0.8} seed="p8" />
      <BananaTree position={[-16.5, 0, -8.2]} seed="b1" />
      {!s04 && <BananaTree position={[2.6, 0, -9]} seed="b2" height={2.3} />}
      <BananaTree position={[19.8, 0, -8.6]} seed="b3" />
      <BananaTree position={[-35.5, 0, -8.4]} seed="b4" height={2.2} />
      <BananaTree position={[-14, 0, 8.6]} seed="b5" />
      <BananaTree position={[24, 0, 8.4]} seed="b6" height={2.4} />
      {[-30, -6, 6, 30].map((x, k) => (
        <RoundTree key={x} position={[x, 0, -19]} seed={`rt${k}`} tone={(k % 2) as 0 | 1} scale={1.1} />
      ))}
      {[-24, 0, 24].map((x, k) => (
        <RoundTree key={x} position={[x, 0, 19]} seed={`rs${k}`} tone={(k % 2) as 0 | 1} />
      ))}
      <Bush position={[-27, 0, -8]} seed="bb1" scale={0.8} />
      <Bush position={[13.6, 0, -8.1]} seed="bb2" scale={0.7} />
      <Bush position={[-7.5, 0, 7.6]} seed="bb3" />

      {/* Street furniture */}
      <PowerLine z={-6.3} xs={[-56, -40, -24, -8, 8, 24, 40, 56]} />
      {[-36, -12, 12, 36].map((x) => (
        <StreetLamp key={x} position={[x, 0, 5.3]} rotY={Math.PI} />
      ))}
      <PlasticChair position={[4.4, 0.24, -5.9]} rotY={0.4} />
      <PlasticChair position={[8.6, 0.24, -5.9]} rotY={-0.3} color="#3C7DD9" />
      <Motorbike position={[-10.5, 0.2, -7.2]} rotY={0.25} />
      <Motorbike position={[20, 0.16, 4.7]} rotY={Math.PI - 0.1} color="#E04B3C" />

      <TreeLine radius={95} count={110} />
    </group>
  );
});
