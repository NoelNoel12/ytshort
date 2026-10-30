// Generic Short: one persistent 3D canvas, VO, optional sound effects, and the text layers.
import React from "react";
import { ThreeCanvas } from "@remotion/three";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { FontGate } from "../fonts";
import { Grade } from "../components/Grade";
import { Captions, EndCard, Labels, TitleCard, type TextStyle } from "../components/TextLayers";
import { SceneWorld, activeScene, whipAmount, type PerfFlags } from "../scenes/SceneWorld";
import type { SceneDef } from "../scenes/types";
import type { Timeline } from "../types";
import type { SfxCue } from "../sfx/types";

export type ShortProps = { hideText?: boolean; lockCamera?: number | null; freezeAt?: number | null; perf?: PerfFlags; dpr?: number; muteSfx?: boolean };

type Config = {
  tl: Timeline;
  scenes: SceneDef[];
  endCardAt: number;
  textStyle?: TextStyle;
  sfx?: SfxCue[];
  world?: React.ReactNode;
  // Caption position per page (fraction of height for the caption block bottom), from captionPlacement
  captionBottoms?: number[];
};

export const ShortVideo: React.FC<ShortProps & Config> = ({ tl, scenes, endCardAt, textStyle = "chips", sfx = [], world, captionBottoms, hideText = false, lockCamera = null, freezeAt = null, perf = {}, dpr = 1, muteSfx = false }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const { def } = activeScene(scenes, frame, tl);
  const whip = Math.abs(whipAmount(scenes, frame, tl));
  return (
    <AbsoluteFill style={{ backgroundColor: "#cfe8f6" }}>
      <Audio src={staticFile(tl.audio)} />
      {!muteSfx &&
        sfx.map((c, k) => (
          <Sequence key={k} from={c.at} durationInFrames={c.durationInFrames} layout="none" name={`sfx ${c.name}`}>
            <Audio src={staticFile(`sfx/${c.name}.wav`)} volume={c.volume} />
          </Sequence>
        ))}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="whipblur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={`${(whip * 34).toFixed(2)} ${(whip * 3).toFixed(2)}`} />
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: whip > 0.02 ? "url(#whipblur)" : undefined }}>
        <ThreeCanvas width={width} height={height} dpr={dpr} shadows={perf.noShadows ? false : "percentage"} gl={{ antialias: !perf.noAA }}>
          <FontGate>
            <SceneWorld tl={tl} scenes={scenes} frame={frame} lockCamera={lockCamera} freezeAt={freezeAt} perf={perf} world={world} />
          </FontGate>
        </ThreeCanvas>
      </AbsoluteFill>
      <Grade mood={def.mood} />
      {!hideText && (
        <>
          <TitleCard tl={tl} frame={frame} textStyle={textStyle} />
          <Labels tl={tl} frame={frame} textStyle={textStyle} />
          <Captions tl={tl} frame={frame} bottoms={captionBottoms} />
          <EndCard frame={frame} at={endCardAt} />
        </>
      )}
    </AbsoluteFill>
  );
};
