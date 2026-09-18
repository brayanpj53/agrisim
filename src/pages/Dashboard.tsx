import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  Droplets,
  TriangleAlert,
  Tractor,
  Sprout,
  TrendingUp,
  FlaskConical,
} from "lucide-react";

type Parcel = {
  id: number;
  name: string;
  crop: string;
  hectares: number;
  moisture: number | null;
  status: string;
  created_at?: string;
};

type Simulation = {
  id: number;
  parcel_id: number;
  estimated_yield: number;
  profit: number;
  risk: string;
  created_at: string;
};

function Dashboard() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const {
        data: parcelData,
        error: parcelError,
      } = await supabase
        .from("parcels")
        .select(
          "id, name, crop, hectares, moisture, status, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (parcelError) {
        console.error(
          "Error cargando parcelas:",
          parcelError
        );

        setLoading(false);
        return;
      }

      const {
        data: simulationData,
        error: simulationError,
      } = await supabase
        .from("simulations")
        .select(
          "id, parcel_id, estimated_yield, profit, risk, created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      if (simulationError) {
        console.error(
          "Error cargando simulaciones:",
          simulationError
        );

        setLoading(false);
        return;
      }

      setParcels((parcelData ?? []) as Parcel[]);
      setSimulations(
        (simulationData ?? []) as Simulation[]
      );

      setLoading(false);
    };

    loadDashboard();
  }, []);

  const averageYield = useMemo(() => {
    if (simulations.length === 0) {
      return 0;
    }

    const total = simulations.reduce(
      (sum, simulation) =>
        sum +
        Number(
          simulation.estimated_yield
        ),
      0
    );

    return total / simulations.length;
  }, [simulations]);

  const alerts = useMemo(() => {
    return simulations.filter(
      (simulation) =>
        simulation.risk === "Alto" ||
        simulation.risk === "Moderado"
    ).length;
  }, [simulations]);

  const averageMoisture = useMemo(() => {
    const validParcels =
      parcels.filter(
        (parcel) =>
          parcel.moisture !== null
      );

    if (validParcels.length === 0) {
      return 0;
    }

    const total =
      validParcels.reduce(
        (sum, parcel) =>
          sum +
          Number(
            parcel.moisture
          ),
        0
      );

    return total / validParcels.length;
  }, [parcels]);

  const latestSimulation =
    simulations.length > 0
      ? simulations[0]
      : null;

  const latestParcel =
    parcels.length > 0
      ? parcels[0]
      : null;

  const parcelNameById = (
    parcelId: number
  ) => {
    return (
      parcels.find(
        (parcel) =>
          parcel.id === parcelId
      )?.name ??
      "Parcela"
    );
  };

  if (loading) {
    return (
      <div className="reports-loading">
        Cargando inicio...
      </div>
    );
  }

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            AGRISIM · CENTRO DE OPERACIONES
          </span>

          <h1>Inicio</h1>

          <p>
            Resumen general de tus parcelas,
            simulaciones y actividad reciente.
          </p>
        </div>
      </div>

      <div className="home-metrics">
        <div className="home-metric-card">
          <div className="home-metric-icon">
            <Tractor size={22} />
          </div>

          <div>
            <span>
              Parcelas activas
            </span>

            <strong>
              {parcels.length}
            </strong>

            <small>
              Predios registrados
            </small>
          </div>
        </div>

        <div className="home-metric-card">
          <div className="home-metric-icon">
            <FlaskConical size={22} />
          </div>

          <div>
            <span>
              Simulaciones
            </span>

            <strong>
              {simulations.length}
            </strong>

            <small>
              Escenarios guardados
            </small>
          </div>
        </div>

        <div className="home-metric-card">
          <div className="home-metric-icon">
            <TrendingUp size={22} />
          </div>

          <div>
            <span>
              Rendimiento promedio
            </span>

            <strong>
              {averageYield.toFixed(2)}
              {" "}t/ha
            </strong>

            <small>
              Según tus simulaciones
            </small>
          </div>
        </div>

        <div className="home-metric-card">
          <div className="home-metric-icon warning-icon">
            <TriangleAlert size={22} />
          </div>

          <div>
            <span>
              Alertas
            </span>

            <strong>
              {alerts}
            </strong>

            <small>
              Escenarios con riesgo
            </small>
          </div>
        </div>
      </div>

      <div className="home-main-grid">
        <div className="home-farm-card">
          <div className="home-card-header">
            <div>
              <span className="panel-label">
                Resumen productivo
              </span>

              <h2>
                Estado general
              </h2>
            </div>

            <span className="status-badge">
              {alerts === 0
                ? "Operación estable"
                : `${alerts} alertas`}
            </span>
          </div>

          <div className="home-farm-visual">
            <div className="home-farm-center">
              <Sprout size={70} />

              <h3>
                {latestParcel
                  ? latestParcel.name
                  : "Sin parcelas registradas"}
              </h3>

              <p>
                {latestParcel
                  ? `${latestParcel.crop} · ${latestParcel.hectares} ha`
                  : "Crea una parcela para comenzar a visualizar tu operación."}
              </p>
            </div>
          </div>

          <div className="home-farm-footer">
            <div>
              <Droplets size={18} />

              <span>
                Humedad promedio
              </span>

              <strong>
                {averageMoisture > 0
                  ? `${averageMoisture.toFixed(1)}%`
                  : "Sin datos"}
              </strong>
            </div>

            <div>
              <Sprout size={18} />

              <span>
                Parcelas
              </span>

              <strong>
                {parcels.length}
              </strong>
            </div>

            <div>
              <TrendingUp size={18} />

              <span>
                Rendimiento
              </span>

              <strong>
                {averageYield > 0
                  ? `${averageYield.toFixed(2)} t/ha`
                  : "Sin datos"}
              </strong>
            </div>
          </div>
        </div>

        <div className="home-activity-card">
          <div className="home-card-header">
            <div>
              <span className="panel-label">
                Seguimiento
              </span>

              <h2>
                Actividad reciente
              </h2>
            </div>
          </div>

          <div className="home-activity-list">
            {latestSimulation ? (
              <div className="home-activity-item">
                <span className="activity-dot green" />

                <div>
                  <strong>
                    Simulación guardada
                  </strong>

                  <span>
                    {parcelNameById(
                      latestSimulation.parcel_id
                    )}
                    {" · "}
                    {Number(
                      latestSimulation.estimated_yield
                    ).toFixed(2)}
                    {" "}t/ha
                  </span>
                </div>

                <small>
                  {new Date(
                    latestSimulation.created_at
                  ).toLocaleString(
                    "es-MX",
                    {
                      dateStyle:
                        "short",
                      timeStyle:
                        "short",
                    }
                  )}
                </small>
              </div>
            ) : (
              <div className="home-activity-item">
                <span className="activity-dot blue" />

                <div>
                  <strong>
                    Sin simulaciones
                  </strong>

                  <span>
                    Ejecuta tu primer escenario.
                  </span>
                </div>
              </div>
            )}

            {latestParcel && (
              <div className="home-activity-item">
                <span className="activity-dot blue" />

                <div>
                  <strong>
                    Parcela registrada
                  </strong>

                  <span>
                    {latestParcel.name}
                    {" · "}
                    {latestParcel.crop}
                  </span>
                </div>

                {latestParcel.created_at && (
                  <small>
                    {new Date(
                      latestParcel.created_at
                    ).toLocaleDateString(
                      "es-MX"
                    )}
                  </small>
                )}
              </div>
            )}

            {alerts > 0 && (
              <div className="home-activity-item">
                <span className="activity-dot yellow" />

                <div>
                  <strong>
                    Riesgo detectado
                  </strong>

                  <span>
                    {alerts} escenario
                    {alerts !== 1
                      ? "s"
                      : ""}
                    {" "}
                    requieren revisión.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;