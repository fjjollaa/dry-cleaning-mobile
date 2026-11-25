// Ekzekuton një skedar SQL kundër Neon, deklaratë pas deklarate (si në SQL Editor).
// Nuk printon kurrë DATABASE_URL.
//
//   npm run db:skema                      (ekzekuton schema.sql)
//   node --env-file=.env.local scripts/apliko-skemen.mjs schema-pronari.sql
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL mungon. Përdor: npm run db:skema (lexon .env.local).");
  process.exit(1);
}

const skedari = process.argv[2] ?? "schema.sql";
// Heq rreshtat-komente; ndan te ";" në fund të rreshtit (skedarët tanë nuk kanë ";" brenda tekstit).
const deklaratat = readFileSync(skedari, "utf8")
  .split(/\r?\n/)
  .filter((rreshti) => !rreshti.trim().startsWith("--"))
  .join("\n")
  .split(/;\s*(?:\n|$)/)
  .map((d) => d.trim())
  .filter(Boolean);

const sql = neon(url);
try {
  let rezultati = [];
  for (const deklarata of deklaratat) rezultati = await sql.query(deklarata);
  console.log(`${deklaratat.length} deklarata u ekzekutuan nga ${skedari}.`);
  if (rezultati.length > 0) console.table(rezultati); // rezultati i deklaratës së fundit (SELECT)
} catch (gabim) {
  console.error("Dështoi:", gabim instanceof Error ? gabim.message : gabim);
  process.exit(1);
}
