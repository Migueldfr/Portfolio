let dataset = [];
const charts = {};

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

  yearSelect.innerHTML = ["Todas"].concat(DemoData.YEARS).map(function (year) {
    return '<option value="' + year + '">' + year + "</option>";
  }).join("");

  monthSelect.innerHTML = ['<option value="Todas">Todas</option>'].concat(
    DemoData.MONTH_NAMES.map(function (name, index) {
      return '<option value="' + index + '">' + name + "</option>";
    })
  ).join("");

  storeSelect.innerHTML = ["Todas"].concat(DemoData.STORE_NAMES).map(function (store) {
    return '<option value="' + store + '">' + store + "</option>";
  }).join("");
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

function renderKPIs(rows) {
  const kpis = DemoData.computeKPIs(rows);
  document.getElementById("kpi-ingresos").textContent = formatNumber(kpis.ingresos) + " €";
  document.getElementById("kpi-clientes").textContent = formatNumber(kpis.clientes);
  document.getElementById("kpi-ticket").textContent = formatNumber(kpis.ticketMedio) + " €";
  document.getElementById("kpi-conversion").textContent = formatDecimal(kpis.tasaConversion, 2) + " %";
}

function renderCharts(rows) {
  const monthly = DemoData.aggregateByMonth(rows);
  const byStore = DemoData.aggregateByStore(rows);
  const labels = monthly.map(function (m) { return m.monthName + " " + m.year; });

  charts.clientes.data.labels = labels;
  charts.clientes.data.datasets[0].data = monthly.map(function (m) { return m.clientesAntiguos; });
  charts.clientes.data.datasets[1].data = monthly.map(function (m) { return m.clientesNuevos; });
  charts.clientes.data.datasets[2].data = monthly.map(function (m) { return m.tasaAdquisicion; });
  charts.clientes.update();

  charts.mixTienda.data.labels = byStore.map(function (s) { return s.store; });
  charts.mixTienda.data.datasets[0].data = byStore.map(function (s) { return s.ingresos; });
  charts.mixTienda.update();

  charts.ticket.data.labels = labels;
  charts.ticket.data.datasets[0].data = monthly.map(function (m) { return m.ticketMedioAntiguos; });
  charts.ticket.data.datasets[1].data = monthly.map(function (m) { return m.ticketMedioNuevos; });
  charts.ticket.update();
}

function renderTable(rows) {
  const monthly = DemoData.aggregateByMonth(rows);
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = monthly.map(function (m) {
    return "<tr>" +
      "<td>" + m.monthName + " " + m.year + "</td>" +
      "<td>" + formatNumber(m.clientesNuevos) + "</td>" +
      "<td>" + formatNumber(m.clientesAntiguos) + "</td>" +
      "<td>" + formatDecimal(m.tasaAdquisicion, 2) + " %</td>" +
      "<td>" + formatDecimal(m.ticketMedioNuevos, 2) + "</td>" +
      "<td>" + formatDecimal(m.ticketMedioAntiguos, 2) + "</td>" +
      "<td>" + formatNumber(m.ingresos) + "</td>" +
      "</tr>";
  }).join("");

  const kpis = DemoData.computeKPIs(rows);
  const totalClientesNuevos = monthly.reduce(function (sum, m) { return sum + m.clientesNuevos; }, 0);
  const totalClientesAntiguos = monthly.reduce(function (sum, m) { return sum + m.clientesAntiguos; }, 0);
  document.getElementById("table-total-row").innerHTML =
    "<td>Total</td>" +
    "<td>" + formatNumber(totalClientesNuevos) + "</td>" +
    "<td>" + formatNumber(totalClientesAntiguos) + "</td>" +
    "<td>-</td>" +
    "<td>-</td>" +
    "<td>-</td>" +
    "<td>" + formatNumber(kpis.ingresos) + "</td>";
}

function renderAll() {
  const filters = getSelectedFilters();
  const filtered = DemoData.getFilteredData(dataset, filters);
  renderKPIs(filtered);
  renderCharts(filtered);
  renderTable(filtered);
}

function createCharts() {
  const purple = "#8000ff";
  const blue = "#6bc5f8";
  const amber = "#d98c00";
  const teal = "#16a394";
  const legendColor = "#1c1c2b";

  charts.clientes = new Chart(document.getElementById("chart-clientes"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { type: "bar", label: "Clientes antiguos", data: [], backgroundColor: purple, yAxisID: "y" },
        { type: "bar", label: "Clientes nuevos", data: [], backgroundColor: blue, yAxisID: "y" },
        { type: "line", label: "Tasa adquisición (%)", data: [], borderColor: amber, backgroundColor: amber, yAxisID: "y1", tension: .3 }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, position: "left" },
        y1: { beginAtZero: true, position: "right", grid: { drawOnChartArea: false } }
      },
      plugins: { legend: { labels: { color: legendColor } } }
    }
  });

  charts.mixTienda = new Chart(document.getElementById("chart-mix-tienda"), {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{ data: [], backgroundColor: [purple, blue, amber, teal] }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom", labels: { color: legendColor } } }
    }
  });

  charts.ticket = new Chart(document.getElementById("chart-ticket"), {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Ticket medio antiguos (€)", data: [], borderColor: purple, backgroundColor: purple, tension: .3 },
        { label: "Ticket medio nuevos (€)", data: [], borderColor: blue, backgroundColor: blue, tension: .3 }
      ]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { labels: { color: legendColor } } }
    }
  });
}

function reseed() {
  dataset = DemoData.generateDataset(Date.now());
  renderAll();
}

function init() {
  createCharts();
  dataset = DemoData.generateDataset(Date.now());
  populateFilters();
  renderAll();

  document.getElementById("filter-year").addEventListener("change", renderAll);
  document.getElementById("filter-month").addEventListener("change", renderAll);
  document.getElementById("filter-store").addEventListener("change", renderAll);
  document.getElementById("btn-reseed").addEventListener("click", reseed);
}

window.addEventListener("DOMContentLoaded", init);
