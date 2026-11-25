"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

const ETIKETAT: Record<string, string> = {
  google: "Vazhdo me Google",
  github: "Vazhdo me GitHub (vetëm për prova)",
};

export default function FormaHyrja({ providerat, kthe }: { providerat: string[]; kthe: string }) {
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState("");

  async function hyr(ngjarja: React.FormEvent<HTMLFormElement>) {
    ngjarja.preventDefault();
    const fushat = new FormData(ngjarja.currentTarget);
    setDuke(true);
    setGabim("");
    try {
      const r = await signIn("credentials", {
        email: String(fushat.get("email") ?? ""),
        fjalekalimi: String(fushat.get("fjalekalimi") ?? ""),
        redirect: false,
      });
      if (r?.ok && !r.error) {
        window.location.assign(kthe); // ngarkim i plotë, që koka e faqes të shfaqë llogarinë
        return;
      }
      setGabim(
        r?.error === "BLLOKUAR"
          ? "Shumë përpjekje të gabuara. Provo përsëri pas 15 minutash."
          : "Email-i ose fjalëkalimi nuk është i saktë.",
      );
    } catch {
      setGabim("Nuk u lidhëm me serverin. Provo përsëri.");
    }
    setDuke(false);
  }

  return (
    <section className="card">
      <form className="form" onSubmit={hyr}>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />

        <label htmlFor="fjalekalimi">Fjalëkalimi</label>
        <input id="fjalekalimi" name="fjalekalimi" type="password" autoComplete="current-password" required />

        {gabim && (
          <p className="gabim" role="alert">
            {gabim}
          </p>
        )}

        <button className="action action-bllok" type="submit" disabled={duke}>
          {duke ? "Po hyn…" : "Hyr"}
        </button>
      </form>

      <p className="small qendra">
        Nuk ke llogari? <Link href={`/regjistrohu?kthe=${encodeURIComponent(kthe)}`}>Krijo llogari</Link>
      </p>

      {providerat.length > 0 && (
        <>
          <div className="ose" aria-hidden="true">
            <span>ose</span>
          </div>
          <div className="veprimet veprimet-kolone">
            {providerat.map((p) => (
              <button
                key={p}
                type="button"
                className="action action-dytesor action-bllok"
                onClick={() => signIn(p, { callbackUrl: kthe })}
              >
                {ETIKETAT[p] ?? `Vazhdo me ${p}`}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
