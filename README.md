# ArrozPCB

Embedded IoT system for LoRa + GPS telemetry, integrating firmware, PCB design iterations, and a Node-RED backend.

## System overview

End-to-end prototype for wireless telemetry using LoRa communication and GPS data acquisition, covering embedded firmware, proof-of-concept validation on third-party hardware, custom PCB development, and data processing pipeline.

## Repository structure

- `Codigo_lilygo/`  
  Proof-of-concept implementation using a LilyGO T3 v1.6.1 development board. Used for early validation of LoRa communication and end-to-end data flow using an initial Node-RED pipeline before custom PCB and GPS integration.

- `Firmware/`  
  Main embedded firmware for the custom PCB. Handles GPS acquisition, LoRa communication, and system logic.

- `Node Red/`  
  Node-RED flows for ingestion, processing, and visualization of telemetry data.

- `Envolvente/`  
  Mechanical enclosure design for system housing and protection.

- `V1.0/`  
  First PCB iteration (LoRa-only hardware prototype).

- `v2.0/`  
  PCB redesign adding GPS integration and correcting initial layout issues.

- `V3.0/`  
  Final PCB revision with optimized layout and system integration improvements.

- `.gitignore`  
  Git ignore rules for build artifacts and temporary files.

- `README.md`  
  Project documentation.

## Development flow

1. Proof-of-concept on LilyGO development board  
2. Validation of LoRa communication and initial system pipeline using Node-RED  
3. First custom PCB (V1.0)  
4. PCB redesign with GPS integration (V2.0)  
5. Final optimized hardware revision (V3.0)  
6. Integration with Node-RED backend

## Scope

Full embedded system covering:
- Embedded firmware (C/C++)
- LoRa wireless communication
- GPS integration
- Iterative PCB design (KiCad)
- IoT backend (Node-RED)
- Mechanical enclosure design
