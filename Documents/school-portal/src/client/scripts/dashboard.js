const STORAGE_KEY = 'school_portal_dashboard_data';
const dashboardBody = document.getElementById('dashboardBody');
const emptyNotice = document.getElementById('emptyNotice');
const exportCsvBtn = document.getElementById('exportCsv');
const exportJsonBtn = document.getElementById('exportJson');
const importJsonInput = document.getElementById('importJson');
const clearAllBtn = document.getElementById('clearAll');

let dashboardEntries = loadDashboardEntries();

function loadDashboardEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDashboardEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboardEntries));
  renderDashboard();
}

function renderDashboard() {
  dashboardBody.innerHTML = '';
  if (dashboardEntries.length === 0) {
    emptyNotice.style.display = 'block';
    return;
  }
  emptyNotice.style.display = 'none';
  dashboardEntries.forEach(entry => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(entry.studentId)}</td>
      <td>${escapeHtml(entry.studentName)}</td>
      <td>${escapeHtml(entry.class)}</td>
      <td>${escapeHtml(entry.subject)}</td>
      <td>${Number(entry.score).toFixed(1)}</td>
      <td>${escapeHtml(entry.grade)}</td>
      <td>${escapeHtml(entry.remarks)}</td>
      <td class="actions">
        <button data-action="edit" data-id="${entry.id}">Edit</button>
        <button data-action="delete" data-id="${entry.id}">Delete</button>
      </td>
    `;
    dashboardBody.appendChild(tr);
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function addOrUpdateDashboardEntry(data) {
  if (data.id) {
    const idx = dashboardEntries.findIndex(e => e.id === data.id);
    if (idx >= 0) dashboardEntries[idx] = data;
  } else {
    data.id = cryptoRandomId();
    dashboardEntries.push(data);
  }
  saveDashboardEntries();
}

function cryptoRandomId() {
  return 'id-' + Math.random().toString(36).slice(2, 9);
}

exportCsvBtn.addEventListener('click', () => {
  if (dashboardEntries.length === 0) { alert('No records to export.'); return; }
  const headers = ['Student ID', 'Name', 'Class', 'Subject', 'Score', 'Grade', 'Remarks'];
  const rows = dashboardEntries.map(e => [
    e.studentId, e.studentName, e.class, e.subject,
    Number(e.score).toFixed(1), e.grade, e.remarks
  ]);
  const csvContent = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  downloadFile(csvContent, 'dashboard_results.csv', 'text/csv;charset=utf-8;');
});

exportJsonBtn.addEventListener('click', () => {
  const payload = JSON.stringify(dashboardEntries, null, 2);
  downloadFile(payload, 'dashboard_results.json', 'application/json;charset=utf-8;');
});

importJsonInput.addEventListener('change', (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      const sanitized = imported.map(item => ({
        id: item.id || cryptoRandomId(),
        studentId: String(item.studentId || '').trim(),
        studentName: String(item.studentName || '').trim(),
        class: String(item.class || '').trim(),
        subject: String(item.subject || '').trim(),
        score: Number(item.score) || 0,
        grade: computeGrade(Number(item.score) || 0),
        remarks: remarksFor(Number(item.score) || 0)
      }));
      dashboardEntries = dashboardEntries.concat(sanitized);
      saveDashboardEntries();
      importJsonInput.value = '';
    } catch {
      alert('Failed to import JSON. Ensure it contains an array of result objects.');
    }
  };
  reader.readAsText(file);
});

clearAllBtn.addEventListener('click', () => {
  if (!confirm('Clear all records? This cannot be undone.')) return;
  dashboardEntries = [];
  saveDashboardEntries();
});

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// initial render
renderDashboard();