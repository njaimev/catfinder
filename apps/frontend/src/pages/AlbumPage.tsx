import { useEffect, useState } from "react";
import { api, fotoAbsoluta, type Lamina } from "../api/client";
import { RazaBadge } from "../components/RazaBadge";

export function AlbumPage() {
  const [laminas, setLaminas] = useState<Lamina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    cargar();
  }

  if (loading) return <p className="mt-4">Cargando álbum...</p>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="mt-2">
      <h1 className="h4 mb-3">Mi álbum ({laminas.length} láminas)</h1>
      {laminas.length === 0 && <p>Todavía no tienes láminas. ¡Agrega la primera!</p>}
      <div className="row g-3">
        {laminas.map((lamina) => (
          <div className="col-6 col-sm-4 col-md-3" key={lamina.id}>
            <div className="card h-100">
              <img
                src={fotoAbsoluta(lamina.raza.fotoUrl)}
                className="card-img-top"
                alt={lamina.raza.nombre}
                style={{ objectFit: "cover", height: 160 }}
              />
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
    </div>
  );
}
