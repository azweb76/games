import type { GameState, Piece, PieceType, Square } from "../engine/index.ts";
import { pieceAt, sameSquare } from "../engine/index.ts";

export type MotionStyle = "strike" | "spell";

export type MotionEvent =
  | {
      type: "walk";
      pieceId: string;
      pieceType: PieceType;
      from: Square;
      to: Square;
      capture: boolean;
      foeId?: string;
    }
  | {
      type: "attack";
      actorId: string;
      foeId: string;
      style: MotionStyle;
      from: Square;
      to: Square;
      actorPiece: Piece;
      foePiece: Piece;
    };

function pieceSquare(state: GameState, pieceId: string): Square | null {
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      if (state.board[rank]![file]?.id === pieceId) return { file, rank };
    }
  }
  return null;
}

function rookCastleWalk(from: Square, to: Square): { from: Square; to: Square } | null {
  if (Math.abs(to.file - from.file) !== 2 || from.rank !== to.rank) return null;
  if (to.file === 6) {
    return { from: { file: 7, rank: from.rank }, to: { file: 5, rank: from.rank } };
  }
  if (to.file === 2) {
    return { from: { file: 0, rank: from.rank }, to: { file: 3, rank: from.rank } };
  }
  return null;
}

function lastCombatStyle(state: GameState): MotionStyle {
  const text = state.combat?.log.at(-1)?.text ?? "";
  return /cast/i.test(text) ? "spell" : "strike";
}

function meleeFromCapture(prev: GameState, next: GameState): MotionEvent[] | null {
  if (!next.lastMove) return null;
  const vanished = Object.values(prev.pieces).filter((piece) => !next.pieces[piece.id]);
  const attacker = pieceAt(next, next.lastMove.to);
  const defender = vanished[0];
  if (!attacker || !defender || vanished.length === 0) return null;
  return [
    {
      type: "walk",
      pieceId: attacker.id,
      pieceType: attacker.type,
      from: next.lastMove.from,
      to: next.lastMove.to,
      capture: true,
      foeId: defender.id,
    },
    {
      type: "attack",
      actorId: attacker.id,
      foeId: defender.id,
      style: "strike",
      from: next.lastMove.from,
      to: next.lastMove.to,
      actorPiece: attacker,
      foePiece: defender,
    },
  ];
}

export function detectMotion(prev: GameState, next: GameState): MotionEvent[] {
  const events: MotionEvent[] = [];

  if (!prev.combat && next.combat) {
    const attacker = next.pieces[next.combat.attackerId];
    const defender = next.pieces[next.combat.defenderId];
    events.push({
      type: "walk",
      pieceId: next.combat.attackerId,
      pieceType: attacker?.type ?? "pawn",
      from: next.combat.from,
      to: next.combat.to,
      capture: true,
      foeId: next.combat.defenderId,
    });
    if (attacker && defender) {
      events.push({
        type: "attack",
        actorId: next.combat.attackerId,
        foeId: next.combat.defenderId,
        style: "strike",
        from: next.combat.from,
        to: next.combat.to,
        actorPiece: attacker,
        foePiece: defender,
      });
    }
    return events;
  }

  if (
    prev.combat &&
    next.combat &&
    next.combat.log.length > prev.combat.log.length
  ) {
    const actorId = prev.combat.nextRole === "attacker" ? prev.combat.attackerId : prev.combat.defenderId;
    const foeId = actorId === prev.combat.attackerId ? prev.combat.defenderId : prev.combat.attackerId;
    const actorPiece = next.pieces[actorId] ?? prev.pieces[actorId];
    const foePiece = next.pieces[foeId] ?? prev.pieces[foeId];
    if (actorPiece && foePiece) {
      events.push({
        type: "attack",
        actorId,
        foeId,
        style: lastCombatStyle(next),
        from: prev.combat.from,
        to: prev.combat.to,
        actorPiece,
        foePiece,
      });
    }
    return events;
  }

  const captureMelee = meleeFromCapture(prev, next);
  if (captureMelee) return captureMelee;

  for (const [pieceId, piece] of Object.entries(next.pieces)) {
    const before = pieceSquare(prev, pieceId);
    const after = pieceSquare(next, pieceId);
    if (!before || !after || sameSquare(before, after)) continue;
    events.push({
      type: "walk",
      pieceId,
      pieceType: piece.type,
      from: before,
      to: after,
      capture: false,
    });
  }

  if (events.length === 0 && next.lastMove && (!prev.lastMove || !sameSquare(prev.lastMove.from, next.lastMove.from) || !sameSquare(prev.lastMove.to, next.lastMove.to))) {
    const occupant = pieceAt(next, next.lastMove.to);
    if (occupant) {
      events.push({
        type: "walk",
        pieceId: occupant.id,
        pieceType: occupant.type,
        from: next.lastMove.from,
        to: next.lastMove.to,
        capture: false,
      });
    }
  }

  return events;
}

export function squareOffset(square: Square): { x: number; y: number } {
  return { x: square.file * 12.5, y: (7 - square.rank) * 12.5 };
}

export function knightWaypoints(from: Square, to: Square): Square[] {
  const df = to.file - from.file;
  const dr = to.rank - from.rank;
  if (Math.abs(df) === 2 && Math.abs(dr) === 1) {
    return [{ file: from.file + df, rank: from.rank }, to];
  }
  if (Math.abs(df) === 1 && Math.abs(dr) === 2) {
    return [{ file: from.file, rank: from.rank + dr }, to];
  }
  return [to];
}

export function walkWaypoints(pieceType: PieceType, from: Square, to: Square): Square[] {
  if (pieceType === "knight") return knightWaypoints(from, to);
  return [to];
}

export function motionDurationMs(from: Square, to: Square): number {
  const dist = Math.max(1, Math.abs(to.file - from.file) + Math.abs(to.rank - from.rank));
  return Math.min(1800, 380 + dist * 240);
}

export function reducedMotion(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function findActorSquare(state: GameState, pieceId: string, fallback?: Square): Square {
  return pieceSquare(state, pieceId) ?? fallback ?? { file: 0, rank: 0 };
}

export function describePieceMotion(piece: Piece, to: Square): string {
  return `${piece.color} ${piece.type} walks toward ${to.file},${to.rank}`;
}
