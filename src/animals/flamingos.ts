import { SHARED_TUNING, type Animal } from "../flock";
import { ink, INK_DARK, type RGB } from "../ink";
import { clamp, hash3, TAU } from "../math";
import type { Pen } from "../renderer";
import { createMover, move, startle, type MovingCreature } from "./movement";
import { inEllipse, toSegment } from "./shapes";

const PINK: RGB = [252, 125, 158];
const FEATHERS: RGB = [216, 69, 115];
const LEGS: RGB = [240, 117, 141];

const WATERLINE = 0.58;
const FOOT_LIFT = 0.46;
const WAKE: RGB = [75, 145, 158];

function drawWater(pen: Pen, width: number, height: number, time: number) {
  const columns = Math.ceil(width / 40);
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < columns; col++) {
      const seed = hash3(col, row, 19);
      if (seed < 0.48) continue;
      const x = (col + hash3(col, row, 27)) * width / columns + Math.sin(time * 0.7 + seed * TAU) * 6;
      const y = height * (WATERLINE + 0.04 + (row + seed) * 0.041);
      const fog = 0.45 + 0.27 * Math.sin(time * 1.1 + seed * TAU);
      pen.dot(x, y, row % 2 ? "~" : "-", WAKE, 1, fog);
    }
  }
}
export const flamingos: Animal<MovingCreature> = {
  key: "flamingos",
  label: "Flamingo",
  swatch: PINK,
  defaults: { ...SHARED_TUNING, direction: 0, sway: 0, spread: 0.05, detail: 1.8, fog: 0.38, trail: 0.6 },
  controls: [],
  area: 100000,
  scale: 1.05,
  speed: 27,
  trail: { light: [117, 156, 171], dark: [91, 135, 157] },
  create: createMover,
  startle,
  paintBackdrop(ctx, width, height, theme) {
    const shore = height * WATERLINE;
    const gradient = ctx.createLinearGradient(0, shore - 18, 0, height);
    gradient.addColorStop(0, theme === "dark" ? "#06070c" : "#f6f3ec");
    gradient.addColorStop(0.13, theme === "dark" ? "#0a202b" : "#dcecea");
    gradient.addColorStop(1, theme === "dark" ? "#102f3b" : "#a4d2d1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, shore - 18, width, height - shore + 18);
  },
  enter(c, flock) {
    const lane = clamp(c.y / flock.height, 0, 1);
    c.y = flock.height * (0.68 + lane * 0.23) - c.span * FOOT_LIFT;
    c.vy = 0;
  },
  update(c, flock, dt) {
    const resting = Math.sin(flock.time * 0.6 + c.id) < -0.65;
    const speed = move(c, flock, dt, resting ? 0 : 1, 0, 2.3);
    const foot = c.span * FOOT_LIFT;
    const y = clamp(c.y, flock.height * 0.66 - foot, flock.height * 0.94 - foot);
    if (y !== c.y) c.vy = 0;
    c.y = y;
    c.phase += dt * speed / (c.span * 0.1);
  },
  drawAll(flock, pen) {
    drawWater(pen, flock.width, flock.height, flock.time);
    for (const c of flock.creatures) {
      drawFlamingo(c, pen, flock.time);
    }
  },
};

function drawFlamingo(c: MovingCreature, pen: Pen, time: number) {
  const pose = { ...c, heading: 0 };
  const side = Math.cos(c.heading) < 0 ? -1 : 1;
  const alarm = time < c.startledUntil;
  const resting = !alarm && Math.sin(time * 0.6 + c.id) < -0.65;
  const headY = alarm ? -0.46 : -0.37;
  for (const leg of [-1, 1]) {
    const step = resting ? 0 : Math.sin(c.phase) * leg;
    const kneeX = -0.07 + step * 0.05;
    const footX = step * 0.11;
    const footY = resting && leg === 1 ? 0.19 : FOOT_LIFT - Math.max(0, step) * 0.12;
    pen.lineBody(pose, 0, 0.05, kneeX * side, 0.24, LEGS);
    pen.lineBody(pose, kneeX * side, 0.24, footX * side, footY, LEGS);
    if (footY > 0.41) {
      const x = c.x + footX * side * c.span;
      const y = c.y + footY * c.span;
      const ripple = pen.cw * (1.1 + Math.abs(Math.sin(c.phase)));
      pen.dot(x - ripple, y, "~", WAKE, c.depth);
      pen.dot(x + ripple, y + pen.ch * 0.35, "~", WAKE, c.depth);
      if (!resting) pen.shed(x, y, alarm ? 0.5 : 0.18);
    }
  }
  pen.shape(pose, 0.52, (u, v) => {
    const x = u * side;
    if (inEllipse(x, v, -0.1, 0, 0.22, 0.12)) {
      return inEllipse(x, v, -0.15, 0.025, 0.15, 0.063) ? ink(pen.ink, ...FEATHERS) : ink(pen.ink, ...PINK);
    }
    if (inEllipse(x, v, 0.23, headY, 0.062, 0.05)) return ink(pen.ink, ...PINK);
    if (toSegment(x, v, 0.26, headY, 0.34, headY + 0.058) < 0.027) {
      return x > 0.315 ? ink(pen.ink, 62, 43, 64, INK_DARK) : ink(pen.ink, 255, 190, 190);
    }
    const neckX = 0.08 - Math.sin(Math.PI * (v / headY)) * 0.095 + (v / headY) ** 2 * 0.145;
    return v <= 0 && v >= headY && Math.abs(x - neckX) < 0.034 && ink(pen.ink, ...PINK);
  });
}
