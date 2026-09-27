import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

const GEORGIA_COLOR = "#2563eb";
const DOMINION_COLOR = "#f97316";
const OVERLAP_COLOR = "#dc2626";

export default function GridMap({
  data,
  layers,
  selectedOverlap,
  selectedOpportunity,
  onSelectOverlap,
}) {
  return (
    <MapContainer
      center={[32.7, -81.2]}
      zoom={7}
      minZoom={5}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FocusSelected opportunity={selectedOpportunity} />

      {layers.georgia &&
        data.georgia.map((project) => (
          <ProjectMarker
            key={`ga-${project.id}`}
            project={project}
            utility="Georgia Power"
            color={GEORGIA_COLOR}
          />
        ))}

      {layers.dominion &&
        data.dominion.map((project) => (
          <ProjectMarker
            key={`sc-${project.id}`}
            project={project}
            utility="Dominion Energy South Carolina"
            color={DOMINION_COLOR}
          />
        ))}

      {layers.overlaps &&
        data.overlaps.map((overlap, index) => {
          const selected = selectedOverlap === index;

          return (
            <Polyline
              key={`overlap-${overlap.georgiaId}-${overlap.dominionId}-${index}`}
              positions={[
                [overlap.georgiaLat, overlap.georgiaLon],
                [overlap.dominionLat, overlap.dominionLon],
              ]}
              eventHandlers={{
                click: () => onSelectOverlap(index),
              }}
              pathOptions={{
                color: OVERLAP_COLOR,
                weight: selected ? 7 : 4,
                opacity: selected ? 1 : 0.7,
                dashArray: selected ? undefined : "9 8",
              }}
            >
              <Popup>
                <div className="map-popup">
                  <span className="popup-kicker">Coordination opportunity</span>
                  <strong>{overlap.georgiaName}</strong>
                  <span className="popup-arrow">↕</span>
                  <strong>{overlap.dominionName}</strong>
                  <div className="popup-metrics">
                    <span>{overlap.distance} miles apart</span>
                    <span>
                      {overlap.timeGapDays !== null
                        ? `${overlap.timeGapDays} day timeline gap`
                        : "Timeline unavailable"}
                    </span>
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}
    </MapContainer>
  );
}

function ProjectMarker({ project, utility, color }) {
  return (
    <>
      {project.lat2 != null && project.lon2 != null && project.lat1 != null && project.lon1 != null && (
        <Polyline
          positions={[
            [project.lat1, project.lon1],
            [project.lat2, project.lon2],
          ]}
          pathOptions={{
            color,
            weight: 2,
            opacity: 0.35,
          }}
        />
      )}

      <CircleMarker
        center={[project.lat, project.lon]}
        radius={6}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.9,
          weight: 2,
        }}
      >
        <Popup>
          <div className="map-popup">
            <span className="popup-kicker">{utility}</span>
            <strong>{project.name || "Unnamed project"}</strong>
            <span>Project ID: {project.id}</span>
            <span>In-service: {formatDate(project.date)}</span>
            {project.status && <span>Status: {project.status}</span>}
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
}

function FocusSelected({ opportunity }) {
  const map = useMap();

  useEffect(() => {
    if (!opportunity) return;

    const bounds = [
      [opportunity.georgiaLat, opportunity.georgiaLon],
      [opportunity.dominionLat, opportunity.dominionLon],
    ];

    map.fitBounds(bounds, {
      padding: [90, 90],
      maxZoom: 10,
      animate: true,
    });
  }, [map, opportunity]);

  return null;
}

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
