export type Color = "white" | "black";
export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";
export type GameMode = "pvp" | "pvb";

export interface Square {
  file: number;
  rank: number;
}

export interface Piece {
  id: string;
  type: PieceType;
  color: Color;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
}

export interface Move {
  from: Square;
  to: Square;
  capture: boolean;
  promotion?: PieceType;
  castle?: "king" | "queen";
  enPassant?: boolean;
}

export type CombatRole = "attacker" | "defender";

export type CombatAction =
  | { kind: "strike" }
  | { kind: "spell"; spellId: string };

export type StatusId = "stunned" | "fortified" | "focused" | "lastStand" | "blessed";

export interface StatusEffect {
  id: StatusId;
  remaining: number;
  potency?: number;
}

export interface CombatLogEntry {
  text: string;
}

export interface CombatState {
  attackerId: string;
  defenderId: string;
  from: Square;
  to: Square;
  nextRole: CombatRole;
  round: number;
  statuses: Record<string, StatusEffect[]>;
  log: CombatLogEntry[];
  promotion?: PieceType;
  enPassant?: boolean;
}

export interface GameState {
  board: Array<Array<Piece | null>>;
  pieces: Record<string, Piece>;
  turn: Color;
  mode: GameMode;
  humanColor: Color;
  selected: Square | null;
  legalTargets: Square[];
  combat: CombatState | null;
  log: string[];
  winner: Color | "draw" | null;
  lastMove: { from: Square; to: Square } | null;
  castling: {
    white: { king: boolean; queen: boolean };
    black: { king: boolean; queen: boolean };
  };
  enPassant: Square | null;
  halfmove: number;
  fullmove: number;
  seed: number;
  rngState: number;
  pendingPromotion: { from: Square; to: Square } | null;
}

export function opponent(color: Color): Color {
  return color === "white" ? "black" : "white";
}

export function squareKey(square: Square): string {
  return `${square.file},${square.rank}`;
}

export function inBounds(square: Square): boolean {
  return square.file >= 0 && square.file < 8 && square.rank >= 0 && square.rank < 8;
}

export function sameSquare(a: Square, b: Square): boolean {
  return a.file === b.file && a.rank === b.rank;
}

export function algebraic(square: Square): string {
  return `${"abcdefgh"[square.file]}${square.rank + 1}`;
}

export function pieceAt(state: GameState, square: Square): Piece | null {
  return state.board[square.rank]?.[square.file] ?? null;
}
