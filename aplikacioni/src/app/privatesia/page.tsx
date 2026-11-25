import type { Metadata } from "next";
import ButoniKthehu from "@/components/ButoniKthehu";
import TekstiPrivatesise from "@/components/TekstiPrivatesise";

export const metadata: Metadata = {
  title: "Politika e privatësisë · Pastrim Kimik Expert Wash",
  description: "Çfarë të dhënash ruan aplikacioni, pse, kush i sheh dhe si mund të kërkosh fshirjen.",
};

// Faqe statike. Pranimi bëhet te forma e regjistrimit (kutia "Pranoj politikën e privatësisë").
export default function Privatesia() {
  return (
    <main className="tekst">
      <ButoniKthehu />
      <h1>Politika e privatësisë</h1>
      <p className="lead">Përditësuar më 26.11.2026</p>
      <TekstiPrivatesise />
      <p>
        <ButoniKthehu tekst="← Kthehu" className="action action-bllok" />
      </p>
    </main>
  );
}
