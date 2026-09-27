import {
  useEffect,
  useMemo,
  useState,
} from "react";

import GridMap from "./components/GridMap";
import OpportunityList from "./components/OpportunityList";
import AnalysisPage from "./components/AnalysisPage";

import InfrastructureMap from "./components/InfrastructureMap";
import InfrastructureOpportunityList from "./components/InfrastructureOpportunityList";

import "./index.css";

import useArduinoSerial from "./hooks/useArduinoSerial";
import LiveGridMonitor from "./components/LiveGridMonitor";
import EmergencyDrawer from "./components/EmergencyDrawer";

import {
  calculateInfrastructureOpportunities,
  normalizeInfrastructureCollection,
} from "./utils/infrastructureAnalysis.js";


export default function App() {

  /* =========================================================
     PLANNED PROJECT DATA
  ========================================================= */

  const [data, setData] =
    useState(null);


  /* =========================================================
     INFRASTRUCTURE DATA
  ========================================================= */

  const [
    infrastructureData,
    setInfrastructureData,
  ] = useState(null);


  const [
    infrastructureLoading,
    setInfrastructureLoading,
  ] = useState(true);


  const [
    infrastructureError,
    setInfrastructureError,
  ] = useState("");


  /* =========================================================
     MAP DATASET MODE
  ========================================================= */

  const [mapDataset, setMapDataset] =
    useState("planned");


  /* =========================================================
     SELECTIONS
  ========================================================= */

  const [
    selectedOverlap,
    setSelectedOverlap,
  ] = useState(null);


  const [
    selectedInfrastructureOpportunity,
    setSelectedInfrastructureOpportunity,
  ] = useState(null);


  /* =========================================================
     PAGE
  ========================================================= */

  const [page, setPage] =
    useState("dashboard");


  /* =========================================================
     MAP LAYERS
  ========================================================= */

  const [layers, setLayers] =
    useState({
      georgia: true,
      dominion: true,
      overlaps: true,
    });


  const [error, setError] =
    useState("");


  /* =========================================================
     EMERGENCY
  ========================================================= */

  const [
    emergencyOpen,
    setEmergencyOpen,
  ] = useState(false);


  /* =========================================================
     ARDUINO
  ========================================================= */

  const {
    connected,
    sensorData,
    error: sensorError,
    connect,
    disconnect,
  } = useArduinoSerial();


  /* =========================================================
     LOAD PLANNED PROJECT DATA
  ========================================================= */

  useEffect(() => {

    fetch("/gridlock-data.json")

      .then((response) => {

        if (!response.ok) {
          throw new Error(
            "Could not load gridlock-data.json"
          );
        }

        return response.json();

      })

      .then(setData)

      .catch((err) =>
        setError(err.message)
      );

  }, []);


  /* =========================================================
     LOAD INFRASTRUCTURE GEOJSON
  ========================================================= */

  useEffect(() => {

    async function loadInfrastructure() {

      try {

        setInfrastructureLoading(
          true
        );

        setInfrastructureError("");


        const [
          georgiaResponse,
          dominionResponse,
        ] =
          await Promise.all([
            fetch(
              "/georgia-power-infrastructure.geojson"
            ),

            fetch(
              "/dominion-infrastructure.geojson"
            ),
          ]);


        if (
          !georgiaResponse.ok ||
          !dominionResponse.ok
        ) {

          throw new Error(
            "Could not load infrastructure GeoJSON files."
          );

        }


        const [
          georgiaGeoJSON,
          dominionGeoJSON,
        ] =
          await Promise.all([
            georgiaResponse.json(),
            dominionResponse.json(),
          ]);


        const georgia =
          normalizeInfrastructureCollection(
            georgiaGeoJSON,
            "Georgia Power"
          );


        const dominion =
          normalizeInfrastructureCollection(
            dominionGeoJSON,
            "Dominion Energy SC"
          );


        setInfrastructureData({
          georgia,
          dominion,
        });

      }

      catch (err) {

        console.error(err);

        setInfrastructureError(
          err.message
        );

      }

      finally {

        setInfrastructureLoading(
          false
        );

      }

    }


    loadInfrastructure();

  }, []);


  /* =========================================================
     INFRASTRUCTURE OPPORTUNITIES
  ========================================================= */

  const infrastructureOpportunities =
    useMemo(() => {

      if (
        !infrastructureData
      ) {
        return [];
      }


      return calculateInfrastructureOpportunities(
        infrastructureData.georgia,
        infrastructureData.dominion,
        25
      );

    }, [
      infrastructureData,
    ]);


  /* =========================================================
     SELECTED PLANNED OPPORTUNITY
  ========================================================= */

  const selectedOpportunity =
    useMemo(() => {

      if (
        selectedOverlap === null ||
        !data
      ) {
        return null;
      }


      return (
        data.overlaps[
          selectedOverlap
        ] ?? null
      );

    }, [
      data,
      selectedOverlap,
    ]);


  /* =========================================================
     EMERGENCY EVENT
  ========================================================= */

  const emergencyEvent =
    useMemo(() => {

      if (
        sensorData.tiltEvent
      ) {

        return {
          active: true,
          type: "physical",
          label:
            "Physical Disturbance",
        };

      }


      if (
        sensorData.thermalAlarm
      ) {

        return {
          active: true,
          type: "heat",
          label:
            "Extreme Heat",
        };

      }


      if (
        sensorData.loadAlarm
      ) {

        return {
          active: true,
          type: "grid",
          label:
            "Grid Stress",
        };

      }


      return {
        active: false,
        type: null,
        label:
          "System Normal",
      };

    }, [sensorData]);


  /* =========================================================
     DEMO EMERGENCY OPPORTUNITY
  ========================================================= */

  const emergencyOpportunity =
    useMemo(() => {

      if (!data) {
        return null;
      }


      const demo =
        data.overlaps.find(
          (opportunity) =>

            String(
              opportunity.georgiaId
            ).trim() ===
              "20509" &&

            String(
              opportunity.dominionId
            ).trim() ===
              "6808 S"
        );


      return (
        demo ??
        data.overlaps[0] ??
        null
      );

    }, [data]);


  /* =========================================================
     AFFECTED PROJECTS
  ========================================================= */

  const affectedProjects =
    useMemo(() => {

      if (
        !emergencyEvent.active ||
        !emergencyOpportunity
      ) {
        return [];
      }


      return [

        {
          id:
            emergencyOpportunity.georgiaId,

          name:
            emergencyOpportunity.georgiaName,

          utility:
            "Georgia Power",

          lat:
            emergencyOpportunity.georgiaLat,

          lon:
            emergencyOpportunity.georgiaLon,
        },


        {
          id:
            emergencyOpportunity.dominionId,

          name:
            emergencyOpportunity.dominionName,

          utility:
            "Dominion Energy SC",

          lat:
            emergencyOpportunity.dominionLat,

          lon:
            emergencyOpportunity.dominionLon,
        },

      ];

    }, [
      emergencyEvent.active,
      emergencyOpportunity,
    ]);


  /* =========================================================
     AFFECTED OPPORTUNITIES
  ========================================================= */

  const affectedOpportunities =
    useMemo(() => {

      if (
        !emergencyEvent.active ||
        !emergencyOpportunity
      ) {
        return [];
      }


      return [
        emergencyOpportunity,
      ];

    }, [
      emergencyEvent.active,
      emergencyOpportunity,
    ]);


  /* =========================================================
     RESPONSE RESOURCES
  ========================================================= */

  const responseResources = [];


  /* =========================================================
     AUTO OPEN EMERGENCY
  ========================================================= */

  useEffect(() => {

    if (
      emergencyEvent.active
    ) {
      setEmergencyOpen(true);
    }

  }, [
    emergencyEvent.active,
  ]);


  /* =========================================================
     MAP LAYERS
  ========================================================= */

  const toggleLayer =
    (name) => {

      setLayers(
        (current) => ({
          ...current,

          [name]:
            !current[name],
        })
      );

    };


  /* =========================================================
     OPEN PLANNED OPPORTUNITY
  ========================================================= */

  const openOpportunityOnMap =
    (index) => {

      setSelectedOverlap(
        index
      );

      setMapDataset(
        "planned"
      );

      setPage(
        "dashboard"
      );

    };


  /* =========================================================
     OPEN EMERGENCY
  ========================================================= */

  const openEmergencyOnMap =
    () => {

      setEmergencyOpen(false);

      setMapDataset(
        "planned"
      );

      setPage(
        "dashboard"
      );


      if (
        !emergencyOpportunity
      ) {
        return;
      }


      const index =
        data.overlaps.findIndex(
          (opportunity) =>
            opportunity ===
            emergencyOpportunity
        );


      if (index !== -1) {
        setSelectedOverlap(
          index
        );
      }

    };


  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {

    return (

      <main className="loading-screen">

        <h1>
          Gridlock
        </h1>

        <p>
          {error}
        </p>

      </main>

    );

  }


  /* =========================================================
     LOADING
  ========================================================= */

  if (!data) {

    return (

      <main className="loading-screen">

        <div className="loading-bolt">
          ⚡
        </div>

        <h1>
          Loading Gridlock...
        </h1>

      </main>

    );

  }


  /* =========================================================
     APP
  ========================================================= */

  return (

    <main className="app">


      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="topbar">

        <div
          className="brand"
          onClick={() =>
            setPage(
              "dashboard"
            )
          }
          style={{
            cursor:
              "pointer",
          }}
        >

          <span className="brand-mark">
            ⚡
          </span>


          <div>

            <strong>
              GRIDLOCK
            </strong>

            <small>
              Cross-utility transmission intelligence
            </small>

          </div>

        </div>


        <div className="topbar-right">

          <nav className="main-nav">

            <button
              className={
                page ===
                "dashboard"
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() =>
                setPage(
                  "dashboard"
                )
              }
            >
              Dashboard
            </button>


            <button
              className={
                page ===
                "analysis"
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={() =>
                setPage(
                  "analysis"
                )
              }
            >
              Analysis
            </button>

          </nav>


          <LiveGridMonitor
            connected={
              connected
            }
            event={
              emergencyEvent
            }
            onConnect={
              connect
            }
            onDisconnect={
              disconnect
            }
            onOpenEvent={() =>
              setEmergencyOpen(
                true
              )
            }
          />


          <span className="hackathon-badge">
            ShellHacks 2026
          </span>

        </div>

      </header>


      {sensorError && (

        <div className="sensor-error-banner">

          <strong>
            Sensor connection:
          </strong>

          {" "}

          {sensorError}

        </div>

      )}


      {/* =====================================================
          DASHBOARD
      ====================================================== */}

      {page ===
        "dashboard" && (

        <>


          {/* HERO */}

          <section className="hero">

            <div className="hero-copy">

              <p className="eyebrow">
                TRANSMISSION COORDINATION
              </p>


              <h1>
                Find where the grid should work together.
              </h1>


              <p className="hero-description">

                Compare planned projects
                and mapped infrastructure
                across neighboring utility
                systems.

              </p>

            </div>


            <div className="stats">

              {mapDataset ===
              "planned" ? (

                <>

                  <Stat
                    value={
                      data.georgia.length
                    }
                    label="Georgia projects"
                  />

                  <Stat
                    value={
                      data.dominion.length
                    }
                    label="Dominion projects"
                  />

                  <Stat
                    value={
                      data.overlaps.length
                    }
                    label="Opportunities"
                  />

                  <Stat
                    value={`<${
                      data.metadata
                        ?.overlapDistanceMiles ??
                      25
                    } mi`}
                    label="Overlap threshold"
                  />

                </>

              ) : (

                <>

                  <Stat
                    value={
                      infrastructureData
                        ?.georgia
                        .length ??
                      "—"
                    }
                    label="Georgia infrastructure"
                  />

                  <Stat
                    value={
                      infrastructureData
                        ?.dominion
                        .length ??
                      "—"
                    }
                    label="Dominion infrastructure"
                  />

                  <Stat
                    value={
                      infrastructureOpportunities
                        .length
                    }
                    label="Proximity matches"
                  />

                  <Stat
                    value="<25 mi"
                    label="Distance threshold"
                  />

                </>

              )}

            </div>

          </section>


          {/* ===============================================
              DATASET SWITCHER
          ================================================ */}

          <section className="dataset-switch-section">

            <div className="dataset-switch-copy">

              <p className="eyebrow">
                MAP DATASET
              </p>

              <strong>

                {mapDataset ===
                "planned"
                  ? "Planned Project Data"
                  : "Infrastructure Query Data"}

              </strong>

              <span>

                {mapDataset ===
                "planned"
                  ? "Utility planning records with geographic and timeline analysis."
                  : "Query-derived mapped power infrastructure with geographic proximity analysis."}

              </span>

            </div>


            <div className="dataset-toggle">

              <button
                type="button"
                className={
                  mapDataset ===
                  "planned"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMapDataset(
                    "planned"
                  )
                }
              >
                Planned Projects

                <small>
                  Planning dataset
                </small>

              </button>


              <button
                type="button"
                className={
                  mapDataset ===
                  "infrastructure"
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setMapDataset(
                    "infrastructure"
                  )
                }
              >
                Infrastructure

                <small>
                  Query dataset
                </small>

              </button>

            </div>

          </section>


          {/* EMERGENCY */}

          {emergencyEvent.active && (

            <section className="dashboard-emergency-banner">

              <div className="dashboard-emergency-left">

                <span className="dashboard-emergency-icon">
                  ⚠
                </span>

                <div>

                  <strong>
                    ACTIVE GRID EVENT
                  </strong>

                  <span>
                    {
                      emergencyEvent.label
                    }
                  </span>

                </div>

              </div>


              <button
                type="button"
                onClick={() =>
                  setEmergencyOpen(
                    true
                  )
                }
              >
                View Event
              </button>

            </section>

          )}


          {/* ===============================================
              PLANNED PROJECT MAP
          ================================================ */}

          {mapDataset ===
            "planned" && (

            <section className="dashboard">

              <div className="map-panel">

                <div className="map-toolbar">

                  <div>

                    <p className="toolbar-title">
                      Planned project layers
                    </p>

                    <p className="toolbar-subtitle">
                      Toggle projects and
                      detected overlaps.
                    </p>

                  </div>


                  <div className="layer-buttons">

                    <LayerButton
                      active={
                        layers.georgia
                      }
                      onClick={() =>
                        toggleLayer(
                          "georgia"
                        )
                      }
                      label="Georgia Power"
                      dotClass="ga-dot"
                    />

                    <LayerButton
                      active={
                        layers.dominion
                      }
                      onClick={() =>
                        toggleLayer(
                          "dominion"
                        )
                      }
                      label="Dominion"
                      dotClass="sc-dot"
                    />

                    <LayerButton
                      active={
                        layers.overlaps
                      }
                      onClick={() =>
                        toggleLayer(
                          "overlaps"
                        )
                      }
                      label="Opportunities"
                      dotClass="overlap-dot"
                    />

                  </div>

                </div>


                <div className="map-wrap">

                  <GridMap
                    data={
                      data
                    }
                    layers={
                      layers
                    }
                    selectedOverlap={
                      selectedOverlap
                    }
                    selectedOpportunity={
                      selectedOpportunity
                    }
                    onSelectOverlap={
                      setSelectedOverlap
                    }
                    emergencyEvent={
                      emergencyEvent
                    }
                    affectedProjects={
                      affectedProjects
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
                overlaps={
                  data.overlaps
                }
                selected={
                  selectedOverlap
                }
                setSelected={
                  setSelectedOverlap
                }
                emergencyEvent={
                  emergencyEvent
                }
                affectedOpportunities={
                  affectedOpportunities
                }
              />

            </section>

          )}


          {/* ===============================================
              INFRASTRUCTURE MAP
          ================================================ */}

          {mapDataset ===
            "infrastructure" && (

            <section className="dashboard">

              <div className="map-panel">

                <div className="map-toolbar">

                  <div>

                    <p className="toolbar-title">
                      Infrastructure layers
                    </p>

                    <p className="toolbar-subtitle">
                      Query-derived utility
                      infrastructure and
                      cross-utility proximity.
                    </p>

                  </div>


                  <div className="infrastructure-source-badge">
                    QUERY DATA
                  </div>

                </div>


                <div className="map-wrap">

                  {infrastructureLoading ? (

                    <div className="infrastructure-map-state">
                      Loading infrastructure...
                    </div>

                  ) : infrastructureError ? (

                    <div className="infrastructure-map-state error">
                      {
                        infrastructureError
                      }
                    </div>

                  ) : (

                    <InfrastructureMap
                      georgiaFeatures={
                        infrastructureData
                          ?.georgia ??
                        []
                      }
                      dominionFeatures={
                        infrastructureData
                          ?.dominion ??
                        []
                      }
                      opportunities={
                        infrastructureOpportunities
                      }
                      selectedOpportunity={
                        selectedInfrastructureOpportunity
                      }
                      onSelectOpportunity={
                        setSelectedInfrastructureOpportunity
                      }
                    />

                  )}

                </div>


                <div className="map-legend">

                  <span>
                    <i className="legend-dot ga-dot" />
                    Georgia Power infrastructure
                  </span>

                  <span>
                    <i className="legend-dot sc-dot" />
                    Dominion Energy SC infrastructure
                  </span>

                  <span>
                    <i className="legend-line" />
                    Cross-utility proximity
                  </span>

                </div>

              </div>


              <InfrastructureOpportunityList
                opportunities={
                  infrastructureOpportunities
                }
                selected={
                  selectedInfrastructureOpportunity
                }
                setSelected={
                  setSelectedInfrastructureOpportunity
                }
              />

            </section>

          )}

        </>

      )}


      {/* =====================================================
          ANALYSIS PAGE
      ====================================================== */}

      {page ===
        "analysis" && (

        <AnalysisPage
          data={
            data
          }
          onViewOpportunity={
            openOpportunityOnMap
          }
          emergencyEvent={
            emergencyEvent
          }
          affectedOpportunities={
            affectedOpportunities
          }
        />

      )}


      {/* =====================================================
          EMERGENCY DRAWER
      ====================================================== */}

      <EmergencyDrawer
        event={
          emergencyOpen
            ? emergencyEvent
            : {
                ...emergencyEvent,
                active: false,
              }
        }
        affectedProjects={
          affectedProjects
        }
        affectedOpportunities={
          affectedOpportunities
        }
        resources={
          responseResources
        }
        onClose={() =>
          setEmergencyOpen(
            false
          )
        }
        onViewMap={
          openEmergencyOnMap
        }
      />

    </main>

  );

}


/* =========================================================
   STAT
========================================================= */

function Stat({
  value,
  label,
}) {

  return (

    <div className="stat">

      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

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
        `layer-button ${
          active
            ? "active"
            : ""
        }`
      }
      onClick={
        onClick
      }
      aria-pressed={
        active
      }
    >

      <i
        className={
          `legend-dot ${dotClass}`
        }
      />

      {label}

    </button>

  );

}