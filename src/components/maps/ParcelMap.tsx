import {
  useEffect,
  useRef,
  useState,
} from "react";

import * as maplibregl from "maplibre-gl";

import {
  MaplibreTerradrawControl,
} from "@watergis/maplibre-gl-terradraw";

import area from "@turf/area";

import "maplibre-gl/dist/maplibre-gl.css";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";

type PolygonFeature = {
  type: "Feature";
  id?: string | number;
  properties: Record<string, unknown>;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
};

type ParcelMapProps = {
  parcelName?: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  savedGeometry?: unknown | null;
  savedAreaHa?: number | null;
  onSaveGeometry?: (
    geometry: unknown,
    areaHa: number
  ) => Promise<boolean>;
};

const STATIC_SOURCE_ID =
  "agrisim-parcel-static";

const STATIC_FILL_ID =
  "agrisim-parcel-static-fill";

const STATIC_LINE_ID =
  "agrisim-parcel-static-line";

function isPolygonFeature(
  value: unknown
): value is PolygonFeature {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const feature =
    value as {
      type?: unknown;
      properties?: unknown;
      geometry?: {
        type?: unknown;
        coordinates?: unknown;
      };
    };

  return (
    feature.type === "Feature" &&
    feature.geometry?.type ===
      "Polygon" &&
    Array.isArray(
      feature.geometry.coordinates
    )
  );
}

function toFeatureCollection(
  feature: PolygonFeature | null
) {
  return {
    type: "FeatureCollection" as const,
    features:
      feature === null
        ? []
        : [feature],
  };
}

function calculateAreaHa(
  feature: PolygonFeature
) {
  const areaM2 =
    area(
      feature as Parameters<
        typeof area
      >[0]
    );

  return areaM2 / 10000;
}

function getPolygonBounds(
  feature: PolygonFeature
) {
  const coordinates =
    feature.geometry.coordinates.flat();

  if (coordinates.length === 0) {
    return null;
  }

  const first =
    coordinates[0];

  const bounds =
    new maplibregl.LngLatBounds(
      [
        first[0],
        first[1],
      ],
      [
        first[0],
        first[1],
      ]
    );

  coordinates.forEach(
    (coordinate) => {
      bounds.extend([
        coordinate[0],
        coordinate[1],
      ]);
    }
  );

  return bounds;
}

function cleanPolygonFeature(
  feature: PolygonFeature
): PolygonFeature {
  const cleaned =
    JSON.parse(
      JSON.stringify(feature)
    ) as PolygonFeature;

  cleaned.properties = {
    ...cleaned.properties,
    mode: "polygon",
  };

  delete cleaned.properties.selected;

  return cleaned;
}

function escapeHtml(
  value: string
) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function ParcelMap({
  parcelName = "Parcela",
  address = null,
  latitude = null,
  longitude = null,
  savedGeometry = null,
  savedAreaHa = null,
  onSaveGeometry,
}: ParcelMapProps) {
  const mapContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const mapRef =
    useRef<maplibregl.Map | null>(
      null
    );

  const drawControlRef =
    useRef<MaplibreTerradrawControl | null>(
      null
    );

  const draftIntervalRef =
    useRef<number | null>(
      null
    );

  const savedGeometryRef =
    useRef<unknown | null>(
      savedGeometry
    );

  useEffect(() => {
    savedGeometryRef.current =
      savedGeometry;
  }, [savedGeometry]);

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    draftAreaHa,
    setDraftAreaHa,
  ] = useState<number | null>(
    null
  );

  const [
    draftHasGeometry,
    setDraftHasGeometry,
  ] = useState(false);

  const [
    savingGeometry,
    setSavingGeometry,
  ] = useState(false);

  const [
    saveFeedback,
    setSaveFeedback,
  ] = useState<string | null>(
    null
  );

  const hasSavedLocation =
    latitude !== null &&
    longitude !== null;

  const hasSavedGeometry =
    isPolygonFeature(
      savedGeometry
    );

  const mapLongitude =
    hasSavedLocation
      ? longitude
      : -98.2063;

  const mapLatitude =
    hasSavedLocation
      ? latitude
      : 19.0414;

  const setStaticGeometry = (
    feature: PolygonFeature | null
  ) => {
    const map =
      mapRef.current;

    if (!map) {
      return;
    }

    const source =
      map.getSource(
        STATIC_SOURCE_ID
      ) as
        | maplibregl.GeoJSONSource
        | undefined;

    if (!source) {
      return;
    }

    const data =
      toFeatureCollection(
        feature
      );

    source.setData(
      data as Parameters<
        typeof source.setData
      >[0]
    );
  };

  const stopDraftWatcher = () => {
    if (
      draftIntervalRef.current !==
      null
    ) {
      window.clearInterval(
        draftIntervalRef.current
      );

      draftIntervalRef.current =
        null;
    }
  };

  const getCurrentDraftPolygon =
    () => {
      const draw =
        drawControlRef.current
          ?.getTerraDrawInstance();

      if (!draw) {
        return null;
      }

      const snapshot =
        draw.getSnapshot();

      const polygons =
        snapshot.filter(
          (feature) =>
            feature.geometry.type ===
              "Polygon" &&
            feature.properties
              ?.currentlyDrawing !==
              true
        );

      const feature =
        polygons.at(-1);

      if (
        !feature ||
        !isPolygonFeature(feature)
      ) {
        return null;
      }

      return feature;
    };

  const hasUnfinishedPolygon =
    () => {
      const draw =
        drawControlRef.current
          ?.getTerraDrawInstance();

      if (!draw) {
        return false;
      }

      return draw
        .getSnapshot()
        .some(
          (feature) =>
            feature.geometry.type ===
              "Polygon" &&
            feature.properties
              ?.currentlyDrawing ===
              true
        );
    };

  const updateDraftState =
    () => {
      try {
        const feature =
          getCurrentDraftPolygon();

        if (!feature) {
          setDraftHasGeometry(
            false
          );

          setDraftAreaHa(
            null
          );

          return;
        }

        const areaHa =
          calculateAreaHa(
            feature
          );

        setDraftHasGeometry(
          true
        );

        setDraftAreaHa(
          areaHa
        );
      } catch (error) {
        console.error(
          "Error leyendo el polígono:",
          error
        );

        setDraftHasGeometry(
          false
        );

        setDraftAreaHa(
          null
        );
      }
    };

  const removeDrawControl =
    () => {
      stopDraftWatcher();

      const map =
        mapRef.current;

      const control =
        drawControlRef.current;

      if (
        map &&
        control &&
        map.hasControl(control)
      ) {
        map.removeControl(
          control
        );
      }

      drawControlRef.current =
        null;
    };

  const restoreReadOnlyGeometry =
    (
      geometry:
        | PolygonFeature
        | null
    ) => {
      removeDrawControl();

      setStaticGeometry(
        geometry
      );

      setIsEditing(false);
      setDraftHasGeometry(false);
      setDraftAreaHa(null);
    };

  const startEditing =
    () => {
      const map =
        mapRef.current;

      setSaveFeedback(null);

      if (
        !map ||
        drawControlRef.current
      ) {
        return;
      }

      setStaticGeometry(null);

      const control =
        new MaplibreTerradrawControl({
          modes: [
            "polygon",
            "select",
            "delete-selection",
            "delete",
          ],
          open: true,
        });

      map.addControl(
        control,
        "top-left"
      );

      drawControlRef.current =
        control;

      setIsEditing(true);

      window.setTimeout(
        () => {
          const draw =
            control
              .getTerraDrawInstance();

          if (!draw) {
            return;
          }

          const existing =
            isPolygonFeature(
              savedGeometryRef.current
            )
              ? savedGeometryRef.current
              : null;

          if (existing) {
            const feature =
              cleanPolygonFeature(
                existing
              );

            const features =
              [feature] as Parameters<
                typeof draw.addFeatures
              >[0];

            draw.addFeatures(
              features
            );

            draw.setMode(
              "select"
            );
          } else {
            draw.setMode(
              "polygon"
            );
          }

          updateDraftState();

          draftIntervalRef.current =
            window.setInterval(
              updateDraftState,
              300
            );
        },
        0
      );
    };

  const cancelEditing =
    () => {
      setSaveFeedback(null);

      const existing =
        isPolygonFeature(
          savedGeometryRef.current
        )
          ? savedGeometryRef.current
          : null;

      restoreReadOnlyGeometry(
        existing
      );
    };

  const saveGeometry =
    async () => {
      setSaveFeedback(null);

      const feature =
        getCurrentDraftPolygon();

      if (!feature) {
        const unfinished =
          hasUnfinishedPolygon();

        const message =
          unfinished
            ? "El polígono todavía está en edición. Termínalo con doble clic o cerrándolo sobre el primer punto."
            : "No hay un polígono válido para guardar.";

        setSaveFeedback(
          message
        );

        alert(message);

        return;
      }

      const cleaned =
        cleanPolygonFeature(
          feature
        );

      const areaHa =
        calculateAreaHa(
          cleaned
        );

      if (
        !Number.isFinite(areaHa) ||
        areaHa <= 0
      ) {
        setSaveFeedback(
          "El polígono no tiene un área válida."
        );

        return;
      }

      setSavingGeometry(true);
      setSaveFeedback(
        "Guardando polígono..."
      );

      try {
        const saved =
          onSaveGeometry
            ? await onSaveGeometry(
                cleaned,
                areaHa
              )
            : true;

        if (!saved) {
          setSaveFeedback(
            "Supabase no pudo guardar el polígono."
          );

          return;
        }

        savedGeometryRef.current =
          cleaned;

        setSaveFeedback(
          "Polígono guardado correctamente."
        );

        restoreReadOnlyGeometry(
          cleaned
        );
      } catch (error) {
        console.error(
          "Error guardando polígono:",
          error
        );

        setSaveFeedback(
          "Ocurrió un error al guardar el polígono."
        );

        alert(
          "No se pudo guardar el polígono. Revisa la consola para ver el error."
        );
      } finally {
        setSavingGeometry(
          false
        );
      }
    };

  useEffect(() => {
    if (
      !mapContainerRef.current ||
      mapRef.current
    ) {
      return;
    }

    const map =
      new maplibregl.Map({
        container:
          mapContainerRef.current,

        style:
          "https://tiles.openfreemap.org/styles/liberty",

        center: [
          mapLongitude,
          mapLatitude,
        ],

        zoom:
          hasSavedLocation
            ? 15
            : 11,

        pitch: 0,

        bearing: 0,
      });

    mapRef.current = map;

    map.on(
      "error",
      (event) => {
        console.error(
          "Error de MapLibre:",
          event.error
        );
      }
    );

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      "top-right"
    );

    map.addControl(
      new maplibregl.ScaleControl({
        maxWidth: 120,
        unit: "metric",
      }),
      "bottom-left"
    );

    const initialGeometry =
      isPolygonFeature(
        savedGeometryRef.current
      )
        ? savedGeometryRef.current
        : null;

    let marker:
      | maplibregl.Marker
      | null = null;

    map.on(
      "load",
      () => {
        map.addSource(
          STATIC_SOURCE_ID,
          {
            type: "geojson",
            data:
              toFeatureCollection(
                initialGeometry
              ),
          }
        );

        map.addLayer({
          id: STATIC_FILL_ID,
          type: "fill",
          source:
            STATIC_SOURCE_ID,
          paint: {
            "fill-color":
              "#68ef3f",
            "fill-opacity":
              0.2,
          },
        });

        map.addLayer({
          id: STATIC_LINE_ID,
          type: "line",
          source:
            STATIC_SOURCE_ID,
          paint: {
            "line-color":
              "#26a200",
            "line-width": 3,
          },
        });

        if (initialGeometry) {
          const bounds =
            getPolygonBounds(
              initialGeometry
            );

          if (bounds) {
            map.fitBounds(
              bounds,
              {
                padding: 70,
                maxZoom: 17,
                duration: 0,
              }
            );
          }
        } else {
          marker =
            new maplibregl.Marker({
              color: "#68ef3f",
            })
              .setLngLat([
                mapLongitude,
                mapLatitude,
              ])
              .setPopup(
                new maplibregl.Popup({
                  offset: 24,
                }).setHTML(`
                  <div style="
                    font-family: Inter, sans-serif;
                    min-width: 160px;
                  ">
                    <strong
                      style="
                        color: #30322a;
                        font-size: 13px;
                      "
                    >
                      ${escapeHtml(
                        parcelName
                      )}
                    </strong>

                    <br />

                    <span
                      style="
                        color: #7e8371;
                        font-size: 11px;
                      "
                    >
                      ${escapeHtml(
                        address ||
                          (hasSavedLocation
                            ? "Ubicación registrada"
                            : "Ubicación demostrativa")
                      )}
                    </span>
                  </div>
                `)
              )
              .addTo(map);
        }

        map.resize();

        console.log(
          "Mapa AgriSim cargado correctamente."
        );
      }
    );

    return () => {
      stopDraftWatcher();

      if (
        drawControlRef.current &&
        map.hasControl(
          drawControlRef.current
        )
      ) {
        map.removeControl(
          drawControlRef.current
        );
      }

      drawControlRef.current =
        null;

      marker?.remove();

      map.remove();

      mapRef.current =
        null;
    };
  }, [
    parcelName,
    address,
    mapLatitude,
    mapLongitude,
    hasSavedLocation,
  ]);

  const displayedArea =
    isEditing
      ? draftAreaHa
      : savedAreaHa;

  return (
    <div className="ag-map-wrapper">
      <div
        ref={mapContainerRef}
        className="ag-map-container"
      />

      <div
        style={{
          position: "absolute",
          top: 14,
          left: "50%",
          transform:
            "translateX(-50%)",
          zIndex: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: 6,
          borderRadius: 14,
          background:
            "rgba(18, 35, 20, 0.88)",
          backdropFilter:
            "blur(10px)",
          boxShadow:
            "0 8px 24px rgba(0,0,0,0.18)",
        }}
      >
        {!isEditing && (
          <button
            type="button"
            className="ag-btn ag-btn-primary"
            onClick={startEditing}
          >
            {hasSavedGeometry
              ? "Editar polígono"
              : "Dibujar polígono"}
          </button>
        )}

        {isEditing && (
          <>
            <button
              type="button"
              className="ag-btn ag-btn-light"
              onClick={
                cancelEditing
              }
              disabled={
                savingGeometry
              }
            >
              Cancelar
            </button>

            <button
              type="button"
              className="ag-btn ag-btn-primary"
              onClick={
                saveGeometry
              }
              disabled={
                savingGeometry
              }
            >
              {savingGeometry
                ? "Guardando..."
                : "Guardar polígono"}
            </button>
          </>
        )}
      </div>

      {saveFeedback && (
        <div
          style={{
            position: "absolute",
            top: 76,
            left: "50%",
            transform:
              "translateX(-50%)",
            zIndex: 8,
            padding: "7px 10px",
            borderRadius: 999,
            background:
              "rgba(255,255,255,0.94)",
            color: "#30322a",
            fontSize: 10,
            fontWeight: 600,
            boxShadow:
              "0 8px 22px rgba(0,0,0,0.14)",
          }}
        >
          {saveFeedback}
        </div>
      )}

      <div className="ag-map-demo-badge">
        {!isEditing &&
          !hasSavedGeometry &&
          "Sin polígono guardado"}

        {!isEditing &&
          hasSavedGeometry &&
          displayedArea !== null &&
          displayedArea !==
            undefined &&
          `Polígono guardado · ${displayedArea.toFixed(
            2
          )} ha`}

        {isEditing &&
          !draftHasGeometry &&
          "Modo edición · termina el polígono para guardarlo"}

        {isEditing &&
          draftHasGeometry &&
          displayedArea !== null &&
          displayedArea !==
            undefined &&
          `Cambios sin guardar · ${displayedArea.toFixed(
            2
          )} ha`}
      </div>
    </div>
  );
}

export default ParcelMap;
