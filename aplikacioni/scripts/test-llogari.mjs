// Prova e llogarive me email + fjalëkalim kundër Neon: krijimi, email i përsëritur, hyrja, bllokimi pas
// përpjekjeve të gabuara dhe kufiri kundër spam-it. Kërkon Node 22.18+ dhe tabelat nga schema.sql.
// Përdor vetëm adresa fiktive …@example.test dhe i fshin në fund.
//
//   npm run test:llogari        (lexon DATABASE_URL nga .env.local)
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  DESHTIME_MAX,
  REGJISTRIME_MAX,
  hashoFjalekalimin,
  krijoLlogari,
  verifikoHyrjen,
} from "../src/lib/llogari-core.ts";

const EMAIL = "test-llogari-a@example.test";
const FJALEKALIMI = "fjalekalim-prove-123";

async function pastro(sql) {
  await sql`DELETE FROM perdoruesit WHERE email LIKE '%@example.test'`;
}

async function gjendja(sql, id) {
  const r = await sql`SELECT deshtime, bllokuar_deri IS NOT NULL AND bllokuar_deri > now() AS bllokuar FROM perdoruesit WHERE konto_id = ${id}`;
  return { deshtime: Number(r[0].deshtime), bllokuar: r[0].bllokuar === true };
}

// Kthen numrin e provave që kaluan; hedh gabim në të parën që dështon.
export async function provo(sql, shkruaj = () => {}) {
  let kaluan = 0;
  const ok = (emri) => {
    kaluan += 1;
    shkruaj(`  PASS  ${emri}`);
  };

  await pastro(sql);
  try {
    // Rasti 1: krijimi dhe ruajtja e sigurt.
    const krijuar = await krijoLlogari(sql, { emri: "Llogari Prove", email: EMAIL, fjalekalimi: FJALEKALIMI });
    assert.equal(krijuar.rezultati, "krijuar");
    assert.ok(krijuar.id.startsWith("email:"));
    const rreshti = (await sql`SELECT email, fjalekalimi, roli FROM perdoruesit WHERE konto_id = ${krijuar.id}`)[0];
    assert.equal(rreshti.roli, "klient"); // çdo llogari e re është klient
    assert.ok(String(rreshti.fjalekalimi).startsWith("scrypt$"));
    assert.ok(!String(rreshti.fjalekalimi).includes(FJALEKALIMI));
    ok("llogaria krijohet si klient; fjalëkalimi ruhet vetëm si hash scrypt");

    // Rasti 2: një llogari për email, pa dallim shkronjash.
    assert.equal((await krijoLlogari(sql, { emri: "Tjetër", email: EMAIL, fjalekalimi: "tjeter-fjalekalim" })).rezultati, "ekziston");
    assert.equal((await krijoLlogari(sql, { emri: "Tjetër", email: EMAIL.toUpperCase(), fjalekalimi: "tjeter-fjalekalim" })).rezultati, "ekziston");
    ok("email-i i përsëritur (edhe me shkronja të mëdha) refuzohet");

    // Rasti 3: hyrja e saktë dhe e gabuar.
    const hyrja = await verifikoHyrjen(sql, EMAIL.toUpperCase(), FJALEKALIMI);
    assert.deepEqual(hyrja, { ok: true, id: krijuar.id, emri: "Llogari Prove" });
    assert.deepEqual(await verifikoHyrjen(sql, EMAIL, "fjalekalim-gabim"), { ok: false, arsyeja: "gabim" });
    assert.deepEqual(await verifikoHyrjen(sql, "nuk-ekziston@example.test", FJALEKALIMI), { ok: false, arsyeja: "gabim" });
    assert.equal((await gjendja(sql, krijuar.id)).deshtime, 1);
    ok("hyrja e saktë punon (pa dallim shkronjash te email-i); fjalëkalimi i gabuar dhe email-i i panjohur refuzohen");

    // Rasti 4: hyrja e saktë e vë numruesin në zero.
    assert.equal((await verifikoHyrjen(sql, EMAIL, FJALEKALIMI)).ok, true);
    assert.equal((await gjendja(sql, krijuar.id)).deshtime, 0);
    ok("hyrja e suksesshme e rikthen numëruesin e përpjekjeve në zero");

    // Rasti 5: bllokimi pas DESHTIME_MAX përpjekjesh të gabuara; edhe fjalëkalimi i saktë refuzohet.
    for (let i = 0; i < DESHTIME_MAX; i++) {
      assert.equal((await verifikoHyrjen(sql, EMAIL, `gabim-${i}`)).arsyeja, "gabim");
    }
    assert.equal((await gjendja(sql, krijuar.id)).bllokuar, true);
    assert.deepEqual(await verifikoHyrjen(sql, EMAIL, FJALEKALIMI), { ok: false, arsyeja: "bllokuar" });
    ok(`pas ${DESHTIME_MAX} përpjekjesh të gabuara llogaria bllokohet, edhe për fjalëkalimin e saktë`);

    // Rasti 6: pas skadimit të bllokimit hyrja punon përsëri.
    await sql`UPDATE perdoruesit SET bllokuar_deri = now() - interval '1 minute' WHERE konto_id = ${krijuar.id}`;
    assert.equal((await verifikoHyrjen(sql, EMAIL, FJALEKALIMI)).ok, true);
    assert.deepEqual(await gjendja(sql, krijuar.id), { deshtime: 0, bllokuar: false });
    ok("kur bllokimi skadon, hyrja e saktë punon dhe numëruesi rikthehet në zero");

    // Rasti 7: një gabim i parë pas skadimit fillon numërimin nga 1 (nuk bllokon menjëherë).
    await sql`UPDATE perdoruesit SET deshtime = ${DESHTIME_MAX}, bllokuar_deri = now() - interval '1 minute' WHERE konto_id = ${krijuar.id}`;
    assert.equal((await verifikoHyrjen(sql, EMAIL, "gabim-pas-skadimit")).arsyeja, "gabim");
    assert.deepEqual(await gjendja(sql, krijuar.id), { deshtime: 1, bllokuar: false });
    ok("gabimi i parë pas skadimit numërohet si 1 dhe nuk bllokon menjëherë");

    // Rasti 8: llogaria pa fjalëkalim (p.sh. Google) nuk hyn me email.
    await sql`INSERT INTO perdoruesit (konto_id, emri, email) VALUES ('TEST-PA-FJALEKALIM', 'Pa fjalekalim', 'test-pa-fjalekalim@example.test')`;
    assert.equal((await verifikoHyrjen(sql, "test-pa-fjalekalim@example.test", "cfaredo-fjalekalimi")).ok, false);
    ok("llogaria pa fjalëkalim nuk mund të hyjë me email");

    // Rasti 9: kufiri i përgjithshëm kundër spam-it.
    await sql`DELETE FROM perdoruesit WHERE konto_id = 'TEST-PA-FJALEKALIM'`;
    const hash = await hashoFjalekalimin("nuk-perdoret-123");
    for (let i = 0; i < REGJISTRIME_MAX; i++) {
      await sql`INSERT INTO perdoruesit (konto_id, emri, email, fjalekalimi) VALUES (${`TEST-SPAM-${i}`}, 'Spam', ${`test-spam-${i}@example.test`}, ${hash})`;
    }
    assert.equal(
      (await krijoLlogari(sql, { emri: "Shume", email: "test-shume@example.test", fjalekalimi: "fjalekalim-i-gjate" })).rezultati,
      "shume",
    );
    ok(`pas ${REGJISTRIME_MAX} llogarive të reja për 10 minuta, regjistrimet e reja ndalen përkohësisht`);
  } finally {
    await pastro(sql);
  }
  return kaluan;
}

// Ekzekutimi nga terminali kundër Neon.
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL mungon. Përdor: npm run test:llogari (lexon .env.local).");
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
