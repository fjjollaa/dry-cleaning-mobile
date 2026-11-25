"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Buton "Hyr në llogari": çon te faqja e hyrjes dhe, pas hyrjes, kthen përdoruesin aty ku ishte.
export default function ButoniHyrja({
  className = "action",
  tekst = "Hyr në llogari",
}: {
  className?: string;
  tekst?: string;
}) {
  const rruga = usePathname();
  const kthe = rruga && rruga !== "/hyr" && rruga !== "/regjistrohu" ? rruga : "/";
  return (
    <Link href={`/hyr?kthe=${encodeURIComponent(kthe)}`} className={className}>
      {tekst}
    </Link>
  );
}
