/**
 * FACGOB — Backend Apps Script para interpretar reglas en prosa con Gemini.
 *
 * Uso MVP: se despliega como Web App y se consume desde GitHub Pages vía JSONP.
 * Guardar en Script properties:
 *   GEMINI_API_KEY = <tu_api_key>
 */

const GEMINI_MODEL = 'gemini-1.5-flash';

function doGet(e) {
  const callback = (e.parameter.callback || 'callback').replace(/[^a-zA-Z0-9_]/g, '');
  const rulesText = e.parameter.rules || '';
  let payload;
  try {
    payload = { ok: true, rules: interpretRulesWithGemini_(rulesText) };
  } catch (err) {
    payload = { ok: false, error: String(err), rules: fallbackRules_(rulesText) };
  }
  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function interpretRulesWithGemini_(rulesText) {
  if (!rulesText.trim()) return [];
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!apiKey) throw new Error('Falta GEMINI_API_KEY en Script properties.');

  const prompt = `Convierte las siguientes reglas de programación académica a un JSON estricto.
Devuelve SOLO un array JSON. No uses markdown.
Cada objeto debe tener: id, regla_original, tipo, elemento, condicion, dureza, prioridad, comentario.
Valores sugeridos:
- dureza: Dura o Blanda
- prioridad: Alta, Media o Baja
- tipo: horario, sala, docente, demanda, tope, capacidad, criterio_general
Reglas:
${rulesText}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    payload: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    })
  });

  const code = res.getResponseCode();
  const body = res.getContentText();
  if (code < 200 || code >= 300) throw new Error('Gemini API error ' + code + ': ' + body);
  const data = JSON.parse(body);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  return JSON.parse(cleanJson_(text));
}

function cleanJson_(text) {
  return String(text).replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function fallbackRules_(rulesText) {
  return String(rulesText || '').split(/\n+/).map(function(line, idx) {
    line = line.trim();
    if (!line) return null;
    return {
      id: 'fallback-' + (idx + 1),
      regla_original: line,
      tipo: 'criterio_general',
      elemento: '',
      condicion: line,
      dureza: /debe|no /i.test(line) ? 'Dura' : 'Blanda',
      prioridad: 'Media',
      comentario: 'Regla generada por respaldo local, no por Gemini.'
    };
  }).filter(Boolean);
}
