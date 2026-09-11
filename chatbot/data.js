const DOCUMENTO = {
  titulo: "Política de Devoluciones — TechShop Ejemplo S.L.",
  parrafos: [
    "Plazo de devolución: dispones de 30 días naturales desde la recepción del pedido para solicitar una devolución.",
    "Estado del producto: debe devolverse sin usar, con su embalaje original y todos los accesorios incluidos.",
    "Reembolso: se realiza sobre el método de pago original en un plazo de 5 a 7 días laborables desde que recibimos el producto.",
    "Gastos de envío: la devolución es gratuita si el producto llega defectuoso o incorrecto; si es un cambio de opinión, el coste del envío corre a cargo del cliente.",
    "Excepciones: no se aceptan devoluciones de productos personalizados ni de artículos de higiene íntima ya abiertos, como ropa interior.",
    "Cómo iniciar una devolución: rellena el formulario de la web o escribe a devoluciones@techshop-ejemplo.com con tu número de pedido.",
    "Devoluciones internacionales: fuera de España se aceptan igualmente dentro del plazo de 30 días, pero el cliente asume los gastos y aranceles de envío.",
    "Artículos en oferta o rebajados: se pueden devolver en las mismas condiciones que el resto de productos; una rebaja no reduce el plazo ni el derecho a devolución.",
    "Cambios de talla o color: se gestionan como una devolución seguida de un nuevo pedido, ya que no ofrecemos cambio directo de artículo.",
    "Garantía legal: además de esta política de devoluciones, todos los productos cuentan con 3 años de garantía legal frente a defectos de fabricación.",
    "Atención al cliente: para cualquier duda no resuelta aquí, escribe a soporte@techshop-ejemplo.com o llama al 900 123 456 (L-V, 9:00-18:00)."
  ]
};

const SUGGESTED_QUESTIONS = [
  "¿Cuánto tiempo tengo para devolver un producto?",
  "¿En qué estado debe estar el producto?",
  "¿Cómo me devuelven el dinero?",
  "¿Quién paga el envío de la devolución?",
  "¿Puedo devolver ropa interior?",
  "¿Hacéis devoluciones internacionales?",
  "¿Cuánto dura la garantía legal?",
  "¿Cómo inicio una devolución?"
];

const QA_ENTRIES = [
  {
    keywords: ["plazo", "dia", "tiempo", "hasta cuando"],
    respuesta: "Tienes 30 días naturales desde la recepción del pedido para solicitar la devolución."
  },
  {
    keywords: ["estado", "usa", "embalaje", "caja", "accesorio"],
    respuesta: "El producto debe devolverse sin usar, con su embalaje original y todos los accesorios incluidos."
  },
  {
    keywords: ["reembols", "dinero", "pago", "cobrar", "devuelv"],
    respuesta: "El reembolso se hace sobre el método de pago original, en un plazo de 5 a 7 días laborables."
  },
  {
    keywords: ["envio", "gastos", "coste", "gratis", "gratuito"],
    respuesta: "La devolución es gratuita si el producto llega defectuoso o incorrecto; si es un cambio de opinión, el envío lo paga el cliente."
  },
  {
    keywords: ["excepcion", "ropa interior", "higiene", "personalizado", "no se acepta", "no acepta"],
    respuesta: "No se aceptan devoluciones de productos personalizados ni de artículos de higiene íntima ya abiertos, como ropa interior."
  },
  {
    keywords: ["inici", "solicit", "formulario", "empez"],
    respuesta: "Para iniciar una devolución, rellena el formulario de la web o escribe a devoluciones@techshop-ejemplo.com con tu número de pedido."
  },
  {
    keywords: ["internacional", "extranjero", "fuera de espana", "otro pais"],
    respuesta: "Sí, aceptamos devoluciones internacionales dentro del plazo de 30 días, pero el cliente asume los gastos y aranceles de envío."
  },
  {
    keywords: ["garantia", "defecto", "fabricacion", "años"],
    respuesta: "Además de esta política de devoluciones, todos los productos tienen 3 años de garantía legal frente a defectos de fabricación."
  }
];

const FALLBACK_RESPUESTA =
  "Eso no está en este documento de ejemplo, pero conectado a tu base de conocimiento real sí te lo respondería.";

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function findAnswer(question) {
  const normalizedQuestion = normalizeText(question);
  if (!normalizedQuestion) {
    return FALLBACK_RESPUESTA;
  }

  let bestEntry = null;
  let bestScore = 0;

  QA_ENTRIES.forEach((entry) => {
    const score = entry.keywords.reduce((count, keyword) => {
      return normalizedQuestion.includes(normalizeText(keyword)) ? count + 1 : count;
    }, 0);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  });

  return bestEntry ? bestEntry.respuesta : FALLBACK_RESPUESTA;
}

const ChatbotData = { DOCUMENTO, SUGGESTED_QUESTIONS, QA_ENTRIES, FALLBACK_RESPUESTA, findAnswer };

if (typeof module !== "undefined" && module.exports) {
  module.exports = ChatbotData;
} else {
  window.ChatbotData = ChatbotData;
}
