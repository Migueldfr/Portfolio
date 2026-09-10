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
