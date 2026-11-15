import { SHARED_TUNING, type Animal, type Creature } from "../flock";
import { ink, INK_DARK, type RGB } from "../ink";
import { clamp, hash3, lerp, smoothstep, TAU } from "../math";
import { inEllipse, spotted, toSegment } from "./shapes";

interface Chameleon extends Creature {
  from: number;
  to: number;
  changedAt: number;
  look: number;
  stride: number;
}

const PALETTES: { light: RGB; skin: RGB; shade: RGB }[] = [
  { light: [218, 229, 124], skin: [129, 187, 77], shade: [46, 103, 67] },
  { light: [157, 231, 194], skin: [58, 177, 162], shade: [38, 89, 118] },
  { light: [219, 183, 248], skin: [156, 118, 197], shade: [86, 61, 124] },
  { light: [254, 217, 146], skin: [221, 147, 71], shade: [146, 72, 56] },
];

const EYE: RGB = [235, 207, 128];
const PUPIL: RGB = [28, 28, 23];
const SHINE: RGB = [253, 244, 203];
const FOOT = 0.26;

function mix(a: RGB, b: RGB, amount: number): RGB {
  return [lerp(a[0], b[0], amount), lerp(a[1], b[1], amount), lerp(a[2], b[2], amount)];
}

function branchY(x: number) {
  return 0.86 - 0.08 * x;
}

const COIL = Array.from({ length: 30 }, (_, i) => {
  const t = i / 29;
  const angle = -0.12 + t * TAU * 1.27;
  const radius = 0.155 - 0.111 * t;
  return { x: -0.395 + Math.cos(angle) * radius, y: 0.08 + Math.sin(angle) * radius, width: 0.027 - 0.017 * t };
});

function tailAt(x: number, y: number) {
  if (x > -0.195 || y < -0.077 || y > 0.255) return false;
  if (toSegment(x, y, -0.195, 0.032, COIL[0].x, COIL[0].y) < 0.037) return true;
  for (let i = 1; i < COIL.length; i++) {
    const a = COIL[i - 1];
    const b = COIL[i];
    if (toSegment(x, y, a.x, a.y, b.x, b.y) < a.width) return true;
  }
  return false;
}

function paintBranch(ctx: CanvasRenderingContext2D, width: number, height: number, dark: boolean) {
  const unit = Math.min(width, height);
  const at = (u: number) => branchY(u) * height;
  ctx.lineCap = "round";
  ctx.strokeStyle = dark ? "#4a3426" : "#8e6847";
  ctx.lineWidth = unit * 0.031;
  ctx.beginPath();
  ctx.moveTo(width * 0.045, at(0.045));
  ctx.lineTo(width * 0.94, at(0.94));
  ctx.stroke();

  ctx.lineWidth = unit * 0.011;
  ctx.strokeStyle = dark ? "#75583b" : "#ac8658";
  ctx.beginPath();
  ctx.moveTo(width * 0.055, at(0.055) - unit * 0.009);
  ctx.lineTo(width * 0.92, at(0.92) - unit * 0.009);
  ctx.moveTo(width * 0.81, at(0.81));
  ctx.quadraticCurveTo(width * 0.885, height * 0.74, width * 0.95, height * 0.70);
  ctx.moveTo(width * 0.22, at(0.22));
  ctx.quadraticCurveTo(width * 0.12, height * 0.83, width * 0.077, height * 0.72);
  ctx.stroke();

  for (const side of [0, 1]) {
    for (let i = 0; i < 14; i++) {
      const seed = hash3(i, side, 126);
      const x = (side === 0 ? 0.09 : 0.92) + (seed - 0.5) * 0.14;
      const y = (side === 0 ? 0.76 : 0.73) + (hash3(i, side, 127) - 0.5) * 0.125;
      ctx.fillStyle = dark
        ? (i % 2 ? "#2b4932" : "#36563a")
        : (i % 2 ? "#607c46" : "#7f9c5e");
      ctx.beginPath();
      ctx.ellipse(x * width, y * height, unit * (0.013 + seed * 0.015), unit * 0.009, seed * 3, 0, TAU);
      ctx.fill();
    }
  }
}

export const chameleons: Animal<Chameleon> = {
  key: "chameleons",
  label: "Chameleon",
  swatch: PALETTES[0].skin,
  defaults: { ...SHARED_TUNING, detail: 1.95, fog: 0.06, farthest: 1, trail: 0, shimmer: 0, sparkle: 0, colorShift: 7 },
  hide: ["direction", "corner", "sway", "spread", "grip", "separation", "shimmer", "sparkle"],
  controls: [
    ["Color change", [
      { key: "colorShift", label: "Change interval", min: 3, max: 20, step: 1, hint: "Seconds between color changes. Tap near the chameleon to change its colors early." },
    ]],
  ],
  area: 750000,
  max: 1,
  scale: 2.38,
  speed: 25,
  trail: { light: [97, 153, 114], dark: [111, 217, 108] },
  paintBackdrop(ctx, width, height, theme) {
    paintBranch(ctx, width, height, theme === "dark");
  },
  create(c) {
    return { ...c, from: 0, to: 0, changedAt: 0, look: 0, stride: c.id === 1 ? 0 : c.id * 0.37 };
  },
  enter(c, flock) {
    c.changedAt = flock.time;
    c.x = flock.width * 0.54;
    c.y = flock.height * branchY(0.54) - Math.min(c.span, flock.width * 0.76) * FOOT;
  },
  startle(c, dx, _dy, _strength, flock) {
    c.look = clamp(-dx, -1, 1);
    if (flock.time - c.changedAt < 1.25 && c.from !== c.to) return;
    c.from = c.to;
    c.to = (c.to + 1) % PALETTES.length;
    c.changedAt = flock.time;
  },
  update(c, flock, dt) {
    const time = flock.time;
    if (time - c.changedAt >= Number(flock.tuning.colorShift)) {
      c.from = c.to;
      c.to = (c.to + 1) % PALETTES.length;
      c.changedAt = time;
    }
    c.stride += dt * flock.cruise(c) * 0.008;
    const along = 0.54 + 0.08 * Math.sin(c.stride);
    c.x = flock.width * along;
    c.y = flock.height * branchY(along) - Math.min(c.span, flock.width * 0.76) * FOOT;
    c.look *= Math.exp(-dt * 0.8);
  },
  draw(c, pen, flock) {
    const time = flock.time - c.changedAt;
    const phase = c.stride * 15;
    const pose = { ...c, heading: 0, span: Math.min(c.span, flock.width * 0.76) };
    const slope = -0.08 * flock.height / flock.width;
    const from = PALETTES[c.from];
    const to = PALETTES[c.to];
    const colors = Array.from({ length: 24 }, (_, i) => {
      const wave = c.from === c.to ? 1 : smoothstep(0, 0.55, time - (23 - i) * 0.025);
      return { light: mix(from.light, to.light, wave), skin: mix(from.skin, to.skin, wave), shade: mix(from.shade, to.shade, wave) };
    });
    const colorAt = (x: number) => colors[clamp(Math.round((x + 0.56) * 23 / 0.92), 0, 23)];
    const legs = [-0.155, 0.126].map((hip, i) => {
      const step = Math.sin(phase + i * Math.PI);
      const toe = hip + step * 0.035 + 0.025;
      return { hip, knee: hip + (i === 0 ? -0.075 : 0.048), toe, y: FOOT + toe * slope - Math.max(0, step) * 0.017 };
    });

    // The far feet sit in shadow behind the nearer pair.
    for (const leg of legs) {
      const x = leg.hip - 0.046;
      pen.lineBody(pose, leg.hip, 0.066, x - 0.02, 0.169, colorAt(x).shade);
      pen.lineBody(pose, x - 0.02, 0.169, x, FOOT + slope * x, colorAt(x).shade);
    }

    const pupilX = 0.223 + 0.015 * Math.sin(flock.time * 1.4) + 0.018 * c.look;
    const pupilY = -0.129 + 0.009 * Math.sin(flock.time * 0.91);
    pen.shape(pose, 0.59, (x, y) => {
      const body = inEllipse(x, y, -0.044, -0.021, 0.236, 0.144);
      const head = inEllipse(x, y, 0.211, -0.099, 0.139, 0.1);
      const helmet = x > 0.083 && x < 0.252 && y < -0.115 && y > -0.224 + Math.abs(x - 0.139) * 0.72;
      const chin = inEllipse(x, y, 0.196, -0.029, 0.112, 0.069);
      const color = colorAt(x);

      if (head && inEllipse(x, y, 0.223, -0.124, 0.069, 0.064)) {
        if (inEllipse(x, y, pupilX - 0.007, pupilY - 0.009, 0.009, 0.01)) return ink(pen.ink, ...SHINE);
        if (inEllipse(x, y, pupilX, pupilY, 0.026, 0.027)) return ink(pen.ink, ...PUPIL, INK_DARK);
        if (inEllipse(x, y, 0.223, -0.124, 0.048, 0.046)) return ink(pen.ink, ...EYE);
        return ink(pen.ink, ...color.shade);
      }
      if (head || chin || helmet) {
        const mouth = x > 0.23 && Math.abs(y - (-0.051 - (x - 0.23) * 0.14)) < 0.01;
        if (mouth || inEllipse(x, y, 0.316, -0.098, 0.012, 0.01)) {
          return ink(pen.ink, ...color.shade, INK_DARK);
        }
        return ink(pen.ink, ...(y < -0.157 ? color.light : color.skin));
      }

      for (const { hip, knee, toe, y: footY } of legs) {
        if (toSegment(x, y, hip, 0.077, knee, 0.169) < 0.023 ||
            toSegment(x, y, knee, 0.169, toe, footY) < 0.018) {
          return ink(pen.ink, ...(x > knee ? color.skin : color.shade));
        }
        if (toSegment(x, y, toe - 0.027, footY + 0.006, toe + 0.033, footY) < 0.014) {
          return ink(pen.ink, ...color.light);
        }
      }
      if (body) {
        const bar = Math.sin(36 * x + 6 * y) > 0.51 && y > -0.11 && y < 0.077;
        const lightScales = y < -0.104 || (bar && spotted(x, y, 0.036, 0.01, c.id));
        return ink(pen.ink, ...(lightScales ? color.light : y > 0.065 || bar ? color.shade : color.skin));
      }
      return tailAt(x, y) && ink(pen.ink, ...(y < 0.06 ? color.light : color.skin));
    });
  },
};
