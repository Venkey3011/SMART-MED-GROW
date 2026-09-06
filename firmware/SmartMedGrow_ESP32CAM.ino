/* SmartMedGrow ESP32-CAM firmware — AI Thinker board
   GPIO 13: digital soil sensor (HIGH=dry, LOW=wet)
   GPIO 14: active-low relay (LOW=pump on)
   GPIO 4 : flash LED
   The SMARTMED setup hotspot remains available at 192.168.4.1.
*/
#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>

#define SOIL_SENSOR_PIN 13
#define RELAY_PIN 14
#define FLASH_LED_PIN 4
#define RELAY_ON LOW
#define RELAY_OFF HIGH

// AI Thinker ESP32-CAM pins
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

const char *AP_SSID = "SMARTMED";
const char *AP_PASSWORD = "SMARTMED123"; // Change this before regular deployment.
WebServer server(80);
Preferences prefs;
bool pumpOn = false, autoMode = true, flashOn = false;
bool soilDry = false;
unsigned long lastRead = 0;

void cors() { server.sendHeader("Access-Control-Allow-Origin", "*"); server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); }
void json(const String &body) { cors(); server.send(200, "application/json", body); }
String quoted(const String &s) { return "\"" + s + "\""; }

int stableSoilRead() {
  int highs = 0;
  for (int i = 0; i < 15; i++) { if (digitalRead(SOIL_SENSOR_PIN) == HIGH) highs++; delay(8); }
  return highs >= 8 ? HIGH : LOW;
}
void setPump(bool on) { digitalWrite(RELAY_PIN, on ? RELAY_ON : RELAY_OFF); pumpOn = on; }
void updateSoil() {
  soilDry = stableSoilRead() == HIGH;
  if (autoMode) setPump(soilDry);
}

bool startCamera() {
  camera_config_t c{};
  c.ledc_channel = LEDC_CHANNEL_0; c.ledc_timer = LEDC_TIMER_0;
  c.pin_d0 = Y2_GPIO_NUM; c.pin_d1 = Y3_GPIO_NUM; c.pin_d2 = Y4_GPIO_NUM; c.pin_d3 = Y5_GPIO_NUM;
  c.pin_d4 = Y6_GPIO_NUM; c.pin_d5 = Y7_GPIO_NUM; c.pin_d6 = Y8_GPIO_NUM; c.pin_d7 = Y9_GPIO_NUM;
  c.pin_xclk = XCLK_GPIO_NUM; c.pin_pclk = PCLK_GPIO_NUM; c.pin_vsync = VSYNC_GPIO_NUM; c.pin_href = HREF_GPIO_NUM;
  c.pin_sccb_sda = SIOD_GPIO_NUM; c.pin_sccb_scl = SIOC_GPIO_NUM; c.pin_pwdn = PWDN_GPIO_NUM; c.pin_reset = RESET_GPIO_NUM;
  c.xclk_freq_hz = 20000000; c.pixel_format = PIXFORMAT_JPEG;
  c.frame_size = psramFound() ? FRAMESIZE_VGA : FRAMESIZE_QVGA;
  c.jpeg_quality = psramFound() ? 12 : 15; c.fb_count = psramFound() ? 2 : 1;
  return esp_camera_init(&c) == ESP_OK;
}

void handleInfo() {
  String sta = WiFi.status() == WL_CONNECTED ? WiFi.localIP().toString() : "0.0.0.0";
  json("{\"stationIp\":" + quoted(sta) + ",\"accessPointIp\":" + quoted(WiFi.softAPIP().toString()) + ",\"wifiConnected\":" + String(WiFi.status() == WL_CONNECTED ? "true" : "false") + "}");
}
void handleStatus() {
  json("{\"soilDigitalValue\":" + String(soilDry ? 1 : 0) + ",\"soilStatus\":" + quoted(soilDry ? "DRY" : "WET") + ",\"pump\":" + quoted(pumpOn ? "ON" : "OFF") + ",\"mode\":" + quoted(autoMode ? "AUTO" : "MANUAL") + ",\"flash\":" + quoted(flashOn ? "ON" : "OFF") + "}");
}
void handlePump() { if (!server.hasArg("state")) { cors(); server.send(400, "application/json", "{\"error\":\"Missing state\"}"); return; } autoMode = false; setPump(server.arg("state") == "on"); handleStatus(); }
void handleMode() { if (server.arg("value") == "auto") { autoMode = true; updateSoil(); } handleStatus(); }
void handleFlash() { flashOn = server.arg("state") == "on"; digitalWrite(FLASH_LED_PIN, flashOn ? HIGH : LOW); handleStatus(); }
void handleCapture() {
  camera_fb_t *fb = esp_camera_fb_get(); if (!fb) { cors(); server.send(500, "text/plain", "Camera capture failed"); return; }
  cors(); server.sendHeader("Content-Disposition", "inline; filename=capture.jpg"); server.setContentLength(fb->len); server.send(200, "image/jpeg", ""); server.client().write(fb->buf, fb->len); esp_camera_fb_return(fb);
}
void handleStream() {
  WiFiClient client = server.client(); cors();
  client.print("HTTP/1.1 200 OK\r\nContent-Type: multipart/x-mixed-replace; boundary=frame\r\nAccess-Control-Allow-Origin: *\r\n\r\n");
  while (client.connected()) { camera_fb_t *fb = esp_camera_fb_get(); if (!fb) continue; client.printf("--frame\r\nContent-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n", fb->len); client.write(fb->buf, fb->len); client.print("\r\n"); esp_camera_fb_return(fb); delay(60); }
}
void handlePortal() {
  String ssid = prefs.getString("ssid", "");
  String page = "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><style>body{font-family:sans-serif;margin:2rem;max-width:420px}input,button{box-sizing:border-box;width:100%;padding:12px;margin:6px 0}button{background:#047857;color:white;border:0;border-radius:6px}</style><h2>SmartMedGrow Wi-Fi setup</h2><p>Setup hotspot: SMARTMED</p><form method=post action=/save><label>Wi-Fi name</label><input name=ssid value='" + ssid + "' required><label>Wi-Fi password</label><input name=pass type=password><button>Save and restart</button></form><p><a href=/api/info>View network information</a></p>";
  cors(); server.send(200, "text/html", page);
}
void handleSave() { if (!server.hasArg("ssid")) { cors(); server.send(400, "text/plain", "SSID required"); return; } prefs.putString("ssid", server.arg("ssid")); prefs.putString("pass", server.arg("pass")); cors(); server.send(200, "text/html", "Saved. The ESP32-CAM will restart now."); delay(800); ESP.restart(); }
void options() { cors(); server.send(204); }

void setup() {
  Serial.begin(115200); pinMode(SOIL_SENSOR_PIN, INPUT); pinMode(RELAY_PIN, OUTPUT); pinMode(FLASH_LED_PIN, OUTPUT);
  setPump(false); digitalWrite(FLASH_LED_PIN, LOW); prefs.begin("smartmed", false); startCamera(); updateSoil();
  WiFi.mode(WIFI_AP_STA); WiFi.softAP(AP_SSID, AP_PASSWORD); // Always expose 192.168.4.1 for IP retrieval/setup.
  String ssid = prefs.getString("ssid", ""); if (ssid.length()) WiFi.begin(ssid.c_str(), prefs.getString("pass", "").c_str());
  server.on("/", HTTP_GET, handlePortal); server.on("/save", HTTP_POST, handleSave);
  server.on("/api/info", HTTP_GET, handleInfo); server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/pump", HTTP_GET, handlePump); server.on("/api/mode", HTTP_GET, handleMode); server.on("/api/flash", HTTP_GET, handleFlash);
  server.on("/capture", HTTP_GET, handleCapture); server.on("/stream", HTTP_GET, handleStream);
  server.onNotFound([](){ if (server.method() == HTTP_OPTIONS) options(); else { cors(); server.send(404, "application/json", "{\"error\":\"Not found\"}"); } });
  server.begin(); Serial.printf("Setup AP: http://%s\n", WiFi.softAPIP().toString().c_str());
}
void loop() { server.handleClient(); if (millis() - lastRead >= 1000) { lastRead = millis(); updateSoil(); } }
