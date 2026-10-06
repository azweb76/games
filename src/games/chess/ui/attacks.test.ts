import { describe, expect, it } from "vitest";
import { createRng } from "../engine/rng.ts";
import { attackLabel, magicChanceFor, pickAttack, poseFor, type AttackKind } from "./attacks.ts";

describe("melee attack rolls", () => {
  it("gives casters a higher chance of magic than militia", () => {
    expect(magicChanceFor("bishop")).toBeGreaterThan(magicChanceFor("pawn"));
    expect(magicChanceFor("queen")).toBeGreaterThan(magicChanceFor("rook"));
  });

  it("rolls both steel and magic across a seeded stream", () => {
    const rng = createRng(42);
    const seen = new Set<AttackKind>();
    for (let i = 0; i < 80; i += 1) seen.add(pickAttack(rng, "bishop"));
    expect(seen.has("magic")).toBe(true);
    expect((["slash", "thrust", "smash", "overhead"] as AttackKind[]).some((kind) => seen.has(kind))).toBe(true);
  });

  it("can roll every physical attack kind", () => {
    const rng = createRng(9);
    const seen = new Set<AttackKind>();
    for (let i = 0; i < 120; i += 1) seen.add(pickAttack(rng, "pawn"));
    expect(seen.has("slash")).toBe(true);
    expect(seen.has("thrust")).toBe(true);
    expect(seen.has("smash")).toBe(true);
    expect(seen.has("overhead")).toBe(true);
  });

  it("labels lethal magic separately from a steel killing blow", () => {
    expect(attackLabel("slash")).toBe("SLASH!");
    expect(attackLabel("magic")).toBe("MAGIC!");
    expect(attackLabel("slash", true)).toBe("KILLING BLOW!");
    expect(attackLabel("magic", true)).toBe("ARCANE KILL!");
    expect(poseFor("magic")).toBe("casting");
    expect(poseFor("thrust")).toBe("striking");
  });
});
