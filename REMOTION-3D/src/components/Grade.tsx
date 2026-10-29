import React from "react";
import { AbsoluteFill } from "remotion";
import type { MoodName } from "../world/Lighting";
import { theme } from "../theme";

// Light grade on top of the 3D: warm tint and a soft vignette. Static, so it never flickers.
const TINT: Record<MoodName, string> = {
  morning: "rgba(255,214,160,0.05)",
  dim: "rgba(120,135,160,0.08)",
  warm: "rgba(255,200,140,0.07)",
  golden: "rgba(255,170,90,0.10)",
};

export const Grade: React.FC<{ mood: MoodName }> = ({ mood }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ backgroundColor: TINT[mood], mixBlendMode: "soft-light" }} />
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 85% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,14,8,${theme.grade.vignette}) 100%)`,
      }}
    />
  </AbsoluteFill>
);
