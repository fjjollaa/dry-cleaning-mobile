// Prova pa databazë: validimi i hyrjes dhe rregullat që refuzohen para se të prekin SQL.
// Kërkon Node 22.18+ (importon .ts direkt).
//
//   npm run test:validim
import assert from "node:assert/strict";
import {
  dergoPorosine,
  eshteStatus,
  ndryshoStatusin,
  statusiParaprak,
  validoPorosine,
} from "../src/lib/porosite-core.ts";
import {
  hashoFjalekalimin,
  validoRegjistrimin,
  verifikoFjalekalimin,
  verifikoHyrjen,
} from "../src/lib/llogari-core.ts";

// Nëse një rregull e lë një hyrje të keqe të arrijë te SQL, kjo `sql` hedh gabim dhe prova dështon.
const sqlQePrekLigjet = () => {
  throw new Error("SQL u thirr për një hyrje që duhej refuzuar para databazës.");
};

let kaluan = 0;
const ok = (emri) => {
  kaluan += 1;
  console.log(`  PASS  ${emri}`);
};

const KODI = "123e4567-e89b-42d3-a456-426614174000";
const mire = {
  artikujt: [
    { sherbimiId: "kemishe", sasia: "3" },
    { sherbimiId: "kostum", sasia: 1 },
  ],
  data: "2026-12-01",
  shenime: "  pa xhep  ",
  kodi: KODI,
};

// 1) Hyrja e vlefshme pastrohet.
assert.deepEqual(validoPorosine(mire), {
  artikujt: [
    { sherbimiId: "kemishe", sasia: 3 },
    { sherbimiId: "kostum", sasia: 1 },
  ],
  data: "2026-12-01",
  shenime: "pa xhep",
  kodi: KODI,
});
assert.equal(validoPorosine({ ...mire, shenime: undefined })?.shenime, "");
assert.equal(validoPorosine({ ...mire, kodi: KODI.toUpperCase() })?.kodi, KODI);
ok("hyrja e vlefshme pranohet; shënimet pastrohen; kodi kthehet me shkronja të vogla");

// 2) Artikujt.
const me = (artikujt) => validoPorosine({ ...mire, artikujt });
assert.equal(me([]), null);
assert.equal(me(undefined), null);
assert.equal(me("kemishe"), null);
assert.equal(me([null]), null);
assert.equal(me([{ sherbimiId: "kemishe", sasia: 1 }, { sherbimiId: "kemishe", sasia: 2 }]), null); // i përsëritur
assert.equal(me(Array.from({ length: 21 }, (_, i) => ({ sherbimiId: `s${i}`, sasia: 1 }))), null);
for (const sasia of ["0", "21", "1.5", "-1", "abc", "", " ", "１", "100", null, undefined, {}]) {
  assert.equal(me([{ sherbimiId: "kemishe", sasia }]), null, `sasia ${JSON.stringify(sasia)} duhej refuzuar`);
}
for (const sherbimiId of ["Kemishe", "x'; DROP TABLE porosite;--", "", "a".repeat(33), "kemi she", "kemi_she", null]) {
  assert.equal(me([{ sherbimiId, sasia: 1 }]), null, `ID ${JSON.stringify(sherbimiId)} duhej refuzuar`);
}
ok("artikujt: bosh, të përsëritur, tepër, sasi jashtë 1–20 ose ID me SQL refuzohen");

// 3) Kodi i porosisë.
for (const kodi of ["", "123", "not-a-uuid", `${KODI}x`, "123e4567e89b42d3a456426614174000", null, undefined]) {
  assert.equal(validoPorosine({ ...mire, kodi }), null, `kodi ${JSON.stringify(kodi)} duhej refuzuar`);
}
ok("kodi duhet të jetë UUID");

// 4) Data.
for (const data of ["2026-02-30", "2026-13-01", "2026-00-10", "26-01-01", "2026-1-1", "", "01.12.2026", "2026-12-01T00:00", null]) {
  assert.equal(validoPorosine({ ...mire, data }), null, `data ${JSON.stringify(data)} duhej refuzuar`);
}
assert.notEqual(validoPorosine({ ...mire, data: "2028-02-29" }), null); // viti i brishtë
assert.equal(validoPorosine({ ...mire, data: "2027-02-29" }), null);
ok("data e pavlefshme refuzohet; 29 shkurti vetëm në vit të brishtë");

// 5) Shënimet.
assert.notEqual(validoPorosine({ ...mire, shenime: "a".repeat(200) }), null);
assert.equal(validoPorosine({ ...mire, shenime: "a".repeat(201) }), null);
assert.equal(validoPorosine({ ...mire, shenime: "mire\u0000keq" }), null);
assert.equal(validoPorosine({ ...mire, shenime: "mire\u0007keq" }), null);
assert.notEqual(validoPorosine({ ...mire, shenime: "rresht 1\nrresht 2" }), null);
ok("shënimet deri në 200 shkronja; karakteret e kontrollit (NUL) refuzohen");

// 6) Hapat e statusit.
assert.equal(statusiParaprak("pranuar"), "pritje");
assert.equal(statusiParaprak("ne_pastrim"), "pranuar");
assert.equal(statusiParaprak("gati"), "ne_pastrim");
assert.equal(statusiParaprak("marre"), "gati");
assert.equal(statusiParaprak("refuzuar"), "pritje");
assert.equal(statusiParaprak("pritje"), null);
assert.equal(eshteStatus("gati"), true);
assert.equal(eshteStatus("fshij"), false);
assert.equal(eshteStatus(undefined), false);
ok("statusi ecën vetëm përpara; refuzimi vetëm nga 'pritje'");

// 7) Këto refuzohen para databazës (sqlQePrekLigjet nuk duhet të thirret kurrë).
const klienti = { id: "google:1", roli: "klient" };
const pronari = { id: "google:2", roli: "pronar" };
assert.equal(await dergoPorosine(sqlQePrekLigjet, klienti, { ...mire, artikujt: [] }), "fushe");
assert.equal(await dergoPorosine(sqlQePrekLigjet, pronari, mire), "ndaluar");
assert.equal(await ndryshoStatusin(sqlQePrekLigjet, klienti, "5", "pranuar"), "ndaluar");
assert.equal(await ndryshoStatusin(sqlQePrekLigjet, pronari, "5; DROP TABLE porosite", "pranuar"), "fushe");
assert.equal(await ndryshoStatusin(sqlQePrekLigjet, pronari, "5", "pritje"), "fushe");
assert.equal(await ndryshoStatusin(sqlQePrekLigjet, pronari, "5", "fshij"), "fushe");
ok("klienti nuk ndryshon status, pronari nuk porosit, hyrja e keqe nuk arrin te SQL");

// 8) Regjistrimi: validimi i fushave.
const rg = (o) => validoRegjistrimin({ emri: "Arta Berisha", email: "Arta@Shembull.com", fjalekalimi: "fjalekalim123", ...o });
assert.deepEqual(rg({}), {
  ok: true,
  vlerat: { emri: "Arta Berisha", email: "arta@shembull.com", fjalekalimi: "fjalekalim123" },
});
assert.equal(rg({ emri: "  Arta   Berisha  " }).vlerat.emri, "Arta Berisha");
for (const emri of ["", "A", "x".repeat(61), "Arta\u0000", null, undefined]) {
  assert.deepEqual(rg({ emri }), { ok: false, fusha: "emri" }, `emri ${JSON.stringify(emri)}`);
}
for (const email of ["", "pa-ate.com", "a@b", "a b@c.com", "@c.com", `${"x".repeat(250)}@c.com`, "a@@c.com", null]) {
  assert.deepEqual(rg({ email }), { ok: false, fusha: "email" }, `email ${JSON.stringify(email)}`);
}
for (const fjalekalimi of ["", "shkurt", "       ", "x".repeat(129), null, 12345678, undefined]) {
  assert.deepEqual(rg({ fjalekalimi }), { ok: false, fusha: "fjalekalimi" }, `fjalekalimi ${JSON.stringify(fjalekalimi)}`);
}
assert.equal(rg({ fjalekalimi: "x".repeat(128) }).ok, true);
ok("regjistrimi: emri, email-i dhe fjalëkalimi (8–128) validohen; email-i kthehet me shkronja të vogla");

// 9) Hash i fjalëkalimit: kripë e rastësishme, verifikim i saktë, asnjë tekst i qartë.
const h1 = await hashoFjalekalimin("fjalekalim123");
const h2 = await hashoFjalekalimin("fjalekalim123");
assert.notEqual(h1, h2); // kripë e ndryshme çdo herë
assert.ok(h1.startsWith("scrypt$16384$8$1$"));
assert.ok(!h1.includes("fjalekalim123"));
assert.equal(await verifikoFjalekalimin("fjalekalim123", h1), true);
assert.equal(await verifikoFjalekalimin("fjalekalim124", h1), false);
assert.equal(await verifikoFjalekalimin("", h1), false);
assert.equal(await verifikoFjalekalimin("fjalekalim123", "jo-hash"), false);
assert.equal(await verifikoFjalekalimin("fjalekalim123", "scrypt$1$1$1$AA==$AA=="), false);
ok("hash scrypt me kripë të rastësishme; fjalëkalimi i gabuar dhe hash-i i dëmtuar refuzohen");

// 10) Hyrja me të dhëna bosh ose të gjata nuk arrin te databaza.
assert.deepEqual(await verifikoHyrjen(sqlQePrekLigjet, "", "x"), { ok: false, arsyeja: "gabim" });
assert.deepEqual(await verifikoHyrjen(sqlQePrekLigjet, "a@b.com", ""), { ok: false, arsyeja: "gabim" });
assert.deepEqual(await verifikoHyrjen(sqlQePrekLigjet, "a@b.com", "x".repeat(129)), { ok: false, arsyeja: "gabim" });
assert.deepEqual(await verifikoHyrjen(sqlQePrekLigjet, null, null), { ok: false, arsyeja: "gabim" });
ok("hyrja me email/fjalëkalim bosh ose tepër të gjatë refuzohet para databazës");

console.log(`${kaluan} prova kaluan.`);
