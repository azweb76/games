import "./styles.css";
import "./pieces3d.css";
import {
  choosePromotion,
  controllerFor,
  createGame,
  kitFor,
  pieceAt,
  sameSquare,
  selectSquare,
  stepBot,
  type GameMode,
  type GameState,
  type Piece,
  type PieceType,
  type Square,
} from "../engine/index.ts";
import { pieceFigureHtml } from "./piece3d.ts";
import { playMeleeDuel } from "./melee.ts";
import {
  detectMotion,
  walkWaypoints,
  type MotionEvent,
} from "./motion.ts";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function hpPct(piece: Piece): number {
  return Math.max(0, Math.min(100, (piece.hp / piece.maxHp) * 100));
}

function hpBar(piece: Piece): string {
  return `<span class="piece-hp"><span style="width:${hpPct(piece)}%"></span></span>`;
}

function sleep(ms: number): Promise<void> {
  const duration = Number.isFinite(ms) ? Math.max(0, ms) : 800;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function squareBox(root: HTMLElement, square: Square): { x: number; y: number; w: number; h: number } {
  const btn = root.querySelector<HTMLElement>(`.sq[data-file="${square.file}"][data-rank="${square.rank}"]`);
  const layer = root.querySelector<HTMLElement>(".piece-layer");
  if (!btn || !layer) return { x: 0, y: 0, w: 0, h: 0 };
  const cell = btn.getBoundingClientRect();
  const origin = layer.getBoundingClientRect();
  return {
    x: cell.left - origin.left,
    y: cell.top - origin.top,
    w: cell.width,
    h: cell.height,
  };
}

function placeActor(root: HTMLElement, el: HTMLElement, square: Square): void {
  const box = squareBox(root, square);
  el.style.left = `${box.x}px`;
  el.style.top = `${box.y}px`;
  el.style.width = `${box.w}px`;
  el.style.height = `${box.h}px`;
  el.style.transform = "none";
  el.style.zIndex = String(12 + (7 - square.rank));
}

function layoutActors(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>(".actor[data-file][data-rank]").forEach((el) => {
    const file = Number(el.dataset.file);
    const rank = Number(el.dataset.rank);
    if (Number.isFinite(file) && Number.isFinite(rank)) placeActor(root, el, { file, rank });
  });
}

async function flyPiece(root: HTMLElement, state: GameState, event: Extract<MotionEvent, { type: "walk" }>): Promise<void> {
  const fromBtn = root.querySelector<HTMLElement>(`.sq[data-file="${event.from.file}"][data-rank="${event.from.rank}"]`);
  const toBtn = root.querySelector<HTMLElement>(`.sq[data-file="${event.to.file}"][data-rank="${event.to.rank}"]`);
  const piece = state.pieces[event.pieceId];
  if (!fromBtn || !toBtn || !piece) {
    await sleep(700);
    return;
  }
  const start = fromBtn.getBoundingClientRect();
  const end = toBtn.getBoundingClientRect();
  root.querySelectorAll<HTMLElement>(`[data-actor="${event.pieceId}"]`).forEach((node) => {
    node.style.visibility = "hidden";
  });
  const flyer = document.createElement("div");
  flyer.className = "actor flyer walking-fly";
  flyer.style.position = "fixed";
  flyer.style.left = `${start.left}px`;
  flyer.style.top = `${start.top}px`;
  flyer.style.width = `${start.width}px`;
  flyer.style.height = `${start.height}px`;
  flyer.style.zIndex = "9999";
  flyer.style.pointerEvents = "none";
  flyer.innerHTML = pieceFigureHtml(piece, { hp: hpBar(piece) });
  flyer.querySelector(".fig3d")?.classList.add("walking");
  document.body.append(flyer);
  void flyer.offsetWidth;
  const dist = Math.max(1, Math.abs(event.to.file - event.from.file) + Math.abs(event.to.rank - event.from.rank));
  const ms = Math.min(1100, 380 + dist * 200);
  flyer.style.transition = `left ${ms}ms linear, top ${ms}ms linear`;
  flyer.style.left = `${end.left}px`;
  flyer.style.top = `${end.top}px`;
  await sleep(ms);
  flyer.remove();
}

async function playMotion(root: HTMLElement, state: GameState, events: MotionEvent[]): Promise<void> {
  for (const event of events) {
    if (event.type === "walk") {
      const hops = event.pieceType === "knight" ? walkWaypoints(event.pieceType, event.from, event.to) : [event.to];
      let current = event.from;
      for (const point of hops) {
        await flyPiece(root, state, { ...event, from: current, to: point });
        current = point;
      }
    } else {
      await playMeleeDuel({
        root,
        attacker: event.actorPiece,
        defender: event.foePiece,
        from: event.from,
        to: event.to,
      });
    }
  }
}

function renderLobby(root: HTMLElement, onStart: (mode: GameMode) => void): void {
  root.innerHTML = `
    <div class="chess-shell">
      <header class="chess-top">
        <a class="back" href="#/">← Arena</a>
        <div>
          <p class="kicker">Self-contained game</p>
          <h1>Blood &amp; Board</h1>
        </div>
      </header>
      <section class="mode-card">
        <p class="lead">Chess movement, medieval steel. A capture is an automatic melee on the square — weapons clash, and the attacker always wins.</p>
        <div class="mode-actions">
          <button data-mode="pvp" type="button">Player vs Player</button>
          <button data-mode="pvb" type="button">Player vs Bot</button>
        </div>
        <ul class="kit-preview">
          ${(["pawn", "knight", "bishop", "rook", "queen", "king"] as PieceType[])
            .map((type) => {
              const kit = kitFor(type);
              return `<li><strong>${kit.title}</strong> — ${kit.weapon}: ${kit.fightingStyle}</li>`;
            })
            .join("")}
        </ul>
      </section>
    </div>
  `;
  root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => onStart(button.dataset.mode as GameMode));
  });
}

function actorsHtml(state: GameState): string {
  const bits: string[] = [];
  for (let rank = 0; rank < 8; rank += 1) {
    for (let file = 0; file < 8; file += 1) {
      const piece = state.board[rank]![file];
      if (!piece) continue;
      bits.push(`
        <div class="actor" data-actor="${piece.id}" data-file="${file}" data-rank="${rank}" style="z-index:${12 + (7 - rank)}">
          ${pieceFigureHtml(piece, { hp: hpBar(piece) })}
        </div>
      `);
    }
  }
  return bits.join("");
}

function renderGame(root: HTMLElement, state: GameState, dispatch: (next: GameState) => void, locked: boolean): void {
  const kitside = state.selected ? pieceAt(state, state.selected) : null;

  root.innerHTML = `
    <div class="chess-shell play">
      <header class="chess-top">
        <a class="back" href="#/">← Arena</a>
        <div>
          <p class="kicker">${state.mode === "pvb" ? "Player vs Bot" : "Player vs Player"}</p>
          <h1>Blood &amp; Board</h1>
        </div>
        <button class="ghost" data-reset type="button">New match</button>
      </header>
      <section class="board-wrap">
          <div class="turn-banner ${state.winner ? "over" : ""}">
            ${
              state.winner
                ? state.winner === "draw"
                  ? "Drawn game"
                  : `${state.winner} wins`
                : state.combat
                  ? "Melee on the board"
                  : `${state.turn} to move${state.mode === "pvb" && controllerFor(state, state.turn) === "bot" ? " (bot)" : ""}`
            }
          </div>
          <div class="stage">
            <div class="board-3d">
              <div class="board" role="grid" aria-label="Chess board">
                ${Array.from({ length: 8 }, (_, row) => {
                  const rank = 7 - row;
                  return Array.from({ length: 8 }, (_, col) => {
                    const file = col;
                    const square: Square = { file, rank };
                    const light = (file + rank) % 2 === 1;
                    const selected = state.selected && sameSquare(state.selected, square);
                    const legal = state.legalTargets.some((target) => sameSquare(target, square));
                    const last =
                      state.lastMove &&
                      (sameSquare(state.lastMove.from, square) || sameSquare(state.lastMove.to, square));
                      const occupied = Boolean(pieceAt(state, square));
                    return `
                      <button
                        type="button"
                        class="sq ${light ? "light" : "dark"} ${selected ? "selected" : ""} ${legal ? "legal" : ""} ${legal && occupied ? "capture" : ""} ${last ? "last" : ""}"
                        data-file="${file}"
                        data-rank="${rank}"
                        aria-label="${FILES[file]}${rank + 1}"
                      >
                        ${col === 0 ? `<span class="coord rank">${rank + 1}</span>` : ""}
                        ${row === 7 ? `<span class="coord file">${FILES[file]}</span>` : ""}
                      </button>
                    `;
                  }).join("");
                }).join("")}
              </div>
              <div class="piece-layer">${actorsHtml(state)}</div>
            </div>
          </div>
        </section>
        <aside class="side">
          <section class="panel">
            <h2>Inspector</h2>
            ${
              kitside
                ? inspectorHtml(kitside)
                : "<p class='muted'>Select a piece to inspect its arms and kit.</p>"
            }
          </section>
          <section class="panel log">
            <h2>Chronicle</h2>
            <ol>
              ${state.log
                .slice(-12)
                .map((line) => `<li>${escapeHtml(line)}</li>`)
                .join("")}
            </ol>
          </section>
        </aside>
      ${
        state.pendingPromotion
          ? `<div class="modal"><div class="modal-card">
              <h2>Promote pawn</h2>
              <div class="mode-actions">
                ${["queen", "rook", "bishop", "knight"]
                  .map((type) => `<button data-promote="${type}" type="button">${type}</button>`)
                  .join("")}
              </div>
            </div></div>`
          : ""
      }
    </div>
  `;

  if (locked) return;

  root.querySelector("[data-reset]")?.addEventListener("click", () => {
    dispatch(createGame({ mode: state.mode, seed: Date.now() % 1_000_000 }));
  });

  root.querySelectorAll<HTMLButtonElement>(".sq").forEach((button) => {
    button.addEventListener("click", () => {
      const file = Number(button.dataset.file);
      const rank = Number(button.dataset.rank);
      dispatch(selectSquare(state, { file, rank }));
    });
  });

  root.querySelectorAll<HTMLButtonElement>("[data-promote]").forEach((button) => {
    button.addEventListener("click", () => {
      dispatch(choosePromotion(state, button.dataset.promote as PieceType));
    });
  });
}

function inspectorHtml(piece: Piece): string {
  const kit = kitFor(piece.type);
  return `
    ${pieceFigureHtml(piece, { compact: true })}
    <p class="piece-name">${piece.color} ${kit.title}</p>
    <p class="muted">${kit.weapon} — ${kit.fightingStyle}</p>
    <dl class="stats">
      <div><dt>HP</dt><dd>${piece.hp}/${piece.maxHp}</dd></div>
      <div><dt>MP</dt><dd>${piece.mp}/${piece.maxMp}</dd></div>
      <div><dt>ATK</dt><dd>${kit.stats.atk}</dd></div>
      <div><dt>DEF</dt><dd>${kit.stats.def}</dd></div>
      <div><dt>MAG</dt><dd>${kit.stats.mag}</dd></div>
      <div><dt>SPD</dt><dd>${kit.stats.spd}</dd></div>
    </dl>
    <ul class="spells">
      ${kit.spells.map((spell) => `<li><strong>${spell.name}</strong> (${spell.mpCost} MP) — ${spell.description}</li>`).join("")}
    </ul>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function chessUi(root: HTMLElement): () => void {
  let state: GameState | null = null;
  let botTimer: ReturnType<typeof setTimeout> | undefined;
  let locked = false;

  const needsBot = (current: GameState): boolean => {
    if (locked || current.winner || current.combat) return false;
    return controllerFor(current, current.turn) === "bot";
  };

  const apply = async (next: GameState): Promise<void> => {
    if (!state || locked) return;
    const motions = detectMotion(state, next);
    const walks = motions.filter((event) => event.type === "walk");
    const attacks = motions.filter((event) => event.type === "attack");
    if (motions.length > 0) {
      locked = true;
      const banner = root.querySelector(".turn-banner");
      if (walks.length) {
        if (banner) banner.textContent = "Walking the board…";
        await playMotion(root, state, walks);
      }
      if (attacks.length) {
        if (banner) banner.textContent = "Melee on the square!";
        await playMotion(root, next, attacks);
      }
      locked = false;
    }
    state = next;
    render();
  };

  const render = (): void => {
    if (botTimer) clearTimeout(botTimer);
    if (!state) {
      renderLobby(root, (mode) => {
        state = createGame({ mode, seed: Date.now() % 1_000_000 });
        render();
      });
      return;
    }
    renderGame(root, state, (next) => {
      void apply(next);
    }, locked);
    layoutActors(root);
    if (needsBot(state)) {
      const snapshot = state;
      botTimer = setTimeout(() => {
        if (state !== snapshot || locked) return;
        void apply(stepBot(snapshot));
      }, 520);
    }
  };

  render();
  return () => {
    if (botTimer) clearTimeout(botTimer);
    root.innerHTML = "";
  };
}
