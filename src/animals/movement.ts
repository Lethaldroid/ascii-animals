import type { Creature, Flock } from "../flock";
import { rand, TAU } from "../math";

export interface MovingCreature extends Creature {
  phase: number;
  fleeAngle: number;
}

export function createMover(c: Creature): MovingCreature {
  return { ...c, phase: rand(0, TAU), fleeAngle: 0 };
}

export function startle(c: MovingCreature, dx: number, dy: number, strength: number, flock: Flock<MovingCreature>) {
  c.fleeAngle = dx || dy ? Math.atan2(dy, dx) : c.heading;
  c.startledUntil = flock.time + 0.65 + strength * 0.9;
}

/** Follow the shared course, or briefly steer away from the last tap. */
export function move(c: MovingCreature, flock: Flock<MovingCreature>, dt: number, pace = 1, turn = 0, fleePace = 2) {
  const startled = flock.time < c.startledUntil;
  const heading = startled ? c.fleeAngle : flock.heading + c.bias * flock.tuning.spread + turn;
  const cruise = flock.cruise(c);
  flock.begin();
  flock.steer(c, heading, cruise * (startled ? fleePace : pace), flock.tuning.grip * (startled ? 3 : 1.5));
  flock.separate(c);
  const speed = flock.move(c, dt, cruise * Math.max(1.6, pace));
  if (speed > 3) flock.face(c, dt);
  if (flock.passed(c)) {
    c.startledUntil = 0;
    flock.reenter(c);
  }
  return speed;
}
