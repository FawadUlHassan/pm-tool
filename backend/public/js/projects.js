// public/js/projects.js
console.log('✅ projects.js loaded');

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔄 Initializing Projects page');

  // Fetch fields & projects
  const [fields, projects] = await Promise.all([fetchFields(), fetchProjects()]);
  window._PROJECT_FIELDS = fields;

  // Wire up UI
  renderTable(fields, projects);
  wireAddEditHandlers(fields);
  wireBulkDeleteHandler();
});

async function fetchFields() {
  const resp = await fetch('/api/fields');
  return await resp.json();
}

async function fetchProjects() {
  const resp = await fetch('/api/projects');
  return await resp.json();
}

function renderTable(fields, projects) {
  // 1) Header with select-all
  const header = document.getElementById('projectsHeader');
  header.innerHTML =
    `<th><input type="checkbox" id="selectAll"></th>` +
    fields.map(f => `<th>${f.label}</th>`).join('') +
    '<th>Actions</th>';

  // 2) Body with per-row checkbox
  const body = document.getElementById('projectsBody');
  body.innerHTML = projects.map(p => {
    const cells = fields
      .map(f => `<td>${formatValue(p[f.fieldKey], f)}</td>`)
      .join('');
    return `<tr data-id="${p.id}">
      <td><input type="checkbox" class="selectRow"></td>
      ${cells}
      <td>
        <button class="btn btn-sm btn-outline-primary btn-edit me-1">Edit</button>
        <button class="btn btn-sm btn-outline-danger btn-delete">Delete</button>
      </td>
    </tr>`;
  }).join('');

  // 3) Wire select‑all → per‑row
  document.getElementById('selectAll').addEventListener('change', e => {
    const checked = e.target.checked;
    document.querySelectorAll('.selectRow').forEach(cb => cb.checked = checked);
    updateBulkDeleteButton();
  });

  // 4) Wire each row checkbox → bulk button
  document.querySelectorAll('.selectRow').forEach(cb =>
    cb.addEventListener('change', updateBulkDeleteButton)
  );
}

function updateBulkDeleteButton() {
  const anySelected = Array.from(document.querySelectorAll('.selectRow'))
    .some(cb => cb.checked);
  document.getElementById('btnDeleteSelected').disabled = !anySelected;
}

function wireAddEditHandlers(fields) {
  // Add
  document.getElementById('btnAddProject')
    .addEventListener('click', () => openProjectModal(fields, null));

  // Form submit (Add or Edit)
  document.getElementById('projectForm')
    .addEventListener('submit', async e => {
      e.preventDefault();
      const data = collectFormData(fields);
      if (window.editingProjectId) {
        await fetch(`/api/projects/${window.editingProjectId}`, {
          method: 'PUT',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(data)
        });
        window.editingProjectId = null;
      } else {
        await fetch('/api/projects', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(data)
        });
      }
      refreshTable(fields);
      bootstrap.Modal.getOrCreateInstance(
        document.getElementById('projectModal')
      ).hide();
    });

  // Delegate Edit/Delete buttons
  document.getElementById('projectsTable')
    .addEventListener('click', async e => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      const id = tr.dataset.id;

      if (e.target.classList.contains('btn-delete')) {
        if (!confirm('Delete this project?')) return;
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        return refreshTable(fields);
      }

      if (e.target.classList.contains('btn-edit')) {
        const resp = await fetch(`/api/projects/${id}`);
        const project = await resp.json();
        window.editingProjectId = id;
        openProjectModal(fields, project);
      }
    });
}

function wireBulkDeleteHandler() {
  document.getElementById('btnDeleteSelected')
    .addEventListener('click', async () => {
      if (!confirm('Delete all selected projects?')) return;
      // Collect selected IDs
      const ids = Array.from(document.querySelectorAll('.selectRow'))
        .filter(cb => cb.checked)
        .map(cb => cb.closest('tr').dataset.id);
      // Call bulk‑delete endpoint
      await fetch('/api/projects/bulk-delete', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ids })
      });
      refreshTable(window._PROJECT_FIELDS);
    });
}

async function refreshTable(fields) {
  const projects = await fetchProjects();
  renderTable(fields, projects);
}

function collectFormData(fields) {
  const form = document.getElementById('projectForm');
  const data = {};
  fields.forEach(f => {
    const el = form.elements[f.fieldKey];
    if (!el) return;
    data[f.fieldKey] = f.type === 'multi-select'
      ? Array.from(el.selectedOptions).map(o => o.value)
      : el.value;
  });
  return data;
}

function formatValue(value, field) {
  if ((field.type === 'date' || field.type === 'time') && value) {
    return new Date(value).toLocaleString();
  }
  if (field.type === 'multi-select' && Array.isArray(value)) {
    return value.join(', ');
  }
  return value ?? '';
}

function openProjectModal(fields, project = null) {
  const modalEl = document.getElementById('projectModal');
  const modal   = bootstrap.Modal.getOrCreateInstance(modalEl);

  document.querySelector('#projectModal .modal-title').innerText =
    project ? 'Edit Project' : 'Add Project';

  const form = document.getElementById('projectForm');
  form.reset();
  window.editingProjectId = project ? project.id : null;

  // Build & prefill fields
  const container = document.getElementById('projectFormFields');
  container.innerHTML = '';
  fields.forEach(f => {
    let inputHtml = '';
    const val = project ? project[f.fieldKey] : '';
    switch (f.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'time':
        inputHtml = `<input
          name="${f.fieldKey}"
          type="${f.type}"
          class="form-control mb-3"
          placeholder="${f.label}"
          value="${val || ''}"
          ${f.type==='number'?'step="any"':''}
        >`;
        break;
      case 'dropdown':
        inputHtml = `<select name="${f.fieldKey}" class="form-select mb-3">
          <option value="">Select ${f.label}</option>
          ${f.options.map(o => `
            <option value="${o.value}"
              ${o.value===val?'selected':''}
            >
              ${o.label}
            </option>`).join('')}
        </select>`;
        break;
      case 'multi-select':
        inputHtml = `<select
          name="${f.fieldKey}"
          class="form-select mb-3"
          multiple
        >
          ${f.options.map(o => `
            <option value="${o.value}"
              ${Array.isArray(val) && val.includes(o.value)?'selected':''}
            >
              ${o.label}
            </option>`).join('')}
        </select>`;
        break;
      default:
        inputHtml = `<input
          name="${f.fieldKey}"
          type="text"
          class="form-control mb-3"
          placeholder="${f.label}"
          value="${val || ''}"
        >`;
    }
    container.insertAdjacentHTML('beforeend', `
      <div class="mb-2">
        <label class="form-label">${f.label}</label>
        ${inputHtml}
      </div>
    `);
  });

  modal.show();
}

