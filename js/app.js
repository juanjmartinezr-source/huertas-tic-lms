// Utilidades globales: tema, loader, etc.
function setTheme(theme){
  if(theme === 'dark') document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  localStorage.setItem('hti_theme', theme);
}
function toggleTheme(){
  const current = localStorage.getItem('hti_theme') === 'dark' ? 'dark' : 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}
document.addEventListener('DOMContentLoaded', () => {
  const theme = localStorage.getItem('hti_theme') || 'light';
  setTheme(theme);

  // loader simple
  const loader = document.getElementById('loader');
  if(loader) setTimeout(()=>{ loader.style.display='none'; document.body.classList.remove('loaded');}, 600);
});
