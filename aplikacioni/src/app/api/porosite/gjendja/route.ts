import { connection } from "next/server";
import { lexoPorositeMia } from "@/lib/porosite";

// Gjendja personale: nuk ruhet në cache dhe nuk ripërdoret për një sesion tjetër.
const PA_CACHE = { "Cache-Control": "no-store" };

export async function GET() {
  await connection();
  try {
    return Response.json(await lexoPorositeMia(), { headers: PA_CACHE });
  } catch {
    // Pa të dhëna rezervë: një gjendje e rreme do ta fshihte ndërprerjen nga përdoruesi.
    return Response.json({ error: "Gjendja nuk mund të lexohet tani." }, { status: 503, headers: PA_CACHE });
  }
}
