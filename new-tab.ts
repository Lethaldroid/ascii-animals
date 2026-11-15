import { ANIMAL_KEYS, ANIMALS, type AnimalKey } from "./src";

const LAST_IN_ROTATION = "ascii-animals:rotation";
const TAB_ANIMAL = "ascii-animals:tab-animal";

function isAnimal(key: string | null): key is AnimalKey {
  return key !== null && Object.hasOwn(ANIMALS, key);
}

/** Keep the picker choice local to this tab, including when it reloads. */
export function rememberTabAnimal(animal: AnimalKey) {
  try {
    sessionStorage.setItem(TAB_ANIMAL, animal);
  } catch {
    // Storage unavailable. The current tab can still show an animal.
  }
}

export async function animalForNewTab(): Promise<AnimalKey> {
  try {
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "reload" || navigation?.type === "back_forward") {
      const current = sessionStorage.getItem(TAB_ANIMAL);
      if (isAnimal(current)) return current;
    }

    const advance = () => {
      const last = localStorage.getItem(LAST_IN_ROTATION);
      const next = ANIMAL_KEYS[isAnimal(last) ? (ANIMAL_KEYS.indexOf(last) + 1) % ANIMAL_KEYS.length : 0];
      localStorage.setItem(LAST_IN_ROTATION, next);
      return next;
    };

    // New tabs share the same extension origin. Serialize the read and write across tabs.
    const animal = navigator.locks
      ? await navigator.locks.request(LAST_IN_ROTATION, advance)
      : advance();
    rememberTabAnimal(animal);
    return animal;
  } catch {
    return ANIMAL_KEYS[0];
  }
}
