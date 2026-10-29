// Three separate text layers: VO subtitles (bottom), labels (top), title card (S1), plus the end card.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { CAPTION_RULES, theme } from "../theme";
import type { CaptionPage, LabelCue, TextSegment, Timeline } from "../types";
import { DISPLAY } from "../finance";

const FONT = theme.fonts.caption;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Frame at which a word turns active (same rule as alignScenes)
const activeFrom = (t: number, fps: number) => Math.ceil((t - CAPTION_RULES.preRollSec) * fps);

const safeBox = (width: number) => ({
  left: width * theme.safe.left,
  width: width * (1 - theme.safe.left - theme.safe.right),
});

// ---------- 1. VO subtitles ----------
export const Captions: React.FC<{ tl: Timeline; frame: number }> = ({ tl, frame }) => {
  const { width, height, fps } = useVideoConfig();
  const page: CaptionPage | undefined = tl.pages.find((p) => frame >= p.showFrom && frame < p.showTo);
  if (!page) return null;
  let active = 0;
  page.words.forEach((w, k) => {
    if (frame >= activeFrom(w.start, fps)) active = k;
  });
  const pop = interpolate(frame - page.showFrom, [0, 3], [0.94, 1], clamp);
  const box = safeBox(width);
  const c = theme.caption;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: box.left,
          width: box.width,
          bottom: height * (1 - c.bottomPct),
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          textAlign: "center",
          scale: pop,
          transformOrigin: "50% 100%",
        }}
      >
        <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: c.fontSize, lineHeight: 1.12, letterSpacing: -0.5 }}>
          {page.words.map((w, k) => (
            <span
              key={k}
              style={{
                color: k === active ? c.active : c.color,
                WebkitTextStroke: `${c.stroke}px ${c.strokeColor}`,
                paintOrder: "stroke fill",
                textShadow: "0 6px 14px rgba(0,0,0,0.35)",
                marginRight: k < page.words.length - 1 ? "0.26em" : 0,
                display: "inline-block",
              }}
            >
              {w.text}
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 2. Labels (top chips) ----------
const Segments: React.FC<{ segs: TextSegment[] }> = ({ segs }) => (
  <>
    {segs.map((s, k) => (
      <span key={k} style={{ color: s.highlight ? theme.label.key : theme.label.text }}>
        {s.text}
      </span>
    ))}
  </>
);

// Numbers in chips are rendered from finance.ts, never typed by hand
const NUMBER_MAP: Record<string, string> = {
  "12 juta": DISPLAY.loan,
  "1%": DISPLAY.flatMonthly,
  "12%": DISPLAY.flatYearly,
  "1 juta": DISPLAY.principalMonthly,
  "120 ribu": DISPLAY.interestMonthly,
  "sekitar 21%": DISPLAY.effectiveYearly,
  "2x lipat": DISPLAY.ratio,
};
const withFinance = (segs: TextSegment[]): TextSegment[] =>
  segs.map((s) => {
    let t = s.text;
    for (const [k, v] of Object.entries(NUMBER_MAP)) t = t.split(k).join(v);
    return { ...s, text: t };
  });

export const Labels: React.FC<{ tl: Timeline; frame: number }> = ({ tl, frame }) => {
  const { width, height, fps } = useVideoConfig();
  const cue: LabelCue | undefined = tl.labels.find((l) => frame >= l.fromFrame && frame < l.toFrame);
  if (!cue) return null;
  const inT = spring({ frame: frame - cue.fromFrame, fps, config: { damping: 14, stiffness: 200, mass: 0.6 } });
  const outT = interpolate(frame, [cue.toFrame - 5, cue.toFrame - 1], [1, 0], clamp);
  const box = safeBox(width);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: box.left, width: box.width, top: height * theme.label.topPct, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: theme.label.fontSize,
            lineHeight: 1.15,
            color: theme.label.text,
            background: theme.label.bg,
            borderRadius: 26,
            padding: "18px 34px 20px",
            maxWidth: box.width,
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0,0,0,0.28)",
            opacity: Math.min(1, inT * 1.4) * outT,
            translate: `0px ${interpolate(inT, [0, 1], [-30, 0])}px`,
            scale: interpolate(inT, [0, 1], [0.9, 1]),
          }}
        >
          <Segments segs={withFinance(cue.segments)} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 3. Title card (S1, from frame 0) ----------
export const TitleCard: React.FC<{ tl: Timeline; frame: number }> = ({ tl, frame }) => {
  const { width, height } = useVideoConfig();
  const s1 = tl.scenes[0];
  if (frame >= s1.toFrame) return null;
  const out = interpolate(frame, [s1.toFrame - 6, s1.toFrame - 1], [1, 0], clamp);
  const t = theme.titleCard;
  const box = safeBox(width);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height * t.bandTopPct,
          height: height * t.bandHeightPct,
          background: "linear-gradient(180deg, rgba(14,16,22,0) 0%, rgba(14,16,22,0.82) 22%, rgba(14,16,22,0.88) 78%, rgba(14,16,22,0) 100%)",
          opacity: out,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: box.left,
          width: box.width,
          top: height * (t.bandTopPct + 0.018),
          textAlign: "center",
          fontFamily: theme.fonts.display,
          fontWeight: 800,
          opacity: out,
          lineHeight: 1.0,
        }}
      >
        <div style={{ color: "#FFFFFF", fontSize: t.line1Size, textShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>{tl.title.line1}</div>
        <div style={{ color: theme.colors.accentYellow, fontSize: t.line2Size, marginTop: 6, textShadow: "0 5px 16px rgba(0,0,0,0.45)", letterSpacing: 1 }}>{tl.title.line2}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- End card ----------
export const EndCard: React.FC<{ frame: number; at: number }> = ({ frame, at }) => {
  const { width, height, fps } = useVideoConfig();
  if (frame < at) return null;
  const drop = spring({ frame: frame - at, fps, config: { damping: 9, stiffness: 160, mass: 0.8 } });
  const [first, ...rest] = theme.channelName.split(" ");
  const box = safeBox(width);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: box.left,
          width: box.width,
          top: height * 0.3,
          textAlign: "center",
          fontFamily: theme.fonts.display,
          fontWeight: 800,
          fontSize: 168,
          lineHeight: 0.95,
          translate: `0px ${interpolate(drop, [0, 1], [-height * 0.45, 0])}px`,
          scale: interpolate(drop, [0, 1], [0.8, 1]),
        }}
      >
        <div style={{ color: "#FFFFFF", WebkitTextStroke: `16px ${theme.colors.ink}`, paintOrder: "stroke fill", textShadow: "0 10px 30px rgba(0,0,0,0.45)" }}>{first}</div>
        <div style={{ color: theme.colors.accentYellow, WebkitTextStroke: `16px ${theme.colors.ink}`, paintOrder: "stroke fill", textShadow: "0 10px 30px rgba(0,0,0,0.45)" }}>{rest.join(" ")}</div>
      </div>
    </AbsoluteFill>
  );
};
