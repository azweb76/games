import { kitFor } from "./kits.ts";
import type { Color, GameState, Piece, PieceType, Square } from "./types.ts";

let nextId = 1;

export function resetPieceIds(start = 1): void {
  nextId = start;
}

function makePiece(type: PieceType, color: Color): Piece {
  const kit = kitFor(type);
  const id = `${color}-${type}-${nextId}`;
  nextId += 1;
  return {
    id,
    type,
    color,
    hp: kit.maxHp,
    maxHp: kit.maxHp,
    mp: kit.maxMp,
    maxMp: kit.maxMp,
  };
}

function place(
  board: Array<Array<Piece | null>>,
  pieces: Record<string, Piece>,
  rank: number,
  file: number,
  type: PieceType,
  color: Color,
): void {
  const piece = makePiece(type, color);
  board[rank]![file] = piece;
  pieces[piece.id] = piece;
}

export function createInitialBoard(): Pick<GameState, "board" | "pieces"> {
  resetPieceIds();
  const board: Array<Array<Piece | null>> = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  );
  const pieces: Record<string, Piece> = {};
  const back: PieceType[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  for (let file = 0; file < 8; file += 1) {
    place(board, pieces, 0, file, back[file]!, "white");
    place(board, pieces, 1, file, "pawn", "white");
    place(board, pieces, 6, file, "pawn", "black");
    place(board, pieces, 7, file, back[file]!, "black");
  }
  return { board, pieces };
}

export function cloneBoard(board: Array<Array<Piece | null>>): Array<Array<Piece | null>> {
  return board.map((rank) => rank.map((piece) => (piece ? { ...piece } : null)));
}

export function findPieceSquare(board: Array<Array<Piece | null>>, pieceId: string): Square | null {
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      if (board[rank]![file]?.id === pieceId) return { file, rank };
    }
  }
  return null;
}

export function findKing(board: Array<Array<Piece | null>>, color: Color): Square | null {
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = board[rank]![file];
      if (piece?.type === "king" && piece.color === color) return { file, rank };
    }
  }
  return null;
}
