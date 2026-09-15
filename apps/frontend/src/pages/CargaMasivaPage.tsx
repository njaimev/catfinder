import { useEffect, useState, type FormEvent } from "react";
import { api, type CargaMasivaResultado, type Raza } from "../api/client";

interface Fila {
  razaId: number | "";
  fecha: string;
}

function filaVacia(): Fila {
  return { razaId: "", fecha: new Date().toISOString().slice(0, 10) };
}

export function CargaMasivaPage() {
  const [razas, setRazas] = useState<Raza[]>([]);
  const [filas, setFilas] = useState<Fila[]>([filaVacia(), filaVacia(), filaVacia()]);
  const [resultado, setResultado] = useState<CargaMasivaResultado | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .getRazas()
      .then(setRazas)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar razas"));
  }, []);

  function actualizarFila(i: number, cambios: Partial<Fila>) {
    setFilas((prev) => prev.map((f, idx) => (idx === i ? { ...f, ...cambios } : f)));
  }

  function agregarFila() {
    setFilas((prev) => [...prev, filaVacia()]);
  }

  function quitarFila(i: number) {
    setFilas((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResultado(null);

    const validas = filas.filter((f) => f.razaId !== "");
    if (validas.length === 0) {
      setError("Agrega al menos una fila con raza seleccionada");
      return;
    }

    setLoading(true);
    try {
      const res = await api.cargaMasiva(
        validas.map((f) => ({ razaId: Number(f.razaId), fechaAgregada: f.fecha }))
      );
      setResultado(res);
      setFilas([filaVacia()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en la carga masiva");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4">
      <h1 className="h4 mb-3">Carga masiva de láminas</h1>
      <p className="text-muted small">Agrega varias láminas de una sola vez: solo raza y fecha por fila.</p>
      {error && <div className="alert alert-danger py-2">{error}</div>}
      {resultado && (
        <div className="alert alert-success py-2">
          {resultado.creadas} lámina(s) creada(s).
          {resultado.fallidas.length > 0 && (
            <ul className="mb-0 mt-2">
              {resultado.fallidas.map((f) => (
                <li key={f.indice}>
                  Fila {f.indice + 1}: {f.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="card p-3">
          {filas.map((fila, i) => (
            <div className="row g-2 align-items-end mb-2" key={i}>
              <div className="col-7">
                <label className="form-label small">Raza</label>
                <select
                  className="form-select"
                  value={fila.razaId}
                  onChange={(e) =>
                    actualizarFila(i, { razaId: e.target.value ? Number(e.target.value) : "" })
                  }
                >
                  <option value="">Selecciona...</option>
                  {razas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-4">
                <label className="form-label small">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={fila.fecha}
                  onChange={(e) => actualizarFila(i, { fecha: e.target.value })}
                />
              </div>
              <div className="col-1">
                <button
                  type="button"
                  className="btn btn-outline-danger"
                  onClick={() => quitarFila(i)}
                  disabled={filas.length === 1}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-outline-secondary btn-sm mt-2" onClick={agregarFila}>
            + Agregar fila
          </button>
        </div>
        <button type="submit" className="btn btn-primary mt-3" disabled={loading}>
          {loading ? "Enviando..." : "Guardar todo"}
        </button>
      </form>
    </div>
  );
}
