[
    {
        "id": "a1cf9e683b2c8e5e",
        "type": "tab",
        "label": "Dashboard IoT Agua",
        "disabled": false,
        "info": ""
    },
    {
        "id": "ab2b4a59920bed3c",
        "type": "inject",
        "z": "a1cf9e683b2c8e5e",
        "name": "Init",
        "props": [
            {
                "p": "payload"
            }
        ],
        "repeat": "",
        "once": true,
        "onceDelay": 0.3,
        "payload": "",
        "payloadType": "str",
        "x": 120,
        "y": 40,
        "wires": [
            [
                "95e1489376a3061e"
            ]
        ]
    },
    {
        "id": "95e1489376a3061e",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "CONFIGURACION CENTRAL",
        "func": "global.set('influx_token','NydXnO_-7GEzFjC3fYHO1qX4IajRlwPb7vPjAPuQiRcOsc6pgwdRplyiQT9UEUmQqEolLTJKj1BTZdHdMNF7pw==');\nglobal.set('influx_bucket','Data Testing');\nglobal.set('influx_org','org');\nglobal.set('influx_url','http://localhost:8086');\nglobal.set('ttn_api_key','NNSXS.DH7LFFOMQES3KGCPWVMIXOL22TPAJWKXHAD2FJY.NAWKECILO5TB5YDMODKG3OZZ36JMV2LA2SZ3S7G74ELGK44AWCVQ');\nglobal.set('ttn_app_id','end-devices-tesis-arroz');\nglobal.set('ttn_cluster','nam1.cloud.thethings.network');\nreturn msg;",
        "outputs": 1,
        "x": 330,
        "y": 40,
        "wires": [
            []
        ]
    },
    {
        "id": "eb623893d486f050",
        "type": "inject",
        "z": "a1cf9e683b2c8e5e",
        "name": "Refresh 30s",
        "props": [
            {
                "p": "payload"
            }
        ],
        "repeat": "30",
        "once": true,
        "onceDelay": 2,
        "payload": "",
        "payloadType": "str",
        "x": 120,
        "y": 160,
        "wires": [
            [
                "3369a92d859b7357"
            ]
        ]
    },
    {
        "id": "3369a92d859b7357",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Query Nivel",
        "func": "var t=global.get('influx_token')||'';\nvar b=global.get('influx_bucket')||'Data Testing';\nvar o=global.get('influx_org')||'org';\nvar u=global.get('influx_url')||'http://localhost:8086';\nmsg.headers={'Authorization':'Token '+t,'Content-Type':'application/vnd.flux','Accept':'application/csv'};\nmsg.method='POST'; msg.url=u+'/api/v2/query?org='+o;\nmsg.payload='from(bucket: \"'+b+'\")\\n  |> range(start: -24h)\\n  |> filter(fn: (r) => r._measurement == \"nivel_agua\" and r._field == \"value\")\\n  |> group(columns: [\"device_id\"])\\n  |> last()\\n  |> group()';\nreturn msg;",
        "outputs": 1,
        "x": 310,
        "y": 160,
        "wires": [
            [
                "a18063fc3c67230e"
            ]
        ]
    },
    {
        "id": "a18063fc3c67230e",
        "type": "http request",
        "z": "a1cf9e683b2c8e5e",
        "name": "GET Nivel",
        "method": "use",
        "ret": "txt",
        "url": "",
        "x": 490,
        "y": 160,
        "wires": [
            [
                "2a6f71ff54ac1156"
            ]
        ]
    },
    {
        "id": "2a6f71ff54ac1156",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Parse Nivel",
        "func": "var lines=msg.payload.split('\\n'),hdr=null,data={};\nfor(var i=0;i<lines.length;i++){\n  var l=lines[i].trim(); if(!l||l.startsWith('#'))continue;\n  if(!hdr){hdr=l;continue;}\n  var H=hdr.split(','),C=l.split(','),R={};\n  H.forEach(function(h,x){R[h.trim()]=C[x]?C[x].trim():''});\n  if(R.device_id&&!isNaN(parseFloat(R._value)))data[R.device_id]={nivel:parseFloat(R._value),lastSeen:R._time};\n}\nflow.set('nivel_data',data); return msg;",
        "outputs": 1,
        "x": 670,
        "y": 160,
        "wires": [
            [
                "c0c7181f1a5150b6"
            ]
        ]
    },
    {
        "id": "c0c7181f1a5150b6",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Query Posicion",
        "func": "var t=global.get('influx_token')||'';\nvar b=global.get('influx_bucket')||'Data Testing';\nvar o=global.get('influx_org')||'org';\nvar u=global.get('influx_url')||'http://localhost:8086';\nmsg.headers={'Authorization':'Token '+t,'Content-Type':'application/vnd.flux','Accept':'application/csv'};\nmsg.method='POST'; msg.url=u+'/api/v2/query?org='+o;\nmsg.payload='from(bucket: \"'+b+'\")\\n  |> range(start: -365d)\\n  |> filter(fn: (r) => r._measurement == \"posicion\")\\n  |> group(columns: [\"device_id\", \"_field\"])\\n  |> last()\\n  |> group()';\nreturn msg;",
        "outputs": 1,
        "x": 310,
        "y": 220,
        "wires": [
            [
                "ee06297d603e1555"
            ]
        ]
    },
    {
        "id": "ee06297d603e1555",
        "type": "http request",
        "z": "a1cf9e683b2c8e5e",
        "name": "GET Posicion",
        "method": "use",
        "ret": "txt",
        "url": "",
        "x": 490,
        "y": 220,
        "wires": [
            [
                "d321eaf53f276f98"
            ]
        ]
    },
    {
        "id": "d321eaf53f276f98",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Merge → Sensores",
        "func": "var csv=msg.payload;\nvar lines=csv.split('\\n');\nvar hdr=null,pos={};\nfor(var i=0;i<lines.length;i++){\n  var l=lines[i].trim(); if(!l||l.startsWith('#'))continue;\n  if(!hdr){hdr=l;continue;}\n  var H=hdr.split(','),C=l.split(','),R={};\n  H.forEach(function(h,x){R[h.trim()]=C[x]?C[x].trim():''});\n  var dev=R.device_id,fld=R._field,val=parseFloat(R._value),fte=R.fuente||'gps';\n  if(!dev||!fld||isNaN(val))continue;\n  if(!pos[dev])pos[dev]={fuente:fte};\n  pos[dev][fld]=val; pos[dev].fuente=fte;\n}\nvar niv=flow.get('nivel_data')||{};\nvar manuals=flow.get('manual_positions')||{};\nvar all={};\nObject.keys(niv).forEach(function(d){all[d]=1;});\nObject.keys(pos).forEach(function(d){all[d]=1;});\nvar sensors=Object.keys(all).map(function(dev){\n  var n=niv[dev]||{},p=pos[dev]||{};\n  var m=manuals[dev];\n  var hasM=m&&m.lat!=null&&m.lon!=null;\n  return{\n    device_id:dev,\n    nivel:n.nivel!=null?n.nivel:null,\n    lastSeen:n.lastSeen||null,\n    lat:hasM?m.lat:(p.lat||0),\n    lon:hasM?m.lon:(p.lon||0),\n    hdop:p.hdop||null,\n    fuente:hasM?'manual':(p.fuente||'sin gps'),\n    gpsValido:!hasM&&p.lat!=null&&p.lat!==0\n  };\n});\nflow.set('sensors',sensors);\nmsg.payload=sensors; return msg;",
        "outputs": 1,
        "x": 680,
        "y": 220,
        "wires": [
            [
                "b7d80edf2e0fa43f",
                "9343aed62f0550ee",
                "ca3760ad76826e0d",
                "c1f0d073b45f4ad3"
            ]
        ]
    },
    {
        "id": "b7d80edf2e0fa43f",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "→ Gauges",
        "func": "function gc(n){if(n===null)return'#9e9e9e';if(n<20)return'#90CAF9';if(n<50)return'#1976D2';return'#0D47A1';}\nfunction ft(iso){if(!iso)return'Sin datos';return new Date(iso).toLocaleString('es-UY',{timeZone:'America/Montevideo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});}\nmsg.payload={sensors:msg.payload.map(function(s){return{id:s.device_id,nivel:s.nivel!==null?s.nivel.toFixed(1):'N/A',color:gc(s.nivel),pct:s.nivel!==null?Math.min((s.nivel/100)*100,100):0,lastSeen:ft(s.lastSeen)};})};\nreturn msg;",
        "outputs": 1,
        "x": 900,
        "y": 160,
        "wires": [
            [
                "e8fc76d4e8fc5442"
            ]
        ]
    },
    {
        "id": "9343aed62f0550ee",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "→ Tabla",
        "func": "function ft(iso){if(!iso)return'-';return new Date(iso).toLocaleString('es-UY',{timeZone:'America/Montevideo',day:'2-digit',month:'2-digit',year:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'});}\nmsg.payload=msg.payload.map(function(s){return{'Sensor':s.device_id,'Nivel (cm)':s.nivel!==null?s.nivel.toFixed(1):'N/A','GPS':s.gpsValido?'OK':'-','Lat':s.lat!==0?s.lat.toFixed(6):'-','Lon':s.lon!==0?s.lon.toFixed(6):'-','Fuente':s.fuente,'Ultima Act.':ft(s.lastSeen)};});\nreturn msg;",
        "outputs": 1,
        "x": 900,
        "y": 220,
        "wires": [
            [
                "dbe9c0313704442f"
            ]
        ]
    },
    {
        "id": "ca3760ad76826e0d",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "→ Mapa",
        "func": "function ft(iso){if(!iso)return'Sin datos';return new Date(iso).toLocaleString('es-UY',{timeZone:'America/Montevideo',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}\nvar msgs=msg.payload.filter(function(s){return s.lat!==0&&s.lon!==0;}).map(function(s){\n  return{payload:{name:s.device_id,lat:s.lat,lon:s.lon,icon:'tint',\n    iconColor:s.nivel!==null&&s.nivel>50?'blue':'lightblue',layer:'Sensores',\n    popup:'<b>'+s.device_id+'</b><br>Nivel: <b>'+(s.nivel!==null?s.nivel.toFixed(1)+' cm':'N/A')+'</b><br>GPS: '+s.fuente+'<br>'+ft(s.lastSeen)}};\n});\nreturn [msgs];",
        "outputs": 1,
        "x": 900,
        "y": 280,
        "wires": [
            [
                "24626fbfc3c71355"
            ]
        ]
    },
    {
        "id": "c1f0d073b45f4ad3",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "→ Dropdown",
        "func": "var opts = msg.payload.map(function(s) {\n    return { label: s.device_id, value: s.device_id };\n});\nflow.set('device_list', opts);\nmsg.payload = { options: opts, selected: flow.get('selected_sensor') || '' };\nreturn msg;\n",
        "outputs": 1,
        "x": 900,
        "y": 340,
        "wires": [
            [
                "369f9c04dd810e04"
            ]
        ]
    },
    {
        "id": "e8fc76d4e8fc5442",
        "type": "ui_template",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_gau",
        "name": "Gauges",
        "order": 1,
        "width": "20",
        "height": "6",
        "format": "<style>.gc{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;padding:14px;}.gi{text-align:center;padding:12px;background:#f8f9fa;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.1);}.gt{font-size:14px;font-weight:bold;color:#333;margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.gs{font-size:11px;color:#888;margin-top:6px;}</style><div class='gc'><div ng-repeat='s in msg.payload.sensors' class='gi'><div class='gt'>{{s.id}}</div><svg width='110' height='110' viewBox='0 0 110 110'><circle cx='55' cy='55' r='44' fill='none' stroke='#e9ecef' stroke-width='9'/><circle cx='55' cy='55' r='44' fill='none' ng-attr-stroke='{{s.color}}' stroke-width='8' stroke-dasharray='276.5' ng-attr-stroke-dashoffset='{{276.5-(276.5*s.pct/100)}}' transform='rotate(-90 55 55)' style='transition:stroke-dashoffset 0.6s ease;'/><text x='55' y='50' text-anchor='middle' style='font-size:22px;font-weight:bold;' ng-attr-fill='{{s.color}}'>{{s.nivel}}</text><text x='55' y='68' text-anchor='middle' style='font-size:12px;fill:#888;'>cm</text></svg><div class='gs'>{{s.lastSeen}}</div></div></div>",
        "storeOutMessages": false,
        "fwdInMessages": true,
        "resendOnRefresh": true,
        "templateScope": "local",
        "x": 1100,
        "y": 160,
        "wires": [
            []
        ]
    },
    {
        "id": "dbe9c0313704442f",
        "type": "ui_table",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_tbl",
        "name": "Tabla",
        "order": 1,
        "width": "20",
        "height": "5",
        "columns": [
            {
                "field": "Sensor",
                "title": "Sensor",
                "width": "130",
                "align": "left",
                "formatter": "plaintext"
            },
            {
                "field": "Nivel (cm)",
                "title": "Nivel (cm)",
                "width": "100",
                "align": "center",
                "formatter": "plaintext"
            },
            {
                "field": "GPS",
                "title": "GPS",
                "width": "60",
                "align": "center",
                "formatter": "plaintext"
            },
            {
                "field": "Lat",
                "title": "Latitud",
                "width": "120",
                "align": "center",
                "formatter": "plaintext"
            },
            {
                "field": "Lon",
                "title": "Longitud",
                "width": "120",
                "align": "center",
                "formatter": "plaintext"
            },
            {
                "field": "Fuente",
                "title": "Fuente",
                "width": "80",
                "align": "center",
                "formatter": "plaintext"
            },
            {
                "field": "Ultima Act.",
                "title": "Ultima Act.",
                "width": "170",
                "align": "left",
                "formatter": "plaintext"
            }
        ],
        "outputs": 0,
        "cts": false,
        "x": 1100,
        "y": 220,
        "wires": []
    },
    {
        "id": "24626fbfc3c71355",
        "type": "worldmap",
        "z": "a1cf9e683b2c8e5e",
        "name": "Mapa",
        "lat": "-34.90",
        "lon": "-56.15",
        "zoom": "12",
        "layer": "EsriS",
        "cluster": "",
        "maxage": "",
        "usermenu": "show",
        "layers": "show",
        "panit": "false",
        "panlock": "false",
        "zoomlock": "false",
        "hiderightclick": "false",
        "coords": "none",
        "showgrid": "false",
        "path": "/worldmap",
        "overlist": "",
        "maplist": "OSMC,EsriS",
        "mapname": "",
        "mapurl": "",
        "mapopt": "",
        "mapwms": false,
        "x": 1100,
        "y": 280,
        "wires": []
    },
    {
        "id": "0299d3bbf1d877f2",
        "type": "ui_template",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_map",
        "name": "Mapa iframe",
        "order": 1,
        "width": "20",
        "height": "14",
        "format": "<iframe src='/worldmap' style='width:100%;height:100%;border:none;border-radius:8px;'></iframe>",
        "storeOutMessages": false,
        "fwdInMessages": false,
        "resendOnRefresh": true,
        "templateScope": "local",
        "x": 1100,
        "y": 320,
        "wires": [
            []
        ]
    },
    {
        "id": "369f9c04dd810e04",
        "type": "ui_template",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_cmd",
        "name": "Selector Sensor",
        "order": 1,
        "width": "6",
        "height": "2",
        "format": "<div style='padding:4px 0;'>\n  <label style='font-size:12px;color:#555;font-weight:500;display:block;margin-bottom:4px;'>Sensor destino</label>\n  <select ng-model='sel' ng-change=\"send({payload:sel,topic:'selected_sensor'})\"\n          style='padding:7px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;width:200px;background:white;'>\n    <option value=''>-- Seleccione --</option>\n    <option value='__ALL__'>⬛ Todos</option>\n    <option value='pcb-1'>pcb-1</option>\n    <option value='pcb-2'>pcb-2</option>\n    <option value='pcb-3'>pcb-3</option>\n    <option value='pcb-4'>pcb-4</option>\n    <option value='pcb-5'>pcb-5</option>\n  </select>\n</div>\n",
        "storeOutMessages": false,
        "fwdInMessages": false,
        "resendOnRefresh": true,
        "templateScope": "local",
        "x": 1100,
        "y": 340,
        "wires": [
            [
                "aa0bef7c59101530"
            ]
        ]
    },
    {
        "id": "aa0bef7c59101530",
        "type": "change",
        "z": "a1cf9e683b2c8e5e",
        "name": "Guardar sensor",
        "rules": [
            {
                "t": "set",
                "p": "selected_sensor",
                "pt": "flow",
                "to": "payload",
                "tot": "msg"
            }
        ],
        "x": 1300,
        "y": 340,
        "wires": [
            []
        ]
    },
    {
        "id": "5cb7f8a402331ac1",
        "type": "ui_button",
        "z": "a1cf9e683b2c8e5e",
        "name": "Reiniciar",
        "group": "g_cmd",
        "order": 2,
        "width": "3",
        "height": "1",
        "passthru": false,
        "label": "Reiniciar",
        "color": "white",
        "bgcolor": "#e53935",
        "icon": "refresh",
        "payload": "{\"cmd\":\"reboot\"}",
        "payloadType": "json",
        "x": 130,
        "y": 440,
        "wires": [
            [
                "65a964a100203e0b"
            ]
        ]
    },
    {
        "id": "70ea6c3dd1e03f66",
        "type": "ui_button",
        "z": "a1cf9e683b2c8e5e",
        "name": "Solicitar GPS",
        "group": "g_cmd",
        "order": 3,
        "width": "3",
        "height": "1",
        "passthru": false,
        "label": "Actualizar GPS",
        "color": "white",
        "bgcolor": "#43a047",
        "icon": "gps_fixed",
        "payload": "{\"cmd\":\"request_gps\"}",
        "payloadType": "json",
        "x": 130,
        "y": 500,
        "wires": [
            [
                "65a964a100203e0b"
            ]
        ]
    },
    {
        "id": "b30f0c76b0b54c6c",
        "type": "ui_template",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_cmd",
        "name": "Intervalo + Aplicar",
        "order": 4,
        "width": "6",
        "height": "2",
        "format": "<div style=\"padding:4px 0;\">\n  <label style=\"font-size:12px;color:#555;font-weight:500;display:block;margin-bottom:4px;\">Intervalo (minutos, min 1)</label>\n  <div style=\"display:flex;gap:8px;align-items:center;\">\n    <input type=\"number\" ng-model=\"intervalo\" min=\"1\" max=\"1440\"\n           placeholder=\"10\"\n           style=\"padding:7px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;width:90px;\"/>\n    <button ng-click=\"send({payload:{cmd:'set_interval',interval:''+intervalo}})\"\n            style=\"padding:8px 16px;background:#1565C0;color:white;\n                   border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;\">\n      Aplicar\n    </button>\n  </div>\n</div>\n",
        "storeOutMessages": false,
        "fwdInMessages": false,
        "resendOnRefresh": true,
        "templateScope": "local",
        "x": 130,
        "y": 560,
        "wires": [
            [
                "c2a9b823f07a250c"
            ]
        ]
    },
    {
        "id": "c2a9b823f07a250c",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Validar intervalo",
        "func": "node.warn('n23 recibio: ' + JSON.stringify(msg.payload));\nvar raw = msg.payload && msg.payload.interval;\nvar m   = parseInt(raw, 10);\nif (isNaN(m) || m < 1 || m > 1440) {\n    node.warn('Intervalo invalido: raw=' + raw + ' parsed=' + m);\n    return null;\n}\nmsg.payload = { cmd: 'set_interval', interval: m };\nreturn msg;",
        "outputs": 1,
        "x": 330,
        "y": 560,
        "wires": [
            [
                "65a964a100203e0b"
            ]
        ]
    },
    {
        "id": "65a964a100203e0b",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Preparar Downlink",
        "func": "var sel    = flow.get('selected_sensor');\nvar cmd    = msg.payload && msg.payload.cmd;\nvar appId  = global.get('ttn_app_id')  || 'end-devices-tesis-arroz';\nvar cluster= global.get('ttn_cluster') || 'nam1.cloud.thethings.network';\nvar apiKey = global.get('ttn_api_key') || '';\n\nif (!sel) {\n    node.warn('Sin sensor seleccionado');\n    node.status({fill:'red',shape:'ring',text:'Selecciona sensor'});\n    return null;\n}\nif (!cmd) {\n    node.warn('Sin cmd: ' + JSON.stringify(msg.payload));\n    return null;\n}\nif (!apiKey || apiKey === 'YOUR_TTN_API_KEY') {\n    node.warn('API key TTN no configurada');\n    node.status({fill:'red',shape:'ring',text:'Falta API key'});\n    return null;\n}\n\n// Construir bytes del payload\nvar bytes;\nif (cmd === 'reboot') {\n    bytes = Buffer.from([0x02]);\n} else if (cmd === 'request_gps') {\n    bytes = Buffer.from([0x03]);\n} else if (cmd === 'set_interval') {\n    var sec = parseInt(msg.payload.interval) * 60;\n    if (isNaN(sec) || sec < 60 || sec > 86400) {\n        node.warn('Segundos invalidos: ' + sec);\n        return null;\n    }\n    bytes = Buffer.from([0x01, sec & 0xFF, (sec >> 8) & 0xFF]);\n} else {\n    node.warn('Cmd desconocido: ' + cmd);\n    return null;\n}\n\nvar dl = JSON.stringify({\n    downlinks: [{ f_port: 1, frm_payload: bytes.toString('base64'), priority: 'NORMAL' }]\n});\n\n// Lista de targets — uno o todos\nvar ALL_DEVICES = ['pcb-1','pcb-2','pcb-3','pcb-4','pcb-5'];\nvar targets = sel === '__ALL__' ? ALL_DEVICES : [sel];\n\n// Guardar para el log\nflow.set('last_downlink', {\n    sensor:    sel === '__ALL__' ? 'TODOS' : sel,\n    command:   cmd,\n    timestamp: new Date().toISOString()\n});\n\n// Generar un msg por cada target\nvar msgs = targets.map(function(dev) {\n    return {\n        payload: dl,\n        method:  'POST',\n        url:     'https://' + cluster + '/api/v3/as/applications/' + appId + '/devices/' + dev + '/down/push',\n        headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },\n        _device: dev,\n        _cmd:    cmd\n    };\n});\n\nnode.status({fill:'blue',shape:'dot',text: cmd + ' -> ' + (sel==='__ALL__'?'TODOS':sel)});\nreturn [msgs];\n",
        "outputs": 1,
        "x": 520,
        "y": 500,
        "wires": [
            [
                "77af1bd6fcc782ee"
            ]
        ]
    },
    {
        "id": "77af1bd6fcc782ee",
        "type": "http request",
        "z": "a1cf9e683b2c8e5e",
        "name": "TTN Downlink",
        "method": "use",
        "ret": "obj",
        "url": "",
        "x": 720,
        "y": 500,
        "wires": [
            [
                "a94b86347b6f60a9",
                "74952b913d9e1a47"
            ]
        ]
    },
    {
        "id": "74952b913d9e1a47",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Respuesta downlink",
        "func": "var last = flow.get('last_downlink') || {};\nvar ok   = (msg.statusCode === 200);\nvar tz   = 'America/Montevideo';\n\nnode.warn('TTN response ' + (msg._device||'?') + ': ' + msg.statusCode + ' | ' + JSON.stringify(msg.payload));\n\nvar detail = '';\nif (!ok && msg.payload) {\n    try {\n        var p = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;\n        detail = p.message || p.error || JSON.stringify(p);\n    } catch(e) { detail = String(msg.payload).substring(0,100); }\n}\n\nvar devLabel = msg._device || last.sensor || '-';\nvar txt = ok\n    ? 'Enviado: ' + (msg._cmd||last.command) + ' a ' + devLabel\n    : 'Error ' + msg.statusCode + ' (' + devLabel + '): ' + detail;\n\nvar entry = {\n    timestamp: new Date().toLocaleString('es-UY',{timeZone:tz,day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit'}),\n    sensor:    devLabel,\n    comando:   msg._cmd || last.command || '-',\n    estado:    ok ? 'OK' : 'ERROR ' + msg.statusCode\n};\n\nvar log = flow.get('downlink_log') || [];\nlog.unshift(entry);\nif (log.length > 50) log.pop();\nflow.set('downlink_log', log);\n\nmsg.payload = txt;\nreturn [msg, {payload: log}];\n",
        "outputs": 2,
        "x": 920,
        "y": 500,
        "wires": [
            [
                "8158c90c5750ebf2"
            ],
            [
                "529bf9708844609d"
            ]
        ]
    },
    {
        "id": "8158c90c5750ebf2",
        "type": "ui_toast",
        "z": "a1cf9e683b2c8e5e",
        "position": "top right",
        "displayTime": "3",
        "highlight": "",
        "sendall": true,
        "outputs": 0,
        "ok": "OK",
        "cancel": "",
        "raw": false,
        "topic": "",
        "name": "Toast",
        "x": 1120,
        "y": 480,
        "wires": []
    },
    {
        "id": "529bf9708844609d",
        "type": "ui_table",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_log",
        "name": "Log",
        "order": 1,
        "width": "12",
        "height": "6",
        "columns": [
            {
                "field": "timestamp",
                "title": "Hora",
                "width": "160",
                "align": "left",
                "formatter": "plaintext"
            },
            {
                "field": "sensor",
                "title": "Sensor",
                "width": "100",
                "align": "center",
                "formatter": "plaintext"
            },
            {
                "field": "comando",
                "title": "Comando",
                "width": "120",
                "align": "center",
                "formatter": "plaintext"
            },
            {
                "field": "estado",
                "title": "Estado",
                "width": "80",
                "align": "center",
                "formatter": "plaintext"
            }
        ],
        "outputs": 0,
        "cts": false,
        "x": 1120,
        "y": 520,
        "wires": []
    },
    {
        "id": "c4262567a863c18b",
        "type": "inject",
        "z": "a1cf9e683b2c8e5e",
        "name": "Cargar log",
        "props": [
            {
                "p": "payload"
            }
        ],
        "repeat": "",
        "once": true,
        "onceDelay": 1,
        "payload": "",
        "payloadType": "str",
        "x": 720,
        "y": 560,
        "wires": [
            [
                "f5020828786ce91a"
            ]
        ]
    },
    {
        "id": "f5020828786ce91a",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Recuperar log",
        "func": "msg.payload=flow.get('downlink_log')||[];return msg;",
        "outputs": 1,
        "x": 920,
        "y": 560,
        "wires": [
            [
                "529bf9708844609d"
            ]
        ]
    },
    {
        "id": "cc3ab9be9a298158",
        "type": "ui_text_input",
        "z": "a1cf9e683b2c8e5e",
        "name": "Latitud",
        "label": "Latitud",
        "tooltip": "Ej: -34.906700",
        "group": "g_pos",
        "order": 1,
        "width": "6",
        "height": "1",
        "passthru": true,
        "mode": "text",
        "delay": 300,
        "topic": "lat",
        "topicType": "str",
        "x": 130,
        "y": 660,
        "wires": [
            [
                "0bb0bebede6013e3"
            ]
        ]
    },
    {
        "id": "c762411a736b760b",
        "type": "ui_text_input",
        "z": "a1cf9e683b2c8e5e",
        "name": "Longitud",
        "label": "Longitud",
        "tooltip": "Ej: -56.187300",
        "group": "g_pos",
        "order": 2,
        "width": "6",
        "height": "1",
        "passthru": true,
        "mode": "text",
        "delay": 300,
        "topic": "lon",
        "topicType": "str",
        "x": 130,
        "y": 720,
        "wires": [
            [
                "5fcb141ba45b1d2c"
            ]
        ]
    },
    {
        "id": "0bb0bebede6013e3",
        "type": "change",
        "z": "a1cf9e683b2c8e5e",
        "name": "",
        "rules": [
            {
                "t": "set",
                "p": "input_lat",
                "pt": "flow",
                "to": "payload",
                "tot": "msg"
            }
        ],
        "x": 330,
        "y": 660,
        "wires": [
            []
        ]
    },
    {
        "id": "5fcb141ba45b1d2c",
        "type": "change",
        "z": "a1cf9e683b2c8e5e",
        "name": "",
        "rules": [
            {
                "t": "set",
                "p": "input_lon",
                "pt": "flow",
                "to": "payload",
                "tot": "msg"
            }
        ],
        "x": 330,
        "y": 720,
        "wires": [
            []
        ]
    },
    {
        "id": "063c096bfa465c04",
        "type": "ui_button",
        "z": "a1cf9e683b2c8e5e",
        "name": "Guardar pos",
        "group": "g_pos",
        "order": 3,
        "width": "4",
        "height": "1",
        "passthru": false,
        "label": "Guardar posicion",
        "color": "white",
        "bgcolor": "#1976D2",
        "icon": "place",
        "payload": "",
        "payloadType": "str",
        "x": 130,
        "y": 780,
        "wires": [
            [
                "8175d697bccd8d3b"
            ]
        ]
    },
    {
        "id": "8175d697bccd8d3b",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Setear pos manual",
        "func": "var lat = parseFloat(flow.get('input_lat'));\nvar lon = parseFloat(flow.get('input_lon'));\nvar dev = flow.get('selected_sensor');\nif (!dev) {\n    return [null, { payload: 'Selecciona un sensor primero' }];\n}\nif (isNaN(lat) || isNaN(lon)) {\n    return [null, { payload: 'Error: lat/lon invalidos' }];\n}\n// Guardar por dispositivo\nvar manuals = flow.get('manual_positions') || {};\nmanuals[dev] = { lat: lat, lon: lon };\nflow.set('manual_positions', manuals);\nvar txt = 'Posicion manual ' + dev + ': ' + lat.toFixed(6) + ', ' + lon.toFixed(6);\nnode.status({fill:'green', shape:'dot', text: dev + ' ' + lat.toFixed(4)+', '+lon.toFixed(4)});\n// Disparar refresh inmediato\nreturn [{ payload: txt }, { payload: txt }, {}];\n",
        "outputs": 3,
        "x": 340,
        "y": 780,
        "wires": [
            [
                "87a74c7d8f11253a"
            ],
            [
                "8158c90c5750ebf2"
            ],
            [
                "c0c7181f1a5150b6"
            ]
        ]
    },
    {
        "id": "a2d82f57be7d9080",
        "type": "ui_button",
        "z": "a1cf9e683b2c8e5e",
        "name": "Usar GPS",
        "group": "g_pos",
        "order": 4,
        "width": "2",
        "height": "1",
        "passthru": false,
        "label": "Usar GPS",
        "color": "white",
        "bgcolor": "#757575",
        "icon": "gps_not_fixed",
        "payload": "",
        "payloadType": "str",
        "x": 130,
        "y": 840,
        "wires": [
            [
                "0c4ec563ef8607ff"
            ]
        ]
    },
    {
        "id": "0c4ec563ef8607ff",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Limpiar pos",
        "func": "var dev = flow.get('selected_sensor');\nif (!dev) {\n    return [null, { payload: 'Selecciona un sensor primero' }];\n}\nvar manuals = flow.get('manual_positions') || {};\ndelete manuals[dev];\nflow.set('manual_positions', manuals);\nvar txt = dev + ': usando GPS';\nnode.status({fill:'grey', shape:'ring', text: dev + ' GPS activo'});\nreturn [{ payload: txt }, { payload: txt }, {}];\n",
        "outputs": 3,
        "x": 330,
        "y": 840,
        "wires": [
            [
                "87a74c7d8f11253a"
            ],
            [
                "8158c90c5750ebf2"
            ],
            [
                "c0c7181f1a5150b6"
            ]
        ]
    },
    {
        "id": "87a74c7d8f11253a",
        "type": "ui_text",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_pos",
        "order": 5,
        "width": "6",
        "height": "1",
        "name": "Estado pos",
        "label": "Fuente:",
        "format": "{{msg.payload}}",
        "layout": "row-spread",
        "x": 540,
        "y": 810,
        "wires": []
    },
    {
        "id": "53b6150f22a0d68b",
        "type": "ui_template",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_cht",
        "name": "Panel Historial",
        "order": 1,
        "width": "20",
        "height": "3",
        "format": "<style>\n.hst-wrap{display:flex;flex-wrap:wrap;gap:10px;padding:10px;align-items:flex-end;}\n.hst-field{display:flex;flex-direction:column;gap:4px;}\n.hst-field label{font-size:12px;color:#555;font-weight:500;}\n.hst-field input{padding:7px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;width:180px;}\n.hst-btn{padding:8px 16px;border:none;border-radius:6px;color:white;cursor:pointer;font-size:13px;font-weight:500;}\n</style>\n<div class=\"hst-wrap\">\n  <div class=\"hst-field\">\n    <label>Desde (YYYY-MM-DD HH:MM)</label>\n    <input type=\"text\" ng-model=\"desde\" placeholder=\"2026-03-01 00:00\"/>\n  </div>\n  <div class=\"hst-field\">\n    <label>Hasta (YYYY-MM-DD HH:MM)</label>\n    <input type=\"text\" ng-model=\"hasta\"/>\n  </div>\n  <button class=\"hst-btn\" style=\"background:#1976D2\"\n    ng-click=\"send({payload:{preset:'custom',desde:desde,hasta:hasta}})\">Ver historial</button>\n  <button class=\"hst-btn\" style=\"background:#43a047\"\n    ng-click=\"send({payload:{preset:'-24h'}})\">Ult. 24h</button>\n  <button class=\"hst-btn\" style=\"background:#00897B\"\n    ng-click=\"send({payload:{preset:'-7d'}})\">Ult. semana</button>\n  <button class=\"hst-btn\" style=\"background:#FB8C00\"\n    ng-click=\"send({payload:{preset:'-30d'}})\">Ult. mes</button>\n  <button class=\"hst-btn\" style=\"background:#8E24AA\"\n    ng-click=\"send({payload:{preset:'-90d'}})\">Ult. 3 meses</button>\n</div>\n<script>\n(function() {\n    // Setear \"hasta\" con fecha/hora actual en formato YYYY-MM-DD HH:MM\n    var now = new Date();\n    var pad = function(n){ return n < 10 ? '0' + n : n; };\n    var nowStr = now.getFullYear() + '-' +\n                 pad(now.getMonth() + 1) + '-' +\n                 pad(now.getDate()) + ' ' +\n                 pad(now.getHours()) + ':' +\n                 pad(now.getMinutes());\n    if (!scope.hasta) scope.hasta = nowStr;\n})();\n</script>",
        "storeOutMessages": false,
        "fwdInMessages": false,
        "resendOnRefresh": true,
        "templateScope": "local",
        "className": "",
        "x": 300,
        "y": 960,
        "wires": [
            [
                "aaacef3b38efe103",
                "be4d8725522b92a2"
            ]
        ]
    },
    {
        "id": "05c12591f8f84a30",
        "type": "inject",
        "z": "a1cf9e683b2c8e5e",
        "name": "Init panel scope",
        "props": [
            {
                "p": "payload"
            }
        ],
        "repeat": "",
        "once": true,
        "onceDelay": 1,
        "payload": "{\"init\":true}",
        "payloadType": "json",
        "x": 300,
        "y": 900,
        "wires": [
            [
                "53b6150f22a0d68b"
            ]
        ]
    },
    {
        "id": "7af36871c66d16cc",
        "type": "ui_template",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_cht",
        "name": "Script Panel (scope)",
        "order": 0,
        "width": "1",
        "height": "1",
        "format": "<span style=\"display:none\"></span>",
        "storeOutMessages": false,
        "fwdInMessages": false,
        "resendOnRefresh": true,
        "templateScope": "local",
        "className": "",
        "x": 300,
        "y": 920,
        "wires": [
            []
        ]
    },
    {
        "id": "be4d8725522b92a2",
        "type": "debug",
        "z": "a1cf9e683b2c8e5e",
        "name": "Debug: Panel output",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": true,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 540,
        "y": 900,
        "wires": []
    },
    {
        "id": "aaacef3b38efe103",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Construir rango",
        "func": "node.warn('build_range recibio: ' + JSON.stringify(msg.payload));\n\nvar p = msg.payload;\nif (p && p.init) return null;\n\nvar rangeStr, win, label;\n\nif (p.preset && p.preset !== 'custom') {\n    rangeStr = 'start: ' + p.preset;\n    if      (p.preset === '-24h') win = '5m';\n    else if (p.preset === '-7d')  win = '30m';\n    else if (p.preset === '-30d') win = '1h';\n    else                          win = '3h';\n    label = p.preset;\n} else {\n    if (!p.desde || !p.desde.trim()) {\n        rangeStr = 'start: -24h';\n        win      = '5m';\n        label    = '-24h';\n    } else {\n        var sStr = p.desde.trim().replace(' ', 'T') + ':00-03:00';\n        var s    = new Date(sStr);\n        if (isNaN(s.getTime())) { node.warn('Fecha inicio invalida: ' + p.desde); return null; }\n\n        var eStr = (p.hasta && p.hasta.trim())\n            ? p.hasta.trim().replace(' ', 'T') + ':00-03:00'\n            : new Date().toISOString();\n        var e = new Date(eStr);\n        if (isNaN(e.getTime())) { node.warn('Fecha fin invalida: ' + p.hasta); return null; }\n\n        var diffDays = (e - s) / (1000 * 60 * 60 * 24);\n        if      (diffDays <= 2)  win = '5m';\n        else if (diffDays <= 7)  win = '30m';\n        else if (diffDays <= 30) win = '1h';\n        else                     win = '3h';\n\n        rangeStr = 'start: time(v: \"' + s.toISOString() + '\"), stop: time(v: \"' + e.toISOString() + '\")';\n        label    = p.desde.trim();\n    }\n}\n\nnode.warn('rangeStr: ' + rangeStr + ' | window: ' + win);\nmsg._rangeStr = rangeStr;\nmsg._window   = win;\nmsg._label    = label;\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "x": 560,
        "y": 960,
        "wires": [
            [
                "947ea120a2d58732",
                "7571fc85c90ee369",
                "74c3942ca3023831"
            ]
        ]
    },
    {
        "id": "74c3942ca3023831",
        "type": "debug",
        "z": "a1cf9e683b2c8e5e",
        "name": "Debug: rango construido",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": true,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 780,
        "y": 900,
        "wires": []
    },
    {
        "id": "947ea120a2d58732",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Query Historial",
        "func": "var t = global.get('influx_token') || '';\nvar b = global.get('influx_bucket') || 'Data Testing';\nvar o = global.get('influx_org')    || 'org';\nvar u = global.get('influx_url')    || 'http://localhost:8086';\n\nmsg.headers = {\n    'Authorization': 'Token ' + t,\n    'Content-Type':  'application/vnd.flux',\n    'Accept':        'application/csv'\n};\nmsg.method  = 'POST';\nmsg.url     = u + '/api/v2/query?org=' + o;\nmsg.payload =\n    'from(bucket: \"' + b + '\")\\n' +\n    '  |> range(' + msg._rangeStr + ')\\n' +\n    '  |> filter(fn: (r) => r._measurement == \"nivel_agua\" and r._field == \"value\")\\n' +\n    '  |> aggregateWindow(every: ' + msg._window + ', fn: mean, createEmpty: false)\\n' +\n    '  |> group(columns: [\"device_id\"])';\n\nnode.warn('Flux query: ' + msg.payload);\nreturn msg;",
        "outputs": 1,
        "x": 760,
        "y": 960,
        "wires": [
            [
                "2ab6bf670b422d8f"
            ]
        ]
    },
    {
        "id": "2ab6bf670b422d8f",
        "type": "http request",
        "z": "a1cf9e683b2c8e5e",
        "name": "GET Historial",
        "method": "use",
        "ret": "txt",
        "url": "",
        "x": 960,
        "y": 960,
        "wires": [
            [
                "e638b4fa99873bb2",
                "a3ca7ce59205b393"
            ]
        ]
    },
    {
        "id": "a3ca7ce59205b393",
        "type": "debug",
        "z": "a1cf9e683b2c8e5e",
        "name": "Debug: respuesta InfluxDB",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": true,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 1160,
        "y": 900,
        "wires": []
    },
    {
        "id": "e638b4fa99873bb2",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Parse Historial",
        "func": "var lines = msg.payload.split('\\n');\nvar hdr   = null;\nvar sMap  = {};\n\nfor (var i = 0; i < lines.length; i++) {\n    var l = lines[i].trim();\n    if (!l || l.startsWith('#')) continue;\n    if (!hdr) { hdr = l; continue; }\n\n    var H = hdr.split(',');\n    var C = l.split(',');\n    var R = {};\n    H.forEach(function(h, x) { R[h.trim()] = C[x] ? C[x].trim() : ''; });\n\n    var dev = R.device_id;\n    var val = parseFloat(R._value);\n    var t   = new Date(R._time).getTime();\n\n    if (!dev || isNaN(val) || isNaN(t)) continue;\n    if (!sMap[dev]) sMap[dev] = [];\n    sMap[dev].push({ x: t, y: Math.round(val * 10) / 10 });\n}\n\nvar rangeStr = msg._rangeStr || '';\nvar tStart, tEnd;\ntEnd = Date.now();\n\nif      (rangeStr === 'start: -24h') tStart = tEnd - 24 * 60 * 60 * 1000;\nelse if (rangeStr === 'start: -7d')  tStart = tEnd -  7 * 24 * 60 * 60 * 1000;\nelse if (rangeStr === 'start: -30d') tStart = tEnd - 30 * 24 * 60 * 60 * 1000;\nelse if (rangeStr === 'start: -90d') tStart = tEnd - 90 * 24 * 60 * 60 * 1000;\nelse {\n    var startMatch = rangeStr.match(/start: time\\(v: \"([^\"]+)\"\\)/);\n    var stopMatch  = rangeStr.match(/stop: time\\(v: \"([^\"]+)\"\\)/);\n    tStart = startMatch ? new Date(startMatch[1]).getTime() : tEnd - 24 * 60 * 60 * 1000;\n    tEnd   = stopMatch  ? new Date(stopMatch[1]).getTime()  : tEnd;\n}\n\nvar devs = Object.keys(sMap);\nnode.warn('Parse: ' + devs.length + ' devices | ' + new Date(tStart).toISOString() + ' -> ' + new Date(tEnd).toISOString());\n\nif (devs.length === 0) {\n    msg.payload = [{\n        series: ['pcb-4'],\n        data:   [[{ x: tStart, y: null }, { x: tEnd, y: null }]],\n        labels: ['']\n    }];\n    return msg;\n}\n\nvar data = devs.map(function(d) {\n    var pts   = sMap[d];\n    var first = pts[0].x;\n    var last  = pts[pts.length - 1].x;\n    if (tStart < first) pts.unshift({ x: tStart, y: null });\n    if (tEnd   > last)  pts.push(   { x: tEnd,   y: null });\n    return pts;\n});\n\nmsg.payload = [{\n    series: devs,\n    data:   data,\n    labels: ['']\n}];\nreturn msg;",
        "outputs": 1,
        "x": 1160,
        "y": 960,
        "wires": [
            [
                "62994264e99f6828"
            ]
        ]
    },
    {
        "id": "62994264e99f6828",
        "type": "ui_chart",
        "z": "a1cf9e683b2c8e5e",
        "name": "Grafico Nivel",
        "group": "g_cht",
        "order": 2,
        "width": "20",
        "height": "9",
        "label": "Nivel de Agua",
        "chartType": "line",
        "legend": "true",
        "xformat": "DD/MM HH:mm",
        "interpolate": "linear",
        "nodata": "Sin datos en el rango seleccionado",
        "dot": false,
        "ymin": "",
        "ymax": "",
        "removeOlder": 1,
        "removeOlderPoints": "",
        "removeOlderUnit": "86400",
        "cutout": 0,
        "useOneColor": false,
        "useUTC": false,
        "colors": [
            "#1976D2",
            "#43A047",
            "#FB8C00",
            "#E53935",
            "#8E24AA",
            "#00ACC1",
            "#FFD600",
            "#6D4C41",
            "#546E7A",
            "#00897B"
        ],
        "outputs": 1,
        "useDifferentColor": false,
        "x": 1360,
        "y": 960,
        "wires": [
            []
        ]
    },
    {
        "id": "7571fc85c90ee369",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Query Export (raw)",
        "func": "var t = global.get('influx_token') || '';\nvar b = global.get('influx_bucket') || 'Data Testing';\nvar o = global.get('influx_org')    || 'org';\nvar u = global.get('influx_url')    || 'http://localhost:8086';\n\nmsg.headers = {\n    'Authorization': 'Token ' + t,\n    'Content-Type':  'application/vnd.flux',\n    'Accept':        'application/csv'\n};\nmsg.method  = 'POST';\nmsg.url     = u + '/api/v2/query?org=' + o;\nmsg.payload =\n    'from(bucket: \"' + b + '\")\\n' +\n    '  |> range(' + msg._rangeStr + ')\\n' +\n    '  |> filter(fn: (r) => r._measurement == \"nivel_agua\" and r._field == \"value\")\\n' +\n    '  |> group(columns: [\"device_id\"])\\n' +\n    '  |> sort(columns: [\"_time\"])';\nreturn msg;",
        "outputs": 1,
        "x": 760,
        "y": 1060,
        "wires": [
            [
                "e867b266eb5a8b13"
            ]
        ]
    },
    {
        "id": "e867b266eb5a8b13",
        "type": "http request",
        "z": "a1cf9e683b2c8e5e",
        "name": "GET Export",
        "method": "use",
        "ret": "txt",
        "url": "",
        "x": 960,
        "y": 1060,
        "wires": [
            [
                "addd1e1da7049eba",
                "540d8e074da782ae"
            ]
        ]
    },
    {
        "id": "addd1e1da7049eba",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Parse Export → dataURI",
        "func": "var tz    = 'America/Montevideo';\nvar lines = msg.payload.split('\\n');\nvar hdr   = null;\nvar rows  = [];\n\nfor (var i = 0; i < lines.length; i++) {\n    var l = lines[i].trim();\n    if (!l || l.startsWith('#')) continue;\n    if (!hdr) { hdr = l; continue; }\n\n    var H = hdr.split(',');\n    var C = l.split(',');\n    var R = {};\n    H.forEach(function(h, x) { R[h.trim()] = C[x] ? C[x].trim() : ''; });\n\n    var dev = R.device_id;\n    var val = parseFloat(R._value);\n    var t   = R._time;\n    if (!dev || isNaN(val) || !t) continue;\n\n    var tL = new Date(t).toLocaleString('es-UY', {\n        timeZone: tz,\n        year: 'numeric', month: '2-digit', day: '2-digit',\n        hour: '2-digit', minute: '2-digit', second: '2-digit'\n    });\n    rows.push([dev, val.toFixed(1), t, tL]);\n}\n\nif (rows.length === 0) {\n    msg.payload = { count: 0, href: '', filename: '' };\n    return msg;\n}\n\nvar csv = 'device_id,nivel_cm,timestamp_utc,timestamp_local_uy\\n';\nrows.forEach(function(r) { csv += r.join(',') + '\\n'; });\n\nvar b64   = Buffer.from(csv).toString('base64');\nvar href  = 'data:text/csv;base64,' + b64;\nvar label = (msg._label || 'export').replace(/[:\\s\\/]/g, '_').replace(/[^a-zA-Z0-9_\\-]/g, '');\n\nmsg.payload = { count: rows.length, href: href, filename: 'nivel_agua_' + label + '.csv' };\nreturn msg;",
        "outputs": 1,
        "x": 1160,
        "y": 1060,
        "wires": [
            [
                "f3899891d5c05154"
            ]
        ]
    },
    {
        "id": "f3899891d5c05154",
        "type": "ui_template",
        "z": "a1cf9e683b2c8e5e",
        "group": "g_cht",
        "name": "Link descarga CSV",
        "order": 3,
        "width": "20",
        "height": "2",
        "format": "<div style=\"padding:10px;\"><div ng-if=\"msg.payload.count > 0\"><span style=\"color:#00796B;font-weight:bold;\">{{msg.payload.count}} registros — {{msg.payload.filename}}</span><br><a ng-href=\"{{msg.payload.href}}\" ng-attr-download=\"{{msg.payload.filename}}\" style=\"display:inline-block;margin-top:8px;padding:9px 22px;background:#00796B;color:white;border-radius:6px;text-decoration:none;font-size:14px;font-weight:500;\">&#11015; Descargar CSV</a></div><div ng-if=\"msg.payload.count === 0 && msg.payload.filename === ''\" style=\"color:#888;\">Selecciona un rango y pulsá Ver historial para habilitar la descarga.</div></div>",
        "storeOutMessages": true,
        "fwdInMessages": true,
        "resendOnRefresh": true,
        "templateScope": "local",
        "className": "",
        "x": 1380,
        "y": 1060,
        "wires": [
            []
        ]
    },
    {
        "id": "de4844c7521bd327",
        "type": "ui_template",
        "z": "a1cf9e683b2c8e5e",
        "group": "2e31eaaa78120b68",
        "name": "Graficas por dispositivo",
        "order": 1,
        "width": "20",
        "height": "20",
        "format": "<style>\n.dev-wrap { padding: 10px; }\n.dev-block {\n    margin-bottom: 28px;\n    background: #f8f9fa;\n    border-radius: 10px;\n    padding: 14px;\n    box-shadow: 0 2px 6px rgba(0,0,0,.08);\n}\n.dev-title {\n    font-size: 16px;\n    font-weight: bold;\n    color: #1976D2;\n    margin-bottom: 10px;\n}\n.dev-dl {\n    display: inline-block;\n    margin-top: 8px;\n    padding: 7px 18px;\n    background: #00796B;\n    color: white;\n    border-radius: 6px;\n    text-decoration: none;\n    font-size: 13px;\n    font-weight: 500;\n}\n.dev-nodata {\n    color: #aaa;\n    font-size: 13px;\n    padding: 20px 0;\n    text-align: center;\n}\ncanvas { max-width: 100%; }\n</style>\n\n<div class=\"dev-wrap\">\n  <div ng-if=\"!msg.payload || msg.payload.length === 0\" class=\"dev-nodata\">\n    Seleccioná un rango y pulsá un botón para ver las gráficas.\n  </div>\n  <div ng-repeat=\"dev in msg.payload\" class=\"dev-block\">\n    <div class=\"dev-title\">{{dev.device_id}}</div>\n\n    <!-- Mini chart usando SVG path para no depender de Chart.js por device -->\n    <div ng-if=\"dev.points.length > 0\">\n      <svg ng-attr-width=\"100%\" height=\"120\" style=\"display:block;\"\n           ng-attr-viewBox=\"'0 0 800 120'\"\n           preserveAspectRatio=\"none\">\n        <!-- Grid lines -->\n        <line x1=\"0\" y1=\"30\"  x2=\"800\" y2=\"30\"  stroke=\"#eee\" stroke-width=\"1\"/>\n        <line x1=\"0\" y1=\"60\"  x2=\"800\" y2=\"60\"  stroke=\"#eee\" stroke-width=\"1\"/>\n        <line x1=\"0\" y1=\"90\"  x2=\"800\" y2=\"90\"  stroke=\"#eee\" stroke-width=\"1\"/>\n        <!-- Data line -->\n        <polyline\n          ng-attr-points=\"{{dev.svgPoints}}\"\n          fill=\"none\" stroke=\"#1976D2\" stroke-width=\"2\"\n          stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n      </svg>\n      <div style=\"display:flex;justify-content:space-between;font-size:11px;color:#aaa;padding:0 2px;\">\n        <span>{{dev.tStartLabel}}</span>\n        <span>Max: {{dev.max}} cm | Min: {{dev.min}} cm | Prom: {{dev.avg}} cm</span>\n        <span>{{dev.tEndLabel}}</span>\n      </div>\n    </div>\n    <div ng-if=\"dev.points.length === 0\" class=\"dev-nodata\">Sin datos en el rango</div>\n\n    <!-- Descarga individual -->\n    <a ng-if=\"dev.href\" ng-href=\"{{dev.href}}\"\n       ng-attr-download=\"{{dev.filename}}\"\n       class=\"dev-dl\">&#11015; Descargar CSV {{dev.device_id}}</a>\n  </div>\n</div>",
        "storeOutMessages": true,
        "fwdInMessages": true,
        "resendOnRefresh": true,
        "templateScope": "local",
        "className": "",
        "x": 1380,
        "y": 1120,
        "wires": [
            []
        ]
    },
    {
        "id": "540d8e074da782ae",
        "type": "function",
        "z": "a1cf9e683b2c8e5e",
        "name": "Parse por dispositivo",
        "func": "var tz = 'America/Montevideo';\nvar lines = msg.payload.split('\\n');\nvar hdr   = null;\nvar sMap  = {};\n\nfor (var i = 0; i < lines.length; i++) {\n    var l = lines[i].trim();\n    if (!l || l.startsWith('#')) continue;\n    if (!hdr) { hdr = l; continue; }\n\n    var H = hdr.split(',');\n    var C = l.split(',');\n    var R = {};\n    H.forEach(function(h, x) { R[h.trim()] = C[x] ? C[x].trim() : ''; });\n\n    var dev = R.device_id;\n    var val = parseFloat(R._value);\n    var t   = R._time;\n    if (!dev || isNaN(val) || !t) continue;\n    if (!sMap[dev]) sMap[dev] = [];\n    sMap[dev].push({ t: t, v: val });\n}\n\n// Calcular rango\nvar rangeStr = msg._rangeStr || '';\nvar tStart, tEnd;\ntEnd = Date.now();\nif      (rangeStr === 'start: -24h') tStart = tEnd - 24*60*60*1000;\nelse if (rangeStr === 'start: -7d')  tStart = tEnd -  7*24*60*60*1000;\nelse if (rangeStr === 'start: -30d') tStart = tEnd - 30*24*60*60*1000;\nelse if (rangeStr === 'start: -90d') tStart = tEnd - 90*24*60*60*1000;\nelse {\n    var sm = rangeStr.match(/start: time\\(v: \"([^\"]+)\"\\)/);\n    var em = rangeStr.match(/stop: time\\(v: \"([^\"]+)\"\\)/);\n    tStart = sm ? new Date(sm[1]).getTime() : tEnd - 24*60*60*1000;\n    tEnd   = em ? new Date(em[1]).getTime() : tEnd;\n}\n\nfunction fmtTime(ms) {\n    return new Date(ms).toLocaleString('es-UY', {\n        timeZone: tz, day:'2-digit', month:'2-digit',\n        hour:'2-digit', minute:'2-digit'\n    });\n}\n\nvar devs = Object.keys(sMap);\nvar result = devs.map(function(dev) {\n    var pts = sMap[dev];\n\n    // Stats\n    var vals = pts.map(function(p){ return p.v; });\n    var minV = Math.round(Math.min.apply(null, vals) * 10) / 10;\n    var maxV = Math.round(Math.max.apply(null, vals) * 10) / 10;\n    var avg  = Math.round(vals.reduce(function(a,b){return a+b;},0)/vals.length*10)/10;\n\n    // SVG polyline points (800x100 canvas, y inverted)\n    var svgPoints = '';\n    if (pts.length > 1) {\n        var tRange = tEnd - tStart || 1;\n        var vMin = minV - 5;\n        var vRange = (maxV - vMin + 10) || 1;\n        svgPoints = pts.map(function(p) {\n            var px = ((new Date(p.t).getTime() - tStart) / tRange) * 800;\n            var py = 110 - ((p.v - vMin) / vRange) * 100;\n            return Math.round(px) + ',' + Math.round(py);\n        }).join(' ');\n    }\n\n    // CSV con data raw\n    var csv = 'device_id,nivel_cm,timestamp_utc,timestamp_local_uy\\n';\n    pts.forEach(function(p) {\n        var tL = new Date(p.t).toLocaleString('es-UY', {\n            timeZone: tz, year:'numeric', month:'2-digit', day:'2-digit',\n            hour:'2-digit', minute:'2-digit', second:'2-digit'\n        });\n        csv += dev + ',' + p.v.toFixed(1) + ',' + p.t + ',' + tL + '\\n';\n    });\n\n    var label  = (msg._label || 'export').replace(/[:\\s\\/]/g,'_').replace(/[^a-zA-Z0-9_\\-]/g,'');\n    var b64    = Buffer.from(csv).toString('base64');\n\n    return {\n        device_id:   dev,\n        points:      pts,\n        svgPoints:   svgPoints,\n        min:         minV,\n        max:         maxV,\n        avg:         avg,\n        tStartLabel: fmtTime(tStart),\n        tEndLabel:   fmtTime(tEnd),\n        href:        pts.length > 0 ? 'data:text/csv;base64,' + b64 : '',\n        filename:    'nivel_agua_' + dev + '_' + label + '.csv'\n    };\n});\n\nmsg.payload = result;\nreturn msg;",
        "outputs": 1,
        "timeout": 0,
        "noerr": 0,
        "x": 1160,
        "y": 1120,
        "wires": [
            [
                "de4844c7521bd327"
            ]
        ]
    },
    {
        "id": "a94b86347b6f60a9",
        "type": "debug",
        "z": "a1cf9e683b2c8e5e",
        "name": "Debug: TTN raw response",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": true,
        "complete": "true",
        "targetType": "full",
        "statusVal": "",
        "statusType": "auto",
        "x": 920,
        "y": 440,
        "wires": []
    },
    {
        "id": "g_gau",
        "type": "ui_group",
        "name": "Estado Actual",
        "tab": "t_mon",
        "order": 1,
        "disp": true,
        "width": "20",
        "collapse": false,
        "className": ""
    },
    {
        "id": "g_tbl",
        "type": "ui_group",
        "name": "Tabla Sensores",
        "tab": "t_mon",
        "order": 2,
        "disp": true,
        "width": "20",
        "collapse": false,
        "className": ""
    },
    {
        "id": "g_map",
        "type": "ui_group",
        "name": "Mapa",
        "tab": "t_mon",
        "order": 3,
        "disp": true,
        "width": "20",
        "collapse": false,
        "className": ""
    },
    {
        "id": "g_cmd",
        "type": "ui_group",
        "name": "Comandos",
        "tab": "t_ctl",
        "order": 1,
        "disp": true,
        "width": "12",
        "collapse": false,
        "className": ""
    },
    {
        "id": "g_log",
        "type": "ui_group",
        "name": "Registro Comandos",
        "tab": "t_ctl",
        "order": 3,
        "disp": true,
        "width": "12",
        "collapse": false,
        "className": ""
    },
    {
        "id": "g_pos",
        "type": "ui_group",
        "name": "Posicion Manual",
        "tab": "t_ctl",
        "order": 2,
        "disp": true,
        "width": "12",
        "collapse": false,
        "className": ""
    },
    {
        "id": "g_cht",
        "type": "ui_group",
        "name": "Historico Nivel",
        "tab": "t_hst",
        "order": 1,
        "disp": true,
        "width": "20",
        "collapse": false,
        "className": ""
    },
    {
        "id": "2e31eaaa78120b68",
        "type": "ui_group",
        "name": "Graficas por dispositivo",
        "tab": "t_hst",
        "order": 3,
        "disp": true,
        "width": "20",
        "collapse": false
    },
    {
        "id": "t_mon",
        "type": "ui_tab",
        "name": "Monitoreo",
        "icon": "dashboard",
        "order": 1,
        "disabled": false,
        "hidden": false
    },
    {
        "id": "t_ctl",
        "type": "ui_tab",
        "name": "Control",
        "icon": "settings_remote",
        "order": 2,
        "disabled": false,
        "hidden": false
    },
    {
        "id": "t_hst",
        "type": "ui_tab",
        "name": "Historial",
        "icon": "show_chart",
        "order": 3,
        "disabled": false,
        "hidden": false
    },
    {
        "id": "3064cd93c0daa67c",
        "type": "global-config",
        "env": [],
        "modules": {
            "node-red-dashboard": "3.6.6",
            "node-red-node-ui-table": "0.4.5",
            "node-red-contrib-web-worldmap": "5.5.4"
        }
    }
]