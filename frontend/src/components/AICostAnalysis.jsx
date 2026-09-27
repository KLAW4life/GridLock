import {
  useEffect,
  useState,
} from "react";


export default function AICostAnalysis({
  opportunity,
}) {

  const [data, setData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =========================================================
     RESET WHEN OPPORTUNITY CHANGES
  ========================================================= */

  useEffect(() => {

    setData(null);
    setError("");
    setLoading(false);

  }, [
    opportunity?.georgiaId,
    opportunity?.dominionId,
  ]);


  if (!opportunity) {
    return null;
  }


  /* =========================================================
     GENERATE ANALYSIS
  ========================================================= */

  async function generateAnalysis() {

    try {

      setLoading(true);
      setError("");


      const georgiaId =
        encodeURIComponent(
          opportunity.georgiaId
        );


      const dominionId =
        encodeURIComponent(
          opportunity.dominionId
        );


      const response =
        await fetch(
          `http://localhost:3001/api/opportunities/${georgiaId}/${dominionId}/analyze`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },
          }
        );


      const result =
        await response.json();


      if (!response.ok) {

        throw new Error(
          result.error ||
          "AI analysis failed."
        );

      }


      setData(result);

    }

    catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Could not generate AI cost analysis."
      );

    }

    finally {

      setLoading(false);

    }

  }


  /* =========================================================
     BEFORE GENERATION
  ========================================================= */

  if (!data) {

    return (

      <section className="ai-cost-analysis">

        <div className="ai-cost-header">

          <div className="ai-cost-title">

            <span className="ai-spark">
              ✦
            </span>

            <div>

              <span className="ai-label">
                GRIDLOCK AI
              </span>

              <h3>
                Collaboration Cost Analysis
              </h3>

            </div>

          </div>


          <span className="ai-badge">
            GEMINI
          </span>

        </div>


        <p className="ai-cost-intro">

          Analyze modeled resource and
          financial data to identify where
          coordination could reduce duplicated
          project costs.

        </p>


        {error && (

          <div className="ai-cost-error">
            {error}
          </div>

        )}


        <button
          type="button"
          className="generate-ai-button"
          onClick={
            generateAnalysis
          }
          disabled={
            loading
          }
        >

          {loading ? (

            <>
              <span className="ai-spinner" />
              Analyzing opportunity...
            </>

          ) : (

            <>
              ✦ Analyze Cost Savings
            </>

          )}

        </button>


        <p className="ai-prototype-note">

          Uses prototype modeled financial
          and resource data. Estimates are
          not actual utility internal costs.

        </p>

      </section>

    );

  }


  /* =========================================================
     RESULT
  ========================================================= */

  const {
    opportunity:
      cost,

    analysis,

  } = data;


  const savings =
    cost.savings;


  return (

    <section className="ai-cost-analysis generated">


      {/* HEADER */}

      <div className="ai-cost-header">

        <div className="ai-cost-title">

          <span className="ai-spark">
            ✦
          </span>

          <div>

            <span className="ai-label">
              GRIDLOCK AI
            </span>

            <h3>
              Collaboration Cost Analysis
            </h3>

          </div>

        </div>


        <span className="ai-badge">
          GEMINI
        </span>

      </div>


      {/* ===============================================
          BIG SAVINGS NUMBER
      ================================================ */}

      <div className="ai-savings-hero">

        <span>
          ESTIMATED POTENTIAL SAVINGS
        </span>

        <strong>
          {formatCurrency(
            savings
              .totalPotentialSavings
          )}
        </strong>

        <small>
          {formatPercent(
            savings.savingsPercent
          )}{" "}
          of modeled combined project cost
        </small>

      </div>


      {/* ===============================================
          BASELINE VS COLLABORATIVE
      ================================================ */}

      <div className="ai-cost-comparison">

        <div>

          <span>
            Separate execution
          </span>

          <strong>
            {formatCurrency(
              cost
                .projectCosts
                .baselineSeparateCost
            )}
          </strong>

        </div>


        <span className="cost-arrow">
          →
        </span>


        <div>

          <span>
            Coordinated execution
          </span>

          <strong className="collaborative-cost">
            {formatCurrency(
              savings
                .estimatedCollaborativeCost
            )}
          </strong>

        </div>

      </div>


      {/* ===============================================
          BREAKDOWN
      ================================================ */}

      <div className="ai-section">

        <div className="ai-section-heading">

          <span>
            SAVINGS BREAKDOWN
          </span>

          <small>
            Modeled values
          </small>

        </div>


        <SavingsRow
          label="Equipment sharing"
          value={
            savings.equipment
          }
          total={
            savings
              .totalPotentialSavings
          }
        />


        <SavingsRow
          label="Contractor coordination"
          value={
            savings.contracting
          }
          total={
            savings
              .totalPotentialSavings
          }
        />


        <SavingsRow
          label="Bulk material purchasing"
          value={
            savings.bulkMaterials
          }
          total={
            savings
              .totalPotentialSavings
          }
        />


        <SavingsRow
          label="Logistics coordination"
          value={
            savings.logistics
          }
          total={
            savings
              .totalPotentialSavings
          }
        />

      </div>


      {/* ===============================================
          SHARED RESOURCES
      ================================================ */}

      <div className="ai-section">

        <div className="ai-section-heading">

          <span>
            SHAREABLE RESOURCES
          </span>

        </div>


        <div className="shared-resource-grid">

          <Resource
            value={
              cost
                .sharedResources
                .bucketTrucks
            }
            label="Bucket trucks"
          />

          <Resource
            value={
              cost
                .sharedResources
                .diggerDerricks
            }
            label="Digger derricks"
          />

          <Resource
            value={
              cost
                .sharedResources
                .cranes
            }
            label="Cranes"
          />

          <Resource
            value={
              cost
                .sharedResources
                .excavators
            }
            label="Excavators"
          />

        </div>

      </div>


      {/* ===============================================
          GEMINI ANALYSIS
      ================================================ */}

      <div className="ai-agent-response">

        <div className="ai-agent-heading">

          <span className="ai-spark">
            ✦
          </span>

          <strong>
            AI ANALYSIS
          </strong>

        </div>


        <p>
          {analysis.summary}
        </p>


        <div className="ai-driver">

          <span>
            PRIMARY DRIVER
          </span>

          <strong>
            {analysis.keyDriver}
          </strong>

        </div>


        {analysis
          .coordinationActions
          ?.length > 0 && (

          <div className="ai-actions">

            <span className="ai-mini-heading">
              RECOMMENDED COORDINATION
            </span>

            {analysis
              .coordinationActions
              .map(
                (
                  action,
                  index
                ) => (

                  <div
                    className="ai-action"
                    key={
                      index
                    }
                  >

                    <span>
                      {index + 1}
                    </span>

                    <p>
                      {action}
                    </p>

                  </div>

                )
              )}

          </div>

        )}


        {analysis
          .riskFactors
          ?.length > 0 && (

          <div className="ai-risks">

            <span className="ai-mini-heading">
              CONSTRAINTS
            </span>

            {analysis
              .riskFactors
              .map(
                (
                  risk,
                  index
                ) => (

                  <p key={index}>
                    • {risk}
                  </p>

                )
              )}

          </div>

        )}

      </div>


      {/* ===============================================
          MODEL DETAILS
      ================================================ */}

      <div className="ai-model-context">

        <span>
          {cost.distanceMiles} mi apart
        </span>

        <span>
          {formatTimeGap(
            cost.timeGapDays
          )}
        </span>

        <span>
          {cost.opportunityType}
        </span>

      </div>


      {/* ===============================================
          DISCLAIMER
      ================================================ */}

      <div className="ai-disclaimer">

        <strong>
          PROTOTYPE ESTIMATE
        </strong>

        <p>
          Resource requirements and financial
          values are modeled prototype
          estimates, not actual internal
          utility cost figures. Gemini explains
          the existing Gridlock cost model and
          does not determine the dollar
          amounts.
        </p>

      </div>


      <button
        type="button"
        className="rerun-ai-button"
        onClick={
          generateAnalysis
        }
        disabled={
          loading
        }
      >

        {loading
          ? "Reanalyzing..."
          : "↻ Reanalyze"}

      </button>

    </section>

  );

}


/* =========================================================
   SAVINGS ROW
========================================================= */

function SavingsRow({
  label,
  value,
  total,
}) {

  const percentage =
    total > 0
      ? Math.min(
          100,
          (value / total) *
            100
        )
      : 0;


  return (

    <div className="savings-row">

      <div className="savings-row-top">

        <span>
          {label}
        </span>

        <strong>
          {formatCurrency(
            value
          )}
        </strong>

      </div>


      <div className="savings-bar">

        <div
          style={{
            width:
              `${percentage}%`,
          }}
        />

      </div>

    </div>

  );

}


/* =========================================================
   RESOURCE
========================================================= */

function Resource({
  value,
  label,
}) {

  return (

    <div className="shared-resource">

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
   FORMATTERS
========================================================= */

function formatCurrency(
  value
) {

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }
  ).format(
    value || 0
  );

}


function formatPercent(
  value
) {

  return Number(
    value || 0
  ).toFixed(2) + "%";

}


function formatTimeGap(
  days
) {

  if (days === 0) {
    return "Same schedule";
  }


  if (days < 365) {
    return `${days} day gap`;
  }


  const years =
    days / 365;


  return `${years.toFixed(
    1
  )} year gap`;

}