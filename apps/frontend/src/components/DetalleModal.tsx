import { useEffect } from "react";
import { fotoAbsoluta, type Raza } from "../api/client";
import { RazaBadge } from "./RazaBadge";

interface Props {
  raza: Raza;
  fechaAgregada?: string;
  onClose: () => void;
}

export function DetalleModal({ raza, fechaAgregada, onClose }: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog" onClick={onClose}>
        <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{raza.nombre}</h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onClose}></button>
            </div>
            <div className="modal-body text-center">
              <img
                src={fotoAbsoluta(raza.fotoUrl)}
                alt={raza.nombre}
                className="img-fluid rounded"
                style={{ maxHeight: "65vh", objectFit: "contain" }}
              />
              <div className="mt-3">
                <RazaBadge rareza={raza.rareza} />
              </div>
              {fechaAgregada && (
                <p className="text-muted small mt-2 mb-0">
                  Agregada el {new Date(fechaAgregada).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" onClick={onClose}></div>
    </>
  );
}
