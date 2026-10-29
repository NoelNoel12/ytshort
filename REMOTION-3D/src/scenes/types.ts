import type React from "react";
import type { MoodName } from "../world/Lighting";
import type { CamShot, V3 } from "../world/CameraRig";

export type SceneCtx = {
  frame: number; // absolute frame
  from: number;
  to: number;
  dur: number;
};

export type Transition = "whip" | "cut" | "flyby";

export type SceneDef = {
  id: string;
  mood: MoodName;
  focus: V3; // shadow camera centre (fixed for the whole scene)
  shadowSize?: number;
  camera: (ctx: SceneCtx) => CamShot;
  Set: React.FC<{ ctx: SceneCtx }>;
  // How this scene hands over to the next one
  out?: Transition;
  whipDir?: 1 | -1;
};
