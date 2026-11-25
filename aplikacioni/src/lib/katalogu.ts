// Lloji i shërbimit dhe funksionet e pastra për shfaqje (pa server-only: përdoren edhe nga komponentët e klientit).

export type Sherbimi = {
  id: string;
  kategoria: string;
  emri: string;
  pershkrimi: string;
  cmimi: number | null; // euro; null = çmimi real ende nuk është dhënë nga pronari
  njesia: string;
};

// Grupon sipas kategorisë dhe ruan rendin e parë të shfaqjes.
export function grupoNgaKategoria(sherbimet: Sherbimi[]): [string, Sherbimi[]][] {
  const grupet = new Map<string, Sherbimi[]>();
  for (const s of sherbimet) {
    const lista = grupet.get(s.kategoria) ?? [];
    lista.push(s);
    grupet.set(s.kategoria, lista);
  }
  return [...grupet.entries()];
}
