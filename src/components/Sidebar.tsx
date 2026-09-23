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
  const navItems = [
    {
      to: "/",
      label: "Inicio",
      icon: Home,
    },
    {
      to: "/parcelas",
      label: "Parcelas",
      icon: Map,
    },
    {
      to: "/simulaciones",
      label: "Simulaciones",
      icon: FlaskConical,
    },
    {
      to: "/reportes",
      label: "Reportes",
      icon: FileBarChart,
    },
  ];

  return (
    <aside className="ag-sidebar">
      <div className="ag-sidebar-brand">
        <div className="ag-sidebar-logo">
          <Leaf size={25} strokeWidth={2.2} />
        </div>

        <div>
          <strong>
            Agri<span>Sim</span>
          </strong>

          <small>
            Simulación agrícola
          </small>
        </div>
      </div>

      <nav className="ag-sidebar-nav">
        <span className="ag-sidebar-section-label">
          PLATAFORMA
        </span>

        {navItems.map(
          ({
            to,
            label,
            icon: Icon,
          }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `ag-sidebar-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
            >
              <div className="ag-sidebar-link-icon">
                <Icon
                  size={20}
                  strokeWidth={1.8}
                />
              </div>

              <span>{label}</span>
            </NavLink>
          )
        )}

        <span className="ag-sidebar-section-label ag-sidebar-second-section">
          SISTEMA
        </span>

        <NavLink
          to="/configuracion"
          className={({ isActive }) =>
            `ag-sidebar-link ${
              isActive ? "active" : ""
            }`
          }
        >
          <div className="ag-sidebar-link-icon">
            <Settings
              size={20}
              strokeWidth={1.8}
            />
          </div>

          <span>
            Configuración
          </span>
        </NavLink>
      </nav>

      <div className="ag-sidebar-footer">
        <div className="ag-sidebar-message">
          <Leaf size={20} />

          <div>
            <strong>
              Cultiva mejores decisiones
            </strong>

            <span>
              Datos para un campo más eficiente.
            </span>
          </div>
        </div>

        <div className="ag-sidebar-version">
          AgriSim v0.11
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;