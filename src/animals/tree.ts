import { hash3 } from "../math";
import type { Theme } from "../renderer";

/** Coordinates shared by the painted branches and the animals perched on them. */
export const PERCHES = [
  { x: 0.15, y: 0.41 },
  { x: 0.29, y: 0.28 },
  { x: 0.39, y: 0.37 },
  { x: 0.11, y: 0.29 },
  { x: 0.46, y: 0.5 },
] as const;

const JOINT = { x: 0.235, y: 0.53 };
const TRUNK = { x: 0.21, y: 0.81 };

export function paintTree(ctx: CanvasRenderingContext2D, width: number, height: number, theme: Theme, flowering: boolean) {
  const dark = theme === "dark";
  const unit = Math.min(width, height);
  const leaves = dark ? ["#213b32", "#233f34", "#30483a"] : ["#809968", "#92a877", "#a9ba81"];

  // Leaves leave gaps around the exposed branch tips.
  for (let i = 0; i < 27; i++) {
    const x = (0.085 + 0.325 * hash3(i, 8, 4)) * width;
    const y = (0.17 + 0.19 * hash3(i, 8, 5)) * height;
    const radius = (0.022 + 0.05 * hash3(i, 8, 6)) * unit;
    ctx.fillStyle = leaves[i % leaves.length];
    ctx.beginPath();
    ctx.ellipse(x, y, radius, radius * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = dark ? "#65503a" : "#786044";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(4, unit * 0.024);
  ctx.beginPath();
  ctx.moveTo(TRUNK.x * width, TRUNK.y * height);
  ctx.quadraticCurveTo(0.208 * width, 0.62 * height, JOINT.x * width, JOINT.y * height);
  ctx.stroke();

  PERCHES.forEach((tip, i) => {
    const x = tip.x * width;
    const y = tip.y * height;
    ctx.beginPath();
    ctx.lineWidth = Math.max(1.5, unit * 0.008);
    ctx.moveTo(JOINT.x * width, JOINT.y * height);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (flowering) {
      ctx.fillStyle = dark ? "#cf7b9e" : "#ab4c73";
      ctx.font = `${Math.max(12, unit * 0.022)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(i % 2 ? "*" : "✿", x, y - 5);
    }
  });
}
