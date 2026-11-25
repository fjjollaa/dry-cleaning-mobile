// Të dhënat e dyqanit real. Vetëm pronari i di ato: mos shpik asgjë.
// Plotëso çdo [PLOTËSO] pasi të flasësh me pronarin dhe merr lejen e tij ta shfaqësh.
export const BIZNESI = {
  emri: "[PLOTËSO] emri i dyqanit",
  kontakti: "[PLOTËSO] personi i kontaktit",
  telefoni: "[PLOTËSO] numri i telefonit",
  adresa: "[PLOTËSO] adresa",
  orari: "[PLOTËSO] orari i punës",
} as const;

export const PLOTESO = "[PLOTËSO]";

// Çmimi real vjen nga pronari. Pa të, shfaqet shenja që duhet plotësuar.
export function formatoCmimin(cmimi: number | null, njesia: string): string {
  if (cmimi === null) return `${PLOTESO} çmimi`;
  return `${cmimi.toFixed(2)} € / ${njesia}`;
}
