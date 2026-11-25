import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import "./globals.css";
import HyrjaKoka from "@/components/HyrjaKoka";
import Menu from "@/components/Menu";
import Pwa from "@/components/Pwa";
import { providerat } from "@/lib/auth";
import { BIZNESI } from "@/lib/biznesi";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Pastrim Kimik Expert Wash",
  description: "Dërgo porosi për pastrim kimik dhe shiko statusin pa rifreskuar faqen.",
};

// viewportFit "cover": përmbajtja shkon deri te skajet e iPhone-it; menuja e poshtme respekton hapësirën e sigurt.
export const viewport: Viewport = { themeColor: "#1f6fe0", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sq" className={inter.className}>
      <body>
        <Pwa />
        <header className="topbar">
          <div className="topbar-in">
            <Link href="/" className="brand">
              <Image src="/icons/icon-192.png" alt="" width={32} height={32} />
              <span>{BIZNESI.emri}</span>
            </Link>
            <Suspense fallback={null}>
              <Menu />
            </Suspense>
            <HyrjaKoka providerat={providerat} />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
