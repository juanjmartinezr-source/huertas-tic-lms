// Lógica básica para herramienta ¿Qué puedo sembrar?
async function loadCrops(){
  try{
    const res = await fetch('json/crops.json');
    return await res.json();
  }catch(e){
    console.error('No se pudo cargar crops.json', e);
    return [];
  }
}

function fitsRange(value, range){
  if(range == null) return true;
  if(typeof range === 'object'){
    if(range.min != null && value < range.min) return false;
    if(range.max != null && value > range.max) return false;
  }
  return true;
}

function renderResults(matches, notMatches){
  const container = document.getElementById('results');
  container.innerHTML = '';
  if(matches.length===0) container.innerHTML = '<p class="card">No se encontraron cultivos recomendados.</p>';
  matches.forEach(c => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `<h3>${c.name} <small class="small">${c.scientific || ''}</small></h3>
      <div class="row"><img src="${c.image || 'assets/placeholder.png'}" alt="${c.name}" style="width:96px;height:64px;object-fit:cover;border-radius:6px;margin-right:8px"/><div>
      <p><strong>Temp:</strong> ${c.temperature?.min || '-'}–${c.temperature?.max || '-'} °C</p>
      <p><strong>Altitud:</strong> ${c.altitude?.min || '-'}–${c.altitude?.max || '-'} m</p>
      <p><strong>Humedad:</strong> ${c.humidity?.min || '-'}–${c.humidity?.max || '-'} %</p>
      </div></div>
      <p>${c.recommendations || ''}</p>
    `;
    container.appendChild(el);
  });

  if(notMatches.length){
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `<h3>Cultivos no recomendados</h3>`;
    notMatches.forEach(n => {
      const p = document.createElement('p');
      p.innerHTML = `<strong>${n.name}:</strong> ${n.reason}`;
      el.appendChild(p);
    });
    container.appendChild(el);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const crops = await loadCrops();
  const form = document.getElementById('plantForm');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const alt = Number(document.getElementById('altitud').value || 0);
    const temp = Number(document.getElementById('temperatura').value || 0);
    const hum = Number(document.getElementById('humedad').value || 0);

    const matches = [];
    const notMatches = [];
    crops.forEach(c => {
      const okTemp = fitsRange(temp, c.temperature);
      const okAlt = fitsRange(alt, c.altitude);
      const okHum = fitsRange(hum, c.humidity);
      if(okTemp && okAlt && okHum) matches.push(c);
      else {
        // razón simple
        const reasons = [];
        if(!okTemp) reasons.push('Temperatura fuera de rango');
        if(!okAlt) reasons.push('Altitud fuera de rango');
        if(!okHum) reasons.push('Humedad fuera de rango');
        notMatches.push({ name: c.name, reason: reasons.join(', ') });
      }
    });

    renderResults(matches, notMatches);
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    form.reset();
    document.getElementById('results').innerHTML = '';
  });
});
