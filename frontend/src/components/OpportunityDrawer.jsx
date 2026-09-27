import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  useMap,
} from "react-leaflet";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import "leaflet/dist/leaflet.css";


const GEORGIA_COLOR = "#2563eb";
const DOMINION_COLOR = "#f97316";
const CONNECTION_COLOR = "#dc2626";

const DEFAULT_WIDTH = 650;
const MIN_WIDTH = 480;


export default function OpportunityDrawer({
  opportunity,
  onClose,
  onOpenDashboard,
}) {

  const [drawerWidth, setDrawerWidth] =
    useState(DEFAULT_WIDTH);

  const [isResizing, setIsResizing] =
    useState(false);

  const resizingRef = useRef(false);


  /* =========================================================
     RESIZE DRAWER
  ========================================================= */

  const startResize = (event) => {
    event.preventDefault();

    resizingRef.current = true;
    setIsResizing(true);

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  };


  useEffect(() => {

    const handleMouseMove = (event) => {

      if (!resizingRef.current) {
        return;
      }

      /*
       * Drawer is attached to the RIGHT side.
       * Therefore its width is:
       *
       * browser width - mouse X position
       */

      const newWidth =
        window.innerWidth - event.clientX;


      const maxWidth =
        window.innerWidth * 0.9;


      const clampedWidth =
        Math.min(
          Math.max(
            newWidth,
            MIN_WIDTH
          ),
          maxWidth
        );


      setDrawerWidth(clampedWidth);
    };


    const stopResize = () => {

      if (!resizingRef.current) {
        return;
      }

      resizingRef.current = false;

      setIsResizing(false);

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };


    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "mouseup",
      stopResize
    );


    return () => {

      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "mouseup",
        stopResize
      );

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

  }, []);


  if (!opportunity) {
    return null;
  }


  return (

    <>

      {/* BACKDROP */}

      <div
        className="drawer-backdrop"
        onClick={onClose}
      />


      {/* DRAWER */}

      <aside
        className={
          `opportunity-drawer ${
            isResizing
              ? "drawer-resizing"
              : ""
          }`
        }
        style={{
          width: `${drawerWidth}px`,
        }}
      >

        {/* =================================================
            RESIZE HANDLE
        ================================================== */}

        <div
          className="drawer-resize-handle"
          onMouseDown={startResize}
          title="Drag to resize"
        >

          <div className="drawer-resize-indicator" />

        </div>


        {/* HEADER */}

        <div className="drawer-header">

          <div>

            <p className="eyebrow">
              COORDINATION OPPORTUNITY
            </p>

            <h2>
              Opportunity Details
            </h2>

          </div>


          <button
            className="drawer-close"
            onClick={onClose}
            aria-label="Close opportunity details"
          >
            ×
          </button>

        </div>


        {/* MAP */}

        <div className="drawer-map">

          <MapContainer
            key={
              `${opportunity.georgiaId}-${opportunity.dominionId}`
            }
            center={[
              (
                opportunity.georgiaLat +
                opportunity.dominionLat
              ) / 2,

              (
                opportunity.georgiaLon +
                opportunity.dominionLon
              ) / 2,
            ]}
            zoom={8}
            style={{
              height: "100%",
              width: "100%",
            }}
            scrollWheelZoom={false}
          >

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            <Polyline
              positions={[
                [
                  opportunity.georgiaLat,
                  opportunity.georgiaLon,
                ],
                [
                  opportunity.dominionLat,
                  opportunity.dominionLon,
                ],
              ]}
              pathOptions={{
                color: CONNECTION_COLOR,
                weight: 4,
                dashArray: "8 7",
              }}
            />


            <CircleMarker
              center={[
                opportunity.georgiaLat,
                opportunity.georgiaLon,
              ]}
              radius={9}
              pathOptions={{
                color: GEORGIA_COLOR,
                fillColor: GEORGIA_COLOR,
                fillOpacity: 1,
                weight: 3,
              }}
            />


            <CircleMarker
              center={[
                opportunity.dominionLat,
                opportunity.dominionLon,
              ]}
              radius={9}
              pathOptions={{
                color: DOMINION_COLOR,
                fillColor: DOMINION_COLOR,
                fillOpacity: 1,
                weight: 3,
              }}
            />


            <ResizeMap drawerWidth={drawerWidth} />

          </MapContainer>

        </div>


        {/* METRICS */}

        <div className="drawer-metrics">

          <div className="drawer-metric">

            <span>
              Distance
            </span>

            <strong>
              {opportunity.distance} mi
            </strong>

          </div>


          <div className="drawer-metric">

            <span>
              Timeline gap
            </span>

            <strong>
              {formatDays(
                opportunity.timeGapDays
              )}
            </strong>

          </div>

        </div>


        {/* GEORGIA */}

        <ProjectSection
          utility="Georgia Power"
          colorClass="ga-dot"
          projectName={
            opportunity.georgiaName
          }
          projectId={
            opportunity.georgiaId
          }
          date={
            opportunity.georgiaDate
          }
        />


        <div className="drawer-connection">

          <div className="connection-line" />

          <span>
            within 25 mile threshold
          </span>

          <div className="connection-line" />

        </div>


        {/* DOMINION */}

        <ProjectSection
          utility="Dominion Energy South Carolina"
          colorClass="sc-dot"
          projectName={
            opportunity.dominionName
          }
          projectId={
            opportunity.dominionId
          }
          date={
            opportunity.dominionDate
          }
        />


        {/* STATUS */}

        <div className="drawer-status">

          <div className="status-row">

            <span>
              Geographic overlap
            </span>

            <strong className="status-success">
              ✓ Detected
            </strong>

          </div>


          <div className="status-row">

            <span>
              Threshold
            </span>

            <strong>
              &lt; 25 miles
            </strong>

          </div>


          <div className="status-row">

            <span>
              Timeline difference
            </span>

            <strong>
              {formatDays(
                opportunity.timeGapDays
              )}
            </strong>

          </div>

        </div>


        {/* FOOTER */}

        <div className="drawer-footer">

          <button
            className="open-dashboard-button"
            onClick={onOpenDashboard}
          >

            Open in Dashboard Map

            <span>→</span>

          </button>

        </div>

      </aside>

    </>

  );
}


/* =========================================================
   FORCE LEAFLET TO RESIZE WITH DRAWER
========================================================= */

function ResizeMap({ drawerWidth }) {

  const map = useMap();


  useEffect(() => {

    const timeout =
      setTimeout(() => {

        map.invalidateSize();

      }, 10);


    return () =>
      clearTimeout(timeout);

  }, [map, drawerWidth]);


  return null;
}


/* =========================================================
   PROJECT SECTION
========================================================= */

function ProjectSection({
  utility,
  colorClass,
  projectName,
  projectId,
  date,
}) {

  return (

    <div className="drawer-project">

      <div className="drawer-project-title">

        <span
          className={
            `drawer-project-dot ${colorClass}`
          }
        />

        <span>
          {utility}
        </span>

      </div>


      <h3>
        {projectName}
      </h3>


      <div className="drawer-project-meta">

        <span>

          Project ID

          <strong>
            {projectId}
          </strong>

        </span>


        <span>

          In-Service

          <strong>
            {formatDate(date)}
          </strong>

        </span>

      </div>

    </div>

  );
}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

  if (!value) {
    return "Unknown";
  }


  const date =
    new Date(
      `${value}T00:00:00`
    );


  return date.toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );
}


/* =========================================================
   DAYS
========================================================= */

function formatDays(days) {

  if (
    days === null ||
    days === undefined
  ) {
    return "Unknown";
  }


  if (days === 0) {
    return "Same date";
  }


  if (days < 60) {
    return `${days} days`;
  }


  const months =
    Math.round(days / 30.44);


  if (months < 24) {
    return `${months} months`;
  }


  return `${(
    days / 365.25
  ).toFixed(1)} years`;
}