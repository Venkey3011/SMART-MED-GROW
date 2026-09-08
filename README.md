<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# SmartMedGrow

SmartMedGrow is a web dashboard for the AI Thinker ESP32-CAM grow controller. It provides crop planning, dashboard reporting, camera access, manual controls, and a direct local connection to the physical board.

## Start the application

1. Install Node.js 20 or newer.
2. In this folder, run `npm install`.
3. Run `npm run dev` and open the displayed local URL.

Use `npm run build` to create the production bundle. `npm run lint` performs the TypeScript check.

## Flash the ESP32-CAM

1. Open `firmware/SmartMedGrow_ESP32CAM.ino` in Arduino IDE.
2. Select **AI Thinker ESP32-CAM** and upload it using an FTDI programmer (GPIO 0 to GND while flashing, then remove GPIO 0 from GND and reset).
3. The controller exposes the setup Wi-Fi network **SMARTMED** with password **SMARTMED123**. Change the password in the sketch before regular use.
4. Join that network, open `http://192.168.4.1`, and save the home Wi-Fi credentials. The setup hotspot remains available after the board connects to home Wi-Fi.
5. In the app, open **ESP32-CAM Setup**, join the **SMARTMED** hotspot, and select **Get IP from hotspot**. The app reads `/api/info`, saves the station IP, and can then connect to the board from the same home network.

### Optional application heartbeat

The setup page also accepts an Application API URL, Device ID, and Device Token. Copy the latter two from the ESP32-CAM Setup screen. For a locally running app, use an address reachable from the ESP32-CAM, for example `http://192.168.137.1:3000/api/iot/device-status`—never `localhost`, which points to the ESP32-CAM itself. The board then sends a protected Dry/Wet, pump, IP, and online heartbeat every 30 seconds.

### Camera power behavior

The firmware does **not** initialize the camera at boot. The camera initializes only when an authorized user opens `/stream` or requests `/capture`; it is released after a snapshot or when the stream viewer closes. This reduces steady power draw and avoids unnecessary camera load. The user’s device token is required for camera, flash, and pump actions.

## Hardware wiring

| Part | ESP32-CAM pin | Logic |
| --- | --- | --- |
| Soil moisture digital output | GPIO 13 | HIGH = dry; LOW = wet |
| Active-low relay input | GPIO 14 | LOW = pump on; HIGH = pump off |
| Camera flash LED | GPIO 4 | HIGH = on |

The firmware starts with the pump off, reads the sensor every second, and automatically runs the pump only while the soil is dry. A manual pump action pauses automatic mode until **Enable AUTO** is selected in the app.

## Important local-network note

The ESP32-CAM serves HTTP. Direct camera/control access must be opened from an HTTP local app URL or an environment that permits local HTTP content. A browser may block an HTTP ESP32-CAM request from a public HTTPS site; open the app locally or open the board link in a separate tab in that case.
