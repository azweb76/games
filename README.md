# Arena Games

A Node.js web app of **self-contained** games. TypeScript, ESM, pnpm, Vite, and Vitest.

Each title lives under `src/games/<id>/` with its own engine, UI, styles, and tests. The lobby only reads a small manifest — games do not share rules or state.

## Games

### Blood & Board (chess)

Standard chess movement. A capture is an automatic medieval melee on the square — weapons clash, and **the attacker always wins**.

- Animated miniatures: spear militia, lance cavalry, staff bishops, warhammer rooks, sword queens, and sword-and-shield kings.
- Captures auto-fight on the board. No duel menu.
- **Player vs Player** (hot-seat) and **Player vs Bot**.

## Scripts

```bash
pnpm install
pnpm test
pnpm dev      # Vite at http://localhost:5173
pnpm build
pnpm start    # Express serving the client build
```
