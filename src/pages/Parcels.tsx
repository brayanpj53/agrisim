import { useEffect, useState } from "react";

import {
  Layers,
  Droplets,
  Sprout,
  FlaskConical,
  Map,
  Activity,
  TriangleAlert,
  Wheat,
  X,
  Plus,
  ArrowRight,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Layer = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  icon: React.ReactNode;
};

type Parcel = {
  id: number;
  user_id: string;
  name: string;
  crop: string;
  hectares: number;
  stage: string;
  irrigation: number | null;
  moisture: number | null;
  fertilizer: number | null;
  status: string;
  created_at?: string;
};

function Parcels() {
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: "crop",
      name: "Cultivo",
      description: "Cobertura y estado del cultivo",
      active: true,
      icon: <Wheat size={18} />,
    },
    {
      id: "soil",
      name: "Suelo",
      description: "Tipo y características del suelo",
      active: true,
      icon: <Map size={18} />,
    },
    {
      id: "moisture",
      name: "Humedad",
      description: "Humedad estimada del suelo",
      active: true,
      icon: <Droplets size={18} />,
    },
    {
      id: "irrigation",
      name: "Riego",
      description: "Cobertura del sistema de riego",
      active: true,
      icon: <Droplets size={18} />,
    },
    {
      id: "fertilization",
      name: "Fertilización",
      description: "Aplicaciones de nutrientes",
      active: false,
      icon: <FlaskConical size={18} />,
    },
    {
      id: "ndvi",
      name: "NDVI",
      description: "Índice de vigor vegetal",
      active: false,
      icon: <Activity size={18} />,
    },
    {
      id: "risk",
      name: "Riesgo",
      description: "Zonas de atención agronómica",
      active: false,
      icon: <TriangleAlert size={18} />,
    },
  ]);

  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [selectedParcelId, setSelectedParcelId] =
    useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [loadingParcels, setLoadingParcels] =
    useState(true);
  const [savingParcel, setSavingParcel] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    crop: "Maíz",
    hectares: "",
    stage: "Vegetativo",
    irrigation: "",
    moisture: "",
    fertilizer: "",
  });

  const selectedParcel =
    parcels.find(
      (parcel) =>
        parcel.id === selectedParcelId
    ) ?? null;

  useEffect(() => {
    const loadParcels = async () => {
      setLoadingParcels(true);

      const { data, error } =
        await supabase
          .from("parcels")
          .select("*")
          .order("created_at", {
            ascending: true,
          });

      if (error) {
        console.error(
          "Error cargando parcelas:",
          error
        );

        setLoadingParcels(false);
        return;
      }

      const loadedParcels =
        (data ?? []) as Parcel[];

      setParcels(loadedParcels);

      if (loadedParcels.length > 0) {
        setSelectedParcelId(
          loadedParcels[0].id
        );
      }

      setLoadingParcels(false);
    };

    loadParcels();
  }, []);

  const toggleLayer = (id: string) => {
    setLayers((currentLayers) =>
      currentLayers.map((layer) =>
        layer.id === id
          ? {
              ...layer,
              active: !layer.active,
            }
          : layer
      )
    );
  };

  const handleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    const { name, value } =
      event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      crop: "Maíz",
      hectares: "",
      stage: "Vegetativo",
      irrigation: "",
      moisture: "",
      fertilizer: "",
    });
  };

  const closeModal = () => {
    if (savingParcel) {
      return;
    }

    setShowModal(false);
    resetForm();
  };

  const createParcel = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setSavingParcel(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "Error obteniendo usuario:",
        userError
      );

      alert(
        "No hay un usuario autenticado."
      );

      setSavingParcel(false);
      return;
    }

    const moisture =
      Number(formData.moisture);

    const parcelStatus =
      moisture >= 55
        ? "Óptimo"
        : "Atención";

    const { data, error } =
      await supabase
        .from("parcels")
        .insert({
          user_id: user.id,
          name: formData.name,
          crop: formData.crop,
          hectares:
            Number(formData.hectares),
          stage: formData.stage,
          irrigation:
            formData.irrigation === ""
              ? null
              : Number(
                  formData.irrigation
                ),
          moisture:
            formData.moisture === ""
              ? null
              : moisture,
          fertilizer:
            formData.fertilizer === ""
              ? null
              : Number(
                  formData.fertilizer
                ),
          status: parcelStatus,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Error creando parcela:",
        error
      );

      alert(
        "No se pudo guardar la parcela."
      );

      setSavingParcel(false);
      return;
    }

    const newParcel =
      data as Parcel;

    setParcels(
      (currentParcels) => [
        ...currentParcels,
        newParcel,
      ]
    );

    setSelectedParcelId(
      newParcel.id
    );

    resetForm();
    setShowModal(false);
    setSavingParcel(false);
  };

  return (
    <section className="ag-parcels">
      <div className="ag-parcels-header">
        <div>
          <span className="ag-page-eyebrow">
            GESTIÓN DEL CAMPO
          </span>

          <h1>Parcelas</h1>

          <p>
            Visualiza tus predios,
            consulta sus condiciones y
            controla las capas de
            información.
          </p>
        </div>

        <button
          className="ag-btn ag-btn-primary"
          onClick={() =>
            setShowModal(true)
          }
        >
          <Plus size={18} />
          Nueva parcela
        </button>
      </div>

      <div className="ag-parcel-layout">
        <aside className="ag-parcel-list-panel">
          <div className="ag-parcel-panel-header">
            <div>
              <span>
                PREDIOS
              </span>

              <h2>
                Mis parcelas
              </h2>
            </div>

            <span className="ag-parcel-count">
              {parcels.length}
            </span>
          </div>

          <div className="ag-parcel-list">
            {loadingParcels && (
              <div className="ag-parcel-empty-small">
                Cargando parcelas...
              </div>
            )}

            {!loadingParcels &&
              parcels.length === 0 && (
                <div className="ag-parcel-empty-small">
                  No tienes parcelas
                  todavía.
                </div>
              )}

            {parcels.map(
              (parcel) => (
                <button
                  key={parcel.id}
                  className={`ag-parcel-item ${
                    selectedParcelId ===
                    parcel.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedParcelId(
                      parcel.id
                    )
                  }
                >
                  <div className="ag-parcel-item-main">
                    <div className="ag-parcel-crop-icon">
                      <Sprout
                        size={18}
                      />
                    </div>

                    <div>
                      <strong>
                        {parcel.name}
                      </strong>

                      <span>
                        {parcel.crop}
                        {" · "}
                        {parcel.hectares}
                        {" "}ha
                      </span>
                    </div>
                  </div>

                  <div className="ag-parcel-item-bottom">
                    <span
                      className={`ag-parcel-status ${
                        parcel.status ===
                        "Óptimo"
                          ? "healthy"
                          : "warning"
                      }`}
                    >
                      {parcel.status}
                    </span>

                    <ArrowRight
                      size={15}
                    />
                  </div>
                </button>
              )
            )}
          </div>
        </aside>

        <main className="ag-parcel-map-panel">
          {selectedParcel ? (
            <>
              <div className="ag-parcel-map-header">
                <div>
                  <span className="ag-parcel-kicker">
                    PARCELA SELECCIONADA
                  </span>

                  <h2>
                    {selectedParcel.name}
                  </h2>
                </div>

                <div className="ag-parcel-info-badges">
                  <span>
                    {selectedParcel.crop}
                  </span>

                  <span>
                    {
                      selectedParcel.hectares
                    }{" "}
                    ha
                  </span>

                  <span>
                    {
                      selectedParcel.stage
                    }
                  </span>
                </div>
              </div>

              <div className="ag-parcel-visual">
                <div className="ag-parcel-ground">
                  <div className="ag-field-block ag-field-1">
                    🌽 🌽 🌽 🌽
                  </div>

                  <div className="ag-field-block ag-field-2">
                    🌽 🌽 🌽 🌽
                  </div>

                  <div className="ag-field-block ag-field-3">
                    🌱 🌱 🌱 🌱
                  </div>

                  {layers.find(
                    (layer) =>
                      layer.id ===
                        "irrigation" &&
                      layer.active
                  ) && (
                    <>
                      <div className="ag-irrigation-line ag-irrigation-1" />
                      <div className="ag-irrigation-line ag-irrigation-2" />
                    </>
                  )}

                  <div className="ag-tractor">
                    🚜
                  </div>

                  {layers.find(
                    (layer) =>
                      layer.id ===
                        "moisture" &&
                      layer.active
                  ) &&
                    selectedParcel.moisture !==
                      null && (
                      <div className="ag-layer-overlay ag-moisture-overlay">
                        Humedad{" "}
                        {
                          selectedParcel.moisture
                        }
                        %
                      </div>
                    )}

                  {layers.find(
                    (layer) =>
                      layer.id ===
                        "ndvi" &&
                      layer.active
                  ) && (
                    <div className="ag-layer-overlay ag-ndvi-overlay">
                      NDVI 0.78
                    </div>
                  )}

                  {layers.find(
                    (layer) =>
                      layer.id ===
                        "risk" &&
                      layer.active
                  ) && (
                    <div className="ag-layer-overlay ag-risk-overlay">
                      {selectedParcel.status ===
                      "Óptimo"
                        ? "Riesgo bajo"
                        : "Requiere atención"}
                    </div>
                  )}
                </div>
              </div>

              <div className="ag-parcel-data-strip">
                <div>
                  <Droplets size={18} />

                  <span>
                    Riego
                  </span>

                  <strong>
                    {selectedParcel.irrigation !==
                    null
                      ? `${selectedParcel.irrigation} mm/día`
                      : "Sin dato"}
                  </strong>
                </div>

                <div>
                  <Activity size={18} />

                  <span>
                    Humedad
                  </span>

                  <strong>
                    {selectedParcel.moisture !==
                    null
                      ? `${selectedParcel.moisture}%`
                      : "Sin dato"}
                  </strong>
                </div>

                <div>
                  <FlaskConical
                    size={18}
                  />

                  <span>
                    Fertilizante
                  </span>

                  <strong>
                    {selectedParcel.fertilizer !==
                    null
                      ? `${selectedParcel.fertilizer} kg/ha`
                      : "Sin dato"}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div className="ag-parcel-empty">
              <div>
                <Sprout size={50} />
              </div>

              <h3>
                Sin parcelas registradas
              </h3>

              <p>
                Crea tu primera parcela
                para comenzar a trabajar
                con AgriSim.
              </p>

              <button
                className="ag-btn ag-btn-primary"
                onClick={() =>
                  setShowModal(true)
                }
              >
                <Plus size={18} />
                Crear primera parcela
              </button>
            </div>
          )}
        </main>

        <aside className="ag-layers-panel">
          <div className="ag-layers-header">
            <div className="ag-layers-title-icon">
              <Layers size={20} />
            </div>

            <div>
              <span>
                CONTROL VISUAL
              </span>

              <h2>
                Capas
              </h2>
            </div>
          </div>

          <div className="ag-layers-list">
            {layers.map(
              (layer) => (
                <button
                  key={layer.id}
                  className={`ag-layer-item ${
                    layer.active
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    toggleLayer(
                      layer.id
                    )
                  }
                >
                  <div className="ag-layer-icon">
                    {layer.icon}
                  </div>

                  <div className="ag-layer-text">
                    <strong>
                      {layer.name}
                    </strong>

                    <span>
                      {
                        layer.description
                      }
                    </span>
                  </div>

                  <div
                    className={`ag-layer-switch ${
                      layer.active
                        ? "on"
                        : ""
                    }`}
                  >
                    <div />
                  </div>
                </button>
              )
            )}
          </div>

          <div className="ag-layer-summary">
            <Sprout size={18} />

            <div>
              <span>
                Capas activas
              </span>

              <strong>
                {
                  layers.filter(
                    (layer) =>
                      layer.active
                  ).length
                }{" "}
                / {layers.length}
              </strong>
            </div>
          </div>
        </aside>
      </div>

      {showModal && (
        <div
          className="ag-drawer-backdrop"
          onMouseDown={closeModal}
        >
          <aside
            className="ag-parcel-drawer"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="ag-drawer-header">
              <div>
                <span className="ag-page-eyebrow">
                  NUEVO PREDIO
                </span>

                <h2>
                  Nueva parcela
                </h2>

                <p>
                  Registra las condiciones
                  principales del cultivo.
                </p>
              </div>

              <button
                type="button"
                className="ag-drawer-close"
                onClick={closeModal}
                disabled={savingParcel}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="ag-drawer-form"
              onSubmit={createParcel}
            >
              <section className="ag-drawer-section">
                <div className="ag-drawer-section-title">
                  <span>01</span>

                  <div>
                    <strong>
                      Identificación
                    </strong>

                    <small>
                      Datos básicos del
                      predio
                    </small>
                  </div>
                </div>

                <div className="ag-form-group ag-form-full">
                  <label>
                    Nombre de la parcela
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Ej. Parcela Norte"
                    value={formData.name}
                    onChange={
                      handleInputChange
                    }
                    required
                  />
                </div>

                <div className="ag-form-row">
                  <div className="ag-form-group">
                    <label>
                      Cultivo
                    </label>

                    <select
                      name="crop"
                      value={
                        formData.crop
                      }
                      onChange={
                        handleInputChange
                      }
                    >
                      <option>
                        Maíz
                      </option>

                      <option>
                        Trigo
                      </option>

                      <option>
                        Sorgo
                      </option>

                      <option>
                        Frijol
                      </option>

                      <option>
                        Cebada
                      </option>
                    </select>
                  </div>

                  <div className="ag-form-group">
                    <label>
                      Superficie
                    </label>

                    <div className="ag-input-with-unit">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        name="hectares"
                        placeholder="12.5"
                        value={
                          formData.hectares
                        }
                        onChange={
                          handleInputChange
                        }
                        required
                      />

                      <span>ha</span>
                    </div>
                  </div>
                </div>

                <div className="ag-form-group ag-form-full">
                  <label>
                    Etapa del cultivo
                  </label>

                  <select
                    name="stage"
                    value={
                      formData.stage
                    }
                    onChange={
                      handleInputChange
                    }
                  >
                    <option>
                      Siembra
                    </option>

                    <option>
                      Emergencia
                    </option>

                    <option>
                      Vegetativo
                    </option>

                    <option>
                      Floración
                    </option>

                    <option>
                      Maduración
                    </option>

                    <option>
                      Cosecha
                    </option>
                  </select>
                </div>
              </section>

              <section className="ag-drawer-section">
                <div className="ag-drawer-section-title">
                  <span>02</span>

                  <div>
                    <strong>
                      Condiciones actuales
                    </strong>

                    <small>
                      Variables iniciales
                      de la parcela
                    </small>
                  </div>
                </div>

                <div className="ag-form-group ag-form-full">
                  <label>
                    Riego
                  </label>

                  <div className="ag-input-with-unit">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      name="irrigation"
                      placeholder="4.5"
                      value={
                        formData.irrigation
                      }
                      onChange={
                        handleInputChange
                      }
                    />

                    <span>
                      mm/día
                    </span>
                  </div>
                </div>

                <div className="ag-form-group ag-form-full">
                  <label>
                    Humedad del suelo
                  </label>

                  <div className="ag-input-with-unit">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      name="moisture"
                      placeholder="68"
                      value={
                        formData.moisture
                      }
                      onChange={
                        handleInputChange
                      }
                    />

                    <span>%</span>
                  </div>
                </div>

                <div className="ag-form-group ag-form-full">
                  <label>
                    Fertilizante
                  </label>

                  <div className="ag-input-with-unit">
                    <input
                      type="number"
                      min="0"
                      name="fertilizer"
                      placeholder="120"
                      value={
                        formData.fertilizer
                      }
                      onChange={
                        handleInputChange
                      }
                    />

                    <span>
                      kg/ha
                    </span>
                  </div>
                </div>
              </section>

              <div className="ag-drawer-note">
                <Sprout size={19} />

                <p>
                  Estos valores sirven como
                  punto de partida para las
                  simulaciones. Después podrás
                  experimentar con distintos
                  escenarios sin modificar la
                  parcela original.
                </p>
              </div>

              <div className="ag-drawer-actions">
                <button
                  type="button"
                  className="ag-btn ag-btn-light"
                  onClick={closeModal}
                  disabled={
                    savingParcel
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="ag-btn ag-btn-primary"
                  disabled={
                    savingParcel
                  }
                >
                  {savingParcel
                    ? "Guardando..."
                    : "Crear parcela"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </section>
  );
}

export default Parcels;