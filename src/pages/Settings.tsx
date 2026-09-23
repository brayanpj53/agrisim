import {
  useEffect,
  useState,
} from "react";

import {
  UserRound,
  Mail,
  Palette,
  LayoutPanelTop,
  Sparkles,
  Save,
  ShieldCheck,
  LogOut,
  CheckCircle2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabase";

function Settings() {
  const navigate = useNavigate();

  const [email, setEmail] =
    useState("");

  const [displayName, setDisplayName] =
    useState("");

  const [compactMode, setCompactMode] =
    useState(false);

  const [
    reduceMotion,
    setReduceMotion,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  /* =========================
     APARIENCIA
  ========================= */

  function applyAppearance(
    compact: boolean,
    reduced: boolean
  ) {
    document.documentElement.classList.toggle(
      "ag-compact",
      compact
    );

    document.documentElement.classList.toggle(
      "ag-reduce-motion",
      reduced
    );
  }

  /* =========================
     CARGAR CONFIGURACIÓN
  ========================= */

  useEffect(() => {
    const loadSettings =
      async () => {
        const {
          data: { user },
          error,
        } =
          await supabase.auth.getUser();

        if (error || !user) {
          console.error(
            "Error cargando usuario:",
            error
          );

          setLoading(false);
          return;
        }

        setEmail(
          user.email ?? ""
        );

        setDisplayName(
          user.user_metadata
            ?.display_name ??
            ""
        );

        const storedCompact =
          localStorage.getItem(
            "agrisim-compact-mode"
          ) === "true";

        const storedMotion =
          localStorage.getItem(
            "agrisim-reduce-motion"
          ) === "true";

        setCompactMode(
          storedCompact
        );

        setReduceMotion(
          storedMotion
        );

        applyAppearance(
          storedCompact,
          storedMotion
        );

        setLoading(false);
      };

    void loadSettings();
  }, []);

  /* =========================
     CAMBIAR APARIENCIA
  ========================= */

  const handleCompactChange = (
    value: boolean
  ) => {
    setCompactMode(value);

    localStorage.setItem(
      "agrisim-compact-mode",
      String(value)
    );

    applyAppearance(
      value,
      reduceMotion
    );
  };

  const handleMotionChange = (
    value: boolean
  ) => {
    setReduceMotion(value);

    localStorage.setItem(
      "agrisim-reduce-motion",
      String(value)
    );

    applyAppearance(
      compactMode,
      value
    );
  };

  /* =========================
     GUARDAR PERFIL
  ========================= */

  const saveProfile =
    async () => {
      setSaving(true);
      setSaved(false);

      const { error } =
        await supabase.auth.updateUser({
          data: {
            display_name:
              displayName.trim(),
          },
        });

      if (error) {
        console.error(
          "Error guardando perfil:",
          error
        );

        alert(
          "No se pudo guardar el perfil."
        );

        setSaving(false);
        return;
      }

      window.dispatchEvent(
        new Event(
          "agrisim-profile-updated"
        )
      );

      setSaving(false);
      setSaved(true);

      window.setTimeout(
        () => {
          setSaved(false);
        },
        2500
      );
    };

  /* =========================
     LOGOUT
  ========================= */

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

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="ag-settings-loading">
        Cargando configuración...
      </div>
    );
  }

  return (
    <section className="ag-settings">
      {/* HEADER */}

      <header className="ag-settings-header">
        <div>
          <span className="ag-page-eyebrow">
            PREFERENCIAS
          </span>

          <h1>
            Configuración
          </h1>

          <p>
            Personaliza tu perfil y
            adapta la experiencia de
            AgriSim a tu forma de
            trabajar.
          </p>
        </div>
      </header>

      <div className="ag-settings-layout">
        {/* =====================
            PERFIL
        ====================== */}

        <section className="ag-settings-card ag-settings-profile">
          <div className="ag-settings-card-header">
            <div className="ag-settings-card-icon">
              <UserRound
                size={20}
              />
            </div>

            <div>
              <span>
                CUENTA
              </span>

              <h2>
                Perfil
              </h2>

              <p>
                Información asociada a
                tu sesión de AgriSim.
              </p>
            </div>
          </div>

          <div className="ag-settings-card-body">
            <div className="ag-settings-profile-preview">
              <div className="ag-settings-avatar">
                {displayName
                  ? displayName
                      .charAt(0)
                      .toUpperCase()
                  : "A"}
              </div>

              <div>
                <strong>
                  {displayName ||
                    "Usuario AgriSim"}
                </strong>

                <span>
                  {email}
                </span>
              </div>
            </div>

            <div className="ag-settings-field">
              <label>
                Nombre visible
              </label>

              <div className="ag-settings-input-wrapper">
                <UserRound
                  size={16}
                />

                <input
                  type="text"
                  value={
                    displayName
                  }
                  placeholder="Tu nombre"
                  onChange={(
                    event
                  ) =>
                    setDisplayName(
                      event.target
                        .value
                    )
                  }
                />
              </div>

              <small>
                Este nombre se mostrará
                dentro de la plataforma.
              </small>
            </div>

            <div className="ag-settings-field">
              <label>
                Correo electrónico
              </label>

              <div className="ag-settings-input-wrapper disabled">
                <Mail
                  size={16}
                />

                <input
                  type="email"
                  value={email}
                  disabled
                />
              </div>

              <small>
                Correo utilizado para
                autenticar tu cuenta.
              </small>
            </div>

            <div className="ag-settings-save-row">
              {saved && (
                <div className="ag-settings-saved">
                  <CheckCircle2
                    size={15}
                  />

                  Cambios guardados
                </div>
              )}

              <button
                className="ag-btn ag-btn-primary"
                onClick={
                  saveProfile
                }
                disabled={saving}
              >
                <Save
                  size={16}
                />

                {saving
                  ? "Guardando..."
                  : "Guardar perfil"}
              </button>
            </div>
          </div>
        </section>

        {/* =====================
            APARIENCIA
        ====================== */}

        <section className="ag-settings-card">
          <div className="ag-settings-card-header">
            <div className="ag-settings-card-icon">
              <Palette
                size={20}
              />
            </div>

            <div>
              <span>
                EXPERIENCIA
              </span>

              <h2>
                Apariencia
              </h2>

              <p>
                Ajusta la densidad y
                movimiento de la
                interfaz.
              </p>
            </div>
          </div>

          <div className="ag-settings-options">
            <div className="ag-settings-option">
              <div className="ag-settings-option-main">
                <div className="ag-settings-option-icon">
                  <LayoutPanelTop
                    size={18}
                  />
                </div>

                <div>
                  <strong>
                    Interfaz compacta
                  </strong>

                  <span>
                    Reduce espacios
                    verticales para mostrar
                    más información.
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Activar interfaz compacta"
                className={`ag-settings-switch ${
                  compactMode
                    ? "on"
                    : ""
                }`}
                onClick={() =>
                  handleCompactChange(
                    !compactMode
                  )
                }
              >
                <span />
              </button>
            </div>

            <div className="ag-settings-option">
              <div className="ag-settings-option-main">
                <div className="ag-settings-option-icon">
                  <Sparkles
                    size={18}
                  />
                </div>

                <div>
                  <strong>
                    Reducir animaciones
                  </strong>

                  <span>
                    Minimiza transiciones y
                    efectos de movimiento.
                  </span>
                </div>
              </div>

              <button
                type="button"
                aria-label="Reducir animaciones"
                className={`ag-settings-switch ${
                  reduceMotion
                    ? "on"
                    : ""
                }`}
                onClick={() =>
                  handleMotionChange(
                    !reduceMotion
                  )
                }
              >
                <span />
              </button>
            </div>
          </div>
        </section>

        {/* =====================
            SISTEMA
        ====================== */}

        <section className="ag-settings-card">
          <div className="ag-settings-card-header">
            <div className="ag-settings-card-icon">
              <ShieldCheck
                size={20}
              />
            </div>

            <div>
              <span>
                SISTEMA
              </span>

              <h2>
                Cuenta y sesión
              </h2>

              <p>
                Información técnica de
                esta versión.
              </p>
            </div>
          </div>

          <div className="ag-settings-system">
            <div>
              <span>
                Versión
              </span>

              <strong>
                AgriSim v0.11
              </strong>
            </div>

            <div>
              <span>
                Autenticación
              </span>

              <strong className="ag-settings-status">
                <span />
                Supabase Auth
              </strong>
            </div>

            <div>
              <span>
                Estado
              </span>

              <strong className="ag-settings-status">
                <span />
                Sesión activa
              </strong>
            </div>
          </div>

          <div className="ag-settings-danger">
            <div>
              <strong>
                Cerrar sesión
              </strong>

              <span>
                Finaliza tu sesión actual
                de forma segura.
              </span>
            </div>

            <button
              type="button"
              className="ag-settings-logout"
              onClick={
                handleLogout
              }
            >
              <LogOut
                size={16}
              />

              Salir
            </button>
          </div>
        </section>

        {/* =====================
            FUTURO
        ====================== */}

        <section className="ag-settings-coming">
          <div>
            <span className="ag-editorial">
              Próximamente
            </span>

            <h2>
              Más control sobre tu
              operación.
            </h2>

            <p>
              En futuras versiones este
              espacio podrá incluir
              preferencias agronómicas,
              unidades, integraciones y
              configuración del motor de
              simulación.
            </p>
          </div>

          <div className="ag-settings-coming-orb" />
        </section>
      </div>
    </section>
  );
}

export default Settings;