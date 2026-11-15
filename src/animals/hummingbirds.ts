import { SHARED_TUNING, type Animal, type Creature } from "../flock";
import { ink, INK_GLASS, INK_SHIMMER, type RGB } from "../ink";
import { clamp, rand, TAU } from "../math";
import { inEllipse } from "./shapes";
import { paintTree, PERCHES } from "./tree";

const GREEN: RGB = [68, 208, 146];
const THROAT: RGB = [254, 78, 142];
const BILL: RGB = [167, 213, 197];

interface Hummingbird extends Creature {
  perch: number;
  until: number;
  resting: boolean;
  settled: boolean;
  wingbeat: number;
  fleeX: number;
  fleeY: number;
}

export const hummingbirds: Animal<Hummingbird> = {
  key: "hummingbirds",
  label: "Hummingbird",
  swatch: GREEN,
  defaults: { ...SHARED_TUNING, detail: 1.85, fog: 0.32, trail: 0.18, density: 0.8 },
  hide: ["direction", "corner", "sway", "spread", "separation"],
  controls: [],
  area: 155000,
  max: PERCHES.length,
  scale: 0.75,
  speed: 110,
  trail: { light: [117, 157, 142], dark: [97, 173, 157] },
  paintBackdrop(ctx, width, height, theme) {
    paintTree(ctx, width, height, theme, true);
  },
  create(c) {
    return { ...c, perch: (c.id - 1) % PERCHES.length, until: 0, resting: false, settled: false, wingbeat: rand(0, TAU), fleeX: 0, fleeY: 0 };
  },
  enter(c, flock) {
    const perch = PERCHES[c.perch];
    c.x = perch.x * flock.width + c.span * 0.35;
    c.y = perch.y * flock.height - c.span * 0.21;
    c.vx = 0;
    c.vy = 0;
    c.heading = Math.PI;
    c.until = flock.time + rand(1, 3);
  },
  startle(c, dx, dy, strength, flock) {
    const lift = c.span * (0.35 + strength * 0.35);
    c.fleeX = clamp(c.x + dx * lift, 0, flock.width);
    c.fleeY = clamp(c.y + dy * lift - lift, 0, flock.height);
    c.startledUntil = flock.time + 0.55;
    c.resting = false;
    c.settled = false;
    c.until = flock.time + rand(1.5, 3);
  },
  update(c, flock, dt) {
    const t = flock.time;
    if (t >= c.until) {
      c.resting = !c.resting;
      if (!c.resting) c.perch = (c.perch + 1) % PERCHES.length;
      c.until = t + (c.resting ? rand(1.8, 3.8) : rand(2.2, 4.2));
    }
    const tip = PERCHES[c.perch];
    const fleeing = t < c.startledUntil;
    const side = tip.x < 0.22 ? -1 : 1;
    const hover = c.resting ? 0 : side * (0.43 + 0.14 * Math.sin(t * 3 + c.id));
    const targetX = fleeing ? c.fleeX : tip.x * flock.width + hover * c.span;
    const targetY = fleeing ? c.fleeY : tip.y * flock.height - c.span * (c.resting ? 0.11 : 0.22 + 0.11 * Math.sin(t * 3.6 + c.id));
    const dx = targetX - c.x;
    const dy = targetY - c.y;
    const distance = Math.hypot(dx, dy);
    c.settled = c.resting && distance < c.span * 0.07;
    const heading = Math.atan2(dy, dx);
    const speed = flock.cruise(c) * (fleeing ? 2.1 : 1.2);
    flock.begin();
    flock.steer(c, heading, Math.min(speed, distance * 6), flock.tuning.grip * 4);
    flock.move(c, dt, speed);
    const face = distance > c.span * 0.35 && !c.resting ? heading : side > 0 ? Math.PI : 0;
    flock.face(c, dt, 12, face);
    c.wingbeat += dt * 51;
  },
  draw(c, pen) {
    const spread = 0.17 + 0.22 * Math.abs(Math.sin(c.wingbeat));
    if (c.settled) {
      pen.line(c.x - c.span * 0.06, c.y + c.span * 0.03, c.x, c.y + c.span * 0.11, BILL, c.depth);
    }
    pen.lineBody(c, 0.18, 0, 0.42, -0.012, BILL);
    pen.shape(c, 0.47, (u, v) => {
      if (inEllipse(u, v, 0.131, 0, 0.102, 0.066) ||
          inEllipse(u, v, -0.017, 0.013, 0.166, 0.079)) {
        if (inEllipse(u, Math.abs(v), 0.14, 0.043, 0.075, 0.038)) return ink(pen.ink, ...THROAT, INK_SHIMMER);
        return ink(pen.ink, ...GREEN, INK_SHIMMER);
      }
      if (inEllipse(u, v - u * 0.16, -0.212, 0.036, 0.12, 0.033)) return ink(pen.ink, 55, 132, 113);
      const wing = Math.abs(v);
      return !c.settled && inEllipse(u + 0.52 * wing, wing, 0.035, spread * 0.54, 0.104, spread * 0.58) &&
        ink(pen.ink, 156, 213, 199, INK_GLASS);
    });
  },
};
