import { useEffect, useRef, useState } from "react";


const EMPTY_SENSOR_DATA = {
  load: 0,
  loadAlarm: false,

  tempRaw: 0,
  tempBaseline: 0,
  tempChange: 0,
  thermalAlarm: false,

  tiltRaw: 1,
  tiltEvent: false,
};


export default function useArduinoSerial() {

  const [connected, setConnected] =
    useState(false);

  const [sensorData, setSensorData] =
    useState(EMPTY_SENSOR_DATA);

  const [error, setError] =
    useState("");

  const portRef = useRef(null);
  const readerRef = useRef(null);

  const keepReadingRef = useRef(false);


  /* =========================================================
     CONNECT
  ========================================================= */

  const connect = async () => {

    if (!("serial" in navigator)) {

      setError(
        "Web Serial is not supported in this browser. Use Chrome or Edge."
      );

      return;
    }


    try {

      setError("");


      const port =
        await navigator.serial.requestPort();


      await port.open({
        baudRate: 9600,
      });


      portRef.current = port;

      keepReadingRef.current = true;

      setConnected(true);


      readSerial(port);

    }

    catch (err) {

      console.error(err);

      setError(
        err.message ||
        "Could not connect to Arduino."
      );

    }

  };


  /* =========================================================
     READ SERIAL
  ========================================================= */

  const readSerial = async (port) => {

    const decoder =
      new TextDecoderStream();


    const readableClosed =
      port.readable.pipeTo(
        decoder.writable
      );


    const reader =
      decoder.readable.getReader();


    readerRef.current = reader;


    let buffer = "";


    try {

      while (keepReadingRef.current) {

        const {
          value,
          done,
        } = await reader.read();


        if (done) {
          break;
        }


        buffer += value;


        const lines =
          buffer.split("\n");


        buffer =
          lines.pop() || "";


        for (const line of lines) {

          const trimmed =
            line.trim();


          /*
           * Arduino also prints normal debug messages.
           * Only attempt to parse lines that look like JSON.
           */

          if (
            !trimmed.startsWith("{") ||
            !trimmed.endsWith("}")
          ) {
            continue;
          }


          try {

            const parsed =
              JSON.parse(trimmed);


            setSensorData((previous) => ({
              ...previous,
              ...parsed,
            }));

          }

          catch {

            console.warn(
              "Ignored invalid Arduino JSON:",
              trimmed
            );

          }

        }

      }

    }

    catch (err) {

      if (keepReadingRef.current) {

        console.error(err);

        setError(
          "Arduino serial connection was interrupted."
        );

      }

    }

    finally {

      try {
        reader.releaseLock();
      }
      catch {
        // Ignore cleanup errors
      }


      try {
        await readableClosed;
      }
      catch {
        // Expected during disconnect
      }

    }

  };


  /* =========================================================
     DISCONNECT
  ========================================================= */

  const disconnect = async () => {

    keepReadingRef.current = false;


    try {

      if (readerRef.current) {

        await readerRef.current.cancel();

      }

    }

    catch {
      // Ignore
    }


    readerRef.current = null;


    try {

      if (portRef.current) {

        await portRef.current.close();

      }

    }

    catch {
      // Ignore
    }


    portRef.current = null;

    setConnected(false);

  };


  /* =========================================================
     CLEANUP
  ========================================================= */

  useEffect(() => {

    return () => {

      keepReadingRef.current = false;


      if (readerRef.current) {

        readerRef.current.cancel()
          .catch(() => {});

      }

    };

  }, []);


  return {
    connected,
    sensorData,
    error,
    connect,
    disconnect,
  };
}