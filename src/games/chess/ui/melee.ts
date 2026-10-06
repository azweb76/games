import type { Piece, Square } from "../engine/index.ts";
import { kitFor } from "../engine/index.ts";
import { pieceFigureHtml } from "./piece3d.ts";

function sleep(ms: number): Promise<void> {
  const duration = Number.isFinite(ms) ? Math.max(0, ms) : 800;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function hpBar(piece: Piece, pct = (piece.hp / piece.maxHp) * 100): string {
  const width = Math.max(0, Math.min(100, pct));
  return `<span class="piece-hp"><span style="width:${width}%"></span></span>`;
}

function mountFighter(
  piece: Piece,
  box: DOMRect,
  extras: { left: number; top: number; facing: "left" | "right"; scale?: number },
): HTMLDivElement {
  const scale = extras.scale ?? 1.85;
  const width = box.width * scale;
  const height = box.height * scale;
  const flyer = document.createElement("div");
  flyer.className = `actor flyer melee-fighter face-${extras.facing}`;
  flyer.style.position = "fixed";
  flyer.style.left = `${extras.left}px`;
  flyer.style.top = `${extras.top}px`;
  flyer.style.width = `${width}px`;
  flyer.style.height = `${height}px`;
  flyer.style.zIndex = "9999";
  flyer.style.pointerEvents = "none";
  flyer.innerHTML = pieceFigureHtml(piece, { hp: hpBar(piece, 100) });
  document.body.append(flyer);
  return flyer;
}

function setPose(el: HTMLElement, pose: string): void {
  const fig = el.querySelector(".fig3d");
  if (!fig) return;
  fig.classList.remove("idle", "walking", "striking", "casting", "struck", "parrying", "fallen", "victorious");
  fig.classList.add(pose);
}

function flashLabel(text: string, dest: DOMRect): HTMLDivElement {
  const label = document.createElement("div");
  label.className = "clash-label";
  label.textContent = text;
  label.style.left = `${dest.left + dest.width / 2}px`;
  label.style.top = `${dest.top}px`;
  document.body.append(label);
  return label;
}

function burstAt(dest: DOMRect): HTMLDivElement {
  const burst = document.createElement("div");
  burst.className = "clash-burst";
  burst.style.left = `${dest.left + dest.width / 2}px`;
  burst.style.top = `${dest.top + dest.height / 2}px`;
  document.body.append(burst);
  return burst;
}

function sparkArc(dest: DOMRect, fromLeft: boolean): HTMLDivElement {
  const spark = document.createElement("div");
  spark.className = `weapon-arc ${fromLeft ? "from-left" : "from-right"}`;
  spark.style.left = `${dest.left + dest.width / 2}px`;
  spark.style.top = `${dest.top + dest.height * 0.35}px`;
  document.body.append(spark);
  return spark;
}

function setHp(el: HTMLElement, pct: number): void {
  const bar = el.querySelector<HTMLElement>(".piece-hp span");
  if (bar) bar.style.width = `${Math.max(0, pct)}%`;
}

export async function playMeleeDuel(options: {
  root: HTMLElement;
  attacker: Piece;
  defender: Piece;
  from: Square;
  to: Square;
}): Promise<void> {
  const { root, attacker, defender, from, to } = options;
  const destBtn = root.querySelector<HTMLElement>(`.sq[data-file="${to.file}"][data-rank="${to.rank}"]`);
  const fromBtn = root.querySelector<HTMLElement>(`.sq[data-file="${from.file}"][data-rank="${from.rank}"]`);
  if (!destBtn) {
    await sleep(900);
    return;
  }
  const dest = destBtn.getBoundingClientRect();
  const origin = (fromBtn ?? destBtn).getBoundingClientRect();
  const boardActors = [...root.querySelectorAll<HTMLElement>(".piece-layer .actor")];
  boardActors.forEach((node) => {
    node.style.visibility = "hidden";
  });

  const attackerOnLeft = origin.left <= dest.left;
  const attackerLeft = dest.left + (attackerOnLeft ? -dest.width * 0.62 : dest.width * 0.28);
  const defenderLeft = dest.left + (attackerOnLeft ? dest.width * 0.18 : -dest.width * 0.52);
  const top = dest.top - dest.height * 0.55;
  const attackerEl = mountFighter(attacker, dest, {
    left: attackerLeft,
    top,
    facing: attackerOnLeft ? "right" : "left",
  });
  const defenderEl = mountFighter(defender, dest, {
    left: defenderLeft,
    top,
    facing: attackerOnLeft ? "left" : "right",
  });

  const banner = root.querySelector(".turn-banner");
  const weapon = kitFor(attacker.type).weapon;
  if (banner) banner.textContent = `${attacker.color} ${attacker.type} draws ${weapon}!`;

  await sleep(220);
  setPose(attackerEl, "striking");
  const arc1 = sparkArc(dest, attackerOnLeft);
  await sleep(280);
  setPose(defenderEl, "parrying");
  const burst1 = burstAt(dest);
  const clash = flashLabel("CLASH!", dest);
  setHp(defenderEl, 62);
  await sleep(520);
  arc1.remove();
  burst1.remove();

  setPose(defenderEl, "striking");
  setPose(attackerEl, "parrying");
  const arc2 = sparkArc(dest, !attackerOnLeft);
  await sleep(420);
  setPose(attackerEl, "struck");
  setHp(attackerEl, 88);
  arc2.remove();
  clash.remove();

  if (banner) banner.textContent = "Steel rings — the attacker presses in!";
  await sleep(180);
  setPose(attackerEl, "striking");
  const arc3 = sparkArc(dest, attackerOnLeft);
  const burst2 = burstAt(dest);
  const steel = flashLabel("STEEL!", dest);
  await sleep(260);
  setPose(defenderEl, "struck");
  setHp(defenderEl, 18);
  await sleep(380);
  arc3.remove();
  burst2.remove();
  steel.remove();

  setPose(attackerEl, "striking");
  const finishing = flashLabel("FALLEN!", dest);
  const burst3 = burstAt(dest);
  await sleep(240);
  setPose(defenderEl, "fallen");
  setHp(defenderEl, 0);
  if (banner) banner.textContent = `${attacker.color} ${attacker.type} cuts down the ${defender.type}!`;
  await sleep(900);
  setPose(attackerEl, "victorious");
  finishing.remove();
  burst3.remove();
  await sleep(420);
  attackerEl.remove();
  defenderEl.remove();
  boardActors.forEach((node) => {
    node.style.visibility = "";
  });
}
