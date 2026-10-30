import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Lighting } from "../world/Lighting";
import { CameraRig } from "../world/CameraRig";
import { FontGate } from "../fonts";
import { PakDodi } from "../world/characters/PakDodi";
import { EXPRESSIONS, POSES, type PoseName } from "../world/characters/rig";
import { Phone } from "../world/short04/Signal";

const CASES: PoseName[] = ["phoneEar", "phoneUp", "phoneLook"];

export const PoseTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const pose = CASES[Math.min(CASES.length - 1, frame % 3)];
  const side = frame >= 3;
  return (
    <AbsoluteFill style={{ backgroundColor: "#bcd" }}>
      <ThreeCanvas width={width} height={height} gl={{ antialias: true }}>
        <FontGate>
          <CameraRig pos={side ? [-3.2, 1.6, 1.2] : [0.3, 1.5, 4.2]} target={[0, 1.3, 0]} fov={34} />
          <Lighting mood="morning" focus={[0, 0, 0]} shadowSize={4} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#9a9" /></mesh>
          <PakDodi frame={20} pose={POSES[pose]} expr={EXPRESSIONS.neutral} rightHand={pose === "phoneEar" ? <Phone position={[-0.033, -0.038, 0.027]} rotation={[-2.597, 0.472, 0.459]} scale={1.6} /> : <Phone position={[0.02, -0.02, 0.06]} rotation={[0.2, Math.PI / 2, 0]} scale={1.6} />} />
        </FontGate>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
