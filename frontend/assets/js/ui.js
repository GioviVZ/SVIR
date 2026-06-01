const ROL_ACCESO = {
  ADMIN:       ['dashboard.html','productos.html','ingredientes.html','recetas.html','pedidos.html','produccion.html','pos.html','movimientos.html','usuarios.html','clientes.html','repartidor.html'],
  VENTAS:      ['pos.html','productos.html','pedidos.html','clientes.html'],
  COCINA:      ['produccion.html','ingredientes.html','recetas.html'],
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
    el.innerHTML = `<button class="btn btn-link btn-sm p-0 text-muted text-decoration-none" style="font-size:.85rem;"
      data-bs-toggle="modal" data-bs-target="#modalCambiarPass">
      <i class="bi bi-person-circle me-1"></i>${user.nombre ?? 'Usuario'} · ${rolLabel[user.rol] ?? user.rol ?? ''}
    </button>`;
  }
  inyectarModalCambiarPass();
}

function inyectarModalCambiarPass() {
  if (document.getElementById('modalCambiarPass')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal fade" id="modalCambiarPass" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius:16px;border:none;">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold"><i class="bi bi-key-fill me-2 text-warning"></i>Cambiar contraseña</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label small fw-semibold">Contraseña actual</label>
              <input type="password" id="cpActual" class="form-control" placeholder="••••••••">
            </div>
            <div class="mb-3">
              <label class="form-label small fw-semibold">Nueva contraseña</label>
              <input type="password" id="cpNueva" class="form-control" placeholder="Mínimo 6 caracteres">
            </div>
            <div class="mb-3">
              <label class="form-label small fw-semibold">Confirmar nueva contraseña</label>
              <input type="password" id="cpConfirm" class="form-control" placeholder="Repite la nueva contraseña">
            </div>
            <div id="cpError" class="alert alert-danger py-2 small d-none"></div>
            <div id="cpSuccess" class="alert alert-success py-2 small d-none">
              <i class="bi bi-check-circle-fill me-1"></i>Contraseña actualizada correctamente.
            </div>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-warning btn-sm fw-semibold" onclick="cambiarPasswordPerfil()">
              <span id="cpBtnLabel">Guardar cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `);
  document.getElementById('modalCambiarPass').addEventListener('hidden.bs.modal', () => {
    document.getElementById('cpActual').value = '';
    document.getElementById('cpNueva').value = '';
    document.getElementById('cpConfirm').value = '';
    document.getElementById('cpError').classList.add('d-none');
    document.getElementById('cpSuccess').classList.add('d-none');
    document.getElementById('cpBtnLabel').textContent = 'Guardar cambios';
  });
}

async function cambiarPasswordPerfil() {
  const actual  = document.getElementById('cpActual').value;
  const nueva   = document.getElementById('cpNueva').value;
  const confirm = document.getElementById('cpConfirm').value;
  const errEl   = document.getElementById('cpError');
  const okEl    = document.getElementById('cpSuccess');
  const btnLbl  = document.getElementById('cpBtnLabel');
  errEl.classList.add('d-none');
  okEl.classList.add('d-none');
  if (!actual || !nueva || !confirm) {
    errEl.textContent = 'Completa todos los campos.'; errEl.classList.remove('d-none'); return;
  }
  if (nueva.length < 6) {
    errEl.textContent = 'La nueva contraseña debe tener al menos 6 caracteres.'; errEl.classList.remove('d-none'); return;
  }
  if (nueva !== confirm) {
    errEl.textContent = 'Las contraseñas no coinciden.'; errEl.classList.remove('d-none'); return;
  }
  btnLbl.textContent = 'Guardando...';
  try {
    await apiFetch('/api/auth/cambiar-password', {
      method: 'PATCH',
      body: JSON.stringify({ passwordActual: actual, passwordNueva: nueva })
    });
    okEl.classList.remove('d-none');
    document.getElementById('cpActual').value = '';
    document.getElementById('cpNueva').value = '';
    document.getElementById('cpConfirm').value = '';
  } catch (e) {
    errEl.textContent = e.message || 'Error al cambiar la contraseña.';
    errEl.classList.remove('d-none');
  } finally { btnLbl.textContent = 'Guardar cambios'; }
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
  if (pagina === 'index.html' || pagina === 'login.html') return;

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
