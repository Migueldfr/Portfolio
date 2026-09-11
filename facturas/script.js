let selectedInvoiceId = null;
let currentInvoice = null;

function formatCurrency(value) {
  return new Intl.NumberFormat("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value) + " €";
}

function renderDocumentPreview(invoice) {
  if (invoice.imagenOriginal) {
    document.getElementById("fac-doc-preview").innerHTML =
      '<img class="fac-doc-image" src="' + invoice.imagenOriginal + '" ' +
      'alt="Factura original de ejemplo de ' + invoice.proveedor + ' (datos ficticios)" />';
    return;
  }

  const totals = FacturasData.computeTotals(invoice);
  const descuentoRow = invoice.descuentoPct
    ? '<div><span>Descuento (' + invoice.descuentoPct + '%)</span><strong>-' + formatCurrency(totals.descuento) + '</strong></div>'
    : "";

  const filas = invoice.lineas.map(function (linea) {
    return "<tr>" +
      "<td>" + linea.concepto + "</td>" +
      "<td>" + linea.cantidad + "</td>" +
      "<td>" + formatCurrency(linea.precio) + "</td>" +
      "<td>" + formatCurrency(linea.cantidad * linea.precio) + "</td>" +
      "</tr>";
  }).join("");

  document.getElementById("fac-doc-preview").innerHTML =
    '<div class="fac-doc-page">' +
      '<div class="fac-doc-header">' +
        '<div class="fac-doc-brand">' + invoice.proveedor + '<br><small>CIF: ' + invoice.cif + '</small></div>' +
        '<div class="fac-doc-title">FACTURA</div>' +
      '</div>' +
      '<div class="fac-doc-meta">' +
        '<div><span>Nº Factura</span><strong>' + invoice.numero + '</strong></div>' +
        '<div><span>Fecha</span><strong>' + invoice.fecha + '</strong></div>' +
        '<div><span>Método de pago</span><strong>' + invoice.metodoPago + '</strong></div>' +
      '</div>' +
      '<div class="fac-doc-client">' +
        '<span>Facturado a</span>' + invoice.cliente +
      '</div>' +
      '<table class="fac-doc-table">' +
        '<thead><tr><th>Concepto</th><th>Cant.</th><th>Precio</th><th>Importe</th></tr></thead>' +
        '<tbody>' + filas + '</tbody>' +
      '</table>' +
      '<div class="fac-doc-totals">' +
        '<div><span>Base imponible</span><strong>' + formatCurrency(totals.subtotal) + '</strong></div>' +
        '<div><span>IVA (' + invoice.ivaPct + '%)</span><strong>' + formatCurrency(totals.iva) + '</strong></div>' +
        descuentoRow +
        '<div class="fac-doc-total-final"><span>Total</span><strong>' + formatCurrency(totals.total) + '</strong></div>' +
      '</div>' +
      '<div class="fac-doc-footer">Documento de ejemplo con datos 100% ficticios.</div>' +
    '</div>';
}

function selectInvoice(invoiceId) {
  selectedInvoiceId = invoiceId;
  document.querySelectorAll(".fac-picker-card").forEach(function (card) {
    card.classList.toggle("is-selected", card.dataset.invoiceId === invoiceId);
  });
  document.getElementById("btn-process").disabled = false;
  document.getElementById("fac-status").textContent = "";
  document.getElementById("fac-result").hidden = true;
  renderDocumentPreview(FacturasData.getInvoiceById(invoiceId));
}

function renderResult(invoice) {
  const totals = FacturasData.computeTotals(invoice);

  document.getElementById("result-proveedor").textContent = invoice.proveedor;
  document.getElementById("result-meta").textContent =
    invoice.tipo + " · Nº " + invoice.numero + " · " + invoice.fecha +
    " · Cliente: " + invoice.cliente + " · " + invoice.metodoPago;

  document.getElementById("result-lineas").innerHTML = invoice.lineas.map(function (linea) {
    return "<tr>" +
      "<td>" + linea.concepto + "</td>" +
      "<td>" + linea.cantidad + "</td>" +
      "<td>" + formatCurrency(linea.precio) + "</td>" +
      "<td>" + formatCurrency(linea.cantidad * linea.precio) + "</td>" +
      "</tr>";
  }).join("");

  document.getElementById("result-subtotal").textContent = formatCurrency(totals.subtotal);
  document.getElementById("result-iva-label").textContent = "IVA (" + invoice.ivaPct + "%)";
  document.getElementById("result-iva").textContent = formatCurrency(totals.iva);

  const descuentoRow = document.getElementById("result-descuento-row");
  if (invoice.descuentoPct) {
    document.getElementById("result-descuento-label").textContent = "Descuento (" + invoice.descuentoPct + "%)";
    document.getElementById("result-descuento").textContent = "-" + formatCurrency(totals.descuento);
    descuentoRow.hidden = false;
  } else {
    descuentoRow.hidden = true;
  }

  document.getElementById("result-total").textContent = formatCurrency(totals.total);

  document.getElementById("fac-result").hidden = false;
}

function processInvoice() {
  if (!selectedInvoiceId) {
    return;
  }
  const processBtn = document.getElementById("btn-process");
  const status = document.getElementById("fac-status");

  processBtn.disabled = true;
  status.textContent = "🔎 Analizando documento...";
  document.getElementById("fac-result").hidden = true;

  setTimeout(function () {
    currentInvoice = FacturasData.getInvoiceById(selectedInvoiceId);
    renderResult(currentInvoice);
    status.textContent = "✅ Extracción completada";
    processBtn.disabled = false;
  }, 1100);
}

function downloadExcel() {
  if (!currentInvoice) {
    return;
  }
  const totals = FacturasData.computeTotals(currentInvoice);
  const rows = [
    ["Proveedor", currentInvoice.proveedor],
    ["CIF", currentInvoice.cif],
    ["Nº Factura", currentInvoice.numero],
    ["Fecha", currentInvoice.fecha],
    ["Cliente", currentInvoice.cliente],
    ["Método de pago", currentInvoice.metodoPago],
    [],
    ["Concepto", "Cantidad", "Precio unitario", "Importe"]
  ];

  currentInvoice.lineas.forEach(function (linea) {
    rows.push([linea.concepto, linea.cantidad, linea.precio, linea.cantidad * linea.precio]);
  });

  rows.push([]);
  rows.push(["Base imponible", "", "", totals.subtotal]);
  rows.push(["IVA (" + currentInvoice.ivaPct + "%)", "", "", totals.iva]);
  if (currentInvoice.descuentoPct) {
    rows.push(["Descuento (" + currentInvoice.descuentoPct + "%)", "", "", -totals.descuento]);
  }
  rows.push(["Total", "", "", totals.total]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Factura");
  XLSX.writeFile(workbook, "factura-" + currentInvoice.id + ".xlsx");
}

function init() {
  document.querySelectorAll(".fac-picker-card").forEach(function (card) {
    card.addEventListener("click", function () {
      selectInvoice(card.dataset.invoiceId);
    });
  });

  document.getElementById("btn-process").addEventListener("click", processInvoice);
  document.getElementById("btn-download").addEventListener("click", downloadExcel);
}

window.addEventListener("DOMContentLoaded", init);
