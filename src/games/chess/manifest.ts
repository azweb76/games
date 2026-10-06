import { chessUi } from "./ui/app.ts";
import type { GameManifest } from "../types.ts";

export const chessManifest: GameManifest = {
  id: "chess",
  title: "Blood & Board",
  tagline: "Chess, then automatic melee",
  description:
    "Standard movement. Captures auto-fight on the board with medieval weapons, and the attacker always wins. Play locally against a friend or a bot.",
  mount: chessUi,
};
