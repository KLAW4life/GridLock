import { useMemo, useState } from "react";
import OpportunityDrawer from "./OpportunityDrawer";


export default function AnalysisPage({
  data,
  onViewOpportunity,
}) {

  const [sortBy, setSortBy] = useState("distance");

  // Opportunity currently open in the drawer
  const [selectedOpportunity, setSelectedOpportunity] =
    useState(null);


  /*
   * Keep the original array index so we can still
   * open this exact opportunity on the dashboard map.
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
   * Summary statistics
   */

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
          ) / data.overlaps.length
        ).toFixed(1)
      : "—";


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
            Examine the geographic and timeline
            relationships behind the coordination
            opportunities detected between Georgia
            Power and Dominion Energy South Carolina.
          </p>

        </div>

      </section>


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
          OPPORTUNITY TABLE
      ====================================================== */}

      <section className="analysis-content analysis-content-full">

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


                      {/* GEORGIA */}

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


                      {/* DOMINION */}

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


                      {/* DISTANCE */}

                      <td>

                        <span className="distance-pill">
                          {item.distance} mi
                        </span>

                      </td>


                      {/* TIMELINE */}

                      <td>

                        {item.timeGapDays !== null
                          ? formatDays(
                              item.timeGapDays
                            )
                          : "Unknown"}

                      </td>


                      {/* INSPECT */}

                      <td>

                        <button
                          className="view-map-button"
                          onClick={() =>
                            setSelectedOpportunity(
                              item
                            )
                          }
                        >
                          View Details
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

      </section>


      {/* =====================================================
          DRAWER
      ====================================================== */}

      <OpportunityDrawer
        opportunity={selectedOpportunity}
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


  const years =
    (days / 365.25).toFixed(1);


  return `${years} years`;
}