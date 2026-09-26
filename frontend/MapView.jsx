import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Explicit asset URLs keep Leaflet's default markers working in Vite and other bundlers.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// TODO: [ENTER YOUR FLASK API BASE URL]
// For local development with the Flask app in this example, keep http://localhost:5000.
const API_BASE_URL = "http://localhost:5000";

// TODO: [ENTER YOUR DATABASE LATITUDE AND LONGITUDE COLUMN NAMES]
// These must match the column names configured in backend/app.py.
const LATITUDE_FIELD = "latitude";
const LONGITUDE_FIELD = "longitude";

// TODO: [ENTER YOUR POPUP FIELDS]
// Replace these example keys/labels with fields returned by your Supabase table.
const POPUP_FIELDS = [
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
];

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 2;

function FitMapToPoints({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0].position, 12);
    } else if (points.length > 1) {
      map.fitBounds(points.map((point) => point.position), { padding: [32, 32], maxZoom: 13 });
    }
  }, [map, points]);

  return null;
}

export default function MapView() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadMapData() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_BASE_URL}/api/map-data`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Map API returned HTTP ${response.status}`);
        }
        const payload = await response.json();
        if (!Array.isArray(payload.data)) {
          throw new Error("Map API response must contain a data array");
        }
        setRecords(payload.data);
      } catch (fetchError) {
        if (fetchError.name !== "AbortError") {
          setError(fetchError.message || "Could not load map data.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadMapData();
    return () => controller.abort();
  }, []);

  const points = useMemo(
    () =>
      records
        .map((record, index) => {
          const latitude = Number(record[LATITUDE_FIELD]);
          const longitude = Number(record[LONGITUDE_FIELD]);
          if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180
          ) {
            return null;
          }
          return { record, position: [latitude, longitude], key: record.id ?? index };
        })
        .filter(Boolean),
    [records],
  );

  return (
    <section className="map-view" aria-label="Interactive map">
      {loading && <p role="status">Loading map data…</p>}
      {error && <p role="alert">Map data error: {error}</p>}
      {!loading && !error && points.length === 0 && <p>No valid map locations were returned.</p>}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        style={{ height: "70vh", minHeight: "360px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitMapToPoints points={points} />
        {points.map(({ record, position, key }) => (
          <Marker key={key} position={position}>
            <Popup>
              {POPUP_FIELDS.map(({ key: field, label }) => (
                <div key={field}>
                  <strong>{label}:</strong> {record[field] == null ? "—" : String(record[field])}
                </div>
              ))}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </section>
  );
}
