"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ndryshoStatusPorosie } from "@/app/porosite/actions";
import ButoniHyrja from "@/components/ButoniHyrja";
import type { Porosia, PorositePamje, Statusi } from "@/lib/porosite-core";

const KOHA = 5000; // rilexim çdo 5 sekonda

const TEKSTI_STATUSIT: Record<Statusi, string> = {
  pritje: "Në pritje të pranimit",
  pranuar: "Pranuar",
  ne_pastrim: "Në pastrim",
  gati: "Gati për marrje",
  marre: "Marrë",
  refuzuar: "Refuzuar",
};

// Hapat e pamjes (vija kohore). "refuzuar" nuk është hap: shfaqet si shenjë e veçantë.
const HAPAT: { statusi: Statusi; etiketa: string }[] = [
  { statusi: "pritje", etiketa: "Kërkuar" },
  { statusi: "pranuar", etiketa: "Pranuar" },
  { statusi: "ne_pastrim", etiketa: "Në pastrim" },
  { statusi: "gati", etiketa: "Gati" },
  { statusi: "marre", etiketa: "Marrë" },
];

// Veprimet e pronarit për çdo status: një hap përpara (ose refuzim nga "pritje").
const VEPRIMET: Partial<Record<Statusi, { statusi: Statusi; tekst: string }[]>> = {
  pritje: [
    { statusi: "pranuar", tekst: "Prano" },
    { statusi: "refuzuar", tekst: "Refuzo" },
  ],
  pranuar: [{ statusi: "ne_pastrim", tekst: "Fillo pastrimin" }],
  ne_pastrim: [{ statusi: "gati", tekst: "Shëno gati" }],
  gati: [{ statusi: "marre", tekst: "Shëno si të marrë" }],
};

const MESAZHET: Record<string, string> = {
  ndryshuar: "Statusi u ruajt.",
  tashme: "Ky status ishte ruajtur më parë.",
  rend: "Statusi nuk mund të kalojë kështu. Lista u rifreskua.",
  ndaluar: "Nuk ke leje për këtë porosi.",
  mungon: "Porosia nuk u gjet.",
  fushe: "Kërkesa nuk është e vlefshme.",
  hyr: "Hyr në llogari para se të ndryshosh statusin.",
  databaza: "Statusi nuk u ruajt. Provo përsëri.",
};

function formatoDaten(data: string): string {
  return data.split("-").reverse().join(".");
}

function Vija({ statusi }: { statusi: Statusi }) {
  if (statusi === "refuzuar") {
    return <p className="small">Dyqani e refuzoi këtë porosi.</p>;
  }
  const tani = HAPAT.findIndex((h) => h.statusi === statusi);
  return (
    <ol className="timeline" aria-label={`Statusi: ${TEKSTI_STATUSIT[statusi]}`}>
      {HAPAT.map((h, i) => (
        <li
          key={h.statusi}
          className={i < tani ? "done" : i === tani ? "current" : ""}
          aria-current={i === tani ? "step" : undefined}
        >
          <span className="pika" aria-hidden="true">
            {i <= tani ? "✓" : ""}
          </span>
          {h.etiketa}
        </li>
      ))}
    </ol>
  );
}

export default function PorositeLive({ providerat }: { providerat: string[] }) {
  const [gjendja, setGjendja] = useState<PorositePamje | null>(null);
  const [rilidhje, setRilidhje] = useState(false);
  const [duke, setDuke] = useState(false);
  const [mesazh, setMesazh] = useState("");
  const lexoRef = useRef<() => void>(() => {});
  const nisur = useRef(0); // numri i leximit të fundit që nisi
  const aplikuar = useRef(0); // numri i leximit të fundit që u shfaq

  useEffect(() => {
    let ndalur = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let ngarkohet = false; // një lexim në vazhdim; nuk nisim të dytin ndërsa i pari pret
    let perseri = false; // një veprim kërkoi lexim të ri ndërsa ishte një në vazhdim
    const kontrolli = new AbortController();

    async function lexo() {
      if (ndalur) return;
      if (ngarkohet) {
        perseri = true;
        return;
      }
      ngarkohet = true;
      clearTimeout(timer);
      const emri = ++nisur.current;
      try {
        const pergjigje = await fetch("/api/porosite/gjendja", {
          cache: "no-store",
          signal: kontrolli.signal,
        });
        if (!pergjigje.ok) throw new Error(String(pergjigje.status));
        const te_dhenat = (await pergjigje.json()) as PorositePamje;
        if (ndalur) return;
        // Një përgjigje më e vjetër se ajo që shfaqet nuk e zëvendëson pamjen e re.
        if (emri >= aplikuar.current) {
          aplikuar.current = emri;
          setGjendja(te_dhenat);
        }
        setRilidhje(false); // paralajmërimi hiqet vetëm pas një përgjigjeje të suksesshme
      } catch {
        // Ruajmë vlerat e fundit dhe tregojmë "Po rilidhemi".
        if (!ndalur) setRilidhje(true);
      } finally {
        ngarkohet = false;
        if (!ndalur) {
          const menjehere = perseri;
          perseri = false;
          timer = setTimeout(lexo, menjehere ? 0 : KOHA);
        }
      }
    }

    lexoRef.current = () => void lexo();
    void lexo();
    return () => {
      // Largimi nga faqja ndalon timer-in dhe anulon leximin në vazhdim.
      ndalur = true;
      clearTimeout(timer);
      kontrolli.abort();
    };
  }, []);

  async function ndrysho(porosia: Porosia, statusi: Statusi) {
    setDuke(true);
    setMesazh("Po dërgohet…");
    try {
      // Suksesi shfaqet vetëm pasi serveri e konfirmon.
      const kodi = await ndryshoStatusPorosie(porosia.id, statusi);
      setMesazh(MESAZHET[kodi] ?? MESAZHET.databaza);
    } catch {
      setMesazh("Nuk u lidhëm me serverin. Provo përsëri.");
    } finally {
      setDuke(false);
    }
    lexoRef.current();
  }

  const bllokuar = duke || rilidhje;

  return (
    <section className="live-box" aria-label="Porositë">
      {rilidhje && (
        <p className="banner" role="status">
          Po rilidhemi · të dhënat mund të jenë të vjetra. Veprimet që kërkojnë rrjet janë të bllokuara.
        </p>
      )}

      {!gjendja && !rilidhje && <p>Po lexohen porositë nga serveri…</p>}

      {gjendja?.pamja === "mysafir" && (
        <section className="card">
          <p>Hyr në llogarinë tënde për të parë porositë dhe statusin e tyre.</p>
          <ButoniHyrja providerat={providerat} className="action action-bllok" />
        </section>
      )}

      {gjendja && gjendja.pamja !== "mysafir" && (
        <>
          <h2>{gjendja.pamja === "pronar" ? "Porositë për dyqanin" : "Porositë e mia"}</h2>
          {gjendja.porosite.length === 0 ? (
            <p>
              Ende pa porosi. {gjendja.pamja === "klient" && <Link href="/porosi-e-re">Bëj porosinë e parë</Link>}
            </p>
          ) : (
            <ul className="porosite">
              {gjendja.porosite.map((p) => (
                <li key={p.id} className="card">
                  <div className="porosia-krye">
                    <strong>Porosia #{p.id}</strong>
                    <span className={`chip chip-${p.statusi}`}>{TEKSTI_STATUSIT[p.statusi]}</span>
                  </div>
                  {p.klienti && <p className="small">Klienti: {p.klienti}</p>}
                  <ul className="artikujt">
                    {p.artikujt.map((a) => (
                      <li key={a.emri}>
                        {a.emri} × {a.sasia}
                      </li>
                    ))}
                  </ul>
                  <p>Dita e sjelljes: {formatoDaten(p.data)}</p>
                  {p.shenime && <p>Shënime: {p.shenime}</p>}
                  <Vija statusi={p.statusi} />
                  {p.statusi === "gati" && gjendja.pamja === "klient" && (
                    <p className="njoftim">Rrobat e tua janë gati për marrje.</p>
                  )}
                  {gjendja.pamja === "pronar" && (
                    <div className="veprimet">
                      {(VEPRIMET[p.statusi] ?? []).map((v) => (
                        <button
                          key={v.statusi}
                          type="button"
                          className={v.statusi === "refuzuar" ? "action action-dytesor" : "action"}
                          disabled={bllokuar}
                          onClick={() => ndrysho(p, v.statusi)}
                        >
                          {v.tekst}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <p role="status" aria-live="polite">
        {mesazh}
      </p>
      <p className="small">
        {gjendja && !rilidhje ? "Gjendja u lexua nga serveri" : "Gjendja e fundit e njohur"} · Përditësim automatik
        çdo 5 sekonda
      </p>
    </section>
  );
}
