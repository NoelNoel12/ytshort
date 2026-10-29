// Central look and timing constants. Pure data, safe to import from Node scripts.

export const theme = {
  channelName: "Noel Menjawab",
  fps: 30,
  width: 1080,
  height: 1920,

  // Safe zones (fractions of the frame)
  safe: { bottom: 0.2, right: 0.12, top: 0.06, left: 0.05 },

  colors: {
    skyTop: "#5FB8F5",
    skyBottom: "#D6F1FF",
    skyEveningTop: "#F2A65A",
    skyEveningBottom: "#FFE2B8",
    grass: "#7CCB5B",
    grassDark: "#5DA844",
    asphalt: "#4B4F5A",
    soil: "#8A5A3C",
    soilLight: "#A9744F",
    concrete: "#C9C3B8",
    gold: "#F2B632",
    interestRed: "#D94B3F",
    accentYellow: "#FFD23F",
    vestOrange: "#FF8A3D",
    helmetYellow: "#FFC72C",
    wood: "#B07A4A",
    woodDark: "#7A5232",
    clayRoof: "#C8643B",
    wallCream: "#EFE3CC",
    glass: "#DDF3FF",
    ink: "#14161C",
    white: "#FFFFFF",
  },

  fonts: {
    caption: "'Plus Jakarta Sans', 'Baloo 2', sans-serif",
    display: "'Baloo 2', 'Plus Jakarta Sans', sans-serif",
  },

  caption: {
    bottomPct: 0.715, // bottom edge of the subtitle block; 1 or 2 lines stay inside 62 to 72 percent
    fontSize: 74,
    stroke: 14,
    color: "#FFFFFF",
    active: "#FFD23F",
    strokeColor: "#14161C",
  },

  label: {
    topPct: 0.15, // 14 to 22 percent zone
    fontSize: 54,
    bg: "rgba(20,22,28,0.86)",
    text: "#FFFFFF",
    key: "#FFD23F",
  },

  titleCard: {
    bandTopPct: 0.728, // dark band under the subtitles, above the bottom 20 percent as far as possible
    bandHeightPct: 0.13,
    line1Size: 64,
    line2Size: 96,
  },

  grade: {
    vignette: 0.32,
    warmth: 0.06,
  },
} as const;

// Caption and label timing rules (used by alignScenes and verifySync)
export const CAPTION_RULES = {
  maxWords: 4,
  maxChars: 24,
  pauseBreakSec: 0.2,
  preRollSec: 0.035, // max 40 ms early
  holdSec: 0.15, // max hold after the last word
  labelMaxSec: 2.5,
} as const;

export type Theme = typeof theme;
