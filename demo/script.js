let dataset = { retail: [], vino: [], logistica: [] };
const charts = {};

const CHART_COLORS = {
  purple: "#8000ff",
  blue: "#6bc5f8",
  amber: "#8f5900",
  teal: "#0d7a6e",
  legend: "#1c1c2b"
};

const SECTOR_CONFIG = {
  Retail: {
    title: "Dashboard Demo — Retail",
    locationLabel: "Tienda",
    locations: function () { return DemoData.STORE_NAMES; },
    getRows: function () { return dataset.retail; },
    chartTitles: [
      "Evolución de Clientes",
      "Ingresos por Tienda",
      "Ticket Medio (Nuevos vs. Antiguos)"
    ],
    kpis: function (rows) {
      const k = DemoData.computeKPIs(rows);
      return [
        { label: "Ingresos totales (€)", value: formatNumber(k.ingresos) + " €" },
        { label: "Clientes totales", value: formatNumber(k.clientes) },
        { label: "Ticket medio (€)", value: formatDecimal(k.ticketMedio, 2) + " €" },
        { label: "Tasa de conversión", value: formatDecimal(k.tasaConversion, 2) + " %" }
      ];
    },
    tableColumns: [
      "Mes", "Clientes Nuevos", "Clientes Antiguos", "Tasa Adquisición",
      "Ticket Nuevos (€)", "Ticket Antiguos (€)", "Ingresos (€)"
    ],
    tableRows: function (rows) {
      return DemoData.aggregateByMonth(rows).map(function (m) {
        return [
          m.monthName + " " + m.year,
          formatNumber(m.clientesNuevos),
          formatNumber(m.clientesAntiguos),
          formatDecimal(m.tasaAdquisicion, 2) + " %",
          formatDecimal(m.ticketMedioNuevos, 2),
          formatDecimal(m.ticketMedioAntiguos, 2),
          formatNumber(m.ingresos)
        ];
      });
    },
    tableTotal: function (rows) {
      const monthly = DemoData.aggregateByMonth(rows);
      const kpis = DemoData.computeKPIs(rows);
      const totalClientesNuevos = monthly.reduce(function (sum, m) { return sum + m.clientesNuevos; }, 0);
      const totalClientesAntiguos = monthly.reduce(function (sum, m) { return sum + m.clientesAntiguos; }, 0);
      return [
        "Total", formatNumber(totalClientesNuevos), formatNumber(totalClientesAntiguos),
        "-", "-", "-", formatNumber(kpis.ingresos)
      ];
    },
    buildCharts: function () {
      charts.chart1 = new Chart(document.getElementById("chart-clientes"), {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            { type: "bar", label: "Clientes antiguos", data: [], backgroundColor: CHART_COLORS.purple, yAxisID: "y" },
            { type: "bar", label: "Clientes nuevos", data: [], backgroundColor: CHART_COLORS.blue, yAxisID: "y" },
            { type: "line", label: "Tasa adquisición (%)", data: [], borderColor: CHART_COLORS.amber, backgroundColor: CHART_COLORS.amber, yAxisID: "y1", tension: .3 }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, position: "left" },
            y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false } }
          },
          plugins: { legend: { labels: { color: CHART_COLORS.legend } } }
        }
      });

      charts.chart2 = new Chart(document.getElementById("chart-mix-tienda"), {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [{ data: [], backgroundColor: [CHART_COLORS.purple, CHART_COLORS.blue, CHART_COLORS.amber, CHART_COLORS.teal] }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom", labels: { color: CHART_COLORS.legend } } }
        }
      });

      charts.chart3 = new Chart(document.getElementById("chart-ticket"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            { label: "Ticket medio antiguos (€)", data: [], borderColor: CHART_COLORS.purple, backgroundColor: CHART_COLORS.purple, tension: .3 },
            { label: "Ticket medio nuevos (€)", data: [], borderColor: CHART_COLORS.blue, backgroundColor: CHART_COLORS.blue, tension: .3 }
          ]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { labels: { color: CHART_COLORS.legend } } }
        }
      });
    },
    updateCharts: function (rows) {
      const monthly = DemoData.aggregateByMonth(rows);
      const byStore = DemoData.aggregateByStore(rows);
      const labels = monthly.map(function (m) { return m.monthName + " " + m.year; });

      charts.chart1.data.labels = labels;
      charts.chart1.data.datasets[0].data = monthly.map(function (m) { return m.clientesAntiguos; });
      charts.chart1.data.datasets[1].data = monthly.map(function (m) { return m.clientesNuevos; });
      charts.chart1.data.datasets[2].data = monthly.map(function (m) { return m.tasaAdquisicion; });
      charts.chart1.update();

      charts.chart2.data.labels = byStore.map(function (s) { return s.store; });
      charts.chart2.data.datasets[0].data = byStore.map(function (s) { return s.ingresos; });
      charts.chart2.update();

      charts.chart3.data.labels = labels;
      charts.chart3.data.datasets[0].data = monthly.map(function (m) { return m.ticketMedioAntiguos; });
      charts.chart3.data.datasets[1].data = monthly.map(function (m) { return m.ticketMedioNuevos; });
      charts.chart3.update();
    }
  },

  Vino: {
    title: "Dashboard Demo — Vino",
    locationLabel: "Bodega",
    locations: function () { return DemoData.WINERY_NAMES; },
    getRows: function () { return dataset.vino; },
    chartTitles: [
      "Evolución de Trazabilidad y Botellas Vendidas",
      "Ingresos por Bodega",
      "Producción (L) vs. Botellas Vendidas"
    ],
    kpis: function (rows) {
      const k = DemoData.computeVinoKPIs(rows);
      return [
        { label: "Trazabilidad de lote", value: formatDecimal(k.trazabilidad, 1) + " %" },
        { label: "Ingresos totales (€)", value: formatNumber(k.ingresos) + " €" },
        { label: "Botellas vendidas", value: formatNumber(k.botellasVendidas) },
        { label: "Producción (L)", value: formatNumber(k.produccionLitros) }
      ];
    },
    tableColumns: ["Mes", "Trazabilidad", "Botellas Vendidas", "Producción (L)", "Ingresos (€)"],
    tableRows: function (rows) {
      return DemoData.aggregateVinoByMonth(rows).map(function (m) {
        return [
          m.monthName + " " + m.year,
          formatDecimal(m.trazabilidad, 1) + " %",
          formatNumber(m.botellasVendidas),
          formatNumber(m.produccionLitros),
          formatNumber(m.ingresos)
        ];
      });
    },
    tableTotal: function (rows) {
      const monthly = DemoData.aggregateVinoByMonth(rows);
      const kpis = DemoData.computeVinoKPIs(rows);
      const totalBotellas = monthly.reduce(function (sum, m) { return sum + m.botellasVendidas; }, 0);
      const totalProduccion = monthly.reduce(function (sum, m) { return sum + m.produccionLitros; }, 0);
      return [
        "Total", formatDecimal(kpis.trazabilidad, 1) + " %",
        formatNumber(totalBotellas), formatNumber(totalProduccion), formatNumber(kpis.ingresos)
      ];
    },
    buildCharts: function () {
      charts.chart1 = new Chart(document.getElementById("chart-clientes"), {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            { type: "bar", label: "Botellas vendidas", data: [], backgroundColor: CHART_COLORS.blue, yAxisID: "y" },
            { type: "line", label: "Trazabilidad (%)", data: [], borderColor: CHART_COLORS.amber, backgroundColor: CHART_COLORS.amber, yAxisID: "y1", tension: .3 }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, position: "left" },
            y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, max: 100 }
          },
          plugins: { legend: { labels: { color: CHART_COLORS.legend } } }
        }
      });

      charts.chart2 = new Chart(document.getElementById("chart-mix-tienda"), {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [{ data: [], backgroundColor: [CHART_COLORS.purple, CHART_COLORS.teal, CHART_COLORS.blue, CHART_COLORS.amber] }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom", labels: { color: CHART_COLORS.legend } } }
        }
      });

      charts.chart3 = new Chart(document.getElementById("chart-ticket"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            { label: "Producción (L)", data: [], borderColor: CHART_COLORS.teal, backgroundColor: CHART_COLORS.teal, tension: .3 },
            { label: "Botellas vendidas", data: [], borderColor: CHART_COLORS.purple, backgroundColor: CHART_COLORS.purple, tension: .3 }
          ]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { labels: { color: CHART_COLORS.legend } } }
        }
      });
    },
    updateCharts: function (rows) {
      const monthly = DemoData.aggregateVinoByMonth(rows);
      const byBodega = DemoData.aggregateByStore(rows);
      const labels = monthly.map(function (m) { return m.monthName + " " + m.year; });

      charts.chart1.data.labels = labels;
      charts.chart1.data.datasets[0].data = monthly.map(function (m) { return m.botellasVendidas; });
      charts.chart1.data.datasets[1].data = monthly.map(function (m) { return m.trazabilidad; });
      charts.chart1.update();

      charts.chart2.data.labels = byBodega.map(function (s) { return s.store; });
      charts.chart2.data.datasets[0].data = byBodega.map(function (s) { return s.ingresos; });
      charts.chart2.update();

      charts.chart3.data.labels = labels;
      charts.chart3.data.datasets[0].data = monthly.map(function (m) { return m.produccionLitros; });
      charts.chart3.data.datasets[1].data = monthly.map(function (m) { return m.botellasVendidas; });
      charts.chart3.update();
    }
  },

  "Logística": {
    title: "Dashboard Demo — Logística",
    locationLabel: "Centro",
    locations: function () { return DemoData.HUB_NAMES; },
    getRows: function () { return dataset.logistica; },
    chartTitles: [
      "Envíos Gestionados y Trazabilidad",
      "Envíos por Centro",
      "Tiempo de Entrega vs. Incidencias"
    ],
    kpis: function (rows) {
      const k = DemoData.computeLogisticaKPIs(rows);
      return [
        { label: "Envíos gestionados", value: formatNumber(k.enviosGestionados) },
        { label: "Tiempo medio de entrega (h)", value: formatDecimal(k.tiempoMedioEntrega, 1) },
        { label: "Trazabilidad de envío", value: formatDecimal(k.trazabilidad, 1) + " %" },
        { label: "Incidencias", value: formatDecimal(k.incidencias, 2) + " %" }
      ];
    },
    tableColumns: ["Mes", "Envíos Gestionados", "Trazabilidad", "Tiempo Entrega (h)", "Incidencias (%)"],
    tableRows: function (rows) {
      return DemoData.aggregateLogisticaByMonth(rows).map(function (m) {
        return [
          m.monthName + " " + m.year,
          formatNumber(m.enviosGestionados),
          formatDecimal(m.trazabilidad, 1) + " %",
          formatDecimal(m.tiempoMedioEntrega, 1),
          formatDecimal(m.incidencias, 2) + " %"
        ];
      });
    },
    tableTotal: function (rows) {
      const monthly = DemoData.aggregateLogisticaByMonth(rows);
      const kpis = DemoData.computeLogisticaKPIs(rows);
      const totalEnvios = monthly.reduce(function (sum, m) { return sum + m.enviosGestionados; }, 0);
      return [
        "Total", formatNumber(totalEnvios), formatDecimal(kpis.trazabilidad, 1) + " %",
        formatDecimal(kpis.tiempoMedioEntrega, 1), formatDecimal(kpis.incidencias, 2) + " %"
      ];
    },
    buildCharts: function () {
      charts.chart1 = new Chart(document.getElementById("chart-clientes"), {
        type: "bar",
        data: {
          labels: [],
          datasets: [
            { type: "bar", label: "Envíos gestionados", data: [], backgroundColor: CHART_COLORS.blue, yAxisID: "y" },
            { type: "line", label: "Trazabilidad (%)", data: [], borderColor: CHART_COLORS.teal, backgroundColor: CHART_COLORS.teal, yAxisID: "y1", tension: .3 }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true, position: "left" },
            y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false }, max: 100 }
          },
          plugins: { legend: { labels: { color: CHART_COLORS.legend } } }
        }
      });

      charts.chart2 = new Chart(document.getElementById("chart-mix-tienda"), {
        type: "doughnut",
        data: {
          labels: [],
          datasets: [{ data: [], backgroundColor: [CHART_COLORS.blue, CHART_COLORS.purple, CHART_COLORS.amber, CHART_COLORS.teal] }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: "bottom", labels: { color: CHART_COLORS.legend } } }
        }
      });

      charts.chart3 = new Chart(document.getElementById("chart-ticket"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            { label: "Tiempo medio de entrega (h)", data: [], borderColor: CHART_COLORS.amber, backgroundColor: CHART_COLORS.amber, tension: .3 },
            { label: "Incidencias (%)", data: [], borderColor: CHART_COLORS.purple, backgroundColor: CHART_COLORS.purple, tension: .3 }
          ]
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { labels: { color: CHART_COLORS.legend } } }
        }
      });
    },
    updateCharts: function (rows) {
      const monthly = DemoData.aggregateLogisticaByMonth(rows);
      const byHub = DemoData.aggregateByStoreField(rows, "enviosGestionados");
      const labels = monthly.map(function (m) { return m.monthName + " " + m.year; });

      charts.chart1.data.labels = labels;
      charts.chart1.data.datasets[0].data = monthly.map(function (m) { return m.enviosGestionados; });
      charts.chart1.data.datasets[1].data = monthly.map(function (m) { return m.trazabilidad; });
      charts.chart1.update();

      charts.chart2.data.labels = byHub.map(function (s) { return s.store; });
      charts.chart2.data.datasets[0].data = byHub.map(function (s) { return s.value; });
      charts.chart2.update();

      charts.chart3.data.labels = labels;
      charts.chart3.data.datasets[0].data = monthly.map(function (m) { return m.tiempoMedioEntrega; });
      charts.chart3.data.datasets[1].data = monthly.map(function (m) { return m.incidencias; });
      charts.chart3.update();
    }
  }
};

function currentSector() {
  return document.getElementById("filter-sector").value;
}

function getSelectedFilters() {
  const yearValue = document.getElementById("filter-year").value;
  const monthValue = document.getElementById("filter-month").value;
  const storeValue = document.getElementById("filter-store").value;
  return {
    year: yearValue === "Todas" ? "Todas" : Number(yearValue),
    month: monthValue === "Todas" ? "Todas" : Number(monthValue),
    store: storeValue
  };
}

function populateFilters() {
  const yearSelect = document.getElementById("filter-year");
  const monthSelect = document.getElementById("filter-month");
  const storeSelect = document.getElementById("filter-store");
  const config = SECTOR_CONFIG[currentSector()];

  yearSelect.innerHTML = ["Todas"].concat(DemoData.YEARS).map(function (year) {
    return '<option value="' + year + '">' + year + "</option>";
  }).join("");

  monthSelect.innerHTML = ['<option value="Todas">Todas</option>'].concat(
    DemoData.MONTH_NAMES.map(function (name, index) {
      return '<option value="' + index + '">' + name + "</option>";
    })
  ).join("");

  storeSelect.innerHTML = ["Todas"].concat(config.locations()).map(function (location) {
    return '<option value="' + location + '">' + location + "</option>";
  }).join("");

  document.getElementById("filter-store-label").textContent = config.locationLabel;
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

function formatDecimal(value, digits) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function renderKPIs(config, rows) {
  config.kpis(rows).forEach(function (kpi, index) {
    document.getElementById("kpi-value-" + (index + 1)).textContent = kpi.value;
    document.getElementById("kpi-label-" + (index + 1)).textContent = kpi.label;
  });
}

function renderChartTitles(config) {
  config.chartTitles.forEach(function (title, index) {
    document.getElementById("chart-title-" + (index + 1)).textContent = title;
  });
}

function renderTable(config, rows) {
  document.getElementById("table-head-row").innerHTML = config.tableColumns.map(function (col) {
    return "<th>" + col + "</th>";
  }).join("");

  document.getElementById("table-body").innerHTML = config.tableRows(rows).map(function (cells) {
    return "<tr>" + cells.map(function (cell) { return "<td>" + cell + "</td>"; }).join("") + "</tr>";
  }).join("");

  document.getElementById("table-total-row").innerHTML = config.tableTotal(rows).map(function (cell) {
    return "<td>" + cell + "</td>";
  }).join("");
}

function renderAll() {
  const config = SECTOR_CONFIG[currentSector()];
  const filters = getSelectedFilters();
  const filtered = DemoData.getFilteredData(config.getRows(), filters);

  document.getElementById("demo-title").textContent = config.title;
  renderKPIs(config, filtered);
  renderChartTitles(config);
  config.updateCharts(filtered);
  renderTable(config, filtered);
}

function destroyCharts() {
  Object.keys(charts).forEach(function (key) {
    charts[key].destroy();
    delete charts[key];
  });
}

function withFadeTransition(updateFn) {
  const content = document.getElementById("demo-content");
  content.classList.add("is-updating");
  setTimeout(function () {
    updateFn();
    content.classList.remove("is-updating");
  }, 200);
}

function onSectorChange() {
  withFadeTransition(function () {
    destroyCharts();
    SECTOR_CONFIG[currentSector()].buildCharts();
    populateFilters();
    renderAll();
  });
}

function reseed() {
  withFadeTransition(function () {
    dataset = DemoData.generateDataset(Date.now());
    renderAll();
  });
}

function init() {
  SECTOR_CONFIG[currentSector()].buildCharts();
  dataset = DemoData.generateDataset(Date.now());
  populateFilters();
  renderAll();

  document.getElementById("filter-sector").addEventListener("change", onSectorChange);
  document.getElementById("filter-year").addEventListener("change", renderAll);
  document.getElementById("filter-month").addEventListener("change", renderAll);
  document.getElementById("filter-store").addEventListener("change", renderAll);
  document.getElementById("btn-reseed").addEventListener("click", reseed);
}

window.addEventListener("DOMContentLoaded", init);
