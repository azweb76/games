import { combatActionList, chooseCombatAction, controllerFor, playMove } from "./game.ts";
import { kitFor } from "./kits.ts";
import { legalMoves } from "./moves.ts";
import { createRng } from "./rng.ts";
import type { CombatAction, GameState, Move, Piece } from "./types.ts";
import { pieceAt } from "./types.ts";

const MATERIAL: Record<Piece["type"], number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 100,
};

function combatScore(attacker: Piece, defender: Piece): number {
  const a = kitFor(attacker.type);
  const d = kitFor(defender.type);
  const offense = attacker.hp + a.stats.atk * 2 + a.stats.mag + a.stats.spd;
  const defense = defender.hp + d.stats.def * 2 + defender.hp * 0.3;
  return offense - defense;
}

function scoreMove(state: GameState, move: Move): number {
  let score = 0;
  const mover = pieceAt(state, move.from);
  if (!mover) return -Infinity;
  if (move.capture) {
    const defender = move.enPassant
      ? pieceAt(state, { file: move.to.file, rank: move.from.rank })
      : pieceAt(state, move.to);
    if (defender) {
      score += MATERIAL[defender.type] * 12;
      score += combatScore(mover, defender);
      if (defender.type === "king") score += 500;
    }
  }
  const center = Math.abs(move.to.file - 3.5) + Math.abs(move.to.rank - 3.5);
  score += (4 - center) * 0.4;
  if (move.promotion) score += MATERIAL[move.promotion] * 8;
  if (mover.type === "king" && !move.castle && state.fullmove < 12) score -= 4;
  if (move.castle) score += 3;
  return score;
}

export function pickBotMove(state: GameState): Move | null {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;
  const rng = createRng(state.rngState + state.fullmove * 17);
  const ranked = moves
    .map((move) => ({ move, score: scoreMove(state, move) + rng.range(-1.2, 1.2) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, Math.min(4, ranked.length));
  return top[rng.int(top.length)]!.move;
}

export function pickBotCombatAction(state: GameState): CombatAction {
  const actions = combatActionList(state);
  const strike = actions.find((action) => action.kind === "strike") ?? { kind: "strike" as const };
  if (!state.combat) return strike;
  const actor = state.pieces[state.combat.nextRole === "attacker" ? state.combat.attackerId : state.combat.defenderId];
  const foe = state.pieces[state.combat.nextRole === "attacker" ? state.combat.defenderId : state.combat.attackerId];
  if (!actor || !foe) return strike;

  const heal = actions.find((action) => action.kind === "spell" && ["rally", "bless", "drain"].includes(action.spellId));
  if (heal && actor.hp / actor.maxHp < 0.42) return heal;

  const stun = actions.find((action) => action.kind === "spell" && action.spellId === "shield-bash");
  if (stun && foe.hp > actor.hp) return stun;

  const nuke = actions
    .filter((action): action is { kind: "spell"; spellId: string } => action.kind === "spell")
    .find((action) =>
      ["lunge", "arcane-bolt", "royal-flare", "siege-crash"].includes(action.spellId),
    );
  if (nuke && actor.mp >= 5) return nuke;
  return strike;
}

export function stepBot(state: GameState): GameState {
  if (state.winner) return state;
  if (state.combat) {
    const color = state.combat.nextRole === "attacker"
      ? state.pieces[state.combat.attackerId]?.color
      : state.pieces[state.combat.defenderId]?.color;
    if (!color || controllerFor(state, color) !== "bot") return state;
    return chooseCombatAction(state, pickBotCombatAction(state));
  }
  if (controllerFor(state, state.turn) !== "bot") return state;
  const move = pickBotMove(state);
  if (!move) return state;
  const chosen = move.promotion ? { ...move, promotion: "queen" as const } : move;
  return playMove(state, chosen);
}

export function drainBot(state: GameState, maxSteps = 24): GameState {
  let current = state;
  for (let i = 0; i < maxSteps; i += 1) {
    const next = stepBot(current);
    if (next === current) break;
    current = next;
  }
  return current;
}
