// Lógica del panel docente: CRUD de módulos y adjuntar recursos (archivo -> dataURL en LocalStorage)
(function(){
  function q(sel, root=document){ return root.querySelector(sel); }
  function qa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  // Utilidades
  function uid(prefix='id'){
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8);
  }

  async function loadModules(){
    const stored = localStorage.getItem('hti_modules');
    if(stored) return JSON.parse(stored);
    // cargar desde json/modules.json
    try{
      const res = await fetch('json/modules.json');
      if(!res.ok) throw new Error('No modules JSON');
      const mods = await res.json();
      localStorage.setItem('hti_modules', JSON.stringify(mods));
      return mods;
    }catch(e){
      console.error(e);
      return [];
    }
  }

  function saveModules(mods){
    localStorage.setItem('hti_modules', JSON.stringify(mods));
  }

  function getFilesIndex(){
    try{ return JSON.parse(localStorage.getItem('hti_files')||'{}'); }catch(e){ return {}; }
  }
  function saveFilesIndex(idx){ localStorage.setItem('hti_files', JSON.stringify(idx)); }

  function renderModules(mods){
    const container = document.getElementById('modulesList');
    container.innerHTML = '';
    mods.forEach(m => {
      const article = document.createElement('article');
      article.className = 'card module';
      article.dataset.id = m.id;

      const resList = (m.resources||[]).map(r => `<li><strong>${r.title}</strong> (${r.type}) - <a href="#" data-resid="${r.id}" class="download">Descargar</a> <button class="btn tiny delete-res" data-resid="${r.id}">Eliminar</button></li>`).join('');

      article.innerHTML = `
        <h3 contenteditable='false' class='m-title'>${escapeHtml(m.title)}</h3>
        <p class='m-desc'>${escapeHtml(m.description)}</p>
        <div class="row">
          <button class="btn edit">Editar</button>
          <button class="btn danger delete">Eliminar</button>
        </div>

        <div style="margin-top:12px">
          <h4>Recursos</h4>
          <ul class="resources">${resList || '<li class="small">Sin recursos</li>'}</ul>

          <form class="attachForm" data-modid="${m.id}">
            <label>Título del recurso <input name="rTitle" required></label>
            <label>Tipo <select name="rType"><option>PDF</option><option>Video</option><option>Imagen</option><option>Enlace</option><option>Otro</option></select></label>
            <label>Archivo <input name="rFile" type="file"></label>
            <label>O URL (para enlaces) <input name="rUrl" placeholder="https://"></label>
            <div class="row" style="margin-top:6px">
              <button class="btn primary" type="submit">Adjuntar recurso</button>
            </div>
          </form>
        </div>
      `;

      container.appendChild(article);
    });

    // Eventos: editar / borrar / attach / download
    qa('.card.module .edit').forEach(btn=> btn.addEventListener('click', onEditModule));
    qa('.card.module .delete').forEach(btn=> btn.addEventListener('click', onDeleteModule));
    qa('.attachForm').forEach(f => f.addEventListener('submit', onAttachResource));
    qa('.download').forEach(a => a.addEventListener('click', onDownloadResource));
    qa('.delete-res').forEach(b => b.addEventListener('click', onDeleteResource));
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

  async function refresh(){
    const mods = await loadModules();
    renderModules(mods);
  }

  async function onEditModule(ev){
    const card = ev.target.closest('.card.module');
    const id = card.dataset.id;
    const mods = await loadModules();
    const mod = mods.find(m=>String(m.id)===String(id));
    if(!mod) return;

    // Mostrar modal inline: convertir a inputs
    const titleEl = card.querySelector('.m-title');
    const descEl = card.querySelector('.m-desc');

    const inputT = document.createElement('input'); inputT.value = mod.title; inputT.style.width='100%';
    const textarea = document.createElement('textarea'); textarea.value = mod.description; textarea.style.width='100%';

    titleEl.replaceWith(inputT);
    descEl.replaceWith(textarea);

    ev.target.textContent = 'Guardar';
    ev.target.removeEventListener('click', onEditModule);
    ev.target.addEventListener('click', async function save(){
      mod.title = inputT.value.trim() || 'Sin título';
      mod.description = textarea.value.trim();
      saveModules(mods);
      await refresh();
    });
  }

  async function onDeleteModule(ev){
    if(!confirm('Eliminar módulo? Esto también eliminará metadatos de recursos asociados (los archivos en LocalStorage permanecerán).')) return;
    const card = ev.target.closest('.card.module');
    const id = card.dataset.id;
    let mods = await loadModules();
    mods = mods.filter(m=>String(m.id)!==String(id));
    saveModules(mods);
    await refresh();
  }

  async function onAttachResource(ev){
    ev.preventDefault();
    const form = ev.target;
    const modId = form.dataset.modid;
    const title = form.rTitle.value.trim();
    const type = form.rType.value;
    const fileInput = form.rFile;
    const urlInput = form.rUrl.value.trim();

    const mods = await loadModules();
    const mod = mods.find(m=>String(m.id)===String(modId));
    if(!mod) return alert('Módulo no encontrado');

    async function finalizeResource(dataURL, filename, size){
      const files = getFilesIndex();
      const resId = uid('res');
      files[resId] = { id: resId, name: filename, type, dataURL, size, uploadedAt: new Date().toISOString() };
      saveFilesIndex(files);

      const meta = { id: resId, title, filename, type, size, uploadedAt: files[resId].uploadedAt };
      mod.resources = mod.resources || [];
      mod.resources.push(meta);
      saveModules(mods);
      await refresh();
    }

    if(urlInput && (type.toLowerCase()==='enlace' || urlInput.startsWith('http'))){
      // Save as link resource (no file)
      const resId = uid('res');
      const files = getFilesIndex();
      files[resId] = { id: resId, name: urlInput, type: 'link', dataURL: urlInput, size: 0, uploadedAt: new Date().toISOString() };
      saveFilesIndex(files);
      const meta = { id: resId, title, filename: urlInput, type: 'link', size:0, uploadedAt: files[resId].uploadedAt };
      mod.resources = mod.resources || [];
      mod.resources.push(meta);
      saveModules(mods);
      await refresh();
      return;
    }

    const file = fileInput.files[0];
    if(!file) return alert('Selecciona un archivo o indica una URL para adjuntar.');

    const reader = new FileReader();
    reader.onload = async function(e){
      const dataURL = e.target.result;
      await finalizeResource(dataURL, file.name, file.size);
    };
    reader.onerror = function(){ alert('Error leyendo el archivo'); };
    reader.readAsDataURL(file);
  }

  async function onDownloadResource(ev){
    ev.preventDefault();
    const rid = ev.target.dataset.resid;
    const files = getFilesIndex();
    const f = files[rid];
    if(!f) return alert('Recurso no encontrado (tal vez se reseteó LocalStorage).');

    // Si es link, abrir en nueva pestaña
    if(f.type === 'link' || String(f.dataURL).startsWith('http')){
      window.open(f.dataURL, '_blank');
      return;
    }

    const a = document.createElement('a');
    a.href = f.dataURL;
    a.download = f.name || 'recurso';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function onDeleteResource(ev){
    const rid = ev.target.dataset.resid;
    if(!confirm('Eliminar recurso del módulo? (El archivo permanecerá en LocalStorage)')) return;
    const mods = await loadModules();
    mods.forEach(m => {
      if(m.resources) m.resources = m.resources.filter(r=>r.id!==rid);
    });
    saveModules(mods);
    await refresh();
  }

  // Crear módulo nuevo
  async function onCreateModule(ev){
    ev.preventDefault();
    const title = q('#mTitle').value.trim();
    const desc = q('#mDesc').value.trim();
    if(!title) return alert('El módulo requiere título');
    const mods = await loadModules();
    const newMod = { id: uid('mod'), title, description: desc, resources: [] };
    mods.push(newMod);
    saveModules(mods);
    q('#moduleForm').reset();
    await refresh();
  }

  // Export / reset
  async function onExport(){
    const mods = await loadModules();
    const blob = new Blob([JSON.stringify(mods, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'modules-export.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  async function onResetModules(){
    if(!confirm('Resetear módulos desde json/modules.json? Esto sobrescribirá los módulos actuales en LocalStorage.')) return;
    localStorage.removeItem('hti_modules');
    await refresh();
  }

  async function onClearStorage(){
    if(!confirm('Eliminar módulos guardados (hti_modules) y archivos (hti_files) de LocalStorage?')) return;
    localStorage.removeItem('hti_modules');
    localStorage.removeItem('hti_files');
    await refresh();
  }

  // control acceso: solo profesor
  document.addEventListener('DOMContentLoaded', async()=>{
    const user = (function(){ try{ return JSON.parse(localStorage.getItem('hti_user')); }catch(e){ return null;} })();
    if(!user || !(user.role === 'Profesor' || user.role === 'profesor')){
      alert('Acceso restringido: Solo docentes pueden acceder a este panel');
      return window.location.href = 'dashboard.html';
    }

    document.getElementById('moduleForm').addEventListener('submit', onCreateModule);
    document.getElementById('exportBtn').addEventListener('click', onExport);
    document.getElementById('resetModules').addEventListener('click', onResetModules);
    document.getElementById('clearStorage').addEventListener('click', onClearStorage);

    await refresh();
  });

})();
