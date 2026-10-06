export interface Rng {
  next(): number;
  int(maxExclusive: number): number;
  range(min: number, max: number): number;
  chance(p: number): boolean;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0 || 1;
  const next = (): number => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  return {
    next,
    int(maxExclusive) {
      return Math.floor(next() * maxExclusive);
    },
    range(min, max) {
      return min + (max - min) * next();
    },
    chance(p) {
      return next() < p;
    },
  };
}

export function peekRngState(seed: number, calls: number): number {
  const rng = createRng(seed);
  for (let i = 0; i < calls; i += 1) rng.next();
  return seed;
}
