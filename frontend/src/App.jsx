import { useEffect, useMemo, useState } from "react";
import GridMap from "./components/GridMap";
import OpportunityList from "./components/OpportunityList";
import AnalysisPage from "./components/AnalysisPage";
import "./index.css";

import useArduinoSerial from "./hooks/useArduinoSerial";
import LiveGridMonitor from "./components/LiveGridMonitor";
import EmergencyDrawer from "./components/EmergencyDrawer";


export default function App() {

  /* =========================================================
     EXISTING GRIDLOCK DATA
  ========================================================= */

  const [data, setData] = useState(null);

  const [selectedOverlap, setSelectedOverlap] =
    useState(null);

  const [page, setPage] =
    useState("dashboard");

  const [layers, setLayers] = useState({
    georgia: true,
    dominion: true,
    overlaps: true,
  });

  const [error, setError] =
    useState("");


  /* =========================================================
     EMERGENCY DRAWER
  ========================================================= */

  const [emergencyOpen, setEmergencyOpen] =
    useState(false);


  /* =========================================================
     ARDUINO CONNECTION
  ========================================================= */

  const {
    connected,
    sensorData,
    error: sensorError,
    connect,
    disconnect,
  } = useArduinoSerial();


  /* =========================================================
     LOAD GRIDLOCK DATA
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
     SELECTED OPPORTUNITY
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
        data.overlaps[selectedOverlap] ??
        null
      );

    }, [
      data,
      selectedOverlap,
    ]);


  /* =========================================================
     LIVE EMERGENCY EVENT
  ========================================================= */

  const emergencyEvent =
    useMemo(() => {

      /*
       * If more than one sensor triggers,
       * physical disturbance gets the
       * highest display priority.
       */


      // TILT SENSOR
      if (sensorData.tiltEvent) {

        return {
          active: true,

          type: "physical",

          label:
            "Physical Disturbance",
        };

      }


      // THERMISTOR
      if (sensorData.thermalAlarm) {

        return {
          active: true,

          type: "heat",

          label:
            "Extreme Heat",
        };

      }


      // POTENTIOMETER
      if (sensorData.loadAlarm) {

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
     HACKATHON DEMO EVENT LOCATION
  ========================================================= */

  /*
   * The Arduino currently detects the EVENT,
   * but it does not provide GPS coordinates.
   *
   * For the hackathon demonstration we associate
   * the disturbance with this coordination
   * opportunity.
   *
   * We're finding the 20509 ↔ 6808 S opportunity
   * specifically so changing table sorting later
   * won't accidentally change the demo location.
   */

  const emergencyOpportunity =
    useMemo(() => {

      if (!data) {
        return null;
      }


      const demoOpportunity =
        data.overlaps.find(
          (opportunity) =>

            String(
              opportunity.georgiaId
            ).trim() === "20509" &&

            String(
              opportunity.dominionId
            ).trim() === "6808 S"
        );


      /*
       * Fallback to the first opportunity
       * if the IDs aren't found.
       */

      return (
        demoOpportunity ??
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

  /*
   * KEEP THIS EMPTY FOR NOW.
   *
   * You don't have the real utility
   * resource dataset yet.
   *
   * The Emergency Drawer will show
   * "DATA INTEGRATION PENDING".
   *
   * Later we can populate this with
   * crews, equipment, response assets,
   * substations, etc.
   */

  const responseResources = [];


  /* =========================================================
     AUTO-OPEN EMERGENCY DRAWER
  ========================================================= */

  useEffect(() => {

    if (emergencyEvent.active) {

      setEmergencyOpen(true);

    }

  }, [emergencyEvent.active]);


  /* =========================================================
     TOGGLE MAP LAYERS
  ========================================================= */

  const toggleLayer = (name) => {

    setLayers((current) => ({
      ...current,

      [name]:
        !current[name],
    }));

  };


  /* =========================================================
     OPEN OPPORTUNITY FROM ANALYSIS PAGE
  ========================================================= */

  const openOpportunityOnMap =
    (index) => {

      setSelectedOverlap(index);

      setPage("dashboard");

    };


  /* =========================================================
     VIEW EMERGENCY ON MAP
  ========================================================= */

  const openEmergencyOnMap = () => {

    setEmergencyOpen(false);

    setPage("dashboard");


    if (!emergencyOpportunity) {
      return;
    }


    /*
     * Find the actual array index of
     * our emergency opportunity.
     */

    const index =
      data.overlaps.findIndex(
        (opportunity) =>
          opportunity ===
          emergencyOpportunity
      );


    if (index !== -1) {

      setSelectedOverlap(index);

    }

  };


  /* =========================================================
     ERROR SCREEN
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

        <p>
          Run create_overlap_table.py first
          so the JSON file is generated.
        </p>

      </main>

    );

  }


  /* =========================================================
     LOADING SCREEN
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
     APPLICATION
  ========================================================= */

  return (

    <main className="app">


      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <header className="topbar">


        {/* BRAND */}

        <div
          className="brand"

          onClick={() =>
            setPage("dashboard")
          }

          style={{
            cursor: "pointer",
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
              Cross-utility transmission
              intelligence
            </small>

          </div>

        </div>


        {/* =================================================
            NAVBAR RIGHT
        ================================================== */}

        <div className="topbar-right">


          {/* NAVIGATION */}

          <nav className="main-nav">

            <button
              className={
                page === "dashboard"
                  ? "nav-link active"
                  : "nav-link"
              }

              onClick={() =>
                setPage("dashboard")
              }
            >
              Dashboard
            </button>


            <button
              className={
                page === "analysis"
                  ? "nav-link active"
                  : "nav-link"
              }

              onClick={() =>
                setPage("analysis")
              }
            >
              Analysis
            </button>

          </nav>


          {/* =================================================
              LIVE ARDUINO MONITOR
          ================================================== */}

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
              setEmergencyOpen(true)
            }

          />


          {/* HACKATHON BADGE */}

          <span className="hackathon-badge">
            ShellHacks 2026
          </span>

        </div>

      </header>


      {/* =====================================================
          SENSOR ERROR
      ====================================================== */}

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
          DASHBOARD PAGE
      ====================================================== */}

      {page === "dashboard" && (

        <>


          {/* =================================================
              HERO
          ================================================== */}

          <section className="hero">

            <div className="hero-copy">

              <p className="eyebrow">
                TRANSMISSION COORDINATION
              </p>


              <h1>
                Find where the grid should
                work together.
              </h1>


              <p className="hero-description">

                Compare planned Georgia Power
                and Dominion Energy South
                Carolina projects and surface
                cross-utility coordination
                opportunities.

              </p>

            </div>


            {/* =============================================
                STATS
            ============================================== */}

            <div className="stats">


              <Stat
                value={
                  data.georgia.length
                }

                label=
                  "Georgia projects"
              />


              <Stat
                value={
                  data.dominion.length
                }

                label=
                  "Dominion projects"
              />


              <Stat
                value={
                  data.overlaps.length
                }

                label=
                  "Opportunities"
              />


              <Stat
                value={
                  `<${
                    data.metadata
                      ?.overlapDistanceMiles ??
                    25
                  } mi`
                }

                label=
                  "Overlap threshold"
              />

            </div>

          </section>


          {/* =================================================
              ACTIVE EMERGENCY BANNER
          ================================================== */}

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
                    {emergencyEvent.label}
                  </span>

                </div>

              </div>


              <div className="dashboard-emergency-impact">

                <span>

                  <strong>
                    {
                      affectedProjects.length
                    }
                  </strong>

                  affected projects

                </span>


                <span>

                  <strong>
                    {
                      affectedOpportunities.length
                    }
                  </strong>

                  affected opportunity

                </span>

              </div>


              <button
                type="button"

                onClick={() =>
                  setEmergencyOpen(true)
                }
              >
                View Event
              </button>

            </section>

          )}


          {/* =================================================
              DASHBOARD
          ================================================== */}

          <section className="dashboard">


            {/* =============================================
                MAP PANEL
            ============================================== */}

            <div className="map-panel">


              {/* MAP TOOLBAR */}

              <div className="map-toolbar">

                <div>

                  <p className="toolbar-title">
                    Map layers
                  </p>

                  <p className="toolbar-subtitle">

                    Toggle planned projects
                    and detected overlaps.

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

                    label=
                      "Georgia Power"

                    dotClass=
                      "ga-dot"

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

                    label=
                      "Dominion"

                    dotClass=
                      "sc-dot"

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

                    label=
                      "Opportunities"

                    dotClass=
                      "overlap-dot"

                  />

                </div>

              </div>


              {/* =========================================
                  MAP
              ========================================== */}

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


              {/* =========================================
                  LEGEND
              ========================================== */}

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


                {emergencyEvent.active && (

                  <span className="emergency-legend">

                    <i className="emergency-legend-dot" />

                    Urgent / affected

                  </span>

                )}

              </div>

            </div>


            {/* =============================================
                OPPORTUNITY LIST
            ============================================== */}

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

        </>

      )}


      {/* =====================================================
          ANALYSIS PAGE
      ====================================================== */}

      {page === "analysis" && (

        <AnalysisPage

          data={
            data
          }

          onViewOpportunity={
            openOpportunityOnMap
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
          setEmergencyOpen(false)
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