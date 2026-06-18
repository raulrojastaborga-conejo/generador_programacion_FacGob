function toCsv(rows) {
  if (!rows || !rows.length) return '';
  const cols = Object.keys(rows[0]);
  const escape = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  return [cols.join(','), ...rows.map(r => cols.map(c => escape(r[c])).join(','))].join('\n');
}

function downloadCsv(filename, rows) {
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function renderTable(el, rows) {
  if (!rows || !rows.length) {
    el.innerHTML = '<tr><td>Sin datos.</td></tr>';
    return;
  }
  const cols = Object.keys(rows[0]);
  el.innerHTML = '<thead><tr>' + cols.map(c => `<th>${c}</th>`).join('') + '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + cols.map(c => `<td>${r[c] ?? ''}</td>`).join('') + '</tr>').join('') + '</tbody>';
}
