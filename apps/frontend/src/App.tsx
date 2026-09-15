import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NavBar } from "./components/NavBar";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AlbumPage } from "./pages/AlbumPage";
import { NuevaLaminaPage } from "./pages/NuevaLaminaPage";
import { CargaMasivaPage } from "./pages/CargaMasivaPage";
import { FaltantesPage } from "./pages/FaltantesPage";
import { RepetidasPage } from "./pages/RepetidasPage";

function RequireAuth({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <NavBar />
      <div className="container pb-5">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <AlbumPage />
              </RequireAuth>
            }
          />
          <Route
            path="/nueva"
            element={
              <RequireAuth>
                <NuevaLaminaPage />
              </RequireAuth>
            }
          />
          <Route
            path="/carga-masiva"
            element={
              <RequireAuth>
                <CargaMasivaPage />
              </RequireAuth>
            }
          />
          <Route
            path="/faltantes"
            element={
              <RequireAuth>
                <FaltantesPage />
              </RequireAuth>
            }
          />
          <Route
            path="/repetidas"
            element={
              <RequireAuth>
                <RepetidasPage />
              </RequireAuth>
            }
          />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
