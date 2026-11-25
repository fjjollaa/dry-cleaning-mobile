"use client";
import { signIn, signOut } from "next-auth/react";

const ETIKETAT: Record<string, string> = {
  google: "Hyr me Google",
  github: "Hyr me GitHub (vetëm për prova)",
};

export default function Hyrja({ brenda, providerat }: { brenda: boolean; providerat: string[] }) {
  if (brenda) {
    return (
      <button type="button" className="action" onClick={() => signOut({ callbackUrl: "/panel" })}>
        Dil
      </button>
    );
  }
  if (providerat.length === 0) {
    return <p role="alert">Hyrja nuk është e konfiguruar. Shiko .env.local (GOOGLE_CLIENT_ID).</p>;
  }
  return (
    <div className="veprimet">
      {providerat.map((p) => (
        <button
          key={p}
          type="button"
          className={p === "google" ? "action" : "action action-dytesor"}
          onClick={() => signIn(p, { callbackUrl: "/panel" })}
        >
          {ETIKETAT[p] ?? `Hyr me ${p}`}
        </button>
      ))}
    </div>
  );
}
