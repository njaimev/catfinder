import type { Raza } from "../api/client";

export const RAREZA_ORDEN: Record<Raza["rareza"], number> = {
  COMUN: 0,
  POCO_COMUN: 1,
  RARA: 2,
  LEGENDARIA: 3,
};
