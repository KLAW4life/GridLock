export default function OpportunityList({
  overlaps,
  selected,
  setSelected,
}) {
  return (
    <aside className="opportunities">
      <div className="sidebar-header">
        <p className="eyebrow">CROSS-UTILITY ANALYSIS</p>
        <h2>Coordination Opportunities</h2>
        <p>
          Planned projects whose center points are less than 25 miles apart,
          ranked by geographic proximity.
        </p>
      </div>

      <div className="opportunity-scroll">
        {overlaps.length === 0 ? (
          <div className="empty-state">
            No project pairs were found within the configured threshold.
          </div>
        ) : (
          overlaps.map((item, index) => (
            <button
              type="button"
              key={`${item.georgiaId}-${item.dominionId}-${index}`}
              className={`opportunity ${selected === index ? "selected" : ""}`}
              onClick={() => setSelected(index)}
            >
              <div className="opportunity-top">
                <span className="rank">#{index + 1}</span>
                <span className="distance">{item.distance} mi</span>
              </div>

              <div className="utility-project">
                <span className="mini-dot ga-dot" />
                <div>
                  <small>Georgia Power</small>
                  <strong>{item.georgiaName}</strong>
                </div>
              </div>

              <div className="pair-connector">↓</div>

              <div className="utility-project">
                <span className="mini-dot sc-dot" />
                <div>
                  <small>Dominion Energy SC</small>
                  <strong>{item.dominionName}</strong>
                </div>
              </div>

              <div className="metrics">
                <span>Geographic overlap ✓</span>
                <span>
                  {item.timeGapDays !== null
                    ? `${item.timeGapDays} day timeline gap`
                    : "Timeline unavailable"}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
