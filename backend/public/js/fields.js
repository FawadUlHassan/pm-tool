// public/js/fields.js
console.log('✅ fields.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  // instantiate with element references
  const fieldsModal   = new bootstrap.Modal(document.getElementById('fieldsModal'));
  const addFieldModal = new bootstrap.Modal(document.getElementById('addFieldModal'));
  const importModal   = new bootstrap.Modal(document.getElementById('importFieldsModal'));

  document.getElementById('btnManageFields')
    .addEventListener('click', async () => {
      await loadAndRenderFields();
      fieldsModal.show();
    });

  document.getElementById('btnAddField')
    .addEventListener('click', () => {
      document.getElementById('addFieldForm').reset();
      document.getElementById('fieldOptionsContainer').style.display = 'none';
      addFieldModal.show();
    });

  document.getElementById('btnImportFields')
    .addEventListener('click', () => {
      document.getElementById('importFieldsForm').reset();
      importModal.show();
    });

  // Toggle options textarea only for dropdown/multi-select
  document.querySelector('select[name=type]').addEventListener('change', e => {
    const show = ['dropdown','multi-select'].includes(e.target.value);
    document.getElementById('fieldOptionsContainer').style.display = show ? 'block' : 'none';
  });

  // Handle Add Field form submit
  document.getElementById('addFieldForm').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      fieldKey:  form.fieldKey.value.trim(),
      label:     form.label.value.trim(),
      type:      form.type.value,
      options:   [],
      sortOrder: parseInt(form.sortOrder.value, 10) || 0
    };
    if (['dropdown','multi-select'].includes(payload.type)) {
      payload.options = form.options.value
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          const [value,label] = line.split(':').map(s=>s.trim());
          return { value, label: label||value };
        });
    }
    await fetch('/api/fields', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    addFieldModal.hide();
    await loadAndRenderFields();
  });

  // Handle Import Fields form submit
  document.getElementById('importFieldsForm').addEventListener('submit', async e => {
    e.preventDefault();
    const raw = e.target.json.value;
    let defs;
    try {
      defs = JSON.parse(raw);
    } catch (err) {
      return alert('Invalid JSON');
    }
    await fetch('/api/fields/bulk', {
      method: 'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(defs)
    });
    importModal.hide();
    await loadAndRenderFields();
  });

  // Load & render fields into the table
  async function loadAndRenderFields() {
    const resp = await fetch('/api/fields');
    const fields = await resp.json();
    const tbody = document.querySelector('#fieldsTable tbody');
    tbody.innerHTML = fields.map(f => `
      <tr>
        <td>${f.fieldKey}</td>
        <td>${f.label}</td>
        <td>${f.type}</td>
        <td>${
          (f.options||[])
            .map(o=>`${o.value}:${o.label}`)
            .join('<br>')
        }</td>
        <td>${f.sortOrder}</td>
      </tr>
    `).join('');
  }
});

