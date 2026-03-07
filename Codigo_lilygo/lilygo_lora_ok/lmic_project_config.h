// project-specific definitions
// 
// This file should be included in the sketch to get the right configuration.

#ifndef _lmic_project_config_h_
#define _lmic_project_config_h_

// Uncomment the region you are using
// #define CFG_eu868 1
#define CFG_us915 1
// #define CFG_au915 1
// #define CFG_as923 1
// #define CFG_kr920 1
// #define CFG_in866 1

// Si estás en Norteamérica/Sudamérica, descomenta US915:
#define CFG_us915 1

// Si estás en Europa, descomenta EU868:
// #define CFG_eu868 1

// LoRaWAN version
#define LMIC_LORAWAN_SPEC_VERSION   LMIC_LORAWAN_SPEC_VERSION_1_0_3

// Enable Class A
#define LMIC_ENABLE_DeviceTimeReq 0

// Disable PING
#define LMIC_ENABLE_user_events 0

// Disable BEACONS
#define DISABLE_BEACONS

// Disable PING
#define DISABLE_PING

// Enable only FSK (if required, usually not needed for LoRaWAN)
// #define LMIC_ENABLE_onEvent 1

// Use ESP32 hardware AES (important!)
#define USE_ORIGINAL_AES

// Enable SX1276/SX1277/SX1278/SX1279 (for RFM95, etc.)
#define CFG_sx1276_radio 1

#endif // _lmic_project_config_h_