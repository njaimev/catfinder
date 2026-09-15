import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextValue {
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));

  function login(newToken: string) {
    // Se escribe en localStorage aquí mismo, de forma síncrona, en vez de en
    // un useEffect: así, cuando el código que llama a login() navega a una
    // página protegida justo después, esa página ya encuentra el token
    // guardado. Un useEffect corre después del navigate y alcanzaba a
    // dejar la primera petición (ej. listar el álbum) sin token -> 401.
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  return <AuthContext.Provider value={{ token, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
