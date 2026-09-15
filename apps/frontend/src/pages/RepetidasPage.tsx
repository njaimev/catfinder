import { useEffect, useState } from "react";
import { api, fotoAbsoluta, type RazaRepetida } from "../api/client";
import { RazaBadge } from "../components/RazaBadge";

export function RepetidasPage() {
  const [items, setItems] = useState<RazaRepetida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getRepetidas()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar repetidas"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mt-4">Cargando...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="mt-2">
      <h1 className="h4 mb-3">Láminas repetidas</h1>
      {items.length === 0 && <p>No tienes láminas repetidas.</p>}
      <div className="row g-3">
        {items.map(({ raza, total, repetidas }) => (
          <div className="col-6 col-sm-4 col-md-3" key={raza.id}>
            <div className="card h-100">
              <img
                src={fotoAbsoluta(raza.fotoUrl)}
                className="card-img-top"
                alt={raza.nombre}
                style={{ objectFit: "cover", height: 160 }}
              />
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
    </div>
  );
}
