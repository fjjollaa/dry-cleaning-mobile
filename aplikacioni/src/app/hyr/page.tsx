import { Suspense } from "react";
import FormaHyrja from "@/components/FormaHyrja";
import { providerat } from "@/lib/auth";
import { sigurKthe } from "@/lib/kthe";

export default function Hyr(props: PageProps<"/hyr">) {
  return (
    <main>
      <h1>Hyr në llogari</h1>
      <p className="lead">Hyr për të dërguar porosi dhe për të ndjekur statusin e rrobave.</p>
      <Suspense fallback={<p>Po ngarkohet…</p>}>
        <Permbajtja searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}

async function Permbajtja({ searchParams }: Pick<PageProps<"/hyr">, "searchParams">) {
  const { kthe } = await searchParams;
  return <FormaHyrja providerat={providerat} kthe={sigurKthe(Array.isArray(kthe) ? kthe[0] : kthe)} />;
}
