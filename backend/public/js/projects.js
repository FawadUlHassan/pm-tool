console.log('✅ projects.js loaded');
// public/js/projects.js
document.addEventListener('DOMContentLoaded', async () => {
  // Fetch field definitions & initial projects
  const [fields, projects] = await Promise.all([fetchFields(), fetchProjects()]);

  // 2. Expose fields globally for importProjects.js
  window._PROJECT_FIELDS = fields;

  // Render table header & body
  renderTable(fields, projects);

  // Wire Add Project button to open the modal
  document.getElementById('btnAddProject')
    .addEventListener('click', () => openProjectModal(fields));

  // Handle form submission
  document.getElementById('projectForm')
    .addEventListener('submit', async e => {
      e.preventDefault();
      await submitProjectForm(fields);
      const updated = await fetchProjects();
      renderTable(fields, updated);
      bootstrap.Modal.getInstance(document.getElementById('projectModal')).hide();
    });
    // After setting up add/save handlers
const table = document.getElementById('projectsTable');
table.addEventListener('click', async e => {
  const tr = e.target.closest('tr');
  if (!tr) return;
  const id = tr.dataset.id;

  // DELETE
  if (e.target.classList.contains('btn-delete')) {
    if (!confirm('Delete this project?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    const updated = await fetchProjects();
    renderTable(window._PROJECT_FIELDS, updated);
    return;
  }

  // EDIT
  if (e.target.classList.contains('btn-edit')) {
    // Prefill and open the modal
    const project = (await fetch(`/api/projects/${id}`)).json();
    window.editingProjectId = id;
    openProjectModal(window._PROJECT_FIELDS, project);
  }
});
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
  // Header
  const headerRow = document.getElementById('projectsHeader');
  headerRow.innerHTML = fields.map(f =>
    `<th>${f.label}</th>`
  ).join('') + '<th>Actions</th>';

  // Body
  const body = document.getElementById('projectsBody');
  body.innerHTML = projects.map(p => {
    const cells = fields.map(f =>
      `<td>${formatValue(p[f.fieldKey], f)}</td>`
    ).join('');
    return `<tr data-id="${p.id}">${cells}
      <td>
        <!-- placeholder for Edit/Delete -->
        <button class="btn btn-sm btn-outline-primary me-1">Edit</button>
        <button class="btn btn-sm btn-outline-danger">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

function formatValue(value, field) {
  if (field.type === 'date' || field.type === 'time') {
    return value ? new Date(value).toLocaleString() : '';
  }
  if (field.type === 'multi-select' && Array.isArray(value)) {
    return value.join(', ');
  }
  return value ?? '';
}

function openProjectModal(fields) {
  // Set modal title
  document.querySelector('#projectModal .modal-title').innerText = 'Add Project';

  // Build form inputs
  const container = document.getElementById('projectFormFields');
  container.innerHTML = ''; // clear

  fields.forEach(f => {
    let inputHtml = '';
    const name = f.fieldKey;
    const label = f.label;
    const opts = f.options || [];

    switch (f.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'time':
        inputHtml = `<input
          name="${name}"
          type="${f.type}"
          class="form-control mb-3"
          placeholder="${label}"
          ${f.type==='number'?'step="any"':''}
        >`;
        break;
      case 'dropdown':
        inputHtml = `<select name="${name}" class="form-select mb-3">
          <option value="">Select ${label}</option>
          ${opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
        </select>`;
        break;
      case 'multi-select':
        inputHtml = `<select
          name="${name}"
          class="form-select mb-3"
          multiple
        >
          ${opts.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
        </select>`;
        break;
    }

    container.insertAdjacentHTML('beforeend', `
      <div class="mb-2">
        <label class="form-label">${label}</label>
        ${inputHtml}
      </div>
    `);
  });

  // Show the modal
  new bootstrap.Modal(document.getElementById('projectModal')).show();
}

async function submitProjectForm(fields) {
  const form = document.getElementById('projectForm');
  const data = {};

  fields.forEach(f => {
    const el = form.elements[f.fieldKey];
    if (!el) return;
    if (f.type === 'multi-select') {
      data[f.fieldKey] = Array.from(el.selectedOptions).map(o => o.value);
    } else {
      data[f.fieldKey] = el.value;
    }
  });

  await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

