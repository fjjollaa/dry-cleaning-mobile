"use server";
import { dergoPorosineIme, ndryshoStatusinIm } from "@/lib/porosite";

// Çdo veprim është pikë hyrjeje e pabesueshme: identiteti dhe roli merren në server,
// klienti dërgon vetëm artikujt, datën, shënimet dhe kodin. Kthehet vetëm një kod i shkurtër.
export async function dergoPorosiNgaForma(hyrja: {
  artikujt: { sherbimiId: string; sasia: number }[];
  data: string;
  shenime: string;
  kodi: string;
}): Promise<string> {
  try {
    return await dergoPorosineIme({
      artikujt: hyrja?.artikujt,
      data: hyrja?.data,
      shenime: hyrja?.shenime,
      kodi: hyrja?.kodi,
    });
  } catch {
    return "databaza";
  }
}

export async function ndryshoStatusPorosie(porosiaId: string, statusiIRi: string): Promise<string> {
  try {
    return await ndryshoStatusinIm(String(porosiaId), String(statusiIRi));
  } catch {
    return "databaza";
  }
}
