/*
 * ============================================================================
 * MONITOREO NIVEL DE AGUA - ESP32-S3 + LoRaWAN + GPS
 * ============================================================================
 *
 * Hardware:
 *   - ESP32-S3
 *   - LoRa SX1276 / RFM95
 *   - Sensor ultrasónico RCWL-1655
 *   - GPS Teseo LIV3R
 *
 * Red: LoRaWAN OTAA via TTN / ChirpStack (US915)
 *
 * ----------------------------------------------------------------------------
 * FLUJOS DE EJECUCIÓN
 * ----------------------------------------------------------------------------
 *
 *   Primer boot:
 *     LoRa join → Medir → Enviar → GPS (90s) → Sleep
 *     (GPS queda en RTC para los ciclos siguientes)
 *
 *   Wake desde sleep (normal):
 *     Restaurar sesión → Medir → Enviar → Sleep
 *
 *   Wake desde sleep con downlink 0x03 pendiente:
 *     GPS (90s) → Restaurar sesión → Medir → Enviar → Sleep
 *     (coordenadas frescas en el payload de este ciclo)
 *
 * ----------------------------------------------------------------------------
 * PAYLOAD UPLINK (FPort 2) — 12 bytes
 * ----------------------------------------------------------------------------
 *   Byte  0     : flags de estado
 *                   bit 0 = GPS válido
 *                   bit 1 = medición de agua válida
 *                   bit 2 = GPS actualizado este ciclo
 *                   bit 3 = primer boot
 *   Byte  1-2   : nivel de agua en cm (uint16 big-endian, 0xFFFF = error)
 *   Byte  3-6   : latitud  × 10^6  (int32 big-endian)
 *   Byte  7-10  : longitud × 10^6  (int32 big-endian)
 *   Byte  11    : HDOP × 10 (uint8, 255 = inválido)
 *
 * ----------------------------------------------------------------------------
 * COMANDOS DOWNLINK (FPort 1)
 * ----------------------------------------------------------------------------
 *   0x01 [LSB] [MSB]  → cambiar intervalo en segundos (uint16 LE)
 *   0x02              → reiniciar placa
 *   0x03              → solicitar GPS en el próximo ciclo (timeout completo)
 *
 * ============================================================================
 */

#include <SPI.h>
#include <HardwareSerial.h>
#include <MicroNMEA.h>
#include <driver/rtc_io.h>
#include <esp_sleep.h>
#include <lmic.h>
#include <hal/hal.h>

// ============================================================================
// PINES
// ============================================================================

#define LORA_SCK      9
#define LORA_MISO    11
#define LORA_MOSI    10
#define LORA_NSS      8
#define LORA_RST      6
#define LORA_DIO0    12
#define LORA_DIO1    13
#define LORA_DIO2    14

#define TRIG_PIN         4
#define ECHO_PIN         3
#define SENSOR_PWR_PIN   5

#define GPS_RX      37
#define GPS_TX      36
#define PNP_GPS     35
#define RESET_GPS   33
#define PPS_PIN     38
#define ANT_OFF     34   // Output del Teseo — solo INPUT, no usar como salida
#define WAKE_GPS    17   // No utilizado

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

#define ALTURA_SENSOR_CM   100
#define GPS_TIMEOUT_MS   450000
#define SENSOR_MUESTRAS       4
#define SENSOR_MIN_VALIDAS    2
#define DEFAULT_INTERVAL     2400

// ============================================================================
// CREDENCIALES OTAA
// ============================================================================

static const u1_t PROGMEM APPEUI[8] = {
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};
static const u1_t PROGMEM DEVEUI[8] = {    //LSB
0xA1, 0x04, 0xCF, 0x4A, 0x79, 0x58, 0x29, 0x18
};
static const u1_t PROGMEM APPKEY[16] = {  //MSB
0xE2, 0x89, 0xD4, 0x61, 0xE7, 0xF2, 0x74, 0x56, 0xA4, 0x58, 0xE2, 0x98, 0x3B, 0x1D, 0xD7, 0x4C
};

void os_getArtEui(u1_t* buf) { memcpy_P(buf, APPEUI,  8); }
void os_getDevEui(u1_t* buf) { memcpy_P(buf, DEVEUI,  8); }
void os_getDevKey(u1_t* buf) { memcpy_P(buf, APPKEY, 16); }

const lmic_pinmap lmic_pins = {
    .nss            = LORA_NSS,
    .rxtx           = LMIC_UNUSED_PIN,
    .rst            = LORA_RST,
    .dio            = { LORA_DIO0, LORA_DIO1, LORA_DIO2 },
    .rxtx_rx_active = 0,
    .rssi_cal       = 10,
    .spi_freq       = 8000000
};

// ============================================================================
// RTC MEMORY
// ============================================================================

RTC_DATA_ATTR uint32_t  bootCount     = 0;
RTC_DATA_ATTR uint32_t  messageCount  = 0;
RTC_DATA_ATTR uint16_t  sleepInterval = DEFAULT_INTERVAL;

RTC_DATA_ATTR lmic_t    RTC_LMIC;
RTC_DATA_ATTR bool      session_valid = false;

RTC_DATA_ATTR bool      gpsConfigDone  = false;
RTC_DATA_ATTR bool      gpsRequested   = false;  // Downlink 0x03 pendiente
RTC_DATA_ATTR bool      lastGpsValid   = false;
RTC_DATA_ATTR int32_t   lastLat        = 0;
RTC_DATA_ATTR int32_t   lastLon        = 0;
RTC_DATA_ATTR int16_t   lastAlt        = 0;
RTC_DATA_ATTR uint8_t   lastHdop       = 255;

// ============================================================================
// VARIABLES GLOBALES
// ============================================================================

static osjob_t sendjob;
bool firstBoot    = false;
bool gpsEsteciclo = false;  // GPS fue actualizado en este ciclo

HardwareSerial gpsSerial(2);
char nmeaBuffer[100];
MicroNMEA nmea(nmeaBuffer, sizeof(nmeaBuffer));


// ============================================================================
// GPS
// ============================================================================

void gpsApagar() {
    gpsSerial.end();
    digitalWrite(PNP_GPS, HIGH);
    Serial.println("[GPS] Modulo apagado.");
}

void gpsEncender() {
    pinMode(PNP_GPS,   OUTPUT);
    pinMode(RESET_GPS, OUTPUT);

    digitalWrite(PNP_GPS, HIGH);
    delay(50);
    digitalWrite(PNP_GPS, LOW);

    digitalWrite(RESET_GPS, LOW);
    delay(50);
    digitalWrite(RESET_GPS, HIGH);

    Serial.println("[GPS] Encendiendo modulo...");
    delay(2000);  // Boot mínimo del Teseo

    gpsSerial.begin(9600, SERIAL_8N1, GPS_RX, GPS_TX);
    delay(200);
    while (gpsSerial.available()) gpsSerial.read();

    if (!gpsConfigDone) {
        Serial.println("[GPS] Configurando NMEA (primera vez)...");
        MicroNMEA::sendSentence(gpsSerial, "$PSTMSETPAR,1201,0x00000042");
        delay(200);
        MicroNMEA::sendSentence(gpsSerial, "$PSTMSAVEPAR");
        delay(300);
        gpsConfigDone = true;
        Serial.println("[GPS] Configuracion guardada.");
    }
}

/*
 * Busca fix GPS durante GPS_TIMEOUT_MS.
 * Actualiza RTC memory si obtiene fix.
 * Retorna true si obtuvo fix.
 */
bool gpsBuscarFix() {
    unsigned long inicio      = millis();
    unsigned long ultimoPrint = 0;

    Serial.printf("[GPS] Buscando fix (max %d s)...\n", GPS_TIMEOUT_MS / 1000);

    // Esperar fix válido
    while (millis() - inicio < GPS_TIMEOUT_MS) {
        while (gpsSerial.available()) nmea.process(gpsSerial.read());

        if (nmea.isValid()) break;

        if (millis() - ultimoPrint >= 10000) {
            ultimoPrint = millis();
            Serial.printf("[GPS] Esperando... sats: %d\n", nmea.getNumSatellites());
        }
        delay(10);
    }

    if (!nmea.isValid()) {
        Serial.println("[GPS] Timeout sin fix.");
        return false;
    }

    Serial.println("[GPS] Fix obtenido. Estabilizando (descartando 4 lecturas)...");

    // --- Warm-up: descartar las primeras 4 lecturas ---
    for (int i = 0; i < 4; i++) {
        unsigned long t = millis();
        while (millis() - t < 1000) {
            while (gpsSerial.available()) nmea.process(gpsSerial.read());
            delay(10);
        }
        Serial.printf("[GPS] Descartando lectura %d/4\n", i + 1);
    }

    // --- Tomar 7 lecturas ---
    float lats[7], lons[7];
    float alts[7];
    int   hdops[7];

    Serial.println("[GPS] Tomando 7 lecturas...");
    for (int i = 0; i < 7; i++) {
        unsigned long t = millis();
        while (millis() - t < 1000) {
            while (gpsSerial.available()) nmea.process(gpsSerial.read());
            delay(10);
        }
        lats[i]  = nmea.getLatitude()  / 1e6f;
        lons[i]  = nmea.getLongitude() / 1e6f;
        long alt = 0;
        alts[i]  = nmea.getAltitude(alt) ? (float)(alt / 1000) : 0.0f;
        hdops[i] = nmea.getHDOP();
        Serial.printf("[GPS] Lectura %d/7 — Lat: %.6f  Lon: %.6f\n", i + 1, lats[i], lons[i]);
    }

    // --- Descartar max y min de lat, promediar las 5 restantes ---
    int minIdx = 0, maxIdx = 0;
    for (int i = 1; i < 7; i++) {
        if (lats[i] < lats[minIdx]) minIdx = i;
        if (lats[i] > lats[maxIdx]) maxIdx = i;
    }

    float sumLat = 0, sumLon = 0, sumAlt = 0;
    long  sumHdop = 0;
    int   count   = 0;

    for (int i = 0; i < 7; i++) {
        if (i == minIdx || i == maxIdx) continue;
        sumLat  += lats[i];
        sumLon  += lons[i];
        sumAlt  += alts[i];
        sumHdop += hdops[i];
        count++;
    }

    float avgLat  = sumLat  / count;
    float avgLon  = sumLon  / count;
    float avgAlt  = sumAlt  / count;
    float avgHdop = sumHdop / (float)count;

    // Guardar en RTC memory
    lastLat      = (int32_t)(avgLat  * 1e6f);
    lastLon      = (int32_t)(avgLon  * 1e6f);
    lastAlt      = (int16_t)avgAlt;
    lastHdop     = (uint8_t)min((int)avgHdop, 255);
    lastGpsValid = true;
    gpsEsteciclo = true;

    Serial.printf("[GPS] Posicion final — Lat: %.6f  Lon: %.6f  Alt: %dm  HDOP: %.1f\n",
        avgLat, avgLon, lastAlt, avgHdop / 10.0f);

    return true;
}

void gpsRunYApagar() {
    gpsEncender();
    bool ok = gpsBuscarFix();
    gpsApagar();

    if (!ok) {
        Serial.println(lastGpsValid
            ? "[GPS] Sin fix. Usando ultima posicion conocida."
            : "[GPS] Sin fix y sin posicion previa.");
    }
}


// ============================================================================
// SENSOR ULTRASÓNICO — RCWL-1655
// ============================================================================

float medirDistancia() {
    const unsigned long timeout = 60000;

    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(4);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(20);          // RCWL-1655 requiere mínimo 20µs
    digitalWrite(TRIG_PIN, LOW);

    // Esperar flanco de subida del ECHO
    unsigned long t = micros();
    while (digitalRead(ECHO_PIN) == LOW && micros() - t < timeout);
    if (micros() - t >= timeout) return -1.0;

    // Medir duración del pulso ECHO
    unsigned long echoStart = micros();
    while (digitalRead(ECHO_PIN) == HIGH && micros() - echoStart < timeout);
    if (micros() - echoStart >= timeout) return -1.0;

    unsigned long echoEnd = micros();

    float dist = (echoEnd - echoStart) * 0.0343f / 2.0f;
    return (dist >= 1.0f && dist <= 500.0f) ? dist : -1.0;
}

float medirNivelAgua() {
    digitalWrite(SENSOR_PWR_PIN, HIGH);
    delay(1000);  // RCWL-1655 necesita más tiempo de estabilización que el AJ-SR04M

    float suma    = 0.0;
    int   validas = 0;

    for (int i = 0; i < 3; i++) {
        float d = medirDistancia();
        if (d > 0.0) { suma += d; validas++; }
        delay(100);
    }

    digitalWrite(SENSOR_PWR_PIN, LOW);

    if (validas < 2) {
        Serial.printf("[SENSOR] Error: %d/3 validas\n", validas);
        return -1.0;
    }

    float distPromedio = suma / validas;
    float nivel = (float)ALTURA_SENSOR_CM - distPromedio;

    Serial.printf("[SENSOR] Distancia: %.1f cm  Nivel: %.1f cm  (%d/3 OK)\n",
        distPromedio, nivel, validas);

    return max(nivel, 0.0f);
}


// ============================================================================
// DOWNLINK
// ============================================================================

void procesarDownlink(uint8_t* data, size_t len) {
    if (len < 1) return;

    Serial.printf("[DL] %d bytes | Cmd: 0x%02X\n", len, data[0]);

    switch (data[0]) {

        case 0x01:
            if (len >= 3) {
                uint16_t nuevo = (uint16_t)data[1] | ((uint16_t)data[2] << 8);
                if (nuevo >= 10 && nuevo <= 86400) {
                    sleepInterval = nuevo;
                    Serial.printf("[DL] Intervalo -> %d s\n", sleepInterval);
                } else {
                    Serial.printf("[DL] Intervalo rechazado: %d\n", nuevo);
                }
            }
            break;

        case 0x02:
            Serial.println("[DL] Reiniciando...");
            Serial.flush();
            delay(100);
            esp_restart();
            break;

        case 0x03:
            gpsRequested = true;
            Serial.println("[DL] GPS solicitado para el proximo ciclo.");
            break;

        default:
            Serial.printf("[DL] Cmd desconocido: 0x%02X\n", data[0]);
            break;
    }
}


// ============================================================================
// ENVÍO
// ============================================================================

void do_send(osjob_t* j) {
    if (LMIC.opmode & OP_TXRXPEND) {
        os_setTimedCallback(j, os_getTime() + sec2osticks(5), do_send);
        return;
    }

    float nivel  = medirNivelAgua();
    bool  aguaOk = (nivel >= 0.0);

    uint8_t payload[12] = {0};

    uint8_t flags = 0;
    if (lastGpsValid)  flags |= 0x01;
    if (aguaOk)        flags |= 0x02;
    if (gpsEsteciclo)  flags |= 0x04;
    if (firstBoot)     flags |= 0x08;
    payload[0] = flags;

    uint16_t nivelMm = aguaOk ? (uint16_t)(nivel * 10.0f) : 0xFFFF;
    payload[1] = (nivelMm >> 8) & 0xFF;
    payload[2] =  nivelMm       & 0xFF;

    int32_t lat = lastLat;
    payload[3]  = (lat >> 24) & 0xFF;
    payload[4]  = (lat >> 16) & 0xFF;
    payload[5]  = (lat >>  8) & 0xFF;
    payload[6]  =  lat        & 0xFF;

    int32_t lon = lastLon;
    payload[7]  = (lon >> 24) & 0xFF;
    payload[8]  = (lon >> 16) & 0xFF;
    payload[9]  = (lon >>  8) & 0xFF;
    payload[10] =  lon        & 0xFF;

    payload[11] = lastHdop;

    Serial.printf("[LORA] Enviando %d bytes | Msg #%lu\n", sizeof(payload), messageCount);
    Serial.printf("       flags=0x%02X  nivel=%s cm  lat=%.6f  lon=%.6f\n",
        flags,
        aguaOk ? String(nivel, 1).c_str() : "ERROR",
        lat / 1e6, lon / 1e6);

    LMIC_setTxData2(2, payload, sizeof(payload), 0);
    messageCount++;
}


// ============================================================================
// DEEP SLEEP
// ============================================================================

void entrarDeepSleep() {
    RTC_LMIC      = LMIC;
    session_valid = true;

    Serial.printf("[SLEEP] Durmiendo %d s\n", sleepInterval);
    Serial.flush();

    esp_sleep_enable_timer_wakeup((uint64_t)sleepInterval * 1000000ULL);
    esp_deep_sleep_start();
}


// ============================================================================
// EVENTOS LMIC
// ============================================================================

void onEvent(ev_t ev) {
    switch (ev) {

        case EV_JOINING:
            Serial.println("[LORA] OTAA join...");
            break;

        case EV_JOINED:
            Serial.println("[LORA] Join OK.");
            LMIC_setLinkCheckMode(0);
            do_send(&sendjob);
            break;

        case EV_JOIN_FAILED:
            Serial.println("[LORA] Join fallido.");
            entrarDeepSleep();
            break;

        case EV_REJOIN_FAILED:
            Serial.println("[LORA] Rejoin fallido.");
            entrarDeepSleep();
            break;

        case EV_TXCOMPLETE:
            Serial.println("[LORA] TX completo.");
            Serial.printf("       txrxFlags: 0x%02X  dataLen: %d\n",
                LMIC.txrxFlags, LMIC.dataLen);

            if (LMIC.txrxFlags & TXRX_ACK) {
                Serial.println("[LORA] ACK recibido.");
            }

            if (LMIC.dataLen > 0) {
                Serial.printf("[LORA] Downlink: %d bytes\n", LMIC.dataLen);
                procesarDownlink(LMIC.frame + LMIC.dataBeg, LMIC.dataLen);
            }

            if (firstBoot) {
                Serial.println("[GPS] Primer boot: buscando posicion post-TX...");
                gpsRunYApagar();
            }

            entrarDeepSleep();
            break;

        case EV_TXSTART:
            Serial.println("[LORA] TX iniciado.");
            break;

        case EV_LINK_DEAD:
            Serial.println("[LORA] Link muerto. Forzando re-JOIN.");
            session_valid = false;
            entrarDeepSleep();
            break;

        default:
            break;
    }
}


// ============================================================================
// SETUP
// ============================================================================

void setup() {
    Serial.begin(115200);
    delay(100);

    bootCount++;
    firstBoot    = (esp_sleep_get_wakeup_cause() == ESP_SLEEP_WAKEUP_UNDEFINED);
    gpsEsteciclo = false;

    Serial.printf("\n=== BOOT #%lu | MSG #%lu | Intervalo: %d s | Wakeup: %s ===\n",
        bootCount, messageCount, sleepInterval,
        firstBoot ? "Power ON" : "Timer");

    // --- Pines sensor ---
    pinMode(SENSOR_PWR_PIN, OUTPUT);
    pinMode(TRIG_PIN,        OUTPUT);
    pinMode(ECHO_PIN,        INPUT);
    digitalWrite(SENSOR_PWR_PIN, LOW);
    digitalWrite(TRIG_PIN,       LOW);

    // --- GPS ---
    if (!firstBoot && gpsRequested) {
        gpsRequested = false;
        Serial.println("[GPS] GPS solicitado — corriendo antes del TX...");
        gpsRunYApagar();
    } else {
        pinMode(PNP_GPS,   OUTPUT);
        pinMode(RESET_GPS, OUTPUT);
        digitalWrite(PNP_GPS,   HIGH);
        digitalWrite(RESET_GPS, HIGH);
        if (!firstBoot) {
            Serial.println("[GPS] Usando posicion en RTC.");
        }
    }

    // --- LoRa / LMIC ---
    SPI.begin(LORA_SCK, LORA_MISO, LORA_MOSI, LORA_NSS);
    os_init();

    LMIC_setClockError(MAX_CLOCK_ERROR * 30 / 100);
    LMIC_setAdrMode(0);
    LMIC_setDrTxpow(DR_SF7, 14);
    LMIC_setLinkCheckMode(0);

    if (session_valid) {
        Serial.println("[LORA] Restaurando sesion desde RTC...");
        LMIC = RTC_LMIC;

        ostime_t now = os_getTime();
        LMIC.globalDutyAvail = now;
        LMIC.opmode &= ~(OP_JOINING | OP_REJOIN | OP_TXDATA | OP_POLL);

        Serial.printf("[LORA] FCnt up=%lu dn=%lu\n", LMIC.seqnoUp, LMIC.seqnoDn);
        do_send(&sendjob);
    } else {
        Serial.println("[LORA] Iniciando OTAA...");
        LMIC_reset();
        LMIC_selectSubBand(1);
        LMIC_startJoining();
    }
}


// ============================================================================
// LOOP
// ============================================================================

void loop() {
    os_runloop_once();
}