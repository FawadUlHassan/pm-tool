console.log('✅ importFieldsCsv.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  const csvModal    = new bootstrap.Modal('#importFieldsCsvModal');
  const fileInput   = document.getElementById('fieldsCsvInput');
  const mapContainer= document.getElementById('fieldsCsvMappingContainer');
  const mappingsEl  = document.getElementById('fieldsCsvMappings');

  // 1. Open modal
  document.getElementById('btnImportFieldsCsv')
    .addEventListener('click', () => {
      document.getElementById('importFieldsCsvForm').reset();
      mapContainer.style.display = 'none';
      mappingsEl.innerHTML = '';
      csvModal.show();
    });

  // 2. When a CSV is chosen, parse headers
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      preview: 1,
      skipEmptyLines: true,
      complete: results => {
        const cols = results.meta.fields;  // header names
        mappingsEl.innerHTML = '';

        cols.forEach(col => {
          // Build the mapping row
          const wrapper = document.createElement('div');
          wrapper.className = 'row align-items-end';

          // Column label
          const lbl = document.createElement('div');
          lbl.className = 'col-md-4';
          lbl.innerHTML = `<strong>${col}</strong>`;
          wrapper.appendChild(lbl);

          // Field Key (auto-slug from column)
          const keyIn = document.createElement('input');
          keyIn.className = 'form-control';
          keyIn.name = 'fieldKey';
          keyIn.value = col.trim().toLowerCase().replace(/\s+/g,'_');
          wrapper.appendChild(
            (() => { const d=document.createElement('div'); d.className='col-md-2'; d.appendChild(keyIn); return d; })()
          );

          // Label
          const labIn = document.createElement('input');
          labIn.className = 'form-control';
          labIn.name = 'label';
          labIn.value = col;
          wrapper.appendChild(
            (() => { const d=document.createElement('div'); d.className='col-md-3'; d.appendChild(labIn); return d; })()
          );

          // Type selector
          const types = [
            'number','text','textarea','dropdown','multi-select',
            'date','time','boolean','email','url','currency'
          ];
          const sel = document.createElement('select');
          sel.className = 'form-select';
          sel.name = 'type';
          sel.innerHTML = types.map(t => `<option value="${t}">${t}</option>`).join('');
          wrapper.appendChild(
            (() => { const d=document.createElement('div'); d.className='col-md-2'; d.appendChild(sel); return d; })()
          );

          // Options textarea (hidden unless dropdown/multi-select)
          const optsTa = document.createElement('textarea');
          optsTa.className = 'form-control';
          optsTa.name = 'options';
          optsTa.placeholder = 'value:label per line';
          optsTa.style.display = 'none';
          wrapper.appendChild(
            (() => { const d=document.createElement('div'); d.className='col-md-12 mt-2'; d.appendChild(optsTa); return d; })()
          );

          // Hook type change
          sel.addEventListener('change', () => {
            optsTa.style.display = ['dropdown','multi-select'].includes(sel.value) ? 'block' : 'none';
          });

          mappingsEl.appendChild(wrapper);
          mappingsEl.appendChild(document.createElement('hr'));
        });

        mapContainer.style.display = 'block';
      }
    });
  });

  // 3. On submit, collect mappings & POST
  document.getElementById('importFieldsCsvForm')
    .addEventListener('submit', async e => {
      e.preventDefault();
      const defs = [];
      const rows = mappingsEl.querySelectorAll('.row');
      rows.forEach(row => {
        const fieldKey = row.querySelector('input[name=fieldKey]').value.trim();
        const label    = row.querySelector('input[name=label]').value.trim();
        const type     = row.querySelector('select[name=type]').value;
        let options = [];
        if (['dropdown','multi-select'].includes(type)) {
          const raw = row.querySelector('textarea[name=options]').value;
          options = raw.split('\n')
            .map(l=>l.trim())
            .filter(Boolean)
            .map(line => {
              let [v,lbl] = line.split(':').map(s=>s.trim());
              return { value:v, label: lbl||v };
            });
        }
        defs.push({ fieldKey, label, type, options, sortOrder: 0 });
      });
      // POST to /api/fields/bulk
      await fetch('/api/fields/bulk', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(defs),
      });
      // Refresh fields table
      const refreshed = await fetch('/api/fields');
      const tbody = document.querySelector('#fieldsTable tbody');
      tbody.innerHTML = refreshed.map(f => ` 
        <tr>
          <td>${f.fieldKey}</td>
          <td>${f.label}</td>
          <td>${f.type}</td>
          <td>${
  	    (f.options||[])
    	      .map(o => `${o.value}:${o.label}`)
    	      .join('<br>')
	  }</td>
	  <td>${f.sortOrder}</td>
        </tr>
      `).join('');
      csvModal.hide();
    });
});
