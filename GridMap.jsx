* {
  box-sizing: border-box;
}

:root {
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  color: #0f172a;
  background: #f5f7fb;
  font-synthesis: none;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

button {
  font: inherit;
}

.app {
  min-height: 100vh;
}

.topbar {
  height: 72px;
  padding: 0 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #07162d;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #facc15;
  color: #07162d;
  font-size: 21px;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  letter-spacing: 0.14em;
}

.brand small {
  margin-top: 2px;
  color: #a9b7ca;
  font-size: 12px;
}

.hackathon-badge {
  padding: 7px 11px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  color: #dbe6f5;
  font-size: 12px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(440px, 1fr);
  gap: 32px;
  padding: 30px 32px;
  background: linear-gradient(135deg, #07162d, #0d2444);
  color: white;
}

.eyebrow {
  margin: 0 0 8px;
  color: #38bdf8;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.15em;
}

.hero h1 {
  max-width: 650px;
  margin: 0;
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1.02;
  letter-spacing: -0.04em;
}

.hero-description {
  max-width: 650px;
  margin: 14px 0 0;
  color: #b8c6d9;
  line-height: 1.6;
}

.stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  align-self: center;
}

.stat {
  min-height: 92px;
  padding: 17px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.055);
}

.stat strong {
  font-size: 27px;
}

.stat span {
  margin-top: 4px;
  color: #afbed2;
  font-size: 12px;
}

.dashboard {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 390px;
  gap: 16px;
  height: calc(100vh - 300px);
  min-height: 570px;
  padding: 16px;
}

.map-panel,
.opportunities {
  overflow: hidden;
  border: 1px solid #dce3ec;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 28px rgba(15, 23, 42, 0.06);
}

.map-panel {
  display: flex;
  flex-direction: column;
}

.map-toolbar {
  padding: 13px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #e8edf3;
}

.toolbar-title {
  margin: 0;
  font-weight: 750;
}

.toolbar-subtitle {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 11px;
}

.layer-buttons {
  display: flex;
  gap: 7px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.layer-button {
  padding: 7px 10px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid #dce3ec;
  border-radius: 999px;
  background: white;
  color: #64748b;
  cursor: pointer;
  font-size: 11px;
}

.layer-button.active {
  color: #0f172a;
  background: #f8fafc;
  border-color: #b9c5d3;
}

.map-wrap {
  flex: 1;
  min-height: 0;
}

.leaflet-container {
  background: #dbe5ee;
}

.map-legend {
  min-height: 43px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  gap: 18px;
  border-top: 1px solid #e8edf3;
  color: #475569;
  font-size: 11px;
}

.map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot,
.mini-dot {
  display: inline-block;
  flex: 0 0 auto;
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.ga-dot {
  background: #2563eb;
}

.sc-dot {
  background: #f97316;
}

.overlap-dot {
  background: #dc2626;
}

.legend-line {
  width: 18px;
  height: 0;
  border-top: 3px dashed #dc2626;
}

.opportunities {
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 20px 20px 16px;
  border-bottom: 1px solid #e8edf3;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 21px;
  letter-spacing: -0.02em;
}

.sidebar-header > p:last-child {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
}

.opportunity-scroll {
  padding: 10px;
  overflow-y: auto;
}

.opportunity {
  width: 100%;
  margin: 0 0 9px;
  padding: 14px;
  text-align: left;
  border: 1px solid #e2e8f0;
  border-radius: 13px;
  background: white;
  cursor: pointer;
  transition:
    transform 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease;
}

.opportunity:hover {
  transform: translateY(-1px);
  border-color: #b8c4d2;
  box-shadow: 0 7px 18px rgba(15, 23, 42, 0.07);
}

.opportunity.selected {
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.09);
}

.opportunity-top {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rank {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
}

.distance {
  padding: 4px 8px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 11px;
  font-weight: 800;
}

.utility-project {
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 8px;
  align-items: start;
}

.utility-project .mini-dot {
  margin-top: 5px;
}

.utility-project small,
.utility-project strong {
  display: block;
}

.utility-project small {
  margin-bottom: 2px;
  color: #64748b;
  font-size: 10px;
}

.utility-project strong {
  font-size: 12px;
  line-height: 1.35;
}

.pair-connector {
  margin: 3px 0 3px 2px;
  color: #94a3b8;
  font-size: 13px;
}

.metrics {
  margin-top: 12px;
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  border-top: 1px solid #edf1f5;
  color: #64748b;
  font-size: 10px;
}

.map-popup {
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.popup-kicker {
  color: #64748b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.popup-arrow {
  color: #94a3b8;
}

.popup-metrics {
  margin-top: 5px;
  padding-top: 7px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-top: 1px solid #e2e8f0;
  font-size: 11px;
}

.loading-screen {
  min-height: 100vh;
  display: grid;
  place-content: center;
  text-align: center;
  background: #07162d;
  color: white;
}

.loading-bolt {
  font-size: 42px;
}

.empty-state {
  padding: 24px 16px;
  color: #64748b;
  text-align: center;
  font-size: 13px;
}

@media (max-width: 1050px) {
  .hero {
    grid-template-columns: 1fr;
  }

  .dashboard {
    grid-template-columns: 1fr;
    height: auto;
  }

  .map-panel {
    height: 650px;
  }

  .opportunities {
    max-height: 650px;
  }
}

@media (max-width: 650px) {
  .topbar,
  .hero {
    padding-left: 18px;
    padding-right: 18px;
  }

  .brand small,
  .hackathon-badge {
    display: none;
  }

  .stats {
    grid-template-columns: 1fr 1fr;
  }

  .dashboard {
    padding: 8px;
  }

  .map-panel {
    height: 560px;
  }

  .map-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .map-legend {
    flex-wrap: wrap;
    padding-top: 8px;
    padding-bottom: 8px;
  }
}
