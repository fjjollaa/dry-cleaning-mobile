import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import banner from "@/assets/banner.jpg";
import { ListaCmimeve } from "@/components/ListaCmimeve";
import { BIZNESI } from "@/lib/biznesi";
import { lexoSherbimet, type Sherbimi } from "@/lib/sherbimet";

export default function Home() {
  return (
    <main>
      <header className="hero">
        <Image
          src={banner}
          alt="Këmisha të mbuluara me plastikë, të varura në vegla, me një makinë larëse në sfond"
          quality={90}
          loading="eager"
          fetchPriority="high"
          sizes="(max-width: 720px) 100vw, 688px"
          className="hero-img"
        />
        <div className="hero-text">
          <h1>{BIZNESI.emri}</h1>
          <p>Dërgo porosinë nga telefoni dhe ndiq statusin e rrobave.</p>
        </div>
      </header>

      <section className="card" aria-label="Të dhënat e dyqanit">
        <dl className="info">
          <div>
            <dt>Adresa</dt>
            <dd>{BIZNESI.adresa}</dd>
          </div>
          <div>
            <dt>Telefoni</dt>
            <dd>{BIZNESI.telefoni}</dd>
          </div>
          <div>
            <dt>Orari</dt>
            <dd>{BIZNESI.orari}</dd>
          </div>
        </dl>
        <Link className="action action-bllok" href="/porosi-e-re">
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
