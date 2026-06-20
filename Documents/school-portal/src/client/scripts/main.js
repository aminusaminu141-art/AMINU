const STORAGE_KEY = 'school_portal_data';
const form = document.getElementById('resultForm');
const resultsBody = document.getElementById('resultsBody');
const emptyNotice = document.getElementById('emptyNotice');
const entryIdEl = document.getElementById('entryId');
const exportCsvBtn = document.getElementById('exportCsv');
const exportJsonBtn = document.getElementById('exportJson');
const importJsonInput = document.getElementById('importJson');
const clearAllBtn = document.getElementById('clearAll');

let entries = loadEntries();

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  render();
}

function computeGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function remarksFor(score) {
  return score >= 60 ? 'Pass' : 'Fail';
}

function render() {
  resultsBody.innerHTML = '';
  if (entries.length === 0) {
    emptyNotice.style.display = 'block';
    return;
  }
  emptyNotice.style.display = 'none';
  entries.forEach(entry => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(entry.studentId)}</td>
      <td>${escapeHtml(entry.studentName)}</td>
      <td>${escapeHtml(entry.studentClass)}</td>
      <td>${escapeHtml(entry.subject)}</td>
      <td>${Number(entry.score).toFixed(1)}</td>
      <td>${escapeHtml(entry.grade)}</td>
      <td>${escapeHtml(entry.remarks)}</td>
      <td class="actions">
        <button data-action="edit" data-id="${entry.id}">Edit</button>
        <button data-action="delete" data-id="${entry.id}">Delete</button>
      </td>
    `;
    resultsBody.appendChild(tr);
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

function addOrUpdateEntry(data) {
  if (data.id) {
    const idx = entries.findIndex(e => e.id === data.id);
    if (idx >= 0) entries[idx] = data;
  } else {
    data.id = cryptoRandomId();
    entries.push(data);
  }
  saveEntries();
}

function cryptoRandomId() {
  return 'id-' + Math.random().toString(36).slice(2, 9);
}

form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const data = {
    id: entryIdEl.value || null,
    studentId: document.getElementById('studentId').value.trim(),
    studentName: document.getElementById('studentName').value.trim(),
    studentClass: document.getElementById('studentClass').value.trim(),
    subject: document.getElementById('subject').value.trim(),
    score: Number(document.getElementById('score').value)
  };
  if (!data.studentId || !data.studentName || Number.isNaN(data.score)) return;
  data.grade = computeGrade(data.score);
  data.remarks = remarksFor(data.score);
  addOrUpdateEntry(data);
  form.reset();
  entryIdEl.value = '';
  document.getElementById('saveBtn').textContent = 'Save';
});

form.addEventListener('reset', () => {
  entryIdEl.value = '';
  document.getElementById('saveBtn').textContent = 'Save';
});

resultsBody.addEventListener('click', (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (action === 'edit') editEntry(id);
  if (action === 'delete') deleteEntry(id);
});

function editEntry(id) {
  const entry = entries.find(e => e.id === id);
  if (!entry) return;
  entryIdEl.value = entry.id;
  document.getElementById('studentId').value = entry.studentId;
  document.getElementById('studentName').value = entry.studentName;
  document.getElementById('studentClass').value = entry.studentClass;
  document.getElementById('subject').value = entry.subject;
  document.getElementById('score').value = entry.score;
  document.getElementById('saveBtn').textContent = 'Update';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteEntry(id) {
  if (!confirm('Delete this record?')) return;
  entries = entries.filter(e => e.id !== id);
  saveEntries();
}

exportCsvBtn.addEventListener('click', () => {
  if (entries.length === 0) { alert('No records to export.'); return; }
  const headers = ['Student ID','Name','Class','Subject','Score','Grade','Remarks'];
  const rows = entries.map(e => [
    e.studentId, e.studentName, e.studentClass, e.subject,
    Number(e.score).toFixed(1), e.grade, e.remarks
  ]);
  const csvContent = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\r\n');
  downloadFile(csvContent, 'results.csv', 'text/csv;charset=utf-8;');
});

exportJsonBtn.addEventListener('click', () => {
  const payload = JSON.stringify(entries, null, 2);
  downloadFile(payload, 'results.json', 'application/json;charset=utf-8;');
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
        studentClass: String(item.studentClass || '').trim(),
        subject: String(item.subject || '').trim(),
        score: Number(item.score) || 0,
        grade: computeGrade(Number(item.score) || 0),
        remarks: remarksFor(Number(item.score) || 0)
      }));
      entries = entries.concat(sanitized);
      saveEntries();
      importJsonInput.value = '';
    } catch {
      alert('Failed to import JSON. Ensure it contains an array of result objects.');
    }
  };
  reader.readAsText(file);
});

clearAllBtn.addEventListener('click', () => {
  if (!confirm('Clear all records? This cannot be undone.')) return;
  entries = [];
  saveEntries();
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

render();