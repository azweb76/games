import "./styles.css";
import {
  actingCombatColor,
  algebraic,
  chooseCombatAction,
  choosePromotion,
  combatActionList,
  controllerFor,
  createGame,
  kitFor,
  pieceAt,
  sameSquare,
  selectSquare,
  spellFor,
  stepBot,
  type CombatAction,
  type GameMode,
  type GameState,
  type Piece,
  type PieceType,
  type Square,
} from "../engine/index.ts";

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function hpPct(piece: Piece): number {
  return Math.max(0, Math.min(100, (piece.hp / piece.maxHp) * 100));
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
        <p class="lead">Pieces keep chess movement, but a capture is a duel. Knights lunge, bishops burn, rooks fortify, queens drain, kings take a last stand.</p>
        <div class="mode-actions">
          <button data-mode="pvp" type="button">Player vs Player</button>
          <button data-mode="pvb" type="button">Player vs Bot</button>
        </div>
        <ul class="kit-preview">
          ${(["pawn", "knight", "bishop", "rook", "queen", "king"] as PieceType[])
            .map((type) => {
              const kit = kitFor(type);
              return `<li><strong>${kit.glyph.white} ${kit.title}</strong> — ${kit.fightingStyle}</li>`;
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

function renderGame(root: HTMLElement, state: GameState, dispatch: (next: GameState) => void): void {
  const acting = actingCombatColor(state);
  const kitside = state.selected ? pieceAt(state, state.selected) : null;
  const combatAttacker = state.combat ? state.pieces[state.combat.attackerId] : null;
  const combatDefender = state.combat ? state.pieces[state.combat.defenderId] : null;

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
                  ? `Duel — ${acting}'s action`
                  : `${state.turn} to move${state.mode === "pvb" && controllerFor(state, state.turn) === "bot" ? " (bot)" : ""}`
            }
          </div>
          <div class="board" role="grid" aria-label="Chess board">
            ${Array.from({ length: 8 }, (_, row) => {
              const rank = 7 - row;
              return Array.from({ length: 8 }, (_, col) => {
                const file = col;
                const square: Square = { file, rank };
                const piece = pieceAt(state, square);
                const light = (file + rank) % 2 === 1;
                const selected = state.selected && sameSquare(state.selected, square);
                const legal = state.legalTargets.some((target) => sameSquare(target, square));
                const last =
                  state.lastMove &&
                  (sameSquare(state.lastMove.from, square) || sameSquare(state.lastMove.to, square));
                const kit = piece ? kitFor(piece.type) : null;
                return `
                  <button
                    type="button"
                    class="sq ${light ? "light" : "dark"} ${selected ? "selected" : ""} ${legal ? "legal" : ""} ${last ? "last" : ""}"
                    data-file="${file}"
                    data-rank="${rank}"
                    aria-label="${FILES[file]}${rank + 1}${piece ? ` ${piece.color} ${piece.type}` : ""}"
                  >
                    ${
                      piece && kit
                        ? `<span class="glyph ${piece.color}">${kit.glyph[piece.color]}</span>
                           <span class="piece-hp"><span style="width:${hpPct(piece)}%"></span></span>`
                        : ""
                    }
                    ${col === 0 ? `<span class="coord rank">${rank + 1}</span>` : ""}
                    ${row === 7 ? `<span class="coord file">${FILES[file]}</span>` : ""}
                  </button>
                `;
              }).join("");
            }).join("")}
          </div>
        </section>
        <aside class="side">
          <section class="panel">
            <h2>Inspector</h2>
            ${
              kitside
                ? inspectorHtml(kitside)
                : "<p class='muted'>Select a piece to inspect its fighting kit.</p>"
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
      ${
        state.combat && combatAttacker && combatDefender
          ? combatHtml(state, combatAttacker, combatDefender)
          : ""
      }
    </div>
  `;

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

  root.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.action;
      const action: CombatAction =
        kind === "strike" ? { kind: "strike" } : { kind: "spell", spellId: button.dataset.spell ?? "" };
      dispatch(chooseCombatAction(state, action));
    });
  });
}

function inspectorHtml(piece: Piece): string {
  const kit = kitFor(piece.type);
  return `
    <p class="piece-name">${kit.glyph[piece.color]} ${piece.color} ${kit.title}</p>
    <p class="muted">${kit.fightingStyle}</p>
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

function combatHtml(state: GameState, attacker: Piece, defender: Piece): string {
  const acting = actingCombatColor(state);
  const humanTurn = acting ? controllerFor(state, acting) === "human" : false;
  const actions = combatActionList(state);
  return `
    <div class="modal">
      <div class="modal-card combat">
        <p class="kicker">Duel on ${algebraic(state.combat!.to)}</p>
        <h2>Steel &amp; Spell</h2>
        <div class="fighters">
          ${fighterCard(attacker, "Challenger")}
          <div class="vs">vs</div>
          ${fighterCard(defender, "Defender")}
        </div>
        <ol class="combat-log">
          ${state.combat!.log.map((entry) => `<li>${escapeHtml(entry.text)}</li>`).join("")}
        </ol>
        ${
          humanTurn
            ? `<div class="mode-actions wrap">
                ${actions
                  .map((action) => {
                    if (action.kind === "strike") {
                      return `<button data-action="strike" type="button">Strike</button>`;
                    }
                    const spell = spellFor(
                      (state.combat!.nextRole === "attacker" ? attacker : defender).type,
                      action.spellId,
                    );
                    return `<button data-action="spell" data-spell="${action.spellId}" type="button">${spell?.name ?? action.spellId}</button>`;
                  })
                  .join("")}
              </div>`
            : `<p class="muted">Waiting on ${acting}…</p>`
        }
      </div>
    </div>
  `;
}

function fighterCard(piece: Piece, role: string): string {
  const kit = kitFor(piece.type);
  return `
    <div class="fighter ${piece.color}">
      <p class="role">${role}</p>
      <p class="glyph">${kit.glyph[piece.color]}</p>
      <p>${piece.color} ${kit.title}</p>
      <div class="bar hp"><span style="width:${hpPct(piece)}%"></span></div>
      <div class="bar mp"><span style="width:${(piece.mp / piece.maxMp) * 100}%"></span></div>
      <p class="muted">HP ${piece.hp} · MP ${piece.mp}</p>
    </div>
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

  const needsBot = (current: GameState): boolean => {
    if (current.winner) return false;
    if (current.combat) {
      const color = actingCombatColor(current);
      return Boolean(color && controllerFor(current, color) === "bot");
    }
    return controllerFor(current, current.turn) === "bot";
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
      state = next;
      render();
    });
    if (needsBot(state)) {
      const snapshot = state;
      botTimer = setTimeout(() => {
        if (state !== snapshot) return;
        state = stepBot(snapshot);
        render();
      }, 420);
    }
  };

  render();
  return () => {
    if (botTimer) clearTimeout(botTimer);
    root.innerHTML = "";
  };
}
