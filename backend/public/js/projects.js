// public/js/projects.js
console.log('✅ projects.js loaded');

document.addEventListener('DOMContentLoaded', async () => {
  // 1️⃣ Fetch schema & data
  let fields = await fetchFields();
  const savedOrder = await fetch('/api/column-order').then(r => r.json());
  if (savedOrder.length) {
    fields = savedOrder
      .map(key => fields.find(f => f.fieldKey === key))
      .filter(Boolean)
      .concat(fields.filter(f => !savedOrder.includes(f.fieldKey)));
  }
  const projects = await fetchProjects();
  window._PROJECT_FIELDS = fields;

  // 2️⃣ Render the editable grid
  renderTable(fields, projects);

  // 3️⃣ Initialize column drag & drop
  Sortable.create(document.getElementById('projectsHeader'), {
    animation: 150,
    handle: '.drag-handle',
    onEnd: async () => {
      const newOrder = Array.from(
        document.querySelectorAll('#projectsHeader th[data-key]')
      ).map(th => th.dataset.key);
      await fetch('/api/column-order', {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ order: newOrder }),
      });
    },
  });

  // 4️⃣ Wire inline cell updates
  delegateCellChange();

  // 5️⃣ Wire Add/Edit/Delete modal handlers
  wireAddEditHandlers(fields);

  // 6️⃣ Wire bulk‑delete
  wireBulkDeleteHandler();
});

async function fetchFields() {
  const res = await fetch('/api/fields');
  return res.json();
}

async function fetchProjects() {
  const res = await fetch('/api/projects');
  return res.json();
}

function renderTable(fields, projects) {
  // Header
  document.getElementById('projectsHeader').innerHTML = `
    <th><input type="checkbox" id="selectAll"></th>
    ${fields.map(f => `
      <th data-key="${f.fieldKey}">
        <i class="bi bi-grip-vertical drag-handle me-1" style="cursor:move"></i>
        ${f.label}
      </th>`).join('')}
    <th>Actions</th>
  `;

  // Body
  document.getElementById('projectsBody').innerHTML = projects.map(p => {
    const id = p.id;
    const cells = fields.map(f => {
      const val = p[f.fieldKey] ?? '';
      if (['number','text','date','time'].includes(f.type)) {
        return `<td>
          <input
            class="form-control cell-input"
            data-id="${id}" data-key="${f.fieldKey}"
            type="${f.type}" value="${val}"
          >
        </td>`;
      }
      if (f.type === 'dropdown') {
        return `<td>
          <select class="form-select cell-input" data-id="${id}" data-key="${f.fieldKey}">
            <option value="">––</option>
            ${f.options.map(o => `
              <option value="${o.value}" ${o.value===val?'selected':''}>
                ${o.label}
              </option>`).join('')}
          </select>
        </td>`;
      }
      if (f.type === 'multi-select') {
        const sel = Array.isArray(val) ? val : [];
        return `<td>
          <select
            class="form-select cell-input"
            data-id="${id}" data-key="${f.fieldKey}"
            multiple
          >
            ${f.options.map(o => `
              <option value="${o.value}" ${sel.includes(o.value)?'selected':''}>
                ${o.label}
              </option>`).join('')}
          </select>
        </td>`;
      }
      return `<td>${val}</td>`;
    }).join('');

    return `
      <tr data-id="${id}">
        <td><input type="checkbox" class="selectRow"></td>
        ${cells}
        <td>
          <button class="btn btn-sm btn-outline-primary btn-edit me-1">Edit</button>
          <button class="btn btn-sm btn-outline-danger btn-delete">Delete</button>
        </td>
      </tr>
    `;
  }).join('');

  // Select‑all wiring
  document.getElementById('selectAll').addEventListener('change', e => {
    document.querySelectorAll('.selectRow').forEach(cb => cb.checked = e.target.checked);
    updateBulkDeleteButton();
  });
  document.querySelectorAll('.selectRow').forEach(cb =>
    cb.addEventListener('change', updateBulkDeleteButton)
  );
}

function delegateCellChange() {
  document.getElementById('projectsTable').addEventListener('change', async e => {
    const el = e.target;
    if (!el.classList.contains('cell-input')) return;

    const id  = el.dataset.id;
    const key = el.dataset.key;
    let val   = el.value;
    if (el.multiple) {
      val = Array.from(el.selectedOptions).map(o => o.value);
    }

    try {
      await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ [key]: val })
      });
      el.classList.add('border-success');
      setTimeout(() => el.classList.remove('border-success'), 800);
    } catch {
      el.classList.add('border-danger');
    }
  });
}

function wireAddEditHandlers(fields) {
  // Add Project
  document.getElementById('btnAddProject')
    .addEventListener('click', () => openProjectModal(fields, null));

  // Edit/Delete in Table
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
        const res = await fetch(`/api/projects/${id}`);
        const project = await res.json();
        openProjectModal(fields, project);
      }
    });

  // Modal form submit
  document.getElementById('projectForm')
    .addEventListener('submit', async e => {
      e.preventDefault();
      const data   = collectFormData(fields);
      const isEdit = Boolean(window.editingProjectId);
      const url    = isEdit
        ? `/api/projects/${window.editingProjectId}`
        : '/api/projects';
      const method = isEdit ? 'PUT' : 'POST';

      await fetch(url, {
        method,
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });

      await refreshTable(fields);
      window.editingProjectId = null;
      bootstrap.Modal.getOrCreateInstance(
        document.getElementById('projectModal')
      ).hide();
    });
}

function wireBulkDeleteHandler() {
  document.getElementById('btnDeleteSelected')
    .addEventListener('click', async () => {
      if (!confirm('Delete all selected projects?')) return;
      const ids = Array.from(document.querySelectorAll('.selectRow'))
        .filter(cb => cb.checked)
        .map(cb => cb.closest('tr').dataset.id);

      await fetch('/api/projects/bulk-delete', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ids })
      });
      await refreshTable(window._PROJECT_FIELDS);
    });
}

function updateBulkDeleteButton() {
  const any = Array.from(document.querySelectorAll('.selectRow'))
    .some(cb => cb.checked);
  document.getElementById('btnDeleteSelected').disabled = !any;
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
    data[f.fieldKey] = el.multiple
      ? Array.from(el.selectedOptions).map(o => o.value)
      : el.value;
  });
  return data;
}

function openProjectModal(fields, project = null) {
  const modalEl = document.getElementById('projectModal');
  const modal   = bootstrap.Modal.getOrCreateInstance(modalEl);
  const form    = document.getElementById('projectForm');

  form.reset();
  window.editingProjectId = project?.id || null;
  document.querySelector('#projectModal .modal-title').innerText =
    project ? 'Edit Project' : 'Add Project';

  const container = document.getElementById('projectFormFields');
  container.innerHTML = '';
  fields.forEach(f => {
    const val = project ? project[f.fieldKey] : '';
    let inputHtml = '';

    if (['number','text','date','time'].includes(f.type)) {
      inputHtml = `<input
        name="${f.fieldKey}"
        type="${f.type}"
        class="form-control mb-3"
        placeholder="${f.label}"
        value="${val}"
        ${f.type==='number'?'step="any"':''}
      >`;
    } else if (f.type === 'dropdown') {
      inputHtml = `<select name="${f.fieldKey}" class="form-select mb-3">
        <option value="">Select ${f.label}</option>
        ${f.options.map(o => `
          <option value="${o.value}" ${o.value===val?'selected':''}>
            ${o.label}
          </option>`).join('')}
      </select>`;
    } else if (f.type === 'multi-select') {
      const sel = Array.isArray(val) ? val : [];
      inputHtml = `<select name="${f.fieldKey}" class="form-select mb-3" multiple>
        ${f.options.map(o => `
          <option value="${o.value}" ${sel.includes(o.value)?'selected':''}>
            ${o.label}
          </option>`).join('')}
      </select>`;
    } else {
      inputHtml = `<input
        name="${f.fieldKey}"
        type="text"
        class="form-control mb-3"
        placeholder="${f.label}"
        value="${val}"
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

