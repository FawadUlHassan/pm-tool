console.log('✅ importProjects.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const importModal = new bootstrap.Modal('#importProjectsModal');
  const csvInput    = document.getElementById('projectsCsvInput');
  const mappingsEl  = document.getElementById('csvMappings');
  const previewEl   = document.getElementById('csvPreview');

  document.getElementById('btnImportProjects')
    .addEventListener('click', () => {
      document.getElementById('importProjectsForm').reset();
      document.getElementById('csvMappingContainer').style.display = 'none';
      mappingsEl.innerHTML = '';
      previewEl.querySelector('thead').innerHTML = '';
      previewEl.querySelector('tbody').innerHTML = '';
      importModal.show();
    });

  csvInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      preview: 5,
      skipEmptyLines: true,
      complete: results => {
        const cols  = results.meta.fields;
        const rows  = results.data;
        mappingsEl.innerHTML = '';
        window._PROJECT_FIELDS.forEach(f => {
          const sel = document.createElement('select');
          sel.className = 'form-select';
          sel.dataset.key = f.fieldKey;
          sel.innerHTML = ['<option value="">Ignore</option>']
            .concat(cols.map(c => `<option>${c}</option>`))
            .join('');
          const wrapper = document.createElement('div');
          wrapper.className = 'col-md-4 mb-2';
          wrapper.innerHTML = `<label class="form-label">${f.label}</label>`;
          wrapper.appendChild(sel);
          mappingsEl.appendChild(wrapper);
        });
        previewEl.querySelector('thead').innerHTML =
          `<tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr>`;
        previewEl.querySelector('tbody').innerHTML =
          rows.map(r => `<tr>${cols.map(c=>`<td>${r[c]||''}</td>`).join('')}</tr>`).join('');
        document.getElementById('csvMappingContainer').style.display = 'block';
      }
    });
  });

  document.getElementById('importProjectsForm')
    .addEventListener('submit', e => {
      e.preventDefault();
      const file = csvInput.files[0];
      if (!file) return alert('Select a CSV file first.');
      const mapping = {};
      mappingsEl.querySelectorAll('select').forEach(sel => {
        if (sel.value) mapping[sel.dataset.key] = sel.value;
      });
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async results => {
          const toImport = results.data.map(row => {
            const obj = {};
            Object.entries(mapping).forEach(([key,col]) => {
              obj[key] = row[col];
            });
            return obj;
          });
          await fetch('/api/projects/bulk', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(toImport),
          });
          // Refresh table
          const refreshed = await fetchProjects();
          renderTable(window._PROJECT_FIELDS, refreshed);
          importModal.hide();
        }
      });
    });
});
