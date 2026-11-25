import "server-only";
import { getSql } from "./db";
import type { Sherbimi } from "./katalogu";

export type { Sherbimi } from "./katalogu";

// Pa të dhëna rezervë: nëse databaza nuk punon, faqja tregon gabim. Kështu nuk mbetet
// pa u vënë re që aplikacioni po shfaq të dhëna demo (mësim nga RideShare).
export async function lexoSherbimet(): Promise<Sherbimi[]> {
  const rows = await getSql()`
    SELECT id, kategoria, emri, pershkrimi, cmimi_euro::float8 AS cmimi, njesia
    FROM sherbimet
    ORDER BY kategoria, emri`;
  return rows.map((r) => ({
    id: String(r.id),
    kategoria: String(r.kategoria),
    emri: String(r.emri),
    pershkrimi: String(r.pershkrimi ?? ""),
    cmimi: r.cmimi === null || r.cmimi === undefined ? null : Number(r.cmimi),
    njesia: String(r.njesia),
  }));
}
