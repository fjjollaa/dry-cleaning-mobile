"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { regjistrohu } from "@/app/regjistrohu/actions";

const MESAZHET: Record<string, string> = {
  emri: "Shkruaj emrin tënd (2 deri 60 shkronja).",
  email: "Shkruaj një email të vlefshëm.",
  fjalekalimi: "Fjalëkalimi duhet të ketë të paktën 8 shkronja ose shifra.",
  pranimi: "Duhet të pranosh politikën e privatësisë për të krijuar llogari.",
  ekziston: "Ky email ka tashmë një llogari. Provo të hysh.",
  shume: "Shumë llogari të reja tani. Provo përsëri pas pak minutash.",
  databaza: "Llogaria nuk u krijua. Provo përsëri.",
};

export default function FormaRegjistrimi({ kthe, politika }: { kthe: string; politika: React.ReactNode }) {
  const router = useRouter();
  const [duke, setDuke] = useState(false);
  const [gabim, setGabim] = useState("");

  async function krijo(ngjarja: React.FormEvent<HTMLFormElement>) {
    ngjarja.preventDefault();
    const fushat = new FormData(ngjarja.currentTarget);
    const emri = String(fushat.get("emri") ?? "");
    const email = String(fushat.get("email") ?? "");
    const fjalekalimi = String(fushat.get("fjalekalimi") ?? "");
    const pranuar = fushat.get("pranuar") === "on";
    setDuke(true);
    setGabim("");
    try {
      const kodi = await regjistrohu({ emri, email, fjalekalimi, pranuar });
      if (kodi !== "krijuar") {
        setGabim(MESAZHET[kodi] ?? MESAZHET.databaza);
        setDuke(false);
        return;
      }
      // Llogaria u krijua: hyjmë menjëherë me të njëjtat të dhëna.
      const r = await signIn("credentials", { email, fjalekalimi, redirect: false });
      if (r?.ok && !r.error) {
        window.location.assign(kthe);
        return;
      }
      router.push(`/hyr?kthe=${encodeURIComponent(kthe)}`); // llogaria ekziston; hyr dorazi
    } catch {
      setGabim("Nuk u lidhëm me serverin. Provo përsëri.");
      setDuke(false);
    }
  }

  return (
    <section className="card">
      <form className="form" onSubmit={krijo}>
        <label htmlFor="emri">Emri</label>
        <input id="emri" name="emri" type="text" autoComplete="name" minLength={2} maxLength={60} required />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />

        <label htmlFor="fjalekalimi">Fjalëkalimi</label>
        <input
          id="fjalekalimi"
          name="fjalekalimi"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
        />
        <p className="small">Të paktën 8 shkronja ose shifra. Mos përdor të njëjtin fjalëkalim si në llogari të tjera.</p>

        <details className="politika">
          <summary>Lexo politikën e privatësisë</summary>
          <div className="politika-tekst tekst">{politika}</div>
        </details>

        <label className="pranim" htmlFor="pranuar">
          <input id="pranuar" name="pranuar" type="checkbox" required />
          <span>Kam lexuar dhe pranoj politikën e privatësisë</span>
        </label>

        {gabim && (
          <p className="gabim" role="alert">
            {gabim}
          </p>
        )}

        <button className="action action-bllok" type="submit" disabled={duke}>
          {duke ? "Po krijohet…" : "Krijo llogari"}
        </button>
      </form>

      <p className="small qendra">
        Ke tashmë llogari? <Link href={`/hyr?kthe=${encodeURIComponent(kthe)}`}>Hyr</Link>
      </p>
    </section>
  );
}
