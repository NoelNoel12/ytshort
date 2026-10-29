import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Kampung } from "../world/Kampung";
import { Lighting } from "../world/Lighting";
import { Sky } from "../world/Sky";
import { CameraRig } from "../world/CameraRig";
import { FontGate } from "../fonts";
import { Grade } from "../components/Grade";
import { PakDodi } from "../world/characters/PakDodi";
import { Tuti } from "../world/characters/Tuti";
import { EXPRESSIONS, POSES, type ExpressionName, type PoseName } from "../world/characters/rig";

const CASES: [PoseName, ExpressionName][] = [
  ["idle", "neutral"],
  ["wave", "happy"],
  ["surprised", "surprised"],
  ["shrug", "sweat"],
  ["scratch", "confused"],
  ["thumbsUp", "proud"],
  ["point", "neutral"],
  ["raiseHand", "neutral"],
  ["hug", "happy"],
];

export const CharacterTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [pose, expr] = CASES[Math.min(CASES.length - 1, frame)];
  return (
    <AbsoluteFill>
      <ThreeCanvas width={width} height={height} shadows="percentage" gl={{ antialias: true }}>
        <FontGate>
          {frame < 6 ? <CameraRig pos={[0.2, 1.4, 4.6]} target={[0.2, 1.0, 0]} fov={38} /> : <CameraRig pos={[1.6, 0.55, 2.0]} target={[0.95, 0.42, 0.6]} fov={34} />}
          <Lighting mood="morning" focus={[0, 0, 0]} shadowSize={6} />
          <Sky mood="morning" frame={frame} />
          <Kampung />
          <PakDodi frame={frame * 7} position={[-0.25, 0.16, 0.2]} rotY={0.25} pose={POSES[pose]} expr={EXPRESSIONS[expr]} />
          <Tuti frame={frame * 7} position={[0.95, 0.16, 0.6]} rotY={-0.5 + (frame === 7 ? 1.2 : 0)} scale={1.2} peck={frame === 6 ? 0.8 : 0} flap={frame === 7 ? 1 : 0} sunglasses={frame === 8} eyesWide={frame === 6} />
        </FontGate>
      </ThreeCanvas>
      <Grade mood="morning" />
    </AbsoluteFill>
  );
};
