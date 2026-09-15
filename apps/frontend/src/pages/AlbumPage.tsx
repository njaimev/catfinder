import { useEffect, useMemo, useState } from "react";
import { api, fotoAbsoluta, type Lamina } from "../api/client";
import { RazaBadge } from "../components/RazaBadge";
import { DetalleModal } from "../components/DetalleModal";
import { RAREZA_ORDEN } from "../utils/rareza";

type Orden = "fecha" | "rareza_desc" | "rareza_asc";

export function AlbumPage() {
  const [laminas, setLaminas] = useState<Lamina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<Lamina | null>(null);
  const [orden, setOrden] = useState<Orden>("fecha");

  const laminasOrdenadas = useMemo(() => {
    if (orden === "fecha") return laminas;
    const factor = orden === "rareza_desc" ? -1 : 1;
    return [...laminas].sort(
      (a, b) => factor * (RAREZA_ORDEN[a.raza.rareza] - RAREZA_ORDEN[b.raza.rareza])
    );
  }, [laminas, orden]);

  async function cargar() {
    setLoading(true);
    try {
      setLaminas(await api.getLaminas());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el álbum");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function handleEliminar(id: number) {
    if (!confirm("¿Eliminar esta lámina?")) return;
    await api.eliminarLamina(id);
    setSeleccionada(null);
    cargar();
  }

  if (loading) return <p className="mt-4">Cargando álbum...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="mt-2">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h1 className="h4 mb-0">Mi álbum ({laminas.length} láminas)</h1>
        {laminas.length > 0 && (
          <select
            className="form-select form-select-sm w-auto"
            value={orden}
            onChange={(e) => setOrden(e.target.value as Orden)}
            aria-label="Ordenar álbum"
          >
            <option value="fecha">Más reciente primero</option>
            <option value="rareza_desc">Rareza: Legendaria → Común</option>
            <option value="rareza_asc">Rareza: Común → Legendaria</option>
          </select>
        )}
      </div>
      {laminas.length === 0 && <p>Todavía no tienes láminas. ¡Agrega la primera!</p>}
      <div className="row g-3">
        {laminasOrdenadas.map((lamina) => (
          <div className="col-6 col-sm-4 col-md-3" key={lamina.id}>
            <div className="card h-100">
              <button
                type="button"
                className="btn p-0 border-0 bg-transparent text-start"
                onClick={() => setSeleccionada(lamina)}
                aria-label={`Ver ${lamina.raza.nombre} en detalle`}
              >
                <img
                  src={fotoAbsoluta(lamina.raza.fotoUrl)}
                  className="card-img-top"
                  alt={lamina.raza.nombre}
                  style={{ objectFit: "contain", height: 190, backgroundColor: "#f7f4f0", cursor: "pointer" }}
                />
              </button>
              <div className="card-body">
                <h2 className="h6 mb-1">{lamina.raza.nombre}</h2>
                <RazaBadge rareza={lamina.raza.rareza} />
                <p className="small text-muted mb-2 mt-2">
                  Agregada: {new Date(lamina.fechaAgregada).toLocaleDateString()}
                </p>
                <button className="btn btn-sm btn-outline-danger w-100" onClick={() => handleEliminar(lamina.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {seleccionada && (
        <DetalleModal
          raza={seleccionada.raza}
          fechaAgregada={seleccionada.fechaAgregada}
          onClose={() => setSeleccionada(null)}
        />
      )}
    </div>
  );
}
