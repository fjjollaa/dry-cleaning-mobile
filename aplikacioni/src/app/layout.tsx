import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import Pwa from "@/components/Pwa";

export const metadata: Metadata = {
  title: "Pastrim kimik",
  description: "Dërgo porosi për pastrim kimik dhe shiko statusin pa rifreskuar faqen.",
};

export const viewport: Viewport = { themeColor: "#0b6e7f" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sq">
      <body>
        <Pwa />
        <header className="topbar">
          <nav aria-label="Menuja kryesore">
            <Link href="/">Çmimorja</Link>
            <Link href="/porosi-e-re">Porosi e re</Link>
            <Link href="/porosite">Porositë</Link>
            <Link href="/panel">Paneli</Link>
          </nav>
        </header>
        {children}
        <footer className="footer">
          <a href="/offline.html">Çmimorja dhe orari pa internet</a>
          <p>Kopja e ruajtur mund të jetë e vjetër. Pa internet nuk dërgohen dhe nuk ndryshohen porosi.</p>
        </footer>
      </body>
    </html>
  );
}
