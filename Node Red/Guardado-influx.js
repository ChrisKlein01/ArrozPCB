[
    {
        id 854fad5f7ff5d276,
        type tab,
        label Guardado de mqtt a Influx,
        disabled false,
        info ,
        env []
    },
    {
        id ad61262238793178,
        type debug,
        z 854fad5f7ff5d276,
        name salida funcion,
        active false,
        tosidebar true,
        console false,
        tostatus false,
        complete true,
        targetType full,
        statusVal ,
        statusType auto,
        x 540,
        y 200,
        wires []
    },
    {
        id 35e9045a93e568d8,
        type debug,
        z 854fad5f7ff5d276,
        name salida mqtt topico,
        active false,
        tosidebar true,
        console false,
        tostatus false,
        complete payload,
        targetType msg,
        statusVal ,
        statusType auto,
        x 290,
        y 200,
        wires []
    },
    {
        id e56dd3e71d233ba7,
        type function,
        z 854fad5f7ff5d276,
        name function 1,
        func try {n     --- Metadatos ---n    var deviceId = msg.payload.end_device_ids.device_id;n    var uplink   = msg.payload.uplink_message  {};nn     --- Decodificar payload binario (12 bytes) ---n    var raw = Buffer.from(uplink.frm_payload  , base64);n    if (raw.length  12) throw new Error(Payload corto  + raw.length +  bytes);nn     Byte 0 flagsn    var flags       = raw[0];n    var gpsValido   = !!(flags & 0x01);n    var aguaValida  = !!(flags & 0x02);n    var gpsActualiz = !!(flags & 0x04);n    var primerBoot  = !!(flags & 0x08);nn     Bytes 1-2 nivel de agua en cm (uint16 big-endian, 0xFFFF = error)n    var nivelRaw = (raw[1]  8)  raw[2];n    var nivel    = (nivelRaw === 0xFFFF)  null  nivelRaw  10.0;nn     Bytes 3-6 latitud × 10^6 (int32 big-endian)n    var latDispositivo = raw.readInt32BE(3)  1e6;nn     Bytes 7-10 longitud × 10^6 (int32 big-endian)n    var lonDispositivo = raw.readInt32BE(7)  1e6;nn     Byte 11 HDOP × 10n    var hdopRaw = raw[11];n    var hdop    = (hdopRaw === 255)  null  hdopRaw  10.0;nn     --- Posición a usar ---n     Si el usuario configuró una posición manual desde el dashboard,n     se usa esa. Si no, se usa la del GPS del dispositivo.n    var manualLat = flow.get(manual_lat)  null;n    var manualLon = flow.get(manual_lon)  null;n    var usandoManual = (manualLat !== null && manualLon !== null);nn    var lat = usandoManual  manualLat  latDispositivo;n    var lon = usandoManual  manualLon  lonDispositivo;nn    var tags = `device_id=${deviceId}`;n    var lines = [];nn     Measurement nivel de aguan    if (nivel !== null) {n        lines.push(nivel_agua, + tags +  value= + nivel);n    }nn     Measurement posición GPSn    var posValida = usandoManual  (gpsValido && lat !== 0 && lon !== 0);n    if (posValida) {n        var fuente   = usandoManual  manual  gps;n        var hdopStr  = (hdop !== null && !usandoManual)  ,hdop= + hdop  ;n        lines.push(n            posicion, + tags + ,fuente= + fuente +n             lat= + lat.toFixed(6) +n            ,lon= + lon.toFixed(6) +n            hdopStrn    );n}nn     Measurement estado del dispositivon    lines.push(n        `device_status,${tags} ` +n        `gps_valido=${gpsValido  1  0}i,` +n        `agua_valida=${aguaValida  1  0}i,` +n        `primer_boot=${primerBoot  1  0}i,` +n        `flags=${flags}i`n    );nnmsg.payload = lines.join(String.fromCharCode(10));    nreturn msg;nn} catch (error) {n    msg.payload = `errores,device_id=unknown detail=${error.message} value=-999i`;n    return msg;n},
        outputs 1,
        timeout 0,
        noerr 0,
        initialize ,
        finalize ,
        libs [],
        x 300,
        y 100,
        wires [
            [
                ad61262238793178,
                20ffbbef2c4f2da3
            ]
        ]
    },
    {
        id 20ffbbef2c4f2da3,
        type http request,
        z 854fad5f7ff5d276,
        name ,
        method POST,
        ret txt,
        paytoqs ignore,
        url httplocalhost8086apiv2writeorg=org&bucket=Data%20Testing&precision=ns,
        tls ,
        persist false,
        proxy ,
        insecureHTTPParser false,
        authType ,
        senderr false,
        headers [
            {
                keyType other,
                keyValue Content-Type,
                valueType other,
                valueValue textplain; charset=utf-8
            },
            {
                keyType other,
                keyValue Authorization,
                valueType other,
                valueValue Token NydXnO_-7GEzFjC3fYHO1qX4IajRlwPb7vPjAPuQiRcOsc6pgwdRplyiQT9UEUmQqEolLTJKj1BTZdHdMNF7pw==
            }
        ],
        x 550,
        y 100,
        wires [
            [
                38914500ac68286f
            ]
        ]
    },
    {
        id 38914500ac68286f,
        type debug,
        z 854fad5f7ff5d276,
        name salida http,
        active false,
        tosidebar true,
        console false,
        tostatus false,
        complete payload,
        targetType msg,
        statusVal ,
        statusType auto,
        x 730,
        y 140,
        wires []
    },
    {
        id adac8d2dd142ce5e,
        type mqtt in,
        z 854fad5f7ff5d276,
        name mqtt_topico,
        topic v3end-devices-tesis-arroz@ttndevices+up,
        qos 2,
        datatype auto-detect,
        broker e36ab688aa95a3d9,
        nl false,
        rap true,
        rh 0,
        inputs 0,
        x 70,
        y 100,
        wires [
            [
                35e9045a93e568d8,
                e56dd3e71d233ba7
            ]
        ]
    },
    {
        id e36ab688aa95a3d9,
        type mqtt-broker,
        name mqttArroz,
        broker nam1.cloud.thethings.network,
        port 1883,
        clientid ,
        autoConnect true,
        usetls false,
        protocolVersion 4,
        keepalive 60,
        cleansession true,
        autoUnsubscribe true,
        birthTopic ,
        birthQos 0,
        birthRetain false,
        birthPayload ,
        birthMsg {},
        closeTopic ,
        closeQos 0,
        closeRetain false,
        closePayload ,
        closeMsg {},
        willTopic ,
        willQos 0,
        willRetain false,
        willPayload ,
        willMsg {},
        userProps ,
        sessionExpiry 
    }
]