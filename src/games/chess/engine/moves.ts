import { cloneBoard, findKing } from "./board.ts";
import type { Color, GameState, Move, Piece, PieceType, Square } from "./types.ts";
import { inBounds, opponent, pieceAt, sameSquare } from "./types.ts";

const KNIGHT_DELTAS: Array<[number, number]> = [
  [1, 2],
  [2, 1],
  [-1, 2],
  [-2, 1],
  [1, -2],
  [2, -1],
  [-1, -2],
  [-2, -1],
];

const KING_DELTAS: Array<[number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

function slide(
  board: Array<Array<Piece | null>>,
  from: Square,
  deltas: Array<[number, number]>,
  color: Color,
): Square[] {
  const squares: Square[] = [];
  for (const [df, dr] of deltas) {
    let file = from.file + df;
    let rank = from.rank + dr;
    while (inBounds({ file, rank })) {
      const occupant = board[rank]![file];
      if (!occupant) {
        squares.push({ file, rank });
      } else {
        if (occupant.color !== color) squares.push({ file, rank });
        break;
      }
      file += df;
      rank += dr;
    }
  }
  return squares;
}

function pawnPushes(board: Array<Array<Piece | null>>, from: Square, color: Color): Square[] {
  const dir = color === "white" ? 1 : -1;
  const startRank = color === "white" ? 1 : 6;
  const one: Square = { file: from.file, rank: from.rank + dir };
  if (!inBounds(one) || board[one.rank]![one.file]) return [];
  const moves = [one];
  const two: Square = { file: from.file, rank: from.rank + dir * 2 };
  if (from.rank === startRank && inBounds(two) && !board[two.rank]![two.file]) moves.push(two);
  return moves;
}

function pawnCaptures(
  state: GameState,
  from: Square,
  color: Color,
): Array<{ to: Square; enPassant?: boolean }> {
  const dir = color === "white" ? 1 : -1;
  const results: Array<{ to: Square; enPassant?: boolean }> = [];
  for (const df of [-1, 1]) {
    const to = { file: from.file + df, rank: from.rank + dir };
    if (!inBounds(to)) continue;
    const occupant = pieceAt(state, to);
    if (occupant && occupant.color !== color) results.push({ to });
    else if (state.enPassant && sameSquare(to, state.enPassant)) results.push({ to, enPassant: true });
  }
  return results;
}

function pseudoMovesFrom(state: GameState, from: Square): Move[] {
  const piece = pieceAt(state, from);
  if (!piece) return [];
  const moves: Move[] = [];
  const add = (to: Square, extra: Partial<Move> = {}): void => {
    const capture = extra.enPassant ? true : Boolean(pieceAt(state, to));
    moves.push({ from, to, capture, ...extra });
  };

  if (piece.type === "pawn") {
    for (const to of pawnPushes(state.board, from, piece.color)) add(to);
    for (const cap of pawnCaptures(state, from, piece.color)) add(cap.to, { enPassant: cap.enPassant });
  } else if (piece.type === "knight") {
    for (const [df, dr] of KNIGHT_DELTAS) {
      const to = { file: from.file + df, rank: from.rank + dr };
      if (!inBounds(to)) continue;
      const occupant = pieceAt(state, to);
      if (!occupant || occupant.color !== piece.color) add(to);
    }
  } else if (piece.type === "bishop") {
    for (const to of slide(state.board, from, [[1, 1], [1, -1], [-1, 1], [-1, -1]], piece.color)) add(to);
  } else if (piece.type === "rook") {
    for (const to of slide(state.board, from, [[1, 0], [-1, 0], [0, 1], [0, -1]], piece.color)) add(to);
  } else if (piece.type === "queen") {
    for (const to of slide(
      state.board,
      from,
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ],
      piece.color,
    )) {
      add(to);
    }
  } else if (piece.type === "king") {
    for (const [df, dr] of KING_DELTAS) {
      const to = { file: from.file + df, rank: from.rank + dr };
      if (!inBounds(to)) continue;
      const occupant = pieceAt(state, to);
      if (!occupant || occupant.color !== piece.color) add(to);
    }
    const rights = state.castling[piece.color];
    const rank = piece.color === "white" ? 0 : 7;
    if (from.file === 4 && from.rank === rank) {
      if (rights.king && !pieceAt(state, { file: 5, rank }) && !pieceAt(state, { file: 6, rank })) {
        add({ file: 6, rank }, { castle: "king" });
      }
      if (
        rights.queen &&
        !pieceAt(state, { file: 3, rank }) &&
        !pieceAt(state, { file: 2, rank }) &&
        !pieceAt(state, { file: 1, rank })
      ) {
        add({ file: 2, rank }, { castle: "queen" });
      }
    }
  }
  return moves;
}

export function isSquareAttacked(state: GameState, square: Square, by: Color): boolean {
  const probe: GameState = {
    ...state,
    turn: by,
  };
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = probe.board[rank]![file];
      if (!piece || piece.color !== by) continue;
      const moves = pseudoMovesFrom(probe, { file, rank }).filter((move) => {
        if (move.castle) return false;
        if (piece.type === "pawn") return move.capture;
        return true;
      });
      if (moves.some((move) => sameSquare(move.to, square))) return true;
    }
  }
  return false;
}

function applyOptimistic(state: GameState, move: Move): GameState {
  const board = cloneBoard(state.board);
  const piece = board[move.from.rank]![move.from.file];
  if (!piece) return state;
  board[move.from.rank]![move.from.file] = null;
  if (move.enPassant) {
    const dir = piece.color === "white" ? -1 : 1;
    board[move.to.rank + dir]![move.to.file] = null;
  }
  if (move.castle) {
    const rank = move.from.rank;
    if (move.castle === "king") {
      board[rank]![5] = board[rank]![7] ?? null;
      board[rank]![7] = null;
    } else {
      board[rank]![3] = board[rank]![0] ?? null;
      board[rank]![0] = null;
    }
  }
  board[move.to.rank]![move.to.file] = piece;
  return { ...state, board };
}

export function legalMoves(state: GameState, from?: Square): Move[] {
  const origins: Square[] = [];
  if (from) origins.push(from);
  else {
    for (let rank = 0; rank < 8; rank += 1) {
      for (let file = 0; file < 8; file += 1) {
        const piece = state.board[rank]![file];
        if (piece?.color === state.turn) origins.push({ file, rank });
      }
    }
  }

  const results: Move[] = [];
  for (const origin of origins) {
    const piece = pieceAt(state, origin);
    if (!piece || piece.color !== state.turn) continue;
    for (const move of pseudoMovesFrom(state, origin)) {
      if (move.castle) {
        const through = move.castle === "king"
          ? [{ file: 4, rank: origin.rank }, { file: 5, rank: origin.rank }, { file: 6, rank: origin.rank }]
          : [{ file: 4, rank: origin.rank }, { file: 3, rank: origin.rank }, { file: 2, rank: origin.rank }];
        const enemy = opponent(piece.color);
        if (through.some((sq) => isSquareAttacked(state, sq, enemy))) continue;
      }
      const next = applyOptimistic(state, move);
      const king = findKing(next.board, piece.color);
      if (!king) continue;
      if (isSquareAttacked(next, king, opponent(piece.color))) continue;
      if (piece.type === "pawn" && (move.to.rank === 0 || move.to.rank === 7) && !move.promotion) {
        for (const promotion of ["queen", "rook", "bishop", "knight"] as PieceType[]) {
          results.push({ ...move, promotion });
        }
      } else {
        results.push(move);
      }
    }
  }
  return results;
}

export function hasLegalMove(state: GameState): boolean {
  return legalMoves(state).length > 0;
}

export function inCheck(state: GameState, color: Color): boolean {
  const king = findKing(state.board, color);
  if (!king) return false;
  return isSquareAttacked(state, king, opponent(color));
}
