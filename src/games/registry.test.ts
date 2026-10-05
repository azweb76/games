import { describe, expect, it } from "vitest";
import { games, getGame } from "./registry.ts";
import { chessManifest } from "./chess/manifest.ts";

describe("game isolation", () => {
  it("registers each game by its own id without sharing manifests", () => {
    expect(games.map((game) => game.id)).toEqual(["chess"]);
    expect(getGame("chess")).toBe(chessManifest);
    expect(getGame("chess")?.title).toBe("Blood & Board");
    expect(getGame("not-a-game")).toBeUndefined();
  });
});
