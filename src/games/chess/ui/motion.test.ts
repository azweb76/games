import { describe, expect, it } from "vitest";
import { createGame, playMove } from "../engine/index.ts";
import { detectMotion, knightWaypoints, walkWaypoints, motionDurationMs } from "./motion.ts";

describe("board motion", () => {
  it("walks a quiet pawn move from origin to destination", () => {
    const prev = createGame({ mode: "pvp", seed: 1 });
    const next = playMove(prev, { from: { file: 4, rank: 1 }, to: { file: 4, rank: 3 }, capture: false });
    const motion = detectMotion(prev, next);
    expect(motion).toEqual([
      {
        type: "walk",
        pieceId: next.lastMove && next.board[3]![4] ? next.board[3]![4]!.id : "",
        pieceType: "pawn",
        from: { file: 4, rank: 1 },
        to: { file: 4, rank: 3 },
        capture: false,
      },
    ]);
  });

  it("walks onto the enemy square then auto-fights when a capture lands", () => {
    let game = createGame({ mode: "pvp", seed: 7 });
    game = playMove(game, { from: { file: 4, rank: 1 }, to: { file: 4, rank: 3 }, capture: false });
    game = playMove(game, { from: { file: 3, rank: 6 }, to: { file: 3, rank: 4 }, capture: false });
    const prev = game;
    const next = playMove(game, { from: { file: 4, rank: 3 }, to: { file: 3, rank: 4 }, capture: true });
    const motion = detectMotion(prev, next);
    expect(motion[0]).toMatchObject({
      type: "walk",
      from: { file: 4, rank: 3 },
      to: { file: 3, rank: 4 },
      capture: true,
    });
    expect(motion[1]).toMatchObject({ type: "attack", style: "strike" });
    expect(next.combat).toBeNull();
    expect(next.pieces[prev.board[4]![3]!.id]).toBeUndefined();
  });

  it("snapshots both fighters for the melee even after the defender is gone", () => {
    let game = createGame({ mode: "pvp", seed: 7 });
    game = playMove(game, { from: { file: 4, rank: 1 }, to: { file: 4, rank: 3 }, capture: false });
    game = playMove(game, { from: { file: 3, rank: 6 }, to: { file: 3, rank: 4 }, capture: false });
    const prev = game;
    const next = playMove(game, { from: { file: 4, rank: 3 }, to: { file: 3, rank: 4 }, capture: true });
    const motion = detectMotion(prev, next);
    const attack = motion.find((event) => event.type === "attack");
    expect(attack?.type).toBe("attack");
    if (attack?.type === "attack") {
      expect(attack.actorPiece.color).toBe("white");
      expect(attack.foePiece.color).toBe("black");
      expect(attack.from).toEqual({ file: 4, rank: 3 });
      expect(attack.to).toEqual({ file: 3, rank: 4 });
    }
  });

  it("uses an L-shaped path for knights", () => {
    const points = knightWaypoints({ file: 1, rank: 0 }, { file: 2, rank: 2 });
    expect(points).toEqual([
      { file: 1, rank: 2 },
      { file: 2, rank: 2 },
    ]);
    expect(walkWaypoints("bishop", { file: 2, rank: 0 }, { file: 5, rank: 3 })).toEqual([{ file: 5, rank: 3 }]);
  });

  it("scales walk time with distance", () => {
    expect(motionDurationMs({ file: 0, rank: 0 }, { file: 0, rank: 1 })).toBeLessThan(
      motionDurationMs({ file: 0, rank: 0 }, { file: 0, rank: 6 }),
    );
  });
});
