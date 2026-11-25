"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ButoniHyrja from "./ButoniHyrja";

type Gjendja = "po_ngarkohet" | "mysafir" | { emri: string };

// Pjesa e djathtë e kokës: "Hyr në llogari" për mysafirin, ose emri i përdoruesit që çon te Paneli.
export default function HyrjaKoka() {
  const [gjendja, setGjendja] = useState<Gjendja>("po_ngarkohet");

  useEffect(() => {
    const kontrolli = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: kontrolli.signal })
      .then((r) => r.json())
      .then((s: { user?: { name?: string | null } }) =>
        setGjendja(s?.user ? { emri: s.user.name?.trim() || "Llogaria ime" } : "mysafir"),
      )
      .catch(() => {
        if (!kontrolli.signal.aborted) setGjendja("mysafir");
      });
    return () => kontrolli.abort();
  }, []);

  if (gjendja === "po_ngarkohet") return <span className="koka-vend" aria-hidden="true" />;
  if (gjendja === "mysafir") {
    return <ButoniHyrja className="action action-vogel" />;
  }
  const emri = gjendja.emri;
  return (
    <Link href="/panel" className="profili-pill" aria-label={`Llogaria ime: ${emri}`}>
      <span className="avatar" aria-hidden="true">
        {emri.charAt(0).toUpperCase()}
      </span>
      <span className="profili-emri">{emri}</span>
    </Link>
  );
}
