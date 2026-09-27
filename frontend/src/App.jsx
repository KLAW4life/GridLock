import { useEffect, useMemo, useState } from "react";
import GridMap from "./components/GridMap";
import OpportunityList from "./components/OpportunityList";
import AnalysisPage from "./components/AnalysisPage";
import "./index.css";

export default function App() {
  const [data, setData] = useState(null);

  const [selectedOverlap, setSelectedOverlap] = useState(null);

  // Dashboard or Analysis
  const [page, setPage] = useState("dashboard");

  const [layers, setLayers] = useState({
    georgia: true,
    dominion: true,
    overlaps: true,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/gridlock-data.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load gridlock-data.json");
        }

        return response.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  const selectedOpportunity = useMemo(() => {
    if (selectedOverlap === null || !data) {
      return null;
    }

    return data.overlaps[selectedOverlap] ?? null;
  }, [data, selectedOverlap]);

  const toggleLayer = (name) => {
    setLayers((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  const openOpportunityOnMap = (index) => {
    setSelectedOverlap(index);
    setPage("dashboard");
  };

  if (error) {
    return (
      <main className="loading-screen">
        <h1>Gridlock</h1>

        <p>{error}</p>

        <p>
          Run create_overlap_table.py first so the JSON file is generated.
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="loading-screen">
        <div className="loading-bolt">⚡</div>

        <h1>Loading Gridlock...</h1>
      </main>
    );
  }

  return (
    <main className="app">

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="topbar">

        <div
          className="brand"
          onClick={() => setPage("dashboard")}
          style={{ cursor: "pointer" }}
        >
          <span className="brand-mark">⚡</span>

          <div>
            <strong>GRIDLOCK</strong>

            <small>
              Cross-utility transmission intelligence
            </small>
          </div>
        </div>


        <div className="topbar-right">

          <nav className="main-nav">

            <button
              className={
                page === "dashboard"
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() => setPage("dashboard")}
            >
              Dashboard
            </button>


            <button
              className={
                page === "analysis"
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() => setPage("analysis")}
            >
              Analysis
            </button>

          </nav>


          <span className="hackathon-badge">
            ShellHacks 2026
          </span>

        </div>

      </header>


      {/* =====================================================
          DASHBOARD PAGE
      ====================================================== */}

      {page === "dashboard" && (
        <>

          <section className="hero">

            <div className="hero-copy">

              <p className="eyebrow">
                TRANSMISSION COORDINATION
              </p>

              <h1>
                Find where the grid should work together.
              </h1>

              <p className="hero-description">
                Compare planned Georgia Power and Dominion
                Energy South Carolina projects and surface
                cross-utility coordination opportunities.
              </p>

            </div>


            <div className="stats">

              <Stat
                value={data.georgia.length}
                label="Georgia projects"
              />

              <Stat
                value={data.dominion.length}
                label="Dominion projects"
              />

              <Stat
                value={data.overlaps.length}
                label="Opportunities"
              />

              <Stat
                value={
                  `<${data.metadata?.overlapDistanceMiles ?? 25} mi`
                }
                label="Overlap threshold"
              />

            </div>

          </section>


          <section className="dashboard">

            <div className="map-panel">

              <div className="map-toolbar">

                <div>

                  <p className="toolbar-title">
                    Map layers
                  </p>

                  <p className="toolbar-subtitle">
                    Toggle planned projects and detected
                    overlaps.
                  </p>

                </div>


                <div className="layer-buttons">

                  <LayerButton
                    active={layers.georgia}
                    onClick={() =>
                      toggleLayer("georgia")
                    }
                    label="Georgia Power"
                    dotClass="ga-dot"
                  />


                  <LayerButton
                    active={layers.dominion}
                    onClick={() =>
                      toggleLayer("dominion")
                    }
                    label="Dominion"
                    dotClass="sc-dot"
                  />


                  <LayerButton
                    active={layers.overlaps}
                    onClick={() =>
                      toggleLayer("overlaps")
                    }
                    label="Opportunities"
                    dotClass="overlap-dot"
                  />

                </div>

              </div>


              <div className="map-wrap">

                <GridMap
                  data={data}
                  layers={layers}
                  selectedOverlap={selectedOverlap}
                  selectedOpportunity={
                    selectedOpportunity
                  }
                  onSelectOverlap={
                    setSelectedOverlap
                  }
                />

              </div>


              <div className="map-legend">

                <span>
                  <i className="legend-dot ga-dot" />
                  Georgia Power
                </span>

                <span>
                  <i className="legend-dot sc-dot" />
                  Dominion Energy SC
                </span>

                <span>
                  <i className="legend-line" />
                  Within 25 miles
                </span>

              </div>

            </div>


            <OpportunityList
              overlaps={data.overlaps}
              selected={selectedOverlap}
              setSelected={setSelectedOverlap}
            />

          </section>

        </>
      )}


      {/* =====================================================
          ANALYSIS PAGE
      ====================================================== */}

      {page === "analysis" && (

        <AnalysisPage
          data={data}
          onViewOpportunity={openOpportunityOnMap}
        />

      )}

    </main>
  );
}


/* =========================================================
   STAT
========================================================= */

function Stat({ value, label }) {
  return (
    <div className="stat">

      <strong>{value}</strong>

      <span>{label}</span>

    </div>
  );
}


/* =========================================================
   LAYER BUTTON
========================================================= */

function LayerButton({
  active,
  onClick,
  label,
  dotClass,
}) {
  return (
    <button
      type="button"
      className={
        `layer-button ${active ? "active" : ""}`
      }
      onClick={onClick}
      aria-pressed={active}
    >

      <i
        className={`legend-dot ${dotClass}`}
      />

      {label}

    </button>
  );
}