import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import FormaPorosise from "@/components/FormaPorosise";
import { providerat } from "@/lib/auth";
import { perdoruesiPerLexim } from "@/lib/profili";
import { lexoSherbimet, type Sherbimi } from "@/lib/sherbimet";

export default function PorosiERe() {
  return (
    <main>
      <h1>Porosi e re</h1>
      <p className="lead">
        Zgjidh artikujt dhe ditën kur i sjell te dyqani. Dyqani e pranon porosinë dhe ti e ndjek statusin te Porositë.
      </p>
      <Suspense fallback={<p>Po ngarkohet…</p>}>
        <Permbajtja />
      </Suspense>
    </main>
  );
}

async function Permbajtja() {
  await connection();
  let sherbimet: Sherbimi[];
  let roli: "klient" | "pronar" | null;
  try {
    sherbimet = await lexoSherbimet();
    roli = (await perdoruesiPerLexim())?.roli ?? null;
  } catch {
    return (
      <>
        <p role="alert">Nuk u lidhëm me databazën. Provo përsëri.</p>
        <Link className="action" href="/porosi-e-re">
          Provo përsëri
        </Link>
      </>
    );
  }
  return <FormaPorosise sherbimet={sherbimet} roli={roli} providerat={providerat} />;
}
