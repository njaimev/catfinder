import { useEffect, useState } from "react";
import { api, fotoAbsoluta, type Raza } from "../api/client";
import { RazaBadge } from "../components/RazaBadge";
import { DetalleModal } from "../components/DetalleModal";

export function FaltantesPage() {
  const [razas, setRazas] = useState<Raza[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<Raza | null>(null);

  useEffect(() => {
    api
      .getFaltantes()
      .then(setRazas)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar faltantes"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mt-4">Cargando...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="mt-2">
      <h1 className="h4 mb-3">Láminas faltantes ({razas.length})</h1>
      {razas.length === 0 && <p>¡Felicidades! No te falta ninguna raza.</p>}
      <div className="row g-3">
        {razas.map((r) => (
          <div className="col-6 col-sm-4 col-md-3" key={r.id}>
            <div className="card h-100" style={{ opacity: 0.65 }}>
              <button
                type="button"
                className="btn p-0 border-0 bg-transparent text-start"
                onClick={() => setSeleccionada(r)}
                aria-label={`Ver ${r.nombre} en detalle`}
              >
                <img
                  src={fotoAbsoluta(r.fotoUrl)}
                  className="card-img-top"
                  alt={r.nombre}
                  style={{
                    objectFit: "contain",
                    height: 190,
                    backgroundColor: "#f7f4f0",
                    filter: "grayscale(1)",
                    cursor: "pointer",
                  }}
                />
              </button>
              <div className="card-body">
                <h2 className="h6 mb-1">{r.nombre}</h2>
                <RazaBadge rareza={r.rareza} />
              </div>
            </div>
          </div>
        ))}
      </div>
      {seleccionada && <DetalleModal raza={seleccionada} onClose={() => setSeleccionada(null)} />}
    </div>
  );
}
