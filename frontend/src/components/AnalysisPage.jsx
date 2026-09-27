import { useMemo, useState } from "react";


export default function AnalysisPage({
  data,
  onViewOpportunity,
}) {

  const [sortBy, setSortBy] =
    useState("distance");


  /*
   * Keep the original index because that index
   * identifies the same opportunity on the map.
   */
  const opportunities = useMemo(() => {

    const rows = data.overlaps.map(
      (item, index) => ({
        ...item,
        originalIndex: index,
      })
    );


    if (sortBy === "timeline") {

      return [...rows].sort((a, b) => {

        const aGap =
          a.timeGapDays ?? Infinity;

        const bGap =
          b.timeGapDays ?? Infinity;

        return aGap - bGap;

      });

    }


    return [...rows].sort(
      (a, b) => a.distance - b.distance
    );

  }, [data.overlaps, sortBy]);


  /*
   * Simple descriptive metrics derived directly
   * from the overlap data.
   */

  const closest =
    opportunities.length > 0
      ? [...opportunities].sort(
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
          ) / data.overlaps.length
        ).toFixed(1)
      : "—";


  return (

    <div className="analysis-page">

      {/* ==========================================
          PAGE HEADER
      =========================================== */}

      <section className="analysis-hero">

        <div>

          <p className="eyebrow">
            COORDINATION INTELLIGENCE
          </p>

          <h1>
            Cross-Utility Analysis
          </h1>

          <p>
            Examine the geographic and timeline
            relationships behind the coordination
            opportunities detected between Georgia
            Power and Dominion Energy South Carolina.
          </p>

        </div>

      </section>


      {/* ==========================================
          SUMMARY CARDS
      =========================================== */}

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


      {/* ==========================================
          MAIN ANALYSIS
      =========================================== */}

      <section className="analysis-content">

        <div className="analysis-table-card">

          <div className="analysis-table-header">

            <div>

              <p className="eyebrow">
                OPPORTUNITY MATRIX
              </p>

              <h2>
                Detected Coordination Opportunities
              </h2>

              <p>
                Geographic proximity is the primary
                signal. Timeline difference provides
                additional scheduling context.
              </p>

            </div>


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

                <option value="distance">
                  Geographic distance
                </option>

                <option value="timeline">
                  Timeline gap
                </option>

              </select>

            </div>

          </div>


          {/* ======================================
              TABLE
          ======================================= */}

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
                    Map
                  </th>

                </tr>

              </thead>


              <tbody>

                {opportunities.map(
                  (item, index) => (

                    <tr
                      key={
                        `${item.georgiaId}-${item.dominionId}-${index}`
                      }
                    >

                      <td>

                        <span className="table-rank">
                          #{index + 1}
                        </span>

                      </td>


                      <td>

                        <div className="table-project">

                          <span className="mini-dot ga-dot" />

                          <div>

                            <strong>
                              {item.georgiaName}
                            </strong>

                            <small>
                              ID {item.georgiaId}
                            </small>

                          </div>

                        </div>

                      </td>


                      <td>

                        <div className="table-project">

                          <span className="mini-dot sc-dot" />

                          <div>

                            <strong>
                              {item.dominionName}
                            </strong>

                            <small>
                              ID {item.dominionId}
                            </small>

                          </div>

                        </div>

                      </td>


                      <td>

                        <span className="distance-pill">

                          {item.distance} mi

                        </span>

                      </td>


                      <td>

                        {item.timeGapDays !== null
                          ? formatDays(
                              item.timeGapDays
                            )
                          : "Unknown"}

                      </td>


                      <td>

                        <button
                          className="view-map-button"
                          onClick={() =>
                            onViewOpportunity(
                              item.originalIndex
                            )
                          }
                        >
                          View Map
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>


        {/* ==========================================
            EXPLANATION
        =========================================== */}

        <div className="method-card">

          <p className="eyebrow">
            HOW GRIDLOCK WORKS
          </p>

          <h2>
            Detection Method
          </h2>


          <div className="method-step">

            <span>01</span>

            <div>

              <strong>
                Locate planned projects
              </strong>

              <p>
                Public utility project locations
                are converted into geographic
                coordinates.
              </p>

            </div>

          </div>


          <div className="method-step">

            <span>02</span>

            <div>

              <strong>
                Compare utilities
              </strong>

              <p>
                Georgia Power projects are compared
                against Dominion Energy South
                Carolina projects.
              </p>

            </div>

          </div>


          <div className="method-step">

            <span>03</span>

            <div>

              <strong>
                Detect geographic overlap
              </strong>

              <p>
                Project pairs whose calculated
                center-to-center distance is under
                25 miles are flagged.
              </p>

            </div>

          </div>


          <div className="method-step">

            <span>04</span>

            <div>

              <strong>
                Compare timelines
              </strong>

              <p>
                Planned in-service dates are
                compared to provide additional
                coordination context.
              </p>

            </div>

          </div>

        </div>

      </section>

    </div>
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
   FORMAT DAYS
========================================================= */

function formatDays(days) {

  if (days === null || days === undefined) {
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

  const years =
    (days / 365.25).toFixed(1);

  return `${years} years`;
}