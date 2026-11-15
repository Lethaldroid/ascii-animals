import { SHARED_TUNING, type Animal } from "../flock";
import { ink, INK_SHIMMER, type RGB } from "../ink";
import { createMover, move, startle, type MovingCreature } from "./movement";
import { inEllipse, spotted } from "./shapes";

const BLUE: RGB = [91, 164, 213];
const PALE: RGB = [151, 219, 239];

export const stingrays: Animal<MovingCreature> = {
  key: "stingrays",
  label: "Stingray",
  swatch: BLUE,
  defaults: { ...SHARED_TUNING, direction: 19, fog: 0.48, trail: 0.48 },
  controls: [],
  area: 96000,
  scale: 1.12,
  speed: 53,
  trail: { light: [118, 153, 190], dark: BLUE },
  create: createMover,
  startle,
  update(c, flock, dt) {
    move(c, flock, dt, 1, 0.17 * Math.sin(c.phase * 0.4));
    c.phase += dt * 4;
  },
  draw(c, pen, flock) {
    const alarm = flock.time < c.startledUntil;
    const wing = 0.41 + 0.07 * Math.sin(c.phase);
    const tailV = 0.095 * Math.sin(c.phase - 1);
    pen.lineBody(c, -0.19, 0, -0.4, tailV * 0.45, BLUE);
    pen.lineBody(c, -0.4, tailV * 0.45, -0.59, tailV, BLUE);
    pen.shape(c, 0.58, (u, v) => {
      const width = wing * (alarm ? (v > 0 ? 0.64 : 1.05) : 1);
      const across = Math.abs(v) / width;
      const front = 0.24 - 0.28 * across;
      const back = -0.25 + 0.21 * across + 0.045 * across * Math.sin(c.phase - across * 4);
      if (across > 1 || u > front || u < back) return false;
      if (inEllipse(u, Math.abs(v), 0.14, 0.045, 0.02, 0.02) || spotted(u, v, 0.09, 0.011, c.id)) {
        return ink(pen.ink, ...PALE);
      }
      return ink(pen.ink, ...BLUE, INK_SHIMMER);
    });
  },
};
