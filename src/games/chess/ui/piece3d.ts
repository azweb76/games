import type { Color, Piece, PieceType } from "../engine/index.ts";

function palette(color: Color): { fill: string; shade: string; light: string; metal: string; ink: string; cloth: string } {
  if (color === "white") {
    return {
      fill: "#f4ead2",
      shade: "#c4a574",
      light: "#fff8ea",
      metal: "#cfc8bf",
      ink: "#3a2a14",
      cloth: "#6b2a22",
    };
  }
  return {
    fill: "#2a2420",
    shade: "#0e0c0a",
    light: "#5c5046",
    metal: "#8a7350",
    ink: "#ece3d4",
    cloth: "#1d3a4a",
  };
}

function pawnSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="22" ry="6" fill="#0005"/>
    <g class="shield">
      <path d="M14 52 L28 48 L30 74 L16 78 Z" fill="#6d4c32" stroke="${c.ink}" stroke-width="1"/>
      <circle cx="22" cy="62" r="4" fill="${c.metal}"/>
    </g>
    <path d="M22 92 L58 92 L54 78 L26 78 Z" fill="${c.shade}"/>
    <path d="M28 78 L52 78 L48 52 L32 52 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M30 62 L50 62 L48 52 L32 52 Z" fill="${c.cloth}"/>
    <circle cx="40" cy="42" r="13" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M28 38 Q40 28 52 38 L50 44 Q40 36 30 44 Z" fill="${c.shade}"/>
    <g class="weapon">
      <rect x="56" y="18" width="3.4" height="62" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.6"/>
      <path d="M54 18 L61.4 18 L58 6 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.7"/>
      <rect x="54" y="54" width="8" height="4" fill="${c.shade}"/>
    </g>
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
    <g class="weapon">
      <rect x="60" y="36" width="5" height="46" rx="1" fill="${c.shade}" stroke="${c.ink}" stroke-width="0.8"/>
      <path d="M56 30 H70 L68 46 H58 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.9"/>
    </g>
  `;
}

function knightSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="24" ry="6" fill="#0005"/>
    <path d="M18 92 H62 L56 78 H24 Z" fill="${c.shade}"/>
    <path d="M22 80 C24 58 28 50 38 48 C36 62 44 70 58 72 L54 80 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <path d="M38 50 C48 38 62 40 66 28 C70 40 62 52 50 54 C58 58 60 66 54 70 L42 58 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.3"/>
    <circle cx="58" cy="34" r="2.2" fill="${c.ink}"/>
    <path d="M36 36 C40 22 48 18 52 22" fill="none" stroke="${c.metal}" stroke-width="3" stroke-linecap="round"/>
    <rect x="42" y="28" width="10" height="8" rx="2" fill="${c.shade}" stroke="${c.ink}" stroke-width="0.8"/>
    <g class="weapon">
      <path d="M18 70 L72 8" stroke="${c.metal}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M70 4 L78 10 L68 16 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.7"/>
      <circle cx="22" cy="66" r="3.4" fill="${c.shade}"/>
    </g>
  `;
}

function bishopSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="22" ry="6" fill="#0005"/>
    <path d="M22 92 H58 L52 76 H28 Z" fill="${c.shade}"/>
    <path d="M30 76 L50 76 L46 48 L34 48 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M32 52 H48 L44 40 H36 Z" fill="${c.cloth}"/>
    <path d="M26 48 Q40 18 54 48 L48 52 Q40 36 32 52 Z" fill="${c.fill}" stroke="${c.ink}" stroke-width="1.2"/>
    <path d="M38 28 V44" stroke="${c.ink}" stroke-width="2"/>
    <circle cx="40" cy="22" r="4" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.8"/>
    <g class="weapon">
      <rect x="58" y="20" width="3.2" height="58" fill="#6b4423" stroke="${c.ink}" stroke-width="0.5"/>
      <circle cx="59.6" cy="16" r="6" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.8"/>
      <path d="M59.6 8 V24 M53.6 16 H65.6" stroke="${c.ink}" stroke-width="1.4"/>
    </g>
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
    <g class="weapon">
      <rect x="60" y="22" width="3" height="52" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.6"/>
      <path d="M57 22 L66 22 L61.5 8 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.7"/>
      <rect x="57" y="52" width="9" height="3.4" fill="${c.shade}"/>
    </g>
  `;
}

function kingSvg(c: ReturnType<typeof palette>): string {
  return `
    <ellipse cx="40" cy="98" rx="24" ry="6" fill="#0005"/>
    <g class="shield">
      <path d="M10 50 Q24 46 26 78 Q18 84 10 78 Z" fill="#7a1f1f" stroke="${c.ink}" stroke-width="1"/>
      <path d="M16 56 V74 M12 64 H22" stroke="${c.metal}" stroke-width="1.6"/>
    </g>
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
    <g class="weapon">
      <rect x="60" y="20" width="3.2" height="54" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.6"/>
      <path d="M57 20 L66.4 20 L61.6 6 Z" fill="${c.metal}" stroke="${c.ink}" stroke-width="0.7"/>
      <rect x="57" y="50" width="9" height="4" fill="#c9a227"/>
    </g>
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
