import type { GameManifest } from "./types.ts";
import { chessManifest } from "./chess/manifest.ts";

export const games: readonly GameManifest[] = [chessManifest];

export function getGame(id: string): GameManifest | undefined {
  return games.find((game) => game.id === id);
}
