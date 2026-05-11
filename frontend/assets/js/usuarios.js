let usuariosData = [];

const ROLES = [
  {
    key: 'ADMIN',
    label: 'Administradores',
    desc: 'Acceso completo al sistema',
    icon: 'bi-shield-fill-check',
    cls: 'admin'
  },
  {
    key: 'VENTAS',
    label: 'Ventas',
    desc: 'Pedidos, clientes y punto de venta',
    icon: 'bi-bag-fill',
    cls: 'ventas'
  },
  {
    key: 'COCINA',
    label: 'Cocina',
    desc: 'Producción, recetas e ingredientes',
    icon: 'bi-fire',
    cls: 'cocina'
  }
];

async function cargarUsuarios() {
  try {
    usuariosData = await apiFetch('/api/usuarios');
    renderUsuarios(usuariosData);
  } catch (e) {
    document.getElementById('usuariosContainer').innerHTML =
      '<p class="text-center text-danger py-4">' + e.message + '</p>';
  }
}

function renderUsuarios(lista) {
  const container = document.getElementById('usuariosContainer');

  if (!lista || !lista.length) {
    container.innerHTML = '<p class="text-center text-muted py-5">No se encontraron usuarios.</p>';
    return;
  }

  container.innerHTML = ROLES.map(rol => {
    const users = lista.filter(u => u.rol === rol.key);
    if (users.length === 0) return '';

    const usersHTML = users.map(u => {
      const inicial = (u.nombre || '?').charAt(0).toUpperCase();
      const estadoBadge = u.activo
        ? '<span class="badge bg-success-subtle text-success-emphasis">Activo</span>'
        : '<span class="badge bg-danger-subtle text-danger-emphasis">Inactivo</span>';
      const btnEstado = u.activo
        ? '<button class="btn btn-sm btn-outline-danger" onclick="toggleActivo(' + u.id + ', true)">Desactivar</button>'
        : '<button class="btn btn-sm btn-outline-success" onclick="toggleActivo(' + u.id + ', false)">Activar</button>';

      return '<div class="user-card">' +
        '<div class="user-avatar user-avatar-' + rol.cls + '">' + inicial + '</div>' +
        '<div class="flex-grow-1 min-width-0">' +
          '<div class="fw-semibold text-truncate">' + u.nombre + '</div>' +
          '<div class="text-muted text-truncate" style="font-size:0.78rem;">' + u.email + '</div>' +
        '</div>' +
        '<div class="d-flex align-items-center gap-2 flex-shrink-0">' +
          estadoBadge +
          '<button class="btn btn-sm btn-outline-secondary" onclick="editarUsuario(' + u.id + ')"><i class="bi bi-pencil"></i></button>' +
          btnEstado +
        '</div>' +
      '</div>';
    }).join('');

    const count = users.length;

    return '<div class="role-section">' +
      '<div class="role-section-header role-' + rol.cls + '">' +
        '<div class="role-section-icon"><i class="bi ' + rol.icon + '"></i></div>' +
        '<div>' +
          '<div class="fw-bold">' + rol.label + '</div>' +
          '<div class="role-section-desc">' + rol.desc + '</div>' +
        '</div>' +
        '<span class="role-count-badge">' + count + ' ' + (count === 1 ? 'usuario' : 'usuarios') + '</span>' +
      '</div>' +
      '<div class="role-users-grid">' + usersHTML + '</div>' +
    '</div>';
  }).join('');
}

function prepararNuevo() {
  document.getElementById('usuarioModalTitle').textContent = 'Nuevo Usuario';
  document.getElementById('usuarioForm').reset();
  document.getElementById('usuarioId').value = '';
  document.getElementById('passwordHint').style.display = 'none';
  document.getElementById('passwordUsuario').required = true;
}

function editarUsuario(id) {
  const u = usuariosData.find(x => x.id === id);
  if (!u) return;

  document.getElementById('usuarioModalTitle').textContent = 'Editar Usuario';
  document.getElementById('usuarioId').value = u.id;
  document.getElementById('nombreUsuario').value = u.nombre;
  document.getElementById('emailUsuario').value = u.email;
  document.getElementById('passwordUsuario').value = '';
  document.getElementById('passwordUsuario').required = false;
  document.getElementById('passwordHint').style.display = '';
  document.getElementById('rolUsuario').value = u.rol;

  new bootstrap.Modal(document.getElementById('usuarioModal')).show();
}

async function toggleActivo(id, activo) {
  try {
    await apiFetch('/api/usuarios/' + id + '/activo?activo=' + !activo, { method: 'PATCH' });
    await cargarUsuarios();
  } catch (e) {
    alert(e.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarUsuarios();

  document.getElementById('usuarioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('usuarioId').value;
    const nombre = document.getElementById('nombreUsuario').value.trim();
    const email = document.getElementById('emailUsuario').value.trim();
    const password = document.getElementById('passwordUsuario').value;
    const rol = document.getElementById('rolUsuario').value;

    if (nombre.length < 2) { alert('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!email.includes('@')) { alert('Ingresa un email válido.'); return; }
    if (!rol) { alert('Selecciona un rol.'); return; }
    if (!id && !password) { alert('La contraseña es obligatoria al crear un usuario.'); return; }
    if (password && password.length < 6) { alert('La contraseña debe tener al menos 6 caracteres.'); return; }

    const payload = { nombre, email, rol, activo: true };
    if (password) payload.password = password;

    try {
      if (id) {
        await apiFetch('/api/usuarios/' + id, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/usuarios', { method: 'POST', body: JSON.stringify(payload) });
      }
      bootstrap.Modal.getInstance(document.getElementById('usuarioModal')).hide();
      await cargarUsuarios();
    } catch (e) {
      alert(e.message);
    }
  });

  document.getElementById('buscarUsuario').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtrados = usuariosData.filter(u =>
      u.nombre.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.rol ?? '').toLowerCase().includes(q)
    );
    renderUsuarios(filtrados);
  });
});
