import type { Metadata } from "next";
import { BIZNESI } from "@/lib/biznesi";

export const metadata: Metadata = {
  title: "Politika e privatësisë · Pastrim Kimik Expert Wash",
  description: "Çfarë të dhënash ruan aplikacioni, pse, kush i sheh dhe si mund të kërkosh fshirjen.",
};

// Faqe statike. Teksti përshkruan vetëm atë që bën realisht aplikacioni; përditësoje nëse ndryshon kodi.
export default function Privatesia() {
  return (
    <main className="tekst">
      <h1>Politika e privatësisë</h1>
      <p className="lead">Përditësuar më 26.11.2026</p>

      <h2>Kush jemi</h2>
      <p>
        {BIZNESI.emri} është një aplikacion për porosi të pastrimit kimik. Është një projekt studentor (Kolegji AAB). Të
        dhënat e dyqanit që shfaqen në aplikacion (emri, telefoni, adresa, orari, çmimet) janë vlera shembull.
      </p>

      <h2>Çfarë të dhënash ruajmë</h2>
      <ul>
        <li>
          <strong>Llogaria me email:</strong> emrin, email-in dhe një version të fshehur (hash) të fjalëkalimit. Fjalëkalimi
          vetë nuk ruhet kurrë.
        </li>
        <li>
          <strong>Llogaria me Google:</strong> vetëm emrin që ka llogaria jote Google dhe një numër identifikimi të
          llogarisë. Nuk ruajmë email-in, foton ose kontaktet e tua nga Google.
        </li>
        <li>
          <strong>Porositë:</strong> artikujt dhe sasitë, ditën e sjelljes, shënimet që shkruan, statusin dhe kohën e
          ndryshimit.
        </li>
        <li>
          <strong>Cookie të sesionit:</strong> të nevojshme që të mbetesh i futur (rreth 2 orë) dhe për siguri gjatë hyrjes.
          Nuk përdorim cookie reklamash dhe nuk bëjmë gjurmim analitik.
        </li>
      </ul>

      <h2>Pse i përdorim</h2>
      <p>
        Vetëm për të ofruar shërbimin: që të dërgosh porosi, ta shohësh statusin e saj dhe që dyqani t&apos;i përgatisë
        rrobat. Nuk i përdorim për reklama dhe nuk i shesim.
      </p>

      <h2>Kush i sheh</h2>
      <ul>
        <li>Ti sheh vetëm porositë e tua.</li>
        <li>Stafi i dyqanit sheh porositë dhe emrin tënd, për t&apos;i përpunuar.</li>
        <li>
          Shërbime teknike që e mbajnë aplikacionin: Vercel (publikimi i faqes), Neon (databaza) dhe Google (vetëm nëse
          zgjedh hyrjen me Google). Ata i përpunojnë të dhënat vetëm për të ofruar shërbimin teknik.
        </li>
      </ul>

      <h2>Sa kohë i ruajmë</h2>
      <p>Derisa të kërkosh fshirjen e llogarisë. Pas fshirjes largojmë llogarinë dhe porositë e saj.</p>

      <h2>Të drejtat e tua</h2>
      <p>
        Mund të kërkosh një kopje të të dhënave të tua, korrigjimin ose fshirjen e llogarisë. Shkruaj te kontakti më
        poshtë dhe përgjigjemi sa më shpejt.
      </p>

      <h2>Siguria</h2>
      <p>
        Faqja përdor HTTPS. Fjalëkalimet ruhen vetëm si hash dhe llogaria bllokohet përkohësisht pas disa përpjekjeve të
        gabuara. Email-i nuk verifikohet dhe nuk ka rivendosje automatike të fjalëkalimit; për ndihmë përdor kontaktin më
        poshtë.
      </p>

      <h2>Kontakt</h2>
      <p>Për pyetje rreth të dhënave: {BIZNESI.email}</p>

      <h2>Ndryshime</h2>
      <p>Nëse ndryshon mënyra si i përdorim të dhënat, e përditësojmë këtë faqe dhe ndryshojmë datën e sipërme.</p>
    </main>
  );
}
