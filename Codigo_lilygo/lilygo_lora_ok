#include <SPI.h>
#include <driver/rtc_io.h>
#include <esp_sleep.h>
#include <hal/hal.h>

// Configuración OTAA
static const u1_t PROGMEM APPEUI[8] = { 
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
};
void os_getArtEui(u1_t* buf) { memcpy_P(buf, APPEUI, 8); }

static const u1_t PROGMEM DEVEUI[8] = { 
    0xCA,0x22,0x07,0xD0,0x7E,0xD5,0xB3,0x70
};
void os_getDevEui(u1_t* buf) { memcpy_P(buf, DEVEUI, 8); }

static const u1_t PROGMEM APPKEY[16] = { 
    0xD1,0xBA,0xF4,0x60,0x7C,0x4A,0x3F,0x8B,
    0x4F,0xB8,0xCB,0xD3,0xC1,0x65,0xA4,0xAD
};
void os_getDevKey(u1_t* buf) { memcpy_P(buf, APPKEY, 16); }

// Pines LilyGO T3
const lmic_pinmap lmic_pins = {
    .nss = 18,
    .rxtx = LMIC_UNUSED_PIN,
    .rst = 23,
    .dio = {26, 33, 32},
    .rxtx_rx_active = 0,
    .rssi_cal = 10,
    .spi_freq = 8000000
};

// Pines sensor ultrasónico
#define TRIG_PIN        12
#define ECHO_PIN        14
#define SENSOR_PWR_PIN  13

// Intervalo de sleep en segundos (pruebas: 15 s)
const unsigned SLEEP_INTERVAL = 15;

// Contador de reinicios
RTC_DATA_ATTR int bootCount = 0;

// Estructura para sesión LoRaWAN con contador
struct sessionState_t {
    u4_t netid;
    devaddr_t devaddr;
    u1_t nwkKey[16];
    u1_t artKey[16];
    u4_t seqnoUp;        // ← Nuevo: contador de frames
};
RTC_DATA_ATTR sessionState_t savedSession;

static osjob_t sendjob;

// Medir distancia
float medirDistancia() {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(4);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(15);
    digitalWrite(TRIG_PIN, LOW);

    unsigned long timeout = 60000;
    unsigned long start = micros();
    while (digitalRead(ECHO_PIN) == LOW && micros() - start < timeout);
    start = micros();
    while (digitalRead(ECHO_PIN) == HIGH && micros() - start < timeout);
    unsigned long duracion = micros() - start;

    float distancia = duracion * 0.0343 / 2;
    if (distancia <= 1 || distancia > 500) return -1.0;
    return distancia;
}

// Enviar datos
void do_send(osjob_t* j) {
    if (LMIC.opmode & OP_TXRXPEND) {
        Serial.println(F("OP_TXRXPEND - Posponiendo envío"));
        os_setTimedCallback(j, os_getTime() + sec2osticks(5), do_send);
    } else {
        digitalWrite(SENSOR_PWR_PIN, HIGH);
        delay(50);
        float distancia = medirDistancia();
        digitalWrite(SENSOR_PWR_PIN, LOW);

        char payload[20];
        if (distancia < 0) {
            strcpy(payload, "ERROR");
        } else {
            dtostrf(distancia, 4, 1, payload);
        }
        Serial.print("Enviando: ");
        Serial.println(payload);

        LMIC_setTxData2(1, (uint8_t*)payload, strlen(payload), 0);

        // Guardar el seqnoUp justo antes de enviar
        savedSession.seqnoUp = LMIC.seqnoUp;
    }
}

// Entra en deep sleep
void entrarDeepSleep() {
    Serial.print(F("Iniciando deep sleep de "));
    Serial.print(SLEEP_INTERVAL);
    Serial.println(F(" s"));

    // Guardar sesión LoRaWAN completa
    if (LMIC.devaddr != 0) {
        savedSession.netid   = LMIC.netid;
        savedSession.devaddr = LMIC.devaddr;
        memcpy(savedSession.nwkKey, LMIC.nwkKey, 16);
        memcpy(savedSession.artKey, LMIC.artKey, 16);
        // seqnoUp ya se guardó en do_send()
    }

    // Asegurar pines en bajo
    rtc_gpio_set_direction(GPIO_NUM_26, RTC_GPIO_MODE_OUTPUT_ONLY);
    rtc_gpio_set_level(GPIO_NUM_26, 0);
    rtc_gpio_set_direction(GPIO_NUM_32, RTC_GPIO_MODE_OUTPUT_ONLY);
    rtc_gpio_set_level(GPIO_NUM_32, 0);
    rtc_gpio_set_direction(GPIO_NUM_33, RTC_GPIO_MODE_OUTPUT_ONLY);
    rtc_gpio_set_level(GPIO_NUM_33, 0);
    digitalWrite(lmic_pins.rst, LOW);

    // Mantener activo solo el periférico RTC
    esp_sleep_pd_config(ESP_PD_DOMAIN_RTC_PERIPH, ESP_PD_OPTION_ON);
    uint64_t wakeUs = (uint64_t)SLEEP_INTERVAL * 1000000ULL;
    esp_sleep_enable_timer_wakeup(wakeUs);

    esp_deep_sleep_start();
}

void onEvent(ev_t ev) {
    Serial.print(os_getTime());
    Serial.print(F(": "));
    switch (ev) {
        case EV_JOINED:
            Serial.println(F("EV_JOINED"));
            LMIC_setLinkCheckMode(0);
            do_send(&sendjob);
            break;
        case EV_TXCOMPLETE:
            Serial.println(F("EV_TXCOMPLETE"));
            entrarDeepSleep();
            break;
        case EV_JOIN_FAILED:
        case EV_REJOIN_FAILED:
            Serial.println(F("JOIN_FAILED/Rejoin"));
            entrarDeepSleep();
            break;
        default:
            Serial.print(F("Evento: "));
            Serial.println(ev, HEX);
    }
}

void setup() {
    Serial.begin(115200);
    delay(3000);

    bootCount++;
    Serial.println(F("\n=== MONITOREO HIDRICO ==="));
    Serial.print(F("Reinicio #")); Serial.println(bootCount);

    // Causa de wakeup
    esp_sleep_wakeup_cause_t reason = esp_sleep_get_wakeup_cause();
    Serial.print(F("Wakeup cause: ")); Serial.println(reason);

    // Pines
    pinMode(SENSOR_PWR_PIN, OUTPUT);
    digitalWrite(SENSOR_PWR_PIN, LOW);
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    digitalWrite(TRIG_PIN, LOW);

    // Prueba sensor
    digitalWrite(SENSOR_PWR_PIN, HIGH);
    delay(50);
    float test = medirDistancia();
    digitalWrite(SENSOR_PWR_PIN, LOW);
    Serial.print(F("Test sensor: ")); Serial.println(test);

    // Init LoRa
    SPI.begin(5, 19, 27, 18);
    pinMode(lmic_pins.rst, OUTPUT);
    digitalWrite(lmic_pins.rst, LOW);
    delay(100);
    digitalWrite(lmic_pins.rst, HIGH);
    delay(1000);

    os_init();
    LMIC_reset();

    // Restaurar sesión o unir
    if (savedSession.devaddr != 0) {
        LMIC_setSession(
            savedSession.netid,
            savedSession.devaddr,
            savedSession.nwkKey,
            savedSession.artKey
        );
        LMIC.seqnoUp = savedSession.seqnoUp;  // <-- Restaurar contador
        Serial.print(F("Sesión restaurada, seqnoUp = "));
        Serial.println(LMIC.seqnoUp);
        LMIC_setLinkCheckMode(0);
        LMIC_setDrTxpow(DR_SF7, 14);
        LMIC_selectSubBand(1);
        do_send(&sendjob);
    } else {
        Serial.println(F("Iniciando unión OTAA..."));
        LMIC_setLinkCheckMode(0);
        LMIC_setDrTxpow(DR_SF7, 14);
        LMIC_selectSubBand(1);
        LMIC_startJoining();
    }
}

void loop() {
    os_runloop_once();
}
