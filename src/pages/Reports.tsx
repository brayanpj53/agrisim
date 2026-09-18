import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

import {
  BarChart3,
  Droplets,
  FileSpreadsheet,
  Sprout,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import * as XLSX from "xlsx";

type Parcel = {
  id: number;
  name: string;
  crop: string;
  hectares: number;
  stage: string;
};

type Simulation = {
  id: number;
  parcel_id: number;

  irrigation: number;
  fertilizer: number;
  moisture: number;
  price_per_ton: number;

  estimated_yield: number;
  total_production: number;
  water_use: number;

  total_cost: number;
  revenue: number;
  profit: number;

  risk: string;
  created_at: string;
};

function Reports() {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);

  const [selectedParcelId, setSelectedParcelId] =
    useState<number | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);

      const {
        data: parcelData,
        error: parcelError,
      } = await supabase
        .from("parcels")
        .select("id, name, crop, hectares, stage")
        .order("created_at", {
          ascending: true,
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
        .select("*")
        .order("created_at", {
          ascending: true,
        });

      if (simulationError) {
        console.error(
          "Error cargando simulaciones:",
          simulationError
        );

        setLoading(false);
        return;
      }

      const loadedParcels =
        (parcelData ?? []) as Parcel[];

      const loadedSimulations =
        (simulationData ?? []) as Simulation[];

      setParcels(loadedParcels);
      setSimulations(loadedSimulations);

      if (loadedParcels.length > 0) {
        setSelectedParcelId(
          loadedParcels[0].id
        );
      }

      setLoading(false);
    };

    loadReports();
  }, []);

  const selectedParcel =
    parcels.find(
      (parcel) =>
        parcel.id === selectedParcelId
    ) ?? null;

  const parcelSimulations = useMemo(() => {
    if (selectedParcelId === null) {
      return [];
    }

    return simulations.filter(
      (simulation) =>
        simulation.parcel_id ===
        selectedParcelId
    );
  }, [
    simulations,
    selectedParcelId,
  ]);

  const latestSimulation =
    parcelSimulations.length > 0
      ? parcelSimulations[
          parcelSimulations.length - 1
        ]
      : null;

  const averages = useMemo(() => {
    if (parcelSimulations.length === 0) {
      return {
        yield: 0,
        profit: 0,
        production: 0,
        water: 0,
      };
    }

    const totalYield =
      parcelSimulations.reduce(
        (sum, simulation) =>
          sum +
          Number(
            simulation.estimated_yield
          ),
        0
      );

    const totalProfit =
      parcelSimulations.reduce(
        (sum, simulation) =>
          sum +
          Number(simulation.profit),
        0
      );

    const totalProduction =
      parcelSimulations.reduce(
        (sum, simulation) =>
          sum +
          Number(
            simulation.total_production
          ),
        0
      );

    const totalWater =
      parcelSimulations.reduce(
        (sum, simulation) =>
          sum +
          Number(
            simulation.water_use
          ),
        0
      );

    const count =
      parcelSimulations.length;

    return {
      yield:
        totalYield / count,

      profit:
        totalProfit / count,

      production:
        totalProduction / count,

      water:
        totalWater / count,
    };
  }, [parcelSimulations]);

  const chartData = parcelSimulations.map(
    (simulation, index) => ({
      name: `S${index + 1}`,

      rendimiento: Number(
        simulation.estimated_yield
      ),

      utilidad: Number(
        simulation.profit
      ),

      agua:
        Number(
          simulation.water_use
        ) / 1000000,
    })
  );

  const downloadExcel = () => {
    if (!selectedParcel) {
      alert(
        "Selecciona una parcela."
      );

      return;
    }

    if (
      parcelSimulations.length === 0
    ) {
      alert(
        "Esta parcela todavía no tiene simulaciones guardadas."
      );

      return;
    }

    const workbook =
      XLSX.utils.book_new();

    /* =========================
       RESUMEN
    ========================= */

    const summaryData = [
      {
        Indicador:
          "Parcela",

        Valor:
          selectedParcel.name,
      },
      {
        Indicador:
          "Cultivo",

        Valor:
          selectedParcel.crop,
      },
      {
        Indicador:
          "Superficie (ha)",

        Valor:
          selectedParcel.hectares,
      },
      {
        Indicador:
          "Etapa",

        Valor:
          selectedParcel.stage,
      },
      {
        Indicador:
          "Simulaciones guardadas",

        Valor:
          parcelSimulations.length,
      },
      {
        Indicador:
          "Rendimiento promedio (t/ha)",

        Valor:
          Number(
            averages.yield.toFixed(2)
          ),
      },
      {
        Indicador:
          "Producción promedio (t)",

        Valor:
          Number(
            averages.production.toFixed(
              2
            )
          ),
      },
      {
        Indicador:
          "Utilidad promedio ($)",

        Valor:
          Number(
            averages.profit.toFixed(2)
          ),
      },
      {
        Indicador:
          "Consumo promedio de agua (ML)",

        Valor:
          Number(
            (
              averages.water /
              1000000
            ).toFixed(2)
          ),
      },
    ];

    const summarySheet =
      XLSX.utils.json_to_sheet(
        summaryData
      );

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Resumen"
    );

    /* =========================
       PARCELA
    ========================= */

    const parcelSheet =
      XLSX.utils.json_to_sheet([
        {
          ID:
            selectedParcel.id,

          Nombre:
            selectedParcel.name,

          Cultivo:
            selectedParcel.crop,

          Hectareas:
            selectedParcel.hectares,

          Etapa:
            selectedParcel.stage,
        },
      ]);

    XLSX.utils.book_append_sheet(
      workbook,
      parcelSheet,
      "Parcela"
    );

    /* =========================
       SIMULACIONES
    ========================= */

    const simulationRows =
      parcelSimulations.map(
        (simulation, index) => ({
          Simulacion:
            index + 1,

          Fecha:
            new Date(
              simulation.created_at
            ).toLocaleString(
              "es-MX"
            ),

          Riego_mm_dia:
            simulation.irrigation,

          Fertilizante_kg_ha:
            simulation.fertilizer,

          Humedad_porcentaje:
            simulation.moisture,

          Precio_por_ton:
            simulation.price_per_ton,

          Rendimiento_t_ha:
            simulation.estimated_yield,

          Produccion_total_t:
            simulation.total_production,

          Agua_ML:
            Number(
              (
                simulation.water_use /
                1000000
              ).toFixed(2)
            ),

          Costo_total:
            simulation.total_cost,

          Ingreso:
            simulation.revenue,

          Utilidad:
            simulation.profit,

          Riesgo:
            simulation.risk,
        })
      );

    const simulationSheet =
      XLSX.utils.json_to_sheet(
        simulationRows
      );

    XLSX.utils.book_append_sheet(
      workbook,
      simulationSheet,
      "Simulaciones"
    );

    /* ========================= */

    const safeName =
      selectedParcel.name
        .replace(
          /[^a-zA-Z0-9]/g,
          "_"
        );

    XLSX.writeFile(
      workbook,
      `AgriSim_${safeName}.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="reports-loading">
        Cargando reportes...
      </div>
    );
  }

  return (
    <section className="reports-page">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            AGRISIM · ANÁLISIS
          </span>

          <h1>Reportes</h1>

          <p>
            Analiza el desempeño de
            tus parcelas y escenarios.
          </p>
        </div>

        <button
          className="excel-button"
          onClick={downloadExcel}
        >
          <FileSpreadsheet
            size={19}
          />

          Descargar Excel
        </button>
      </div>

      <div className="reports-toolbar">
        <div>
          <label>
            Parcela
          </label>

          <select
            value={
              selectedParcelId ??
              ""
            }
            onChange={(event) =>
              setSelectedParcelId(
                Number(
                  event.target.value
                )
              )
            }
          >
            {parcels.map(
              (parcel) => (
                <option
                  key={
                    parcel.id
                  }
                  value={
                    parcel.id
                  }
                >
                  {parcel.name}
                  {" · "}
                  {parcel.crop}
                </option>
              )
            )}
          </select>
        </div>

        {selectedParcel && (
          <div className="reports-parcel-info">
            <span>
              {selectedParcel.crop}
            </span>

            <span>
              {selectedParcel.hectares}
              {" "}ha
            </span>

            <span>
              {selectedParcel.stage}
            </span>
          </div>
        )}
      </div>

      {parcelSimulations.length ===
      0 ? (
        <div className="reports-empty">
          <BarChart3
            size={58}
          />

          <h2>
            Sin simulaciones
          </h2>

          <p>
            Guarda al menos una
            simulación para esta parcela
            y sus resultados aparecerán
            aquí.
          </p>
        </div>
      ) : (
        <>
          <div className="reports-kpi-grid">
            <div className="report-kpi-card">
              <Sprout
                size={22}
              />

              <span>
                Rendimiento promedio
              </span>

              <strong>
                {averages.yield.toFixed(
                  2
                )}{" "}
                t/ha
              </strong>
            </div>

            <div className="report-kpi-card">
              <TrendingUp
                size={22}
              />

              <span>
                Producción promedio
              </span>

              <strong>
                {averages.production.toFixed(
                  1
                )}{" "}
                t
              </strong>
            </div>

            <div className="report-kpi-card">
              <Wallet
                size={22}
              />

              <span>
                Utilidad promedio
              </span>

              <strong>
                $
                {averages.profit.toLocaleString(
                  "es-MX",
                  {
                    maximumFractionDigits:
                      0,
                  }
                )}
              </strong>
            </div>

            <div className="report-kpi-card">
              <Droplets
                size={22}
              />

              <span>
                Agua promedio
              </span>

              <strong>
                {(
                  averages.water /
                  1000000
                ).toFixed(
                  1
                )}{" "}
                ML
              </strong>
            </div>
          </div>

          <div className="reports-charts-grid">
            <div className="report-chart-card">
              <div className="report-card-header">
                <div>
                  <span>
                    Histórico
                  </span>

                  <h2>
                    Rendimiento
                  </h2>
                </div>
              </div>

              <div className="report-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={chartData}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#294454"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#7892a1"
                    />

                    <YAxis
                      stroke="#7892a1"
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="rendimiento"
                      name="Rendimiento t/ha"
                      stroke="#52b7e8"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="report-chart-card">
              <div className="report-card-header">
                <div>
                  <span>
                    Financiero
                  </span>

                  <h2>
                    Utilidad
                  </h2>
                </div>
              </div>

              <div className="report-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={chartData}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#294454"
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#7892a1"
                    />

                    <YAxis
                      stroke="#7892a1"
                    />

                    <Tooltip />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="utilidad"
                      name="Utilidad $"
                      stroke="#60c47a"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="reports-bottom-grid">
            <div className="latest-simulation-card">
              <div className="report-card-header">
                <div>
                  <span>
                    Último escenario
                  </span>

                  <h2>
                    Resultado reciente
                  </h2>
                </div>
              </div>

              {latestSimulation && (
                <div className="latest-simulation-data">
                  <div>
                    <span>
                      Rendimiento
                    </span>

                    <strong>
                      {Number(
                        latestSimulation.estimated_yield
                      ).toFixed(
                        2
                      )}
                      {" "}t/ha
                    </strong>
                  </div>

                  <div>
                    <span>
                      Utilidad
                    </span>

                    <strong>
                      $
                      {Number(
                        latestSimulation.profit
                      ).toLocaleString(
                        "es-MX",
                        {
                          maximumFractionDigits:
                            0,
                        }
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Riego
                    </span>

                    <strong>
                      {
                        latestSimulation.irrigation
                      }
                      {" "}mm/día
                    </strong>
                  </div>

                  <div>
                    <span>
                      Riesgo
                    </span>

                    <strong>
                      {
                        latestSimulation.risk
                      }
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <div className="report-summary-card">
              <div className="report-card-header">
                <div>
                  <span>
                    Base histórica
                  </span>

                  <h2>
                    Simulaciones
                  </h2>
                </div>
              </div>

              <div className="report-big-number">
                {
                  parcelSimulations.length
                }

                <span>
                  escenarios guardados
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default Reports;