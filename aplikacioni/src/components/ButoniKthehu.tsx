"use client";

import { useRouter } from "next/navigation";

// Kthehet te faqja e mëparshme; nëse faqja u hap drejtpërdrejt (pa histori), shkon te faqja kryesore.
// E nevojshme sidomos në aplikacionin e instaluar, ku nuk ka buton "mbrapa" të shfletuesit.
export default function ButoniKthehu({
  tekst = "← Kthehu",
  className = "action action-dytesor action-vogel",
}: {
  tekst?: string;
  className?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/");
      }}
    >
      {tekst}
    </button>
  );
}
