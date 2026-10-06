import type { Color, Piece, PieceType } from "../engine/index.ts";

function palette(color: Color): { fill: string; shade: string; light: string; metal: string; ink: string; cloth: string; gold: string } {
  if (color === "white") {
    return {
      fill: "#f4ead2",
      shade: "#c4a574",
      light: "#fff8ea",
      metal: "#d8d2c8",
      ink: "#3a2a14",
      cloth: "#6b2a22",
      gold: "#c9a227",
    };
  }
  return {
    fill: "#2a2420",
    shade: "#0e0c0a",
    light: "#5c5046",
    metal: "#9a8460",
    ink: "#ece3d4",
    cloth: "#1d3a4a",
    gold: "#8a7350",
  };
}

/** Weapons stay inside the 80×110 figure: about torso-to-crown, held at the right hip. */
function spear(c: ReturnType<typeof palette>): string {
  return `
    <g class="weapon">
      <rect x="57.2" y="34" width="2.6" height="42" fill="#6b4423" stroke="${c.ink}" stroke-width="0.5"/>
      <path d="M56 34 L61.2 34 L58.5 22 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.6"/>
      <rect x="55.4" y="62" width="6.2" height="2.4" fill="${c.shade}"/>
    </g>
  `;
}

function sword(c: ReturnType<typeof palette>, gold = false): string {
  const guard = gold ? c.gold : c.shade;
  return `
    <g class="weapon">
      <rect x="57.4" y="36" width="2.4" height="36" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.5"/>
      <path d="M55.8 36 L61.4 36 L58.6 26 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.6"/>
      <rect x="54.6" y="58" width="8" height="2.6" fill="${guard}"/>
      <circle cx="58.6" cy="73.4" r="2.1" fill="${guard}" stroke="${c.ink}" stroke-width="0.5"/>
    </g>
  `;
}

function lance(c: ReturnType<typeof palette>): string {
  return `
    <g class="weapon">
      <rect x="57" y="30" width="2.8" height="46" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.5"/>
      <path d="M55.6 30 L61.2 30 L58.4 18 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.6"/>
      <rect x="55.2" y="54" width="6.4" height="8" rx="1" fill="${c.cloth}"/>
    </g>
  `;
}

function staff(c: ReturnType<typeof palette>): string {
  return `
    <g class="weapon">
      <rect x="57.2" y="32" width="2.6" height="44" fill="#6b4423" stroke="${c.ink}" stroke-width="0.5"/>
      <circle cx="58.5" cy="28" r="5.2" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.7"/>
      <path d="M58.5 22.4 V33.6 M53.4 28 H63.6" stroke="${c.ink}" stroke-width="1.2"/>
    </g>
  `;
}

function maul(c: ReturnType<typeof palette>): string {
  return `
    <g class="weapon">
      <rect x="57" y="42" width="3.2" height="32" rx="0.6" fill="#6b4423" stroke="${c.ink}" stroke-width="0.5"/>
      <path d="M52 28 H66 L64.4 44 H53.6 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.8"/>
      <rect x="54" y="32" width="10" height="4" fill="${c.shade}"/>
    </g>
  `;
}

function roundShield(c: ReturnType<typeof palette>): string {
  return `
    <g class="shield">
      <ellipse cx="22" cy="64" rx="9" ry="12" fill="#6d4c32" stroke="${c.ink}" stroke-width="1"/>
      <circle cx="22" cy="64" r="3.2" fill="${c.metal}"/>
    </g>
  `;
}

function kiteShield(c: ReturnType<typeof palette>): string {
  return `
    <g class="shield">
      <path d="M14 52 Q24 48 26 76 Q20 82 14 76 Z" fill="#7a1f1f" stroke="${c.ink}" stroke-width="1"/>
      <path d="M20 56 V74 M16.4 64 H23.6" stroke="${c.metal}" stroke-width="1.4"/>
    </g>
  `;
}

function pawnSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="18" ry="5" fill="#0005"/>
    ${roundShield(c)}
    <path d="M24 92 L56 92 L52 78 L28 78 Z" fill="${c.shade}"/>
    <path d="M30 78 L50 78 L46 54 L34 54 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M32 64 L48 64 L46 54 L34 54 Z" fill="${c.cloth}"/>
    <circle cx="40" cy="44" r="11" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M30 40 Q40 32 50 40 L48 46 Q40 38 32 46 Z" fill="${c.shade}"/>
    ${spear(c)}
  `;
}

function rookSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="20" ry="5" fill="#0005"/>
    <path d="M20 92 H60 L56 80 H24 Z" fill="${c.shade}"/>
    <path d="M26 80 H54 V46 H26 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <rect x="34" y="58" width="12" height="16" fill="${c.shade}"/>
    <path d="M24 46 H56 V34 H24 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M24 34 V24 H30 V30 H36 V24 H44 V30 H50 V24 H56 V34 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="1"/>
    ${maul(c)}
  `;
}

function knightSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="20" ry="5" fill="#0005"/>
    <path d="M20 92 H60 L54 78 H26 Z" fill="${c.shade}"/>
    <path d="M24 80 C26 60 30 52 40 50 C38 62 46 70 56 72 L52 80 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <path d="M40 52 C48 40 60 42 64 32 C66 42 60 52 50 54 C56 58 58 64 52 68 L42 58 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <circle cx="56" cy="38" r="2" fill="${c.ink}"/>
    <rect x="42" y="32" width="9" height="7" rx="1.5" fill="${c.shade}" stroke="${c.ink}" stroke-width="0.8"/>
    ${lance(c)}
  `;
}

function bishopSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="18" ry="5" fill="#0005"/>
    <path d="M24 92 H56 L50 76 H30 Z" fill="${c.shade}"/>
    <path d="M32 76 L48 76 L44 50 L36 50 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M34 54 H46 L43 42 H37 Z" fill="${c.cloth}"/>
    <path d="M28 50 Q40 22 52 50 L46 54 Q40 40 34 54 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M38 32 V44" stroke="${c.ink}" stroke-width="2"/>
    <circle cx="40" cy="24" r="3.4" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.8"/>
    ${staff(c)}
  `;
}

function queenSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="20" ry="5" fill="#0005"/>
    <path d="M20 92 H60 L52 76 H28 Z" fill="${c.shade}"/>
    <path d="M28 76 L52 76 L48 50 L32 50 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M26 52 H54 L50 44 H30 Z" fill="${c.metal}"/>
    <circle cx="40" cy="40" r="9" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.1"/>
    <path d="M26 38 L30 20 L35 34 L40 16 L45 34 L50 20 L54 38 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="1"/>
    <circle cx="30" cy="20" r="2.4" fill="${c.light}"/>
    <circle cx="40" cy="16" r="2.8" fill="${c.light}"/>
    <circle cx="50" cy="20" r="2.4" fill="${c.light}"/>
    ${sword(c, true)}
  `;
}

function kingSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="20" ry="5" fill="#0005"/>
    ${kiteShield(c)}
    <path d="M20 92 H60 L54 76 H26 Z" fill="${c.shade}"/>
    <path d="M26 76 H54 L50 50 H30 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <path d="M24 52 H56 L52 44 H28 Z" fill="#7a1f1f"/>
    <path d="M28 52 H52 L48 46 H32 Z" fill="#f2e6c8"/>
    <circle cx="40" cy="38" r="10" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M32 42 Q40 48 48 42 Q40 46 32 42" fill="${c.shade}"/>
    <path d="M28 32 H52 V26 H28 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="1"/>
    <path d="M30 26 L34 16 L37 26 L40 12 L43 26 L46 16 L50 26" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.9"/>
    <rect x="38" y="6" width="4" height="10" fill="${c.metal}"/>
    <rect x="34" y="10" width="12" height="3.4" fill="${c.metal}"/>
    ${sword(c, true)}
  `;
}

function body(type: PieceType, color: Color): string {
  const c = palette(color);
  if (type === "pawn") return pawnSvg(c);
  if (type === "rook") return rookSvg(c);
  if (type === "knight") return knightSvg(c);
  if (type === "bishop") return bishopSvg(c);
  if (type === "queen") return queenSvg(c);
  return kingSvg(c);
}

export function pieceFigureHtml(
  piece: Pick<Piece, "id" | "type" | "color">,
  extras: { compact?: boolean; hp?: string } = {},
): string {
  const compact = extras.compact ? " compact" : "";
  return `
    <div class="fig3d idle ${piece.color} ${piece.type}${compact}" data-piece="${piece.id}" aria-hidden="true">
      <span class="fig-shadow"></span>
      <span class="mini">
        <svg viewBox="0 0 80 110" xmlns="http://www.w3.org/2000/svg">${body(piece.type, piece.color)}</svg>
      </span>
      <span class="fx-slash"></span>
      <span class="fx-spark"></span>
      <span class="fx-impact"></span>
      ${extras.hp ?? ""}
    </div>
  `;
}

export function pieceLabel(type: PieceType, color: Color): string {
  return `${color} ${type}`;
}
