import { Suspense } from "react";
import FormaRegjistrimi from "@/components/FormaRegjistrimi";
import TekstiPrivatesise from "@/components/TekstiPrivatesise";
import { sigurKthe } from "@/lib/kthe";

export default function Regjistrohu(props: PageProps<"/regjistrohu">) {
  return (
    <main>
      <h1>Krijo llogari</h1>
      <p className="lead">Një llogari e lirë me email dhe fjalëkalim. Nuk ke nevojë për Google.</p>
      <Suspense fallback={<p>Po ngarkohet…</p>}>
        <Permbajtja searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Permbajtja({ searchParams }: Pick<PageProps<"/regjistrohu">, "searchParams">) {
  const { kthe } = await searchParams;
  return (
    <FormaRegjistrimi kthe={sigurKthe(Array.isArray(kthe) ? kthe[0] : kthe)} politika={<TekstiPrivatesise />} />
  );
}
