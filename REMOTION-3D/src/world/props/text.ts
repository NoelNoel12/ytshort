// Canvas text textures for signs and screens. Draw only after FontGate (fonts loaded).
import { cachedTexture } from "../textures";

export type TextSpec = {
  text: string;
  w?: number;
  h?: number;
  bg?: string | null;
  fg?: string;
  font?: string; // family
  weight?: number;
  size?: number; // px, auto-shrinks to fit
  border?: string | null;
  radius?: number;
  sub?: string; // optional second line
  subFg?: string;
  stroke?: string | null;
  glow?: string | null;
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

export const textTexture = (key: string, spec: TextSpec) => {
  const { text, w = 1024, h = 512, bg = null, fg = "#2B1B10", font = "Baloo 2", weight = 800, size = 300, border = null, radius = 48, sub, subFg, stroke = null, glow = null } = spec;
  return cachedTexture(`text:${key}`, w, h, (ctx) => {
    ctx.clearRect(0, 0, w, h);
    if (bg) {
      ctx.fillStyle = bg;
      roundRect(ctx, 0, 0, w, h, radius);
      ctx.fill();
    }
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = Math.round(h * 0.05);
      roundRect(ctx, ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2, radius * 0.7);
      ctx.stroke();
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let fs = size;
    const fit = () => {
      ctx.font = `${weight} ${fs}px "${font}"`;
      return ctx.measureText(text).width;
    };
    while (fit() > w * 0.86 && fs > 20) fs -= 4;
    const cy = sub ? h * 0.42 : h * 0.54;
    if (glow) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = fs * 0.25;
    }
    if (stroke) {
      ctx.lineWidth = fs * 0.12;
      ctx.strokeStyle = stroke;
      ctx.lineJoin = "round";
      ctx.strokeText(text, w / 2, cy);
    }
    ctx.fillStyle = fg;
    ctx.fillText(text, w / 2, cy);
    ctx.shadowBlur = 0;
    if (sub) {
      let ss = fs * 0.42;
      ctx.font = `${weight} ${ss}px "${font}"`;
      while (ctx.measureText(sub).width > w * 0.86 && ss > 16) {
        ss -= 2;
        ctx.font = `${weight} ${ss}px "${font}"`;
      }
      ctx.fillStyle = subFg ?? fg;
      ctx.fillText(sub, w / 2, h * 0.78);
    }
  });
};
