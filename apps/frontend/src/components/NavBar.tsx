import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function NavBar() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar navbar-expand-lg mb-4">
      <div className="container flex-wrap gap-2">
        <Link className="navbar-brand fw-semibold" to="/">
          🐱 catFinder
        </Link>
        {token && (
          <div className="d-flex flex-wrap gap-2">
            <Link className="btn btn-sm btn-outline-secondary" to="/">
              Álbum
            </Link>
            <Link className="btn btn-sm btn-outline-secondary" to="/nueva">
              Agregar lámina
            </Link>
            <Link className="btn btn-sm btn-outline-secondary" to="/carga-masiva">
              Carga masiva
            </Link>
            <Link className="btn btn-sm btn-outline-secondary" to="/faltantes">
              Faltantes
            </Link>
            <Link className="btn btn-sm btn-outline-secondary" to="/repetidas">
              Repetidas
            </Link>
            <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
              Salir
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
