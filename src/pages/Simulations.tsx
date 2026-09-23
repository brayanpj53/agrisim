import {
  useEffect,
  useState,
} from "react";

import {
  Calculator,
  Droplets,
  Sprout,
  TrendingUp,
  Wallet,
  TriangleAlert,
  Save,
  Trash2,
  History,
  FlaskConical,
  Gauge,
  Coins,
  RotateCcw,
  Play,
  PackageOpen,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Parcel = {
  id: number;
  name: string;
  crop: string;
  hectares: number;
  irrigation: number | null;
  moisture: number | null;
  fertilizer: number | null;
};

type SimulationResult = {
  estimatedYield: number;
  totalProduction: number;
  waterUse: number;
  totalCost: number;
  revenue: number;
  profit: number;
  risk: string;
};

type SavedSimulation = {
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

function Simulations() {
  const [parcels, setParcels] =
    useState<Parcel[]>([]);

  const [
    selectedParcelId,
    setSelectedParcelId,
  ] = useState<number | null>(null);

  const [
    pricePerTon,
    setPricePerTon,
  ] = useState(5400);

  const [
    irrigation,
    setIrrigation,
  ] = useState(4.5);

  const [
    fertilizer,
    setFertilizer,
  ] = useState(120);

  const [
    moisture,
    setMoisture,
  ] = useState(68);

  const [result, setResult] =
    useState<SimulationResult | null>(
      null
    );

  const [
    savedSimulations,
    setSavedSimulations,
  ] = useState<SavedSimulation[]>([]);

  const [
    savingSimulation,
    setSavingSimulation,
  ] = useState(false);

  const [
    loadingHistory,
    setLoadingHistory,
  ] = useState(false);

  const selectedParcel =
    parcels.find(
      (parcel) =>
        parcel.id === selectedParcelId
    ) ?? null;

  /* =========================
     CARGAR PARCELAS
  ========================= */

  useEffect(() => {
    const loadParcels = async () => {
      const { data, error } =
        await supabase
          .from("parcels")
          .select(
            "id, name, crop, hectares, irrigation, moisture, fertilizer"
          )
          .order("created_at", {
            ascending: true,
          });

      if (error) {
        console.error(
          "Error cargando parcelas:",
          error
        );

        return;
      }

      const loadedParcels =
        (data ?? []) as Parcel[];

      setParcels(loadedParcels);

      if (
        loadedParcels.length > 0
      ) {
        const firstParcel =
          loadedParcels[0];

        setSelectedParcelId(
          firstParcel.id
        );

        setIrrigation(
          firstParcel.irrigation ??
            4.5
        );

        setFertilizer(
          firstParcel.fertilizer ??
            120
        );

        setMoisture(
          firstParcel.moisture ??
            68
        );
      }
    };

    loadParcels();
  }, []);

  /* =========================
     HISTORIAL
  ========================= */

  useEffect(() => {
    if (
      selectedParcelId === null
    ) {
      return;
    }

    const loadHistory = async () => {
      setLoadingHistory(true);

      const { data, error } =
        await supabase
          .from("simulations")
          .select("*")
          .eq(
            "parcel_id",
            selectedParcelId
          )
          .order("created_at", {
            ascending: false,
          });

      if (error) {
        console.error(
          "Error cargando historial:",
          error
        );

        setLoadingHistory(false);
        return;
      }

      setSavedSimulations(
        (data ?? []) as SavedSimulation[]
      );

      setLoadingHistory(false);
    };

    loadHistory();
  }, [selectedParcelId]);

  /* =========================
     CAMBIO DE PARCELA
  ========================= */

  const handleParcelChange = (
    parcelId: number
  ) => {
    setSelectedParcelId(parcelId);

    const parcel =
      parcels.find(
        (item) =>
          item.id === parcelId
      );

    if (parcel) {
      setIrrigation(
        parcel.irrigation ?? 4.5
      );

      setFertilizer(
        parcel.fertilizer ?? 120
      );

      setMoisture(
        parcel.moisture ?? 68
      );
    }

    setResult(null);
    setSavedSimulations([]);
  };

  /* =========================
     SIMULACIÓN
  ========================= */

  const runSimulation = () => {
    if (!selectedParcel) {
      return;
    }

    let baseYield = 6;

    if (
      selectedParcel.crop === "Maíz"
    ) {
      baseYield = 8;
    }

    if (
      selectedParcel.crop === "Trigo"
    ) {
      baseYield = 5.5;
    }

    const irrigationFactor =
      Math.min(
        irrigation / 4.5,
        1.15
      );

    const fertilizerFactor =
      Math.min(
        fertilizer / 120,
        1.12
      );

    let moistureFactor = 1;

    if (moisture < 45) {
      moistureFactor = 0.72;
    } else if (moisture < 55) {
      moistureFactor = 0.86;
    } else if (moisture > 85) {
      moistureFactor = 0.9;
    }

    const estimatedYield =
      baseYield *
      irrigationFactor *
      fertilizerFactor *
      moistureFactor;

    const totalProduction =
      estimatedYield *
      selectedParcel.hectares;

    const waterUse =
      irrigation *
      selectedParcel.hectares *
      10000 *
      120;

    const seedCost =
      selectedParcel.hectares *
      3200;

    const fertilizerCost =
      fertilizer *
      selectedParcel.hectares *
      18;

    const irrigationCost =
      irrigation *
      selectedParcel.hectares *
      1200;

    const fixedCost =
      selectedParcel.hectares *
      8500;

    const totalCost =
      seedCost +
      fertilizerCost +
      irrigationCost +
      fixedCost;

    const revenue =
      totalProduction *
      pricePerTon;

    const profit =
      revenue - totalCost;

    let risk = "Bajo";

    if (
      moisture < 55 ||
      irrigation < 3.5
    ) {
      risk = "Moderado";
    }

    if (
      moisture < 40 ||
      irrigation < 2.5
    ) {
      risk = "Alto";
    }

    setResult({
      estimatedYield,
      totalProduction,
      waterUse,
      totalCost,
      revenue,
      profit,
      risk,
    });
  };

  /* =========================
     GUARDAR
  ========================= */

  const saveSimulation =
    async () => {
      if (
        !result ||
        !selectedParcelId
      ) {
        return;
      }

      setSavingSimulation(true);

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        console.error(
          "Error obteniendo usuario:",
          userError
        );

        alert(
          "No hay un usuario autenticado."
        );

        setSavingSimulation(false);
        return;
      }

      const { data, error } =
        await supabase
          .from("simulations")
          .insert({
            user_id: user.id,
            parcel_id:
              selectedParcelId,

            irrigation,
            fertilizer,
            moisture,
            price_per_ton:
              pricePerTon,

            estimated_yield:
              result.estimatedYield,

            total_production:
              result.totalProduction,

            water_use:
              result.waterUse,

            total_cost:
              result.totalCost,

            revenue:
              result.revenue,

            profit:
              result.profit,

            risk:
              result.risk,
          })
          .select()
          .single();

      if (error) {
        console.error(
          "Error guardando simulación:",
          error
        );

        alert(
          "No se pudo guardar la simulación."
        );

        setSavingSimulation(false);
        return;
      }

      setSavedSimulations(
        (current) => [
          data as SavedSimulation,
          ...current,
        ]
      );

      setSavingSimulation(false);
    };

  /* =========================
     ELIMINAR
  ========================= */

  const deleteSimulation =
    async (
      simulationId: number
    ) => {
      const { error } =
        await supabase
          .from("simulations")
          .delete()
          .eq(
            "id",
            simulationId
          );

      if (error) {
        console.error(
          "Error eliminando simulación:",
          error
        );

        return;
      }

      setSavedSimulations(
        (current) =>
          current.filter(
            (simulation) =>
              simulation.id !==
              simulationId
          )
      );
    };

  /* =========================
     CARGAR ESCENARIO
  ========================= */

  const loadSavedSimulation = (
    simulation: SavedSimulation
  ) => {
    setIrrigation(
      Number(
        simulation.irrigation
      )
    );

    setFertilizer(
      Number(
        simulation.fertilizer
      )
    );

    setMoisture(
      Number(
        simulation.moisture
      )
    );

    setPricePerTon(
      Number(
        simulation.price_per_ton
      )
    );

    setResult({
      estimatedYield:
        Number(
          simulation.estimated_yield
        ),

      totalProduction:
        Number(
          simulation.total_production
        ),

      waterUse:
        Number(
          simulation.water_use
        ),

      totalCost:
        Number(
          simulation.total_cost
        ),

      revenue:
        Number(
          simulation.revenue
        ),

      profit:
        Number(
          simulation.profit
        ),

      risk:
        simulation.risk,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetScenario = () => {
    if (!selectedParcel) {
      return;
    }

    setIrrigation(
      selectedParcel.irrigation ??
        4.5
    );

    setFertilizer(
      selectedParcel.fertilizer ??
        120
    );

    setMoisture(
      selectedParcel.moisture ??
        68
    );

    setPricePerTon(5400);

    setResult(null);
  };

  /* =========================
     SIN PARCELAS
  ========================= */

  if (
    parcels.length === 0
  ) {
    return (
      <section className="ag-simulations">
        <div className="ag-simulation-empty-page">
          <div>
            <Sprout size={48} />
          </div>

          <h2>
            Primero necesitas una parcela
          </h2>

          <p>
            Registra un predio antes de
            ejecutar escenarios en
            AgriSim.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="ag-simulations">
      <header className="ag-sim-header">
        <div>
          <span className="ag-page-eyebrow">
            MOTOR DE ESCENARIOS
          </span>

          <h1>
            Simulaciones
          </h1>

          <p>
            Modifica las condiciones del
            cultivo y analiza su posible
            impacto productivo y
            financiero.
          </p>
        </div>

        <div className="ag-sim-header-actions">
          <button
            className="ag-btn ag-btn-secondary"
            onClick={resetScenario}
          >
            <RotateCcw size={16} />
            Restablecer
          </button>
        </div>
      </header>

      <div className="ag-sim-main-grid">
        {/* =====================
            CONFIGURACIÓN
        ====================== */}

        <aside className="ag-sim-config-card">
          <div className="ag-sim-card-header">
            <div className="ag-sim-header-icon">
              <Calculator
                size={20}
              />
            </div>

            <div>
              <span>
                ESCENARIO
              </span>

              <h2>
                Configura variables
              </h2>
            </div>
          </div>

          <div className="ag-sim-config-body">
            <div className="ag-sim-field">
              <label>
                Parcela
              </label>

              <select
                value={
                  selectedParcelId ??
                  ""
                }
                onChange={(event) =>
                  handleParcelChange(
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

              {selectedParcel && (
                <div className="ag-sim-parcel-meta">
                  <span>
                    {
                      selectedParcel.crop
                    }
                  </span>

                  <span>
                    {
                      selectedParcel.hectares
                    }{" "}
                    ha
                  </span>
                </div>
              )}
            </div>

            <div className="ag-sim-field">
              <div className="ag-sim-label-row">
                <label>
                  <Droplets
                    size={15}
                  />
                  Riego
                </label>

                <strong>
                  {irrigation.toFixed(
                    1
                  )}{" "}
                  mm/día
                </strong>
              </div>

              <input
                type="range"
                min="0"
                max="8"
                step="0.1"
                value={irrigation}
                onChange={(event) =>
                  setIrrigation(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              />

              <div className="ag-range-scale">
                <span>0</span>
                <span>8</span>
              </div>
            </div>

            <div className="ag-sim-field">
              <div className="ag-sim-label-row">
                <label>
                  <FlaskConical
                    size={15}
                  />
                  Fertilizante
                </label>

                <strong>
                  {fertilizer} kg/ha
                </strong>
              </div>

              <input
                type="range"
                min="0"
                max="220"
                step="5"
                value={fertilizer}
                onChange={(event) =>
                  setFertilizer(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              />

              <div className="ag-range-scale">
                <span>0</span>
                <span>
                  220
                </span>
              </div>
            </div>

            <div className="ag-sim-field">
              <div className="ag-sim-label-row">
                <label>
                  <Gauge
                    size={15}
                  />
                  Humedad del suelo
                </label>

                <strong>
                  {moisture}%
                </strong>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={moisture}
                onChange={(event) =>
                  setMoisture(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              />

              <div className="ag-range-scale">
                <span>0%</span>
                <span>
                  100%
                </span>
              </div>
            </div>

            <div className="ag-sim-field">
              <div className="ag-sim-label-row">
                <label>
                  <Coins
                    size={15}
                  />
                  Precio esperado
                </label>

                <strong>
                  $
                  {pricePerTon.toLocaleString(
                    "es-MX"
                  )}
                  /t
                </strong>
              </div>

              <input
                type="range"
                min="2500"
                max="9000"
                step="100"
                value={
                  pricePerTon
                }
                onChange={(event) =>
                  setPricePerTon(
                    Number(
                      event.target
                        .value
                    )
                  )
                }
              />

              <div className="ag-range-scale">
                <span>
                  $2,500
                </span>

                <span>
                  $9,000
                </span>
              </div>
            </div>

            <button
              className="ag-sim-run-button"
              onClick={
                runSimulation
              }
            >
              <Play
                size={17}
                fill="currentColor"
              />

              Ejecutar simulación
            </button>
          </div>
        </aside>

        {/* =====================
            RESULTADOS
        ====================== */}

        <div className="ag-sim-results-area">
          {!result ? (
            <div className="ag-sim-empty-results">
              <div>
                <Calculator
                  size={46}
                />
              </div>

              <h2>
                Ejecuta un escenario
              </h2>

              <p>
                Ajusta las variables de
                la izquierda y ejecuta
                una simulación para ver
                los resultados.
              </p>
            </div>
          ) : (
            <>
              <section className="ag-sim-results-card">
                <div className="ag-sim-results-header">
                  <div>
                    <span>
                      RESULTADOS
                    </span>

                    <h2>
                      Impacto estimado
                    </h2>
                  </div>

                  <button
                    className="ag-btn ag-btn-primary"
                    onClick={
                      saveSimulation
                    }
                    disabled={
                      savingSimulation
                    }
                  >
                    <Save
                      size={16}
                    />

                    {savingSimulation
                      ? "Guardando..."
                      : "Guardar escenario"}
                  </button>
                </div>

                <div className="ag-sim-result-grid">
                  <article className="ag-sim-result-card yield">
                    <Sprout
                      size={21}
                    />

                    <span>
                      Rendimiento estimado
                    </span>

                    <strong>
                      {result.estimatedYield.toFixed(
                        2
                      )}
                    </strong>

                    <small>
                      t/ha
                    </small>
                  </article>

                  <article className="ag-sim-result-card production">
                    <PackageOpen
                      size={21}
                    />

                    <span>
                      Producción total
                    </span>

                    <strong>
                      {result.totalProduction.toFixed(
                        1
                      )}
                    </strong>

                    <small>
                      toneladas
                    </small>
                  </article>

                  <article className="ag-sim-result-card water">
                    <Droplets
                      size={21}
                    />

                    <span>
                      Consumo de agua
                    </span>

                    <strong>
                      {(
                        result.waterUse /
                        1000000
                      ).toFixed(1)}
                    </strong>

                    <small>
                      ML
                    </small>
                  </article>

                  <article className="ag-sim-result-card cost">
                    <Wallet
                      size={21}
                    />

                    <span>
                      Costo estimado
                    </span>

                    <strong>
                      $
                      {result.totalCost.toLocaleString(
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

                  <article className="ag-sim-result-card revenue">
                    <TrendingUp
                      size={21}
                    />

                    <span>
                      Ingreso estimado
                    </span>

                    <strong>
                      $
                      {result.revenue.toLocaleString(
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

                  <article className="ag-sim-result-card profit">
                    <Coins
                      size={21}
                    />

                    <span>
                      Utilidad estimada
                    </span>

                    <strong>
                      $
                      {result.profit.toLocaleString(
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
                </div>
              </section>

              {/* RIESGO */}

              <section className="ag-sim-risk-card">
                <div className="ag-sim-risk-info">
                  <div className="ag-sim-risk-icon">
                    <TriangleAlert
                      size={20}
                    />
                  </div>

                  <div>
                    <span>
                      EVALUACIÓN
                    </span>

                    <h3>
                      Riesgo del escenario
                    </h3>

                    <p>
                      Basado en riego y
                      humedad del suelo.
                    </p>
                  </div>
                </div>

                <div className="ag-sim-risk-visual">
                  <div className="ag-risk-scale">
                    <div className="ag-risk-low" />

                    <div className="ag-risk-medium" />

                    <div className="ag-risk-high" />
                  </div>

                  <div
                    className={`ag-risk-badge ${result.risk.toLowerCase()}`}
                  >
                    {result.risk}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* =====================
          HISTORIAL
      ====================== */}

      <section className="ag-sim-history">
        <div className="ag-sim-history-header">
          <div className="ag-sim-history-title">
            <div>
              <History
                size={20}
              />
            </div>

            <div>
              <span>
                HISTORIAL
              </span>

              <h2>
                Escenarios guardados
              </h2>
            </div>
          </div>

          <span className="ag-sim-history-count">
            {
              savedSimulations.length
            }{" "}
            simulaciones
          </span>
        </div>

        {loadingHistory ? (
          <div className="ag-sim-history-empty">
            Cargando historial...
          </div>
        ) : savedSimulations.length ===
          0 ? (
          <div className="ag-sim-history-empty">
            <History
              size={32}
            />

            <p>
              Todavía no has guardado
              escenarios para esta
              parcela.
            </p>
          </div>
        ) : (
          <div className="ag-sim-history-grid">
            {savedSimulations.map(
              (
                simulation,
                index
              ) => (
                <article
                  className="ag-sim-history-card"
                  key={
                    simulation.id
                  }
                >
                  <div className="ag-sim-history-card-top">
                    <div>
                      <span>
                        ESCENARIO
                      </span>

                      <strong>
                        #
                        {
                          savedSimulations.length -
                          index
                        }
                      </strong>
                    </div>

                    <button
                      type="button"
                      className="ag-sim-delete"
                      onClick={() =>
                        deleteSimulation(
                          simulation.id
                        )
                      }
                      title="Eliminar simulación"
                    >
                      <Trash2
                        size={15}
                      />
                    </button>
                  </div>

                  <small>
                    {new Date(
                      simulation.created_at
                    ).toLocaleString(
                      "es-MX",
                      {
                        dateStyle:
                          "medium",
                        timeStyle:
                          "short",
                      }
                    )}
                  </small>

                  <div className="ag-sim-history-stats">
                    <div>
                      <span>
                        Rendimiento
                      </span>

                      <strong>
                        {Number(
                          simulation.estimated_yield
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
                          simulation.profit
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
                        Riesgo
                      </span>

                      <strong>
                        {
                          simulation.risk
                        }
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="ag-sim-load-button"
                    onClick={() =>
                      loadSavedSimulation(
                        simulation
                      )
                    }
                  >
                    Cargar escenario

                    <TrendingUp
                      size={14}
                    />
                  </button>
                </article>
              )
            )}
          </div>
        )}
      </section>

      <div className="ag-sim-model-note">
        <TriangleAlert
          size={16}
        />

        <span>
          Modelo experimental de
          AgriSim v0.1. Los resultados
          son demostrativos y todavía
          no representan una
          recomendación agronómica
          validada.
        </span>
      </div>
    </section>
  );
}

export default Simulations;