// Prova e rregullave të serverit kundër Neon: porosia me disa artikuj, pa dublikata,
// hapat e statusit, kush çfarë sheh. Kërkon Node 22.18+ dhe tabelat nga schema.sql.
// Përdor vetëm rreshta fiktivë (TEST-… dhe shërbimet 'test-s1', 'test-s2') dhe i fshin në fund.
//
//   npm run test:porosite        (lexon DATABASE_URL nga .env.local)
import assert from "node:assert/strict";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { dergoPorosine, lexoPorosite, ndryshoStatusin } from "../src/lib/porosite-core.ts";

const PRONARI = { id: "TEST-PRONAR-1", roli: "pronar" };
const A = { id: "TEST-KLIENT-A", roli: "klient" };
const B = { id: "TEST-KLIENT-B", roli: "klient" };

async function pastro(sql) {
  await sql`DELETE FROM porosia_artikujt WHERE sherbimi_id LIKE 'test-%'`;
  await sql`DELETE FROM porosite WHERE klienti_id LIKE 'TEST-%'`;
  await sql`DELETE FROM sherbimet WHERE id LIKE 'test-%'`;
  await sql`DELETE FROM perdoruesit WHERE konto_id LIKE 'TEST-%'`;
}

async function pergatit(sql) {
  await pastro(sql);
  await sql`INSERT INTO perdoruesit (konto_id, emri, roli) VALUES
    ('TEST-PRONAR-1', 'Pronar prove', 'pronar'),
    ('TEST-KLIENT-A', 'Klient A', 'klient'), ('TEST-KLIENT-B', 'Klient B', 'klient')`;
  await sql`INSERT INTO sherbimet (id, kategoria, emri) VALUES
    ('test-s1', 'Prove', 'Artikull prove 1'), ('test-s2', 'Prove', 'Artikull prove 2')`;
}

// Datat merren nga databaza, në të njëjtën orë (Kosovë) që përdor rregulli.
async function datat(sql) {
  const r = await sql`SELECT
    ((now() AT TIME ZONE 'Europe/Belgrade')::date)::text AS sot,
    ((now() AT TIME ZONE 'Europe/Belgrade')::date + 1)::text AS neser,
    ((now() AT TIME ZONE 'Europe/Belgrade')::date + 30)::text AS dita30,
    ((now() AT TIME ZONE 'Europe/Belgrade')::date + 31)::text AS dita31,
    ((now() AT TIME ZONE 'Europe/Belgrade')::date - 1)::text AS dje`;
  return r[0];
}

const porosi = (data, artikujt = [{ sherbimiId: "test-s1", sasia: 2 }, { sherbimiId: "test-s2", sasia: 1 }]) => ({
  artikujt,
  data,
  shenime: "prove",
  kodi: randomUUID(),
});

async function numri(sql, tabela, klienti) {
  const r =
    tabela === "porosite"
      ? await sql`SELECT count(*)::int AS n FROM porosite WHERE klienti_id = ${klienti}`
      : await sql`SELECT count(*)::int AS n FROM porosia_artikujt WHERE sherbimi_id LIKE 'test-%'`;
  return r[0].n;
}

// Kthen numrin e provave që kaluan; hedh gabim në të parën që dështon.
export async function provo(sql, shkruaj = () => {}) {
  let kaluan = 0;
  const ok = (emri) => {
    kaluan += 1;
    shkruaj(`  PASS  ${emri}`);
  };

  await pergatit(sql);
  const d = await datat(sql);
  try {
    // Rasti 1: porosia ruhet me të gjithë artikujt; i njëjti kod nuk bën kopje.
    const p1 = porosi(d.neser);
    assert.equal(await dergoPorosine(sql, A, p1), "derguar");
    assert.equal(await dergoPorosine(sql, A, p1), "ekziston"); // klikim i dyfishtë: i njëjti kod
    assert.equal(await numri(sql, "porosite", A.id), 1);
    assert.equal(await numri(sql, "artikujt"), 2);
    assert.equal(await dergoPorosine(sql, A, porosi(d.sot)), "derguar"); // kod i ri = porosi e re
    assert.equal(await dergoPorosine(sql, A, porosi(d.dita30)), "derguar");
    ok("porosia ruhet me të gjithë artikujt; i njëjti kod nuk bën kopje; kod i ri bën porosi të re");

    // Rasti 2: data jashtë "sot deri në 30 ditë" ose shërbim që nuk ekziston: refuzohet dhe nuk ruhet asgjë.
    const para = await numri(sql, "artikujt");
    assert.equal(await dergoPorosine(sql, B, porosi(d.dje)), "data");
    assert.equal(await dergoPorosine(sql, B, porosi(d.dita31)), "data");
    assert.equal(
      await dergoPorosine(sql, B, porosi(d.neser, [{ sherbimiId: "test-s1", sasia: 1 }, { sherbimiId: "test-nuk-ka", sasia: 1 }])),
      "mungon",
    );
    assert.equal(await numri(sql, "porosite", B.id), 0);
    assert.equal(await numri(sql, "artikujt"), para);
    ok("data e keqe ose shërbimi që nuk ekziston refuzohet dhe nuk lë porosi gjysmë të ruajtur");

    // Rasti 3: kush çfarë sheh.
    const pronari = await lexoPorosite(sql, PRONARI);
    assert.equal(pronari.pamja, "pronar");
    // Pronari sheh të gjitha porositë e dyqanit; këtu shikojmë vetëm ato të klientit provë.
    const teProves = pronari.porosite.filter((p) => p.klienti === "Klient A");
    assert.equal(teProves.length, 3);
    assert.deepEqual(teProves[0].artikujt, [
      { emri: "Artikull prove 1", sasia: 2 },
      { emri: "Artikull prove 2", sasia: 1 },
    ]);
    const klientiA = await lexoPorosite(sql, A);
    assert.equal(klientiA.pamja, "klient");
    assert.equal(klientiA.porosite.length, 3);
    assert.ok(klientiA.porosite.every((p) => p.klienti === undefined));
    assert.equal((await lexoPorosite(sql, B)).porosite.length, 0);
    const mysafiri = await lexoPorosite(sql, null);
    assert.equal(mysafiri.pamja, "mysafir");
    assert.equal(mysafiri.porosite.length, 0);
    ok("pronari (dyqani) sheh të gjitha porositë me artikuj; klienti vetëm të tijat; mysafiri asgjë");

    // Rasti 4: vetëm pronari ndryshon statusin, një hap çdo herë, pa kthim mbrapsht.
    const id = teProves[0].id;
    assert.equal(await ndryshoStatusin(sql, A, id, "pranuar"), "ndaluar"); // klienti nuk mund
    assert.equal(await ndryshoStatusin(sql, PRONARI, id, "gati"), "rend"); // kalim i hapit
    assert.equal(await ndryshoStatusin(sql, PRONARI, "999999999", "pranuar"), "mungon");
    assert.equal(await ndryshoStatusin(sql, PRONARI, id, "pranuar"), "ndryshuar");
    assert.equal(await ndryshoStatusin(sql, PRONARI, id, "pranuar"), "tashme");
    assert.equal(await ndryshoStatusin(sql, PRONARI, id, "refuzuar"), "rend"); // pas pranimit nuk refuzohet
    assert.equal(await ndryshoStatusin(sql, PRONARI, id, "ne_pastrim"), "ndryshuar");
    assert.equal(await ndryshoStatusin(sql, PRONARI, id, "gati"), "ndryshuar");
    assert.equal((await lexoPorosite(sql, A)).porosite.find((p) => p.id === id).statusi, "gati");
    assert.equal(await ndryshoStatusin(sql, PRONARI, id, "marre"), "ndryshuar");
    assert.equal(await ndryshoStatusin(sql, PRONARI, id, "pranuar"), "rend"); // nuk kthehet mbrapsht
    ok("vetëm pronari ndryshon statusin, vetëm një hap përpara, pa kthim mbrapsht");

    // Rasti 5: roli i hequr në databazë ndalon menjëherë (roli lexohet nga databaza, jo nga ekrani).
    const tjeter = teProves.find((p) => p.id !== id).id;
    await sql`UPDATE perdoruesit SET roli = 'klient' WHERE konto_id = 'TEST-PRONAR-1'`;
    assert.equal(await ndryshoStatusin(sql, PRONARI, tjeter, "pranuar"), "ndaluar");
    await sql`UPDATE perdoruesit SET roli = 'pronar' WHERE konto_id = 'TEST-PRONAR-1'`;
    ok("nëse roli 'pronar' hiqet nga databaza, ndryshimi i statusit refuzohet");

    // Rasti 6: dy klikime njëkohësisht për të njëjtin hap; vetëm njëri e ndryshon.
    const [x, y] = await Promise.all([
      ndryshoStatusin(sql, PRONARI, tjeter, "pranuar"),
      ndryshoStatusin(sql, PRONARI, tjeter, "pranuar"),
    ]);
    assert.deepEqual([x, y].sort(), ["ndryshuar", "tashme"]);
    ok("dy klikime njëkohësisht për të njëjtin hap: vetëm njëri ndryshon statusin");

    // Rasti 7: refuzimi nga 'pritje' është përfundimtar.
    const e_treta = (await lexoPorosite(sql, PRONARI)).porosite.find(
      (p) => p.klienti === "Klient A" && p.statusi === "pritje",
    ).id;
    assert.equal(await ndryshoStatusin(sql, PRONARI, e_treta, "refuzuar"), "ndryshuar");
    assert.equal(await ndryshoStatusin(sql, PRONARI, e_treta, "pranuar"), "rend");
    ok("'refuzuar' vetëm nga 'pritje' dhe është përfundimtar");

    // Rasti 8: hyrja e pavlefshme refuzohet para databazës.
    assert.equal(await ndryshoStatusin(sql, PRONARI, "1; DROP TABLE porosite", "pranuar"), "fushe");
    assert.equal(await dergoPorosine(sql, A, { ...porosi(d.neser), kodi: "jo-uuid" }), "fushe");
    assert.equal(await dergoPorosine(sql, A, porosi(d.neser, [{ sherbimiId: "test-s1", sasia: 21 }])), "fushe");
    ok("kodet, ID-të dhe sasitë e pavlefshme refuzohen");
  } finally {
    await pastro(sql);
  }
  return kaluan;
}

// Ekzekutimi nga terminali kundër Neon.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL mungon. Përdor: npm run test:porosite (lexon .env.local).");
    process.exit(1);
  }
  const { neon } = await import("@neondatabase/serverless");
  try {
    const kaluan = await provo(neon(url), console.log);
    console.log(`${kaluan} prova kaluan.`);
  } catch (gabim) {
    console.error("Prova dështoi:", gabim instanceof Error ? gabim.message : gabim);
    process.exit(1);
  }
}
