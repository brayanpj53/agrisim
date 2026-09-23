import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

import {
  BarChart3,
  Droplets,
  FileSpreadsheet,
  Sprout,
  TrendingUp,
  Wallet,
  History,
  CalendarDays,
  Layers3,
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
  const [
    parcels,
    setParcels,
  ] = useState<Parcel[]>([]);

  const [
    simulations,
    setSimulations,
  ] = useState<Simulation[]>([]);

  const [
    selectedParcelId,
    setSelectedParcelId,
  ] = useState<number | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  /* =========================
     CARGAR DATOS
  ========================= */

  useEffect(() => {
    const loadReports =
      async () => {
        setLoading(true);

        const {
          data: parcelData,
          error: parcelError,
        } = await supabase
          .from("parcels")
          .select(
            "id, name, crop, hectares, stage"
          )
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

        if (
          simulationError
        ) {
          console.error(
            "Error cargando simulaciones:",
            simulationError
          );

          setLoading(false);
          return;
        }

        const loadedParcels =
          (parcelData ??
            []) as Parcel[];

        const loadedSimulations =
          (simulationData ??
            []) as Simulation[];

        setParcels(
          loadedParcels
        );

        setSimulations(
          loadedSimulations
        );

        if (
          loadedParcels.length >
          0
        ) {
          setSelectedParcelId(
            loadedParcels[0].id
          );
        }

        setLoading(false);
      };

    loadReports();
  }, []);

  /* =========================
     PARCELA
  ========================= */

  const selectedParcel =
    parcels.find(
      (parcel) =>
        parcel.id ===
        selectedParcelId
    ) ?? null;

  /* =========================
     SIMULACIONES DE PARCELA
  ========================= */

  const parcelSimulations =
    useMemo(() => {
      if (
        selectedParcelId ===
        null
      ) {
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
    parcelSimulations.length >
    0
      ? parcelSimulations[
          parcelSimulations.length -
            1
        ]
      : null;

  /* =========================
     PROMEDIOS
  ========================= */

  const averages =
    useMemo(() => {
      if (
        parcelSimulations.length ===
        0
      ) {
        return {
          yield: 0,
          profit: 0,
          production: 0,
          water: 0,
        };
      }

      const totalYield =
        parcelSimulations.reduce(
          (
            sum,
            simulation
          ) =>
            sum +
            Number(
              simulation.estimated_yield
            ),
          0
        );

      const totalProfit =
        parcelSimulations.reduce(
          (
            sum,
            simulation
          ) =>
            sum +
            Number(
              simulation.profit
            ),
          0
        );

      const totalProduction =
        parcelSimulations.reduce(
          (
            sum,
            simulation
          ) =>
            sum +
            Number(
              simulation.total_production
            ),
          0
        );

      const totalWater =
        parcelSimulations.reduce(
          (
            sum,
            simulation
          ) =>
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
          totalProduction /
          count,

        water:
          totalWater / count,
      };
    }, [parcelSimulations]);

  /* =========================
     GRÁFICAS
  ========================= */

  const chartData =
    parcelSimulations.map(
      (
        simulation,
        index
      ) => ({
        name: `S${index + 1}`,

        rendimiento:
          Number(
            simulation.estimated_yield
          ),

        utilidad:
          Number(
            simulation.profit
          ),

        agua:
          Number(
            simulation.water_use
          ) / 1000000,
      })
    );

  /* =========================
     EXCEL
  ========================= */

  const downloadExcel = () => {
    if (!selectedParcel) {
      alert(
        "Selecciona una parcela."
      );

      return;
    }

    if (
      parcelSimulations.length ===
      0
    ) {
      alert(
        "Esta parcela todavía no tiene simulaciones guardadas."
      );

      return;
    }

    const workbook =
      XLSX.utils.book_new();

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
            averages.yield.toFixed(
              2
            )
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
            averages.profit.toFixed(
              2
            )
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

    const simulationRows =
      parcelSimulations.map(
        (
          simulation,
          index
        ) => ({
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

    const safeName =
      selectedParcel.name.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );

    XLSX.writeFile(
      workbook,
      `AgriSim_${safeName}.xlsx`
    );
  };

  /* =========================
     LOADING
  ========================= */

  if (loading) {
    return (
      <div className="ag-report-loading">
        Cargando reportes...
      </div>
    );
  }

  return (
    <section className="ag-reports">
      {/* =====================
          HEADER
      ====================== */}

      <header className="ag-report-header">
        <div>
          <span className="ag-page-eyebrow">
            INTELIGENCIA DE CAMPO
          </span>

          <h1>
            Reportes
          </h1>

          <p>
            Convierte tus escenarios
            guardados en información
            productiva y financiera.
          </p>
        </div>

        <button
          className="ag-report-excel-button"
          onClick={
            downloadExcel
          }
        >
          <FileSpreadsheet
            size={18}
          />

          Descargar Excel
        </button>
      </header>

      {/* =====================
          TOOLBAR
      ====================== */}

      <section className="ag-report-toolbar">
        <div className="ag-report-parcel-selector">
          <div className="ag-report-selector-icon">
            <Layers3
              size={18}
            />
          </div>

          <div>
            <label>
              Parcela analizada
            </label>

            <select
              value={
                selectedParcelId ??
                ""
              }
              onChange={(
                event
              ) =>
                setSelectedParcelId(
                  Number(
                    event.target
                      .value
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
                    {
                      parcel.name
                    }
                    {" · "}
                    {
                      parcel.crop
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {selectedParcel && (
          <div className="ag-report-parcel-meta">
            <div>
              <span>
                Cultivo
              </span>

              <strong>
                {
                  selectedParcel.crop
                }
              </strong>
            </div>

            <div>
              <span>
                Superficie
              </span>

              <strong>
                {
                  selectedParcel.hectares
                }{" "}
                ha
              </strong>
            </div>

            <div>
              <span>
                Etapa
              </span>

              <strong>
                {
                  selectedParcel.stage
                }
              </strong>
            </div>
          </div>
        )}
      </section>

      {/* =====================
          EMPTY
      ====================== */}

      {parcelSimulations.length ===
      0 ? (
        <div className="ag-report-empty">
          <div>
            <BarChart3
              size={48}
            />
          </div>

          <h2>
            Sin información todavía
          </h2>

          <p>
            Guarda al menos una
            simulación para esta parcela
            y AgriSim comenzará a
            construir sus reportes.
          </p>
        </div>
      ) : (
        <>
          {/* =====================
              KPIs
          ====================== */}

          <div className="ag-report-kpis">
            <article className="ag-report-kpi">
              <div className="ag-report-kpi-icon">
                <Sprout
                  size={21}
                />
              </div>

              <span>
                Rendimiento promedio
              </span>

              <strong>
                {averages.yield.toFixed(
                  2
                )}
              </strong>

              <small>
                toneladas / ha
              </small>
            </article>

            <article className="ag-report-kpi">
              <div className="ag-report-kpi-icon">
                <TrendingUp
                  size={21}
                />
              </div>

              <span>
                Producción promedio
              </span>

              <strong>
                {averages.production.toFixed(
                  1
                )}
              </strong>

              <small>
                toneladas
              </small>
            </article>

            <article className="ag-report-kpi ag-report-kpi-profit">
              <div className="ag-report-kpi-icon">
                <Wallet
                  size={21}
                />
              </div>

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

              <small>
                MXN
              </small>
            </article>

            <article className="ag-report-kpi">
              <div className="ag-report-kpi-icon">
                <Droplets
                  size={21}
                />
              </div>

              <span>
                Agua promedio
              </span>

              <strong>
                {(
                  averages.water /
                  1000000
                ).toFixed(1)}
              </strong>

              <small>
                ML
              </small>
            </article>
          </div>

          {/* =====================
              CHARTS
          ====================== */}

          <div className="ag-report-chart-grid">
            <article className="ag-report-chart-card">
              <div className="ag-report-card-header">
                <div>
                  <span>
                    HISTÓRICO
                  </span>

                  <h2>
                    Rendimiento
                  </h2>

                  <p>
                    Evolución por
                    escenario guardado.
                  </p>
                </div>

                <Sprout
                  size={20}
                />
              </div>

              <div className="ag-report-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={
                      chartData
                    }
                    margin={{
                      top: 10,
                      right: 15,
                      left: -15,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#d9deca"
                      vertical={
                        false
                      }
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#7e8371"
                      tick={{
                        fontSize:
                          10,
                      }}
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                    />

                    <YAxis
                      stroke="#7e8371"
                      tick={{
                        fontSize:
                          10,
                      }}
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#122314",
                        border:
                          "1px solid #273f2b",
                        borderRadius:
                          "12px",
                        color:
                          "#ffffff",
                        fontSize:
                          "11px",
                      }}
                    />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="rendimiento"
                      name="Rendimiento t/ha"
                      stroke="#26a200"
                      strokeWidth={
                        3
                      }
                      dot={{
                        r: 4,
                        fill:
                          "#68ef3f",
                        stroke:
                          "#26a200",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="ag-report-chart-card">
              <div className="ag-report-card-header">
                <div>
                  <span>
                    FINANCIERO
                  </span>

                  <h2>
                    Utilidad
                  </h2>

                  <p>
                    Resultado financiero
                    de cada escenario.
                  </p>
                </div>

                <Wallet
                  size={20}
                />
              </div>

              <div className="ag-report-chart">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={
                      chartData
                    }
                    margin={{
                      top: 10,
                      right: 15,
                      left: -5,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#d9deca"
                      vertical={
                        false
                      }
                    />

                    <XAxis
                      dataKey="name"
                      stroke="#7e8371"
                      tick={{
                        fontSize:
                          10,
                      }}
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                    />

                    <YAxis
                      stroke="#7e8371"
                      tick={{
                        fontSize:
                          10,
                      }}
                      axisLine={
                        false
                      }
                      tickLine={
                        false
                      }
                    />

                    <Tooltip
                      contentStyle={{
                        background:
                          "#122314",
                        border:
                          "1px solid #273f2b",
                        borderRadius:
                          "12px",
                        color:
                          "#ffffff",
                        fontSize:
                          "11px",
                      }}
                    />

                    <Legend />

                    <Line
                      type="monotone"
                      dataKey="utilidad"
                      name="Utilidad MXN"
                      stroke="#26a200"
                      strokeWidth={
                        3
                      }
                      dot={{
                        r: 4,
                        fill:
                          "#68ef3f",
                        stroke:
                          "#26a200",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>
          </div>

          {/* =====================
              BOTTOM
          ====================== */}

          <div className="ag-report-bottom-grid">
            <article className="ag-report-latest-card">
              <div className="ag-report-card-header">
                <div>
                  <span>
                    ÚLTIMO ESCENARIO
                  </span>

                  <h2>
                    Resultado reciente
                  </h2>

                  <p>
                    Última simulación
                    guardada para esta
                    parcela.
                  </p>
                </div>

                <CalendarDays
                  size={20}
                />
              </div>

              {latestSimulation && (
                <div className="ag-report-latest-data">
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
                    </strong>

                    <small>
                      t/ha
                    </small>
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

                    <small>
                      MXN
                    </small>
                  </div>

                  <div>
                    <span>
                      Riego
                    </span>

                    <strong>
                      {
                        latestSimulation.irrigation
                      }
                    </strong>

                    <small>
                      mm/día
                    </small>
                  </div>

                  <div>
                    <span>
                      Riesgo
                    </span>

                    <strong
                      className={`ag-report-risk ${
                        latestSimulation.risk.toLowerCase()
                      }`}
                    >
                      {
                        latestSimulation.risk
                      }
                    </strong>
                  </div>
                </div>
              )}
            </article>

            <article className="ag-report-summary-card">
              <div className="ag-report-card-header">
                <div>
                  <span>
                    BASE HISTÓRICA
                  </span>

                  <h2>
                    Simulaciones
                  </h2>
                </div>

                <History
                  size={20}
                />
              </div>

              <div className="ag-report-history-number">
                <strong>
                  {
                    parcelSimulations.length
                  }
                </strong>

                <span>
                  escenarios guardados
                </span>
              </div>

              <div className="ag-report-history-footer">
                <span>
                  Cada escenario alimenta
                  el análisis histórico de
                  esta parcela.
                </span>
              </div>
            </article>
          </div>

          <div className="ag-report-model-note">
            Los indicadores provienen de
            las simulaciones experimentales
            actualmente guardadas en
            AgriSim.
          </div>
        </>
      )}
    </section>
  );
}

export default Reports;