requireAuth();

let produccionesData = [];
let productosData = [];
let produccionModal;
let terminarModal;
let produccionActual = null;

document.addEventListener("DOMContentLoaded", async () => {
  produccionModal = new bootstrap.Modal(document.getElementById("produccionModal"));
  terminarModal = new bootstrap.Modal(document.getElementById("terminarModal"));

  document.getElementById("produccionForm").addEventListener("submit", guardarProduccion);
  document.getElementById("buscarProduccion").addEventListener("input", filtrarProducciones);

  await cargarProductosProduccion();
  await cargarProducciones();
});

async function cargarProductosProduccion() {
  try {
    const productos = await apiFetch("/api/productos");
    productosData = productos || [];

    const select = document.getElementById("productoProduccion");
    select.innerHTML = `<option value="">Seleccione</option>`;

    productosData.forEach(p => {
      select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });
  } catch (error) {
    console.error("Error cargando productos:", error);
    alert("No se pudieron cargar los productos");
  }
}

async function cargarProducciones() {
  const tbody = document.getElementById("tablaProducciones");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Cargando producciones...</td></tr>`;

  try {
    const producciones = await apiFetch("/api/producciones");
    produccionesData = producciones || [];
    renderTablaProducciones(produccionesData);
  } catch (error) {
    console.error("Error cargando producciones:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar producciones</td></tr>`;
  }
}

function renderTablaProducciones(lista) {
  const tbody = document.getElementById("tablaProducciones");

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No hay producciones registradas</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const detalle = p.detalles && p.detalles.length > 0 ? p.detalles[0] : null;
    let accion;
    if (p.estado === "EN_PROCESO") {
      accion = `
        <div class="d-flex gap-1 justify-content-end">
          <button class="btn btn-sm btn-success" onclick='abrirTerminarModal(${JSON.stringify(p)})'>
            <i class="bi bi-check-lg me-1"></i>Terminar
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="cancelarProduccion(${p.id})">
            <i class="bi bi-x-circle me-1"></i>Cancelar
          </button>
        </div>`;
    } else {
      accion = `<span class="text-muted small">—</span>`;
    }

    return `
      <tr>
        <td>${p.id ?? "-"}</td>
        <td>${p.tipo ?? "-"}</td>
        <td>${detalle?.productoNombre ?? "-"}</td>
        <td>${detalle?.cantidadPlanificada ?? 0}</td>
        <td>${detalle?.cantidadProducida ?? 0}</td>
        <td>${renderEstadoProduccion(p.estado)}</td>
        <td class="text-end">${accion}</td>
      </tr>
    `;
  }).join("");
}

function filtrarProducciones() {
  const texto = document.getElementById("buscarProduccion").value.trim().toLowerCase();

  const filtrados = produccionesData.filter(p => {
    const detalle = p.detalles && p.detalles.length > 0 ? p.detalles[0] : null;

    return (
      String(p.id ?? "").toLowerCase().includes(texto) ||
      String(p.tipo ?? "").toLowerCase().includes(texto) ||
      String(p.estado ?? "").toLowerCase().includes(texto) ||
      String(detalle?.productoNombre ?? "").toLowerCase().includes(texto)
    );
  });

  if (filtrados.length === 0) {
    document.getElementById("tablaProducciones").innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No se encontraron producciones</td>
      </tr>
    `;
    return;
  }

  renderTablaProducciones(filtrados);
}

async function guardarProduccion(e) {
  e.preventDefault();

  const productoId = parseInt(document.getElementById("productoProduccion").value, 10);
  const cantidadPlanificada = parseInt(document.getElementById("cantidadProduccion").value, 10);
  const observacion = document.getElementById("observacionProduccion")?.value.trim() || "Producción desde frontend";

  if (!productoId) { alert("Selecciona un producto."); return; }
  if (!cantidadPlanificada || cantidadPlanificada < 1 || cantidadPlanificada > 9999) {
    alert("La cantidad debe estar entre 1 y 9999.");
    return;
  }

  const payload = {
    observacion,
    detalles: [
      {
        productoId,
        cantidadPlanificada
      }
    ]
  };

  try {
    await apiFetch("/api/producciones", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    document.getElementById("produccionForm").reset();
    produccionModal.hide();

    await cargarProducciones();
  } catch (error) {
    console.error("Error guardando producción:", error);

    const mensaje = typeof error === "object"
      ? (error.message || JSON.stringify(error))
      : error;

    alert(mensaje || "No se pudo registrar la producción");
  }
}

function abrirTerminarModal(produccion) {
  produccionActual = produccion;

  const body = document.getElementById("terminarModalBody");

  const detalles = produccion.detalles || [];

  body.innerHTML = `
    <p class="text-muted mb-3">Ingresa la cantidad real producida para cada producto:</p>
    ${detalles.map(d => `
      <div class="mb-3">
        <label class="form-label fw-semibold">${d.productoNombre}</label>
        <div class="d-flex align-items-center gap-2">
          <small class="text-muted">Planificado: ${d.cantidadPlanificada}</small>
        </div>
        <input type="number" class="form-control mt-1"
          id="cantProd_${d.id}"
          min="0" max="${d.cantidadPlanificada}" step="1"
          value="${d.cantidadPlanificada}"
          placeholder="Cantidad producida">
      </div>
    `).join("")}
  `;

  terminarModal.show();
}

async function confirmarTerminar() {
  if (!produccionActual) return;

  let valido = true;
  const detalles = (produccionActual.detalles || []).map(d => {
    const val = parseInt(document.getElementById(`cantProd_${d.id}`).value, 10);
    if (isNaN(val) || val < 0 || val > d.cantidadPlanificada) {
      alert(`La cantidad producida de "${d.productoNombre}" debe estar entre 0 y ${d.cantidadPlanificada}.`);
      valido = false;
    }
    return { produccionDetalleId: d.id, cantidadProducida: val || 0 };
  });
  if (!valido) return;

  try {
    await apiFetch(`/api/producciones/${produccionActual.id}/terminar`, {
      method: "PATCH",
      body: JSON.stringify({ detalles })
    });

    terminarModal.hide();
    produccionActual = null;
    await cargarProducciones();
  } catch (error) {
    console.error("Error terminando producción:", error);
    alert(error.message || "No se pudo terminar la producción");
  }
}

function renderEstadoProduccion(estado) {
  const mapa = {
    PENDIENTE:   ['badge-estado-pendiente',   'Pendiente'],
    EN_PROCESO:  ['badge-estado-preparacion', 'En proceso'],
    TERMINADO:   ['badge-estado-listo',       'Terminado'],
    CANCELADO:   ['badge-estado-cancelado',   'Cancelado'],
  };
  const [cls, label] = mapa[estado] ?? ['badge-estado-entregado', estado ?? '—'];
  return `<span class="badge-estado ${cls}">${label}</span>`;
}

async function cancelarProduccion(id) {
  if (!confirm(`¿Cancelar la producción #${id}? Esta acción no se puede deshacer.`)) return;
  try {
    await apiFetch(`/api/producciones/${id}/cancelar`, { method: "PATCH" });
    await cargarProducciones();
  } catch (error) {
    alert(error.message || "No se pudo cancelar la producción");
  }
}
