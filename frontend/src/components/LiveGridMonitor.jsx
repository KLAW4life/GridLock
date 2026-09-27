export default function LiveGridMonitor({
  connected,
  event,
  onConnect,
  onDisconnect,
  onOpenEvent,
}) {

  /* =========================================================
     NOT CONNECTED
  ========================================================= */

  if (!connected) {

    return (

      <button
        className="sensor-monitor disconnected"
        onClick={onConnect}
      >

        <span className="sensor-monitor-icon">
          ○
        </span>


        <span className="sensor-monitor-text">

          <strong>
            CONNECT SENSOR
          </strong>

          <small>
            Arduino offline
          </small>

        </span>

      </button>

    );

  }


  /* =========================================================
     ACTIVE EVENT
  ========================================================= */

  if (event.active) {

    return (

      <button
        className="sensor-monitor emergency"
        onClick={onOpenEvent}
      >

        <span className="sensor-monitor-icon">
          ⚠
        </span>


        <span className="sensor-monitor-text">

          <strong>
            LIVE EVENT
          </strong>

          <small>
            {event.label}
          </small>

        </span>

      </button>

    );

  }


  /* =========================================================
     NORMAL
  ========================================================= */

  return (

    <button
      className="sensor-monitor connected"
      onClick={onDisconnect}
      title="Click to disconnect Arduino"
    >

      <span className="sensor-live-dot" />


      <span className="sensor-monitor-text">

        <strong>
          SENSOR ONLINE
        </strong>

        <small>
          System Normal
        </small>

      </span>

    </button>

  );
}