import { chessUi } from "./ui/app.ts";
import type { GameManifest } from "../types.ts";

export const chessManifest: GameManifest = {
  id: "chess",
  title: "Blood & Board",
  tagline: "Chess, then a duel",
  description:
    "Standard movement, but every capture becomes a fight. Each piece brings unique steel, armor, and magic. Play locally against a friend or a bot.",
  mount: chessUi,
};
