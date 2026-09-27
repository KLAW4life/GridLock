resources: []
export default function EmergencyDrawer({
  event,
  affectedProjects,
  affectedOpportunities,
  resources,
  onClose,
  onViewMap,
}) {

  if (!event.active) {
    return null;
  }


  return (

    <>

      <div
        className="drawer-backdrop"
        onClick={onClose}
      />


      <aside className="emergency-drawer">


        {/* =================================================
            HEADER
        ================================================== */}

        <div className="emergency-header">

          <div>

            <p className="emergency-eyebrow">
              ⚠ ACTIVE DISTURBANCE
            </p>

            <h2>
              {event.label}
            </h2>

            <p>
              Live Gridlock sensor event
            </p>

          </div>


          <button
            className="drawer-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        {/* =================================================
            EVENT TYPE
        ================================================== */}

        <div className="emergency-alert">

          <div className="emergency-alert-icon">
            {getEventIcon(event.type)}
          </div>


          <div>

            <span>
              LIVE SENSOR DETECTION
            </span>

            <strong>
              {event.label}
            </strong>

            <p>
              {getEventDescription(
                event.type
              )}
            </p>

          </div>

        </div>


        {/* =================================================
            IMPACT SUMMARY
        ================================================== */}

        <section className="emergency-section">

          <div className="emergency-section-title">

            <span>
              EVENT IMPACT
            </span>

          </div>


          <div className="impact-grid">

            <ImpactMetric
              value={
                affectedProjects.length
              }
              label="Affected projects"
            />


            <ImpactMetric
              value={
                affectedOpportunities.length
              }
              label="Affected opportunities"
            />

          </div>

        </section>


        {/* =================================================
            AFFECTED INFRASTRUCTURE
        ================================================== */}

        <section className="emergency-section">

          <div className="emergency-section-title">

            <span>
              AFFECTED INFRASTRUCTURE
            </span>

            <span className="urgent-badge">
              URGENT
            </span>

          </div>


          {affectedProjects.length > 0 ? (

            <div className="affected-project-list">

              {affectedProjects.map(
                (project, index) => (

                  <div
                    className="affected-project"
                    key={
                      `${project.utility}-${project.id}-${index}`
                    }
                  >

                    <span
                      className={
                        `affected-project-dot ${
                          project.utility ===
                          "Georgia Power"
                            ? "ga-dot"
                            : "sc-dot"
                        }`
                      }
                    />


                    <div>

                      <small>
                        {project.utility}
                      </small>

                      <strong>
                        {project.name}
                      </strong>

                      <span>
                        ID {project.id}
                      </span>

                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <p className="emergency-empty-text">
              No projects currently fall inside
              the simulated impact area.
            </p>

          )}

        </section>


        {/* =================================================
            RESPONSE RESOURCES
        ================================================== */}

        <section className="emergency-section">

          <div className="emergency-section-title">

            <span>
              RESPONSE RESOURCES
            </span>

          </div>


          {resources.length > 0 ? (

            <div className="resource-list">

              {resources.map(
                (resource, index) => (

                  <div
                    className="resource-card"
                    key={resource.id}
                  >

                    <span className="resource-rank">
                      {index + 1}
                    </span>


                    <div>

                      <strong>
                        {resource.name}
                      </strong>

                      <span>
                        {resource.type}
                      </span>

                      <small>
                        {resource.distance} mi away
                      </small>

                    </div>

                  </div>

                )
              )}

            </div>

          ) : (

            <div className="resources-empty">

              <div className="resources-empty-icon">
                ◇
              </div>


              <strong>
                Resource data not yet available
              </strong>


              <p>
                Future resource datasets will
                enable Gridlock to identify and
                prioritize nearby crews,
                equipment, and response assets.
              </p>


              <span className="integration-badge">
                DATA INTEGRATION PENDING
              </span>

            </div>

          )}

        </section>


        {/* =================================================
            BUTTON
        ================================================== */}

        <div className="emergency-footer">

          <button
            className="emergency-map-button"
            onClick={onViewMap}
          >

            View Full Emergency Map

            <span>
              →
            </span>

          </button>

        </div>

      </aside>

    </>

  );
}


/* =========================================================
   METRIC
========================================================= */

function ImpactMetric({
  value,
  label,
}) {

  return (

    <div className="impact-metric">

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
   EVENT ICON
========================================================= */

function getEventIcon(type) {

  if (type === "heat") {
    return "♨";
  }


  if (type === "grid") {
    return "⚡";
  }


  if (type === "physical") {
    return "◉";
  }


  return "⚠";
}


/* =========================================================
   DESCRIPTION
========================================================= */

function getEventDescription(type) {

  if (type === "heat") {

    return (
      "Thermal conditions exceeded the simulated operating threshold."
    );

  }


  if (type === "grid") {

    return (
      "Simulated electrical load exceeded the configured grid threshold."
    );

  }


  if (type === "physical") {

    return (
      "A physical disturbance was detected, simulating infrastructure impacts from events such as severe storms or seismic activity."
    );

  }


  return (
    "A live grid disturbance has been detected."
  );
}