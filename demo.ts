import { animalForNewTab, rememberTabAnimal } from "./new-tab";
import { mountTweakPanel, type Control, type ControlKit } from "./panel";
import { ANIMAL_KEYS, ANIMALS, AnimalEngine, SHARED_CONTROLS, type AnimalKey, type KnobSpec, type Tuning } from "./src";
import { mountChoices, mountComposer, mountGreeting } from "./ui";

/**
 * Prefix for everything this app keeps in localStorage. It shares a domain with the older
 * butterflies app (Pocket Studio, /butterflies-app), which uses bare "tweaks" and "animal".
 */
const STORE = "ascii-animals:";

if (/Chrome\//.test(navigator.userAgent)) document.documentElement.classList.add("liquid");

async function mountDemo() {
  const extension = location.protocol === "chrome-extension:";
  const params = new URLSearchParams(location.search);
  // ?animal=koi picks the animal (otherwise the last one picked); ?count=60 pins how many. No count: sized to the screen.
  const count = Number(params.get("count")) || undefined;
  const isAnimal = (key: string | null): key is AnimalKey => key !== null && Object.hasOwn(ANIMALS, key);
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORE + "animal");
  } catch {
    // Storage unavailable: start with butterflies.
  }
  const requested = params.get("animal");
  let animal = isAnimal(requested) ? requested
    : extension ? await animalForNewTab()
    : isAnimal(saved) ? saved : "butterflies";
  // Dark mode only: every animal is tuned to glow on black.
  const engine = new AnimalEngine(document.querySelector("canvas")!, { animal, count, theme: "dark" });
  // ── tweak panel: shared Movement and Look knobs around the animal's own ──
  /** Each animal's tweaks are saved under their own key. */
  const storageKey = (key: AnimalKey) => `${STORE}tweaks:${key}`;
  function controlsFor(key: AnimalKey) {
    const a = ANIMALS[key];
    const hidden = new Set<string>(a.hide ?? []);
    return (kit: ControlKit<Tuning>): [string, Control[]][] => {
      const build = (spec: KnobSpec): Control => {
        if ("toggle" in spec) return kit.toggle(spec.key, spec.label, spec.hint);
        const knob = kit.knob(spec.key, spec.label, spec.min, spec.max, spec.step, spec.hint);
        const when = spec.disabledWhen;
        return when ? { ...knob, disabled: () => Boolean(engine.tuning[when]) } : knob;
      };
      const keep = (specs: KnobSpec[]) => specs.filter((s) => !hidden.has(s.key)).map(build);
      return [
        ["Movement", keep(SHARED_CONTROLS.movement)],
        ...a.controls.map(([title, specs]): [string, Control[]] => [title, specs.map(build)]),
        ["Look", keep(SHARED_CONTROLS.look)],
      ];
    };
  }
  let tweaks = mountTweakPanel(engine, ANIMALS[animal].defaults, controlsFor(animal), { storageKey: storageKey(animal) });
  // Open in two tabs? When the other one saves tweaks for this animal, reload, so this tab never
  // writes its stale settings back over the newer ones.
  window.addEventListener("storage", (e) => {
    if (e.key === storageKey(animal)) location.reload();
  });
  // ── animal choices: every animal in the top bar, each with a dot of its own colour ──
  mountChoices(
    document.querySelector<HTMLElement>(".choices")!,
    ANIMAL_KEYS.map((key) => ({ value: key, label: ANIMALS[key].label, swatch: `rgb(${ANIMALS[key].swatch.join(",")})` })),
    animal,
    (value) => {
      animal = value as AnimalKey;
      if (extension) rememberTabAnimal(animal);
      engine.setAnimal(animal);
      tweaks.destroy();
      tweaks = mountTweakPanel(engine, ANIMALS[animal].defaults, controlsFor(animal), { storageKey: storageKey(animal) });
      try {
        localStorage.setItem(STORE + "animal", animal);
      } catch {
        // Not remembered across visits, that's all.
      }
    },
  );
  mountComposer();
  mountGreeting(STORE + "name");
}

void mountDemo();
