// S9 CTA: FLAT turns into the answer card, comment balloons fill the sky, long pull-back to the end card.
import React from "react";
import { cue, wordFrame } from "../../timeline";
import type { SceneDef } from "../types";
import { Board } from "../../world/props/boards";
import { BOARD_STYLE } from "../../world/props/styles";
import { AnswerCard, CommentBubble } from "../../world/props/misc";
import { Jar } from "../../world/props/money";
import { Sparkle } from "../../world/props/desk";
import { PakDodi } from "../../world/characters/PakDodi";
import { Tuti } from "../../world/characters/Tuti";
import { exprAt, poseAt } from "../../world/characters/rig";
import { VIS } from "../../finance";
import { EASE, keys1, keys3, peck, pop, ramp, sp, squash } from "../../anim";

const T = {
  answer: cue("S9", 0), // [jawabannya]
  you: cue("S9", 1), // [kamu yang pilih]
  noel: cue("S9", 2), // [Noel Menjawab]
  bunga: wordFrame("S9", "bunga"),
  utang: wordFrame("S9", "utang", 0),
  bukan: wordFrame("S9", "bukan"),
};
const SPIN = 20;
const BALLOONS: { p: [number, number, number]; icon: "dots" | "heart" | "?"; color: string }[] = [
  { p: [-2.3, 3.7, -0.8], icon: "?", color: "#FFFFFF" },
  { p: [2.0, 4.3, -1.2], icon: "heart", color: "#FFF4D6" },
  { p: [-0.5, 5.2, -1.8], icon: "dots", color: "#FFFFFF" },
  { p: [2.9, 3.0, -0.2], icon: "?", color: "#E8F4FF" },
  { p: [-3.0, 5.1, -2.4], icon: "dots", color: "#FFF4D6" },
  { p: [0.9, 6.2, -2.8], icon: "heart", color: "#FFFFFF" },
];

const Set: SceneDef["Set"] = ({ ctx }) => {
  const f = ctx.frame;
  // FLAT board spins and becomes the answer card halfway through the turn
  const spin = ramp(f, T.answer, T.answer + SPIN, EASE.inOut) * Math.PI * 2;
  const isCard = f >= T.answer + SPIN / 2;
  const check = sp(f, T.answer + SPIN, "bouncy");
  const jars = pop(f, T.bunga + 2, "bouncy");
  const fullBounce = squash(f, T.utang + 2, 0.7);
  const halfDim = f >= T.bukan ? 1 : 0;
  const pose = poseAt(f, [
    [ctx.from, "idle"],
    [T.answer + SPIN, "thumbsUp", 8],
    [T.utang - 4, "pointLeft", 8],
    [T.bukan, "point", 8],
    [T.you, "pointViewer", 8],
    [T.noel - 6, "cheer", 8],
  ]);
  const expr = exprAt(f, [
    [ctx.from, "neutral"],
    [T.answer + SPIN, "proud"],
    [T.utang, "neutral"],
    [T.you, "excited"],
    [T.noel, "happy"],
  ]);
  return (
    <group>
      <group position={[0, 0.06, 0.2]}>
        <mesh position={[0, 0.6, -0.06]}>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#7A5232" roughness={0.7} />
        </mesh>
        <group position={[0, 1.75, 0]} rotation={[0, spin, 0]}>
          {!isCard ? (
            <Board position={[0, -0.4, 0]} w={1.5} h={0.8} posts={0} text={{ key: "flat", text: "FLAT", ...BOARD_STYLE.flat }} />
          ) : (
            <AnswerCard check={check} />
          )}
        </group>
        {[0, 1, 2, 3].map((k) => (
          <Sparkle key={k} position={[-0.9 + k * 0.6, 2.5 + (k % 2) * 0.25, 0.2]} s={f > T.answer + SPIN ? Math.max(0, Math.sin(((f - T.answer - SPIN - k * 5) / 16) * Math.PI)) : 0} />
        ))}
      </group>
      {/* Initial debt (what flat counts) vs remaining debt */}
      {f >= T.bunga + 2 && (
        <>
          <group position={[-0.92, 0.06, 1.95]} scale={[jars * fullBounce[0] * 0.66, jars * fullBounce[1] * 0.66, jars * fullBounce[0] * 0.66]}>
            <Jar fill={1} />
          </group>
          <group position={[0.92, 0.06, 1.95]} scale={jars * 0.66}>
            <Jar fill={VIS.jarFill(6)} />
          </group>
          <Sparkle position={[-0.92, 1.2, 2.2]} s={f > T.utang ? Math.max(0, Math.sin(((f - T.utang) / 18) * Math.PI)) * 1.2 : 0} />
        </>
      )}
      {/* Comment balloons appear one after another */}
      {BALLOONS.map((b, k) => {
        const s = pop(f, T.you + k * 4, "bouncy");
        if (s < 0.01) return null;
        return <CommentBubble key={k} position={[b.p[0], b.p[1] + Math.sin(f / 14 + k) * 0.08, b.p[2]]} scale={s * 0.8} icon={b.icon} color={b.color} />;
      })}
      <PakDodi frame={f} position={[-1.1, 0.06, 0.85]} rotY={keys1(f, [[ctx.from, 0.35], [T.utang - 4, 0.6], [T.bukan, -0.3], [T.you, 0.15]])} pose={pose} expr={expr} />
      <Tuti frame={f} position={[0.35, 0.06, 2.75]} rotY={keys1(f, [[ctx.from, -0.5], [T.you, -0.15]])} scale={1.1} sunglasses peck={Math.max(peck(f, ctx.from + 16), peck(f, T.answer + SPIN + 4))} flap={f >= T.you && f < T.you + 16 ? 1 : 0} />
    </group>
  );
};

export const S9: SceneDef = {
  id: "S9",
  mood: "golden",
  focus: [0, 0, 0.8],
  shadowSize: 9,
  camera: ({ frame: f, from, to }) => {
    // Move 1: orbit around the answer card. Move 2: long pull-back up into the sky.
    if (f < T.you) {
      const pos = keys3(f, [
        [from, [1.4, 2.1, 6.0]],
        [T.answer + SPIN, [0.8, 2.2, 5.6]],
        [T.bunga, [0.4, 2.5, 8.6]],
        [T.you, [-0.3, 2.5, 8.3]],
      ]);
      const target = keys3(f, [
        [from, [0, 1.5, 0.3]],
        [T.answer + SPIN, [0, 1.6, 0.3]],
        [T.bunga, [0, 1.3, 0.6]],
        [T.you, [0, 1.6, 0.4]],
      ]);
      return { pos, target, fov: 42 };
    }
    const pos = keys3(f, [
      [T.you, [-0.3, 2.5, 8.3]],
      [T.noel, [0.2, 3.8, 11.0]],
      [to, [0.4, 7.5, 17.0]],
    ], EASE.inOut);
    const target = keys3(f, [
      [T.you, [0, 1.6, 0.4]],
      [T.noel, [0, 3.0, -0.5]],
      [to, [0, 4.6, -3]],
    ], EASE.inOut);
    return { pos, target, fov: 42 };
  },
  Set,
};
