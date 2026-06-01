const ROL_ACCESO = {
  ADMIN:       ['dashboard.html','productos.html','ingredientes.html','recetas.html','pedidos.html','produccion.html','pos.html','movimientos.html','usuarios.html','clientes.html','repartidor.html'],
  VENTAS:      ['pos.html','productos.html','pedidos.html','movimientos.html','clientes.html'],
  COCINA:      ['produccion.html','ingredientes.html','recetas.html','movimientos.html'],
  REPARTIDOR:  ['repartidor.html']
};

function getLoggedUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function getRol() {
  return getLoggedUser()?.rol ?? null;
}

function renderUserInfo() {
  const user = getLoggedUser();
  const el = document.getElementById("userInfo");
  if (!el) return;
  if (user) {
    const rolLabel = { ADMIN: 'Admin', VENTAS: 'Ventas', COCINA: 'Cocina', REPARTIDOR: 'Repartidor' };
    el.textContent = (user.nombre ?? 'Usuario') + ' · ' + (rolLabel[user.rol] ?? user.rol ?? '');
  }
}

function filtrarNavPorRol() {
  const rol = getRol();
  if (!rol) return;

  document.querySelectorAll('.sidebar-group[data-roles]').forEach(group => {
    const roles = group.dataset.roles.split(',');
    if (!roles.includes(rol)) {
      group.style.display = 'none';
    }
  });
}

function initSidebar() {
  const page = window.location.pathname.split('/').pop() || 'dashboard.html';

  document.querySelectorAll('.sidebar-sub .nav-link').forEach(link => {
    if (link.getAttribute('href') === page) {
      link.classList.add('active');
      // Auto-expand the parent group
      const collapse = link.closest('.collapse');
      if (collapse) {
        collapse.classList.add('show');
        const btn = document.querySelector('[data-bs-target="#' + collapse.id + '"]');
        if (btn) btn.classList.remove('collapsed');
      }
    }
  });
}

function verificarAccesoPagina() {
  const rol = getRol();
  if (!rol) return;

  const pagina = window.location.pathname.split('/').pop() || 'index.html';
  if (pagina === 'index.html') return;

  const permitidos = ROL_ACCESO[rol] ?? [];
  if (!permitidos.includes(pagina)) {
    const home = { ADMIN: 'dashboard.html', VENTAS: 'pos.html', COCINA: 'produccion.html', REPARTIDOR: 'repartidor.html' };
    window.location.href = home[rol] || 'dashboard.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderUserInfo();
  filtrarNavPorRol();
  initSidebar();
  verificarAccesoPagina();
});

// Efecto ripple en botones primarios
document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-brand, .btn-outline-brand');
  if (!btn || btn.disabled) return;
  const wave = document.createElement('span');
  wave.className = 'ripple-wave';
  const r = btn.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2;
  wave.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
  btn.appendChild(wave);
  wave.addEventListener('animationend', () => wave.remove());
});
