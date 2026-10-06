import type { Piece, Square } from "../engine/index.ts";
import { kitFor } from "../engine/index.ts";
import { attackLabel, pickAttack, poseFor, seedFightRng, type AttackKind } from "./attacks.ts";
import { pieceFigureHtml } from "./piece3d.ts";

function sleep(ms: number): Promise<void> {
  const duration = Number.isFinite(ms) ? Math.max(0, ms) : 800;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

function hpBar(piece: Piece, pct = 100): string {
  const width = Math.max(0, Math.min(100, pct));
  return `<span class="piece-hp"><span style="width:${width}%"></span></span>`;
}

function mountFighter(
  piece: Piece,
  box: DOMRect,
  extras: { left: number; top: number; facing: "left" | "right" },
): HTMLDivElement {
  const flyer = document.createElement("div");
  flyer.className = `actor flyer melee-fighter face-${extras.facing}`;
  flyer.style.position = "fixed";
  flyer.style.left = `${extras.left}px`;
  flyer.style.top = `${extras.top}px`;
  flyer.style.width = `${box.width}px`;
  flyer.style.height = `${box.height}px`;
  flyer.style.zIndex = "9999";
  flyer.style.pointerEvents = "none";
  flyer.innerHTML = pieceFigureHtml(piece, { hp: hpBar(piece, 100) });
  document.body.append(flyer);
  return flyer;
}

function setPose(el: HTMLElement, pose: string, attack?: AttackKind): void {
  const fig = el.querySelector(".fig3d");
  if (!fig) return;
  fig.classList.remove(
    "idle",
    "walking",
    "striking",
    "casting",
    "struck",
    "parrying",
    "fallen",
    "victorious",
    "atk-slash",
    "atk-thrust",
    "atk-smash",
    "atk-overhead",
    "atk-magic",
  );
  fig.classList.add(pose);
  if (attack) fig.classList.add(`atk-${attack}`);
}

function flashLabel(text: string, dest: DOMRect): HTMLDivElement {
  const label = document.createElement("div");
  label.className = "clash-label";
  label.textContent = text;
  label.style.left = `${dest.left + dest.width / 2}px`;
  label.style.top = `${dest.top - 8}px`;
  document.body.append(label);
  return label;
}

function burstAt(dest: DOMRect, magic = false): HTMLDivElement {
  const burst = document.createElement("div");
  burst.className = magic ? "clash-burst magic" : "clash-burst";
  burst.style.left = `${dest.left + dest.width / 2}px`;
  burst.style.top = `${dest.top + dest.height / 2}px`;
  document.body.append(burst);
  return burst;
}

function sparkArc(dest: DOMRect, fromLeft: boolean, kind: AttackKind): HTMLDivElement {
  const spark = document.createElement("div");
  spark.className = `weapon-arc ${fromLeft ? "from-left" : "from-right"} atk-${kind}`;
  spark.style.left = `${dest.left + dest.width / 2}px`;
  spark.style.top = `${dest.top + dest.height * 0.4}px`;
  document.body.append(spark);
  return spark;
}

function castBolt(fromEl: HTMLElement, toEl: HTMLElement): HTMLDivElement {
  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  const bolt = document.createElement("div");
  bolt.className = "magic-bolt";
  const x0 = a.left + a.width / 2;
  const y0 = a.top + a.height * 0.35;
  const x1 = b.left + b.width / 2;
  const y1 = b.top + b.height * 0.35;
  bolt.style.left = `${x0}px`;
  bolt.style.top = `${y0}px`;
  document.body.append(bolt);
  void bolt.offsetWidth;
  bolt.style.transform = `translate(${x1 - x0}px, ${y1 - y0}px) scale(1.4)`;
  return bolt;
}

function setHp(el: HTMLElement, pct: number): void {
  const bar = el.querySelector<HTMLElement>(".piece-hp span");
  if (bar) bar.style.width = `${Math.max(0, pct)}%`;
}

function slideTo(el: HTMLElement, left: number, top: number, ms: number): void {
  el.style.transition = `left ${ms}ms ease-in-out, top ${ms}ms ease-in-out`;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

async function playSwing(options: {
  actor: HTMLElement;
  foe: HTMLElement;
  dest: DOMRect;
  fromLeft: boolean;
  kind: AttackKind;
  lethal: boolean;
  foeHp: number;
  banner: Element | null;
  name: string;
}): Promise<number> {
  const { actor, foe, dest, fromLeft, kind, lethal, banner, name } = options;
  setPose(actor, poseFor(kind), kind);
  if (banner) {
    banner.textContent = lethal
      ? `${name} delivers the killing ${kind}!`
      : `${name} ${kind === "magic" ? "casts" : "attacks"} — ${kind}!`;
  }
  const label = flashLabel(attackLabel(kind, lethal), dest);
  let fx: HTMLElement | null = null;
  let burst: HTMLElement | null = null;
  if (kind === "magic") {
    fx = castBolt(actor, foe);
    await sleep(700);
    setPose(foe, "struck");
    burst = burstAt(dest, true);
  } else {
    fx = sparkArc(dest, fromLeft, kind);
    await sleep(520);
    setPose(foe, lethal ? "struck" : "parrying");
    burst = burstAt(dest, false);
  }
  const nextHp = lethal ? 0 : Math.max(8, options.foeHp - (kind === "magic" ? 38 : 28));
  setHp(foe, nextHp);
  await sleep(lethal ? 900 : 780);
  fx.remove();
  burst.remove();
  label.remove();
  setPose(actor, "idle");
  if (!lethal) setPose(foe, "idle");
  return nextHp;
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
  if (!destBtn || !fromBtn) {
    await sleep(1200);
    return;
  }
  const dest = destBtn.getBoundingClientRect();
  const origin = fromBtn.getBoundingClientRect();
  root.querySelectorAll<HTMLElement>(`[data-actor="${attacker.id}"], [data-actor="${defender.id}"]`).forEach((node) => {
    node.style.visibility = "hidden";
  });

  const attackerOnLeft = origin.left <= dest.left;
  const gap = dest.width * 0.22;
  const fightLeftA = dest.left + (attackerOnLeft ? -gap : dest.width * 0.12);
  const fightLeftD = dest.left + (attackerOnLeft ? dest.width * 0.12 : -gap);
  const fightTop = dest.top - dest.height * 0.12;
  const attackerEl = mountFighter(attacker, dest, {
    left: origin.left,
    top: origin.top,
    facing: attackerOnLeft ? "right" : "left",
  });
  const defenderEl = mountFighter(defender, dest, {
    left: dest.left,
    top: dest.top,
    facing: attackerOnLeft ? "left" : "right",
  });

  const banner = root.querySelector(".turn-banner");
  const weapon = kitFor(attacker.type).weapon;
  if (banner) banner.textContent = `${attacker.color} ${attacker.type} closes in with ${weapon}…`;

  setPose(attackerEl, "walking");
  slideTo(attackerEl, fightLeftA, fightTop, 720);
  slideTo(defenderEl, fightLeftD, fightTop, 480);
  await sleep(780);
  setPose(attackerEl, "idle");
  setPose(defenderEl, "idle");
  await sleep(420);

  const rng = seedFightRng(attacker, defender);
  const attackerName = `${attacker.color} ${attacker.type}`;
  const defenderName = `${defender.color} ${defender.type}`;

  let defenderHp = await playSwing({
    actor: attackerEl,
    foe: defenderEl,
    dest,
    fromLeft: attackerOnLeft,
    kind: pickAttack(rng, attacker.type),
    lethal: false,
    foeHp: 100,
    banner,
    name: attackerName,
  });

  await playSwing({
    actor: defenderEl,
    foe: attackerEl,
    dest,
    fromLeft: !attackerOnLeft,
    kind: pickAttack(rng, defender.type),
    lethal: false,
    foeHp: 100,
    banner,
    name: defenderName,
  });
  setHp(attackerEl, 78);

  defenderHp = await playSwing({
    actor: attackerEl,
    foe: defenderEl,
    dest,
    fromLeft: attackerOnLeft,
    kind: pickAttack(rng, attacker.type),
    lethal: false,
    foeHp: defenderHp,
    banner,
    name: attackerName,
  });

  await sleep(360);
  const killKind = pickAttack(rng, attacker.type);
  await playSwing({
    actor: attackerEl,
    foe: defenderEl,
    dest,
    fromLeft: attackerOnLeft,
    kind: killKind,
    lethal: true,
    foeHp: defenderHp,
    banner,
    name: attackerName,
  });

  setPose(defenderEl, "fallen");
  setHp(defenderEl, 0);
  if (banner) banner.textContent = `${attackerName} fells the ${defender.type}!`;
  await sleep(1100);

  setPose(attackerEl, "walking");
  slideTo(attackerEl, dest.left, dest.top, 900);
  await sleep(960);
  setPose(attackerEl, "victorious");
  if (banner) banner.textContent = `${attackerName} takes the square.`;
  await sleep(700);

  attackerEl.remove();
  defenderEl.remove();
}
