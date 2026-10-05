import { kitFor, spellFor } from "./kits.ts";
import { createRng } from "./rng.ts";
import type {
  CombatAction,
  CombatRole,
  CombatState,
  Piece,
  StatusEffect,
} from "./types.ts";

function statusesOf(combat: CombatState, pieceId: string): StatusEffect[] {
  return combat.statuses[pieceId] ?? [];
}

function hasStatus(combat: CombatState, pieceId: string, id: StatusEffect["id"]): boolean {
  return statusesOf(combat, pieceId).some((status) => status.id === id);
}

function potency(combat: CombatState, pieceId: string, id: StatusEffect["id"]): number {
  return statusesOf(combat, pieceId)
    .filter((status) => status.id === id)
    .reduce((sum, status) => sum + (status.potency ?? 0), 0);
}

function pushStatus(combat: CombatState, pieceId: string, status: StatusEffect): void {
  const existing = statusesOf(combat, pieceId).filter((item) => item.id !== status.id);
  combat.statuses[pieceId] = [...existing, status];
}

function tickStatuses(combat: CombatState, pieceId: string): void {
  combat.statuses[pieceId] = statusesOf(combat, pieceId)
    .map((status) => ({ ...status, remaining: status.remaining - 1 }))
    .filter((status) => status.remaining > 0);
}

function clamp(piece: Piece): Piece {
  return {
    ...piece,
    hp: Math.max(0, Math.min(piece.maxHp, Math.round(piece.hp))),
    mp: Math.max(0, Math.min(piece.maxMp, Math.round(piece.mp))),
  };
}

function incomingMultiplier(combat: CombatState, targetId: string): number {
  let mul = 1;
  if (hasStatus(combat, targetId, "fortified")) mul *= 0.72;
  if (hasStatus(combat, targetId, "lastStand")) mul *= 0.5;
  return mul;
}

function physicalDamage(attacker: Piece, defender: Piece, combat: CombatState, rngState: number): {
  damage: number;
  crit: boolean;
  nextRng: number;
} {
  const rng = createRng(rngState);
  const a = kitFor(attacker.type).stats;
  const d = kitFor(defender.type).stats;
  const focused = hasStatus(combat, attacker.id, "focused");
  const variance = rng.range(0.85, 1.15);
  const raw = (a.atk * 1.15 - d.def * 0.45) * variance;
  const crit = focused || rng.chance(0.08);
  const damage = Math.max(1, Math.round(raw * (crit ? 1.6 : 1) * incomingMultiplier(combat, defender.id)));
  return { damage, crit, nextRng: Math.floor(rng.next() * 0x7fffffff) || 1 };
}

function magicDamage(attacker: Piece, defender: Piece, combat: CombatState, power: number, rngState: number): {
  damage: number;
  nextRng: number;
} {
  const rng = createRng(rngState);
  const mag = kitFor(attacker.type).stats.mag;
  const resist = kitFor(defender.type).stats.def * 0.2;
  const variance = rng.range(0.9, 1.12);
  const damage = Math.max(
    1,
    Math.round((power + mag * 0.55 - resist) * variance * incomingMultiplier(combat, defender.id)),
  );
  return { damage, nextRng: Math.floor(rng.next() * 0x7fffffff) || 1 };
}

export function combatActors(pieces: Record<string, Piece>, combat: CombatState): {
  actor: Piece;
  foe: Piece;
  actorRole: CombatRole;
} {
  const attacker = pieces[combat.attackerId];
  const defender = pieces[combat.defenderId];
  if (!attacker || !defender) throw new Error("Combat pieces missing");
  if (combat.nextRole === "attacker") {
    return { actor: attacker, foe: defender, actorRole: "attacker" };
  }
  return { actor: defender, foe: attacker, actorRole: "defender" };
}

export function availableActions(piece: Piece): CombatAction[] {
  const actions: CombatAction[] = [{ kind: "strike" }];
  for (const spell of kitFor(piece.type).spells) {
    if (piece.mp >= spell.mpCost) actions.push({ kind: "spell", spellId: spell.id });
  }
  return actions;
}

export function applyCombatAction(
  pieces: Record<string, Piece>,
  combat: CombatState,
  action: CombatAction,
  rngState: number,
): { pieces: Record<string, Piece>; combat: CombatState; rngState: number; over: boolean } {
  const nextPieces: Record<string, Piece> = Object.fromEntries(
    Object.entries(pieces).map(([id, piece]) => [id, { ...piece }]),
  );
  const nextCombat: CombatState = {
    ...combat,
    statuses: Object.fromEntries(
      Object.entries(combat.statuses).map(([id, list]) => [id, list.map((item) => ({ ...item }))]),
    ),
    log: [...combat.log],
  };

  const { actor, foe } = combatActors(nextPieces, nextCombat);
  const livingActor = nextPieces[actor.id]!;
  const livingFoe = nextPieces[foe.id]!;

  if (hasStatus(nextCombat, livingActor.id, "blessed")) {
    const regen = potency(nextCombat, livingActor.id, "blessed") || 3;
    livingActor.hp += regen;
    nextCombat.log.push({ text: `${label(livingActor)} is blessed (+${regen} HP).` });
  }

  if (hasStatus(nextCombat, livingActor.id, "stunned")) {
    nextCombat.log.push({ text: `${label(livingActor)} is stunned and misses the action!` });
    tickStatuses(nextCombat, livingActor.id);
    nextCombat.nextRole = nextCombat.nextRole === "attacker" ? "defender" : "attacker";
    nextCombat.round += 1;
    nextPieces[livingActor.id] = clamp(livingActor);
    return {
      pieces: nextPieces,
      combat: nextCombat,
      rngState,
      over: livingActor.hp <= 0 || livingFoe.hp <= 0,
    };
  }

  let rng = rngState;
  if (action.kind === "strike") {
    const result = physicalDamage(livingActor, livingFoe, nextCombat, rng);
    rng = result.nextRng;
    livingFoe.hp -= result.damage;
    const critText = result.crit ? " Critical hit!" : "";
    nextCombat.log.push({
      text: `${label(livingActor)} strikes ${label(livingFoe)} for ${result.damage}.${critText}`,
    });
    if (hasStatus(nextCombat, livingActor.id, "focused")) {
      nextCombat.statuses[livingActor.id] = statusesOf(nextCombat, livingActor.id).filter((s) => s.id !== "focused");
    }
  } else {
    const spell = spellFor(livingActor.type, action.spellId);
    if (!spell || livingActor.mp < spell.mpCost) {
      nextCombat.log.push({ text: `${label(livingActor)} fumbles a spell and strikes instead.` });
      const result = physicalDamage(livingActor, livingFoe, nextCombat, rng);
      rng = result.nextRng;
      livingFoe.hp -= result.damage;
      nextCombat.log.push({ text: `${label(livingActor)} strikes for ${result.damage}.` });
    } else {
      livingActor.mp -= spell.mpCost;
      nextCombat.log.push({ text: `${label(livingActor)} casts ${spell.name}!` });
      for (const effect of spell.effects) {
        if (effect.type === "damage") {
          const result = magicDamage(livingActor, livingFoe, nextCombat, effect.power, rng);
          rng = result.nextRng;
          livingFoe.hp -= result.damage;
          nextCombat.log.push({ text: `${spell.name} hits ${label(livingFoe)} for ${result.damage}.` });
        } else if (effect.type === "heal") {
          livingActor.hp += effect.power;
          nextCombat.log.push({ text: `${label(livingActor)} recovers ${effect.power} HP.` });
        } else if (effect.type === "status") {
          const targetId = effect.status === "stunned" ? livingFoe.id : livingActor.id;
          pushStatus(nextCombat, targetId, {
            id: effect.status,
            remaining: effect.duration,
            potency: effect.potency,
          });
          const target = targetId === livingActor.id ? livingActor : livingFoe;
          nextCombat.log.push({ text: `${label(target)} gains ${effect.status}.` });
        }
      }
    }
  }

  nextPieces[livingActor.id] = clamp(livingActor);
  nextPieces[livingFoe.id] = clamp(livingFoe);
  tickStatuses(nextCombat, livingActor.id);

  const actorDead = nextPieces[livingActor.id]!.hp <= 0;
  const foeDead = nextPieces[livingFoe.id]!.hp <= 0;
  const over = actorDead || foeDead;
  if (foeDead) nextCombat.log.push({ text: `${label(livingFoe)} falls.` });
  if (actorDead) nextCombat.log.push({ text: `${label(livingActor)} falls.` });
  if (!over) {
    nextCombat.nextRole = nextCombat.nextRole === "attacker" ? "defender" : "attacker";
    nextCombat.round += 1;
  }

  return { pieces: nextPieces, combat: nextCombat, rngState: rng, over };
}

function label(piece: Piece): string {
  return `${piece.color} ${piece.type}`;
}

export function openingInitiative(attacker: Piece, defender: Piece): CombatRole {
  const a = kitFor(attacker.type).stats.spd;
  const d = kitFor(defender.type).stats.spd;
  return a >= d ? "attacker" : "defender";
}
