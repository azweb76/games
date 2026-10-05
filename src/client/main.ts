import "../client/styles.css";
import { getGame, games } from "../games/registry.ts";

const appEl = document.querySelector<HTMLElement>("#app");
if (!appEl) throw new Error("Missing #app");
const app = appEl;

let unmount: (() => void) | undefined;

function route(): string {
  const hash = location.hash.replace(/^#/, "") || "/";
  return hash.startsWith("/") ? hash : `/${hash}`;
}

function renderLobby(root: HTMLElement): void {
  root.innerHTML = `
    <div class="arena">
      <header>
        <p class="eyebrow">Node · TypeScript · ESM</p>
        <h1>Arena Games</h1>
        <p class="sub">Each game is its own island — rules, UI, and tests never leak into another title.</p>
      </header>
      <section class="catalog">
        ${games
          .map(
            (game) => `
          <article class="game-card">
            <h2>${game.title}</h2>
            <p class="tag">${game.tagline}</p>
            <p>${game.description}</p>
            <a class="play" href="#/${game.id}">Enter</a>
          </article>
        `,
          )
          .join("")}
      </section>
    </div>
  `;
}

function render(): void {
  unmount?.();
  unmount = undefined;
  const path = route();
  if (path === "/") {
    renderLobby(app);
    return;
  }
  const id = path.slice(1).split("/")[0] ?? "";
  const game = getGame(id);
  if (!game) {
    app.innerHTML = `<div class="arena"><p>Unknown game.</p><a href="#/">Back</a></div>`;
    return;
  }
  app.innerHTML = "";
  const mount = document.createElement("div");
  mount.className = "game-root";
  app.append(mount);
  unmount = game.mount(mount);
}

window.addEventListener("hashchange", render);
render();
