import { NavLink } from "react-router-dom";
import {
  Home,
  Map,
  FlaskConical,
  FileBarChart,
  Settings,
  Leaf,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="logo">
        <Leaf size={28} />
        <span>AgriSim</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/">
          <Home size={20} />
          Inicio
        </NavLink>

        <NavLink to="/parcelas">
          <Map size={20} />
          Parcelas
        </NavLink>

        <NavLink to="/simulaciones">
          <FlaskConical size={20} />
          Simulaciones
        </NavLink>

        <NavLink to="/reportes">
          <FileBarChart size={20} />
          Reportes
        </NavLink>

        <NavLink to="/configuracion">
          <Settings size={20} />
          Configuración
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;