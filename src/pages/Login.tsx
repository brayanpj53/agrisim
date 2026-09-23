import { useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BarChart3,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  Map,
  Sprout,
} from "lucide-react";

import { supabase } from "../lib/supabase";

function Login() {
  const navigate = useNavigate();

  const [mode, setMode] =
    useState<"login" | "register">(
      "login"
    );

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setMessage("");
    setSubmitting(true);

    if (mode === "register") {
      const { error } =
        await supabase.auth.signUp({
          email,
          password,
        });

      if (error) {
        setMessage(
          error.message
        );

        setSubmitting(false);
        return;
      }

      setMessage(
        "Cuenta creada. Revisa tu correo si Supabase solicita confirmación."
      );

      setSubmitting(false);
      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (error) {
      setMessage(
        error.message
      );

      setSubmitting(false);
      return;
    }

    navigate("/");
  };

  const changeMode = () => {
    setMode(
      mode === "login"
        ? "register"
        : "login"
    );

    setMessage("");
  };

  return (
    <main className="ag-auth-page">
      {/* =========================
          BRAND / HERO
      ========================= */}

      <section className="ag-auth-brand">
        <div className="ag-auth-brand-top">
          <div className="ag-auth-logo">
            <div className="ag-auth-logo-icon">
              <Leaf
                size={26}
                strokeWidth={2.1}
              />
            </div>

            <div>
              <strong>
                Agri
                <span>Sim</span>
              </strong>

              <small>
                Simulación agrícola
              </small>
            </div>
          </div>

          <span className="ag-auth-version">
            v0.11
          </span>
        </div>

        <div className="ag-auth-hero">
          <span className="ag-page-eyebrow">
            AGRICULTURA + DATOS
          </span>

          <h1>
            Mejores decisiones,
            <span>
              {" "}
              un campo más fuerte.
            </span>
          </h1>

          <p>
            Simula escenarios agrícolas,
            analiza resultados y convierte
            las condiciones de tu cultivo
            en información para tomar
            mejores decisiones.
          </p>

          <div className="ag-auth-features">
            <div>
              <span>
                <Map size={18} />
              </span>

              <div>
                <strong>
                  Parcelas
                </strong>

                <small>
                  Centraliza la información
                  de tus predios.
                </small>
              </div>
            </div>

            <div>
              <span>
                <Sprout
                  size={18}
                />
              </span>

              <div>
                <strong>
                  Simulaciones
                </strong>

                <small>
                  Explora escenarios antes
                  de tomar decisiones.
                </small>
              </div>
            </div>

            <div>
              <span>
                <BarChart3
                  size={18}
                />
              </span>

              <div>
                <strong>
                  Reportes
                </strong>

                <small>
                  Convierte resultados en
                  análisis comprensible.
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="ag-auth-field-art">
          <div className="ag-auth-field-grid">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className="ag-auth-field-glow" />

          <div className="ag-auth-field-badge">
            <Sprout
              size={15}
            />

            <span>
              Cultiva mejores
              decisiones
            </span>
          </div>
        </div>

        <div className="ag-auth-brand-footer">
          <span>
            AgriSim
          </span>

          <span>
            Plataforma de análisis y
            simulación agrícola
          </span>
        </div>
      </section>

      {/* =========================
          AUTH
      ========================= */}

      <section className="ag-auth-form-side">
        <div className="ag-auth-mobile-logo">
          <div className="ag-auth-logo-icon">
            <Leaf
              size={22}
            />
          </div>

          <strong>
            Agri<span>Sim</span>
          </strong>
        </div>

        <div className="ag-auth-card">
          <div className="ag-auth-card-heading">
            <span className="ag-auth-card-kicker">
              {mode === "login"
                ? "ACCESO A LA PLATAFORMA"
                : "NUEVA CUENTA"}
            </span>

            <h2>
              {mode === "login"
                ? "Bienvenido de vuelta."
                : "Comienza con AgriSim."}
            </h2>

            <p>
              {mode === "login"
                ? "Ingresa tus datos para continuar con tu operación."
                : "Crea una cuenta para administrar parcelas, simulaciones y reportes."}
            </p>
          </div>

          <form
            className="ag-auth-form"
            onSubmit={
              handleSubmit
            }
          >
            <div className="ag-auth-field">
              <label htmlFor="email">
                Correo electrónico
              </label>

              <div className="ag-auth-input">
                <Mail
                  size={17}
                />

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target
                        .value
                    )
                  }
                  placeholder="ingeniero@ejemplo.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="ag-auth-field">
              <div className="ag-auth-label-row">
                <label htmlFor="password">
                  Contraseña
                </label>

                {mode ===
                  "register" && (
                  <span>
                    Mínimo 6 caracteres
                  </span>
                )}
              </div>

              <div className="ag-auth-input">
                <LockKeyhole
                  size={17}
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    mode ===
                    "login"
                      ? "Tu contraseña"
                      : "Mínimo 6 caracteres"
                  }
                  autoComplete={
                    mode ===
                    "login"
                      ? "current-password"
                      : "new-password"
                  }
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  className="ag-auth-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={17}
                    />
                  ) : (
                    <Eye
                      size={17}
                    />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="ag-auth-submit"
              disabled={
                submitting
              }
            >
              <span>
                {submitting
                  ? "Procesando..."
                  : mode ===
                    "login"
                  ? "Iniciar sesión"
                  : "Crear cuenta"}
              </span>

              {!submitting && (
                <ArrowRight
                  size={17}
                />
              )}
            </button>
          </form>

          {message && (
            <div className="ag-auth-message">
              {message}
            </div>
          )}

          <div className="ag-auth-divider">
            <span />

            <small>
              o
            </small>

            <span />
          </div>

          <div className="ag-auth-switch-area">
            <span>
              {mode === "login"
                ? "¿Aún no tienes una cuenta?"
                : "¿Ya tienes una cuenta?"}
            </span>

            <button
              type="button"
              onClick={
                changeMode
              }
            >
              {mode === "login"
                ? "Crear cuenta"
                : "Iniciar sesión"}
            </button>
          </div>

          <div className="ag-auth-security">
            <LockKeyhole
              size={13}
            />

            <span>
              Acceso protegido mediante
              Supabase Auth
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;