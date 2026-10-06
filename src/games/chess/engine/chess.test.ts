import { describe, expect, it } from "vitest";
import {
  controllerFor,
  createGame,
  drainBot,
  kitFor,
  legalMoves,
  pickBotMove,
  playMove,
  selectSquare,
  spellFor,
} from "./index.ts";
import { pieceAt } from "./types.ts";
import { applyCombatAction, availableActions, openingInitiative } from "./combat.ts";
import { inCheck } from "./moves.ts";

describe("Blood & Board engine", () => {
  it("sets up a standard army with independent combat kits", () => {
    const game = createGame({ mode: "pvp", seed: 1 });
    expect(game.board[0]![4]?.type).toBe("king");
    expect(game.board[7]![4]?.type).toBe("king");
    expect(game.board[1]!.every((piece) => piece?.type === "pawn")).toBe(true);
    expect(kitFor("knight").stats.spd).toBeGreaterThan(kitFor("rook").stats.spd);
    expect(kitFor("bishop").spells.some((spell) => spell.id === "arcane-bolt")).toBe(true);
    expect(kitFor("pawn").weapon).toBe("spear");
    expect(kitFor("knight").weapon).toBe("lance");
  });

  it("generates legal pawn and knight moves from the opening", () => {
    const game = createGame({ mode: "pvp", seed: 1 });
    const pawnMoves = legalMoves(game, { file: 4, rank: 1 });
    expect(pawnMoves.map((move) => move.to)).toEqual([
      { file: 4, rank: 2 },
      { file: 4, rank: 3 },
    ]);
    const knightMoves = legalMoves(game, { file: 1, rank: 0 });
    expect(knightMoves).toHaveLength(2);
    expect(knightMoves.some((move) => move.to.file === 2 && move.to.rank === 2)).toBe(true);
  });

  it("lets the attacker instantly win a capture melee", () => {
    let game = createGame({ mode: "pvp", seed: 7 });
    game = playMove(game, { from: { file: 4, rank: 1 }, to: { file: 4, rank: 3 }, capture: false });
    game = playMove(game, { from: { file: 3, rank: 6 }, to: { file: 3, rank: 4 }, capture: false });
    const defender = pieceAt(game, { file: 3, rank: 4 });
    game = playMove(game, { from: { file: 4, rank: 3 }, to: { file: 3, rank: 4 }, capture: true });
    expect(game.combat).toBeNull();
    expect(pieceAt(game, { file: 3, rank: 4 })?.color).toBe("white");
    expect(pieceAt(game, { file: 3, rank: 4 })?.type).toBe("pawn");
    expect(pieceAt(game, { file: 4, rank: 3 })).toBeNull();
    if (defender) expect(game.pieces[defender.id]).toBeUndefined();
    expect(game.turn).toBe("black");
    expect(game.log.at(-1)).toMatch(/cuts them down/);
  });

  it("never lets the defender survive an attacking capture", () => {
    let game = createGame({ mode: "pvp", seed: 11 });
    game = playMove(game, { from: { file: 4, rank: 1 }, to: { file: 4, rank: 3 }, capture: false });
    game = playMove(game, { from: { file: 3, rank: 6 }, to: { file: 3, rank: 4 }, capture: false });
    const attackerId = pieceAt(game, { file: 4, rank: 3 })!.id;
    const defenderId = pieceAt(game, { file: 3, rank: 4 })!.id;
    game = playMove(game, { from: { file: 4, rank: 3 }, to: { file: 3, rank: 4 }, capture: true });
    expect(game.pieces[attackerId]).toBeDefined();
    expect(game.pieces[defenderId]).toBeUndefined();
    expect(game.turn).toBe("black");
  });

  it("lets a bishop spend MP on unique magic", () => {
    const bishop = {
      id: "w-b",
      type: "bishop" as const,
      color: "white" as const,
      hp: 30,
      maxHp: 30,
      mp: 22,
      maxMp: 22,
    };
    const pawn = {
      id: "b-p",
      type: "pawn" as const,
      color: "black" as const,
      hp: 28,
      maxHp: 28,
      mp: 10,
      maxMp: 10,
    };
    const pieces = { [bishop.id]: bishop, [pawn.id]: pawn };
    const combat = {
      attackerId: bishop.id,
      defenderId: pawn.id,
      from: { file: 0, rank: 0 },
      to: { file: 1, rank: 1 },
      nextRole: "attacker" as const,
      round: 1,
      statuses: {},
      log: [],
    };
    expect(spellFor("bishop", "arcane-bolt")?.mpCost).toBe(6);
    const actions = availableActions(bishop);
    expect(actions.some((action) => action.kind === "spell" && action.spellId === "arcane-bolt")).toBe(true);
    const result = applyCombatAction(pieces, combat, { kind: "spell", spellId: "arcane-bolt" }, 99);
    expect(result.pieces[bishop.id]!.mp).toBe(16);
    expect(result.pieces[pawn.id]!.hp).toBeLessThan(28);
  });

  it("opens combat with the faster piece", () => {
    const knight = {
      id: "n",
      type: "knight" as const,
      color: "white" as const,
      hp: 36,
      maxHp: 36,
      mp: 12,
      maxMp: 12,
    };
    const rook = {
      id: "r",
      type: "rook" as const,
      color: "black" as const,
      hp: 50,
      maxHp: 50,
      mp: 10,
      maxMp: 10,
    };
    expect(openingInitiative(knight, rook)).toBe("attacker");
    expect(openingInitiative(rook, knight)).toBe("defender");
  });

  it("never lets the bot play an illegal move", () => {
    const game = createGame({ mode: "pvb", seed: 42 });
    const move = pickBotMove(game);
    expect(move).not.toBeNull();
    const legal = legalMoves(game);
    expect(legal.some((item) => item.from.file === move!.from.file && item.from.rank === move!.from.rank && item.to.file === move!.to.file && item.to.rank === move!.to.rank)).toBe(true);
  });

  it("treats only the opposite color as the bot in PvB", () => {
    const game = createGame({ mode: "pvb", humanColor: "white", seed: 1 });
    expect(controllerFor(game, "white")).toBe("human");
    expect(controllerFor(game, "black")).toBe("bot");
    const pvp = createGame({ mode: "pvp", seed: 1 });
    expect(controllerFor(pvp, "black")).toBe("human");
  });

  it("lets the bot capture without opening a duel menu", () => {
    let game = createGame({ mode: "pvb", seed: 3 });
    game = playMove(game, { from: { file: 4, rank: 1 }, to: { file: 4, rank: 3 }, capture: false });
    game = drainBot(game);
    game = playMove(game, { from: { file: 4, rank: 3 }, to: { file: 4, rank: 4 }, capture: false });
    game = drainBot(game);
    expect(game.combat).toBeNull();
    expect(game.turn === "white" || game.winner !== null).toBe(true);
  });

  it("still recognizes check after quiet moves", () => {
    let game = createGame({ mode: "pvp", seed: 8 });
    game = playMove(game, { from: { file: 5, rank: 1 }, to: { file: 5, rank: 2 }, capture: false });
    game = playMove(game, { from: { file: 4, rank: 6 }, to: { file: 4, rank: 4 }, capture: false });
    game = playMove(game, { from: { file: 6, rank: 1 }, to: { file: 6, rank: 3 }, capture: false });
    game = playMove(game, { from: { file: 3, rank: 7 }, to: { file: 7, rank: 3 }, capture: false });
    expect(inCheck(game, "white")).toBe(true);
  });

  it("selects a friendly piece and lists capture targets", () => {
    let game = createGame({ mode: "pvp", seed: 9 });
    game = playMove(game, { from: { file: 4, rank: 1 }, to: { file: 4, rank: 3 }, capture: false });
    game = playMove(game, { from: { file: 3, rank: 6 }, to: { file: 3, rank: 4 }, capture: false });
    game = selectSquare(game, { file: 4, rank: 3 });
    expect(game.selected).toEqual({ file: 4, rank: 3 });
    expect(game.legalTargets.some((sq) => sq.file === 3 && sq.rank === 4)).toBe(true);
  });
});
