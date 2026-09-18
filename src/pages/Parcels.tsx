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
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [loadingParcels, setLoadingParcels] = useState(true);
  const [savingParcel, setSavingParcel] = useState(false);

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
    parcels.find((parcel) => parcel.id === selectedParcelId) ?? null;

  useEffect(() => {
    const loadParcels = async () => {
      setLoadingParcels(true);

      const { data, error } = await supabase
        .from("parcels")
        .select("*")
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error("Error cargando parcelas:", error);
        setLoadingParcels(false);
        return;
      }

      const loadedParcels = (data ?? []) as Parcel[];

      setParcels(loadedParcels);

      if (loadedParcels.length > 0) {
        setSelectedParcelId(loadedParcels[0].id);
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
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

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

  const createParcel = async (event: React.FormEvent) => {
    event.preventDefault();

    setSavingParcel(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error obteniendo usuario:", userError);
      alert("No hay un usuario autenticado.");
      setSavingParcel(false);
      return;
    }

    const moisture = Number(formData.moisture);

    const parcelStatus =
      moisture >= 55 ? "Óptimo" : "Atención";

    const { data, error } = await supabase
      .from("parcels")
      .insert({
        user_id: user.id,
        name: formData.name,
        crop: formData.crop,
        hectares: Number(formData.hectares),
        stage: formData.stage,
        irrigation:
          formData.irrigation === ""
            ? null
            : Number(formData.irrigation),
        moisture:
          formData.moisture === ""
            ? null
            : moisture,
        fertilizer:
          formData.fertilizer === ""
            ? null
            : Number(formData.fertilizer),
        status: parcelStatus,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creando parcela:", error);
      alert("No se pudo guardar la parcela.");
      setSavingParcel(false);
      return;
    }

    const newParcel = data as Parcel;

    setParcels((currentParcels) => [
      ...currentParcels,
      newParcel,
    ]);

    setSelectedParcelId(newParcel.id);

    resetForm();
    setShowModal(false);
    setSavingParcel(false);
  };

  return (
    <section className="parcels-page">
      <div className="dashboard-header">
        <div>
          <h1>Parcelas</h1>

          <p>
            Visualiza el predio y controla sus capas de información.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} />
          Nueva parcela
        </button>
      </div>

      <div className="parcel-layout">
        <aside className="parcel-list-panel">
          <div className="panel-title-row">
            <div>
              <span className="panel-label">
                Predio activo
              </span>

              <h2>AgriSim Field</h2>
            </div>
          </div>

          <div className="parcel-list">
            {loadingParcels && (
              <div className="empty-list-message">
                Cargando parcelas...
              </div>
            )}

            {!loadingParcels && parcels.length === 0 && (
              <div className="empty-list-message">
                No tienes parcelas todavía.
              </div>
            )}

            {parcels.map((parcel) => (
              <button
                key={parcel.id}
                className={`parcel-list-item ${
                  selectedParcelId === parcel.id
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setSelectedParcelId(parcel.id)
                }
              >
                <div>
                  <strong>{parcel.name}</strong>

                  <span>
                    {parcel.crop} · {parcel.hectares} ha
                  </span>
                </div>

                <span
                  className={`parcel-status ${
                    parcel.status === "Óptimo"
                      ? "healthy"
                      : "warning"
                  }`}
                >
                  {parcel.status}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <div className="parcel-map-panel">
          {selectedParcel ? (
            <>
              <div className="parcel-map-header">
                <div>
                  <span className="panel-label">
                    Parcela seleccionada
                  </span>

                  <h2>{selectedParcel.name}</h2>
                </div>

                <div className="parcel-info-badges">
                  <span>
                    {selectedParcel.hectares} ha
                  </span>

                  <span>
                    {selectedParcel.crop}
                  </span>

                  <span>
                    {selectedParcel.stage}
                  </span>
                </div>
              </div>

              <div className="parcel-visual">
                <div className="parcel-ground">
                  <div className="field-block block-1">
                    🌽 🌽 🌽 🌽
                  </div>

                  <div className="field-block block-2">
                    🌽 🌽 🌽 🌽
                  </div>

                  <div className="field-block block-3">
                    🌱 🌱 🌱 🌱
                  </div>

                  {layers.find(
                    (layer) =>
                      layer.id === "irrigation" &&
                      layer.active
                  ) && (
                    <>
                      <div className="irrigation-line irrigation-1" />
                      <div className="irrigation-line irrigation-2" />
                    </>
                  )}

                  <div className="tractor">
                    🚜
                  </div>

                  {layers.find(
                    (layer) =>
                      layer.id === "moisture" &&
                      layer.active
                  ) &&
                    selectedParcel.moisture !== null && (
                      <div className="layer-overlay moisture-overlay">
                        Humedad{" "}
                        {selectedParcel.moisture}%
                      </div>
                    )}

                  {layers.find(
                    (layer) =>
                      layer.id === "ndvi" &&
                      layer.active
                  ) && (
                    <div className="layer-overlay ndvi-overlay">
                      NDVI 0.78
                    </div>
                  )}

                  {layers.find(
                    (layer) =>
                      layer.id === "risk" &&
                      layer.active
                  ) && (
                    <div className="layer-overlay risk-overlay">
                      {selectedParcel.status ===
                      "Óptimo"
                        ? "Riesgo bajo"
                        : "Requiere atención"}
                    </div>
                  )}
                </div>
              </div>

              <div className="parcel-data-strip">
                <div>
                  <span>Riego</span>

                  <strong>
                    {selectedParcel.irrigation !== null
                      ? `${selectedParcel.irrigation} mm/día`
                      : "Sin dato"}
                  </strong>
                </div>

                <div>
                  <span>Humedad</span>

                  <strong>
                    {selectedParcel.moisture !== null
                      ? `${selectedParcel.moisture}%`
                      : "Sin dato"}
                  </strong>
                </div>

                <div>
                  <span>Fertilizante</span>

                  <strong>
                    {selectedParcel.fertilizer !== null
                      ? `${selectedParcel.fertilizer} kg/ha`
                      : "Sin dato"}
                  </strong>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-parcel-state">
              <Sprout size={54} />

              <h3>
                No tienes parcelas todavía
              </h3>

              <p>
                Crea tu primera parcela para comenzar
                a trabajar con AgriSim.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  setShowModal(true)
                }
              >
                <Plus size={18} />
                Crear primera parcela
              </button>
            </div>
          )}
        </div>

        <aside className="layers-panel">
          <div className="layers-header">
            <Layers size={20} />

            <div>
              <span className="panel-label">
                Control visual
              </span>

              <h2>Capas</h2>
            </div>
          </div>

          <div className="layers-list">
            {layers.map((layer) => (
              <button
                key={layer.id}
                className={`layer-item ${
                  layer.active ? "active" : ""
                }`}
                onClick={() =>
                  toggleLayer(layer.id)
                }
              >
                <div className="layer-icon">
                  {layer.icon}
                </div>

                <div className="layer-text">
                  <strong>{layer.name}</strong>

                  <span>
                    {layer.description}
                  </span>
                </div>

                <div
                  className={`layer-switch ${
                    layer.active ? "on" : ""
                  }`}
                >
                  <div className="switch-dot" />
                </div>
              </button>
            ))}
          </div>

          <div className="layer-summary">
            <Sprout size={18} />

            <div>
              <span>
                Capas activas
              </span>

              <strong>
                {
                  layers.filter(
                    (layer) => layer.active
                  ).length
                }
              </strong>
            </div>
          </div>
        </aside>
      </div>

      {showModal && (
        <div
          className="drawer-backdrop"
          onClick={closeModal}
        >
          <aside
            className="parcel-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <span className="drawer-eyebrow">
                  AGRISIM · GESTIÓN DE PREDIOS
                </span>

                <h2>Nueva parcela</h2>

                <p>
                  Registra la información básica de la parcela. Después
                  podremos agregar suelo, clima y otras capas.
                </p>
              </div>

              <button
                type="button"
                className="drawer-close"
                onClick={closeModal}
                aria-label="Cerrar"
              >
                <X size={21} />
              </button>
            </div>

            <form
              className="drawer-form"
              onSubmit={createParcel}
            >
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <span className="section-number">01</span>

                  <div>
                    <strong>Identificación</strong>
                    <span>Información general de la parcela</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Nombre de la parcela</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Ej. Parcela 14F"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="drawer-two-columns">
                  <div className="form-group">
                    <label>Cultivo</label>

                    <select
                      name="crop"
                      value={formData.crop}
                      onChange={handleInputChange}
                    >
                      <option>Maíz</option>
                      <option>Trigo</option>
                      <option>Sorgo</option>
                      <option>Frijol</option>
                      <option>Cebada</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Superficie</label>

                    <div className="input-with-unit">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        name="hectares"
                        placeholder="12.5"
                        value={formData.hectares}
                        onChange={handleInputChange}
                        required
                      />

                      <span>ha</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Etapa del cultivo</label>

                  <select
                    name="stage"
                    value={formData.stage}
                    onChange={handleInputChange}
                  >
                    <option>Siembra</option>
                    <option>Emergencia</option>
                    <option>Vegetativo</option>
                    <option>Floración</option>
                    <option>Maduración</option>
                    <option>Cosecha</option>
                  </select>
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-title">
                  <span className="section-number">02</span>

                  <div>
                    <strong>Condiciones actuales</strong>
                    <span>Variables iniciales para el análisis</span>
                  </div>
                </div>

                <div className="form-group">
                  <div className="field-label-row">
                    <label>Riego</label>
                    <span className="field-unit">mm/día</span>
                  </div>

                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    name="irrigation"
                    placeholder="4.5"
                    value={formData.irrigation}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <div className="field-label-row">
                    <label>Humedad del suelo</label>
                    <span className="field-unit">%</span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    name="moisture"
                    placeholder="68"
                    value={formData.moisture}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <div className="field-label-row">
                    <label>Fertilizante</label>
                    <span className="field-unit">kg/ha</span>
                  </div>

                  <input
                    type="number"
                    min="0"
                    name="fertilizer"
                    placeholder="120"
                    value={formData.fertilizer}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="drawer-info">
                <Sprout size={20} />

                <div>
                  <strong>¿Qué ocurrirá después?</strong>
                  <span>
                    AgriSim guardará esta parcela en tu cuenta. Más adelante
                    podremos agregar coordenadas, suelo, clima, riego y datos
                    históricos.
                  </span>
                </div>
              </div>

              <div className="drawer-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={savingParcel}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button drawer-create-button"
                  disabled={savingParcel}
                >
                  <Plus size={18} />
                  {savingParcel ? "Guardando..." : "Crear parcela"}
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