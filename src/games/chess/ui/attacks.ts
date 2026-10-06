import type { Piece, PieceType } from "../engine/index.ts";
import { kitFor } from "../engine/index.ts";
import { createRng, type Rng } from "../engine/rng.ts";

export type AttackKind = "slash" | "thrust" | "smash" | "overhead" | "magic";

const PHYSICAL: AttackKind[] = ["slash", "thrust", "smash", "overhead"];

const LABELS: Record<AttackKind, string> = {
  slash: "SLASH!",
  thrust: "THRUST!",
  smash: "SMASH!",
  overhead: "OVERHEAD!",
  magic: "MAGIC!",
};

export function magicChanceFor(type: PieceType): number {
  const mag = kitFor(type).stats.mag;
  return Math.min(0.55, 0.16 + mag / 40);
}

export function pickAttack(rng: Rng, type: PieceType): AttackKind {
  if (rng.chance(magicChanceFor(type))) return "magic";
  return PHYSICAL[rng.int(PHYSICAL.length)]!;
}

export function attackLabel(kind: AttackKind, lethal = false): string {
  if (lethal) return kind === "magic" ? "ARCANE KILL!" : "KILLING BLOW!";
  return LABELS[kind];
}

export function seedFightRng(attacker: Piece, defender: Piece): Rng {
  const seed = Date.now() ^ hashId(attacker.id) ^ (hashId(defender.id) << 7);
  return createRng(seed || 1);
}

function hashId(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n = (n * 33 + id.charCodeAt(i)) >>> 0;
  return n;
}

export function poseFor(kind: AttackKind): "striking" | "casting" {
  return kind === "magic" ? "casting" : "striking";
}
