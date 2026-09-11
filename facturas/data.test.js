const test = require("node:test");
const assert = require("node:assert/strict");
const { INVOICES, computeTotals, getInvoiceById } = require("./data.js");

test("INVOICES lists exactly two fictional example invoices", () => {
  assert.equal(INVOICES.length, 2);
  assert.deepEqual(INVOICES.map(i => i.id), ["universidad", "material-sanitario"]);
});

test("computeTotals sums line items with no IVA for the university invoice", () => {
  const invoice = getInvoiceById("universidad");
  const totals = computeTotals(invoice);
  assert.equal(totals.subtotal, 3680);
  assert.equal(totals.iva, 0);
  assert.equal(totals.total, 3680);
});

test("computeTotals applies IVA and a percentage discount on top for the material-sanitario invoice", () => {
  const invoice = getInvoiceById("material-sanitario");
  const totals = computeTotals(invoice);
  assert.equal(totals.subtotal, 250);
  assert.equal(totals.iva, 52.5);
  assert.equal(totals.descuento, 151.25);
  assert.equal(totals.total, 151.25);
});

test("computeTotals returns zero discount when an invoice has no descuentoPct", () => {
  const invoice = getInvoiceById("universidad");
  const totals = computeTotals(invoice);
  assert.equal(totals.descuento, 0);
});

test("getInvoiceById returns null for an unknown id", () => {
  assert.equal(getInvoiceById("no-existe"), null);
});
