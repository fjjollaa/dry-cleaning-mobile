import { connection } from "next/server";
import { BIZNESI } from "@/lib/biznesi";
import { lexoSherbimet } from "@/lib/sherbimet";

// Vetëm të dhënat publike: shërbimet, çmimet dhe të dhënat e dyqanit. Asnjë profil, email ose sesion.
// Service worker e ruan këtë përgjigje, që çmimorja të lexohet edhe pa internet.
export async function GET() {
  await connection();
  try {
    const sherbimet = await lexoSherbimet();
    return Response.json({ biznesi: BIZNESI, sherbimet }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Lista nuk mund të lexohet tani." }, { status: 503 });
  }
}
