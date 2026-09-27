import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { GoogleGenAI } from "@google/genai";

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

dotenv.config({
  path: path.join(
    __dirname,
    "..",
    ".env"
  ),
});


if (!process.env.GEMINI_API_KEY) {

  console.error(
    "ERROR: GEMINI_API_KEY was not found in .env"
  );

  process.exit(1);
}

const ai =
  new GoogleGenAI({
    apiKey:
      process.env.GEMINI_API_KEY,
  });


/* =========================================================
   LOAD GRIDLOCK FINANCIAL MODEL
========================================================= */

const dataPath =
  path.join(
    __dirname,
    "data",
    "collaboration-savings.json"
  );


if (!fs.existsSync(dataPath)) {

  console.error(
    "ERROR: collaboration-savings.json was not found."
  );

  console.error(
    "Run: python export_collaboration_data.py"
  );

  process.exit(1);
}


const collaborationData =
  JSON.parse(
    fs.readFileSync(
      dataPath,
      "utf8"
    )
  );


/* =========================================================
   EXPRESS
========================================================= */

const app =
  express();


app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
  })
);


app.use(
  express.json()
);

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      status: "ok",
      service:
        "Gridlock AI",
      opportunities:
        collaborationData
          .opportunities
          .length,
    });

  }
);


/* =========================================================
   GET DETERMINISTIC COST DATA
========================================================= */

app.get(
  "/api/opportunities/:georgiaId/:dominionId/costs",

  (req, res) => {

    const {
      georgiaId,
      dominionId,
    } = req.params;


    const opportunity =
      findOpportunity(
        georgiaId,
        dominionId
      );


    if (!opportunity) {

      return res
        .status(404)
        .json({
          error:
            "No collaboration cost model was found for this opportunity.",
        });

    }


    res.json({
      opportunity,
      metadata:
        collaborationData.metadata,
    });

  }
);


/* =========================================================
   AI COST ANALYSIS
========================================================= */

app.post(
  "/api/opportunities/:georgiaId/:dominionId/analyze",

  async (req, res) => {

    try {

      const {
        georgiaId,
        dominionId,
      } = req.params;


      /*
       * IMPORTANT:
       *
       * We find the cost data SERVER-SIDE.
       *
       * We do NOT trust financial values sent by
       * the browser.
       */

      const opportunity =
        findOpportunity(
          georgiaId,
          dominionId
        );


      if (!opportunity) {

        return res
          .status(404)
          .json({
            error:
              "No collaboration cost model was found for this opportunity.",
          });

      }


      /* =====================================================
         PROMPT

         Gemini interprets the deterministic model.
         It does NOT calculate new savings.
      ===================================================== */

      const prompt = `
You are the Gridlock Coordination Analysis Agent.

Gridlock identifies potential coordination opportunities between planned electric transmission projects operated by neighboring utilities.

Your job is to explain a PRE-CALCULATED prototype cost model.

CRITICAL RULES:

1. Do NOT invent, estimate, modify, recalculate, or replace any dollar value.
2. Every financial number must come directly from the supplied JSON.
3. The "totalPotentialSavings" value is the official modeled savings value for this analysis.
4. The savings categories must exactly match the supplied values.
5. Clearly distinguish modeled potential savings from guaranteed savings.
6. Do not claim these are actual Georgia Power or Dominion internal financial figures.
7. Explain how geographic proximity, schedule alignment, shared equipment, logistics, contracting, and bulk procurement contribute to the modeled opportunity.
8. If timing alignment is weak, explicitly acknowledge that limitation.
9. Keep the analysis concise and useful to a utility planning professional.
10. Do not add additional financial categories.

PROJECT DATA:

${JSON.stringify(
  opportunity,
  null,
  2
)}

Return JSON only.

Use exactly this structure:

{
  "summary": "2-3 sentence explanation",
  "keyDriver": "single strongest modeled coordination driver",
  "coordinationActions": [
    "action 1",
    "action 2",
    "action 3"
  ],
  "riskFactors": [
    "risk or limitation 1",
    "risk or limitation 2"
  ],
  "confidenceNote": "one short sentence explaining that this is a prototype modeled estimate"
}
`;


      /* =====================================================
         CALL GEMINI
      ===================================================== */

      const response =
        await ai.models.generateContent({

          model:
            "gemini-3.7-flash",

          contents:
            prompt,

          config: {

            responseMimeType:
              "application/json",

            temperature:
              0.2,

          },

        });


      /* =====================================================
         PARSE RESPONSE
      ===================================================== */

      let analysis;


      try {

        analysis =
          JSON.parse(
            response.text
          );

      }

      catch {

        console.error(
          "Gemini returned invalid JSON:",
          response.text
        );


        return res
          .status(502)
          .json({
            error:
              "Gemini returned an invalid analysis response.",
          });

      }


      /* =====================================================
         RETURN BOTH

         Financial values = our model
         Explanation = Gemini
      ===================================================== */

      res.json({

        opportunity,

        analysis,

        metadata:
          collaborationData.metadata,

      });

    }

    catch (error) {

      console.error(
        "Gemini analysis error:",
        error
      );


      res
        .status(500)
        .json({
          error:
            "The AI cost analysis could not be generated.",
        });

    }

  }
);


/* =========================================================
   FIND OPPORTUNITY
========================================================= */

function findOpportunity(
  georgiaId,
  dominionId
) {

  return (
    collaborationData
      .opportunities
      .find(
        (opportunity) =>

          String(
            opportunity
              .georgiaProjectId
          ).trim() ===
            String(
              georgiaId
            ).trim() &&

          String(
            opportunity
              .dominionProjectId
          ).trim() ===
            String(
              dominionId
            ).trim()

      ) ?? null
  );

}


/* =========================================================
   START SERVER
========================================================= */

const PORT =
  process.env.PORT ||
  3001;


app.listen(
  PORT,
  () => {

    console.log();
    console.log(
      "========================================"
    );

    console.log(
      "GRIDLOCK AI SERVER"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Running on http://localhost:${PORT}`
    );

    console.log(
      `Loaded ${collaborationData.opportunities.length} coordination opportunities`
    );

    console.log(
      "Gemini API key loaded: YES"
    );

    console.log();

  }
);