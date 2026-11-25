"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Ikonat janë vija të thjeshta SVG (pa paketa të jashtme).
const IKONAT: Record<string, React.ReactNode> = {
  lista: <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  shto: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  porosite: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4h6v3H9zM9 12h6M9 16h4" />
    </>
  ),
  perdoruesi: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
};

const LINKET = [
  { href: "/", etiketa: "Çmimorja", ikona: "lista" },
  { href: "/porosi-e-re", etiketa: "Porosi e re", ikona: "shto" },
  { href: "/porosite", etiketa: "Porositë", ikona: "porosite" },
  { href: "/panel", etiketa: "Paneli", ikona: "perdoruesi" },
];

export default function Menu() {
  const rruga = usePathname();
  return (
    <nav className="tabs" aria-label="Menuja kryesore">
      {LINKET.map((l) => (
        <Link key={l.href} href={l.href} className="tab" aria-current={rruga === l.href ? "page" : undefined}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {IKONAT[l.ikona]}
          </svg>
          <span>{l.etiketa}</span>
        </Link>
      ))}
    </nav>
  );
}
