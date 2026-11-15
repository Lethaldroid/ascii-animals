import { SHARED_TUNING, type Animal } from "../flock";
import { ink, INK_DARK, type RGB } from "../ink";
import { createMover, move, startle, type MovingCreature } from "./movement";
import { inEllipse, spotted, toSegment } from "./shapes";

const OLIVE: RGB = [134, 154, 79];
const RIDGE: RGB = [86, 110, 54];
const WATER: RGB = [105, 164, 142];

export const crocodiles: Animal<MovingCreature> = {
  key: "crocodiles",
  label: "Crocodile",
  swatch: OLIVE,
  defaults: { ...SHARED_TUNING, direction: 2, detail: 1.7, fog: 0.42, trail: 0.85 },
  controls: [],
  area: 115000,
  scale: 1.35,
  speed: 39,
  trail: { light: [95, 148, 134], dark: WATER },
  create: createMover,
  startle,
  update(c, flock, dt) {
    const speed = move(c, flock, dt, 1, 0.08 * Math.sin(c.phase));
    c.phase += dt * speed / (c.span * 0.13);
  },
  draw(c, pen, flock) {
    if (flock.time < c.startledUntil) {
      pen.shed(c.x, c.y, 0.32 * c.depth);
      pen.dot(c.x, c.y, "~", WATER, c.depth);
      return;
    }
    pen.shape(c, 0.65, (u, v) => {
      if (inEllipse(u, v, 0.22, 0, 0.18, 0.047) ||
          inEllipse(u, v, 0.12, 0, 0.105, 0.076)) {
        if (Math.abs(u - 0.15) < 0.028 && Math.abs(Math.abs(v) - 0.047) < 0.02) {
          return ink(pen.ink, 235, 215, 110, undefined, "•");
        }
        return ink(pen.ink, ...OLIVE);
      }
      if (inEllipse(u, v, -0.08, 0, 0.21, 0.088)) {
        return spotted(u, v, 0.05, 0.015, c.id) ? ink(pen.ink, ...RIDGE, INK_DARK, "^") : ink(pen.ink, ...OLIVE);
      }
      const tail = (-u - 0.16) / 0.42;
      if (tail >= 0 && tail < 1 && Math.abs(v - 0.105 * tail * Math.sin(c.phase - 4 * tail)) < 0.065 * (1 - tail)) {
        return ink(pen.ink, ...RIDGE);
      }
      const av = Math.abs(v);
      return (toSegment(u, av, 0.04, 0.04, 0.12, 0.16) < 0.023 ||
        toSegment(u, av, -0.17, 0.04, -0.27, 0.16) < 0.025) && ink(pen.ink, ...RIDGE);
    });
    pen.shed(c.x, c.y, 0.18 * c.depth);
  },
};
