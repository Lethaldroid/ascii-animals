import { SHARED_TUNING, type Animal, type Creature } from "../flock";
import type { RGB } from "../ink";
import { hash3, rand, TAU } from "../math";

const AMBER: RGB = [255, 198, 60];
const CORE: RGB = [255, 251, 192];
const HALO: RGB = [203, 136, 36];
const CORE_BACKGROUND: RGB = [92, 61, 18];

// The flight paths and the painted foliage use the same clusters.
const BUSH = [
  { x: 0.18, y: 0.84, rx: 0.115, ry: 0.095 },
  { x: 0.29, y: 0.76, rx: 0.127, ry: 0.122 },
  { x: 0.42, y: 0.79, rx: 0.134, ry: 0.136 },
  { x: 0.55, y: 0.73, rx: 0.139, ry: 0.133 },
  { x: 0.69, y: 0.78, rx: 0.13, ry: 0.12 },
  { x: 0.81, y: 0.84, rx: 0.112, ry: 0.095 },
] as const;

interface Firefly extends Creature {
  cluster: number;
  orbit: number;
  pulse: number;
}

export const fireflies: Animal<Firefly> = {
  key: "fireflies",
  label: "Firefly",
  swatch: AMBER,
  defaults: { ...SHARED_TUNING, fog: 0.2, trail: 0.64, trailFade: 2.6, detail: 1.45 },
  hide: ["direction", "corner", "sway", "spread", "grip", "separation"],
  controls: [],
  area: 34000,
  max: 42,
  scale: 0.48,
  speed: 26,
  trail: { light: [171, 123, 54], dark: HALO },
  paintBackdrop(ctx, width, height, theme) {
    const dark = theme === "dark";
    const layers = dark
      ? ["#14241d", "#1c3327", "#283f2e"]
      : ["#576e4d", "#6c8457", "#7d9867"];
    BUSH.forEach(({ x, y, rx, ry }, index) => {
      ctx.fillStyle = layers[0];
      ctx.beginPath();
      ctx.ellipse(x * width, (y + 0.035) * height, (rx + 0.012) * width, ry * height, 0, 0, TAU);
      ctx.fill();

      for (let i = 0; i < 17; i++) {
        const phase = i * 2.4;
        const spread = Math.sqrt(hash3(index, i, 41));
        const leafX = (x + Math.cos(phase) * rx * 0.76 * spread) * width;
        const leafY = (y + Math.sin(phase) * ry * 0.75 * spread) * height;
        const radius = 0.19 + hash3(index, i, 42) * 0.18;
        ctx.fillStyle = layers[1 + (i % 3 === 0 ? 1 : 0)];
        ctx.beginPath();
        ctx.ellipse(leafX, leafY, radius * rx * width, radius * ry * height, 0, 0, TAU);
        ctx.fill();

        ctx.fillStyle = dark ? "#496447" : "#a0ae75";
        ctx.font = "12px monospace";
        ctx.fillText(i % 2 === 0 ? "’" : "‹", leafX, leafY);
      }
    });
  },
  create(c) {
    return { ...c, cluster: (c.id - 1) % BUSH.length, orbit: rand(0, TAU), pulse: rand(0, TAU) };
  },
  enter(c, flock) {
    const bush = BUSH[c.cluster];
    c.x = (bush.x + bush.rx * 0.72 * Math.cos(c.orbit)) * flock.width;
    c.y = (bush.y + bush.ry * 0.85 * Math.sin(c.orbit)) * flock.height;
  },
  startle(c, _dx, _dy, strength, flock) {
    c.startledUntil = flock.time + 0.2 + strength * 0.5;
    c.pulse = Math.PI / 2;
  },
  update(c, flock, dt) {
    const bush = BUSH[c.cluster];
    const startled = flock.time < c.startledUntil;
    const speed = flock.tuning.speed;
    c.orbit += dt * speed * (0.48 + 0.4 * c.roll) * (startled ? 2 : 1);
    c.pulse += dt * (1.75 + 1.15 * c.roll);
    const radius = 0.32 + 0.63 * c.roll;
    c.x = (bush.x + bush.rx * radius * Math.cos(c.orbit)) * flock.width;
    c.y = (bush.y + bush.ry * radius * Math.sin(c.orbit * 2)) * flock.height;
  },
  draw(c, pen, flock) {
    const pulse = flock.time < c.startledUntil ? 1 : Math.max(0, Math.sin(c.pulse)) ** 2;
    if (pulse < 0.17) return;

    const fog = 1 - pulse * (1 - pen.fogFor(c.depth));
    if (pulse < 0.68) {
      pen.dot(c.x, c.y, "•", AMBER, c.depth, fog);
      return;
    }

    const haloFog = 0.67 + 0.23 * fog;
    pen.dot(c.x - pen.cw, c.y, "·", AMBER, c.depth, haloFog);
    pen.dot(c.x + pen.cw, c.y, "·", AMBER, c.depth, haloFog);
    pen.dot(c.x, c.y - pen.ch, "·", AMBER, c.depth, haloFog);
    pen.dot(c.x, c.y + pen.ch, "·", AMBER, c.depth, haloFog);
    pen.spot(c.x, c.y, "✦", CORE, CORE_BACKGROUND, c.depth, fog);
    pen.shed(c.x, c.y, pulse * 0.38);
  },
};
