import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { Audio } from "@remotion/media";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FontGate } from "../fonts";
import { Grade } from "../components/Grade";
import { Captions, EndCard, Labels, TitleCard } from "../components/TextLayers";
import { SceneWorld, activeScene, whipAmount, type PerfFlags } from "../scenes/SceneWorld";
import { SCENES_02 } from "../scenes/short02";
import { TL, cue } from "../timeline";

export const Short02: React.FC<{ hideText?: boolean; lockCamera?: number | null; freezeAt?: number | null; perf?: PerfFlags; dpr?: number }> = ({ hideText = false, lockCamera = null, freezeAt = null, perf = {}, dpr = 1 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { def } = activeScene(SCENES_02, frame);
  const whip = Math.abs(whipAmount(SCENES_02, frame));
  return (
    <AbsoluteFill style={{ backgroundColor: "#cfe8f6" }}>
      <Audio src={staticFile(TL.audio)} />
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="whipblur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${(whip * 34).toFixed(2)} ${(whip * 3).toFixed(2)}`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: whip > 0.02 ? "url(#whipblur)" : undefined }}>
        <ThreeCanvas width={width} height={height} dpr={dpr} shadows={perf.noShadows ? false : "percentage"} gl={{ antialias: !perf.noAA }}>
          <FontGate>
            <SceneWorld scenes={SCENES_02} frame={frame} lockCamera={lockCamera} freezeAt={freezeAt} perf={perf} />
          </FontGate>
        </ThreeCanvas>
      </AbsoluteFill>
      <Grade mood={def.mood} />
      {!hideText && (
        <>
          <TitleCard tl={TL} frame={frame} />
          <Labels tl={TL} frame={frame} />
          <Captions tl={TL} frame={frame} />
          <EndCard frame={frame} at={cue("S9", 2)} />
        </>
      )}
    </AbsoluteFill>
  );
};
