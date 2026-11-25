import "server-only";
import { getSql } from "./db";
import { perdoruesiPerLexim, profiliIm } from "./profili";
import { dergoPorosine, lexoPorosite, ndryshoStatusin, type PorositePamje } from "./porosite-core";

export async function lexoPorositeMia() {
  const p = await perdoruesiPerLexim();
  // Mysafiri nuk ka porosi; nuk ka nevojë për databazën.
  if (!p) return { pamja: "mysafir", porosite: [] } satisfies PorositePamje;
  return lexoPorosite(getSql(), p);
}

export async function dergoPorosineIme(raw: Parameters<typeof dergoPorosine>[2]) {
  const p = await profiliIm(); // siguron rreshtin në `perdoruesit` (çelës i huaj)
  if (!p) return "hyr" as const;
  return dergoPorosine(getSql(), { id: p.id, roli: p.roli }, raw);
}

export async function ndryshoStatusinIm(porosiaId: string, statusiIRi: string) {
  const p = await profiliIm();
  if (!p) return "hyr" as const;
  return ndryshoStatusin(getSql(), { id: p.id, roli: p.roli }, porosiaId, statusiIRi);
}
