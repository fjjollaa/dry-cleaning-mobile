import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ListaCmimeve } from "@/components/ListaCmimeve";
import { BIZNESI } from "@/lib/biznesi";
import { lexoSherbimet, type Sherbimi } from "@/lib/sherbimet";

export default function Home() {
  return (
    <main>
      <h1>Pastrim kimik</h1>

      <section className="card" aria-label="Të dhënat e dyqanit">
        <h2>{BIZNESI.emri}</h2>
        <p>Adresa: {BIZNESI.adresa}</p>
        <p>Telefoni: {BIZNESI.telefoni}</p>
        <p>Orari: {BIZNESI.orari}</p>
        <Link className="action" href="/porosi-e-re">
          Bëj një porosi
        </Link>
      </section>

      <h2>Çmimorja</h2>
      <Suspense fallback={<p>Po ngarkohet çmimorja…</p>}>
        <CmimorjaPermbajtja />
      </Suspense>
    </main>
  );
}

async function CmimorjaPermbajtja() {
  await connection();
  let sherbimet: Sherbimi[];
  try {
    sherbimet = await lexoSherbimet();
  } catch {
    return (
      <>
        <p role="alert">Nuk u lidhëm me databazën. Provo përsëri.</p>
        <Link className="action" href="/">
          Provo përsëri
        </Link>
      </>
    );
  }

  if (sherbimet.length === 0) return <p>Nuk ka shërbime për momentin.</p>;
  return <ListaCmimeve sherbimet={sherbimet} />;
}
