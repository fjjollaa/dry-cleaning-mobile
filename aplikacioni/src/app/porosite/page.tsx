import PorositeLive from "@/components/PorositeLive";
import { providerat } from "@/lib/auth";

// Faqja është statike; porositë lexohen nga serveri çdo 5 sekonda te PorositeLive.
// Klienti sheh statusin pa rifreskuar; pronari sheh kërkesat e reja dhe e ndryshon statusin.
export default function Porosite() {
  return (
    <main>
      <h1>Porositë</h1>
      <PorositeLive providerat={providerat} />
    </main>
  );
}
