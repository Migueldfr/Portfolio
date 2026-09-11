const test = require("node:test");
const assert = require("node:assert/strict");
const { SUGGESTED_QUESTIONS, QA_ENTRIES, FALLBACK_RESPUESTA, findAnswer } = require("./data.js");

test("QA_ENTRIES has several sample entries with keywords and answers", () => {
  assert.ok(QA_ENTRIES.length >= 5);
  QA_ENTRIES.forEach((entry) => {
    assert.ok(Array.isArray(entry.keywords) && entry.keywords.length > 0);
    assert.equal(typeof entry.respuesta, "string");
  });
});

test("findAnswer matches a question about the return deadline", () => {
  const respuesta = findAnswer("¿Cuánto tiempo tengo para devolver un producto?");
  assert.match(respuesta, /30 días/);
});

test("findAnswer matches a question about refunds even without accents", () => {
  const respuesta = findAnswer("como me devuelven el dinero");
  assert.match(respuesta, /reembolso/i);
});

test("findAnswer matches a question about return exceptions", () => {
  const respuesta = findAnswer("¿puedo devolver ropa interior?");
  assert.match(respuesta, /higiene|personalizad/i);
});

test("findAnswer falls back to the honest limitation message for unrelated questions", () => {
  const respuesta = findAnswer("¿cuál es la capital de Francia?");
  assert.equal(respuesta, FALLBACK_RESPUESTA);
});

test("findAnswer falls back for an empty question", () => {
  assert.equal(findAnswer(""), FALLBACK_RESPUESTA);
});

test("findAnswer matches a question about international returns", () => {
  const respuesta = findAnswer("¿hacéis devoluciones internacionales?");
  assert.match(respuesta, /internacional/i);
});

test("findAnswer matches a question about the legal warranty", () => {
  const respuesta = findAnswer("¿cuánto dura la garantía legal?");
  assert.match(respuesta, /3 años|garantía/i);
});

test("findAnswer gives a real answer (not the fallback) for every suggested question", () => {
  SUGGESTED_QUESTIONS.forEach((question) => {
    assert.notEqual(findAnswer(question), FALLBACK_RESPUESTA, "no match for: " + question);
  });
});
