import { useState, useReducer } from "react";

const CATEGORIES = [
  "Protección Residencial/Comercial",
  "Protección Industrial",
  "Protección Industrial Modular",
  "Protección Datos y Señal",
  "Protección Video/PoE",
  "Protección Iluminación",
  "Accesorios",
  "Cables y Conductores",
  "Breakers y Tableros",
  "Conectores y Conduit",
  "Iluminación",
];
const PROJECT_TYPES = ["Residencial", "Comercial"];
const PROJECT_STATUS = ["En planificación", "En progreso", "Completado"];
const ROLES = ["Administrador", "Supervisor", "Técnico"];

const initialState = {
  materials: [
    // ── Protección Residencial/Comercial ── (Datos reales de cityelectricsupply.com/b/ditek)
    { id: 1,  name: "DTK-120/240CM+",      category: "Protección Residencial/Comercial", unit: "unidades", stock: 0,  minStock: 5,  unitCost: 62.95,  sku: "DTK-120/240CM+",      description: "Split Phase Surge Protective Device, 120/240 VAC — HVAC, bombas, motores, paneles" },
    { id: 2,  name: "DTK-120/240BK1",      category: "Protección Residencial/Comercial", unit: "unidades", stock: 0,  minStock: 5,  unitCost: 83.95,  sku: "DTK-120/240BK1",      description: "Residential Load Center Surge Protective Device, 120/240 VAC" },
    { id: 3,  name: "DTK-120/240HD",       category: "Protección Residencial/Comercial", unit: "unidades", stock: 7,  minStock: 3,  unitCost: 187.95, sku: "DTK-120/240HD",       description: "Mode-Surge Protective Device 50kA/ohm, 25kA — alta capacidad de descarga" },
    { id: 4,  name: "DTK-120/240XD",       category: "Protección Residencial/Comercial", unit: "unidades", stock: 0,  minStock: 5,  unitCost: 118.95, sku: "DTK-120/240XD",       description: "120/240 VAC Split Phase Surge Protective Device" },
    { id: 5,  name: "DTK-120/240HD2",      category: "Protección Residencial/Comercial", unit: "unidades", stock: 7,  minStock: 3,  unitCost: 359.00, sku: "DTK-120/240HD2",      description: "100kA Surge Protective Device — residencial y comercial ligero" },
    { id: 6,  name: "DTK-120/240CMX",      category: "Protección Residencial/Comercial", unit: "unidades", stock: 4,  minStock: 3,  unitCost: 83.95,  sku: "DTK-120/240CMX",      description: "Split Phase Surge Protective Device, 120/240 VAC — uso exterior, NEMA 4X" },
    { id: 7,  name: "DTK-120HW",           category: "Protección Residencial/Comercial", unit: "unidades", stock: 56, minStock: 10, unitCost: 60.99,  sku: "DTK-120HW",           description: "Parallel Connected Surge Protective Device, 120 VAC — paneles y circuitos derivados" },
    { id: 8,  name: "DTK-8FF",             category: "Protección Residencial/Comercial", unit: "unidades", stock: 0,  minStock: 5,  unitCost: 27.99,  sku: "DTK-8FF",             description: "8 Outlet 110-120 VAC Surge Protective Device — protección punto de uso" },

    // ── Protección Industrial ── (Datos reales de cityelectricsupply.com)
    { id: 9,  name: "D50-120/2083Y",       category: "Protección Industrial",             unit: "unidades", stock: 30, minStock: 8,  unitCost: 187.95, sku: "D50-120/2083Y",       description: "Panel Surge Protector 3-Phase 20kA, 120/208 VAC, NEMA 4X — trifásico 4 hilos" },
    { id: 10, name: "D100-120/2083Y",      category: "Protección Industrial",             unit: "unidades", stock: 21, minStock: 5,  unitCost: 450.00, sku: "D100-120/2083Y",      description: "Industrial Surge Protective Device, 100kA/Phase, 120/208 VAC Wye" },
    { id: 11, name: "D50-120/2401",        category: "Protección Industrial",             unit: "unidades", stock: 13, minStock: 4,  unitCost: 188.95, sku: "D50-120/2401",        description: "Industrial Surge Protective Device 50kA/Phase — 120/240VAC Split Phase" },
    { id: 12, name: "D50-277/4803Y",       category: "Protección Industrial",             unit: "unidades", stock: 10, minStock: 3,  unitCost: 193.95, sku: "D50-277/4803Y",       description: "Industrial SPD 50kA/Phase, 277/480 VAC, 4-Wire, Surface Mount" },
    { id: 13, name: "D100-277/4803Y",      category: "Protección Industrial",             unit: "unidades", stock: 15, minStock: 4,  unitCost: 450.00, sku: "D100-277/4803Y",      description: "Industrial Surge Protective Device, 100kA/Phase, 277/480 VAC Wye" },
    { id: 14, name: "D100-120/2401",       category: "Protección Industrial",             unit: "unidades", stock: 9,  minStock: 3,  unitCost: 450.00, sku: "D100-120/2401",       description: "Industrial Surge Protective Device, 100kA/Phase, 120/240 VAC Split Phase" },
    { id: 15, name: "D50-120/240HL",       category: "Protección Industrial",             unit: "unidades", stock: 14, minStock: 4,  unitCost: 188.95, sku: "D50-120/240HL",       description: "Industrial SPD 50kA/Phase, 120/240 VAC Delta High Leg, 4-Wire, Surface Mount" },
    { id: 16, name: "D200-120/2083Y",      category: "Protección Industrial",             unit: "unidades", stock: 8,  minStock: 2,  unitCost: 1020.00, sku: "D200-120/2083Y",     description: "Industrial Surge Protective Device, 200kA/Phase, 120/208VAC Wye" },

    // ── Protección Industrial Modular ── (Datos reales de cityelectricsupply.com)
    { id: 17, name: "D200M-120/2083Y",     category: "Protección Industrial Modular",     unit: "unidades", stock: 15, minStock: 3,  unitCost: 1696.00, sku: "D200M-120/2083Y",    description: "200kA Modular Surge Protective Device, 3-Phase, 4-Wire, 120/208 VAC" },
    { id: 18, name: "D200M-277/4803Y",     category: "Protección Industrial Modular",     unit: "unidades", stock: 11, minStock: 3,  unitCost: 1646.00, sku: "D200M-277/4803Y",    description: "200kA Modular Surge Protective Device, 3-Phase, 4-Wire, 277/480 VAC" },
    { id: 19, name: "D300M-120/2083Y",     category: "Protección Industrial Modular",     unit: "unidades", stock: 10, minStock: 2,  unitCost: 2086.00, sku: "D300M-120/2083Y",    description: "300kA Modular Surge Protective Device, 3-Phase, 4-Wire, 120/208 VAC" },
    { id: 20, name: "D300M-277/4803Y",     category: "Protección Industrial Modular",     unit: "unidades", stock: 10, minStock: 2,  unitCost: 2051.00, sku: "D300M-277/4803Y",    description: "300kA Modular Surge Protective Device, 3-Phase, 4-Wire, 277/480 VAC" },

    // ── Protección Datos y Señal ── (Datos reales de cityelectricsupply.com)
    { id: 21, name: "DTK-2MHLP24B",       category: "Protección Datos y Señal",          unit: "unidades", stock: 0,  minStock: 5,  unitCost: 67.95,  sku: "DTK-2MHLP24B",       description: "Data and Signaling Circuit Surge Protection Module, 5A, 24 VAC — alarmas, control" },
    { id: 22, name: "DTK-2MHLP24BWB",     category: "Protección Datos y Señal",          unit: "unidades", stock: 5,  minStock: 3,  unitCost: 83.95,  sku: "DTK-2MHLP24BWB",     description: "Data and Signaling Circuit SPD with Snap-Track Base, 24 VAC/VDC, Short to Ground" },
    { id: 23, name: "DTK-2MHLP5BWB",      category: "Protección Datos y Señal",          unit: "unidades", stock: 8,  minStock: 3,  unitCost: 84.95,  sku: "DTK-2MHLP5BWB",      description: "Voice, Data and Signaling Circuit Modular SPD, 5 VAC/VDC Service Voltage" },
    { id: 24, name: "DTK-2MHLP75BWB",     category: "Protección Datos y Señal",          unit: "unidades", stock: 6,  minStock: 3,  unitCost: 77.95,  sku: "DTK-2MHLP75BWB",     description: "Data and Signaling Circuit SPD with Snap-Track Base, 75 VAC/VDC, Short to Ground" },
    { id: 25, name: "DTK-2LVLPLV",        category: "Protección Datos y Señal",          unit: "unidades", stock: 11, minStock: 4,  unitCost: 52.95,  sku: "DTK-2LVLPLV",        description: "Data and Signaling Circuit Surge Protector, 24 VAC Service Voltage, 2 Pair" },
    { id: 26, name: "DTK-2LVLPSCPRUV",    category: "Protección Datos y Señal",          unit: "unidades", stock: 3,  minStock: 3,  unitCost: 50.99,  sku: "DTK-2LVLPSCPRUV",    description: "Low Voltage Surge Protector, 2 Pair, 22-16 AWG, 15A Sneak Current Protection" },

    // ── Protección Video/PoE ── (Datos reales de cityelectricsupply.com)
    { id: 27, name: "DTK-MRJPOE",         category: "Protección Video/PoE",              unit: "unidades", stock: 8,  minStock: 3,  unitCost: 62.95,  sku: "DTK-MRJPOE",         description: "Power Over Ethernet Surge Protector — protege cámaras IP y dispositivos PoE" },

    // ── Protección Iluminación ── (Datos reales de cityelectricsupply.com)
    { id: 28, name: "DTK-DL480",          category: "Protección Iluminación",            unit: "unidades", stock: 0,  minStock: 3,  unitCost: 69.99,  sku: "DTK-DL480",          description: "Single-Phase Light Pole Surge Arrestor, 50000A, 480 VAC — postes de alumbrado" },

    // ── Accesorios ── (Datos reales de cityelectricsupply.com)
    { id: 29, name: "DTK-FMKHD",          category: "Accesorios",                        unit: "unidades", stock: 11, minStock: 4,  unitCost: 33.29,  sku: "DTK-FMKHD",          description: "Flush Mount Kit para DTK-120/240HD — kit de montaje empotrado" },
    { id: 30, name: "KIT-120SRD",         category: "Accesorios",                        unit: "unidades", stock: 0,  minStock: 3,  unitCost: 10.99,  sku: "KIT-120SRD",         description: "Cover Kit para DTK-120SRD — cubierta de reemplazo" },

    // ── Cables y Conductores ──
    { id: 31, name: "THHN 12 AWG Negro",        category: "Cables y Conductores", unit: "rollo (500ft)", stock: 25, minStock: 5,  unitCost: 118.50, sku: "SW-THHN-12BK-500",    description: "Southwire THHN/THWN-2, 12 AWG, 500ft, negro — construcción y uso general, 90°C seco/75°C húmedo" },
    { id: 32, name: "THHN 12 AWG Blanco",       category: "Cables y Conductores", unit: "rollo (500ft)", stock: 22, minStock: 5,  unitCost: 118.50, sku: "SW-THHN-12WH-500",    description: "Southwire THHN/THWN-2, 12 AWG, 500ft, blanco — cableado de circuitos de 20A" },
    { id: 33, name: "THHN 12 AWG Verde",        category: "Cables y Conductores", unit: "rollo (500ft)", stock: 18, minStock: 4,  unitCost: 118.50, sku: "SW-THHN-12GR-500",    description: "Southwire THHN/THWN-2, 12 AWG, 500ft, verde — conductor de tierra en circuitos de 20A" },
    { id: 34, name: "THHN 10 AWG Negro",        category: "Cables y Conductores", unit: "rollo (500ft)", stock: 15, minStock: 4,  unitCost: 191.25, sku: "SW-THHN-10BK-500",    description: "Southwire THHN/THWN-2, 10 AWG, 500ft, negro — circuitos de 30A, secadoras y A/C" },
    { id: 35, name: "THHN 8 AWG Negro",         category: "Cables y Conductores", unit: "rollo (500ft)", stock: 10, minStock: 3,  unitCost: 317.00, sku: "SW-THHN-8BK-500",     description: "Southwire THHN/THWN-2, 8 AWG, 500ft, negro — circuitos de 40-50A, tomas de alto voltaje" },
    { id: 36, name: "THHN 6 AWG Negro",         category: "Cables y Conductores", unit: "rollo (250ft)", stock: 8,  minStock: 3,  unitCost: 259.50, sku: "SW-THHN-6BK-250",     description: "Southwire THHN/THWN-2, 6 AWG, 250ft, negro — alimentadores de tableros y circuitos de 60A" },
    { id: 37, name: "Romex 14/2 NM-B",          category: "Cables y Conductores", unit: "rollo (250ft)", stock: 30, minStock: 8,  unitCost: 83.25,  sku: "SW-NMB-142-250",      description: "Southwire Romex, 14/2 con tierra, NM-B, 250ft — cableado residencial, circuitos de 15A" },
    { id: 38, name: "Romex 12/2 NM-B",          category: "Cables y Conductores", unit: "rollo (250ft)", stock: 28, minStock: 8,  unitCost: 119.75, sku: "SW-NMB-122-250",      description: "Southwire Romex, 12/2 con tierra, NM-B, 250ft — circuitos de 20A, tomas de cocina y baño" },
    { id: 39, name: "Romex 12/3 NM-B",          category: "Cables y Conductores", unit: "rollo (250ft)", stock: 16, minStock: 5,  unitCost: 162.50, sku: "SW-NMB-123-250",      description: "Southwire Romex, 12/3 con tierra, NM-B, 250ft — circuitos de 3 hilos, switchers de 3 vías" },
    { id: 40, name: "Romex 10/2 NM-B",          category: "Cables y Conductores", unit: "rollo (250ft)", stock: 12, minStock: 4,  unitCost: 184.00, sku: "SW-NMB-102-250",      description: "Southwire Romex, 10/2 con tierra, NM-B, 250ft — circuitos de 30A, cocinas eléctricas" },
    { id: 41, name: "MC Cable 12/2",             category: "Cables y Conductores", unit: "rollo (250ft)", stock: 10, minStock: 3,  unitCost: 275.00, sku: "SW-MC-122-250",       description: "Southwire MC Cable, 12/2 con tierra, armor metálico, 250ft — aplicaciones comerciales e industriales" },
    { id: 42, name: "SER Aluminio 2-2-4",        category: "Cables y Conductores", unit: "rollo (100ft)", stock: 6,  minStock: 2,  unitCost: 489.00, sku: "SW-SER-224-100",      description: "Southwire SER Aluminio 2-2-4 AWG, 100ft — acometidas de servicios residenciales 200A" },
    { id: 43, name: "XHHW-2 4 AWG Negro",        category: "Cables y Conductores", unit: "rollo (500ft)", stock: 7,  minStock: 2,  unitCost: 534.00, sku: "SW-XHHW2-4BK-500",   description: "Encore Wire XHHW-2, 4 AWG, 500ft, negro — aplicaciones industriales húmedas y secas, 90°C" },
    { id: 44, name: "UFB-W 12/2 Underground",    category: "Cables y Conductores", unit: "rollo (250ft)", stock: 9,  minStock: 3,  unitCost: 147.50, sku: "EW-UFB-122-250",      description: "Encore Wire UFB-W, 12/2, 250ft — cable directo enterrado, circuitos exteriores y jardines" },
    { id: 45, name: "Cable Termostato 18/5",     category: "Cables y Conductores", unit: "rollo (250ft)", stock: 14, minStock: 4,  unitCost: 62.95,  sku: "BD-TSTAT-185-250",    description: "Belden 18 AWG, 5 conductores, 250ft — control de termostatos HVAC, color codificado" },

    // ── Breakers y Tableros ──
    { id: 46, name: "Square D QO115 15A 1P",    category: "Breakers y Tableros",  unit: "unidades", stock: 50, minStock: 15, unitCost: 8.95,   sku: "SQD-QO115",           description: "Square D QO 15A 1-Polo 120V — interruptor de circuito residencial/comercial, plug-in" },
    { id: 47, name: "Square D QO120 20A 1P",    category: "Breakers y Tableros",  unit: "unidades", stock: 48, minStock: 15, unitCost: 9.50,   sku: "SQD-QO120",           description: "Square D QO 20A 1-Polo 120V — circuitos de cocina, baño y uso general" },
    { id: 48, name: "Square D QO230 30A 2P",    category: "Breakers y Tableros",  unit: "unidades", stock: 30, minStock: 10, unitCost: 14.95,  sku: "SQD-QO230",           description: "Square D QO 30A 2-Polos 240V — secadoras, calentadores de agua, A/C pequeños" },
    { id: 49, name: "Square D QO240 40A 2P",    category: "Breakers y Tableros",  unit: "unidades", stock: 20, minStock: 8,  unitCost: 17.50,  sku: "SQD-QO240",           description: "Square D QO 40A 2-Polos 240V — cocinas eléctricas, hornos empotrados" },
    { id: 50, name: "Square D QO260 60A 2P",    category: "Breakers y Tableros",  unit: "unidades", stock: 18, minStock: 6,  unitCost: 22.50,  sku: "SQD-QO260",           description: "Square D QO 60A 2-Polos 240V — alimentadores de subtableros, A/C central" },
    { id: 51, name: "Square D HOM6-12L100PG",   category: "Breakers y Tableros",  unit: "unidades", stock: 8,  minStock: 3,  unitCost: 149.95, sku: "SQD-HOM612L100PG",   description: "Square D HomeLine 100A, 6/12 circuitos, caja de carga 120/240V — residencial" },
    { id: 52, name: "Square D QO130L200PG",     category: "Breakers y Tableros",  unit: "unidades", stock: 5,  minStock: 2,  unitCost: 285.00, sku: "SQD-QO130L200PG",    description: "Square D QO 200A, 30 circuitos, panel de carga 120/240V con interruptor principal" },
    { id: 53, name: "Eaton CH115 15A 1P",       category: "Breakers y Tableros",  unit: "unidades", stock: 40, minStock: 12, unitCost: 8.25,   sku: "ETN-CH115",           description: "Eaton CH 15A 1-Polo 120V — interruptor de circuito plug-in para tableros Eaton/CH" },
    { id: 54, name: "Eaton CH120 20A 1P",       category: "Breakers y Tableros",  unit: "unidades", stock: 38, minStock: 12, unitCost: 8.95,   sku: "ETN-CH120",           description: "Eaton CH 20A 1-Polo 120V — circuitos de 20A para uso residencial y comercial" },
    { id: 55, name: "Eaton CH230 30A 2P",       category: "Breakers y Tableros",  unit: "unidades", stock: 22, minStock: 8,  unitCost: 14.25,  sku: "ETN-CH230",           description: "Eaton CH 30A 2-Polos 240V — cargas eléctricas de alta demanda" },
    { id: 56, name: "Siemens Q115 15A 1P",      category: "Breakers y Tableros",  unit: "unidades", stock: 35, minStock: 10, unitCost: 7.95,   sku: "SIE-Q115",            description: "Siemens QP 15A 1-Polo 120V — plug-in para tableros Siemens/Murray/Gould" },
    { id: 57, name: "Siemens Q120 20A 1P",      category: "Breakers y Tableros",  unit: "unidades", stock: 32, minStock: 10, unitCost: 8.50,   sku: "SIE-Q120",            description: "Siemens QP 20A 1-Polo 120V — circuitos de uso general y cocina" },
    { id: 58, name: "Siemens EQ8100ARM",        category: "Breakers y Tableros",  unit: "unidades", stock: 4,  minStock: 2,  unitCost: 378.00, sku: "SIE-EQ8100ARM",       description: "Siemens 100A Main Breaker Panel, 8/16 circuitos — tablero con interruptor principal y protección AFCI" },
    { id: 59, name: "GE THQB1115 15A 1P",      category: "Breakers y Tableros",  unit: "unidades", stock: 28, minStock: 8,  unitCost: 7.50,   sku: "GE-THQB1115",         description: "GE THQB 15A 1-Polo 120V — bolt-on para tableros GE, uso comercial" },
    { id: 60, name: "ABB 3P 100A Tripolar",     category: "Breakers y Tableros",  unit: "unidades", stock: 6,  minStock: 2,  unitCost: 185.00, sku: "ABB-T2S100-3P",       description: "ABB Tmax T2S 100A 3-Polos 480V — interruptor industrial para tableros de media tensión" },

    // ── Conectores y Conduit ──
    { id: 61, name: "Conduit EMT 1/2\" - 10ft", category: "Conectores y Conduit", unit: "piezas", stock: 120, minStock: 30, unitCost: 4.45,   sku: "ALD-EMT-12-10",       description: "Allied EMT 1/2\", 10 pies, calibre 18 — tubería eléctrica metálica para instalaciones expuestas" },
    { id: 62, name: "Conduit EMT 3/4\" - 10ft", category: "Conectores y Conduit", unit: "piezas", stock: 95,  minStock: 25, unitCost: 6.25,   sku: "ALD-EMT-34-10",       description: "Allied EMT 3/4\", 10 pies — para cableado de circuitos de mayor calibre en exteriores" },
    { id: 63, name: "Conduit EMT 1\" - 10ft",   category: "Conectores y Conduit", unit: "piezas", stock: 60,  minStock: 15, unitCost: 9.50,   sku: "ALD-EMT-1-10",        description: "Allied EMT 1\", 10 pies — alimentadores y acometidas en instalaciones comerciales" },
    { id: 64, name: "Conduit PVC 1/2\" - 10ft", category: "Conectores y Conduit", unit: "piezas", stock: 150, minStock: 40, unitCost: 2.95,   sku: "CAR-PVC-12-10",       description: "Carlon PVC Schedule 40, 1/2\", 10 pies — uso subterráneo e instalaciones húmedas" },
    { id: 65, name: "Conduit PVC 3/4\" - 10ft", category: "Conectores y Conduit", unit: "piezas", stock: 120, minStock: 30, unitCost: 3.75,   sku: "CAR-PVC-34-10",       description: "Carlon PVC Schedule 40, 3/4\", 10 pies — subterráneo y uso exterior en plomadas" },
    { id: 66, name: "Conduit PVC 1\" - 10ft",   category: "Conectores y Conduit", unit: "piezas", stock: 80,  minStock: 20, unitCost: 5.50,   sku: "CAR-PVC-1-10",        description: "Carlon PVC Schedule 40, 1\", 10 pies — alimentadores subterráneos y canalizaciones" },
    { id: 67, name: "Caja metálica 4x4",         category: "Conectores y Conduit", unit: "piezas", stock: 75,  minStock: 20, unitCost: 3.25,   sku: "RAC-4SQ-112",         description: "Raco caja de salida metálica 4\"x4\"x1-1/2\" — instalaciones de conduit EMT/Rigid" },
    { id: 68, name: "Caja PVC 1 gang",           category: "Conectores y Conduit", unit: "piezas", stock: 100, minStock: 25, unitCost: 1.25,   sku: "CAR-B114A",           description: "Carlon caja PVC 1 gang, 14.5 ci — para interruptores y tomacorrientes en conduit PVC" },
    { id: 69, name: "Conector EMT 1/2\" set-screw", category: "Conectores y Conduit", unit: "piezas", stock: 200, minStock: 50, unitCost: 0.65, sku: "TnB-5133-12",        description: "Thomas & Betts conector EMT 1/2\" set-screw — conexión a caja metálica, acero zincado" },
    { id: 70, name: "Conector EMT 3/4\" set-screw", category: "Conectores y Conduit", unit: "piezas", stock: 160, minStock: 40, unitCost: 0.85, sku: "TnB-5133-34",        description: "Thomas & Betts conector EMT 3/4\" set-screw — conexión de conduit a cajas y tableros" },
    { id: 71, name: "Coupling EMT 1/2\"",        category: "Conectores y Conduit", unit: "piezas", stock: 180, minStock: 40, unitCost: 0.55,   sku: "TnB-5140-12",         description: "Thomas & Betts coupling EMT 1/2\" set-screw — unión de tramos de conduit" },
    { id: 72, name: "Caja intemperie 1 gang",    category: "Conectores y Conduit", unit: "piezas", stock: 45,  minStock: 10, unitCost: 6.50,   sku: "HBL-5310-0",          description: "Hubbell caja exterior 1 gang, NEMA 3R, riser — para tomas y switches en exteriores" },
    { id: 73, name: "Wire Nuts amarillo (100pk)", category: "Conectores y Conduit", unit: "paquete", stock: 30, minStock: 8,  unitCost: 8.95,   sku: "3M-Y1-100PK",         description: "3M Scotchlok conectores de alambre amarillo, 100 unidades — empalmes 12-10 AWG" },
    { id: 74, name: "Grapa cable 1/2\" (100pk)", category: "Conectores y Conduit", unit: "paquete", stock: 25,  minStock: 6,  unitCost: 4.25,   sku: "GBR-STPL-12-100",     description: "Grapas de cable romex/MC 1/2\", 100 unidades — fijación de cables NM-B a madera" },
    { id: 75, name: "Cable tie nylon 8\" (100pk)",category: "Conectores y Conduit", unit: "paquete", stock: 40, minStock: 10, unitCost: 5.95,   sku: "PAN-PLT2S-100",       description: "Panduit cable tie nylon 8\", 50 lb, 100 unidades — organización de cables y mazos" },

    // ── Iluminación ──
    { id: 76, name: "LED A19 9W 2700K (16pk)",  category: "Iluminación",           unit: "paquete", stock: 35,  minStock: 10, unitCost: 22.95,  sku: "PHI-A19-9W-16PK",     description: "Philips LED A19, 9W equiv. 60W, 2700K cálida, 800lm, base E26 — uso general residencial" },
    { id: 77, name: "LED PAR38 18W 3000K",      category: "Iluminación",           unit: "unidades", stock: 28, minStock: 8,  unitCost: 12.95,  sku: "GE-PAR38-18W-3K",     description: "GE LED PAR38, 18W equiv. 100W, 3000K, 1350lm, dimmable — iluminación de acento y comercial" },
    { id: 78, name: "LED T8 4ft 18W 5000K",     category: "Iluminación",           unit: "unidades", stock: 50, minStock: 15, unitCost: 9.50,   sku: "SYL-T8-18W-5K",       description: "Sylvania LED T8, 4ft, 18W, 5000K luz día, 2200lm — reemplazo directo fluorescente, Type A+B" },
    { id: 79, name: "LED Shop Light 4ft 5000K", category: "Iluminación",           unit: "unidades", stock: 22, minStock: 6,  unitCost: 28.50,  sku: "LTH-2SQTL-40",        description: "Lithonia Lighting LED shoplight 4ft, 40W, 5000K, 4400lm — garajes, bodegas y talleres" },
    { id: 80, name: "LED Recessed 6\" 12W 3000K",category: "Iluminación",          unit: "unidades", stock: 40, minStock: 12, unitCost: 15.95,  sku: "HALO-RL560-3K",       description: "Halo LED recessed 6\", 12W, 3000K, 850lm, dimmable — downlight residencial y comercial" },
    { id: 81, name: "LED Area Light 100W 5000K", category: "Iluminación",          unit: "unidades", stock: 10, minStock: 3,  unitCost: 124.95, sku: "LTH-KAD-100L",        description: "Lithonia LED area light 100W, 5000K, 12000lm, NEMA 3R — estacionamientos y exteriores" },
    { id: 82, name: "LED Street Light 150W",    category: "Iluminación",           unit: "unidades", stock: 6,  minStock: 2,  unitCost: 245.00, sku: "CREE-OSQ-150L",       description: "Cree LED street light 150W, 5000K, 18750lm — postes de alumbrado público vías urbanas" },
    { id: 83, name: "Exit Sign LED Doble cara", category: "Iluminación",           unit: "unidades", stock: 18, minStock: 5,  unitCost: 35.95,  sku: "LTH-EXR9-LED",        description: "Lithonia exit sign LED, doble cara, rojo/verde, batería de respaldo 90min — señalética NEC" },
    { id: 84, name: "Emergency Light Twin Head",category: "Iluminación",           unit: "unidades", stock: 14, minStock: 4,  unitCost: 42.50,  sku: "LTH-ELR4-LED",        description: "Lithonia emergency light twin head LED, batería Ni-Cd 90min — iluminación de emergencia" },
    { id: 85, name: "Fotocélula 105-277V",      category: "Iluminación",           unit: "unidades", stock: 30, minStock: 8,  unitCost: 12.95,  sku: "LEV-ODB-PDL",         description: "Leviton fotocélula twist-lock, 105-277V, 1800W — control automático alumbrado exterior" },
    { id: 86, name: "LED High Bay UFO 200W",    category: "Iluminación",           unit: "unidades", stock: 8,  minStock: 2,  unitCost: 189.00, sku: "ETN-EHBX200",         description: "Eaton LED high bay UFO 200W, 5000K, 26000lm — bodegas, plantas y áreas industriales" },
    { id: 87, name: "LED Wraparound 4ft 40W",   category: "Iluminación",           unit: "unidades", stock: 20, minStock: 6,  unitCost: 65.00,  sku: "MXL-LWR40-4",         description: "Maxlite LED wraparound 4ft, 40W, 4400lm, 4000K — oficinas, pasillos y comercial" },
    { id: 88, name: "LED Panel 2x4 50W 5000K",  category: "Iluminación",           unit: "unidades", stock: 15, minStock: 4,  unitCost: 89.95,  sku: "KST-LED-2X4-50W",     description: "Keystone LED panel 2x4, 50W, 5000K, 6500lm, 0-10V dimmable — oficinas y salas de reuniones" },
    { id: 89, name: "LED Floodlight 78W 5000K", category: "Iluminación",           unit: "unidades", stock: 12, minStock: 3,  unitCost: 98.50,  sku: "RAB-WPLED78",         description: "RAB LED floodlight 78W, 5000K, 8600lm, NEMA 4X — fachadas, seguridad y exteriores" },
    { id: 90, name: "LED BR30 9W 2700K Dimm",   category: "Iluminación",           unit: "unidades", stock: 36, minStock: 10, unitCost: 8.95,   sku: "SAT-9BR30-27K",       description: "Satco LED BR30, 9W equiv. 65W, 2700K, 650lm, dimmable — lámparas de receso residencial" },
  ],
  projects: [
    { id: 1, name: "Residencia López",      type: "Residencial", status: "En progreso",    responsible: "Carlos Méndez", materials: [{ materialId: 1, qty: 2 }, { materialId: 7, qty: 1 }, { materialId: 8, qty: 3 }], budget: 320,  createdAt: "2026-04-15" },
    { id: 2, name: "Oficinas Torre Central",type: "Comercial",   status: "En planificación",responsible: "Ana Rivera",    materials: [{ materialId: 9, qty: 2 }, { materialId: 21, qty: 6 }, { materialId: 27, qty: 4 }], budget: 1250, createdAt: "2026-05-01" },
    { id: 3, name: "Casa García",           type: "Residencial", status: "Completado",      responsible: "Luis Torres",   materials: [{ materialId: 2, qty: 1 }, { materialId: 7, qty: 2 }, { materialId: 29, qty: 1 }], budget: 280,  createdAt: "2026-03-10" },
  ],
  team: [
    { id: 1, name: "Carlos Méndez", role: "Supervisor", email: "carlos@empresa.com" },
    { id: 2, name: "Ana Rivera", role: "Administrador", email: "ana@empresa.com" },
    { id: 3, name: "Luis Torres", role: "Técnico", email: "luis@empresa.com" },
    { id: 4, name: "María Sánchez", role: "Técnico", email: "maria@empresa.com" },
    { id: 5, name: "Pedro Gómez", role: "Supervisor", email: "pedro@empresa.com" },
  ],
  movements: [
    { id: 1, type: "salida",  materialId: 1,  qty: 2,  projectId: 1,    userId: 1, date: "2026-05-10", note: "Instalación panel principal — Residencia López" },
    { id: 2, type: "entrada", materialId: 7,  qty: 20, projectId: null, userId: 2, date: "2026-05-08", note: "Compra City Electric Supply — lote DTK-120HW" },
    { id: 3, type: "salida",  materialId: 21, qty: 4,  projectId: 2,    userId: 3, date: "2026-05-12", note: "Módulos señalización — Oficinas Torre Central piso 3" },
    { id: 4, type: "entrada", materialId: 9,  qty: 10, projectId: null, userId: 2, date: "2026-05-14", note: "Reposición stock industrial — proveedor CES" },
    { id: 5, type: "salida",  materialId: 27, qty: 2,  projectId: 2,    userId: 3, date: "2026-05-15", note: "Protección PoE cámaras — Torre Central" },
  ],
  nextIds: { material: 91, project: 4, team: 6, movement: 6 },
};

function reducer(state, action) {
  switch (action.type) {
    case "ADD_MATERIAL": {
      const id = state.nextIds.material;
      return { ...state, materials: [...state.materials, { ...action.payload, id }], nextIds: { ...state.nextIds, material: id + 1 } };
    }
    case "UPDATE_MATERIAL":
      return { ...state, materials: state.materials.map(m => m.id === action.payload.id ? { ...m, ...action.payload } : m) };
    case "DELETE_MATERIAL":
      return { ...state, materials: state.materials.filter(m => m.id !== action.payload) };
    case "ADD_PROJECT": {
      const id = state.nextIds.project;
      return { ...state, projects: [...state.projects, { ...action.payload, id, createdAt: new Date().toISOString().split("T")[0] }], nextIds: { ...state.nextIds, project: id + 1 } };
    }
    case "UPDATE_PROJECT":
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? { ...p, ...action.payload } : p) };
    case "DELETE_PROJECT":
      return { ...state, projects: state.projects.filter(p => p.id !== action.payload) };
    case "ADD_TEAM": {
      const id = state.nextIds.team;
      return { ...state, team: [...state.team, { ...action.payload, id }], nextIds: { ...state.nextIds, team: id + 1 } };
    }
    case "DELETE_TEAM":
      return { ...state, team: state.team.filter(t => t.id !== action.payload) };
    case "ADD_MOVEMENT": {
      const id = state.nextIds.movement;
      const mat = state.materials.find(m => m.id === action.payload.materialId);
      const newStock = action.payload.type === "entrada" ? mat.stock + action.payload.qty : mat.stock - action.payload.qty;
      return {
        ...state,
        movements: [...state.movements, { ...action.payload, id, date: new Date().toISOString().split("T")[0] }],
        materials: state.materials.map(m => m.id === action.payload.materialId ? { ...m, stock: Math.max(0, newStock) } : m),
        nextIds: { ...state.nextIds, movement: id + 1 },
      };
    }
    default: return state;
  }
}

// =================== UI PRIMITIVES ===================
const Badge = ({ children, color }) => {
  const colors = {
    green: "bg-emerald-100 text-emerald-700",
    yellow: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
};

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <input
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
    />
  </div>
);

const Select = ({ label, options, ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
    <select
      {...props}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Btn = ({ children, variant = "primary", className = "", ...props }) => {
  const v = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-red-500 text-white hover:bg-red-600",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
  };
  return (
    <button {...props} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${v[variant]} ${className}`}>
      {children}
    </button>
  );
};

// =================== DASHBOARD ===================
function Dashboard({ state }) {
  const activeProjects = state.projects.filter(p => p.status !== "Completado").length;
  const lowStock = state.materials.filter(m => m.stock <= m.minStock).length;
  const totalValue = state.materials.reduce((s, m) => s + m.stock * m.unitCost, 0);
  const totalBudget = state.projects.filter(p => p.status !== "Completado").reduce((s, p) => s + (p.budget || 0), 0);
  const res = state.projects.filter(p => p.type === "Residencial").length;
  const com = state.projects.filter(p => p.type === "Comercial").length;

  const cards = [
    { label: "Proyectos Activos", value: activeProjects, icon: "📁", color: "border-blue-500" },
    { label: "Materiales Bajo Stock", value: lowStock, icon: "⚠️", color: "border-amber-500" },
    { label: "Valor del Inventario", value: `$${totalValue.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: "💰", color: "border-emerald-500" },
    { label: "Presupuesto Activo", value: `$${totalBudget.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: "📊", color: "border-purple-500" },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map(c => (
          <div key={c.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${c.color}`}>
            <div className="text-2xl mb-1">{c.icon}</div>
            <div className="text-xl font-bold text-gray-800">{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">Distribución de Proyectos</h3>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Residencial</span><span className="font-medium">{res}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(res / (res + com || 1)) * 100}%` }} />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span>Comercial</span><span className="font-medium">{com}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(com / (res + com || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">Equipo</h3>
          <div className="flex gap-4">
            {ROLES.map(r => {
              const count = state.team.filter(t => t.role === r).length;
              return (
                <div key={r} className="text-center flex-1">
                  <div className="text-2xl font-bold text-gray-800">{count}</div>
                  <div className="text-xs text-gray-500">{r}es</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {lowStock > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h3 className="font-bold text-red-600 mb-3">⚠️ Alertas de Stock Bajo</h3>
          <div className="space-y-2">
            {state.materials.filter(m => m.stock <= m.minStock).map(m => (
              <div key={m.id} className="flex items-center justify-between bg-red-50 rounded-lg p-3">
                <div>
                  <span className="font-medium text-gray-800">{m.name}</span>{" "}
                  <Badge color="red">{m.category}</Badge>
                </div>
                <div className="text-sm text-red-600 font-medium">{m.stock} / {m.minStock} mín.</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3">Últimos Movimientos</h3>
        <div className="space-y-2">
          {[...state.movements].reverse().slice(0, 5).map(mv => {
            const mat = state.materials.find(m => m.id === mv.materialId);
            const usr = state.team.find(u => u.id === mv.userId);
            const prj = mv.projectId ? state.projects.find(p => p.id === mv.projectId) : null;
            return (
              <div key={mv.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge color={mv.type === "entrada" ? "green" : "orange"}>
                    {mv.type === "entrada" ? "Entrada" : "Salida"}
                  </Badge>
                  <span className="font-medium">{mat?.name || "—"}</span>
                  <span className="text-gray-500">x{mv.qty}</span>
                </div>
                <div className="text-gray-500 text-xs">
                  {usr?.name} {prj ? `· ${prj.name}` : ""} · {mv.date}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// =================== INVENTARIO ===================
function Inventory({ state, dispatch }) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todas");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", category: CATEGORIES[0], unit: "unidades", stock: 0, minStock: 0, unitCost: 0, sku: "", description: "" });
  const [mvModal, setMvModal] = useState(null);
  const [mvForm, setMvForm] = useState({ type: "entrada", qty: 0, projectId: "", userId: "", note: "" });

  const filtered = state.materials.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "Todas" || m.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setForm({ name: "", category: CATEGORIES[0], unit: "unidades", stock: 0, minStock: 0, unitCost: 0, sku: "", description: "" });
    setModal("add");
  };
  const openEdit = (m) => { setForm(m); setModal("edit"); };
  const save = () => {
    if (!form.name) return;
    if (modal === "add") dispatch({ type: "ADD_MATERIAL", payload: { ...form, stock: +form.stock, minStock: +form.minStock, unitCost: +form.unitCost } });
    else dispatch({ type: "UPDATE_MATERIAL", payload: { ...form, stock: +form.stock, minStock: +form.minStock, unitCost: +form.unitCost } });
    setModal(null);
  };
  const openMv = (m) => {
    setMvForm({ type: "entrada", qty: 0, projectId: "", userId: state.team[0]?.id || "", note: "" });
    setMvModal(m);
  };
  const saveMv = () => {
    if (!mvForm.qty || mvForm.qty <= 0) return;
    dispatch({
      type: "ADD_MOVEMENT",
      payload: {
        ...mvForm,
        materialId: mvModal.id,
        qty: +mvForm.qty,
        projectId: mvForm.projectId ? +mvForm.projectId : null,
        userId: +mvForm.userId
      }
    });
    setMvModal(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          placeholder="Buscar material..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option>Todas</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <Btn onClick={openAdd}>+ Material</Btn>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="p-3">Parte / Nombre</th>
              <th className="p-3">Categoría</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Mín.</th>
              <th className="p-3">Costo Unit.</th>
              <th className="p-3">Valor Total</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-t hover:bg-gray-50">
                <td className="p-3">
                  <div className="font-medium text-gray-800">{m.name}</div>
                  {m.description && <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{m.description}</div>}
                </td>
                <td className="p-3"><Badge color="blue">{m.category}</Badge></td>
                <td className="p-3">
                  <span className={m.stock <= m.minStock ? "text-red-600 font-bold" : ""}>
                    {m.stock} {m.unit}
                  </span>
                </td>
                <td className="p-3 text-gray-500">{m.minStock}</td>
                <td className="p-3">${m.unitCost.toFixed(2)}</td>
                <td className="p-3 font-medium">${(m.stock * m.unitCost).toFixed(2)}</td>
                <td className="p-3 flex gap-1 flex-wrap">
                  <button onClick={() => openMv(m)} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100">
                    Movimiento
                  </button>
                  <button onClick={() => openEdit(m)} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100">
                    Editar
                  </button>
                  <button onClick={() => dispatch({ type: "DELETE_MATERIAL", payload: m.id })} className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100">
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400">No se encontraron materiales</div>
        )}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Agregar Material" : "Editar Material"}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Input label="Nombre / Modelo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <Input label="SKU / Parte #" value={form.sku || ""} onChange={e => setForm({ ...form, sku: e.target.value })} />
          <Select label="Categoría" options={CATEGORIES} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Especificaciones técnicas del producto..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Unidad" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          <Input label="Stock actual" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
          <Input label="Stock Mínimo" type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} />
          <Input label="Costo Unitario ($)" type="number" step="0.01" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
          <Btn onClick={save}>Guardar</Btn>
        </div>
      </Modal>

      <Modal open={!!mvModal} onClose={() => setMvModal(null)} title={`Movimiento: ${mvModal?.name || ""}`}>
        <Select label="Tipo" options={["entrada", "salida"]} value={mvForm.type} onChange={e => setMvForm({ ...mvForm, type: e.target.value })} />
        <Input label="Cantidad" type="number" value={mvForm.qty} onChange={e => setMvForm({ ...mvForm, qty: e.target.value })} />
        <Select
          label="Responsable"
          options={state.team.map(t => t.name)}
          value={state.team.find(t => t.id === +mvForm.userId)?.name || ""}
          onChange={e => { const u = state.team.find(t => t.name === e.target.value); setMvForm({ ...mvForm, userId: u?.id || "" }); }}
        />
        {mvForm.type === "salida" && (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto (opcional)</label>
            <select
              value={mvForm.projectId}
              onChange={e => setMvForm({ ...mvForm, projectId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Sin proyecto</option>
              {state.projects.filter(p => p.status !== "Completado").map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}
        <Input label="Nota" value={mvForm.note} onChange={e => setMvForm({ ...mvForm, note: e.target.value })} />
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="secondary" onClick={() => setMvModal(null)}>Cancelar</Btn>
          <Btn variant="success" onClick={saveMv}>Registrar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// =================== PROYECTOS ===================
function Projects({ state, dispatch }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: "", type: PROJECT_TYPES[0], status: PROJECT_STATUS[0], responsible: "", materials: [], budget: 0 });
  const [detail, setDetail] = useState(null);
  const [matToAdd, setMatToAdd] = useState({ materialId: "", qty: 0 });

  const openAdd = () => {
    setForm({ name: "", type: PROJECT_TYPES[0], status: PROJECT_STATUS[0], responsible: state.team[0]?.name || "", materials: [], budget: 0 });
    setModal("add");
  };
  const openEdit = (p) => { setForm({ ...p }); setModal("edit"); };

  const addMatToForm = () => {
    if (!matToAdd.materialId || matToAdd.qty <= 0) return;
    setForm({ ...form, materials: [...form.materials, { materialId: +matToAdd.materialId, qty: +matToAdd.qty }] });
    setMatToAdd({ materialId: "", qty: 0 });
  };
  const removeMatFromForm = (idx) => setForm({ ...form, materials: form.materials.filter((_, i) => i !== idx) });

  const save = () => {
    if (!form.name) return;
    if (modal === "add") dispatch({ type: "ADD_PROJECT", payload: { ...form, budget: +form.budget } });
    else dispatch({ type: "UPDATE_PROJECT", payload: { ...form, budget: +form.budget } });
    setModal(null);
  };

  const getCost = (p) => p.materials.reduce((s, pm) => {
    const m = state.materials.find(x => x.id === pm.materialId);
    return s + (m ? m.unitCost * pm.qty : 0);
  }, 0);

  const statusColor = (s) => s === "Completado" ? "green" : s === "En progreso" ? "blue" : "yellow";

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">{state.projects.length} proyectos</div>
        <Btn onClick={openAdd}>+ Proyecto</Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.projects.map(p => {
          const cost = getCost(p);
          return (
            <div
              key={p.id}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setDetail(p)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-gray-800">{p.name}</h3>
                <button
                  onClick={e => { e.stopPropagation(); dispatch({ type: "DELETE_PROJECT", payload: p.id }); }}
                  className="text-gray-300 hover:text-red-500 leading-none"
                >
                  &times;
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                <Badge color={p.type === "Residencial" ? "blue" : "purple"}>{p.type}</Badge>
                <Badge color={statusColor(p.status)}>{p.status}</Badge>
              </div>
              <div className="text-xs text-gray-500 mb-1">Responsable: {p.responsible}</div>
              <div className="text-xs text-gray-500 mb-2">{p.materials.length} materiales asignados</div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs text-gray-400">Costo materiales</div>
                  <div className="font-bold text-gray-800">${cost.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Presupuesto</div>
                  <div className="font-bold text-emerald-600">${(p.budget || 0).toLocaleString()}</div>
                </div>
              </div>
              {p.budget > 0 && (
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cost > p.budget ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{ width: `${Math.min((cost / p.budget) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || ""}>
        {detail && (
          <div>
            <div className="flex gap-2 mb-3">
              <Badge color={detail.type === "Residencial" ? "blue" : "purple"}>{detail.type}</Badge>
              <Badge color={statusColor(detail.status)}>{detail.status}</Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">Responsable: <strong>{detail.responsible}</strong></p>
            <p className="text-sm text-gray-600 mb-3">Creado: {detail.createdAt}</p>
            <h4 className="font-bold text-sm mb-2">Materiales Asignados</h4>
            <div className="space-y-1 mb-3">
              {detail.materials.map((pm, i) => {
                const m = state.materials.find(x => x.id === pm.materialId);
                return m ? (
                  <div key={i} className="flex justify-between bg-gray-50 rounded-lg p-2 text-sm">
                    <span>{m.name}</span>
                    <span className="text-gray-500">{pm.qty} {m.unit} · ${(m.unitCost * pm.qty).toFixed(2)}</span>
                  </div>
                ) : null;
              })}
            </div>
            <div className="flex justify-between font-bold text-sm border-t pt-2">
              <span>Total materiales</span>
              <span>${getCost(detail).toFixed(2)}</span>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Btn variant="secondary" onClick={() => setDetail(null)}>Cerrar</Btn>
              <Btn onClick={() => { openEdit(detail); setDetail(null); }}>Editar</Btn>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "add" ? "Nuevo Proyecto" : "Editar Proyecto"}>
        <Input label="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Tipo" options={PROJECT_TYPES} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} />
          <Select label="Estado" options={PROJECT_STATUS} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} />
        </div>
        <Select label="Responsable" options={state.team.map(t => t.name)} value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} />
        <Input label="Presupuesto ($)" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} />

        <h4 className="font-bold text-sm mt-3 mb-2">Materiales ({form.materials.length})</h4>
        <div className="space-y-1 mb-2">
          {form.materials.map((pm, i) => {
            const m = state.materials.find(x => x.id === pm.materialId);
            return (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-2 text-sm">
                <span>{m?.name || "—"} x{pm.qty}</span>
                <button onClick={() => removeMatFromForm(i)} className="text-red-400 hover:text-red-600">×</button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Material</label>
            <select
              value={matToAdd.materialId}
              onChange={e => setMatToAdd({ ...matToAdd, materialId: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm bg-white"
            >
              <option value="">Seleccionar</option>
              {state.materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="w-20">
            <label className="block text-xs text-gray-500 mb-1">Cant.</label>
            <input
              type="number"
              value={matToAdd.qty}
              onChange={e => setMatToAdd({ ...matToAdd, qty: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
            />
          </div>
          <button onClick={addMatToForm} className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200">
            +
          </button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="secondary" onClick={() => setModal(null)}>Cancelar</Btn>
          <Btn onClick={save}>Guardar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// =================== EQUIPO ===================
function Team({ state, dispatch }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", role: ROLES[0], email: "" });

  const save = () => {
    if (!form.name) return;
    dispatch({ type: "ADD_TEAM", payload: form });
    setModal(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">{state.team.length} miembros</div>
        <Btn onClick={() => { setForm({ name: "", role: ROLES[0], email: "" }); setModal(true); }}>+ Miembro</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.team.map(t => {
          const projects = state.projects.filter(p => p.responsible === t.name);
          const roleColor = t.role === "Administrador" ? "purple" : t.role === "Supervisor" ? "blue" : "green";
          return (
            <div key={t.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                  {t.name[0]}
                </div>
                <button onClick={() => dispatch({ type: "DELETE_TEAM", payload: t.id })} className="text-gray-300 hover:text-red-500 leading-none">
                  &times;
                </button>
              </div>
              <h3 className="font-bold text-gray-800 mt-2">{t.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{t.email}</p>
              <Badge color={roleColor}>{t.role}</Badge>
              <div className="mt-3 text-xs text-gray-500">{projects.length} proyecto(s) asignado(s)</div>
            </div>
          );
        })}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Agregar Miembro">
        <Input label="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <Select label="Rol" options={ROLES} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
        <div className="flex justify-end gap-2 mt-4">
          <Btn variant="secondary" onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn onClick={save}>Guardar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// =================== COTIZACIONES ===================
function Quotes({ state }) {
  const [selectedProject, setSelectedProject] = useState(null);

  const getCost = (p) => p.materials.reduce((s, pm) => {
    const m = state.materials.find(x => x.id === pm.materialId);
    return s + (m ? m.unitCost * pm.qty : 0);
  }, 0);

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Proyecto</label>
        <select
          value={selectedProject?.id || ""}
          onChange={e => setSelectedProject(state.projects.find(p => p.id === +e.target.value) || null)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white w-full max-w-md"
        >
          <option value="">— Seleccionar proyecto —</option>
          {state.projects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
        </select>
      </div>

      {selectedProject ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-xl font-bold text-gray-800">Cotización</h2>
            <div className="flex gap-2 mt-1">
              <Badge color={selectedProject.type === "Residencial" ? "blue" : "purple"}>{selectedProject.type}</Badge>
              <Badge color="gray">{selectedProject.createdAt}</Badge>
            </div>
            <h3 className="text-lg font-medium text-gray-700 mt-2">{selectedProject.name}</h3>
            <p className="text-sm text-gray-500">Responsable: {selectedProject.responsible}</p>
          </div>

          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2">#</th>
                <th className="pb-2">Material</th>
                <th className="pb-2">Cantidad</th>
                <th className="pb-2">P. Unit.</th>
                <th className="pb-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {selectedProject.materials.map((pm, i) => {
                const m = state.materials.find(x => x.id === pm.materialId);
                if (!m) return null;
                return (
                  <tr key={i} className="border-b">
                    <td className="py-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 font-medium">{m.name}</td>
                    <td className="py-2">{pm.qty} {m.unit}</td>
                    <td className="py-2">${m.unitCost.toFixed(2)}</td>
                    <td className="py-2 text-right font-medium">${(m.unitCost * pm.qty).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="text-right space-y-1">
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-gray-500">Subtotal:</span>
                <span className="font-medium">${getCost(selectedProject).toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-8 text-sm">
                <span className="text-gray-500">IVA (16%):</span>
                <span className="font-medium">${(getCost(selectedProject) * 0.16).toFixed(2)}</span>
              </div>
              <div className="flex justify-between gap-8 text-lg border-t pt-1">
                <span className="font-bold">Total:</span>
                <span className="font-bold text-emerald-600">${(getCost(selectedProject) * 1.16).toFixed(2)}</span>
              </div>
              {selectedProject.budget > 0 && (
                <div className="flex justify-between gap-8 text-sm">
                  <span className="text-gray-500">Presupuesto:</span>
                  <span className={getCost(selectedProject) * 1.16 > selectedProject.budget ? "text-red-600 font-medium" : "text-emerald-600 font-medium"}>
                    ${selectedProject.budget.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
          Selecciona un proyecto para generar su cotización
        </div>
      )}
    </div>
  );
}

// =================== APP ===================
export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [tab, setTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "inventory", label: "Inventario", icon: "📦" },
    { id: "projects", label: "Proyectos", icon: "📁" },
    { id: "quotes", label: "Cotizaciones", icon: "💲" },
    { id: "team", label: "Equipo", icon: "👥" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">ElectriGestión</h1>
              <p className="text-xs text-gray-400">Gestión de Materiales Eléctricos</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === t.id ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab === "dashboard" && <Dashboard state={state} />}
        {tab === "inventory" && <Inventory state={state} dispatch={dispatch} />}
        {tab === "projects" && <Projects state={state} dispatch={dispatch} />}
        {tab === "quotes" && <Quotes state={state} />}
        {tab === "team" && <Team state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}
