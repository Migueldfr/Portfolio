const test = require("node:test");
const assert = require("node:assert/strict");
const {
  mulberry32, generateDataset, getFilteredData,
  aggregateByMonth, aggregateByStore, computeKPIs,
  aggregateVinoByMonth, computeVinoKPIs,
  STORE_NAMES, WINERY_NAMES, SECTOR_NAMES, YEARS
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

test("SECTOR_NAMES lists Retail and Vino", () => {
  assert.deepEqual(SECTOR_NAMES, ["Retail", "Vino"]);
});

test("generateDataset produces one retail row per year/month/store combination", () => {
  const dataset = generateDataset(1);
  assert.equal(dataset.retail.length, YEARS.length * 12 * STORE_NAMES.length);
});

test("generateDataset produces one vino row per year/month/bodega combination", () => {
  const dataset = generateDataset(1);
  assert.equal(dataset.vino.length, YEARS.length * 12 * WINERY_NAMES.length);
});

test("generateDataset is deterministic for the same seed", () => {
  const datasetA = generateDataset(123);
  const datasetB = generateDataset(123);
  assert.deepEqual(datasetA, datasetB);
});

test("generateDataset produces different data for different seeds", () => {
  const datasetA = generateDataset(1);
  const datasetB = generateDataset(2);
  assert.notDeepEqual(datasetA, datasetB);
});

test("getFilteredData filters retail rows by year, month and store", () => {
  const dataset = generateDataset(1);
  const filtered = getFilteredData(dataset.retail, { year: 2025, month: 0, store: STORE_NAMES[0] });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].year, 2025);
  assert.equal(filtered[0].month, 0);
  assert.equal(filtered[0].store, STORE_NAMES[0]);
});

test("getFilteredData filters vino rows by year, month and bodega", () => {
  const dataset = generateDataset(1);
  const filtered = getFilteredData(dataset.vino, { year: 2025, month: 0, store: WINERY_NAMES[0] });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].year, 2025);
  assert.equal(filtered[0].month, 0);
  assert.equal(filtered[0].store, WINERY_NAMES[0]);
});

test("getFilteredData with all 'Todas' returns every row", () => {
  const dataset = generateDataset(1);
  const filtered = getFilteredData(dataset.retail, { year: "Todas", month: "Todas", store: "Todas" });
  assert.equal(filtered.length, dataset.retail.length);
});

test("aggregateByMonth collapses stores into one row per year/month, sorted chronologically", () => {
  const dataset = generateDataset(1);
  const monthly = aggregateByMonth(dataset.retail);
  assert.equal(monthly.length, YEARS.length * 12);
  for (let i = 1; i < monthly.length; i++) {
    const prev = monthly[i - 1];
    const curr = monthly[i];
    assert.ok(curr.year > prev.year || (curr.year === prev.year && curr.month > prev.month));
  }
});

test("aggregateByStore returns one entry per retail store with summed revenue", () => {
  const dataset = generateDataset(1);
  const byStore = aggregateByStore(dataset.retail);
  assert.equal(byStore.length, STORE_NAMES.length);
  const totalFromStores = byStore.reduce((sum, s) => sum + s.ingresos, 0);
  const totalFromRows = dataset.retail.reduce((sum, r) => sum + r.ingresos, 0);
  assert.ok(Math.abs(totalFromStores - totalFromRows) < 0.01);
});

test("aggregateByStore also works on vino rows (shared store/ingresos shape)", () => {
  const dataset = generateDataset(1);
  const byBodega = aggregateByStore(dataset.vino);
  assert.equal(byBodega.length, WINERY_NAMES.length);
  const totalFromBodegas = byBodega.reduce((sum, s) => sum + s.ingresos, 0);
  const totalFromRows = dataset.vino.reduce((sum, r) => sum + r.ingresos, 0);
  assert.ok(Math.abs(totalFromBodegas - totalFromRows) < 0.01);
});

test("computeKPIs returns zeroed KPIs for an empty dataset", () => {
  const kpis = computeKPIs([]);
  assert.deepEqual(kpis, { ingresos: 0, clientes: 0, ticketMedio: 0, tasaConversion: 0 });
});

test("computeKPIs aggregates revenue and client counts across rows", () => {
  const dataset = generateDataset(1);
  const kpis = computeKPIs(dataset.retail);
  const expectedIngresos = dataset.retail.reduce((sum, r) => sum + r.ingresos, 0);
  const expectedClientes = dataset.retail.reduce((sum, r) => sum + r.clientesNuevos + r.clientesAntiguos, 0);
  assert.ok(Math.abs(kpis.ingresos - expectedIngresos) < 0.01);
  assert.equal(kpis.clientes, expectedClientes);
});

test("aggregateVinoByMonth collapses bodegas into one row per year/month, sorted chronologically", () => {
  const dataset = generateDataset(1);
  const monthly = aggregateVinoByMonth(dataset.vino);
  assert.equal(monthly.length, YEARS.length * 12);
  for (let i = 1; i < monthly.length; i++) {
    const prev = monthly[i - 1];
    const curr = monthly[i];
    assert.ok(curr.year > prev.year || (curr.year === prev.year && curr.month > prev.month));
  }
});

test("aggregateVinoByMonth sums botellasVendidas/ingresos/produccionLitros and averages trazabilidad", () => {
  const dataset = generateDataset(1);
  const monthly = aggregateVinoByMonth(dataset.vino);
  const firstMonthRows = dataset.vino.filter(r => r.year === monthly[0].year && r.month === monthly[0].month);
  const expectedBotellas = firstMonthRows.reduce((sum, r) => sum + r.botellasVendidas, 0);
  const expectedTrazabilidad = firstMonthRows.reduce((sum, r) => sum + r.trazabilidad, 0) / firstMonthRows.length;
  assert.equal(monthly[0].botellasVendidas, expectedBotellas);
  assert.ok(Math.abs(monthly[0].trazabilidad - expectedTrazabilidad) < 0.05);
});

test("computeVinoKPIs returns zeroed KPIs for an empty dataset", () => {
  const kpis = computeVinoKPIs([]);
  assert.deepEqual(kpis, { ingresos: 0, trazabilidad: 0, botellasVendidas: 0, produccionLitros: 0 });
});

test("computeVinoKPIs aggregates revenue, bottles and production across rows", () => {
  const dataset = generateDataset(1);
  const kpis = computeVinoKPIs(dataset.vino);
  const expectedIngresos = dataset.vino.reduce((sum, r) => sum + r.ingresos, 0);
  const expectedBotellas = dataset.vino.reduce((sum, r) => sum + r.botellasVendidas, 0);
  const expectedProduccion = dataset.vino.reduce((sum, r) => sum + r.produccionLitros, 0);
  assert.ok(Math.abs(kpis.ingresos - expectedIngresos) < 0.01);
  assert.equal(kpis.botellasVendidas, expectedBotellas);
  assert.equal(kpis.produccionLitros, expectedProduccion);
});
