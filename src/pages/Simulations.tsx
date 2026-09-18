import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
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
} from "lucide-react";

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
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcelId, setSelectedParcelId] =
    useState<number | null>(null);

  const [pricePerTon, setPricePerTon] = useState(5400);
  const [irrigation, setIrrigation] = useState(4.5);
  const [fertilizer, setFertilizer] = useState(120);
  const [moisture, setMoisture] = useState(68);

  const [result, setResult] =
    useState<SimulationResult | null>(null);

  const [savedSimulations, setSavedSimulations] =
    useState<SavedSimulation[]>([]);

  const [savingSimulation, setSavingSimulation] =
    useState(false);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const selectedParcel =
    parcels.find(
      (parcel) => parcel.id === selectedParcelId
    ) ?? null;

  useEffect(() => {
    const loadParcels = async () => {
      const { data, error } = await supabase
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

      if (loadedParcels.length > 0) {
        const firstParcel =
          loadedParcels[0];

        setSelectedParcelId(
          firstParcel.id
        );

        if (
          firstParcel.irrigation !== null
        ) {
          setIrrigation(
            firstParcel.irrigation
          );
        }

        if (
          firstParcel.fertilizer !== null
        ) {
          setFertilizer(
            firstParcel.fertilizer
          );
        }

        if (
          firstParcel.moisture !== null
        ) {
          setMoisture(
            firstParcel.moisture
          );
        }
      }
    };

    loadParcels();
  }, []);

  useEffect(() => {
    if (selectedParcelId === null) {
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

  const handleParcelChange = (
    parcelId: number
  ) => {
    setLoadingHistory(true);
    setSavedSimulations([]);

    setSelectedParcelId(parcelId);

    const parcel = parcels.find(
      (item) => item.id === parcelId
    );

    if (!parcel) {
      return;
    }

    if (parcel.irrigation !== null) {
      setIrrigation(
        parcel.irrigation
      );
    }

    if (parcel.fertilizer !== null) {
      setFertilizer(
        parcel.fertilizer
      );
    }

    if (parcel.moisture !== null) {
      setMoisture(
        parcel.moisture
      );
    }

    setResult(null);
  };

  const runSimulation = () => {
    if (!selectedParcel) {
      alert(
        "Selecciona una parcela."
      );
      return;
    }

    /*
      MOTOR V1 PROVISIONAL

      Estas relaciones todavía no son
      un modelo agronómico validado.

      Nos sirven para construir la
      arquitectura funcional de AgriSim.
    */

    const baseYield =
      selectedParcel.crop === "Maíz"
        ? 8
        : selectedParcel.crop === "Trigo"
        ? 5.5
        : 6;

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
      revenue -
      totalCost;

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

  const saveSimulation = async () => {
    if (
      !selectedParcel ||
      !result
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
            selectedParcel.id,

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

    const newSimulation =
      data as SavedSimulation;

    setSavedSimulations(
      (current) => [
        newSimulation,
        ...current,
      ]
    );

    setSavingSimulation(false);
  };

  const deleteSimulation = async (
    simulationId: number
  ) => {
    const confirmed =
      window.confirm(
        "¿Eliminar esta simulación del historial?"
      );

    if (!confirmed) {
      return;
    }

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

      alert(
        "No se pudo eliminar la simulación."
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

  const loadSavedSimulation = (
    simulation: SavedSimulation
  ) => {
    setIrrigation(
      simulation.irrigation
    );

    setFertilizer(
      simulation.fertilizer
    );

    setMoisture(
      simulation.moisture
    );

    setPricePerTon(
      simulation.price_per_ton
    );

    setResult({
      estimatedYield:
        simulation.estimated_yield,

      totalProduction:
        simulation.total_production,

      waterUse:
        simulation.water_use,

      totalCost:
        simulation.total_cost,

      revenue:
        simulation.revenue,

      profit:
        simulation.profit,

      risk:
        simulation.risk,
    });
  };

  return (
    <section>
      <div className="dashboard-header">
        <div>
          <h1>
            Simulaciones
          </h1>

          <p>
            Modifica variables,
            evalúa escenarios y
            guarda resultados para
            compararlos posteriormente.
          </p>
        </div>
      </div>

      <div className="simulation-layout">
        <div className="simulation-controls">
          <div className="simulation-card">
            <div className="simulation-card-title">
              <Calculator size={20} />

              <h2>
                Escenario
              </h2>
            </div>

            <div className="form-group">
              <label>
                Parcela
              </label>

              <select
                value={
                  selectedParcelId ??
                  ""
                }
                onChange={(
                  event
                ) =>
                  handleParcelChange(
                    Number(
                      event.target.value
                    )
                  )
                }
              >
                {parcels.length ===
                  0 && (
                  <option value="">
                    No hay parcelas
                    disponibles
                  </option>
                )}

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

            <div className="simulation-field">
              <div className="simulation-label-row">
                <label>
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
                value={
                  irrigation
                }
                onChange={(
                  event
                ) =>
                  setIrrigation(
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </div>

            <div className="simulation-field">
              <div className="simulation-label-row">
                <label>
                  Fertilizante
                </label>

                <strong>
                  {fertilizer}{" "}
                  kg/ha
                </strong>
              </div>

              <input
                type="range"
                min="0"
                max="250"
                step="5"
                value={
                  fertilizer
                }
                onChange={(
                  event
                ) =>
                  setFertilizer(
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </div>

            <div className="simulation-field">
              <div className="simulation-label-row">
                <label>
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
                value={
                  moisture
                }
                onChange={(
                  event
                ) =>
                  setMoisture(
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </div>

            <div className="form-group">
              <label>
                Precio esperado
                ($/ton)
              </label>

              <input
                type="number"
                min="0"
                value={
                  pricePerTon
                }
                onChange={(
                  event
                ) =>
                  setPricePerTon(
                    Number(
                      event.target.value
                    )
                  )
                }
              />
            </div>

            <button
              className="primary-button simulate-button"
              onClick={
                runSimulation
              }
              disabled={
                !selectedParcel
              }
            >
              <Calculator
                size={18}
              />

              Ejecutar simulación
            </button>
          </div>
        </div>

        <div className="simulation-results">
          {!result ? (
            <div className="simulation-empty">
              <Sprout
                size={56}
              />

              <h2>
                Configura un escenario
              </h2>

              <p>
                Modifica las variables
                de la izquierda y
                ejecuta una simulación
                para obtener resultados.
              </p>
            </div>
          ) : (
            <>
              <div className="simulation-result-grid">
                <div className="result-card">
                  <Sprout
                    size={22}
                  />

                  <span>
                    Rendimiento estimado
                  </span>

                  <strong>
                    {result.estimatedYield.toFixed(
                      2
                    )}{" "}
                    t/ha
                  </strong>
                </div>

                <div className="result-card">
                  <TrendingUp
                    size={22}
                  />

                  <span>
                    Producción total
                  </span>

                  <strong>
                    {result.totalProduction.toFixed(
                      1
                    )}{" "}
                    t
                  </strong>
                </div>

                <div className="result-card">
                  <Droplets
                    size={22}
                  />

                  <span>
                    Consumo de agua
                  </span>

                  <strong>
                    {(
                      result.waterUse /
                      1000000
                    ).toFixed(
                      1
                    )}{" "}
                    ML
                  </strong>
                </div>

                <div className="result-card">
                  <Wallet
                    size={22}
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
                </div>

                <div className="result-card">
                  <TrendingUp
                    size={22}
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
                </div>

                <div className="result-card profit-card">
                  <Wallet
                    size={22}
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
                </div>
              </div>

              <div className="risk-panel">
                <div>
                  <TriangleAlert
                    size={20}
                  />

                  <span>
                    Riesgo del escenario
                  </span>
                </div>

                <strong
                  className={
                    result.risk ===
                    "Bajo"
                      ? "risk-low"
                      : result.risk ===
                        "Moderado"
                      ? "risk-medium"
                      : "risk-high"
                  }
                >
                  {result.risk}
                </strong>
              </div>

              <button
                className="primary-button save-simulation-button"
                onClick={
                  saveSimulation
                }
                disabled={
                  savingSimulation
                }
              >
                <Save
                  size={18}
                />

                {savingSimulation
                  ? "Guardando..."
                  : "Guardar escenario"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="simulation-history-section">
        <div className="simulation-history-header">
          <div>
            <History
              size={20}
            />

            <div>
              <h2>
                Historial de escenarios
              </h2>

              <p>
                Simulaciones guardadas
                para la parcela
                seleccionada.
              </p>
            </div>
          </div>

          <span className="history-count">
            {
              savedSimulations.length
            }{" "}
            guardadas
          </span>
        </div>

        {loadingHistory ? (
          <div className="history-empty">
            Cargando historial...
          </div>
        ) : savedSimulations.length ===
          0 ? (
          <div className="history-empty">
            Todavía no has guardado
            simulaciones para esta
            parcela.
          </div>
        ) : (
          <div className="simulation-history-grid">
            {savedSimulations.map(
              (simulation) => (
                <article
                  className="simulation-history-card"
                  key={
                    simulation.id
                  }
                >
                  <div className="history-card-top">
                    <div>
                      <span className="history-date">
                        {new Date(
                          simulation.created_at
                        ).toLocaleString(
                          "es-MX"
                        )}
                      </span>

                      <strong>
                        {simulation.estimated_yield.toFixed(
                          2
                        )}{" "}
                        t/ha
                      </strong>
                    </div>

                    <span
                      className={`history-risk ${
                        simulation.risk ===
                        "Bajo"
                          ? "low"
                          : simulation.risk ===
                            "Moderado"
                          ? "medium"
                          : "high"
                      }`}
                    >
                      {
                        simulation.risk
                      }
                    </span>
                  </div>

                  <div className="history-metrics">
                    <div>
                      <span>
                        Riego
                      </span>

                      <strong>
                        {
                          simulation.irrigation
                        }{" "}
                        mm/día
                      </strong>
                    </div>

                    <div>
                      <span>
                        Fertilizante
                      </span>

                      <strong>
                        {
                          simulation.fertilizer
                        }{" "}
                        kg/ha
                      </strong>
                    </div>

                    <div>
                      <span>
                        Utilidad
                      </span>

                      <strong>
                        $
                        {simulation.profit.toLocaleString(
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
                        Producción
                      </span>

                      <strong>
                        {simulation.total_production.toFixed(
                          1
                        )}{" "}
                        t
                      </strong>
                    </div>
                  </div>

                  <div className="history-actions">
                    <button
                      className="history-load-button"
                      onClick={() =>
                        loadSavedSimulation(
                          simulation
                        )
                      }
                    >
                      Cargar escenario
                    </button>

                    <button
                      className="history-delete-button"
                      onClick={() =>
                        deleteSimulation(
                          simulation.id
                        )
                      }
                      aria-label="Eliminar simulación"
                    >
                      <Trash2
                        size={17}
                      />
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Simulations;