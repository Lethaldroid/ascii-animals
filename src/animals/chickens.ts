import { SHARED_TUNING, type Animal } from "../flock";
import { ink, type RGB } from "../ink";
import { createMover, move, startle, type MovingCreature } from "./movement";
import { inEllipse } from "./shapes";

const FEATHERS: RGB = [225, 178, 128];
const COMB: RGB = [233, 69, 69];
const FEET: RGB = [239, 171, 71];

export const chickens: Animal<MovingCreature> = {
  key: "chickens",
  label: "Chicken",
  swatch: COMB,
  defaults: { ...SHARED_TUNING, direction: 0, detail: 1.8, fog: 0.36, trail: 0.25 },
  controls: [],
  area: 78000,
  scale: 0.9,
  speed: 49,
  trail: { light: [151, 111, 71], dark: [165, 133, 91] },
  create: createMover,
  startle,
  update(c, flock, dt) {
    const pecking = Math.sin(flock.time * 0.95 + c.id) < -0.64;
    const speed = move(c, flock, dt, pecking ? 0 : 1, 0, 2.8);
    c.phase += dt * speed / (c.span * 0.07);
  },
  draw(c, pen, flock) {
    const pose = { ...c, heading: 0 };
    const side = Math.cos(c.heading) < 0 ? -1 : 1;
    const alarm = flock.time < c.startledUntil;
    const pecking = !alarm && Math.sin(flock.time * 0.95 + c.id) < -0.64;
    const dip = pecking ? 0.35 * Math.max(0, Math.sin(flock.time * 12 + c.id)) : 0;
    const headX = 0.23 + 0.025 * Math.sin(c.phase) + dip * 0.22;
    const headY = -0.22 + dip;
    for (const leg of [-1, 1]) {
      const step = Math.sin(c.phase) * leg;
      const footX = leg * 0.045 + step * 0.09;
      const footY = 0.33 - 0.07 * Math.max(0, step);
      pen.lineBody(pose, leg * 0.05 * side, 0.08, footX * side, footY, FEET);
      pen.lineBody(pose, footX * side, footY, (footX + 0.07) * side, footY, FEET);
    }
    const wingY = alarm ? -0.045 + 0.13 * Math.sin(c.phase * 1.6) : 0.01;
    pen.shape(pose, 0.55, (u, v) => {
      const x = u * side;
      if (inEllipse(x, v, headX + 0.085, headY + 0.015, 0.045, 0.029)) return ink(pen.ink, ...FEET);
      if (inEllipse(x, v, headX - 0.01, headY - 0.084, 0.056, 0.03) ||
          inEllipse(x, v, headX + 0.03, headY + 0.076, 0.03, 0.033)) return ink(pen.ink, ...COMB);
      if (inEllipse(x, v, headX, headY, 0.087, 0.085) ||
          inEllipse(x, v, (headX + 0.15) / 2, headY / 2, 0.097, 0.13)) return ink(pen.ink, 249, 201, 142);
      if (inEllipse(x, v, -0.06, wingY, alarm ? 0.22 : 0.14, 0.077)) return ink(pen.ink, 167, 101, 70);
      if (inEllipse(x, v, -0.025, 0, 0.237, 0.155)) return ink(pen.ink, ...FEATHERS);
      const fan = v + 0.14 - 0.56 * (x + 0.29);
      return inEllipse(x, fan, -0.29, 0, 0.18, 0.092) && ink(pen.ink, 166, 114, 88);
    });
  },
};
