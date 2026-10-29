import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Kampung, SPOTS } from "../world/Kampung";
import { Lighting, type MoodName } from "../world/Lighting";
import { Sky } from "../world/Sky";
import { CameraRig, type CamShot } from "../world/CameraRig";
import { FontGate } from "../fonts";
import { Grade } from "../components/Grade";

// One frame per viewpoint, for still checks
const SHOTS: { shot: CamShot; mood: MoodName; focus: [number, number, number] }[] = [
  { shot: { pos: [2, 3.2, 13], target: [0, 1.6, -4], fov: 42 }, mood: "morning", focus: SPOTS.desk },
  { shot: { pos: [-14, 5, 10], target: [-4, 1.5, -8], fov: 40 }, mood: "morning", focus: [-6, 0, -4] },
  { shot: { pos: [27, 3.5, -1], target: [27, 1.2, -10], fov: 40 }, mood: "warm", focus: SPOTS.garden },
  { shot: { pos: [-18, 2.2, -3], target: [-21, 1.4, -8], fov: 44 }, mood: "golden", focus: SPOTS.dodiHouse },
  { shot: { pos: [3, 1.0, 6], target: [0, 2.0, -6], fov: 46 }, mood: "dim", focus: SPOTS.desk },
  { shot: { pos: [0, 18, 34], target: [0, 4, -10], fov: 40 }, mood: "golden", focus: SPOTS.desk },
];

export const WorldTest: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = SHOTS[Math.min(SHOTS.length - 1, frame)];
  return (
    <AbsoluteFill style={{ backgroundColor: "#cfe8f6" }}>
      <ThreeCanvas width={width} height={height} shadows="percentage" gl={{ antialias: true }}>
        <FontGate>
          <CameraRig {...s.shot} />
          <Lighting mood={s.mood} focus={s.focus} shadowSize={18} />
          <Sky mood={s.mood} frame={frame} />
          <Kampung />
        </FontGate>
      </ThreeCanvas>
      <Grade mood={s.mood} />
    </AbsoluteFill>
  );
};
