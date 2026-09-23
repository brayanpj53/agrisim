import {
  useEffect,
  useState,
} from "react";

import {
  Bell,
  HelpCircle,
  Search,
  LogOut,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

function Topbar() {
  const navigate = useNavigate();

  const [
    displayName,
    setDisplayName,
  ] = useState("Usuario");

  const [email, setEmail] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const loadInitialUser =
      async () => {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (
          !user ||
          !isMounted
        ) {
          return;
        }

        setDisplayName(
          user.user_metadata
            ?.display_name ||
            "Usuario"
        );

        setEmail(
          user.email ?? ""
        );
      };

    const handleProfileUpdate =
      async () => {
        const {
          data: { user },
        } =
          await supabase.auth.getUser();

        if (
          !user ||
          !isMounted
        ) {
          return;
        }

        setDisplayName(
          user.user_metadata
            ?.display_name ||
            "Usuario"
        );

        setEmail(
          user.email ?? ""
        );
      };

    void loadInitialUser();

    window.addEventListener(
      "agrisim-profile-updated",
      handleProfileUpdate
    );

    return () => {
      isMounted = false;

      window.removeEventListener(
        "agrisim-profile-updated",
        handleProfileUpdate
      );
    };
  }, []);

  const handleLogout =
    async () => {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Error cerrando sesión:",
          error
        );

        return;
      }

      navigate("/login");
    };

  return (
    <header className="ag-topbar">
      <div className="ag-topbar-search">
        <Search
          size={18}
          strokeWidth={1.8}
        />

        <input
          type="text"
          placeholder="Buscar parcelas, simulaciones, reportes..."
        />

        <span>⌘ K</span>
      </div>

      <div className="ag-topbar-actions">
        <button
          className="ag-topbar-icon-button"
          type="button"
          aria-label="Ayuda"
        >
          <HelpCircle
            size={20}
            strokeWidth={1.8}
          />
        </button>

        <button
          className="ag-topbar-icon-button ag-notification-button"
          type="button"
          aria-label="Notificaciones"
        >
          <Bell
            size={20}
            strokeWidth={1.8}
          />

          <span className="ag-notification-dot" />
        </button>

        <div className="ag-topbar-divider" />

        <div className="ag-user-menu">
          <div className="ag-user-avatar">
            <UserRound
              size={18}
              strokeWidth={1.8}
            />
          </div>

          <div className="ag-user-info">
            <strong>
              {displayName}
            </strong>

            <span title={email}>
              Cuenta AgriSim
            </span>
          </div>
        </div>

        <button
          className="ag-logout-button"
          type="button"
          onClick={
            handleLogout
          }
        >
          <LogOut
            size={17}
            strokeWidth={1.8}
          />

          Salir
        </button>
      </div>
    </header>
  );
}

export default Topbar;