import {
  formatPowerType,
  infrastructureDisplayName,
} from "../utils/infrastructureAnalysis.js";


export default function InfrastructureOpportunityList({
  opportunities,
  selected,
  setSelected,
}) {

  /*
   * Only show the strongest/closest opportunities
   * in the side panel.
   */

  const displayed =
    opportunities.slice(
      0,
      20
    );


  return (

    <div className="opportunity-panel infrastructure-opportunity-panel">


      <div className="opportunity-panel-header">

        <p className="eyebrow">
          INFRASTRUCTURE ANALYSIS
        </p>


        <h2>
          Infrastructure Proximity
        </h2>


        <p>
          Cross-utility infrastructure
          ranked by geographic proximity.
        </p>

      </div>


      <div className="infrastructure-analysis-note">

        <strong>
          Query-derived infrastructure
        </strong>

        <span>
          Timeline ranking is not applied
          because these features do not
          consistently contain comparable
          project schedules.
        </span>

      </div>


      <div className="opportunity-scroll">

        {displayed.length === 0 ? (

          <div className="infrastructure-empty">

            No cross-utility infrastructure
            was found inside the selected
            distance threshold.

          </div>

        ) : (

          displayed.map(
            (
              opportunity,
              index
            ) => {

              const isSelected =
                selected ===
                index;


              return (

                <button
                  key={
                    opportunity.id
                  }
                  type="button"
                  className={
                    `infrastructure-opportunity ${
                      isSelected
                        ? "selected"
                        : ""
                    }`
                  }
                  onClick={() =>
                    setSelected(
                      index
                    )
                  }
                >

                  {/* RANK */}

                  <div className="infrastructure-rank">

                    #{index + 1}

                  </div>


                  {/* CONTENT */}

                  <div className="infrastructure-opportunity-content">


                    {/* GEORGIA */}

                    <div className="infrastructure-project">

                      <span className="mini-dot ga-dot" />

                      <div>

                        <small>
                          GEORGIA POWER
                        </small>

                        <strong>
                          {infrastructureDisplayName(
                            opportunity.georgia
                          )}
                        </strong>

                        <span>
                          {formatPowerType(
                            opportunity
                              .georgia
                              .power
                          )}
                        </span>

                      </div>

                    </div>


                    {/* CONNECTION */}

                    <div className="infrastructure-connection">

                      <span />

                      <strong>
                        {
                          opportunity.distance
                        }{" "}
                        mi
                      </strong>

                      <span />

                    </div>


                    {/* DOMINION */}

                    <div className="infrastructure-project">

                      <span className="mini-dot sc-dot" />

                      <div>

                        <small>
                          DOMINION ENERGY SC
                        </small>

                        <strong>
                          {infrastructureDisplayName(
                            opportunity.dominion
                          )}
                        </strong>

                        <span>
                          {formatPowerType(
                            opportunity
                              .dominion
                              .power
                          )}
                        </span>

                      </div>

                    </div>


                    <div className="infrastructure-metrics">

                      <span className="distance-pill">
                        {
                          opportunity.distance
                        }{" "}
                        mi
                      </span>

                      <span className="geo-match-badge">
                        GEOGRAPHIC MATCH
                      </span>

                    </div>

                  </div>

                </button>

              );

            }
          )

        )}

      </div>

    </div>

  );

}