// Rregullat e porosive. Funksionet marrin `sql` si parametër, që të provohen edhe pa Next.js
// (shih scripts/test-validim.mjs dhe scripts/test-porosite.mjs). Ky skedar nuk importon
// asgjë dhe nuk lexon sesionin: identiteti dhe roli vijnë nga lib/porosite.ts (sesioni + Neon).

export type Sql = {
  (strings: TemplateStringsArray, ...values: unknown[]): PromiseLike<Record<string, unknown>[]>;
};

export type Roli = "klient" | "pronar";
export type Perdorues = { id: string; roli: Roli };
export type Statusi = "pritje" | "pranuar" | "ne_pastrim" | "gati" | "marre" | "refuzuar";

export const STATUSET: readonly Statusi[] = ["pritje", "pranuar", "ne_pastrim", "gati", "marre", "refuzuar"];

// Statusi ecën vetëm përpara, një hap çdo herë. "refuzuar" lejohet vetëm nga "pritje".
export const HAPI_TJETER: Partial<Record<Statusi, Statusi>> = {
  pritje: "pranuar",
  pranuar: "ne_pastrim",
  ne_pastrim: "gati",
  gati: "marre",
};

export type ArtikulliPamje = { emri: string; sasia: number };
export type Porosia = {
  id: string;
  data: string; // YYYY-MM-DD
  shenime: string;
  statusi: Statusi;
  artikujt: ArtikulliPamje[];
  klienti?: string; // vetëm për pronarin
};
export type PorositePamje = { pamja: "mysafir" | "klient" | "pronar"; porosite: Porosia[] };

export type RezultatiDergimit = "derguar" | "ekziston" | "mungon" | "data" | "ndaluar" | "fushe";
export type RezultatiStatusit = "ndryshuar" | "tashme" | "rend" | "ndaluar" | "mungon" | "fushe";

export const SASIA_MAX = 20;
export const ARTIKUJ_MAX = 20;
export const DITE_MAX = 30; // data e sjelljes: sot deri në 30 ditë
export const SHENIME_MAX = 200;

const ID_SHERBIMI = /^[a-z0-9-]{1,32}$/;
const ID_POROSIA = /^\d{1,15}$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const KODI = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const KARAKTERE_KONTROLLI = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export type Artikulli = { sherbimiId: string; sasia: number };
export type PorosiaInput = { artikujt: Artikulli[]; data: string; shenime: string; kodi: string };

function dataEVlefshme(data: string): boolean {
  const [v, m, d] = data.split("-").map(Number);
  const t = new Date(Date.UTC(v, m - 1, d));
  return t.getUTCFullYear() === v && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

function validoSasine(vlera: unknown): number | null {
  const tekst = String(vlera ?? "").trim();
  if (!/^\d{1,2}$/.test(tekst)) return null;
  const sasia = Number(tekst);
  return sasia >= 1 && sasia <= SASIA_MAX ? sasia : null;
}

// Hyrja vjen nga klienti, pra është e pabesueshme. Kthen vlerat e pastruara ose null.
// Kontrolli i "sot deri në 30 ditë" dhe i shërbimeve që ekzistojnë bëhet në SQL.
export function validoPorosine(raw: {
  artikujt?: unknown;
  data?: unknown;
  shenime?: unknown;
  kodi?: unknown;
}): PorosiaInput | null {
  if (!Array.isArray(raw.artikujt) || raw.artikujt.length < 1 || raw.artikujt.length > ARTIKUJ_MAX) return null;

  const pare = new Set<string>();
  const artikujt: Artikulli[] = [];
  for (const a of raw.artikujt) {
    if (typeof a !== "object" || a === null) return null;
    const sherbimiId = String((a as { sherbimiId?: unknown }).sherbimiId ?? "");
    const sasia = validoSasine((a as { sasia?: unknown }).sasia);
    if (!ID_SHERBIMI.test(sherbimiId) || sasia === null || pare.has(sherbimiId)) return null;
    pare.add(sherbimiId);
    artikujt.push({ sherbimiId, sasia });
  }

  const kodi = String(raw.kodi ?? "").toLowerCase();
  if (!KODI.test(kodi)) return null;

  const data = String(raw.data ?? "").trim();
  if (!DATA.test(data) || !dataEVlefshme(data)) return null;

  const shenime = String(raw.shenime ?? "").trim();
  if (shenime.length > SHENIME_MAX || KARAKTERE_KONTROLLI.test(shenime)) return null;

  return { artikujt, data, shenime, kodi };
}

export function eshteStatus(vlera: unknown): vlera is Statusi {
  return typeof vlera === "string" && (STATUSET as readonly string[]).includes(vlera);
}

// Statusi që duhet të ketë porosia tani, që të lejohet kalimi te `i_ri`.
export function statusiParaprak(i_ri: Statusi): Statusi | null {
  if (i_ri === "refuzuar") return "pritje";
  for (const nga of STATUSET) if (HAPI_TJETER[nga] === i_ri) return nga;
  return null;
}

function artikujtNga(vlera: unknown): ArtikulliPamje[] {
  const lista = typeof vlera === "string" ? (JSON.parse(vlera) as unknown) : vlera;
  if (!Array.isArray(lista)) return [];
  return lista.map((a) => ({
    emri: String((a as { emri?: unknown }).emri ?? ""),
    sasia: Number((a as { sasia?: unknown }).sasia ?? 0),
  }));
}

// Një lexim i vetëm. Klienti sheh vetëm porositë e veta; pronari (stafi i dyqanit) të gjitha.
export async function lexoPorosite(sql: Sql, p: Perdorues | null): Promise<PorositePamje> {
  if (!p) return { pamja: "mysafir", porosite: [] };

  const rows =
    p.roli === "pronar"
      ? await sql`
          SELECT po.id, po.data_sjelljes::text AS data, po.shenime, po.statusi, u.emri AS klienti,
            (SELECT json_agg(json_build_object('emri', s.emri, 'sasia', pa.sasia) ORDER BY s.emri)
               FROM porosia_artikujt pa JOIN sherbimet s ON s.id = pa.sherbimi_id
              WHERE pa.porosia_id = po.id) AS artikujt
          FROM porosite po
          JOIN perdoruesit u ON u.konto_id = po.klienti_id
          ORDER BY (po.statusi IN ('marre', 'refuzuar')), po.data_sjelljes, po.id
          LIMIT 100`
      : await sql`
          SELECT po.id, po.data_sjelljes::text AS data, po.shenime, po.statusi,
            (SELECT json_agg(json_build_object('emri', s.emri, 'sasia', pa.sasia) ORDER BY s.emri)
               FROM porosia_artikujt pa JOIN sherbimet s ON s.id = pa.sherbimi_id
              WHERE pa.porosia_id = po.id) AS artikujt
          FROM porosite po
          WHERE po.klienti_id = ${p.id}
          ORDER BY po.id DESC
          LIMIT 50`;

  return {
    pamja: p.roli,
    porosite: rows.map((r) => ({
      id: String(r.id),
      data: String(r.data),
      shenime: String(r.shenime ?? ""),
      statusi: r.statusi as Statusi,
      artikujt: artikujtNga(r.artikujt),
      ...(p.roli === "pronar" ? { klienti: String(r.klienti ?? "Klient") } : {}),
    })),
  };
}

// Klienti dërgon porosi me disa artikuj. Klienti vjen nga sesioni, jo nga forma.
// Porosia dhe artikujt ruhen në NJË deklaratë: ose futen të gjitha, ose asnjë.
// Kodi i porosisë ndalon kopjen kur klikohet dy herë.
export async function dergoPorosine(
  sql: Sql,
  p: Perdorues,
  raw: Parameters<typeof validoPorosine>[0],
): Promise<RezultatiDergimit> {
  const hyrja = validoPorosine(raw);
  if (!hyrja) return "fushe";
  if (p.roli !== "klient") return "ndaluar";

  const artikujt = JSON.stringify(hyrja.artikujt.map((a) => ({ sid: a.sherbimiId, sasia: a.sasia })));
  const n = hyrja.artikujt.length;

  const rows = await sql`
    WITH o AS (
      INSERT INTO porosite (klienti_id, kodi, data_sjelljes, shenime)
      SELECT ${p.id}, ${hyrja.kodi}::uuid, ${hyrja.data}::date, ${hyrja.shenime}
      WHERE ${hyrja.data}::date BETWEEN (now() AT TIME ZONE 'Europe/Belgrade')::date
                                    AND (now() AT TIME ZONE 'Europe/Belgrade')::date + ${DITE_MAX}::int
        AND (SELECT count(*) FROM jsonb_to_recordset(${artikujt}::jsonb) AS x(sid text, sasia int)
               JOIN sherbimet s ON s.id = x.sid) = ${n}::int
      ON CONFLICT (klienti_id, kodi) DO NOTHING
      RETURNING id
    )
    INSERT INTO porosia_artikujt (porosia_id, sherbimi_id, sasia)
    SELECT o.id, x.sid, x.sasia
    FROM o, jsonb_to_recordset(${artikujt}::jsonb) AS x(sid text, sasia int)
    RETURNING porosia_id`;
  if (rows.length === n) return "derguar";

  // Asnjë rresht i ri: gjej arsyen, që klikimi i dytë të mos duket si gabim.
  const ekziston = await sql`
    SELECT 1 FROM porosite WHERE klienti_id = ${p.id} AND kodi = ${hyrja.kodi}::uuid`;
  if (ekziston.length > 0) return "ekziston";
  const gjetur = await sql`
    SELECT count(*)::int AS n
    FROM jsonb_to_recordset(${artikujt}::jsonb) AS x(sid text, sasia int)
    JOIN sherbimet s ON s.id = x.sid`;
  return Number(gjetur[0]?.n) === n ? "data" : "mungon";
}

// Ndryshimi i statusit është NJË deklaratë SQL:
//  - roli 'pronar' lexohet nga databaza (jo nga ekrani);
//  - statusi kalon vetëm nga hapi paraprak në atë të ri, pra i njëjti klikim numërohet një herë;
//  - rreshti kyçet gjatë UPDATE, pra dy klikime njëkohësisht radhiten.
export async function ndryshoStatusin(
  sql: Sql,
  pronari: Perdorues,
  porosiaId: string,
  statusiIRi: string,
): Promise<RezultatiStatusit> {
  if (!ID_POROSIA.test(porosiaId) || !eshteStatus(statusiIRi) || statusiIRi === "pritje") return "fushe";
  if (pronari.roli !== "pronar") return "ndaluar";
  const paraprak = statusiParaprak(statusiIRi);
  if (!paraprak) return "fushe";

  const rows = await sql`
    UPDATE porosite SET statusi = ${statusiIRi}, ndryshuar = now()
    WHERE id = ${porosiaId} AND statusi = ${paraprak}
      AND EXISTS (SELECT 1 FROM perdoruesit WHERE konto_id = ${pronari.id} AND roli = 'pronar')
    RETURNING id`;
  if (rows.length === 1) return "ndryshuar";

  const r = await sql`
    SELECT po.statusi,
      EXISTS (SELECT 1 FROM perdoruesit WHERE konto_id = ${pronari.id} AND roli = 'pronar') AS eshte_pronar
    FROM porosite po WHERE po.id = ${porosiaId}`;
  if (!r[0]) return "mungon";
  if (r[0].eshte_pronar !== true) return "ndaluar";
  if (r[0].statusi === statusiIRi) return "tashme";
  return "rend";
}
