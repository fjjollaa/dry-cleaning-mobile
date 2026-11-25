import { formatoCmimin } from "@/lib/biznesi";
import { grupoNgaKategoria, type Sherbimi } from "@/lib/katalogu";

// Çmimorja e grupuar sipas kategorisë (veshje, shtëpi…), si te dyqanet e vërteta.
export function ListaCmimeve({ sherbimet }: { sherbimet: Sherbimi[] }) {
  return (
    <div className="list">
      {grupoNgaKategoria(sherbimet).map(([kategoria, lista]) => (
        <section key={kategoria} className="card" aria-label={kategoria}>
          <h3>{kategoria}</h3>
          <ul className="cmimorja">
            {lista.map((s) => (
              <li key={s.id}>
                <span>
                  {s.emri}
                  {s.pershkrimi && <span className="small"> · {s.pershkrimi}</span>}
                </span>
                <strong>{formatoCmimin(s.cmimi, s.njesia)}</strong>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
