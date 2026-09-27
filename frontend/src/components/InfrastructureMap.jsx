import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";

import {
  formatPowerType,
  infrastructureDisplayName,
} from "../utils/infrastructureAnalysis.js";


const GEORGIA_COLOR = "#2563eb";
const DOMINION_COLOR = "#f97316";
const OPPORTUNITY_COLOR = "#dc2626";


export default function InfrastructureMap({
  georgiaFeatures,
  dominionFeatures,
  opportunities,
  selectedOpportunity,
  onSelectOpportunity,
}) {

  /*
   * To keep the map responsive, all infrastructure
   * points are displayed as lightweight CircleMarkers.
   */

  return (

    // <MapContainer
    //   center={[32.2, -81.0]}
    //   zoom={7}
    //   className="leaflet-map"
    // >
    <MapContainer
        center={[32.2, -81.0]}
        zoom={7}
        className="infrastructure-leaflet-map"
        style={{
            width: "100%",
            height: "100%",
            minHeight: "535px",
        }}
    >

      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />


      <FitInfrastructure
        georgiaFeatures={
          georgiaFeatures
        }
        dominionFeatures={
          dominionFeatures
        }
      />


      {/* ===============================================
          GEORGIA INFRASTRUCTURE
      ================================================ */}

      {georgiaFeatures.map(
        (feature) => (

          <CircleMarker
            key={`ga-${feature.id}`}
            center={[
              feature.lat,
              feature.lon,
            ]}
            radius={3}
            pathOptions={{
              color:
                GEORGIA_COLOR,

              fillColor:
                GEORGIA_COLOR,

              fillOpacity:
                0.55,

              weight: 1,
            }}
          >

            <Popup>

              <InfrastructurePopup
                feature={
                  feature
                }
              />

            </Popup>

          </CircleMarker>

        )
      )}


      {/* ===============================================
          DOMINION INFRASTRUCTURE
      ================================================ */}

      {dominionFeatures.map(
        (feature) => (

          <CircleMarker
            key={`sc-${feature.id}`}
            center={[
              feature.lat,
              feature.lon,
            ]}
            radius={3}
            pathOptions={{
              color:
                DOMINION_COLOR,

              fillColor:
                DOMINION_COLOR,

              fillOpacity:
                0.6,

              weight: 1,
            }}
          >

            <Popup>

              <InfrastructurePopup
                feature={
                  feature
                }
              />

            </Popup>

          </CircleMarker>

        )
      )}


      {/* ===============================================
          TOP OPPORTUNITY CONNECTIONS

          We deliberately don't draw thousands of
          overlapping lines. The top 50 are enough to
          visualize the coordination corridor.
      ================================================ */}

      {opportunities
        .slice(0, 50)
        .map(
          (
            opportunity,
            index
          ) => {

            const selected =
              selectedOpportunity ===
              index;

            return (

              <Polyline
                key={
                  opportunity.id
                }
                positions={[
                  [
                    opportunity
                      .georgia.lat,
                    opportunity
                      .georgia.lon,
                  ],
                  [
                    opportunity
                      .dominion.lat,
                    opportunity
                      .dominion.lon,
                  ],
                ]}
                pathOptions={{
                  color:
                    OPPORTUNITY_COLOR,

                  weight:
                    selected
                      ? 5
                      : 2,

                  opacity:
                    selected
                      ? 1
                      : 0.35,

                  dashArray:
                    selected
                      ? null
                      : "6 6",
                }}
                eventHandlers={{
                  click: () =>
                    onSelectOpportunity(
                      index
                    ),
                }}
              />

            );

          }
        )}


      {/* ===============================================
          SELECTED OPPORTUNITY HIGHLIGHT
      ================================================ */}

      {selectedOpportunity !==
        null &&
        opportunities[
          selectedOpportunity
        ] && (

          <SelectedInfrastructureOpportunity
            opportunity={
              opportunities[
                selectedOpportunity
              ]
            }
          />

        )}

    </MapContainer>

  );

}


/* =========================================================
   SELECTED OPPORTUNITY
========================================================= */

function SelectedInfrastructureOpportunity({
  opportunity,
}) {

  const map = useMap();


  useEffect(() => {

    const bounds = [
      [
        opportunity.georgia.lat,
        opportunity.georgia.lon,
      ],
      [
        opportunity.dominion.lat,
        opportunity.dominion.lon,
      ],
    ];

    map.fitBounds(
      bounds,
      {
        padding: [80, 80],
        maxZoom: 11,
      }
    );

  }, [
    map,
    opportunity,
  ]);


  return (

    <>

      <CircleMarker
        center={[
          opportunity.georgia.lat,
          opportunity.georgia.lon,
        ]}
        radius={10}
        pathOptions={{
          color:
            OPPORTUNITY_COLOR,

          fillColor:
            GEORGIA_COLOR,

          fillOpacity: 1,

          weight: 4,
        }}
      />


      <CircleMarker
        center={[
          opportunity.dominion.lat,
          opportunity.dominion.lon,
        ]}
        radius={10}
        pathOptions={{
          color:
            OPPORTUNITY_COLOR,

          fillColor:
            DOMINION_COLOR,

          fillOpacity: 1,

          weight: 4,
        }}
      />


      <Polyline
        positions={[
          [
            opportunity.georgia.lat,
            opportunity.georgia.lon,
          ],
          [
            opportunity.dominion.lat,
            opportunity.dominion.lon,
          ],
        ]}
        pathOptions={{
          color:
            OPPORTUNITY_COLOR,

          weight: 4,

          opacity: 0.9,

          dashArray:
            "8 6",
        }}
      />

    </>

  );

}


/* =========================================================
   AUTO-FIT INITIAL INFRASTRUCTURE
========================================================= */

function FitInfrastructure({
  georgiaFeatures,
  dominionFeatures,
}) {

  const map = useMap();


  useEffect(() => {

    const all =
      [
        ...georgiaFeatures,
        ...dominionFeatures,
      ];


    if (
      all.length === 0
    ) {
      return;
    }


    const latitudes =
      all.map(
        (feature) =>
          feature.lat
      );


    const longitudes =
      all.map(
        (feature) =>
          feature.lon
      );


    const bounds = [
      [
        Math.min(
          ...latitudes
        ),
        Math.min(
          ...longitudes
        ),
      ],

      [
        Math.max(
          ...latitudes
        ),
        Math.max(
          ...longitudes
        ),
      ],
    ];


    map.fitBounds(
      bounds,
      {
        padding: [35, 35],
      }
    );

  }, [
    map,
    georgiaFeatures,
    dominionFeatures,
  ]);


  return null;

}


/* =========================================================
   POPUP
========================================================= */

function InfrastructurePopup({
  feature,
}) {

  return (

    <div className="infrastructure-popup">

      <strong>
        {infrastructureDisplayName(
          feature
        )}
      </strong>


      <span>
        {feature.utility}
      </span>


      <hr />


      <small>
        Type:{" "}
        {formatPowerType(
          feature.power
        )}
      </small>


      {feature.voltage && (

        <small>
          Voltage:{" "}
          {feature.voltage}
        </small>

      )}


      {feature.startDate && (

        <small>
          Start date:{" "}
          {feature.startDate}
        </small>

      )}


      {feature.substation && (

        <small>
          Substation:{" "}
          {feature.substation}
        </small>

      )}

    </div>

  );

}