import { SHARED_TUNING, type Animal } from "../flock";
import { ink, INK_DARK, type RGB } from "../ink";
import { createMover, move, startle, type MovingCreature } from "./movement";
import { inEllipse } from "./shapes";

const CREAM: RGB = [242, 229, 201];
const BILL: RGB = [231, 167, 83];

export const pelicans: Animal<MovingCreature> = {
  key: "pelicans",
  label: "Pelican",
  swatch: CREAM,
  defaults: { ...SHARED_TUNING, direction: 9, fog: 0.4, trail: 0.28 },
  controls: [],
  area: 115000,
  scale: 1.25,
  speed: 73,
  trail: { light: [157, 159, 164], dark: [162, 154, 141] },
  create: createMover,
  startle,
  update(c, flock, dt) {
    move(c, flock, dt, 1 + 0.12 * Math.sin(flock.time + c.id));
    c.phase += dt * (flock.time < c.startledUntil ? 11 : 6);
  },
  draw(c, pen, flock) {
    const alarm = flock.time < c.startledUntil;
    const glide = !alarm && Math.sin(flock.time * 0.85 + c.id) < 0;
    const span = glide ? 0.51 : 0.32 + 0.18 * Math.cos(c.phase);
    pen.shape(c, 0.62, (u, v) => {
      if (inEllipse(u, v, 0.28, 0.018, 0.15, 0.057)) {
        return ink(pen.ink, ...BILL, undefined, v < 0 ? "-" : null);
      }
      if (inEllipse(u, v, 0.1, 0, 0.105, 0.08) ||
          inEllipse(u, v, -0.1, 0, 0.18, 0.09)) return ink(pen.ink, ...CREAM);
      const across = Math.abs(v) / span;
      const swept = -0.025 - 0.21 * across ** 2;
      if (across < 1 && Math.abs(u - swept) < 0.135 * Math.sqrt(1 - across)) {
        return across > 0.75 ? ink(pen.ink, 129, 121, 114, INK_DARK) : ink(pen.ink, ...CREAM);
      }
      return false;
    });
  },
};
