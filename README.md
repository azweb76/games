# Arena Games

A Node.js web app of **self-contained** games. TypeScript, ESM, pnpm, Vite, and Vitest.

Each title lives under `src/games/<id>/` with its own engine, UI, styles, and tests. The lobby only reads a small manifest — games do not share rules or state.

## Games

### Blood & Board (chess)

Standard chess movement. A capture does not remove a piece instantly — the two pieces fight.

- Every piece type has its own HP, MP, ATK, DEF, MAG, SPD, and spells.
- Duels are turn-based: Strike or cast.
- Magic includes stuns, heals, drains, fortify, and last stand.
- **Player vs Player** (hot-seat) and **Player vs Bot**.

## Scripts

```bash
pnpm install
pnpm test
pnpm dev      # Vite at http://localhost:5173
pnpm build
pnpm start    # Express serving the client build
```
