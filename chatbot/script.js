function buildDocumentPdf() {
  const doc = new jspdf.jsPDF({ unit: "pt", format: "a4" });
  const marginX = 56;
  const maxWidth = 483;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.splitTextToSize(ChatbotData.DOCUMENTO.titulo, maxWidth).forEach(function (line) {
    doc.text(line, marginX, y);
    y += 20;
  });
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  ChatbotData.DOCUMENTO.parrafos.forEach(function (parrafo) {
    const lines = doc.splitTextToSize(parrafo, maxWidth);
    if (y + lines.length * 15 > pageHeight - 56) {
      doc.addPage();
      y = 64;
    }
    lines.forEach(function (line) {
      doc.text(line, marginX, y);
      y += 15;
    });
    y += 12;
  });

  return doc.output("bloburl");
}

function renderDocument() {
  const pdfUrl = buildDocumentPdf();
  document.getElementById("chat-doc-body").innerHTML =
    '<iframe class="chat-doc-frame" src="' + pdfUrl + '" title="' + ChatbotData.DOCUMENTO.titulo + '"></iframe>';
}

function renderSuggestions() {
  const container = document.getElementById("chat-suggestions");
  container.innerHTML = ChatbotData.SUGGESTED_QUESTIONS.map(function (question, index) {
    return '<button type="button" class="chat-suggestion-chip" data-question-index="' + index + '">' + question + '</button>';
  }).join("");

  container.querySelectorAll(".chat-suggestion-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      sendMessage(ChatbotData.SUGGESTED_QUESTIONS[Number(chip.dataset.questionIndex)]);
    });
  });
}

function appendMessage(role, text) {
  const messages = document.getElementById("chat-messages");
  const bubble = document.createElement("div");
  bubble.className = "chat-bubble chat-bubble-" + role;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function sendMessage(question) {
  const trimmed = question.trim();
  if (!trimmed) {
    return;
  }

  appendMessage("user", trimmed);
  document.getElementById("chat-input").value = "";

  const typingBubble = appendMessage("bot", "Escribiendo...");
  typingBubble.classList.add("chat-bubble-typing");

  setTimeout(function () {
    typingBubble.remove();
    appendMessage("bot", ChatbotData.findAnswer(trimmed));
  }, 700);
}

function init() {
  renderDocument();
  renderSuggestions();
  appendMessage("bot", "👋 Hola, soy un asistente simulado que solo conoce el documento de la izquierda. Pregúntame algo sobre la política de devoluciones.");

  document.getElementById("chat-form").addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(document.getElementById("chat-input").value);
  });
}

window.addEventListener("DOMContentLoaded", init);
