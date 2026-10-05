import { cloneBoard, createInitialBoard, findKing, findPieceSquare } from "./board.ts";
import { applyCombatAction, availableActions, combatActors, openingInitiative } from "./combat.ts";
import { kitFor } from "./kits.ts";
import { hasLegalMove, inCheck, legalMoves } from "./moves.ts";
import type {
  CombatAction,
  Color,
  GameMode,
  GameState,
  Move,
  Piece,
  PieceType,
  Square,
} from "./types.ts";
import { algebraic, opponent, pieceAt, sameSquare, squareKey } from "./types.ts";

export function createGame(options: { mode: GameMode; seed?: number; humanColor?: Color } = { mode: "pvb" }): GameState {
  const { board, pieces } = createInitialBoard();
  const seed = options.seed ?? 1337;
  return {
    board,
    pieces,
    turn: "white",
    mode: options.mode,
    humanColor: options.humanColor ?? "white",
    selected: null,
    legalTargets: [],
    combat: null,
    log: [
      options.mode === "pvb"
        ? "Player vs bot. White moves first. Captures start a duel."
        : "Player vs player. Sit together — captures start a duel.",
    ],
    winner: null,
    lastMove: null,
    castling: {
      white: { king: true, queen: true },
      black: { king: true, queen: true },
    },
    enPassant: null,
    halfmove: 0,
    fullmove: 1,
    seed,
    rngState: seed,
    pendingPromotion: null,
  };
}

function indexPieces(board: GameState["board"]): Record<string, Piece> {
  const pieces: Record<string, Piece> = {};
  for (const rank of board) {
    for (const cell of rank) {
      if (cell) pieces[cell.id] = cell;
    }
  }
  return pieces;
}

function syncBoardPieces(state: GameState): GameState {
  const board = state.board.map((rank) =>
    rank.map((cell) => {
      if (!cell) return null;
      return state.pieces[cell.id] ?? cell;
    }),
  );
  return { ...state, board, pieces: indexPieces(board) };
}

function updateCastling(state: GameState, move: Move, mover: Piece): GameState["castling"] {
  const next = {
    white: { ...state.castling.white },
    black: { ...state.castling.black },
  };
  if (mover.type === "king") {
    next[mover.color] = { king: false, queen: false };
  }
  if (mover.type === "rook" && move.from.file === 0) next[mover.color].queen = false;
  if (mover.type === "rook" && move.from.file === 7) next[mover.color].king = false;
  const captured = pieceAt(state, move.to);
  if (captured?.type === "rook") {
    if (move.to.file === 0) next[captured.color].queen = false;
    if (move.to.file === 7) next[captured.color].king = false;
  }
  return next;
}

function promotePiece(piece: Piece, type: PieceType): Piece {
  const kit = kitFor(type);
  const ratio = piece.hp / piece.maxHp;
  return {
    ...piece,
    type,
    maxHp: kit.maxHp,
    maxMp: kit.maxMp,
    hp: Math.max(1, Math.round(kit.maxHp * ratio)),
    mp: kit.maxMp,
  };
}

function concludeTurn(state: GameState, moverColor: Color): GameState {
  let next: GameState = {
    ...state,
    turn: opponent(moverColor),
    selected: null,
    legalTargets: [],
    pendingPromotion: null,
    fullmove: moverColor === "black" ? state.fullmove + 1 : state.fullmove,
  };
  if (next.winner) return next;
  const whiteKing = findKing(next.board, "white");
  const blackKing = findKing(next.board, "black");
  if (!whiteKing) return { ...next, winner: "black", log: [...next.log, "White king has fallen."] };
  if (!blackKing) return { ...next, winner: "white", log: [...next.log, "Black king has fallen."] };
  if (!hasLegalMove(next)) {
    if (inCheck(next, next.turn)) {
      const winner = opponent(next.turn);
      return { ...next, winner, log: [...next.log, `Checkmate. ${winner} wins.`] };
    }
    return { ...next, winner: "draw", log: [...next.log, "Stalemate."] };
  }
  if (inCheck(next, next.turn)) {
    next = { ...next, log: [...next.log, `${next.turn} is in check.`] };
  }
  return next;
}

function applyQuietMove(state: GameState, move: Move): GameState {
  const mover = pieceAt(state, move.from);
  if (!mover) return state;
  const board = cloneBoard(state.board);
  board[move.from.rank]![move.from.file] = null;
  let piece: Piece = { ...mover };
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
  if (move.promotion) piece = promotePiece(piece, move.promotion);
  board[move.to.rank]![move.to.file] = piece;
  const pieces = indexPieces(board);
  const enPassant =
    mover.type === "pawn" && Math.abs(move.to.rank - move.from.rank) === 2
      ? { file: move.from.file, rank: (move.from.rank + move.to.rank) / 2 }
      : null;
  const next: GameState = {
    ...state,
    board,
    pieces,
    lastMove: { from: move.from, to: move.to },
    castling: updateCastling(state, move, mover),
    enPassant,
    halfmove: mover.type === "pawn" ? 0 : state.halfmove + 1,
    log: [
      ...state.log,
      `${mover.color} ${mover.type} ${algebraic(move.from)} → ${algebraic(move.to)}${
        move.castle ? " (castle)" : ""
      }${move.promotion ? ` = ${move.promotion}` : ""}`,
    ],
  };
  return concludeTurn(next, mover.color);
}

function beginCombat(state: GameState, move: Move): GameState {
  const attacker = pieceAt(state, move.from);
  const defender = move.enPassant
    ? pieceAt(state, { file: move.to.file, rank: move.from.rank })
    : pieceAt(state, move.to);
  if (!attacker || !defender) return applyQuietMove(state, move);
  const nextRole = openingInitiative(attacker, defender);
  return {
    ...state,
    selected: null,
    legalTargets: [],
    pendingPromotion: null,
    combat: {
      attackerId: attacker.id,
      defenderId: defender.id,
      from: move.from,
      to: move.to,
      nextRole,
      round: 1,
      statuses: {},
      log: [
        {
          text: `${attacker.color} ${attacker.type} challenges ${defender.color} ${defender.type} at ${algebraic(move.to)}!`,
        },
        { text: `${nextRole === "attacker" ? attacker.color : defender.color} seizes the initiative.` },
      ],
      promotion: move.promotion,
      enPassant: move.enPassant,
    },
    log: [
      ...state.log,
      `Duel: ${attacker.color} ${attacker.type} vs ${defender.color} ${defender.type} on ${algebraic(move.to)}.`,
    ],
  };
}

function resolveCombatBoard(state: GameState): GameState {
  const combat = state.combat;
  if (!combat) return state;
  const attacker = state.pieces[combat.attackerId];
  const defender = state.pieces[combat.defenderId];
  const board = cloneBoard(state.board);
  const pieces = { ...state.pieces };

  const attackerAlive = Boolean(attacker && attacker.hp > 0);
  const defenderAlive = Boolean(defender && defender.hp > 0);

  const fromPiece = board[combat.from.rank]![combat.from.file];
  if (fromPiece?.id === combat.attackerId) board[combat.from.rank]![combat.from.file] = null;
  if (combat.enPassant) {
    board[combat.from.rank]![combat.to.file] = null;
  }

  if (attackerAlive && attacker) {
    let winnerPiece = { ...attacker };
    if (combat.promotion) winnerPiece = promotePiece(winnerPiece, combat.promotion);
    board[combat.to.rank]![combat.to.file] = winnerPiece;
    pieces[winnerPiece.id] = winnerPiece;
    if (defender) delete pieces[defender.id];
  } else {
    if (attacker) delete pieces[attacker.id];
    if (defenderAlive && defender) {
      const stay = findPieceSquare(board, defender.id) ?? combat.to;
      board[stay.rank]![stay.file] = { ...defender };
      pieces[defender.id] = { ...defender };
    } else if (defender) {
      const stay = findPieceSquare(board, defender.id);
      if (stay) board[stay.rank]![stay.file] = null;
      delete pieces[defender.id];
    }
  }

  const moverColor = attacker?.color ?? state.turn;
  const next: GameState = {
    ...state,
    board,
    pieces,
    combat: null,
    lastMove: { from: combat.from, to: combat.to },
    enPassant: null,
    halfmove: 0,
    log: [
      ...state.log,
      attackerAlive
        ? `${attacker!.color} ${attacker!.type} wins the duel and holds ${algebraic(combat.to)}.`
        : `${defender?.color ?? "defender"} holds the square.`,
    ],
  };
  return concludeTurn(syncBoardPieces(next), moverColor);
}

export function playMove(state: GameState, move: Move): GameState {
  if (state.winner || state.combat) return state;
  const legal = legalMoves(state, move.from).filter(
    (item) =>
      sameSquare(item.to, move.to) &&
      Boolean(item.castle) === Boolean(move.castle) &&
      Boolean(item.enPassant) === Boolean(move.enPassant) &&
      (!move.promotion || item.promotion === move.promotion),
  );
  const chosen = legal[0];
  if (!chosen) return state;
  if (chosen.capture) return beginCombat(state, chosen);
  return applyQuietMove(state, chosen);
}

export function selectSquare(state: GameState, square: Square): GameState {
  if (state.winner || state.combat) return state;
  const piece = pieceAt(state, square);
  if (state.selected && state.legalTargets.some((target) => sameSquare(target, square))) {
    const move = legalMoves(state, state.selected).find((item) => sameSquare(item.to, square));
    if (!move) return state;
    const needsChoice = move.promotion && state.mode === "pvp";
    if (move.promotion && !needsChoice) {
      return playMove(state, { ...move, promotion: "queen" });
    }
    if (move.promotion) {
      return { ...state, pendingPromotion: { from: state.selected, to: square }, legalTargets: [] };
    }
    return playMove(state, move);
  }
  if (piece && piece.color === state.turn) {
    const targets = uniqueSquares(legalMoves(state, square).map((move) => move.to));
    return { ...state, selected: square, legalTargets: targets, pendingPromotion: null };
  }
  return { ...state, selected: null, legalTargets: [], pendingPromotion: null };
}

export function choosePromotion(state: GameState, type: PieceType): GameState {
  if (!state.pendingPromotion) return state;
  const move = legalMoves(state, state.pendingPromotion.from).find(
    (item) => sameSquare(item.to, state.pendingPromotion!.to) && item.promotion === type,
  );
  if (!move) return state;
  return playMove(state, move);
}

export function chooseCombatAction(state: GameState, action: CombatAction): GameState {
  if (!state.combat || state.winner) return state;
  const applied = applyCombatAction(state.pieces, state.combat, action, state.rngState);
  const next = syncBoardPieces({
    ...state,
    pieces: applied.pieces,
    combat: applied.combat,
    rngState: applied.rngState,
  });
  if (applied.over) return resolveCombatBoard(next);
  return next;
}

export function combatActionList(state: GameState): CombatAction[] {
  if (!state.combat) return [];
  const { actor } = combatActors(state.pieces, state.combat);
  return availableActions(actor);
}

export function actingCombatColor(state: GameState): Color | null {
  if (!state.combat) return null;
  const { actor } = combatActors(state.pieces, state.combat);
  return actor.color;
}

export function controllerFor(state: GameState, color: Color): "human" | "bot" {
  if (state.mode === "pvp") return "human";
  return color === state.humanColor ? "human" : "bot";
}

function uniqueSquares(squares: Square[]): Square[] {
  const seen = new Set<string>();
  const out: Square[] = [];
  for (const square of squares) {
    const key = squareKey(square);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(square);
  }
  return out;
}

export { legalMoves, inCheck, hasLegalMove };
