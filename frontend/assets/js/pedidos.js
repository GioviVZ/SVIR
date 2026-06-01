requireAuth();

let productos = [];
let pedidosData = [];
let pedidoModal;

document.addEventListener("DOMContentLoaded", async () => {
  pedidoModal = new bootstrap.Modal(document.getElementById("pedidoModal"));

  document.getElementById("pedidoForm").addEventListener("submit", guardarPedido);
  document.getElementById("cantidadPedido").addEventListener("input", calcularTotal);
  document.getElementById("productoPedido").addEventListener("change", calcularTotal);
  document.getElementById("buscarPedido").addEventListener("input", filtrarPedidos);

  await cargarProductos();
  await cargarPedidos();
});

async function cargarProductos() {
  try {
    productos = await apiFetch("/api/productos");

    const select = document.getElementById("productoPedido");
    select.innerHTML = `<option value="">Seleccione</option>`;

    (productos || []).forEach(p => {
      select.innerHTML += `
        <option value="${p.id}" data-precio="${p.precio}">
          ${p.nombre} - S/ ${Number(p.precio ?? 0).toFixed(2)}
        </option>
      `;
    });
  } catch (error) {
    console.error("Error cargando productos:", error);
    alert("No se pudieron cargar los productos");
  }
}

function calcularTotal() {
  const cantidad = parseFloat(document.getElementById("cantidadPedido").value) || 0;
  const select = document.getElementById("productoPedido");
  const precio = parseFloat(select.options[select.selectedIndex]?.dataset?.precio || 0);

  document.getElementById("totalPedido").value = (cantidad * precio).toFixed(2);
}

async function guardarPedido(e) {
  e.preventDefault();

  const productoId = parseInt(document.getElementById("productoPedido").value, 10);
  const cantidad = parseInt(document.getElementById("cantidadPedido").value, 10);
  const observacion = document.getElementById("cliente").value.trim();
  const tipoOrigen = document.getElementById("tipoOrigenPedido").value;

  if (!productoId) { alert("Selecciona un producto."); return; }
  if (!cantidad || cantidad < 1 || cantidad > 9999) { alert("La cantidad debe estar entre 1 y 9999."); return; }
  if (!tipoOrigen) { alert("Selecciona el origen del pedido."); return; }

  const payload = {
    tipoOrigen,
    observacion,
    detalles: [{ productoId, cantidad }]
  };

  try {
    await apiFetch("/api/pedidos", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    document.getElementById("pedidoForm").reset();
    pedidoModal.hide();

    await cargarPedidos();
  } catch (error) {
    console.error("Error guardando pedido:", error);
    alert(error.message || "No se pudo guardar el pedido");
  }
}

async function cargarPedidos() {
  const tbody = document.getElementById("tablaPedidos");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Cargando pedidos...</td></tr>`;

  try {
    const pedidos = await apiFetch("/api/pedidos");
    pedidosData = pedidos || [];
    renderTablaPedidos(pedidosData);
  } catch (error) {
    console.error("Error cargando pedidos:", error);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar pedidos</td></tr>`;
  }
}

function renderTablaPedidos(lista) {
  const tbody = document.getElementById("tablaPedidos");

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No hay pedidos registrados</td>
      </tr>
    `;
    return;
  }

  const cancelables = ["PENDIENTE", "PARCIAL", "PREPARACION", "LISTO", "EN_CAMINO"];
  const entregables = ["LISTO", "EN_CAMINO"];

  tbody.innerHTML = lista.map(p => {
    const puedeCancel    = cancelables.includes(p.estado);
    const puedeEntregar  = entregables.includes(p.estado);
    const esDelivery     = p.tipoOrigen === "DELIVERY";
    const puedeEnCamino  = esDelivery && p.estado === "LISTO";

    const btnEnCamino = puedeEnCamino
      ? `<button class="btn btn-sm btn-warning me-1" onclick="marcarEnCamino(${p.id})">
           <i class="bi bi-scooter me-1"></i>En camino
         </button>`
      : "";

    const btnEntregar = puedeEntregar && !puedeEnCamino
      ? `<button class="btn btn-sm btn-success me-1" onclick="marcarEntregado(${p.id})">
           <i class="bi bi-bag-check me-1"></i>Entregar
         </button>`
      : "";

    const btnCancelar = puedeCancel
      ? `<button class="btn btn-sm btn-outline-danger" onclick="cancelarPedido(${p.id})">
           <i class="bi bi-x-circle me-1"></i>Cancelar
         </button>`
      : "";

    const acciones = (btnEnCamino || btnEntregar || btnCancelar)
      ? `<div class="d-flex gap-1 justify-content-end">${btnEnCamino}${btnEntregar}${btnCancelar}</div>`
      : `<span class="text-muted small">—</span>`;

    const clienteInfo = p.clienteNombre ?? (p.observacion ? p.observacion.split('|').pop().trim() : "—");
    let deliveryInfo = "";
    if (esDelivery && p.observacion) {
      const partes = p.observacion.split('|').map(s => s.trim());
      const dirPart = partes.find(s => s.startsWith("Dir:")) ?? "";
      const telPart = partes.find(s => s.startsWith("Tel:")) ?? "";
      const gpsPart = partes.find(s => s.startsWith("GPS:"));
      const mapsLink = gpsPart
        ? ` <a href="https://maps.google.com/?q=${gpsPart.replace("GPS:", "").trim()}" target="_blank" title="Ver en mapa" style="color:#6d28d9;"><i class="bi bi-geo-alt-fill"></i></a>`
        : "";
      deliveryInfo = `<div class="text-muted" style="font-size:0.75rem;">${dirPart}${telPart ? " | " + telPart : ""}${mapsLink}</div>`;
    }

    return `
      <tr>
        <td class="text-muted fw-semibold">#${p.id ?? "-"}</td>
        <td>${clienteInfo}${deliveryInfo}</td>
        <td>${renderCanal(p.tipoOrigen)}</td>
        <td class="fw-semibold">S/ ${Number(p.total ?? 0).toFixed(2)}</td>
        <td>${renderEstado(p.estado)}</td>
        <td class="text-muted small">${formatearFecha(p.createdAt)}</td>
        <td class="text-end">${acciones}</td>
      </tr>
    `;
  }).join("");
}

function filtrarPedidos() {
  const texto = document.getElementById("buscarPedido").value.trim().toLowerCase();

  const filtrados = pedidosData.filter(p =>
    String(p.id ?? "").toLowerCase().includes(texto) ||
    String(p.clienteNombre ?? p.observacion ?? "").toLowerCase().includes(texto) ||
    String(p.estado ?? "").toLowerCase().includes(texto) ||
    String(p.total ?? "").toLowerCase().includes(texto)
  );

  if (filtrados.length === 0) {
    document.getElementById("tablaPedidos").innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-muted">No se encontraron pedidos</td>
      </tr>
    `;
    return;
  }

  renderTablaPedidos(filtrados);
}

function renderCanal(origen) {
  const mapa = {
    PRESENCIAL: { icon: 'bi-shop',          label: 'Presencial', cls: 'canal-presencial' },
    TIENDA:     { icon: 'bi-bag-fill',      label: 'Tienda',     cls: 'canal-tienda'    },
    WHATSAPP:   { icon: 'bi-whatsapp',      label: 'WhatsApp',   cls: 'canal-whatsapp'  },
    WEB:        { icon: 'bi-globe',         label: 'Web',        cls: 'canal-web'       },
    DELIVERY:   { icon: 'bi-scooter',       label: 'Delivery',   cls: 'canal-delivery'  },
  };
  const { icon, label, cls } = mapa[origen] ?? { icon: 'bi-question-circle', label: origen ?? '—', cls: '' };
  return `<span class="badge-canal ${cls}"><i class="bi ${icon} me-1"></i>${label}</span>`;
}

function renderEstado(estado) {
  const mapa = {
    PENDIENTE:   ['badge-estado-pendiente',   'Pendiente'],
    PARCIAL:     ['badge-estado-parcial',     'Parcial'],
    PREPARACION: ['badge-estado-preparacion', 'En preparación'],
    LISTO:       ['badge-estado-listo',       'Listo'],
    EN_CAMINO:   ['badge-estado-en-camino',   'En camino'],
    ENTREGADO:   ['badge-estado-entregado',   'Entregado'],
    CANCELADO:   ['badge-estado-cancelado',   'Cancelado'],
  };
  const [cls, label] = mapa[estado] ?? ['badge-estado-entregado', estado ?? '—'];
  return `<span class="badge-estado ${cls}">${label}</span>`;
}

async function marcarEnCamino(id) {
  if (!confirm(`¿Marcar el pedido #${id} como "En camino"?`)) return;
  try {
    await apiFetch(`/api/pedidos/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado: "EN_CAMINO" })
    });
    await cargarPedidos();
  } catch (error) {
    alert(error.message || "No se pudo actualizar el estado.");
  }
}

async function marcarEntregado(id) {
  if (!confirm(`¿Confirmar entrega del pedido #${id}?`)) return;
  try {
    await apiFetch(`/api/pedidos/${id}/estado`, {
      method: "PATCH",
      body: JSON.stringify({ estado: "ENTREGADO" })
    });
    await cargarPedidos();
  } catch (error) {
    alert(error.message || "No se pudo marcar como entregado");
  }
}

async function cancelarPedido(id) {
  if (!confirm(`¿Cancelar el pedido #${id}? Esta acción no se puede deshacer.`)) return;
  try {
    await apiFetch(`/api/pedidos/${id}/cancelar`, { method: "PATCH" });
    await cargarPedidos();
  } catch (error) {
    alert(error.message || "No se pudo cancelar el pedido");
  }
}

function formatearFecha(fecha) {
  if (!fecha) return "-";

  const d = new Date(fecha);

  if (isNaN(d.getTime())) return fecha;

  return d.toLocaleString();
}