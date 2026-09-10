# Dashboard Demo Interactivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a standalone, interactive demo dashboard (fictional retail data) to the portfolio, linked from a new project card, so any visitor can filter/regenerate data and see the kind of Power BI–style reporting the author builds.

**Architecture:** A new self-contained static page (`demo-dashboard.html` + `demo-dashboard.css` + `demo-dashboard.js`) rendered with Chart.js (CDN), backed by a pure, seed-based fake-data module (`demo-dashboard-data.js`) that is dual-loadable (browser `<script>` global and Node `require()` for tests). No backend, no build step, no bundler — matches the rest of the site (`index.html` + `main.js` + `style.css`). A new project card in `index.html#projects` links to it.

**Tech Stack:** Vanilla HTML/CSS/JS, Chart.js 4.4.4 via jsdelivr CDN, Node's built-in `node:test` + `node:assert/strict` for the pure data-logic tests (no npm dependency needed — repo has Node 24 available).

**Spec:** `docs/superpowers/specs/2026-09-10-demo-dashboard-design.md`

## Global Constraints

- No build step / no bundler / no frameworks — plain `<script>` tags and global functions, matching `main.js`'s existing style.
- The demo page's dark theme is fixed and independent of the portfolio's light/dark toggle (`visualmode()` in `main.js`) — do not wire it up to that toggle.
- Chart.js is loaded from `https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js`, pinned to that exact version with a Subresource Integrity hash (`sha384-NrKB+u6Ts6AtkIhwPixiKTzgSKNblyhlk0Sohlgar9UHUBzai/sgnNNWWd291xqt`) and `crossorigin="anonymous"` — not vendored locally (accepted risk, see spec's "Manejo de errores").
- No persistence (no localStorage, no backend) — every page load / "Generar nuevo escenario" click produces a fresh seeded dataset.
- Brand accent colors reused from `style.css`: purple `#8000ff`, light blue `#6bc5f8` (plus a new amber `#ffb020` and teal `#2dd4bf` for chart variety).
- `index.html` changes are additive only: one new project card; no restructuring of the existing `#projects` markup.

---

### Task 1: Fake-data engine (`demo-dashboard-data.js`) with automated tests

**Files:**
- Create: `demo-dashboard-data.js`
- Create: `demo-dashboard-data.test.js`

**Interfaces:**
- Produces (consumed by Task 3's `demo-dashboard.js` as `window.DemoData`, and by this task's own test file as a CommonJS export):
  - `DemoData.STORE_NAMES: string[]` — `["Tienda Centro", "Tienda Norte", "Tienda Sur", "Tienda Este"]`
  - `DemoData.YEARS: number[]` — `[2025, 2026]`
  - `DemoData.MONTH_NAMES: string[]` — 12 lowercase Spanish month names, `"enero"`..`"diciembre"`
  - `DemoData.mulberry32(seed: number): () => number` — returns a deterministic PRNG function producing values in `[0, 1)`
  - `DemoData.generateDataset(seed: number): Row[]` where `Row = { year, month, monthName, store, clientesAntiguos, clientesNuevos, ticketMedioAntiguos, ticketMedioNuevos, tasaConversion, ingresos }`
  - `DemoData.getFilteredData(rows: Row[], filters: { year: number | "Todas", month: number | "Todas", store: string }): Row[]`
  - `DemoData.aggregateByMonth(rows: Row[]): MonthAgg[]` where `MonthAgg = { year, month, monthName, clientesNuevos, clientesAntiguos, ingresos, ticketMedioNuevos, ticketMedioAntiguos, tasaAdquisicion }`, sorted chronologically
  - `DemoData.aggregateByStore(rows: Row[]): { store: string, ingresos: number }[]`
  - `DemoData.computeKPIs(rows: Row[]): { ingresos: number, clientes: number, ticketMedio: number, tasaConversion: number }`

- [ ] **Step 1: Write the failing test file**

Create `demo-dashboard-data.test.js`:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mulberry32, generateDataset, getFilteredData,
  aggregateByMonth, aggregateByStore, computeKPIs,
  STORE_NAMES, YEARS
} = require("./demo-dashboard-data.js");

test("mulberry32 is deterministic for a given seed", () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const seqA = [a(), a(), a()];
  const seqB = [b(), b(), b()];
  assert.deepEqual(seqA, seqB);
});

test("mulberry32 produces values within [0, 1)", () => {
  const rand = mulberry32(7);
  for (let i = 0; i < 100; i++) {
    const value = rand();
    assert.ok(value >= 0 && value < 1);
  }
});

test("generateDataset produces one row per year/month/store combination", () => {
  const rows = generateDataset(1);
  assert.equal(rows.length, YEARS.length * 12 * STORE_NAMES.length);
});

test("generateDataset is deterministic for the same seed", () => {
  const rowsA = generateDataset(123);
  const rowsB = generateDataset(123);
  assert.deepEqual(rowsA, rowsB);
});

test("generateDataset produces different data for different seeds", () => {
  const rowsA = generateDataset(1);
  const rowsB = generateDataset(2);
  assert.notDeepEqual(rowsA, rowsB);
});

test("getFilteredData filters by year, month and store", () => {
  const rows = generateDataset(1);
  const filtered = getFilteredData(rows, { year: 2025, month: 0, store: STORE_NAMES[0] });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].year, 2025);
  assert.equal(filtered[0].month, 0);
  assert.equal(filtered[0].store, STORE_NAMES[0]);
});

test("getFilteredData with all 'Todas' returns every row", () => {
  const rows = generateDataset(1);
  const filtered = getFilteredData(rows, { year: "Todas", month: "Todas", store: "Todas" });
  assert.equal(filtered.length, rows.length);
});

test("aggregateByMonth collapses stores into one row per year/month, sorted chronologically", () => {
  const rows = generateDataset(1);
  const monthly = aggregateByMonth(rows);
  assert.equal(monthly.length, YEARS.length * 12);
  for (let i = 1; i < monthly.length; i++) {
    const prev = monthly[i - 1];
    const curr = monthly[i];
    assert.ok(curr.year > prev.year || (curr.year === prev.year && curr.month > prev.month));
  }
});

test("aggregateByStore returns one entry per store with summed revenue", () => {
  const rows = generateDataset(1);
  const byStore = aggregateByStore(rows);
  assert.equal(byStore.length, STORE_NAMES.length);
  const totalFromStores = byStore.reduce((sum, s) => sum + s.ingresos, 0);
  const totalFromRows = rows.reduce((sum, r) => sum + r.ingresos, 0);
  assert.ok(Math.abs(totalFromStores - totalFromRows) < 0.01);
});

test("computeKPIs returns zeroed KPIs for an empty dataset", () => {
  const kpis = computeKPIs([]);
  assert.deepEqual(kpis, { ingresos: 0, clientes: 0, ticketMedio: 0, tasaConversion: 0 });
});

test("computeKPIs aggregates revenue and client counts across rows", () => {
  const rows = generateDataset(1);
  const kpis = computeKPIs(rows);
  const expectedIngresos = rows.reduce((sum, r) => sum + r.ingresos, 0);
  const expectedClientes = rows.reduce((sum, r) => sum + r.clientesNuevos + r.clientesAntiguos, 0);
  assert.ok(Math.abs(kpis.ingresos - expectedIngresos) < 0.01);
  assert.equal(kpis.clientes, expectedClientes);
});
```

- [ ] **Step 2: Run the test file to confirm it fails**

Run: `node --test demo-dashboard-data.test.js`
Expected: fails with a `Cannot find module './demo-dashboard-data.js'` error (the module doesn't exist yet).

- [ ] **Step 3: Implement `demo-dashboard-data.js`**

Create `demo-dashboard-data.js`:

```js
const STORE_NAMES = ["Tienda Centro", "Tienda Norte", "Tienda Sur", "Tienda Este"];
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

function generateDataset(seed) {
  const rand = mulberry32(seed);
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

const DemoData = {
  STORE_NAMES, YEARS, MONTH_NAMES,
  mulberry32, generateDataset, getFilteredData,
  aggregateByMonth, aggregateByStore, computeKPIs
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = DemoData;
} else {
  window.DemoData = DemoData;
}
```

- [ ] **Step 4: Run the tests again to confirm they pass**

Run: `node --test demo-dashboard-data.test.js`
Expected: all 11 tests pass, 0 failures.

- [ ] **Step 5: Commit**

```bash
git add demo-dashboard-data.js demo-dashboard-data.test.js
git commit -m "feat: add seeded fake-data engine for demo dashboard"
```

---

### Task 2: Demo dashboard page structure and dark theme (`demo-dashboard.html` + `demo-dashboard.css`)

**Files:**
- Create: `demo-dashboard.html`
- Create: `demo-dashboard.css`

**Interfaces:**
- Consumes: none (pure structure/style task; Chart.js and `demo-dashboard-data.js`/`demo-dashboard.js` are wired in Task 3).
- Produces (DOM element IDs that Task 3's `demo-dashboard.js` will query):
  - Filters: `#filter-year`, `#filter-month`, `#filter-store` (all `<select>`), `#btn-reseed` (`<button>`)
  - KPIs: `#kpi-ingresos`, `#kpi-clientes`, `#kpi-ticket`, `#kpi-conversion` (all `<span>`)
  - Charts: `#chart-clientes`, `#chart-mix-tienda`, `#chart-ticket` (all `<canvas>`)
  - Table: `#table-body` (`<tbody>`), `#table-total-row` (`<tr>`)

- [ ] **Step 1: Create `demo-dashboard.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow" />
    <meta name="description" content="Dashboard demo interactivo con datos 100% simulados, construido por Miguel de Frutos Revilla para mostrar el tipo de informes Power BI / BI que desarrolla." />
    <title>Dashboard Demo (datos simulados) | Miguel de Frutos Revilla</title>
    <link rel="icon" type="image/x-icon" href="src/png/nav-avatar.png" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fira+Code&display=swap" />
    <link rel="stylesheet" href="demo-dashboard.css" />
</head>
<body>
    <header class="demo-header">
        <div class="demo-header-titles">
            <h1>Dashboard Demo — Retail</h1>
            <span class="demo-badge">Datos 100% simulados</span>
        </div>
        <a class="demo-back-link" href="index.html#projects">&larr; Volver al portfolio</a>
    </header>

    <section class="demo-filters" aria-label="Filtros del dashboard">
        <div class="demo-filter">
            <label for="filter-year">Año</label>
            <select id="filter-year"></select>
        </div>
        <div class="demo-filter">
            <label for="filter-month">Mes</label>
            <select id="filter-month"></select>
        </div>
        <div class="demo-filter">
            <label for="filter-store">Tienda</label>
            <select id="filter-store"></select>
        </div>
        <button id="btn-reseed" class="demo-reseed-btn" type="button">🎲 Generar nuevo escenario</button>
    </section>

    <section class="demo-kpis" aria-label="Indicadores clave">
        <div class="demo-kpi-card">
            <span class="demo-kpi-number" id="kpi-ingresos">-</span>
            <span class="demo-kpi-label">Ingresos totales (€)</span>
        </div>
        <div class="demo-kpi-card">
            <span class="demo-kpi-number" id="kpi-clientes">-</span>
            <span class="demo-kpi-label">Clientes totales</span>
        </div>
        <div class="demo-kpi-card">
            <span class="demo-kpi-number" id="kpi-ticket">-</span>
            <span class="demo-kpi-label">Ticket medio (€)</span>
        </div>
        <div class="demo-kpi-card">
            <span class="demo-kpi-number" id="kpi-conversion">-</span>
            <span class="demo-kpi-label">Tasa de conversión</span>
        </div>
    </section>

    <section class="demo-charts" aria-label="Gráficos">
        <div class="demo-chart-box">
            <h2>Evolución de Clientes</h2>
            <canvas id="chart-clientes"></canvas>
        </div>
        <div class="demo-chart-box">
            <h2>Ingresos por Tienda</h2>
            <canvas id="chart-mix-tienda"></canvas>
        </div>
        <div class="demo-chart-box demo-chart-wide">
            <h2>Ticket Medio (Nuevos vs. Antiguos)</h2>
            <canvas id="chart-ticket"></canvas>
        </div>
    </section>

    <section class="demo-table-section" aria-label="Tabla resumen mensual">
        <h2>Resumen mensual</h2>
        <div class="demo-table-wrapper">
            <table class="demo-table">
                <thead>
                    <tr>
                        <th>Mes</th>
                        <th>Clientes Nuevos</th>
                        <th>Clientes Antiguos</th>
                        <th>Tasa Adquisición</th>
                        <th>Ticket Nuevos (€)</th>
                        <th>Ticket Antiguos (€)</th>
                        <th>Ingresos (€)</th>
                    </tr>
                </thead>
                <tbody id="table-body"></tbody>
                <tfoot>
                    <tr id="table-total-row"></tr>
                </tfoot>
            </table>
        </div>
    </section>

    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js" integrity="sha384-NrKB+u6Ts6AtkIhwPixiKTzgSKNblyhlk0Sohlgar9UHUBzai/sgnNNWWd291xqt" crossorigin="anonymous"></script>
    <script src="demo-dashboard-data.js"></script>
    <script src="demo-dashboard.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `demo-dashboard.css`**

```css
:root {
    --demo-bg: #121317;
    --demo-card-bg: #1c1e24;
    --demo-card-border: #2b2e37;
    --demo-text: #f2f2f2;
    --demo-text-muted: #9a9ea8;
    --demo-purple: #8000ff;
    --demo-blue: #6bc5f8;
    --demo-amber: #ffb020;
    --demo-teal: #2dd4bf;
}

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 24px clamp(16px, 4vw, 48px) 48px;
    background: var(--demo-bg);
    color: var(--demo-text);
    font-family: "Fira Code", monospace, sans-serif;
}

.demo-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
}

.demo-header-titles {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.demo-header-titles h1 {
    font-size: 1.4rem;
    margin: 0;
}

.demo-badge {
    font-size: .7rem;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(128, 0, 255, .15);
    color: var(--demo-blue);
    border: 1px solid rgba(107, 197, 248, .4);
}

.demo-back-link {
    color: var(--demo-blue);
    text-decoration: none;
    font-size: .85rem;
}

.demo-back-link:hover {
    text-decoration: underline;
}

.demo-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 16px;
    margin-bottom: 20px;
}

.demo-filter {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.demo-filter label {
    font-size: .7rem;
    color: var(--demo-text-muted);
    text-transform: uppercase;
    letter-spacing: .05em;
}

.demo-filter select {
    background: var(--demo-card-bg);
    color: var(--demo-text);
    border: 1px solid var(--demo-card-border);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: inherit;
    min-width: 140px;
}

.demo-reseed-btn {
    background: linear-gradient(90deg, var(--demo-purple), var(--demo-blue));
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 16px;
    font-family: inherit;
    font-size: .85rem;
    cursor: pointer;
}

.demo-reseed-btn:hover {
    filter: brightness(1.1);
}

.demo-kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 20px;
}

.demo-kpi-card {
    background: var(--demo-card-bg);
    border: 1px solid var(--demo-card-border);
    border-radius: 12px;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.demo-kpi-number {
    font-size: 1.9rem;
    font-weight: 700;
    background-image: linear-gradient(90deg, var(--demo-purple), var(--demo-blue));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.demo-kpi-label {
    font-size: .78rem;
    color: var(--demo-text-muted);
}

.demo-charts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
}

.demo-chart-wide {
    grid-column: 1 / -1;
}

.demo-chart-box {
    background: var(--demo-card-bg);
    border: 1px solid var(--demo-card-border);
    border-radius: 12px;
    padding: 16px;
}

.demo-chart-box h2 {
    font-size: .95rem;
    margin: 0 0 12px;
    color: var(--demo-text-muted);
    font-weight: 500;
}

.demo-chart-box canvas {
    max-height: 320px;
}

.demo-table-section {
    background: var(--demo-card-bg);
    border: 1px solid var(--demo-card-border);
    border-radius: 12px;
    padding: 16px;
}

.demo-table-section h2 {
    font-size: .95rem;
    margin: 0 0 12px;
    color: var(--demo-text-muted);
    font-weight: 500;
}

.demo-table-wrapper {
    overflow-x: auto;
}

.demo-table {
    width: 100%;
    border-collapse: collapse;
    font-size: .82rem;
}

.demo-table th,
.demo-table td {
    padding: 8px 12px;
    text-align: right;
    white-space: nowrap;
}

.demo-table th:first-child,
.demo-table td:first-child {
    text-align: left;
}

.demo-table thead th {
    color: var(--demo-text-muted);
    border-bottom: 1px solid var(--demo-card-border);
    font-weight: 500;
}

.demo-table tbody tr:nth-child(even) {
    background: rgba(255, 255, 255, .02);
}

.demo-table tfoot tr {
    font-weight: 700;
    border-top: 2px solid var(--demo-card-border);
}

@media (max-width: 768px) {
    .demo-kpis {
        grid-template-columns: repeat(2, 1fr);
    }

    .demo-charts {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 430px) {
    .demo-kpis {
        grid-template-columns: 1fr;
    }
}
```

- [ ] **Step 3: Manually verify structure and styling**

Open `demo-dashboard.html` directly in a browser (double-click or `start demo-dashboard.html` on Windows). Confirm:
- Dark background renders, header shows the title, badge and "← Volver al portfolio" link.
- Empty filter dropdowns, KPI cards showing `-`, empty chart boxes and an empty table render without console errors (Chart.js/`demo-dashboard.js` wiring happens in Task 3, so charts/data being empty at this stage is expected).
- Resizing the window down to ~400px stacks the KPI cards and charts into fewer columns per the media queries.
- Clicking "← Volver al portfolio" navigates to `index.html#projects`.

- [ ] **Step 4: Commit**

```bash
git add demo-dashboard.html demo-dashboard.css
git commit -m "feat: add demo dashboard page structure and dark theme"
```

---

### Task 3: Wire up rendering and interactivity (`demo-dashboard.js`)

**Files:**
- Create: `demo-dashboard.js`

**Interfaces:**
- Consumes:
  - `window.DemoData` from Task 1 (`generateDataset`, `getFilteredData`, `aggregateByMonth`, `aggregateByStore`, `computeKPIs`, `YEARS`, `MONTH_NAMES`, `STORE_NAMES`)
  - The DOM element IDs produced by Task 2's `demo-dashboard.html`
  - The global `Chart` constructor from the Chart.js CDN script tag
- Produces: none (top-level page script; nothing else depends on it)

- [ ] **Step 1: Create `demo-dashboard.js`**

```js
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
  return new Intl.NumberFormat("es-ES").format(value);
}

function renderKPIs(rows) {
  const kpis = DemoData.computeKPIs(rows);
  document.getElementById("kpi-ingresos").textContent = formatNumber(kpis.ingresos) + " €";
  document.getElementById("kpi-clientes").textContent = formatNumber(kpis.clientes);
  document.getElementById("kpi-ticket").textContent = formatNumber(kpis.ticketMedio) + " €";
  document.getElementById("kpi-conversion").textContent = kpis.tasaConversion + " %";
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
      "<td>" + m.tasaAdquisicion + " %</td>" +
      "<td>" + m.ticketMedioNuevos + "</td>" +
      "<td>" + m.ticketMedioAntiguos + "</td>" +
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
  const amber = "#ffb020";
  const teal = "#2dd4bf";

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
      plugins: { legend: { labels: { color: "#f2f2f2" } } }
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
      plugins: { legend: { position: "bottom", labels: { color: "#f2f2f2" } } }
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
      plugins: { legend: { labels: { color: "#f2f2f2" } } }
    }
  });
}

function reseed() {
  dataset = DemoData.generateDataset(Date.now());
  populateFilters();
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
```

- [ ] **Step 2: Manually verify interactivity in the browser**

Open `demo-dashboard.html` (refresh if it was already open from Task 2). Confirm:
- On load: all 4 KPIs show non-zero numbers, all 3 charts render with data, the table has 24 rows (2 years × 12 months) plus a "Total" row, and the filter dropdowns are populated ("Todas" + 2026/2025, "Todas" + 12 months, "Todas" + 4 store names).
- Selecting a specific store in the "Tienda" filter updates the KPIs, all 3 charts, and the table to reflect only that store (e.g. total revenue drops to roughly a quarter).
- Selecting a specific month narrows the table to matching row(s) and the KPI/chart totals change accordingly; resetting back to "Todas" restores the full view.
- Clicking "🎲 Generar nuevo escenario" repeatedly changes the KPI numbers and chart data each time, without throwing console errors and without the page needing a manual reload.
- No errors appear in the browser devtools console during any of the above interactions.

- [ ] **Step 3: Commit**

```bash
git add demo-dashboard.js
git commit -m "feat: wire up demo dashboard filtering, charts and reseed"
```

---

### Task 4: Link the demo from a new project card in `index.html`

**Files:**
- Create: `src/svg/demo-dashboard-preview.svg`
- Modify: `index.html:420-423` (insert a new `project-box-wrapper` between the closing `</div>` of the "Farmacias" card and the `<!-- Proyecto destacado: MultiÓpticas -->` comment)

**Interfaces:**
- Consumes: `demo-dashboard.html` (Task 2/3's finished page) as the link target; existing `.project-box2` / `.info-div` / `.image-div` / `.project-buttons` / `.cta` CSS classes already defined in `style.css` (no new CSS needed for the card itself).
- Produces: none (leaf-level addition to the existing projects section).

- [ ] **Step 1: Create the preview illustration**

Create `src/svg/demo-dashboard-preview.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360" width="480" height="360" role="img" aria-label="Ilustración de un dashboard con KPIs, gráfico de barras y gráfico circular">
  <rect x="0" y="0" width="480" height="360" rx="24" fill="#121317" />
  <rect x="24" y="24" width="96" height="56" rx="10" fill="#1c1e24" stroke="#2b2e37" />
  <text x="40" y="58" font-family="monospace" font-size="22" font-weight="700" fill="#8000ff">+10</text>
  <rect x="136" y="24" width="96" height="56" rx="10" fill="#1c1e24" stroke="#2b2e37" />
  <text x="150" y="58" font-family="monospace" font-size="22" font-weight="700" fill="#6bc5f8">-40%</text>
  <rect x="248" y="24" width="96" height="56" rx="10" fill="#1c1e24" stroke="#2b2e37" />
  <text x="266" y="58" font-family="monospace" font-size="22" font-weight="700" fill="#ffb020">3</text>
  <rect x="24" y="104" width="200" height="232" rx="14" fill="#1c1e24" stroke="#2b2e37" />
  <rect x="46" y="260" width="24" height="56" rx="4" fill="#8000ff" />
  <rect x="86" y="220" width="24" height="96" rx="4" fill="#6bc5f8" />
  <rect x="126" y="240" width="24" height="76" rx="4" fill="#8000ff" />
  <rect x="166" y="200" width="24" height="116" rx="4" fill="#6bc5f8" />
  <polyline points="58,230 98,180 138,210 178,150" fill="none" stroke="#ffb020" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  <rect x="248" y="104" width="208" height="232" rx="14" fill="#1c1e24" stroke="#2b2e37" />
  <circle cx="352" cy="190" r="64" fill="none" stroke="#8000ff" stroke-width="24" stroke-dasharray="180 220" />
  <circle cx="352" cy="190" r="64" fill="none" stroke="#6bc5f8" stroke-width="24" stroke-dasharray="120 280" stroke-dashoffset="-180" />
  <rect x="272" y="276" width="164" height="10" rx="5" fill="#2b2e37" />
  <rect x="272" y="296" width="120" height="10" rx="5" fill="#2b2e37" />
</svg>
```

- [ ] **Step 2: Insert the new project card in `index.html`**

Find this boundary (currently `index.html:420-423`):

```html
                    </div>
                    <!-- Proyecto destacado: MultiÓpticas -->
                <div data-aos="fade-up" class="project-box-wrapper wide-project">
```

Replace it with (inserting the new card in between):

```html
                    </div>
                    <div data-aos="fade-up" class="project-box-wrapper">
                        <div class="project-box project-box2" id="project-box-demo">
                            <div class="info-div">
                                <article class="ProjectHeading">Dashboard Demo Interactivo</article>
                                <p class="ProjectDescription">
                                    Un dashboard de ejemplo con datos 100% ficticios para que explores filtros, KPIs y gráficos en vivo, tal y como los construyo en proyectos reales de Power BI.
                                </p>
                                <div class="project-buttons">
                                    <a href="https://github.com/Migueldfr" target="_blank" class="github-redirect"
                                        aria-label="Visit demo dashboard code on GitHub">
                                        <img src="src/svg/github.svg" alt="github redirect button" />
                                    </a>
                                    <a href="demo-dashboard.html" target="_blank" class="cta"
                                    aria-label="Abrir dashboard demo interactivo">
                                    <span>Ver demo interactiva</span>
                                    <svg viewBox="0 0 13 10" height="10px" width="15px">
                                       <path d="M1,5 L11,5"></path>
                                       <polyline points="8 1 12 5 8 9"></polyline>
                                    </svg>
                                    </a>
                                </div>
                            </div>
                            <div class="image-div">
                                <a href="demo-dashboard.html" target="_blank" aria-label="Abrir dashboard demo interactivo">
                                    <img src="src/svg/demo-dashboard-preview.svg" alt="Ilustración del dashboard demo" class="project-main-image" />
                                </a>
                            </div>
                        </div>
                    </div>
                    <!-- Proyecto destacado: MultiÓpticas -->
                <div data-aos="fade-up" class="project-box-wrapper wide-project">
```

- [ ] **Step 3: Manually verify in the browser**

Open `index.html`, scroll/navigate to `#projects`. Confirm:
- A third card "Dashboard Demo Interactivo" appears between "Farmacias" and the "MultiÓpticas" featured card, matching the visual style (hover effect, spacing) of the other two `project-box2` cards.
- The SVG illustration renders inside the card without distortion.
- Clicking "Ver demo interactiva" (or the illustration) opens `demo-dashboard.html` in a new tab.
- From the opened demo page, clicking "← Volver al portfolio" returns to `index.html#projects`.
- Resize to mobile width (~400px) and confirm the new card stacks the same way the existing cards do.

- [ ] **Step 4: Commit**

```bash
git add index.html src/svg/demo-dashboard-preview.svg
git commit -m "feat: link interactive demo dashboard from a new project card"
```
