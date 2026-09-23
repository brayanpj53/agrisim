import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  Droplets,
  TriangleAlert,
  Tractor,
  Sprout,
  TrendingUp,
  FlaskConical,
  ArrowRight,
  Activity,
  BarChart3,
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

      setParcels(
        (parcelData ?? []) as Parcel[]
      );

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
      <div className="ag-home-loading">
        Cargando centro de operaciones...
      </div>
    );
  }

  return (
    <section className="ag-home">
      <div className="ag-home-hero">
        <div className="ag-home-hero-copy">
          <span className="ag-page-eyebrow">
            CENTRO DE OPERACIONES
          </span>

          <h1>
            Decisiones más claras
            <span className="ag-green">
              {" "}para tu campo.
            </span>
          </h1>

          <p>
            Visualiza tus parcelas, revisa el
            desempeño de tus escenarios y detecta
            oportunidades desde un solo lugar.
          </p>
        </div>

        <div className="ag-home-hero-quote">
          <span className="ag-editorial">
            La mejor cosecha empieza con
            una mejor decisión.
          </span>
        </div>
      </div>

      <div className="ag-home-kpis">
        <article className="ag-home-kpi">
          <div className="ag-home-kpi-icon">
            <Tractor size={21} />
          </div>

          <div>
            <span>Parcelas activas</span>

            <strong>{parcels.length}</strong>

            <small>
              Predios registrados
            </small>
          </div>
        </article>

        <article className="ag-home-kpi">
          <div className="ag-home-kpi-icon">
            <FlaskConical size={21} />
          </div>

          <div>
            <span>Simulaciones</span>

            <strong>
              {simulations.length}
            </strong>

            <small>
              Escenarios guardados
            </small>
          </div>
        </article>

        <article className="ag-home-kpi">
          <div className="ag-home-kpi-icon">
            <TrendingUp size={21} />
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
        </article>

        <article className="ag-home-kpi ag-home-kpi-alert">
          <div className="ag-home-kpi-icon">
            <TriangleAlert size={21} />
          </div>

          <div>
            <span>Alertas</span>

            <strong>
              {alerts}
            </strong>

            <small>
              Escenarios con riesgo
            </small>
          </div>
        </article>
      </div>

      <div className="ag-home-main-grid">
        <section className="ag-home-field-card">
          <div className="ag-home-card-header">
            <div>
              <span className="ag-home-section-kicker">
                RESUMEN PRODUCTIVO
              </span>

              <h2>
                Vista general del campo
              </h2>
            </div>

            <span className="ag-badge">
              {alerts === 0
                ? "Operación estable"
                : `${alerts} alertas`}
            </span>
          </div>

          <div className="ag-home-field-visual">
            <div className="ag-home-orb ag-home-orb-one" />
            <div className="ag-home-orb ag-home-orb-two" />

            <div className="ag-home-field-center">
              <div className="ag-home-field-icon">
                <Sprout size={54} />
              </div>

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

          <div className="ag-home-field-footer">
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
              <BarChart3 size={18} />

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
        </section>

        <aside className="ag-home-activity-card">
          <div className="ag-home-card-header">
            <div>
              <span className="ag-home-section-kicker">
                SEGUIMIENTO
              </span>

              <h2>
                Actividad reciente
              </h2>
            </div>

            <Activity
              size={21}
            />
          </div>

          <div className="ag-home-activity-list">
            {latestSimulation ? (
              <div className="ag-home-activity-item">
                <div className="ag-home-activity-dot success" />

                <div className="ag-home-activity-content">
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

                <ArrowRight size={16} />
              </div>
            ) : (
              <div className="ag-home-activity-item">
                <div className="ag-home-activity-dot neutral" />

                <div className="ag-home-activity-content">
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
              <div className="ag-home-activity-item">
                <div className="ag-home-activity-dot info" />

                <div className="ag-home-activity-content">
                  <strong>
                    Parcela registrada
                  </strong>

                  <span>
                    {latestParcel.name}
                    {" · "}
                    {latestParcel.crop}
                  </span>

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

                <ArrowRight size={16} />
              </div>
            )}

            {alerts > 0 && (
              <div className="ag-home-activity-item">
                <div className="ag-home-activity-dot warning" />

                <div className="ag-home-activity-content">
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

                <ArrowRight size={16} />
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Dashboard;