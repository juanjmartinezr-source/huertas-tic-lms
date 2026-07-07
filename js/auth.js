// Manejo simple de autenticación usando json/users.json y LocalStorage
async function fetchUsers(){
  try{
    const res = await fetch('json/users.json');
    if(!res.ok) throw new Error('No se pudo cargar users.json');
    return await res.json();
  }catch(e){
    console.error(e);
    return [];
  }
}

async function loginFormHandler(event){
  event.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  const err = document.getElementById('error');
  err.textContent = '';

  const users = await fetchUsers();
  const user = users.find(x => x.username === u && x.password === p);
  if(!user){
    err.textContent = 'Usuario o contraseña incorrectos.';
    return;
  }
  localStorage.setItem('hti_user', JSON.stringify(user));
  // ejemplo: inicializar progreso si no existe
  if(!user.progress) user.progress = { percent: 0, activities: [] };
  localStorage.setItem('hti_user', JSON.stringify(user));
  // Redirigir según rol
  location.href = 'dashboard.html';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  if(form) form.addEventListener('submit', loginFormHandler);
  const demo = document.getElementById('demoBtn');
  if(demo) demo.addEventListener('click', async () => {
    // auto-login a un estudiante demo 4321 si existe
    const users = await fetchUsers();
    const demoUser = users.find(u => u.username === '4321') || users[0];
    localStorage.setItem('hti_user', JSON.stringify(demoUser));
    location.href = 'dashboard.html';
  });
});

function getCurrentUser(){
  try{
    return JSON.parse(localStorage.getItem('hti_user'));
  }catch(e){
    return null;
  }
}

function logout(){
  localStorage.removeItem('hti_user');
}
