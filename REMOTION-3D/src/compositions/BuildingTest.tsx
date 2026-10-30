import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Kampung } from "../world/Kampung";
import { Lighting } from "../world/Lighting";
import { Sky } from "../world/Sky";
import { CameraRig, type CamShot } from "../world/CameraRig";
import { FontGate } from "../fonts";
import { Grade } from "../components/Grade";
import { StaticBatch } from "../world/StaticBatch";
import { Cabin, LandingDoor } from "../world/short04/Lift";
import { BLD, SHAFT_CX, SHAFT_CZ } from "../world/short04/Building";
import { PakDodi } from "../world/characters/PakDodi";
import { EXPRESSIONS, POSES } from "../world/characters/rig";

const C: [number, number, number] = [SHAFT_CX, 1.5, SHAFT_CZ];
const SHOTS: CamShot[] = [
  { pos: [4, 9, 26], target: [1, 9, -12], fov: 42 },
  { pos: [-3.2, 1.9, -2.6], target: [C[0], 1.4, C[2]], fov: 40 },
  { pos: [1.5, 2.4, -3.5], target: [C[0], 1.5, C[2]], fov: 42 },
  { pos: [-2, 19, -2], target: [2, 16, -14], fov: 44 },
];

export const BuildingTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const shot = SHOTS[Math.min(SHOTS.length - 1, frame)];
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} shadows="percentage" gl={{ antialias: true }}>
        <FontGate>
          <CameraRig {...shot} />
          <Lighting mood="morning" focus={[-1, 0, -11]} shadowSize={16} />
          <Sky mood="morning" frame={frame} />
          <StaticBatch name="kampung">
            <Kampung variant="short04" />
          </StaticBatch>
          <LandingDoor open={frame === 1 ? 1 : 0.3} />
          <Cabin y={BLD.groundY} door={frame === 1 ? 1 : 0.3} cage={frame === 2 ? 1 : 0}>
            <PakDodi frame={frame * 9} position={[0.1, 0, 0.1]} rotY={0.3} pose={POSES.idle} expr={EXPRESSIONS.neutral} />
          </Cabin>
        </FontGate>
      </ThreeCanvas>
      <Grade mood="morning" />
    </AbsoluteFill>
  );
};
