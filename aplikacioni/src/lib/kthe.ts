// Adresa ku kthehet përdoruesi pas hyrjes. Pranojmë vetëm rrugë brenda faqes (kundër "open redirect").
export function sigurKthe(vlera: unknown, parazgjedhja = "/"): string {
  if (typeof vlera !== "string") return parazgjedhja;
  if (vlera.length > 200 || !vlera.startsWith("/") || vlera.startsWith("//") || vlera.includes("\\")) return parazgjedhja;
  if (/[\u0000-\u001F\u007F]/.test(vlera)) return parazgjedhja;
  return vlera;
}
