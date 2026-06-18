let loadedData = {};
let structuredRules = [];
let lastSchedule = [];
let lastAlerts = [];

const files = {
  oferta: 'fileOferta',
  disponibilidad: 'fileDisponibilidad',
  salas: 'fileSalas',
  bloques: 'fileBloques',
  demanda: 'fileDemanda',
  restricciones: 'fileRestricciones'
};

function setStatus(html) {
  document.getElementById('inputStatus').innerHTML = html;
}

async function loadInputs() {
  loadedData = {};
  const validations = [];

  for (const [name, id] of Object.entries(files)) {
    const file = document.getElementById(id).files[0];
    loadedData[name] = await readTableFromFile(file);
    validations.push(validateTable(name, loadedData[name]));
  }

  const html = validations.map(v => v.ok
    ? `<p><span class="badge ok">OK</span> ${v.name}: ${v.count} filas.</p>`
    : `<p><span class="badge dura">Revisar</span> ${v.name}: faltan columnas ${v.missing.join(', ') || '—'}.</p>`
  ).join('');

  setStatus(html);
}

function fallbackRulesFromText(text) {
  const rules = [];
  const lines = String(text || '').split(/\n+/).map(x => x.trim()).filter(Boolean);
  lines.forEach((line, i) => rules.push({
    id: `local-${i + 1}`,
    fuente: 'local',
    regla_original: line,
    tipo: 'criterio_general',
    dureza: line.toLowerCase().includes('debe') || line.toLowerCase().includes('no ') ? 'dura' : 'blanda'
  }));
  return rules;
}

function interpretRulesWithJsonp(url, text) {
  return new Promise((resolve, reject) => {
    const cb = 'facgobRulesCallback_' + Date.now();
    const script = document.createElement('script');
    window[cb] = (payload) => {
      delete window[cb];
      script.remove();
      resolve(payload);
    };
    script.onerror = () => {
      delete window[cb];
      script.remove();
      reject(new Error('No fue posible llamar al backend Apps Script.'));
    };
    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}callback=${encodeURIComponent(cb)}&rules=${encodeURIComponent(text)}`;
    document.body.appendChild(script);
  });
}

async function interpretarReglas() {
  const text = document.getElementById('reglasProsa').value;
  const url = document.getElementById('backendUrl').value.trim();
  const box = document.getElementById('reglasEstructuradas');

  if (!text.trim()) {
    structuredRules = [];
    box.textContent = 'No se ingresaron reglas en prosa.';
    return;
  }

  try {
    if (url) {
      const payload = await interpretRulesWithJsonp(url, text);
      structuredRules = payload.rules || payload.reglas || [];
    } else {
      structuredRules = fallbackRulesFromText(text);
    }
    box.textContent = JSON.stringify(structuredRules, null, 2);
  } catch (err) {
    structuredRules = fallbackRulesFromText(text);
    box.textContent = 'Error IA/backend. Se usaron reglas locales de respaldo.\n\n' + JSON.stringify(structuredRules, null, 2);
  }
}

function generar() {
  const result = generateSchedule(loadedData, structuredRules);
  lastSchedule = result.schedule;
  lastAlerts = result.alerts;
  renderTable(document.getElementById('tablaProgramacion'), lastSchedule);
  renderTable(document.getElementById('tablaAlertas'), lastAlerts);
  document.getElementById('summary').innerHTML = `<p><strong>${lastSchedule.length}</strong> secciones procesadas. <strong>${lastAlerts.length}</strong> alertas generadas.</p>`;
  document.getElementById('btnExportarProgramacion').disabled = !lastSchedule.length;
  document.getElementById('btnExportarAlertas').disabled = !lastAlerts.length;
}

document.getElementById('btnCargar').addEventListener('click', loadInputs);
document.getElementById('btnInterpretar').addEventListener('click', interpretarReglas);
document.getElementById('btnGenerar').addEventListener('click', generar);
document.getElementById('btnExportarProgramacion').addEventListener('click', () => downloadCsv('programacion_sugerida.csv', lastSchedule));
document.getElementById('btnExportarAlertas').addEventListener('click', () => downloadCsv('alertas_programacion.csv', lastAlerts));
