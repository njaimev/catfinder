import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, fotoAbsoluta, type Raza } from "../api/client";
import { RazaBadge } from "../components/RazaBadge";

export function NuevaLaminaPage() {
  const [razas, setRazas] = useState<Raza[]>([]);
  const [razaId, setRazaId] = useState<number | "">("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getRazas()
      .then(setRazas)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar razas"));
  }, []);

  const razaSeleccionada = razas.find((r) => r.id === razaId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (razaId === "") return;
    setError(null);
    setLoading(true);
    try {
      await api.crearLamina(Number(razaId), fecha);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar la lámina");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-6">
        <div className="card p-4 mt-4">
          <h1 className="h4 mb-3">Agregar lámina</h1>
          <p className="text-muted small">
            Elige la raza y la fecha; la foto y la rareza se completan solas.
          </p>
          {error && <div className="alert alert-danger py-2">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Raza</label>
              <select
                className="form-select"
                value={razaId}
                onChange={(e) => setRazaId(e.target.value ? Number(e.target.value) : "")}
                required
              >
                <option value="">Selecciona una raza...</option>
                {razas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>
            {razaSeleccionada && (
              <div className="d-flex align-items-center gap-3 mb-3 p-2 border rounded">
                <img
                  src={fotoAbsoluta(razaSeleccionada.fotoUrl)}
                  alt={razaSeleccionada.nombre}
                  width={64}
                  height={64}
                  style={{ objectFit: "cover", borderRadius: 8 }}
                />
                <div>
                  <div className="fw-semibold">{razaSeleccionada.nombre}</div>
                  <RazaBadge rareza={razaSeleccionada.rareza} />
                </div>
              </div>
            )}
            <div className="mb-3">
              <label className="form-label">Fecha en que la agregaste</label>
              <input
                type="date"
                className="form-control"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Guardando..." : "Agregar al álbum"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
