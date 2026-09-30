import { describe, expect, it } from "vitest";
import { fmt, mention, moyenneGenerale, moyenneMatiere } from "./grading";

describe("grading", () => {
  it("maps averages to Tunisian honours", () => {
    expect(mention(16).label).toBe("Très Bien");
    expect(mention(14).label).toBe("Bien");
    expect(mention(12).label).toBe("Assez Bien");
    expect(mention(10).label).toBe("Passable");
    expect(mention(9.99).label).toBe("Insuffisant");
  });

  it("computes a weighted subject average", () => {
    const grades = [
      { type: "DS", note: 10, poids: 0.3, date_evaluation: "2026-01-10" },
      { type: "Examen", note: 15, poids: 0.7, date_evaluation: "2026-01-20" },
    ];
    expect(moyenneMatiere(grades)).toBeCloseTo(13.5);
    expect(moyenneMatiere([])).toBe(0);
  });

  it("computes a coefficient-weighted overall average", () => {
    expect(moyenneGenerale([{ moyenne: 12, coefficient: 2 }, { moyenne: 15, coefficient: 1 }])).toBe(13);
    expect(moyenneGenerale([])).toBe(0);
  });

  it("formats numbers to two decimals", () => {
    expect(fmt(13.456)).toBe("13.46");
    expect(fmt(NaN)).toBe("—");
  });
});
