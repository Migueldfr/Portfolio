const INVOICES = [
  {
    id: "universidad",
    tipo: "Matrícula universitaria",
    proveedor: "Instituto Superior Alameda",
    cif: "B00112233",
    numero: "FA-2026-00142",
    fecha: "2026-02-10",
    cliente: "Alumno de ejemplo",
    metodoPago: "Domiciliación bancaria",
    ivaPct: 0,
    lineas: [
      { concepto: "Matrícula curso 2025/2026", cantidad: 1, precio: 480 },
      { concepto: "Anualidad curso 2025/2026", cantidad: 1, precio: 3200 }
    ]
  },
  {
    id: "material-sanitario",
    tipo: "Material sanitario",
    proveedor: "Mascarillas SA",
    cif: "B00998877",
    numero: "657",
    fecha: "2020-05-30",
    cliente: "Pepito López",
    metodoPago: "Transferencia bancaria",
    ivaPct: 21,
    descuentoPct: 50,
    imagenOriginal: "factura-mascarillas.png",
    lineas: [
      { concepto: "Mascarillas quirúrgicas (pack de 100)", cantidad: 10, precio: 10 },
      { concepto: "Mascarillas M3 (pack de 100)", cantidad: 10, precio: 15 }
    ]
  }
];

function computeTotals(invoice) {
  const subtotal = invoice.lineas.reduce(function (sum, linea) {
    return sum + linea.cantidad * linea.precio;
  }, 0);
  const iva = subtotal * (invoice.ivaPct / 100);
  const descuentoPct = invoice.descuentoPct || 0;
  const descuento = (subtotal + iva) * (descuentoPct / 100);
  const total = subtotal + iva - descuento;
  return {
    subtotal: Number(subtotal.toFixed(2)),
    iva: Number(iva.toFixed(2)),
    descuento: Number(descuento.toFixed(2)),
    total: Number(total.toFixed(2))
  };
}

function getInvoiceById(id) {
  return INVOICES.find(function (invoice) { return invoice.id === id; }) || null;
}

const FacturasData = { INVOICES, computeTotals, getInvoiceById };

if (typeof module !== "undefined" && module.exports) {
  module.exports = FacturasData;
} else {
  window.FacturasData = FacturasData;
}
