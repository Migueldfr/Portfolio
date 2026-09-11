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

test("computeTotals applies the invoice's IVA percentage to the line-item subtotal", () => {
  const invoice = getInvoiceById("material-sanitario");
  const totals = computeTotals(invoice);
  assert.equal(totals.subtotal, 370);
  assert.equal(totals.iva, 77.7);
  assert.equal(totals.total, 447.7);
});

test("getInvoiceById returns null for an unknown id", () => {
  assert.equal(getInvoiceById("no-existe"), null);
});
