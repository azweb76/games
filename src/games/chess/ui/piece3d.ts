import type { Color, Piece, PieceType } from "../engine/index.ts";

function palette(color: Color): { fill: string; shade: string; light: string; metal: string; ink: string } {
  if (color === "white") {
    return {
      fill: "#f4ead2",
      shade: "#c4a574",
      light: "#fff8ea",
      metal: "#d4a017",
      ink: "#3a2a14",
    };
  }
  return {
    fill: "#2a2420",
    shade: "#0e0c0a",
    light: "#5c5046",
    metal: "#8a7350",
    ink: "#ece3d4",
  };
}

function pawnSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="22" ry="6" fill="#0005"/>
    <path d="M22 92 L58 92 L54 78 L26 78 Z" fill="${c.shade}"/>
    <path d="M28 78 L52 78 L48 52 L32 52 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M30 62 L50 62 L48 52 L32 52 Z" fill="${c.metal}"/>
    <circle cx="40" cy="42" r="14" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M28 38 Q40 28 52 38 L50 44 Q40 36 30 44 Z" fill="${c.shade}"/>
    <rect x="38" y="24" width="4" height="22" fill="${c.metal}"/>
    <circle cx="40" cy="22" r="4" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.8"/>
  `;
}

function rookSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="24" ry="6" fill="#0005"/>
    <path d="M18 92 H62 L58 80 H22 Z" fill="${c.shade}"/>
    <path d="M24 80 H56 V42 H24 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <rect x="34" y="56" width="12" height="18" fill="${c.shade}"/>
    <path d="M22 42 H58 V30 H22 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M22 30 V18 H30 V26 H36 V18 H44 V26 H50 V18 H58 V30 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="1"/>
  `;
}

function knightSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="24" ry="6" fill="#0005"/>
    <path d="M18 92 H62 L56 78 H24 Z" fill="${c.shade}"/>
    <path d="M22 80 C24 58 28 50 38 48 C36 62 44 70 58 72 L54 80 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <path d="M38 50 C48 38 62 40 66 28 C70 40 62 52 50 54 C58 58 60 66 54 70 L42 58 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <path d="M60 26 L68 12 L70 16 L64 28 Z" fill="${c.shade}"/>
    <circle cx="58" cy="34" r="2.2" fill="${c.ink}"/>
    <path d="M36 36 C40 22 48 18 52 22" fill="none" stroke="${c.metal}" stroke-width="3" stroke-linecap="round"/>
    <path d="M34 44 L22 18 L26 16 L40 42" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.8"/>
    <circle cx="24" cy="16" r="3" fill="${c.metal}"/>
    <path d="M40 48 L48 40 L52 46 L44 54 Z" fill="${c.metal}"/>
    <rect x="42" y="28" width="10" height="8" rx="2" fill="${c.shade}" stroke="${c.ink}" stroke-width="0.8"/>
  `;
}

function bishopSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="22" ry="6" fill="#0005"/>
    <path d="M22 92 H58 L52 76 H28 Z" fill="${c.shade}"/>
    <path d="M30 76 L50 76 L46 48 L34 48 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M32 52 H48 L44 40 H36 Z" fill="${c.metal}"/>
    <path d="M26 48 Q40 18 54 48 L48 52 Q40 36 32 52 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M38 28 V44" stroke="${c.ink}" stroke-width="2"/>
    <circle cx="40" cy="22" r="4" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.8"/>
    <path d="M20 70 Q40 62 60 70" fill="none" stroke="${c.metal}" stroke-width="2"/>
  `;
}

function queenSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="24" ry="6" fill="#0005"/>
    <path d="M18 92 H62 L54 74 H26 Z" fill="${c.shade}"/>
    <path d="M26 74 L54 74 L50 48 L30 48 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M24 50 H56 L52 42 H28 Z" fill="${c.metal}"/>
    <circle cx="40" cy="38" r="10" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.1"/>
    <path d="M24 36 L28 16 L34 32 L40 12 L46 32 L52 16 L56 36 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="1"/>
    <circle cx="28" cy="16" r="3" fill="${c.light}"/>
    <circle cx="40" cy="12" r="3.4" fill="${c.light}"/>
    <circle cx="52" cy="16" r="3" fill="${c.light}"/>
  `;
}

function kingSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="24" ry="6" fill="#0005"/>
    <path d="M16 92 H64 L56 74 H24 Z" fill="${c.shade}"/>
    <path d="M24 76 H56 L52 46 H28 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <path d="M22 50 H58 L54 42 H26 Z" fill="#7a1f1f"/>
    <path d="M26 50 H54 L50 44 H30 Z" fill="#f2e6c8"/>
    <circle cx="40" cy="36" r="11" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M32 40 Q40 48 48 40 Q40 44 32 40" fill="${c.shade}"/>
    <path d="M26 30 H54 V24 H26 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="1"/>
    <path d="M28 24 L32 14 L36 24 L40 10 L44 24 L48 14 L52 24" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.9"/>
    <rect x="38" y="4" width="4" height="12" fill="${c.metal}"/>
    <rect x="34" y="8" width="12" height="4" fill="${c.metal}"/>
    <rect x="58" y="38" width="4" height="36" fill="${c.metal}"/>
    <circle cx="60" cy="36" r="5" fill="#c9a227" stroke="${c.ink}" stroke-width="0.8"/>
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
    <div class="fig3d ${piece.color} ${piece.type}${compact}" data-piece="${piece.id}" aria-hidden="true">
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
