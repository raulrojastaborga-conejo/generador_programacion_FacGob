function expandOferta(oferta, demanda) {
  const demandaByCodigo = new Map(demanda.map(d => [String(d.codigo), d]));
  const sections = [];
  oferta.forEach(row => {
    const dem = demandaByCodigo.get(String(row.codigo)) || {};
    const n = Number(row.secciones_requeridas || dem.secciones_sugeridas || 1);
    for (let i = 1; i <= Math.max(1, n); i++) {
      sections.push({
        ...row,
        seccion: i,
        cupo: Number(row.cupo_estimado || dem.estimacion_2026 || 0)
      });
    }
  });
  return sections;
}

function isYes(value) {
  return ['si', 'sí', 's', 'yes', 'true', '1'].includes(String(value || '').trim().toLowerCase());
}

function isNo(value) {
  return ['no', 'false', '0'].includes(String(value || '').trim().toLowerCase());
}

function priorityRank(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v.includes('alta')) return 1;
  if (v.includes('media')) return 2;
  if (v.includes('baja')) return 3;
  return 4;
}

function availabilityMap(rows) {
  const map = new Map();
  rows.forEach(r => {
    const key = `${String(r.profesor).toLowerCase()}|${String(r.dia).toLowerCase()}|${String(r.bloque).toLowerCase()}`;
    map.set(key, String(r.disponibilidad || '').toLowerCase());
  });
  return map;
}

function teacherAvailable(map, profesor, dia, bloque) {
  if (!profesor) return false;
  const key = `${String(profesor).toLowerCase()}|${String(dia).toLowerCase()}|${String(bloque).toLowerCase()}`;
  const val = map.get(key);
  if (!val) return true; // si no consta, se permite con alerta blanda en MVP
  if (val.includes('no disponible')) return false;
  return val.includes('disponible') || val.includes('preferente');
}

function applyTextRulePenalty(section, bloque, rules) {
  let penalty = 0;
  const ramo = String(section.ramo || '').toLowerCase();
  const tipo = String(section.tipo || '').toLowerCase();
  rules.forEach(rule => {
    const raw = JSON.stringify(rule).toLowerCase();
    if (raw.includes('ingles') || raw.includes('inglés')) {
      if (ramo.includes('ingles') || ramo.includes('inglés')) {
        if (!String(bloque.bloque).toLowerCase().includes('b1') && !String(bloque.inicio).startsWith('08')) penalty += 5;
      }
    }
    if (raw.includes('viernes') && String(bloque.dia).toLowerCase().includes('viernes')) penalty += 2;
    if (raw.includes('electivo') && tipo.includes('electivo')) penalty += 1;
  });
  return penalty;
}

function generateSchedule(data, structuredRules = []) {
  const oferta = data.oferta || [];
  const demanda = data.demanda || [];
  const salas = (data.salas || []).filter(s => !isNo(s.disponible));
  const bloques = data.bloques || [];
  const dispMap = availabilityMap(data.disponibilidad || []);
  const sections = expandOferta(oferta, demanda);
  const schedule = [];
  const alerts = [];
  const usedTeacher = new Set();
  const usedRoom = new Set();

  sections.sort((a, b) => priorityRank(a.prioridad) - priorityRank(b.prioridad));

  for (const section of sections) {
    let best = null;

    for (const bloque of bloques) {
      const profesor = section.profesor_sugerido;
      const teacherKey = `${profesor}|${bloque.dia}|${bloque.bloque}`;
      if (usedTeacher.has(teacherKey)) continue;
      if (!teacherAvailable(dispMap, profesor, bloque.dia, bloque.bloque)) continue;

      for (const sala of salas) {
        const roomKey = `${sala.sala}|${bloque.dia}|${bloque.bloque}`;
        if (usedRoom.has(roomKey)) continue;
        const cap = Number(sala.capacidad || 0);
        if (cap && Number(section.cupo || 0) > cap) continue;
        if (String(sala.tipo || '').toLowerCase().includes('lab') && !isYes(section.requiere_pc)) continue;
        const penalty = applyTextRulePenalty(section, bloque, structuredRules);
        const candidate = { bloque, sala, penalty };
        if (!best || penalty < best.penalty) best = candidate;
      }
    }

    if (best) {
      const profesor = section.profesor_sugerido;
      usedTeacher.add(`${profesor}|${best.bloque.dia}|${best.bloque.bloque}`);
      usedRoom.add(`${best.sala.sala}|${best.bloque.dia}|${best.bloque.bloque}`);
      schedule.push({
        carrera: section.carrera,
        codigo: section.codigo,
        ramo: section.ramo,
        seccion: section.seccion,
        profesor,
        dia: best.bloque.dia,
        bloque: best.bloque.bloque,
        inicio: best.bloque.inicio,
        termino: best.bloque.termino,
        sala: best.sala.sala,
        cupo: section.cupo,
        estado: best.penalty ? 'Asignado con advertencia' : 'Asignado'
      });
      if (best.penalty) {
        alerts.push({
          tipo: 'Blanda',
          codigo: section.codigo,
          ramo: section.ramo,
          detalle: 'Asignación posible, pero no cumple totalmente una regla blanda interpretada.',
          accion: 'Revisar si se acepta la excepción.'
        });
      }
    } else {
      schedule.push({
        carrera: section.carrera,
        codigo: section.codigo,
        ramo: section.ramo,
        seccion: section.seccion,
        profesor: section.profesor_sugerido,
        estado: 'No asignado'
      });
      alerts.push({
        tipo: 'Dura',
        codigo: section.codigo,
        ramo: section.ramo,
        detalle: 'No se encontró combinación profesor/bloque/sala que cumpla restricciones duras mínimas.',
        accion: 'Revisar disponibilidad docente, sala, capacidad o requiere_pc.'
      });
    }
  }
  return { schedule, alerts };
}
