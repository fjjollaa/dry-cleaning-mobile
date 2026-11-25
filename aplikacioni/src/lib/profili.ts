import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { getSql } from "./db";
import type { Perdorues, Roli } from "./porosite-core";

export type Profil = { id: string; emri: string; roli: Roli };

// ID e llogarisë vjen nga sesioni dhe ka formën "google:123", "github:123" ose "email:<uuid>".
const KONTO = /^((google|github):\d{1,30}|email:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

// Identiteti vjen nga sesioni, roli nga Neon. Ky lexim nuk shkruan asgjë:
// përdoret për faqet dhe për rileximin çdo 5 sekonda.
export async function perdoruesiPerLexim(): Promise<Perdorues | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id || !KONTO.test(id)) return null;
  const rows = await getSql()`SELECT roli FROM perdoruesit WHERE konto_id = ${id}`;
  return { id, roli: rows[0]?.roli === "pronar" ? "pronar" : "klient" };
}

// Përdoret vetëm për veprime dhe për /panel: krijon profilin te hyrja e parë.
export async function profiliIm(): Promise<Profil | null> {
  const session = await getServerSession(authOptions);
  const id = session?.user?.id;
  if (!id || !KONTO.test(id)) return null;
  const sql = getSql();
  // Çdo hyrje e re fillon si klient. Asnjë formular nuk mund të zgjedhë rol.
  await sql`INSERT INTO perdoruesit (konto_id, emri) VALUES (${id}, ${session.user.name ?? "Klient"})
    ON CONFLICT (konto_id) DO NOTHING`;
  const rows = await sql`SELECT konto_id AS id, emri, roli FROM perdoruesit WHERE konto_id = ${id}`;
  const r = rows[0];
  return { id: String(r.id), emri: String(r.emri), roli: r.roli === "pronar" ? "pronar" : "klient" };
}
