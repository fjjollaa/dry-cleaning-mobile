// Llogaritë me email + fjalëkalim. Funksionet marrin `sql` si parametër, që të provohen edhe pa Next.js
// (shih scripts/test-validim.mjs dhe scripts/test-llogari.mjs). Ky skedar përdoret vetëm në server.
// Fjalëkalimi ruhet vetëm si hash scrypt me kripë të rastësishme; nuk ruhet kurrë i qartë.
import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";

type Sql = (strings: TemplateStringsArray, ...values: unknown[]) => PromiseLike<Record<string, unknown>[]>;

export const FJALEKALIM_MIN = 8;
export const FJALEKALIM_MAX = 128;
export const DESHTIME_MAX = 5; // pas kaq përpjekjesh të gabuara llogaria bllokohet
export const BLLOKIM_MINUTA = 15;
export const REGJISTRIME_MAX = 30; // kufi i përgjithshëm: llogari të reja për 10 minuta (kundër spam-it)

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

const KARAKTERE_KONTROLLI = /[\u0000-\u001F\u007F]/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

function derivo(fjalekalimi: string, kripa: Buffer, n: number, r: number, p: number): Promise<Buffer> {
  return new Promise((zgjidh, refuzo) => {
    scrypt(fjalekalimi.normalize("NFKC"), kripa, KEYLEN, { N: n, r, p, maxmem: 64 * 1024 * 1024 }, (gabim, celesi) =>
      gabim ? refuzo(gabim) : zgjidh(celesi),
    );
  });
}

// Formati: scrypt$N$r$p$kripa(base64)$hash(base64)
export async function hashoFjalekalimin(fjalekalimi: string): Promise<string> {
  const kripa = randomBytes(16);
  const hash = await derivo(fjalekalimi, kripa, N, R, P);
  return `scrypt$${N}$${R}$${P}$${kripa.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifikoFjalekalimin(fjalekalimi: string, ruajtur: string): Promise<boolean> {
  const pjeset = ruajtur.split("$");
  if (pjeset.length !== 6 || pjeset[0] !== "scrypt") return false;
  const [n, r, p] = [Number(pjeset[1]), Number(pjeset[2]), Number(pjeset[3])];
  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  try {
    const pritur = Buffer.from(pjeset[5], "base64");
    const marre = await derivo(fjalekalimi, Buffer.from(pjeset[4], "base64"), n, r, p);
    return pritur.length === marre.length && timingSafeEqual(pritur, marre);
  } catch {
    return false;
  }
}

// Hash i rremë: kur email-i nuk ekziston, bëjmë të njëjtën punë, që koha e përgjigjes të mos tregojë nëse ekziston.
let hashiIRreme: Promise<string> | null = null;
function merrHashinERreme() {
  hashiIRreme ??= hashoFjalekalimin(randomUUID());
  return hashiIRreme;
}

export type HyrjaRegjistrimit = { emri: string; email: string; fjalekalimi: string };
export type GabimiFushes = "emri" | "email" | "fjalekalimi";

// Hyrja vjen nga klienti, pra është e pabesueshme. Kthen vlerat e pastruara ose emrin e fushës së gabuar.
export function validoRegjistrimin(raw: {
  emri?: unknown;
  email?: unknown;
  fjalekalimi?: unknown;
}): { ok: true; vlerat: HyrjaRegjistrimit } | { ok: false; fusha: GabimiFushes } {
  const emri = String(raw.emri ?? "").trim().replace(/\s+/g, " ");
  if (emri.length < 2 || emri.length > 60 || KARAKTERE_KONTROLLI.test(emri)) return { ok: false, fusha: "emri" };

  const email = String(raw.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email) || KARAKTERE_KONTROLLI.test(email)) return { ok: false, fusha: "email" };

  const fjalekalimi = typeof raw.fjalekalimi === "string" ? raw.fjalekalimi : "";
  if (fjalekalimi.length < FJALEKALIM_MIN || fjalekalimi.length > FJALEKALIM_MAX || !fjalekalimi.trim()) {
    return { ok: false, fusha: "fjalekalimi" };
  }
  return { ok: true, vlerat: { emri, email, fjalekalimi } };
}

export type RezultatiRegjistrimit =
  | { rezultati: "krijuar"; id: string }
  | { rezultati: "ekziston" | "shume" };

// Krijimi është NJË deklaratë: kufiri i përgjithshëm dhe rreshti i ri bashkë. Email-i unik mbrohet nga indeksi.
export async function krijoLlogari(sql: Sql, vlerat: HyrjaRegjistrimit): Promise<RezultatiRegjistrimit> {
  const id = `email:${randomUUID()}`;
  const email = vlerat.email.trim().toLowerCase(); // edhe pa validim, email-i ruhet gjithmonë me shkronja të vogla
  const hash = await hashoFjalekalimin(vlerat.fjalekalimi);
  const rows = await sql`
    INSERT INTO perdoruesit (konto_id, emri, email, fjalekalimi)
    SELECT ${id}, ${vlerat.emri}, ${email}, ${hash}
    WHERE (SELECT count(*) FROM perdoruesit
            WHERE email IS NOT NULL AND krijuar > now() - interval '10 minutes') < ${REGJISTRIME_MAX}::int
    ON CONFLICT DO NOTHING
    RETURNING konto_id`;
  if (rows.length === 1) return { rezultati: "krijuar", id };

  const ekziston = await sql`SELECT 1 FROM perdoruesit WHERE lower(email) = ${email}`;
  return { rezultati: ekziston.length > 0 ? "ekziston" : "shume" };
}

export type RezultatiHyrjes = { ok: true; id: string; emri: string } | { ok: false; arsyeja: "gabim" | "bllokuar" };

// Hyrja: pas DESHTIME_MAX përpjekjesh të gabuara llogaria bllokohet BLLOKIM_MINUTA minuta (kundër hamendësimit).
export async function verifikoHyrjen(sql: Sql, emailRaw: unknown, fjalekalimiRaw: unknown): Promise<RezultatiHyrjes> {
  const email = String(emailRaw ?? "").trim().toLowerCase();
  const fjalekalimi = typeof fjalekalimiRaw === "string" ? fjalekalimiRaw : "";
  if (!email || email.length > 254 || !fjalekalimi || fjalekalimi.length > FJALEKALIM_MAX) {
    return { ok: false, arsyeja: "gabim" };
  }

  const rows = await sql`
    SELECT konto_id, emri, fjalekalimi, (bllokuar_deri IS NOT NULL AND bllokuar_deri > now()) AS bllokuar
    FROM perdoruesit
    WHERE lower(email) = ${email} AND fjalekalimi IS NOT NULL`;
  const llogaria = rows[0];

  if (!llogaria) {
    await verifikoFjalekalimin(fjalekalimi, await merrHashinERreme());
    return { ok: false, arsyeja: "gabim" };
  }
  if (llogaria.bllokuar === true) return { ok: false, arsyeja: "bllokuar" };

  const id = String(llogaria.konto_id);
  if (await verifikoFjalekalimin(fjalekalimi, String(llogaria.fjalekalimi))) {
    await sql`
      UPDATE perdoruesit SET deshtime = 0, bllokuar_deri = NULL
      WHERE konto_id = ${id} AND (deshtime <> 0 OR bllokuar_deri IS NOT NULL)`;
    return { ok: true, id, emri: String(llogaria.emri) };
  }

  // Një deklaratë: numëron përpjekjen e gabuar dhe e bllokon llogarinë kur arrin kufirin.
  await sql`
    UPDATE perdoruesit SET
      deshtime = CASE WHEN bllokuar_deri IS NOT NULL AND bllokuar_deri <= now() THEN 1 ELSE deshtime + 1 END,
      bllokuar_deri = CASE
        WHEN (CASE WHEN bllokuar_deri IS NOT NULL AND bllokuar_deri <= now() THEN 1 ELSE deshtime + 1 END) >= ${DESHTIME_MAX}::int
        THEN now() + (${BLLOKIM_MINUTA}::int * interval '1 minute')
        ELSE NULL END
    WHERE konto_id = ${id}`;
  return { ok: false, arsyeja: "gabim" };
}
