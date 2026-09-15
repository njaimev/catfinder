import { useEffect, useMemo, useState } from "react";
import { api, fotoAbsoluta, type Raza, type RazaRepetida } from "../api/client";
import { RazaBadge } from "../components/RazaBadge";
import { DetalleModal } from "../components/DetalleModal";
import { RAREZA_ORDEN } from "../utils/rareza";

type Orden = "repetidas_desc" | "repetidas_asc" | "rareza_desc" | "rareza_asc";

export function RepetidasPage() {
  const [items, setItems] = useState<RazaRepetida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<Raza | null>(null);
  const [orden, setOrden] = useState<Orden>("repetidas_desc");

  useEffect(() => {
    api
      .getRepetidas()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar repetidas"))
      .finally(() => setLoading(false));
  }, []);

  const itemsOrdenados = useMemo(() => {
    const copia = [...items];
    switch (orden) {
      case "repetidas_desc":
        return copia.sort((a, b) => b.repetidas - a.repetidas);
      case "repetidas_asc":
        return copia.sort((a, b) => a.repetidas - b.repetidas);
      case "rareza_desc":
        return copia.sort((a, b) => RAREZA_ORDEN[b.raza.rareza] - RAREZA_ORDEN[a.raza.rareza]);
      case "rareza_asc":
        return copia.sort((a, b) => RAREZA_ORDEN[a.raza.rareza] - RAREZA_ORDEN[b.raza.rareza]);
    }
  }, [items, orden]);

  if (loading) return <p className="mt-4">Cargando...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="mt-2">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h1 className="h4 mb-0">Láminas repetidas</h1>
        {items.length > 0 && (
          <select
            className="form-select form-select-sm w-auto"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            aria-label="Ordenar repetidas"
          >
            <option value="repetidas_desc">Más repetidas primero</option>
            <option value="repetidas_asc">Menos repetidas primero</option>
            <option value="rareza_desc">Rareza: Legendaria → Común</option>
            <option value="rareza_asc">Rareza: Común → Legendaria</option>
          </select>
        )}
      </div>
      {items.length === 0 && <p>No tienes láminas repetidas.</p>}
      <div className="row g-3">
        {itemsOrdenados.map(({ raza, total, repetidas }) => (
          <div className="col-6 col-sm-4 col-md-3" key={raza.id}>
            <div className="card h-100">
              <button
                type="button"
                className="btn p-0 border-0 bg-transparent text-start"
                onClick={() => setSeleccionada(raza)}
                aria-label={`Ver ${raza.nombre} en detalle`}
              >
                <img
                  src={fotoAbsoluta(raza.fotoUrl)}
                  className="card-img-top"
                  alt={raza.nombre}
                  style={{ objectFit: "contain", height: 190, backgroundColor: "#f7f4f0", cursor: "pointer" }}
                />
              </button>
              <div className="card-body">
                <h2 className="h6 mb-1">{raza.nombre}</h2>
                <RazaBadge rareza={raza.rareza} />
                <p className="small text-muted mt-2 mb-0">
                  Tienes {total} — {repetidas} repetida{repetidas === 1 ? "" : "s"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {seleccionada && <DetalleModal raza={seleccionada} onClose={() => setSeleccionada(null)} />}
    </div>
  );
}
