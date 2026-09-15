import type { Raza } from "../api/client";

interface Props {
  rareza: Raza["rareza"];
}

const labels: Record<Raza["rareza"], string> = {
  COMUN: "Común",
  POCO_COMUN: "Poco común",
  RARA: "Rara",
  LEGENDARIA: "Legendaria",
};

export function RazaBadge({ rareza }: Props) {
  return <span className={`badge-rareza-${rareza.toLowerCase()}`}>{labels[rareza]}</span>;
}
