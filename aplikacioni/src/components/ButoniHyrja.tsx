"use client";
import { signIn } from "next-auth/react";

// Buton "Hyr në llogari": hyrja me Google (ose me ofruesin e parë të konfiguruar për prova).
// Pas hyrjes kthehet në faqen ku ishte përdoruesi.
export default function ButoniHyrja({
  providerat,
  className = "action",
  tekst = "Hyr në llogari",
}: {
  providerat: string[];
  className?: string;
  tekst?: string;
}) {
  const zgjedhja = providerat.includes("google") ? "google" : providerat[0];
  if (!zgjedhja) return null;
  return (
    <button
      type="button"
      className={className}
      onClick={() => signIn(zgjedhja, { callbackUrl: window.location.pathname })}
    >
      {tekst}
    </button>
  );
}
