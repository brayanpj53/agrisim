import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage(
        "Cuenta creada. Revisa tu correo si Supabase solicita confirmación."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    navigate("/");
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          Agri<span>Sim</span>
        </div>

        <h1>
          {mode === "login"
            ? "Bienvenido"
            : "Crear cuenta"}
        </h1>

        <p>
          {mode === "login"
            ? "Ingresa a tu plataforma de simulación agrícola."
            : "Crea tu cuenta para administrar predios y simulaciones."}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo electrónico</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="ingeniero@ejemplo.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button auth-button"
          >
            {mode === "login"
              ? "Iniciar sesión"
              : "Crear cuenta"}
          </button>
        </form>

        {message && (
          <div className="auth-message">
            {message}
          </div>
        )}

        <button
          className="auth-switch"
          onClick={() =>
            setMode(
              mode === "login"
                ? "register"
                : "login"
            )
          }
        >
          {mode === "login"
            ? "¿No tienes cuenta? Crear cuenta"
            : "Ya tengo cuenta"}
        </button>
      </div>
    </div>
  );
}

export default Login;