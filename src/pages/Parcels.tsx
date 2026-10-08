import { useEffect, useState } from "react";
import ParcelMap from "../components/maps/ParcelMap";

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
  MapPin,
  Search,
  CheckCircle2,
  EllipsisVertical,
  Pencil,
  Trash2,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Layer = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  icon: React.ReactNode;
};

type GeocodingResult = {
  lat: string;
  lon: string;
  display_name: string;
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
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  geometry: unknown | null;
  geometry_area_ha: number | null;
  created_at?: string;
};

type SpatialMetrics = {
  parcel_id: number;
  area_postgis_ha: number | string;
  perimeter_m: number | string;
  centroid_lat: number;
  centroid_lng: number;
  interior_lat: number;
  interior_lng: number;
  geometry_valid: boolean;
  srid: number;
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

  const [
    spatialMetrics,
    setSpatialMetrics,
  ] = useState<SpatialMetrics | null>(
    null
  );

  const [showModal, setShowModal] = useState(false);
  const [loadingParcels, setLoadingParcels] =
    useState(true);
  const [savingParcel, setSavingParcel] =
    useState(false);

  const [searchingLocation, setSearchingLocation] =
    useState(false);

  const [locationStatus, setLocationStatus] =
    useState<string | null>(null);

  const [drawerMode, setDrawerMode] =
    useState<"create" | "edit">("create");

  const [showParcelActions, setShowParcelActions] =
    useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [deletingParcel, setDeletingParcel] =
    useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    latitude: null as number | null,
    longitude: null as number | null,
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
    let isMounted = true;

    const loadSpatialMetrics =
      async () => {
        if (!selectedParcelId) {
          return;
        }

        const { data, error } =
          await supabase.rpc(
            "get_parcel_spatial_metrics",
            {
              p_parcel_id:
                selectedParcelId,
            }
          );

        if (!isMounted) {
          return;
        }

        if (error) {
          console.error(
            "Error cargando métricas espaciales:",
            error
          );

          setSpatialMetrics(
            null
          );

          return;
        }

        const metric =
          Array.isArray(data) &&
          data.length > 0
            ? (data[0] as SpatialMetrics)
            : null;

        setSpatialMetrics(
          metric
        );
      };

    void loadSpatialMetrics();

    return () => {
      isMounted = false;
    };
  }, [
    selectedParcelId,
    selectedParcel?.geometry_area_ha,
  ]);

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
      ...(name === "address"
        ? {
            latitude: null,
            longitude: null,
          }
        : {}),
    }));

    if (name === "address") {
      setLocationStatus(null);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      latitude: null,
      longitude: null,
      crop: "Maíz",
      hectares: "",
      stage: "Vegetativo",
      irrigation: "",
      moisture: "",
      fertilizer: "",
    });

    setLocationStatus(null);
  };

  const openCreateModal = () => {
    resetForm();
    setDrawerMode("create");
    setShowParcelActions(false);
    setShowModal(true);
  };

  const openEditModal = () => {
    if (!selectedParcel) {
      return;
    }

    setFormData({
      name: selectedParcel.name,
      address: selectedParcel.address ?? "",
      latitude: selectedParcel.latitude,
      longitude: selectedParcel.longitude,
      crop: selectedParcel.crop,
      hectares: String(selectedParcel.hectares),
      stage: selectedParcel.stage,
      irrigation: selectedParcel.irrigation === null
        ? ""
        : String(selectedParcel.irrigation),
      moisture: selectedParcel.moisture === null
        ? ""
        : String(selectedParcel.moisture),
      fertilizer: selectedParcel.fertilizer === null
        ? ""
        : String(selectedParcel.fertilizer),
    });

    setLocationStatus(
      selectedParcel.latitude !== null &&
      selectedParcel.longitude !== null
        ? "Ubicación guardada."
        : null
    );

    setDrawerMode("edit");
    setShowParcelActions(false);
    setShowModal(true);
  };

  const closeModal = () => {
    if (savingParcel) {
      return;
    }

    setShowModal(false);
    setDrawerMode("create");
    resetForm();
  };

  const searchLocation = async () => {
    const query = formData.address.trim();

    if (!query) {
      setLocationStatus(
        "Escribe una dirección o lugar antes de buscar."
      );
      return;
    }

    setSearchingLocation(true);
    setLocationStatus(
      "Buscando ubicación..."
    );

    try {
      const params =
        new URLSearchParams({
          q: query,
          format: "jsonv2",
          limit: "1",
          "accept-language": "es",
        });

      const response =
        await fetch(
          `https://nominatim.openstreetmap.org/search?${params.toString()}`
        );

      if (!response.ok) {
        throw new Error(
          `Geocodificación HTTP ${response.status}`
        );
      }

      const results =
        (await response.json()) as GeocodingResult[];

      const result = results[0];

      if (!result) {
        setLocationStatus(
          "No encontramos esa ubicación. Prueba con más detalles."
        );
        return;
      }

      const latitude =
        Number(result.lat);

      const longitude =
        Number(result.lon);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error(
          "La respuesta no contiene coordenadas válidas."
        );
      }

      setFormData(
        (currentData) => ({
          ...currentData,
          latitude,
          longitude,
        })
      );

      setLocationStatus(
        `Ubicación encontrada: ${result.display_name}`
      );
    } catch (error) {
      console.error(
        "Error buscando ubicación:",
        error
      );

      setLocationStatus(
        "No se pudo buscar la ubicación. Inténtalo de nuevo."
      );
    } finally {
      setSearchingLocation(false);
    }
  };

  const createParcel = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (
      formData.address.trim() !== "" &&
      (
        formData.latitude === null ||
        formData.longitude === null
      )
    ) {
      alert(
        "Pulsa “Buscar ubicación” antes de crear la parcela."
      );
      return;
    }

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
          address:
            formData.address.trim() === ""
              ? null
              : formData.address.trim(),
          latitude:
            formData.latitude,
          longitude:
            formData.longitude,
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


  const updateParcel = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!selectedParcel) {
      return;
    }

    if (
      formData.address.trim() !== "" &&
      (
        formData.latitude === null ||
        formData.longitude === null
      )
    ) {
      alert(
        "Pulsa “Buscar ubicación” antes de guardar la nueva dirección."
      );
      return;
    }

    setSavingParcel(true);

    const moisture =
      formData.moisture === ""
        ? null
        : Number(formData.moisture);

    const parcelStatus =
      moisture !== null && moisture >= 55
        ? "Óptimo"
        : "Atención";

    const { data, error } =
      await supabase
        .from("parcels")
        .update({
          name: formData.name.trim(),
          address:
            formData.address.trim() === ""
              ? null
              : formData.address.trim(),
          latitude: formData.latitude,
          longitude: formData.longitude,
          crop: formData.crop,
          hectares: Number(formData.hectares),
          stage: formData.stage,
          irrigation:
            formData.irrigation === ""
              ? null
              : Number(formData.irrigation),
          moisture,
          fertilizer:
            formData.fertilizer === ""
              ? null
              : Number(formData.fertilizer),
          status: parcelStatus,
        })
        .eq("id", selectedParcel.id)
        .select("*")
        .single();

    if (error || !data) {
      console.error(
        "Error actualizando parcela:",
        error
      );

      alert(
        "No se pudieron guardar los cambios de la parcela."
      );

      setSavingParcel(false);
      return;
    }

    const updatedParcel = data as Parcel;

    setParcels((currentParcels) =>
      currentParcels.map((parcel) =>
        parcel.id === updatedParcel.id
          ? updatedParcel
          : parcel
      )
    );

    setSelectedParcelId(updatedParcel.id);
    setSavingParcel(false);
    setShowModal(false);
    setDrawerMode("create");
    resetForm();
  };

  const handleParcelSubmit = (
    event: React.FormEvent
  ) => {
    if (drawerMode === "edit") {
      void updateParcel(event);
      return;
    }

    void createParcel(event);
  };

  const deleteSelectedParcel = async () => {
    if (!selectedParcel) {
      return;
    }

    setDeletingParcel(true);

    const parcelId = selectedParcel.id;

    const { data, error } =
      await supabase
        .from("parcels")
        .delete()
        .eq("id", parcelId)
        .select("id")
        .single();

    if (error || !data) {
      console.error(
        "Error eliminando parcela:",
        error
      );

      alert("No se pudo eliminar la parcela.");
      setDeletingParcel(false);
      return;
    }

    const remainingParcels =
      parcels.filter((parcel) =>
        parcel.id !== parcelId
      );

    setParcels(remainingParcels);
    setSelectedParcelId(
      remainingParcels.length > 0
        ? remainingParcels[0].id
        : null
    );
    setShowDeleteConfirm(false);
    setShowParcelActions(false);
    setDeletingParcel(false);
  };

  const saveParcelGeometry = async (
    parcelId: number,
    geometry: unknown,
    geometryAreaHa: number
  ) => {
    const {
      data,
      error,
    } =
      await supabase
        .from("parcels")
        .update({
          geometry,
          geometry_area_ha:
            geometryAreaHa,
        })
        .eq("id", parcelId)
        .select(
          "id, geometry, geometry_area_ha"
        )
        .single();

    if (error || !data) {
      console.error(
        "Error guardando geometría:",
        error
      );

      alert(
        "Supabase no confirmó el guardado del polígono. Revisa la consola."
      );

      return false;
    }

    setParcels(
      (currentParcels) =>
        currentParcels.map(
          (parcel) =>
            parcel.id === parcelId
              ? {
                  ...parcel,
                  geometry:
                    data.geometry,
                  geometry_area_ha:
                    Number(
                      data.geometry_area_ha
                    ),
                }
              : parcel
        )
    );

    return true;
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
          onClick={openCreateModal}
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
                  onClick={() => {
                    setSelectedParcelId(parcel.id);
                    setShowParcelActions(false);
                  }}
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

                  <h2>{selectedParcel.name}</h2>

                  {selectedParcel.address && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 6,
                        color: "var(--ag-text-muted)",
                        fontSize: 11,
                      }}
                    >
                      <MapPin size={13} />
                      <span>{selectedParcel.address}</span>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div className="ag-parcel-info-badges">
                    <span>{selectedParcel.crop}</span>
                    <span>{selectedParcel.hectares} ha</span>
                    <span>{selectedParcel.stage}</span>
                    {selectedParcel.geometry_area_ha !== null && (
                      <span>
                        Calculada: {selectedParcel.geometry_area_ha.toFixed(2)} ha
                      </span>
                    )}
                  </div>

                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="ag-btn ag-btn-light"
                      onClick={() =>
                        setShowParcelActions(
                          (current) => !current
                        )
                      }
                      aria-label="Acciones de parcela"
                      style={{
                        minWidth: 40,
                        padding: "8px 10px",
                      }}
                    >
                      <EllipsisVertical size={18} />
                    </button>

                    {showParcelActions && (
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "calc(100% + 8px)",
                          zIndex: 30,
                          width: 190,
                          padding: 6,
                          border: "1px solid var(--ag-border-light)",
                          borderRadius: 14,
                          background: "var(--ag-surface)",
                          boxShadow: "0 14px 35px rgba(18,35,20,.18)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={openEditModal}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "10px 11px",
                            border: 0,
                            borderRadius: 10,
                            background: "transparent",
                            color: "var(--ag-text-dark)",
                            cursor: "pointer",
                            font: "inherit",
                            textAlign: "left",
                          }}
                        >
                          <Pencil size={16} />
                          Editar parcela
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowParcelActions(false);
                            setShowDeleteConfirm(true);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: 9,
                            padding: "10px 11px",
                            border: 0,
                            borderRadius: 10,
                            background: "transparent",
                            color: "var(--ag-danger)",
                            cursor: "pointer",
                            font: "inherit",
                            textAlign: "left",
                          }}
                        >
                          <Trash2 size={16} />
                          Eliminar parcela
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <ParcelMap
                key={selectedParcel.id}
                parcelName={selectedParcel.name}
                address={selectedParcel.address}
                latitude={selectedParcel.latitude}
                longitude={selectedParcel.longitude}
                savedGeometry={selectedParcel.geometry}
                savedAreaHa={
                  selectedParcel.geometry_area_ha
                }
                onSaveGeometry={(
                  geometry,
                  areaHa
                ) =>
                  saveParcelGeometry(
                    selectedParcel.id,
                    geometry,
                    areaHa
                  )
                }
              />

              {spatialMetrics &&
                spatialMetrics.parcel_id ===
                  selectedParcel.id && (
                  <section
                    style={{
                      padding: "16px 18px",
                      borderTop:
                        "1px solid var(--ag-border-light)",
                      background:
                        "var(--ag-surface)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "flex-start",
                        justifyContent:
                          "space-between",
                        gap: 16,
                        marginBottom: 14,
                      }}
                    >
                      <div>
                        <span className="ag-parcel-kicker">
                          POSTGIS
                        </span>

                        <h3
                          style={{
                            margin:
                              "4px 0 0",
                            fontSize: 15,
                            color:
                              "var(--ag-text-dark)",
                          }}
                        >
                          Información geoespacial
                        </h3>
                      </div>

                      <span
                        style={{
                          padding:
                            "5px 9px",
                          borderRadius:
                            999,
                          background:
                            spatialMetrics.geometry_valid
                              ? "var(--ag-surface-green)"
                              : "rgba(217,85,79,.10)",
                          color:
                            spatialMetrics.geometry_valid
                              ? "var(--ag-primary-deep)"
                              : "var(--ag-danger)",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {spatialMetrics.geometry_valid
                          ? "Geometría válida"
                          : "Revisar geometría"}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(4, minmax(0, 1fr))",
                        gap: 10,
                      }}
                    >
                      <div style={{padding: 12, border: "1px solid var(--ag-border-light)", borderRadius: 13, background: "var(--ag-surface-soft)"}}>
                        <span style={{display: "block", marginBottom: 5, color: "var(--ag-text-muted)", fontSize: 9}}>
                          Área PostGIS
                        </span>
                        <strong
                          style={{
                            color:
                              "var(--ag-text-dark)",
                            fontSize: 16,
                            fontWeight: 700,
                          }}
                        >
                          {Number(
                            spatialMetrics.area_postgis_ha
                          ).toFixed(4)} ha
                        </strong>
                      </div>

                      <div style={{padding: 12, border: "1px solid var(--ag-border-light)", borderRadius: 13, background: "var(--ag-surface-soft)"}}>
                        <span style={{display: "block", marginBottom: 5, color: "var(--ag-text-muted)", fontSize: 9}}>
                          Perímetro
                        </span>
                        <strong
                          style={{
                            color:
                              "var(--ag-text-dark)",
                            fontSize: 16,
                            fontWeight: 700,
                          }}
                        >
                          {Number(
                            spatialMetrics.perimeter_m
                          ).toFixed(2)} m
                        </strong>
                      </div>

                      <div style={{padding: 12, border: "1px solid var(--ag-border-light)", borderRadius: 13, background: "var(--ag-surface-soft)"}}>
                        <span style={{display: "block", marginBottom: 5, color: "var(--ag-text-muted)", fontSize: 9}}>
                          Centroide
                        </span>
                        <strong
                          style={{
                            display: "block",
                            color:
                              "var(--ag-text-dark)",
                            fontSize: 11,
                            fontWeight: 700,
                            lineHeight: 1.45,
                          }}
                        >
                          {Number(
                            spatialMetrics.centroid_lat
                          ).toFixed(6)}
                          <br />
                          {Number(
                            spatialMetrics.centroid_lng
                          ).toFixed(6)}
                        </strong>
                      </div>

                      <div style={{padding: 12, border: "1px solid var(--ag-border-light)", borderRadius: 13, background: "var(--ag-surface-soft)"}}>
                        <span style={{display: "block", marginBottom: 5, color: "var(--ag-text-muted)", fontSize: 9}}>
                          Sistema espacial
                        </span>
                        <strong
                          style={{
                            color:
                              "var(--ag-text-dark)",
                            fontSize: 16,
                            fontWeight: 700,
                          }}
                        >
                          EPSG:{spatialMetrics.srid}
                        </strong>
                      </div>
                    </div>
                  </section>
                )}

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
                onClick={openCreateModal}
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
                  {drawerMode === "edit"
                    ? "EDITAR PREDIO"
                    : "NUEVO PREDIO"}
                </span>

                <h2>
                  {drawerMode === "edit"
                    ? "Editar parcela"
                    : "Nueva parcela"}
                </h2>

                <p>
                  {drawerMode === "edit"
                    ? "Actualiza la información general de la parcela."
                    : "Registra las condiciones principales del cultivo."}
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
              onSubmit={handleParcelSubmit}
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
                      Ubicación
                    </strong>

                    <small>
                      Indica dónde se encuentra
                      la parcela
                    </small>
                  </div>
                </div>

                <div className="ag-form-group ag-form-full">
                  <label>
                    Dirección o ubicación
                  </label>

                  <div className="ag-location-input">
                    <MapPin size={17} />

                    <input
                      type="text"
                      name="address"
                      placeholder="Ej. Atlixco, Puebla, México"
                      value={formData.address}
                      onChange={
                        handleInputChange
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="ag-btn ag-btn-light"
                    onClick={searchLocation}
                    disabled={
                      searchingLocation ||
                      formData.address.trim() === ""
                    }
                  >
                    <Search size={16} />

                    {searchingLocation
                      ? "Buscando..."
                      : "Buscar ubicación"}
                  </button>

                  {locationStatus && (
                    <small className="ag-location-help">
                      {formData.latitude !== null &&
                      formData.longitude !== null ? (
                        <>
                          <CheckCircle2 size={13} />
                          {" "}
                          {locationStatus}
                          {" · "}
                          {formData.latitude.toFixed(5)},
                          {" "}
                          {formData.longitude.toFixed(5)}
                        </>
                      ) : (
                        locationStatus
                      )}
                    </small>
                  )}

                  {!locationStatus && (
                    <small className="ag-location-help">
                      Escribe una dirección, localidad,
                      municipio o referencia y pulsa
                      Buscar ubicación.
                    </small>
                  )}
                </div>
              </section>

              <section className="ag-drawer-section">
                <div className="ag-drawer-section-title">
                  <span>03</span>

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
                  {drawerMode === "edit"
                    ? "Los cambios actualizarán esta parcela sin modificar el polígono guardado. El contorno se edita directamente desde el mapa."
                    : "Estos valores sirven como punto de partida para las simulaciones. Después podrás experimentar con distintos escenarios sin modificar la parcela original."}
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
                    : drawerMode === "edit"
                      ? "Guardar cambios"
                      : "Crear parcela"}
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {showDeleteConfirm && selectedParcel && (
        <div
          onMouseDown={() => {
            if (!deletingParcel) {
              setShowDeleteConfirm(false);
            }
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "rgba(18,35,20,.56)",
            backdropFilter: "blur(5px)",
          }}
        >
          <div
            onMouseDown={(event) => event.stopPropagation()}
            style={{
              width: "min(440px, 100%)",
              padding: 24,
              border: "1px solid var(--ag-border-light)",
              borderRadius: 20,
              background: "var(--ag-surface)",
              boxShadow: "0 24px 70px rgba(0,0,0,.24)",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                display: "grid",
                placeItems: "center",
                marginBottom: 16,
                borderRadius: 13,
                background: "rgba(217,85,79,.10)",
                color: "var(--ag-danger)",
              }}
            >
              <Trash2 size={21} />
            </div>

            <span className="ag-page-eyebrow">
              ACCIÓN DESTRUCTIVA
            </span>

            <h2 style={{ margin: "6px 0 8px" }}>
              Eliminar parcela
            </h2>

            <p
              style={{
                margin: 0,
                color: "var(--ag-text-muted)",
                lineHeight: 1.6,
              }}
            >
              ¿Seguro que quieres eliminar {" "}
              <strong style={{ color: "var(--ag-text-dark)" }}>
                “{selectedParcel.name}”
              </strong>
              ? También se eliminarán sus simulaciones asociadas.
            </p>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 24,
              }}
            >
              <button
                type="button"
                className="ag-btn ag-btn-light"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingParcel}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="ag-btn"
                onClick={() => void deleteSelectedParcel()}
                disabled={deletingParcel}
                style={{
                  background: "var(--ag-danger)",
                  color: "#fff",
                }}
              >
                <Trash2 size={16} />
                {deletingParcel
                  ? "Eliminando..."
                  : "Eliminar parcela"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}

export default Parcels;