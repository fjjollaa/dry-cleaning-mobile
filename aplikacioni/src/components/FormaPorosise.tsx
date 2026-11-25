"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { dergoPorosiNgaForma } from "@/app/porosite/actions";
import { formatoCmimin } from "@/lib/biznesi";
import { grupoNgaKategoria, type Sherbimi } from "@/lib/katalogu";

const SASIA_MAX = 20;

const MESAZHET: Record<string, string> = {
  derguar: "Porosia u dërgua. Dyqani duhet ta pranojë; statusin e sheh te Porositë.",
  ekziston: "Kjo porosi u dërgua më parë. Shiko te Porositë.",
  mungon: "Një shërbim nuk u gjet. Rifresko faqen dhe provo përsëri.",
  data: "Dita duhet të jetë nga sot deri në 30 ditë.",
  ndaluar: "Ky veprim nuk lejohet për llogarinë tënde.",
  fushe: "Kontrollo fushat: të paktën një artikull, sasia 1–20, dita e vlefshme, shënimet deri në 200 shkronja.",
  hyr: "Hyr në llogari para se të dërgosh porosi.",
  databaza: "Porosia nuk u ruajt. Provo përsëri.",
};

type Roli = "klient" | "pronar" | null;

export default function FormaPorosise({ sherbimet, roli }: { sherbimet: Sherbimi[]; roli: Roli }) {
  const [sasite, setSasite] = useState<Record<string, number>>({});
  const [duke, setDuke] = useState(false);
  const [mesazh, setMesazh] = useState("");
  const [sukses, setSukses] = useState(false);
  // Kodi i porosisë krijohet herën e parë që shtypet "Dërgo" dhe mbahet derisa porosia të ruhet.
  // Provë e përsëritur (klikim i dyfishtë, rrjet i keq) dërgon të njëjtin kod, pra nuk bën kopje.
  const kodiRef = useRef<string | null>(null);

  if (roli === null) {
    return (
      <p>
        <Link href="/panel">Hyr në llogari</Link> për të dërguar porosi.
      </p>
    );
  }
  if (roli === "pronar") {
    return <p>Llogaria jote është e dyqanit. Porositë e klientëve i pranon te faqja Porositë.</p>;
  }

  const gjithsej = Object.values(sasite).reduce((a, b) => a + b, 0);

  function ndrysho(id: string, ndryshimi: number) {
    setSasite((s) => {
      const e_re = Math.max(0, Math.min(SASIA_MAX, (s[id] ?? 0) + ndryshimi));
      return { ...s, [id]: e_re };
    });
  }

  async function dergo(ngjarja: React.FormEvent<HTMLFormElement>) {
    ngjarja.preventDefault();
    const forma = ngjarja.currentTarget;
    const fushat = new FormData(forma);
    const artikujt = Object.entries(sasite)
      .filter(([, sasia]) => sasia > 0)
      .map(([sherbimiId, sasia]) => ({ sherbimiId, sasia }));
    kodiRef.current ??= crypto.randomUUID();
    setDuke(true);
    setSukses(false);
    setMesazh("Po dërgohet…");
    try {
      // Suksesi shfaqet vetëm pasi serveri e konfirmon.
      const kodiPergjigjes = await dergoPorosiNgaForma({
        artikujt,
        data: String(fushat.get("data") ?? ""),
        shenime: String(fushat.get("shenime") ?? ""),
        kodi: kodiRef.current,
      });
      setMesazh(MESAZHET[kodiPergjigjes] ?? MESAZHET.databaza);
      if (kodiPergjigjes === "derguar" || kodiPergjigjes === "ekziston") {
        setSukses(true);
        setSasite({});
        forma.reset();
        kodiRef.current = null; // porosia tjetër merr kod të ri
      }
    } catch {
      setMesazh("Nuk u lidhëm me serverin. Provo përsëri.");
    } finally {
      setDuke(false);
    }
  }

  return (
    <form className="form" onSubmit={dergo}>
      {grupoNgaKategoria(sherbimet).map(([kategoria, lista]) => (
        <fieldset key={kategoria} className="grupi">
          <legend>{kategoria}</legend>
          {lista.map((s) => {
            const sasia = sasite[s.id] ?? 0;
            return (
              <div key={s.id} className="artikulli">
                <div className="artikulli-info">
                  <strong>{s.emri}</strong>
                  <span className="small">{formatoCmimin(s.cmimi, s.njesia)}</span>
                </div>
                <div className="stepper" role="group" aria-label={`Sasia për ${s.emri}`}>
                  <button
                    type="button"
                    className="stepper-btn"
                    aria-label={`Pakëso ${s.emri}`}
                    disabled={duke || sasia === 0}
                    onClick={() => ndrysho(s.id, -1)}
                  >
                    −
                  </button>
                  <output aria-live="polite">{sasia}</output>
                  <button
                    type="button"
                    className="stepper-btn"
                    aria-label={`Shto ${s.emri}`}
                    disabled={duke || sasia >= SASIA_MAX}
                    onClick={() => ndrysho(s.id, 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </fieldset>
      ))}

      <label htmlFor="data">Dita kur e sjell rrobën te dyqani</label>
      <input id="data" name="data" type="date" required />

      <label htmlFor="shenime">Shënime (opsionale, deri në 200 shkronja)</label>
      <textarea id="shenime" name="shenime" rows={3} maxLength={200} />

      <p>
        <strong>Gjithsej: {gjithsej} copë</strong>
      </p>
      <button className="action" type="submit" disabled={duke || gjithsej === 0}>
        {duke ? "Po dërgohet…" : "Dërgo porosinë"}
      </button>

      <p role="status" aria-live="polite">
        {mesazh}
      </p>
      {sukses && (
        <p>
          <Link href="/porosite">Shiko Porositë e mia</Link>
        </p>
      )}
    </form>
  );
}
