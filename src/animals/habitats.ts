import type { Animal, Creature } from "../flock";
import { hash3 } from "../math";
import type { Theme } from "../renderer";

type Colors = readonly [dark: string, light: string];
type Band = NonNullable<Animal["verticalBand"]>;
type Scene = NonNullable<Animal["paintBackdrop"]>;

function color(colors: Colors, theme: Theme) {
  return colors[theme === "dark" ? 0 : 1];
}

function gradient(ctx: CanvasRenderingContext2D, width: number, top: number, bottom: number, colors: string[]) {
  const fill = ctx.createLinearGradient(0, top, 0, bottom);
  colors.forEach((stop, i) => fill.addColorStop(i / (colors.length - 1), stop));
  ctx.fillStyle = fill;
  ctx.fillRect(0, top, width, bottom - top);
}

function marks(ctx: CanvasRenderingContext2D, width: number, height: number, start: number, end: number, glyphs: string, ink: string, seed: number) {
  const columns = Math.ceil(width / 28);
  const rows = Math.ceil((end - start) * height / 20);
  ctx.fillStyle = ink;
  ctx.font = "12px monospace";
  ctx.textBaseline = "middle";
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const roll = hash3(col, row, seed);
      if (roll < 0.53) continue;
      const x = ((col + hash3(col, row, seed + 1)) / columns) * width;
      const y = (start + ((row + hash3(col, row, seed + 2)) / rows) * (end - start)) * height;
      ctx.fillText(glyphs[Math.floor(hash3(col, row, seed + 3) * glyphs.length)], x, y);
    }
  }
}

function hills(ctx: CanvasRenderingContext2D, width: number, height: number, rise: number, ink: string) {
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.moveTo(0, height * rise);
  ctx.bezierCurveTo(width * 0.19, height * (rise - 0.12), width * 0.29, height * (rise + 0.07), width * 0.49, height * rise);
  ctx.bezierCurveTo(width * 0.71, height * (rise - 0.08), width * 0.83, height * (rise - 0.09), width, height * rise);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();
}

interface Landscape {
  sky: [Colors, Colors];
  distant: Colors;
  ground: [Colors, Colors];
  horizon: number;
  texture: string;
  ink: Colors;
  clouds?: boolean;
  water?: boolean;
  feature?: (ctx: CanvasRenderingContext2D, width: number, height: number, horizon: number, theme: Theme) => void;
}

function landscape({ sky, distant, ground, horizon, texture, ink, feature, clouds: hasClouds = true, water }: Landscape): Scene {
  return (ctx, width, height, theme) => {
    const shore = height * horizon;
    gradient(ctx, width, 0, height, sky.map(tone => color(tone, theme)));
    marks(ctx, width, height, 0.06, horizon - 0.08, "···––", color(["#596778", "#9ca7aa"], theme), 32);
    if (hasClouds) clouds(ctx, width, shore, theme);
    hills(ctx, width, height, horizon - 0.025, color(distant, theme));
    feature?.(ctx, width, height, shore, theme);
    gradient(ctx, width, shore, height, ground.map(tone => color(tone, theme)));
    if (water) muddyWater(ctx, width, height, theme);
    marks(ctx, width, height, horizon + 0.025, 1, texture, color(ink, theme), 14);
  };
}

function clouds(ctx: CanvasRenderingContext2D, width: number, shore: number, theme: Theme) {
  ctx.fillStyle = color(["rgba(139, 163, 187, 0.16)", "rgba(255, 255, 255, 0.53)"], theme);
  for (const [x, y, radius] of [[0.16, 0.29, 0.09], [0.72, 0.24, 0.13], [0.86, 0.65, 0.08]]) {
    const spread = radius * width;
    ctx.beginPath();
    ctx.ellipse(x * width, y * shore, spread, spread * 0.09, 0, 0, Math.PI * 2);
    ctx.ellipse(x * width - spread * 0.24, y * shore - spread * 0.07, spread * 0.46, spread * 0.12, 0, 0, Math.PI * 2);
    ctx.ellipse(x * width + spread * 0.22, y * shore - spread * 0.04, spread * 0.43, spread * 0.09, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function muddyWater(ctx: CanvasRenderingContext2D, width: number, height: number, theme: Theme) {
  ctx.fillStyle = color(["#284442", "#8da789"], theme);
  ctx.beginPath();
  ctx.moveTo(0, height * 0.57);
  ctx.bezierCurveTo(width * 0.3, height * 0.67, width * 0.58, height * 0.49, width, height * 0.58);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();
}
function barn(ctx: CanvasRenderingContext2D, width: number, height: number, horizon: number, theme: Theme) {
  const unit = Math.min(width * 0.14, height * 0.19, 135);
  const x = width * 0.15;
  const y = horizon - unit * 0.52;
  ctx.fillStyle = color(["#5c342e", "#b7755c"], theme);
  ctx.fillRect(x, y, unit, unit * 0.52);
  ctx.fillStyle = color(["#352429", "#86554d"], theme);
  ctx.beginPath();
  ctx.moveTo(x - unit * 0.09, y);
  ctx.lineTo(x + unit * 0.49, y - unit * 0.37);
  ctx.lineTo(x + unit * 1.09, y);
  ctx.fill();
  ctx.fillStyle = color(["#271d1c", "#805641"], theme);
  ctx.fillRect(x + unit * 0.38, y + unit * 0.15, unit * 0.24, unit * 0.37);
  ctx.fillStyle = color(["#7b5c43", "#bc9167"], theme);
  for (const rail of [0.19, 0.34]) ctx.fillRect(x + unit, horizon - unit * rail, unit * 1.28, 2);
  for (const post of [1.12, 1.47, 1.82, 2.22]) ctx.fillRect(x + unit * post, horizon - unit * 0.42, 3, unit * 0.42);
}

function reeds(ctx: CanvasRenderingContext2D, width: number, height: number, horizon: number, theme: Theme) {
  ctx.strokeStyle = color(["#52603a", "#718657"], theme);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i < Math.ceil(width / 11); i++) {
    const roll = hash3(i, 0, 41);
    if (roll < 0.43) continue;
    const x = i * 11;
    const len = (0.009 + roll * 0.032) * height;
    ctx.moveTo(x, horizon + 1);
    ctx.quadraticCurveTo(x, horizon - len * 0.55, x + 7 * (roll - 0.7), horizon - len);
  }
  ctx.stroke();
}

const softSky: Landscape["sky"] = [["#091222", "#94afcc"], ["#263640", "#e0e9df"]];
const garden = landscape({
  sky: softSky, distant: ["#1d372b", "#859e75"],
  ground: [["#20392a", "#a2b77d"], ["#10291c", "#79995e"]], horizon: 0.63,
  texture: "·'Y*+✿", ink: ["#8b9362", "#637b42"], feature: reeds,
});
const marsh = landscape({
  sky: [["#101b20", "#b6c4ca"], ["#2a342b", "#e6ddbd"]], distant: ["#293a29", "#94a17b"],
  ground: [["#173a39", "#a0c5b0"], ["#1a2c27", "#76977e"]], horizon: 0.42,
  texture: "·,––~~", ink: ["#658e78", "#547761"], feature: reeds,
});
const dragonflyMarsh = landscape({
  sky: [["#080d14", "#aebfcf"], ["#101820", "#d9e1db"]], distant: ["#152521", "#98ab8f"],
  ground: [["#122421", "#97b5a3"], ["#0a181b", "#7da193"]], horizon: 0.66,
  texture: "·,––~~", ink: ["#355047", "#627e6f"], feature: reeds, clouds: false,
});
const grove = landscape({
  sky: [["#101c1b", "#a8c1a5"], ["#253e33", "#d8dfac"]], distant: ["#273e30", "#819c70"],
  ground: [["#24362b", "#95ac72"], ["#142921", "#6d8858"]], horizon: 0.62,
  texture: "··'Y", ink: ["#536c50", "#587148"], clouds: false,
});
const swamp = landscape({
  sky: [["#0c1719", "#a6b5ad"], ["#292d23", "#d8d0a4"]], distant: ["#373729", "#9c8f6e"],
  ground: [["#4c3928", "#a78259"], ["#244341", "#8fa88d"]], horizon: 0.48,
  texture: ".,––~~", ink: ["#827c54", "#715c42"], feature: reeds, water: true,
});
const farm = landscape({
  sky: [["#131922", "#afc7d3"], ["#424034", "#f1deab"]], distant: ["#42432b", "#9b9c64"],
  ground: [["#4c3225", "#ad8057"], ["#2d201b", "#92623e"]], horizon: 0.58,
  texture: "·,;_'", ink: ["#987858", "#765134"], feature: barn,
});
const beach = landscape({
  sky: softSky, distant: ["#183c48", "#79b4ba"],
  ground: [["#554637", "#dcc492"], ["#342719", "#b79667"]], horizon: 0.56,
  texture: "··.,o", ink: ["#91826a", "#89734f"],
});
const coast = landscape({
  sky: [["#092036", "#8bbce0"], ["#34526b", "#e1edf4"]], distant: ["#1b394b", "#83abbc"],
  ground: [["#153b4c", "#86bcca"], ["#102f43", "#5696b2"]], horizon: 0.77,
  texture: "·––~~", ink: ["#5f879b", "#497f96"],
});
const openSky = landscape({
  sky: [["#142238", "#90b9df"], ["#465366", "#f1e6d6"]], distant: ["#343e4b", "#a9aaa7"],
  ground: [["#233647", "#a0afb7"], ["#152b38", "#78919e"]], horizon: 0.86,
  texture: "··_", ink: ["#566e7d", "#5d7480"],
});
const night = landscape({
  sky: [["#080d23", "#adb6cb"], ["#1e293e", "#d8d8e6"]], distant: ["#152a26", "#8d9b91"],
  ground: [["#172c21", "#a2b293"], ["#0e1e17", "#738778"]], horizon: 0.64,
  texture: "·',Y", ink: ["#4f674b", "#68765e"], feature: reeds, clouds: false,
});

function underwater(surface: Colors, deep: Colors, ink: Colors, texture: string, bottom?: Colors): Scene {
  return (ctx, width, height, theme) => {
    gradient(ctx, width, 0, height, [color(surface, theme), color(deep, theme)]);
    marks(ctx, width, height, 0.025, 0.18, "··––~", color(ink, theme), 21);
    marks(ctx, width, height, 0.2, 0.94, texture, color(ink, theme), 8);
    if (bottom) {
      hills(ctx, width, height, 0.89, color(bottom, theme));
      marks(ctx, width, height, 0.9, 1, ".,o;'", color(ink, theme), 31);
    }
  };
}

const koiPond = underwater(["#254e47", "#a6c9af"], ["#0c221f", "#578678"], ["#647f64", "#456e5f"], "·.o", ["#26362c", "#799982"]);
const deepSea = underwater(["#132541", "#a6cbe1"], ["#100f24", "#5780ac"], ["#627392", "#486893"], "··.o");
const seabed = underwater(["#18434f", "#a0d1d5"], ["#0e2c3b", "#5f9cae"], ["#648b8a", "#4b7780"], "··.:o", ["#214544", "#87a98e"]);

export const habitats = {
  butterflies: { scene: garden, band: [0.14, 0.78] },
  koi: { scene: koiPond, band: [0.12, 0.86] },
  jellyfish: { scene: deepSea },
  dragonflies: { scene: dragonflyMarsh },
  frogs: { scene: marsh, band: [0.48, 0.92] },
  cranes: { scene: openSky, band: [0.09, 0.74] },
  crabs: { scene: beach, band: [0.65, 0.91] },
  pelicans: { scene: coast, band: [0.11, 0.66] },
  crocodiles: { scene: swamp, band: [0.56, 0.87] },
  chickens: { scene: farm, band: [0.65, 0.89] },
  stingrays: { scene: seabed, band: [0.19, 0.79] },
  hummingbirds: { scene: garden },
  chameleons: { scene: grove },
  fireflies: { scene: night },
} satisfies Record<string, { scene: Scene; band?: Band }>;

export function inHabitat<C extends Creature>(animal: Animal<C>, { scene, band }: { scene: Scene; band?: Band }): Animal<C> {
  return {
    ...animal,
    defaults: band ? { ...animal.defaults, direction: Math.min(animal.defaults.direction, 8), corner: false } : animal.defaults,
    paintBackdrop(ctx, width, height, theme) {
      scene(ctx, width, height, theme);
      animal.paintBackdrop?.(ctx, width, height, theme);
    },
    verticalBand: band,
  };
}
