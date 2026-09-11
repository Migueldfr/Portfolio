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
    proveedor: "Suministros Higiénicos Delta S.L.",
    cif: "B87654321",
    numero: "F-2026-0087",
    fecha: "2026-01-22",
    cliente: "Clínica Dental Sonrisas S.L.",
    metodoPago: "Transferencia bancaria",
    ivaPct: 21,
    lineas: [
      { concepto: "Pack 100 mascarillas quirúrgicas", cantidad: 20, precio: 9.5 },
      { concepto: "Pack 100 guantes de nitrilo", cantidad: 15, precio: 12 }
    ]
  }
];

function computeTotals(invoice) {
  const subtotal = invoice.lineas.reduce(function (sum, linea) {
    return sum + linea.cantidad * linea.precio;
  }, 0);
  const iva = subtotal * (invoice.ivaPct / 100);
  const total = subtotal + iva;
  return {
    subtotal: Number(subtotal.toFixed(2)),
    iva: Number(iva.toFixed(2)),
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
