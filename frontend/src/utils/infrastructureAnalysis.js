/* =========================================================
   GRIDLOCK INFRASTRUCTURE ANALYSIS

   Analyzes Georgia Power and Dominion Energy SC
   GeoJSON point features.

   IMPORTANT:
   This is separate from the planned-project analysis.
========================================================= */


/* =========================================================
   HAVERSINE DISTANCE
========================================================= */

export function haversineMiles(
  lat1,
  lon1,
  lat2,
  lon2
) {
  const earthRadiusMiles = 3958.8;

  const toRadians = (degrees) =>
    (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadiusMiles * c;
}


/* =========================================================
   NORMALIZE GEOJSON FEATURE
========================================================= */

export function normalizeInfrastructureFeature(
  feature,
  utility,
  index
) {
  if (
    !feature?.geometry ||
    feature.geometry.type !== "Point"
  ) {
    return null;
  }

  const coordinates =
    feature.geometry.coordinates;

  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2
  ) {
    return null;
  }

  const lon = Number(coordinates[0]);
  const lat = Number(coordinates[1]);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon)
  ) {
    return null;
  }

  const properties =
    feature.properties || {};

  return {
    id:
      feature.id ??
      `${utility}-${index}`,

    utility,

    lat,
    lon,

    name:
      properties.name ||
      properties.ref ||
      formatPowerType(
        properties.power
      ),

    power:
      properties.power ||
      "unknown",

    voltage:
      properties.voltage ||
      null,

    operator:
      properties.operator ||
      utility,

    startDate:
      properties.start_date ||
      null,

    substation:
      properties.substation ||
      null,

    material:
      properties.material ||
      null,

    location:
      properties.location ||
      null,

    properties,
  };
}


/* =========================================================
   NORMALIZE COMPLETE COLLECTION
========================================================= */

export function normalizeInfrastructureCollection(
  geojson,
  utility
) {
  if (!geojson?.features) {
    return [];
  }

  return geojson.features
    .map((feature, index) =>
      normalizeInfrastructureFeature(
        feature,
        utility,
        index
      )
    )
    .filter(Boolean);
}


/* =========================================================
   CALCULATE CROSS-UTILITY MATCHES

   Uses a latitude/longitude pre-filter before running the
   Haversine calculation. This avoids doing a full
   4,628 × 5,784 expensive distance calculation.
========================================================= */

export function calculateInfrastructureOpportunities(
  georgiaFeatures,
  dominionFeatures,
  thresholdMiles = 25
) {
  const opportunities = [];

  /*
   * Rough conversion:
   * 1 degree latitude ≈ 69 miles.
   *
   * This is only the pre-filter.
   * Final inclusion ALWAYS uses Haversine.
   */

  const latitudeWindow =
    thresholdMiles / 69;

  for (const georgia of georgiaFeatures) {
    /*
     * Longitude distance changes with latitude.
     */

    const longitudeMilesPerDegree =
      69 *
      Math.cos(
        (georgia.lat * Math.PI) / 180
      );

    const longitudeWindow =
      longitudeMilesPerDegree > 0
        ? thresholdMiles /
          longitudeMilesPerDegree
        : latitudeWindow;

    for (const dominion of dominionFeatures) {
      /*
       * Fast bounding-box rejection.
       */

      if (
        Math.abs(
          georgia.lat -
            dominion.lat
        ) > latitudeWindow
      ) {
        continue;
      }

      if (
        Math.abs(
          georgia.lon -
            dominion.lon
        ) > longitudeWindow
      ) {
        continue;
      }

      const distance =
        haversineMiles(
          georgia.lat,
          georgia.lon,
          dominion.lat,
          dominion.lon
        );

      if (
        distance >
        thresholdMiles
      ) {
        continue;
      }

      opportunities.push({
        id:
          `${georgia.id}-${dominion.id}`,

        georgia,

        dominion,

        distance:
          Number(
            distance.toFixed(2)
          ),

        /*
         * Infrastructure GeoJSON does not
         * consistently contain project
         * schedule information, so we do NOT
         * manufacture a timeline score.
         */

        timelineAvailable:
          Boolean(
            georgia.startDate &&
              dominion.startDate
          ),

        georgiaStartDate:
          georgia.startDate,

        dominionStartDate:
          dominion.startDate,
      });
    }
  }

  /*
   * Closest cross-utility relationships first.
   */

  opportunities.sort(
    (a, b) =>
      a.distance -
      b.distance
  );

  return opportunities;
}


/* =========================================================
   FORMAT POWER TYPE
========================================================= */

export function formatPowerType(value) {
  if (!value) {
    return "Power Infrastructure";
  }

  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
}


/* =========================================================
   DISPLAY NAME
========================================================= */

export function infrastructureDisplayName(
  feature
) {
  if (!feature) {
    return "Unknown Infrastructure";
  }

  if (
    feature.name &&
    feature.name !==
      formatPowerType(
        feature.power
      )
  ) {
    return feature.name;
  }

  const type =
    formatPowerType(
      feature.power
    );

  if (feature.voltage) {
    return `${type} · ${feature.voltage} V`;
  }

  return type;
}