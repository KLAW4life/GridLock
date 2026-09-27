import { useMemo, useState } from "react";

import OpportunityDrawer from "./OpportunityDrawer.jsx";


export default function AnalysisPage({
  data,
  onViewOpportunity,
  emergencyEvent,
  affectedOpportunities = [],
}) {

  const [view, setView] =
    useState("opportunities");

  const [sortBy, setSortBy] =
    useState("distance");

  const [
    selectedOpportunity,
    setSelectedOpportunity,
  ] = useState(null);


  /* =========================================================
     CHANGE VIEW
  ========================================================= */

  const handleViewChange = (newView) => {

    setView(newView);

    if (newView === "opportunities") {
      setSortBy("distance");
    } else {
      setSortBy("name");
    }

  };


  /* =========================================================
     CHECK IF OPPORTUNITY IS AFFECTED
  ========================================================= */

  const isAffectedOpportunity = (opportunity) => {

    if (!emergencyEvent?.active) {
      return false;
    }

    return affectedOpportunities.some(
      (affected) =>
        String(affected.georgiaId).trim() ===
          String(opportunity.georgiaId).trim() &&
        String(affected.dominionId).trim() ===
          String(opportunity.dominionId).trim()
    );

  };


  /* =========================================================
     OPPORTUNITY DATA
  ========================================================= */

  const opportunities = useMemo(() => {

    const rows =
      data.overlaps.map(
        (item, index) => ({
          ...item,
          originalIndex: index,
        })
      );


    if (sortBy === "timeline") {

      return [...rows].sort(
        (a, b) => {

          const aGap =
            a.timeGapDays ?? Infinity;

          const bGap =
            b.timeGapDays ?? Infinity;

          return aGap - bGap;

        }
      );

    }


    return [...rows].sort(
      (a, b) =>
        a.distance - b.distance
    );

  }, [data.overlaps, sortBy]);


  /* =========================================================
     GEORGIA PROJECTS
  ========================================================= */

  const georgiaProjects = useMemo(() => {

    const projects =
      [...data.georgia];


    if (sortBy === "date") {

      return projects.sort(
        (a, b) =>
          compareDates(
            a.date,
            b.date
          )
      );

    }


    return projects.sort(
      (a, b) =>
        (a.name || "")
          .localeCompare(
            b.name || ""
          )
    );

  }, [data.georgia, sortBy]);


  /* =========================================================
     DOMINION PROJECTS
  ========================================================= */

  const dominionProjects = useMemo(() => {

    const projects =
      [...data.dominion];


    if (sortBy === "date") {

      return projects.sort(
        (a, b) =>
          compareDates(
            a.date,
            b.date
          )
      );

    }


    return projects.sort(
      (a, b) =>
        (a.name || "")
          .localeCompare(
            b.name || ""
          )
    );

  }, [data.dominion, sortBy]);


  /* =========================================================
     SUMMARY STATISTICS
  ========================================================= */

  const closest =
    data.overlaps.length > 0
      ? [...data.overlaps].sort(
          (a, b) =>
            a.distance - b.distance
        )[0]
      : null;


  const knownTimeline =
    data.overlaps.filter(
      (item) =>
        item.timeGapDays !== null
    );


  const closestTimeline =
    knownTimeline.length > 0
      ? [...knownTimeline].sort(
          (a, b) =>
            a.timeGapDays -
            b.timeGapDays
        )[0]
      : null;


  const averageDistance =
    data.overlaps.length > 0
      ? (
          data.overlaps.reduce(
            (total, item) =>
              total + item.distance,
            0
          ) /
          data.overlaps.length
        ).toFixed(1)
      : "—";


  /* =========================================================
     PAGE
  ========================================================= */

  return (

    <div className="analysis-page">


      {/* =====================================================
          HERO
      ====================================================== */}

      <section className="analysis-hero">

        <div>

          <p className="eyebrow">
            COORDINATION INTELLIGENCE
          </p>

          <h1>
            Cross-Utility Analysis
          </h1>

          <p>
            Explore planned transmission projects
            from both utilities and examine the
            geographic and timeline relationships
            behind detected coordination
            opportunities.
          </p>

        </div>

      </section>


      {/* =====================================================
          ACTIVE EVENT NOTICE
      ====================================================== */}

      {emergencyEvent?.active && (

        <div className="analysis-emergency-notice">

          <div className="analysis-emergency-notice-left">

            <span className="analysis-emergency-symbol">
              ⚠
            </span>

            <div>

              <strong>
                LIVE GRID EVENT
              </strong>

              <span>
                {emergencyEvent.label}
              </span>

            </div>

          </div>


          <div className="analysis-emergency-notice-right">

            <strong>
              {affectedOpportunities.length}
            </strong>

            <span>
              affected coordination opportunity
              {affectedOpportunities.length === 1
                ? ""
                : "s"}
            </span>

          </div>

        </div>

      )}


      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <section className="analysis-summary">

        <SummaryCard
          label="Detected opportunities"
          value={data.overlaps.length}
          description="Project pairs inside the geographic threshold."
        />


        <SummaryCard
          label="Closest projects"
          value={
            closest
              ? `${closest.distance} mi`
              : "—"
          }
          description={
            closest
              ? `${closest.georgiaName} ↔ ${closest.dominionName}`
              : "No opportunity detected."
          }
        />


        <SummaryCard
          label="Average distance"
          value={
            averageDistance === "—"
              ? "—"
              : `${averageDistance} mi`
          }
          description="Average separation across detected opportunities."
        />


        <SummaryCard
          label="Smallest timeline gap"
          value={
            closestTimeline
              ? formatDays(
                  closestTimeline.timeGapDays
                )
              : "—"
          }
          description="Smallest known scheduling difference."
        />

      </section>


      {/* =====================================================
          TABLE
      ====================================================== */}

      <section className="analysis-content analysis-content-full">

        <div className="analysis-table-card">


          {/* =================================================
              HEADER
          ================================================== */}

          <div className="analysis-table-header">

            <div>

              <p className="eyebrow">
                PROJECT EXPLORER
              </p>

              <h2>

                {view === "opportunities" &&
                  "Detected Coordination Opportunities"}

                {view === "georgia" &&
                  "Georgia Power Projects"}

                {view === "dominion" &&
                  "Dominion Energy South Carolina Projects"}

              </h2>


              <p>

                {view === "opportunities" &&
                  "Project pairs detected within the 25-mile geographic threshold."}

                {view === "georgia" &&
                  `${data.georgia.length} planned Georgia Power projects in the dataset.`}

                {view === "dominion" &&
                  `${data.dominion.length} planned Dominion Energy South Carolina projects in the dataset.`}

              </p>

            </div>


            {/* =============================================
                CONTROLS
            ============================================== */}

            <div className="analysis-controls">


              {/* VIEW */}

              <div className="sort-control">

                <label htmlFor="view">
                  View
                </label>

                <select
                  id="view"
                  value={view}
                  onChange={(event) =>
                    handleViewChange(
                      event.target.value
                    )
                  }
                >

                  <option value="opportunities">
                    Coordination Opportunities
                  </option>

                  <option value="georgia">
                    Georgia Power
                  </option>

                  <option value="dominion">
                    Dominion Energy SC
                  </option>

                </select>

              </div>


              {/* SORT */}

              <div className="sort-control">

                <label htmlFor="sort">
                  Sort by
                </label>

                <select
                  id="sort"
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(
                      event.target.value
                    )
                  }
                >

                  {view === "opportunities" ? (

                    <>

                      <option value="distance">
                        Geographic Distance
                      </option>

                      <option value="timeline">
                        Timeline Gap
                      </option>

                    </>

                  ) : (

                    <>

                      <option value="name">
                        Project Name
                      </option>

                      <option value="date">
                        In-Service Date
                      </option>

                    </>

                  )}

                </select>

              </div>

            </div>

          </div>


          {/* =================================================
              OPPORTUNITY VIEW
          ================================================== */}

          {view === "opportunities" && (

            <OpportunityTable
              opportunities={
                opportunities
              }
              onSelect={
                setSelectedOpportunity
              }
              isAffectedOpportunity={
                isAffectedOpportunity
              }
              emergencyEvent={
                emergencyEvent
              }
            />

          )}


          {/* =================================================
              GEORGIA VIEW
          ================================================== */}

          {view === "georgia" && (

            <GeorgiaTable
              projects={
                georgiaProjects
              }
            />

          )}


          {/* =================================================
              DOMINION VIEW
          ================================================== */}

          {view === "dominion" && (

            <DominionTable
              projects={
                dominionProjects
              }
            />

          )}

        </div>

      </section>


      {/* =====================================================
          OPPORTUNITY DRAWER
      ====================================================== */}

      <OpportunityDrawer
        opportunity={
          selectedOpportunity
        }
        onClose={() =>
          setSelectedOpportunity(null)
        }
        onOpenDashboard={() => {

          if (!selectedOpportunity) {
            return;
          }

          onViewOpportunity(
            selectedOpportunity.originalIndex
          );

        }}
      />

    </div>

  );

}


/* =========================================================
   OPPORTUNITY TABLE
========================================================= */

function OpportunityTable({
  opportunities,
  onSelect,
  isAffectedOpportunity,
  emergencyEvent,
}) {

  return (

    <div className="analysis-table-wrapper">

      <table className="analysis-table">

        <thead>

          <tr>

            <th>
              Opportunity
            </th>

            <th>
              Georgia Power
            </th>

            <th>
              Dominion Energy SC
            </th>

            <th>
              Distance
            </th>

            <th>
              Timeline Gap
            </th>

            <th>
              Details
            </th>

          </tr>

        </thead>


        <tbody>

          {opportunities.map(
            (item, index) => {

              const affected =
                isAffectedOpportunity(item);

              return (

                <tr
                  key={
                    `${item.georgiaId}-${item.dominionId}-${index}`
                  }
                  className={
                    affected
                      ? "affected-opportunity-row"
                      : ""
                  }
                >


                  {/* OPPORTUNITY NUMBER */}

                  <td>

                    <div className="opportunity-number-cell">

                      <span className="table-rank">
                        #{index + 1}
                      </span>


                      {affected && (

                        <span className="table-urgent-badge">
                          ⚠ URGENT
                        </span>

                      )}

                    </div>

                  </td>


                  {/* GEORGIA */}

                  <td>

                    <ProjectCell
                      name={
                        item.georgiaName
                      }
                      id={
                        item.georgiaId
                      }
                      dotClass="ga-dot"
                    />

                  </td>


                  {/* DOMINION */}

                  <td>

                    <ProjectCell
                      name={
                        item.dominionName
                      }
                      id={
                        item.dominionId
                      }
                      dotClass="sc-dot"
                    />

                  </td>


                  {/* DISTANCE */}

                  <td>

                    <span
                      className={
                        affected
                          ? "distance-pill emergency-distance-pill"
                          : "distance-pill"
                      }
                    >

                      {item.distance} mi

                    </span>

                  </td>


                  {/* TIMELINE */}

                  <td>

                    {formatDays(
                      item.timeGapDays
                    )}

                  </td>


                  {/* DETAILS */}

                  <td>

                    <button
                      className={
                        affected
                          ? "view-map-button emergency-details-button"
                          : "view-map-button"
                      }
                      onClick={() =>
                        onSelect(item)
                      }
                    >

                      {affected &&
                      emergencyEvent?.active
                        ? "View Event"
                        : "View Details"}

                    </button>

                  </td>

                </tr>

              );

            }
          )}

        </tbody>

      </table>

    </div>

  );

}


/* =========================================================
   GEORGIA TABLE
========================================================= */

function GeorgiaTable({
  projects,
}) {

  return (

    <div className="analysis-table-wrapper">

      <table className="analysis-table project-inventory-table">

        <thead>

          <tr>

            <th>
              #
            </th>

            <th>
              Project
            </th>

            <th>
              Project ID
            </th>

            <th>
              In-Service
            </th>

            <th>
              Sponsor
            </th>

            <th>
              Location
            </th>

          </tr>

        </thead>


        <tbody>

          {projects.map(
            (project, index) => (

              <tr
                key={
                  `ga-${project.id}-${index}`
                }
              >

                <td>

                  <span className="table-rank">
                    {index + 1}
                  </span>

                </td>


                <td>

                  <ProjectCell
                    name={
                      project.name
                    }
                    dotClass="ga-dot"
                  />

                </td>


                <td>
                  {project.id}
                </td>


                <td>
                  {formatDate(
                    project.date
                  )}
                </td>


                <td>
                  {project.sponsor || "—"}
                </td>


                <td>

                  <ProjectLocation
                    location1={
                      project.location1
                    }
                    location2={
                      project.location2
                    }
                  />

                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>

  );

}


/* =========================================================
   DOMINION TABLE
========================================================= */

function DominionTable({
  projects,
}) {

  return (

    <div className="analysis-table-wrapper">

      <table className="analysis-table project-inventory-table">

        <thead>

          <tr>

            <th>
              #
            </th>

            <th>
              Project
            </th>

            <th>
              Project ID
            </th>

            <th>
              In-Service
            </th>

            <th>
              Status
            </th>

            <th>
              Location
            </th>

          </tr>

        </thead>


        <tbody>

          {projects.map(
            (project, index) => (

              <tr
                key={
                  `sc-${project.id}-${index}`
                }
              >

                <td>

                  <span className="table-rank">
                    {index + 1}
                  </span>

                </td>


                <td>

                  <ProjectCell
                    name={
                      project.name
                    }
                    dotClass="sc-dot"
                  />

                </td>


                <td>
                  {project.id}
                </td>


                <td>
                  {formatDate(
                    project.date
                  )}
                </td>


                <td>
                  {project.status || "—"}
                </td>


                <td>
                  {project.location || "—"}
                </td>

              </tr>

            )
          )}

        </tbody>

      </table>

    </div>

  );

}


/* =========================================================
   PROJECT CELL
========================================================= */

function ProjectCell({
  name,
  id,
  dotClass,
}) {

  return (

    <div className="table-project">

      <span
        className={
          `mini-dot ${dotClass}`
        }
      />

      <div>

        <strong>
          {name || "Unnamed Project"}
        </strong>


        {id && (

          <small>
            ID {id}
          </small>

        )}

      </div>

    </div>

  );

}


/* =========================================================
   LOCATION
========================================================= */

function ProjectLocation({
  location1,
  location2,
}) {

  if (!location1 && !location2) {
    return "—";
  }


  if (
    location1 &&
    location2
  ) {

    return (

      <div className="project-location">

        <span>
          {location1}
        </span>

        <span className="location-arrow">
          →
        </span>

        <span>
          {location2}
        </span>

      </div>

    );

  }


  return (
    location1 ||
    location2
  );

}


/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  description,
}) {

  return (

    <div className="analysis-summary-card">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      <p>
        {description}
      </p>

    </div>

  );

}


/* =========================================================
   DATE SORTING
========================================================= */

function compareDates(
  dateA,
  dateB
) {

  if (!dateA && !dateB) {
    return 0;
  }

  if (!dateA) {
    return 1;
  }

  if (!dateB) {
    return -1;
  }

  return (
    new Date(dateA) -
    new Date(dateB)
  );

}


/* =========================================================
   FORMAT DATE
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
   FORMAT DAYS
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
    Math.round(
      days / 30.44
    );


  if (months < 24) {
    return `${months} months`;
  }


  const years =
    (
      days / 365.25
    ).toFixed(1);


  return `${years} years`;

}