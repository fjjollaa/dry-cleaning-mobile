import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import ButoniHyrja from "@/components/ButoniHyrja";
import Hyrja from "@/components/Hyrja";
import { providerat } from "@/lib/auth";
import { profiliIm, type Profil } from "@/lib/profili";

export default function Panel() {
  return (
    <main>
      <h1>Paneli im</h1>
      <Suspense fallback={<p>Po ngarkohet…</p>}>
        <PanelPermbajtja />
      </Suspense>
      <section className="card pa-internet">
        <h3>Pa internet</h3>
        <p className="small">
          Çmimorja dhe orari lexohen edhe pa internet, por kopja e ruajtur mund të jetë e vjetër. Porositë nuk dërgohen
          dhe nuk ndryshohen pa internet.
        </p>
        <a href="/offline.html">Hap çmimoren e ruajtur</a>
      </section>
      <p className="small qendra">
        <Link href="/privatesia">Politika e privatësisë</Link>
      </p>
    </main>
  );
}

async function PanelPermbajtja() {
  await connection();
  let p: Profil | null;
  try {
    p = await profiliIm();
  } catch {
    return (
      <>
        <p role="alert">Nuk u lidhëm me databazën. Kontrollo Neon dhe provo përsëri.</p>
        <Link className="action" href="/panel">
          Provo përsëri
        </Link>
      </>
    );
  }

  return (
    <section className="card profili">
      {!p ? (
        <p>Çmimorja është publike. Për të dërguar porosi hyr në llogarinë tënde.</p>
      ) : (
        <>
          <p>
            Përshëndetje, <strong>{p.emri}</strong>
          </p>
          <p>
            Roli: <span className="chip">{p.roli === "pronar" ? "dyqani (pronar)" : "klient"}</span>
          </p>
          {p.roli === "klient" && (
            <p className="small">
              Çdo llogari e re fillon si klient. Roli i dyqanit vendoset vetëm nga databaza (schema-pronari.sql).
              ID e llogarisë: <code>{p.id}</code>
            </p>
          )}
        </>
      )}
      {p ? (
        <Hyrja brenda providerat={providerat} />
      ) : (
        <div className="veprimet veprimet-kolone">
          <ButoniHyrja className="action action-bllok" />
          <Link className="action action-dytesor action-bllok" href="/regjistrohu?kthe=%2Fpanel">
            Krijo llogari
          </Link>
        </div>
      )}
      <p>
        <Link href="/porosite">Shko te porositë</Link>
      </p>
    </section>
  );
}
