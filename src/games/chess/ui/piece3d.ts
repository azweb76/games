import type { Color, Piece, PieceType } from "../engine/index.ts";

function layers(type: PieceType): string {
  if (type === "pawn") {
    return `
      <span class="part plinth"></span>
      <span class="part stem"></span>
      <span class="part collar"></span>
      <span class="part head"></span>
    `;
  }
  if (type === "rook") {
    return `
      <span class="part plinth"></span>
      <span class="part tower"></span>
      <span class="part battlement b1"></span>
      <span class="part battlement b2"></span>
      <span class="part battlement b3"></span>
    `;
  }
  if (type === "knight") {
    return `
      <span class="part plinth"></span>
      <span class="part stem"></span>
      <span class="part chest"></span>
      <span class="part neck"></span>
      <span class="part snout"></span>
      <span class="part ear"></span>
    `;
  }
  if (type === "bishop") {
    return `
      <span class="part plinth"></span>
      <span class="part stem slim"></span>
      <span class="part collar"></span>
      <span class="part mitre"></span>
      <span class="part slot"></span>
    `;
  }
  if (type === "queen") {
    return `
      <span class="part plinth"></span>
      <span class="part stem"></span>
      <span class="part collar"></span>
      <span class="part head"></span>
      <span class="part coronet"></span>
      <span class="part spike s1"></span>
      <span class="part spike s2"></span>
      <span class="part spike s3"></span>
    `;
  }
  return `
    <span class="part plinth"></span>
    <span class="part stem"></span>
    <span class="part collar"></span>
    <span class="part head"></span>
    <span class="part cross-v"></span>
    <span class="part cross-h"></span>
  `;
}

export function pieceFigureHtml(
  piece: Pick<Piece, "id" | "type" | "color">,
  extras: { compact?: boolean; hp?: string } = {},
): string {
  const compact = extras.compact ? " compact" : "";
  return `
    <div class="fig3d ${piece.color} ${piece.type}${compact}" data-piece="${piece.id}" aria-hidden="true">
      <span class="fig-shadow"></span>
      <span class="fig-stand">
        ${layers(piece.type)}
      </span>
      <span class="fx-slash"></span>
      <span class="fx-spark"></span>
      ${extras.hp ?? ""}
    </div>
  `;
}

export function pieceLabel(type: PieceType, color: Color): string {
  return `${color} ${type}`;
}
