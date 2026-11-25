import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
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
    <>
      {!p ? (
        <p>Çmimorja është publike. Për të dërguar porosi hyr në llogarinë tënde.</p>
      ) : (
        <>
          <p>
            Përshëndetje, {p.emri}. Roli: <strong>{p.roli === "pronar" ? "dyqani (pronar)" : "klient"}</strong>.
          </p>
          {p.roli === "klient" && (
            <p className="small">
              Çdo llogari e re fillon si klient. Roli i dyqanit vendoset vetëm nga databaza (schema-pronari.sql).
              ID e llogarisë: <code>{p.id}</code>
            </p>
          )}
        </>
      )}
      <Hyrja brenda={Boolean(p)} providerat={providerat} />
      <p>
        <Link href="/porosite">Shko te porositë</Link>
      </p>
    </>
  );
}
