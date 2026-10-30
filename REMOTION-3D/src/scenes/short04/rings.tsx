// Ring streams: rings spawned at a fixed period travel along a Bezier path, then pass, bounce or fade.
import React from "react";
import { Ring } from "../../world/short04/Signal";
import { bez } from "./layout";

type V3 = [number, number, number];

export type RingStream = {
  from: V3;
  ctrl: V3;
  to: V3;
  start: number; // first spawn frame
  end: number; // no spawns after this
  every: number; // frames between spawns
  travel: number; // frames to reach the target
  r0: number;
  r1: number;
  // What happens at the target: bounce back, fade inside, or pass on
  mode: (spawn: number) => "bounce" | "fade" | "pass";
  color?: string;
};

export type RingState = { pos: V3; dir: V3; r: number; opacity: number; squash: number; key: string };

export const ringStates = (s: RingStream, f: number): RingState[] => {
  const out: RingState[] = [];
  for (let sp = s.start; sp <= Math.min(f, s.end); sp += s.every) {
    const age = f - sp;
    const t = age / s.travel;
    if (t < 0) continue;
    const mode = s.mode(sp);
    if (t <= 1) {
      const p = bez(s.from, s.ctrl, s.to, t);
      const p2 = bez(s.from, s.ctrl, s.to, Math.min(1, t + 0.02));
      out.push({ pos: p, dir: [p2[0] - p[0] + 1e-4, p2[1] - p[1], p2[2] - p[2]], r: s.r0 + (s.r1 - s.r0) * t, opacity: Math.min(1, t * 4), squash: 1, key: `${sp}` });
      continue;
    }
    const after = age - s.travel;
    const back: V3 = [s.ctrl[0] - s.to[0], s.ctrl[1] - s.to[1], s.ctrl[2] - s.to[2]];
    const len = Math.hypot(...back);
    const u: V3 = [back[0] / len, back[1] / len, back[2] / len];
    if (mode === "bounce" && after < 18) {
      // Rubber-ball bounce: squash on contact, then fly back and fade
      const k = after / 18;
      const d = 3.2 * k;
      out.push({ pos: [s.to[0] + u[0] * d, s.to[1] + u[1] * d + Math.sin(k * Math.PI) * 0.4, s.to[2] + u[2] * d], dir: u, r: s.r1 * (1 + 0.15 * k), opacity: 1 - k, squash: after < 4 ? 0.55 + after * 0.11 : 1, key: `${sp}` });
    } else if (mode === "fade" && after < 16) {
      const k = after / 16;
      const fwd: V3 = [-u[0], -u[1], -u[2]];
      out.push({ pos: [s.to[0] + fwd[0] * 0.6 * k, s.to[1] + fwd[1] * 0.6 * k, s.to[2] + fwd[2] * 0.6 * k], dir: fwd, r: s.r1 * (1 - 0.45 * k), opacity: (1 - k) * 0.7, squash: 1, key: `${sp}` });
    } else if (mode === "pass" && after < 10) {
      const k = after / 10;
      const fwd: V3 = [-u[0], -u[1], -u[2]];
      out.push({ pos: [s.to[0] + fwd[0] * 0.9 * k, s.to[1] + fwd[1] * 0.9 * k, s.to[2] + fwd[2] * 0.9 * k], dir: fwd, r: s.r1 * (1 + 0.2 * k), opacity: 1 - k, squash: 1, key: `${sp}` });
    }
  }
  return out;
};

export const Rings: React.FC<{ stream: RingStream; frame: number; tube?: number }> = ({ stream, frame, tube }) => (
  <>
    {ringStates(stream, frame).map((r) => (
      <group key={r.key} scale={[1, r.squash, 1]} position={r.pos}>
        <Ring position={[0, 0, 0]} dir={r.dir} radius={r.r} opacity={r.opacity} color={stream.color} tube={tube} />
      </group>
    ))}
  </>
);
