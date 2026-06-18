const SCHEMAS = {
  oferta: ['carrera','codigo','ramo','semestre_malla','tipo','secciones_requeridas','cupo_estimado','requiere_pc','profesor_sugerido','prioridad'],
  disponibilidad: ['profesor','dia','bloque','disponibilidad'],
  salas: ['sala','capacidad','tipo','disponible'],
  bloques: ['dia','bloque','inicio','termino'],
  demanda: ['carrera','codigo','ramo','estimacion_2026','secciones_sugeridas'],
  restricciones: ['tipo_restriccion','elemento','restriccion','dureza','prioridad']
};

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');
}

function normalizeRow(row) {
  const out = {};
  Object.entries(row).forEach(([k, v]) => {
    out[normalizeKey(k)] = typeof v === 'string' ? v.trim() : v;
  });
  return out;
}

async function readTableFromFile(file) {
  if (!file) return [];
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'csv') {
    const text = await file.text();
    const wb = XLSX.read(text, { type: 'string' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json(ws).map(normalizeRow);
  }
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws).map(normalizeRow);
}

function validateTable(name, rows) {
  const required = SCHEMAS[name] || [];
  const headers = new Set(rows.flatMap(row => Object.keys(row)));
  const missing = required.filter(col => !headers.has(col));
  return { name, ok: missing.length === 0, missing, count: rows.length };
}
