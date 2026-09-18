import {
  Bell,
  CircleHelp,
  LogOut,
  User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Topbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error cerrando sesión:", error);
      return;
    }

    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-title">
        Plataforma de simulación agrícola
      </div>

      <div className="topbar-actions">
        <Bell size={20} />
        <CircleHelp size={20} />

        <div className="user-profile">
          <User size={20} />
          <span>Usuario</span>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Salir
        </button>
      </div>
    </header>
  );
}

export default Topbar;