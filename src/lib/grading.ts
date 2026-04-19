// Système de notation tunisien /20
export function mention(moy: number): { label: string; color: string } {
  if (moy >= 16) return { label: "Très Bien", color: "highlight" };
  if (moy >= 14) return { label: "Bien", color: "accent" };
  if (moy >= 12) return { label: "Assez Bien", color: "foreground" };
  if (moy >= 10) return { label: "Passable", color: "muted-foreground" };
  return { label: "Insuffisant", color: "destructive" };
}

export type GradeRow = { type: string; note: number; poids: number; date_evaluation: string };

export function moyenneMatiere(grades: GradeRow[]): number {
  if (!grades.length) return 0;
  const sumW = grades.reduce((s, g) => s + Number(g.poids), 0);
  if (sumW === 0) return 0;
  return grades.reduce((s, g) => s + Number(g.note) * Number(g.poids), 0) / sumW;
}

export function moyenneGenerale(parMatiere: { moyenne: number; coefficient: number }[]): number {
  const sumC = parMatiere.reduce((s, m) => s + m.coefficient, 0);
  if (sumC === 0) return 0;
  return parMatiere.reduce((s, m) => s + m.moyenne * m.coefficient, 0) / sumC;
}

export const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : "—");
