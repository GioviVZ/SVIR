let clientesData = [];

async function cargarClientes() {
  try {
    clientesData = await apiFetch('/api/clientes');
    renderTablaClientes(clientesData);
  } catch (e) {
    document.getElementById('tablaClientes').innerHTML =
      '<tr><td colspan="9" class="text-center text-danger">' + e.message + '</td></tr>';
  }
}

function renderTablaClientes(lista) {
  const tbody = document.getElementById('tablaClientes');
  if (!lista || !lista.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Sin clientes registrados</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(c => {
    const emailCell = c.email
      ? '<a href="mailto:' + c.email + '" class="text-muted text-decoration-none small">' + c.email + '</a>'
      : '—';
    const estadoBadge = c.activo
      ? '<span class="badge bg-success">Activo</span>'
      : '<span class="badge bg-danger">Inactivo</span>';
    const btnEstado = c.activo
      ? '<button class="btn btn-sm btn-outline-danger" onclick="toggleActivo(' + c.id + ', true)">Desactivar</button>'
      : '<button class="btn btn-sm btn-outline-success" onclick="toggleActivo(' + c.id + ', false)">Activar</button>';

    return '<tr>' +
      '<td>' + c.id + '</td>' +
      '<td class="fw-semibold">' + (c.nombre ?? '') + '</td>' +
      '<td>' + (c.dni ?? '—') + '</td>' +
      '<td>' + (c.ruc ?? '—') + '</td>' +
      '<td>' + (c.telefono ?? '—') + '</td>' +
      '<td>' + emailCell + '</td>' +
      '<td class="text-muted small">' + (c.direccion ?? '—') + '</td>' +
      '<td>' + estadoBadge + '</td>' +
      '<td class="text-end">' +
        '<button class="btn btn-sm btn-outline-secondary me-1" onclick="editarCliente(' + c.id + ')">Editar</button>' +
        '<button class="btn btn-sm btn-outline-warning me-1" onclick="abrirModalResetClave(' + c.id + ', \'' + (c.nombre ?? '') + '\')" title="Restablecer contraseña"><i class="bi bi-key"></i></button>' +
        btnEstado +
      '</td>' +
      '</tr>';
  }).join('');
}

function prepararNuevo() {
  document.getElementById('clienteModalTitle').textContent = 'Nuevo Cliente';
  document.getElementById('clienteForm').reset();
  document.getElementById('clienteId').value = '';
}

function editarCliente(id) {
  const c = clientesData.find(x => x.id === id);
  if (!c) return;

  document.getElementById('clienteModalTitle').textContent = 'Editar Cliente';
  document.getElementById('clienteId').value = c.id;
  document.getElementById('nombreCliente').value = c.nombre ?? '';
  document.getElementById('dniCliente').value = c.dni ?? '';
  document.getElementById('rucCliente').value = c.ruc ?? '';
  document.getElementById('telefonoCliente').value = c.telefono ?? '';
  document.getElementById('emailCliente').value = c.email ?? '';
  document.getElementById('direccionCliente').value = c.direccion ?? '';

  new bootstrap.Modal(document.getElementById('clienteModal')).show();
}

async function toggleActivo(id, activo) {
  try {
    await apiFetch('/api/clientes/' + id + '/activo?activo=' + !activo, { method: 'PATCH' });
    await cargarClientes();
  } catch (e) {
    alert(e.message);
  }
}

function abrirModalResetClave(id, nombre) {
  document.getElementById('resetClaveClienteId').value = id;
  document.getElementById('resetClaveClienteNombre').textContent = nombre;
  document.getElementById('resetClaveForm').reset();
  document.getElementById('resetClaveMensaje').textContent = '';
  new bootstrap.Modal(document.getElementById('resetClaveModal')).show();
}

async function confirmarResetClave() {
  const id = document.getElementById('resetClaveClienteId').value;
  const password = document.getElementById('resetClavePassword').value.trim();
  const confirm = document.getElementById('resetClaveConfirm').value.trim();
  const msgEl = document.getElementById('resetClaveMensaje');

  msgEl.className = 'small mt-2';
  msgEl.textContent = '';

  if (password.length < 6) {
    msgEl.className = 'small mt-2 text-danger';
    msgEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    return;
  }
  if (password !== confirm) {
    msgEl.className = 'small mt-2 text-danger';
    msgEl.textContent = 'Las contraseñas no coinciden.';
    return;
  }

  const btn = document.getElementById('btnConfirmarResetClave');
  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    await apiFetch('/api/clientes/' + id + '/resetear-clave', {
      method: 'PATCH',
      body: JSON.stringify({ password })
    });
    bootstrap.Modal.getInstance(document.getElementById('resetClaveModal')).hide();
    alert('Contraseña restablecida exitosamente.');
  } catch (e) {
    msgEl.className = 'small mt-2 text-danger';
    msgEl.textContent = e.message || 'Error al restablecer la contraseña.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Restablecer';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  cargarClientes();

  document.getElementById('clienteForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('clienteId').value;

    const nombre = document.getElementById('nombreCliente').value.trim();
    const dni = document.getElementById('dniCliente').value.trim();
    const ruc = document.getElementById('rucCliente').value.trim();
    const email = document.getElementById('emailCliente').value.trim();

    if (nombre.length < 2) { alert('El nombre debe tener al menos 2 caracteres.'); return; }
    if (!/^\d{8}$/.test(dni)) { alert('El DNI debe tener exactamente 8 dígitos numéricos.'); return; }
    if (ruc && !/^\d{11}$/.test(ruc)) { alert('El RUC debe tener exactamente 11 dígitos numéricos.'); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Ingresa un email válido.'); return; }

    const payload = {
      nombre,
      dni,
      ruc: ruc || null,
      telefono: document.getElementById('telefonoCliente').value.trim() || null,
      email: email || null,
      direccion: document.getElementById('direccionCliente').value.trim() || null,
      activo: true
    };

    try {
      if (id) {
        await apiFetch('/api/clientes/' + id, { method: 'PUT', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/clientes', { method: 'POST', body: JSON.stringify(payload) });
      }
      bootstrap.Modal.getInstance(document.getElementById('clienteModal')).hide();
      await cargarClientes();
    } catch (e) {
      alert(e.message);
    }
  });

  document.getElementById('buscarCliente').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtrados = clientesData.filter(c =>
      (c.nombre ?? '').toLowerCase().includes(q) ||
      (c.dni ?? '').includes(q) ||
      (c.ruc ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.telefono ?? '').includes(q) ||
      (c.direccion ?? '').toLowerCase().includes(q)
    );
    renderTablaClientes(filtrados);
  });
});
