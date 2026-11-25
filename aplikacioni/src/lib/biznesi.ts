// Të dhënat e dyqanit. VLERA SHEMBULL: emri, telefoni, adresa dhe orari nuk janë të një dyqani real.
// Zëvendësoji me faktet e vërteta pasi të flasësh me pronarin. Kontakti nuk shfaqet te faqet,
// por projekti kërkon një person real kontakti: plotësoje me emrin e tij.
export const BIZNESI = {
  emri: "Pastrim Kimik Qendra",
  kontakti: "[PLOTËSO] personi i kontaktit",
  telefoni: "+383 44 000 000",
  adresa: "Qendër, Prishtinë",
  orari: "E hënë – e shtunë 08:00 – 19:00 · E diel mbyllur",
} as const;

export const PLOTESO = "[PLOTËSO]";

// Çmimi vjen nga databaza. Pa çmim të dhënë, shfaqet shenja që duhet plotësuar.
export function formatoCmimin(cmimi: number | null, njesia: string): string {
  if (cmimi === null) return `${PLOTESO} çmimi`;
  return `${cmimi.toFixed(2)} € / ${njesia}`;
}
