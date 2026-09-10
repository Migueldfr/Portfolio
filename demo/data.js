const STORE_NAMES = ["Tienda Centro", "Tienda Norte", "Tienda Sur", "Tienda Este"];
const WINERY_NAMES = ["Bodega Valdeluz", "Bodega Los Cerros"];
const HUB_NAMES = ["Hub Madrid", "Hub Valencia"];
const SECTOR_NAMES = ["Retail", "Vino", "Logística"];
const YEARS = [2025, 2026];
const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

function mulberry32(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateRetailRows(rand) {
  const rows = [];
  for (const year of YEARS) {
    for (let month = 0; month < 12; month++) {
      for (const store of STORE_NAMES) {
        const clientesAntiguos = Math.round(150 + rand() * 150);
        const clientesNuevos = Math.round(40 + rand() * 120);
        const ticketMedioAntiguos = Number((80 + rand() * 60).toFixed(1));
        const ticketMedioNuevos = Number((90 + rand() * 80).toFixed(1));
        const tasaConversion = Number((1 + rand() * 9).toFixed(2));
        const ingresos = Number(
          (clientesAntiguos * ticketMedioAntiguos + clientesNuevos * ticketMedioNuevos).toFixed(2)
        );
        rows.push({
          year, month, monthName: MONTH_NAMES[month], store,
          clientesAntiguos, clientesNuevos,
          ticketMedioAntiguos, ticketMedioNuevos,
          tasaConversion, ingresos
        });
      }
    }
  }
  return rows;
}

function generateVinoRows(rand) {
  const rows = [];
  for (const year of YEARS) {
    for (let month = 0; month < 12; month++) {
      for (const store of WINERY_NAMES) {
        const trazabilidad = Number((60 + rand() * 40).toFixed(1));
        const botellasVendidas = Math.round(800 + rand() * 2200);
        const precioMedio = Number((8 + rand() * 12).toFixed(2));
        const produccionLitros = Math.round(1000 + rand() * 4000);
        const ingresos = Number((botellasVendidas * precioMedio).toFixed(2));
        rows.push({
          year, month, monthName: MONTH_NAMES[month], store,
          trazabilidad, botellasVendidas, produccionLitros, ingresos
        });
      }
    }
  }
  return rows;
}

function generateLogisticaRows(rand) {
  const rows = [];
  for (const year of YEARS) {
    for (let month = 0; month < 12; month++) {
      for (const store of HUB_NAMES) {
        const enviosGestionados = Math.round(2000 + rand() * 6000);
        const tiempoMedioEntrega = Number((18 + rand() * 30).toFixed(1));
        const trazabilidad = Number((70 + rand() * 30).toFixed(1));
        const incidencias = Number((0.5 + rand() * 4.5).toFixed(2));
        rows.push({
          year, month, monthName: MONTH_NAMES[month], store,
          enviosGestionados, tiempoMedioEntrega, trazabilidad, incidencias
        });
      }
    }
  }
  return rows;
}

function generateDataset(seed) {
  const rand = mulberry32(seed);
  return {
    retail: generateRetailRows(rand),
    vino: generateVinoRows(rand),
    logistica: generateLogisticaRows(rand)
  };
}

function getFilteredData(rows, filters) {
  return rows.filter(function (row) {
    return (filters.year === "Todas" || row.year === filters.year) &&
      (filters.month === "Todas" || row.month === filters.month) &&
      (filters.store === "Todas" || row.store === filters.store);
  });
}

function aggregateByMonth(rows) {
  const map = new Map();
  rows.forEach(function (row) {
    const key = row.year + "-" + row.month;
    if (!map.has(key)) {
      map.set(key, {
        year: row.year, month: row.month, monthName: row.monthName,
        clientesNuevos: 0, clientesAntiguos: 0, ingresos: 0,
        ticketNuevosSum: 0, ticketAntiguosSum: 0, count: 0
      });
    }
    const acc = map.get(key);
    acc.clientesNuevos += row.clientesNuevos;
    acc.clientesAntiguos += row.clientesAntiguos;
    acc.ingresos += row.ingresos;
    acc.ticketNuevosSum += row.ticketMedioNuevos;
    acc.ticketAntiguosSum += row.ticketMedioAntiguos;
    acc.count += 1;
  });
  return Array.from(map.values())
    .sort(function (a, b) { return a.year - b.year || a.month - b.month; })
    .map(function (acc) {
      const totalClientes = acc.clientesNuevos + acc.clientesAntiguos;
      return {
        year: acc.year,
        month: acc.month,
        monthName: acc.monthName,
        clientesNuevos: acc.clientesNuevos,
        clientesAntiguos: acc.clientesAntiguos,
        ingresos: Number(acc.ingresos.toFixed(2)),
        ticketMedioNuevos: Number((acc.ticketNuevosSum / acc.count).toFixed(1)),
        ticketMedioAntiguos: Number((acc.ticketAntiguosSum / acc.count).toFixed(1)),
        tasaAdquisicion: totalClientes > 0
          ? Number(((acc.clientesNuevos / totalClientes) * 100).toFixed(2))
          : 0
      };
    });
}

function aggregateByStore(rows) {
  const map = new Map();
  rows.forEach(function (row) {
    map.set(row.store, (map.get(row.store) || 0) + row.ingresos);
  });
  return Array.from(map.entries()).map(function (entry) {
    return { store: entry[0], ingresos: Number(entry[1].toFixed(2)) };
  });
}

function aggregateByStoreField(rows, field) {
  const map = new Map();
  rows.forEach(function (row) {
    map.set(row.store, (map.get(row.store) || 0) + row[field]);
  });
  return Array.from(map.entries()).map(function (entry) {
    return { store: entry[0], value: Number(entry[1].toFixed(2)) };
  });
}

function computeKPIs(rows) {
  if (rows.length === 0) {
    return { ingresos: 0, clientes: 0, ticketMedio: 0, tasaConversion: 0 };
  }
  const ingresos = rows.reduce(function (sum, row) { return sum + row.ingresos; }, 0);
  const clientes = rows.reduce(function (sum, row) {
    return sum + row.clientesNuevos + row.clientesAntiguos;
  }, 0);
  const ticketWeightedSum = rows.reduce(function (sum, row) {
    return sum + row.ticketMedioNuevos * row.clientesNuevos + row.ticketMedioAntiguos * row.clientesAntiguos;
  }, 0);
  const tasaConversion = rows.reduce(function (sum, row) { return sum + row.tasaConversion; }, 0) / rows.length;
  return {
    ingresos: Number(ingresos.toFixed(2)),
    clientes,
    ticketMedio: clientes > 0 ? Number((ticketWeightedSum / clientes).toFixed(1)) : 0,
    tasaConversion: Number(tasaConversion.toFixed(2))
  };
}

function aggregateVinoByMonth(rows) {
  const map = new Map();
  rows.forEach(function (row) {
    const key = row.year + "-" + row.month;
    if (!map.has(key)) {
      map.set(key, {
        year: row.year, month: row.month, monthName: row.monthName,
        botellasVendidas: 0, ingresos: 0, produccionLitros: 0,
        trazabilidadSum: 0, count: 0
      });
    }
    const acc = map.get(key);
    acc.botellasVendidas += row.botellasVendidas;
    acc.ingresos += row.ingresos;
    acc.produccionLitros += row.produccionLitros;
    acc.trazabilidadSum += row.trazabilidad;
    acc.count += 1;
  });
  return Array.from(map.values())
    .sort(function (a, b) { return a.year - b.year || a.month - b.month; })
    .map(function (acc) {
      return {
        year: acc.year,
        month: acc.month,
        monthName: acc.monthName,
        botellasVendidas: acc.botellasVendidas,
        ingresos: Number(acc.ingresos.toFixed(2)),
        produccionLitros: acc.produccionLitros,
        trazabilidad: Number((acc.trazabilidadSum / acc.count).toFixed(1))
      };
    });
}

function computeVinoKPIs(rows) {
  if (rows.length === 0) {
    return { ingresos: 0, trazabilidad: 0, botellasVendidas: 0, produccionLitros: 0 };
  }
  const ingresos = rows.reduce(function (sum, row) { return sum + row.ingresos; }, 0);
  const botellasVendidas = rows.reduce(function (sum, row) { return sum + row.botellasVendidas; }, 0);
  const produccionLitros = rows.reduce(function (sum, row) { return sum + row.produccionLitros; }, 0);
  const trazabilidad = rows.reduce(function (sum, row) { return sum + row.trazabilidad; }, 0) / rows.length;
  return {
    ingresos: Number(ingresos.toFixed(2)),
    trazabilidad: Number(trazabilidad.toFixed(1)),
    botellasVendidas,
    produccionLitros
  };
}

function aggregateLogisticaByMonth(rows) {
  const map = new Map();
  rows.forEach(function (row) {
    const key = row.year + "-" + row.month;
    if (!map.has(key)) {
      map.set(key, {
        year: row.year, month: row.month, monthName: row.monthName,
        enviosGestionados: 0, tiempoMedioEntregaSum: 0,
        trazabilidadSum: 0, incidenciasSum: 0, count: 0
      });
    }
    const acc = map.get(key);
    acc.enviosGestionados += row.enviosGestionados;
    acc.tiempoMedioEntregaSum += row.tiempoMedioEntrega;
    acc.trazabilidadSum += row.trazabilidad;
    acc.incidenciasSum += row.incidencias;
    acc.count += 1;
  });
  return Array.from(map.values())
    .sort(function (a, b) { return a.year - b.year || a.month - b.month; })
    .map(function (acc) {
      return {
        year: acc.year,
        month: acc.month,
        monthName: acc.monthName,
        enviosGestionados: acc.enviosGestionados,
        tiempoMedioEntrega: Number((acc.tiempoMedioEntregaSum / acc.count).toFixed(1)),
        trazabilidad: Number((acc.trazabilidadSum / acc.count).toFixed(1)),
        incidencias: Number((acc.incidenciasSum / acc.count).toFixed(2))
      };
    });
}

function computeLogisticaKPIs(rows) {
  if (rows.length === 0) {
    return { enviosGestionados: 0, tiempoMedioEntrega: 0, trazabilidad: 0, incidencias: 0 };
  }
  const enviosGestionados = rows.reduce(function (sum, row) { return sum + row.enviosGestionados; }, 0);
  const tiempoMedioEntrega = rows.reduce(function (sum, row) { return sum + row.tiempoMedioEntrega; }, 0) / rows.length;
  const trazabilidad = rows.reduce(function (sum, row) { return sum + row.trazabilidad; }, 0) / rows.length;
  const incidencias = rows.reduce(function (sum, row) { return sum + row.incidencias; }, 0) / rows.length;
  return {
    enviosGestionados,
    tiempoMedioEntrega: Number(tiempoMedioEntrega.toFixed(1)),
    trazabilidad: Number(trazabilidad.toFixed(1)),
    incidencias: Number(incidencias.toFixed(2))
  };
}

const DemoData = {
  STORE_NAMES, WINERY_NAMES, HUB_NAMES, SECTOR_NAMES, YEARS, MONTH_NAMES,
  mulberry32, generateDataset, getFilteredData,
  aggregateByMonth, aggregateByStore, computeKPIs,
  aggregateVinoByMonth, computeVinoKPIs,
  aggregateLogisticaByMonth, computeLogisticaKPIs, aggregateByStoreField
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = DemoData;
} else {
  window.DemoData = DemoData;
}
