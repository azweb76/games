import type { PieceType, StatusId } from "./types.ts";

export interface CombatStats {
  atk: number;
  def: number;
  mag: number;
  spd: number;
}

export type SpellEffect =
  | { type: "damage"; power: number }
  | { type: "heal"; power: number }
  | { type: "status"; status: StatusId; duration: number; potency?: number };

export interface SpellDef {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  effects: SpellEffect[];
}

export interface PieceKit {
  maxHp: number;
  maxMp: number;
  stats: CombatStats;
  glyph: { white: string; black: string };
  title: string;
  fightingStyle: string;
  weapon: string;
  spells: SpellDef[];
}

export const PIECE_KITS: Record<PieceType, PieceKit> = {
  pawn: {
    maxHp: 28,
    maxMp: 10,
    stats: { atk: 8, def: 6, mag: 5, spd: 7 },
    glyph: { white: "♙", black: "♟" },
    title: "Militia",
    fightingStyle: "Spear and round shield. They charge, clash, and the attacker always finishes the foe.",
    weapon: "spear",
    spells: [
      {
        id: "shield-bash",
        name: "Shield Bash",
        description: "Deal light magic damage and stun the foe for 1 action.",
        mpCost: 4,
        effects: [
          { type: "damage", power: 7 },
          { type: "status", status: "stunned", duration: 1 },
        ],
      },
      {
        id: "rally",
        name: "Rally",
        description: "Recover a burst of stamina.",
        mpCost: 5,
        effects: [{ type: "heal", power: 10 }],
      },
    ],
  },
  knight: {
    maxHp: 36,
    maxMp: 12,
    stats: { atk: 14, def: 8, mag: 6, spd: 15 },
    glyph: { white: "♘", black: "♞" },
    title: "Cavalier",
    fightingStyle: "Lance-first cavalry. They gallop in and pin the defender in one pass.",
    weapon: "lance",
    spells: [
      {
        id: "lunge",
        name: "Lunge",
        description: "A piercing charge that ignores poise.",
        mpCost: 5,
        effects: [{ type: "damage", power: 16 }],
      },
      {
        id: "feint",
        name: "Feint",
        description: "The next strike is a guaranteed critical hit.",
        mpCost: 4,
        effects: [{ type: "status", status: "focused", duration: 2, potency: 1 }],
      },
    ],
  },
  bishop: {
    maxHp: 30,
    maxMp: 22,
    stats: { atk: 6, def: 7, mag: 16, spd: 10 },
    glyph: { white: "♗", black: "♝" },
    title: "Theurge",
    fightingStyle: "Crozier staff and mitre. They smash, then the attacker stands over the fallen.",
    weapon: "staff",
    spells: [
      {
        id: "arcane-bolt",
        name: "Arcane Bolt",
        description: "A focused beam of cathedral fire.",
        mpCost: 6,
        effects: [{ type: "damage", power: 18 }],
      },
      {
        id: "bless",
        name: "Bless",
        description: "Heal and gain regenerating grace.",
        mpCost: 7,
        effects: [
          { type: "heal", power: 12 },
          { type: "status", status: "blessed", duration: 3, potency: 3 },
        ],
      },
    ],
  },
  rook: {
    maxHp: 50,
    maxMp: 10,
    stats: { atk: 12, def: 16, mag: 5, spd: 5 },
    glyph: { white: "♖", black: "♜" },
    title: "Siege Tower",
    fightingStyle: "Warhammer and battlements. Slow, armored, and the charge always topples the square.",
    weapon: "maul",
    spells: [
      {
        id: "siege-crash",
        name: "Siege Crash",
        description: "Smash through armor with raw mass.",
        mpCost: 5,
        effects: [{ type: "damage", power: 14 }],
      },
      {
        id: "fortify",
        name: "Fortify",
        description: "Raise a stone ward that blunts incoming blows.",
        mpCost: 4,
        effects: [{ type: "status", status: "fortified", duration: 3, potency: 8 }],
      },
    ],
  },
  queen: {
    maxHp: 42,
    maxMp: 18,
    stats: { atk: 13, def: 10, mag: 14, spd: 12 },
    glyph: { white: "♕", black: "♛" },
    title: "Sovereign",
    fightingStyle: "Longsword and circlet. A royal lunge ends the melee for the attacker.",
    weapon: "longsword",
    spells: [
      {
        id: "royal-flare",
        name: "Royal Flare",
        description: "A crownburst of searing light.",
        mpCost: 7,
        effects: [{ type: "damage", power: 17 }],
      },
      {
        id: "drain",
        name: "Drain",
        description: "Siphon life from the opponent.",
        mpCost: 6,
        effects: [
          { type: "damage", power: 10 },
          { type: "heal", power: 8 },
        ],
      },
    ],
  },
  king: {
    maxHp: 54,
    maxMp: 16,
    stats: { atk: 10, def: 12, mag: 10, spd: 8 },
    glyph: { white: "♔", black: "♚" },
    title: "Warlord",
    fightingStyle: "Crown, kite shield, and arming sword. The king who attacks always claims the field.",
    weapon: "arming sword",
    spells: [
      {
        id: "command",
        name: "Command",
        description: "Inspire a focused, heavier next strike.",
        mpCost: 5,
        effects: [{ type: "status", status: "focused", duration: 2, potency: 1 }],
      },
      {
        id: "last-stand",
        name: "Last Stand",
        description: "Halve incoming damage for a short time.",
        mpCost: 8,
        effects: [{ type: "status", status: "lastStand", duration: 3 }],
      },
    ],
  },
};

export function kitFor(type: PieceType): PieceKit {
  return PIECE_KITS[type];
}

export function spellFor(type: PieceType, spellId: string): SpellDef | undefined {
  return PIECE_KITS[type].spells.find((spell) => spell.id === spellId);
}
