// =====================================================
// GRIDLOCK - COMPLETE SENSOR SYSTEM
// =====================================================
//
// Potentiometer -> GREEN LED
// Tilt Sensor   -> YELLOW LED
// Thermistor    -> RED LED
// Button        -> RESET / RECALIBRATE
// Buzzer        -> Beeps when sensor triggers
//
// =====================================================


// =====================================================
// PIN CONFIGURATION
// =====================================================

const int PIN_POT    = A1;
const int PIN_THERM  = A0;
const int PIN_BUTTON = 2;
const int PIN_TILT   = 3;
const int PIN_BUZZER = 6;

const int LED_YELLOW = 8;   // Tilt sensor
const int LED_GREEN  = 9;   // Potentiometer
const int LED_RED    = 10;  // Thermistor


// =====================================================
// SENSOR SETTINGS
// =====================================================

// Potentiometer threshold
const int POT_THRESHOLD = 800;


// Thermistor sensitivity
// LOWER = easier to trigger
const int THERM_TRIGGER_CHANGE = 7;


// Tilt sensitivity
// Must remain tilted for 0.5 seconds
const unsigned long TILT_TRIGGER_TIME = 500;


// Yellow LED stays on for 0.5 seconds
const unsigned long TILT_LIGHT_TIME = 500;


// =====================================================
// SENSOR STATES
// =====================================================

bool loadAlarm = false;
bool thermalAlarm = false;

bool tiltTiming = false;
bool tiltEventActive = false;
bool tiltReady = true;


// =====================================================
// VARIABLES
// =====================================================

int thermBaseline = 0;

unsigned long tiltStartTime = 0;
unsigned long tiltLightStartTime = 0;

bool previousButtonPressed = false;


// =====================================================
// RESET / CALIBRATION
// =====================================================

void resetSystem() {

  // Clear alarm states
  loadAlarm = false;
  thermalAlarm = false;

  tiltTiming = false;
  tiltEventActive = false;
  tiltReady = true;


  // Turn everything off
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);

  noTone(PIN_BUZZER);


  // ==================================================
  // CALIBRATE THERMISTOR
  // ==================================================

  Serial.println();
  Serial.println("============================");
  Serial.println("CALIBRATING SYSTEM...");
  Serial.println("Do not touch thermistor.");
  Serial.println("============================");


  long total = 0;


  // Take 20 readings
  for (int i = 0; i < 20; i++) {

    total += analogRead(PIN_THERM);

    delay(50);
  }


  // Calculate average baseline
  thermBaseline = total / 20;


  Serial.print("Thermistor baseline: ");
  Serial.println(thermBaseline);

  Serial.println("SYSTEM READY");
  Serial.println();
}


// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(9600);


  // ----------------------
  // OUTPUTS
  // ----------------------

  pinMode(LED_GREEN, OUTPUT);

  pinMode(LED_YELLOW, OUTPUT);

  pinMode(LED_RED, OUTPUT);

  pinMode(PIN_BUZZER, OUTPUT);


  // ----------------------
  // INPUTS
  // ----------------------

  pinMode(PIN_BUTTON, INPUT_PULLUP);

  pinMode(PIN_TILT, INPUT_PULLUP);


  // Initial calibration
  resetSystem();


  Serial.println("GRIDLOCK MONITOR ACTIVE");
}


// =====================================================
// MAIN LOOP
// =====================================================

void loop() {


  // ==================================================
  // READ ALL SENSORS
  // ==================================================

  int potValue =
      analogRead(PIN_POT);


  int thermValue =
      analogRead(PIN_THERM);


  int tiltState =
      digitalRead(PIN_TILT);


  bool buttonPressed =
      (digitalRead(PIN_BUTTON) == LOW);


  // ==================================================
  // RESET BUTTON
  // ==================================================

  if (buttonPressed &&
      !previousButtonPressed) {


    Serial.println("RESET BUTTON PRESSED");


    // Reset confirmation beep
    tone(PIN_BUZZER, 600, 100);


    delay(150);


    // Clear alarms and recalibrate
    resetSystem();


    // Button debounce
    delay(200);
  }


  previousButtonPressed =
      buttonPressed;


  // ==================================================
  // POTENTIOMETER -> GREEN LED
  // ==================================================

  bool newLoadAlarm =
      (potValue > POT_THRESHOLD);


  // Beep when threshold is first crossed
  if (newLoadAlarm &&
      !loadAlarm) {


    Serial.println(
      "*** GRID LOAD TRIGGERED ***"
    );


    tone(PIN_BUZZER, 900, 200);
  }


  loadAlarm =
      newLoadAlarm;


  digitalWrite(
      LED_GREEN,
      loadAlarm ? HIGH : LOW
  );


  // ==================================================
  // THERMISTOR -> RED LED
  // ==================================================

  // Calculate difference from starting temperature
  int thermDifference =
      abs(thermValue - thermBaseline);


  // Trigger when difference reaches 7
  bool newThermalAlarm =
      (thermDifference >=
       THERM_TRIGGER_CHANGE);


  // Beep when first triggered
  if (newThermalAlarm &&
      !thermalAlarm) {


    Serial.println(
      "*** TEMPERATURE TRIGGERED ***"
    );


    tone(PIN_BUZZER, 1300, 200);
  }


  thermalAlarm =
      newThermalAlarm;


  digitalWrite(
      LED_RED,
      thermalAlarm ? HIGH : LOW
  );


  // ==================================================
  // TILT SENSOR -> YELLOW LED
  // ==================================================

  // LOW means tilt switch is activated
  bool tiltDetected =
      (tiltState == LOW);


  // --------------------------------------------------
  // TILT DETECTED
  // --------------------------------------------------

  if (tiltDetected) {


    // Only allow detection if sensor has been reset
    // to its normal position since the last event.

    if (tiltReady) {


      // Start timing the tilt
      if (!tiltTiming) {


        tiltTiming = true;


        tiltStartTime =
            millis();


        Serial.println(
          "Possible tilt..."
        );
      }


      // ----------------------------------------------
      // CONFIRM TILT
      // ----------------------------------------------

      // Sensor must remain triggered for 500 ms

      if (millis() - tiltStartTime
          >= TILT_TRIGGER_TIME) {


        Serial.println(
          "*** TILT CONFIRMED ***"
        );


        // Turn yellow LED on
        digitalWrite(
          LED_YELLOW,
          HIGH
        );


        // Beep
        tone(
          PIN_BUZZER,
          1100,
          250
        );


        // Start yellow LED timer
        tiltLightStartTime =
            millis();


        tiltEventActive =
            true;


        // Prevent repeated triggering
        // while sensor remains tilted
        tiltReady =
            false;


        tiltTiming =
            false;
      }
    }
  }


  // --------------------------------------------------
  // TILT RETURNED TO NORMAL
  // --------------------------------------------------

  else {


    tiltTiming =
        false;


    // Allow another tilt event
    tiltReady =
        true;
  }


  // ==================================================
  // AUTOMATICALLY TURN YELLOW LED OFF
  // ==================================================

  if (tiltEventActive) {


    if (millis() - tiltLightStartTime
        >= TILT_LIGHT_TIME) {


      digitalWrite(
        LED_YELLOW,
        LOW
      );


      tiltEventActive =
          false;
    }
  }


  // ==================================================
  // SERIAL DATA FOR GRIDLOCK SOFTWARE
  // ==================================================

  Serial.print("{");


  // ----------------------
  // POTENTIOMETER
  // ----------------------

  Serial.print("\"load\":");

  Serial.print(potValue);


  Serial.print(",\"loadAlarm\":");

  Serial.print(
    loadAlarm ? "true" : "false"
  );


  // ----------------------
  // THERMISTOR
  // ----------------------

  Serial.print(",\"tempRaw\":");

  Serial.print(thermValue);


  Serial.print(",\"tempBaseline\":");

  Serial.print(thermBaseline);


  Serial.print(",\"tempChange\":");

  Serial.print(thermDifference);


  Serial.print(",\"thermalAlarm\":");

  Serial.print(
    thermalAlarm ? "true" : "false"
  );


  // ----------------------
  // TILT SENSOR
  // ----------------------

  Serial.print(",\"tiltRaw\":");

  Serial.print(tiltState);


  Serial.print(",\"tiltEvent\":");

  Serial.print(
    tiltEventActive ? "true" : "false"
  );


  // ----------------------
  // END JSON
  // ----------------------

  Serial.println("}");


  // Read approximately 20 times per second
  delay(50);
}