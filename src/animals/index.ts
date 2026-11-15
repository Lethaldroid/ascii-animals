import type { Animal } from "../flock";
import { butterflies } from "./butterflies";
import { crabs } from "./crabs";
import { cranes } from "./cranes";
import { dragonflies } from "./dragonflies";
import { frogs } from "./frogs";
import { jellyfish } from "./jellyfish";
import { koi } from "./koi";
import { habitats, inHabitat } from "./habitats";

import { flamingos } from "./flamingos";
import { pelicans } from "./pelicans";
import { crocodiles } from "./crocodiles";
import { chickens } from "./chickens";
import { chameleons } from "./chameleons";
import { stingrays } from "./stingrays";
import { hummingbirds } from "./hummingbirds";
import { fireflies } from "./fireflies";

/** Every animal, in the order the choices show them. */
export const ANIMALS = {
  butterflies: inHabitat(butterflies, habitats.butterflies),
  koi: inHabitat(koi, habitats.koi),
  jellyfish: inHabitat(jellyfish, habitats.jellyfish),
  dragonflies: inHabitat(dragonflies, habitats.dragonflies),
  frogs: inHabitat(frogs, habitats.frogs),
  cranes: inHabitat(cranes, habitats.cranes),
  crabs: inHabitat(crabs, habitats.crabs),
  flamingos,
  pelicans: inHabitat(pelicans, habitats.pelicans),
  crocodiles: inHabitat(crocodiles, habitats.crocodiles),
  chickens: inHabitat(chickens, habitats.chickens),
  stingrays: inHabitat(stingrays, habitats.stingrays),
  hummingbirds: inHabitat(hummingbirds, habitats.hummingbirds),
  chameleons: inHabitat(chameleons, habitats.chameleons),
  fireflies: inHabitat(fireflies, habitats.fireflies),
} satisfies Record<string, Animal<any>>;

export type AnimalKey = keyof typeof ANIMALS;

export const ANIMAL_KEYS = Object.keys(ANIMALS) as AnimalKey[];
