"use server";
import { getSql } from "@/lib/db";
import { krijoLlogari, validoRegjistrimin } from "@/lib/llogari-core";

// Veprim i pabesueshëm: klienti dërgon vetëm fushat e formës. Kthehet një kod i shkurtër:
// krijuar | ekziston | shume | emri | email | fjalekalimi | databaza
export async function regjistrohu(hyrja: { emri: string; email: string; fjalekalimi: string }): Promise<string> {
  const v = validoRegjistrimin({ emri: hyrja?.emri, email: hyrja?.email, fjalekalimi: hyrja?.fjalekalimi });
  if (!v.ok) return v.fusha;
  try {
    const r = await krijoLlogari(getSql(), v.vlerat);
    return r.rezultati;
  } catch {
    return "databaza";
  }
}
