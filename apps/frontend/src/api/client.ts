const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Raza {
  id: number;
  nombre: string;
  rareza: "COMUN" | "POCO_COMUN" | "RARA" | "LEGENDARIA";
  fotoUrl: string;
}

export interface Lamina {
  id: number;
  fechaAgregada: string;
  raza: Raza;
}

export interface RazaRepetida {
  raza: Raza;
  total: number;
  repetidas: number;
}

export interface CargaMasivaResultado {
  creadas: number;
  fallidas: { indice: number; error: string }[];
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (data && typeof data === "object" && "error" in data && typeof data.error === "string")
      ? data.error
      : `Error ${res.status}`;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  register: (email: string, password: string, nombre?: string) =>
    request<{ id: number; email: string; nombre: string | null }>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, nombre }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string }>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getRazas: () => request<Raza[]>("/api/v1/razas"),

  getLaminas: () => request<Lamina[]>("/api/v1/laminas"),

  crearLamina: (razaId: number, fechaAgregada: string) =>
    request<Lamina>("/api/v1/laminas", {
      method: "POST",
      body: JSON.stringify({ razaId, fechaAgregada }),
    }),

  cargaMasiva: (laminas: { razaId: number; fechaAgregada: string }[]) =>
    request<CargaMasivaResultado>("/api/v1/laminas/bulk", {
      method: "POST",
      body: JSON.stringify({ laminas }),
    }),

  eliminarLamina: (id: number) => request<void>(`/api/v1/laminas/${id}`, { method: "DELETE" }),

  getFaltantes: () => request<Raza[]>("/api/v1/reportes/faltantes"),

  getRepetidas: () => request<RazaRepetida[]>("/api/v1/reportes/repetidas"),
};

export function fotoAbsoluta(fotoUrl: string): string {
  return `${API_URL}${fotoUrl}`;
}
