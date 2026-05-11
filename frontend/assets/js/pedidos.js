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
        <td colspan="5" class="text-center text-muted">No hay pedidos registrados</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista.map(p => `
    <tr>
      <td>${p.id ?? "-"}</td>
      <td>${p.clienteNombre ?? p.observacion ?? "-"}</td>
      <td>S/ ${Number(p.total ?? 0).toFixed(2)}</td>
      <td>${renderEstado(p.estado)}</td>
      <td>${formatearFecha(p.createdAt)}</td>
    </tr>
  `).join("");
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
        <td colspan="5" class="text-center text-muted">No se encontraron pedidos</td>
      </tr>
    `;
    return;
  }

  renderTablaPedidos(filtrados);
}

function renderEstado(estado) {
  if (estado === "PENDIENTE") {
    return `<span class="badge bg-warning text-dark">Pendiente</span>`;
  }

  if (estado === "PREPARACION") {
    return `<span class="badge bg-primary">Producción</span>`;
  }

  if (estado === "LISTO") {
    return `<span class="badge bg-success">Listo</span>`;
  }

  return `<span class="badge bg-secondary">${estado ?? "Sin estado"}</span>`;
}

function formatearFecha(fecha) {
  if (!fecha) return "-";

  const d = new Date(fecha);

  if (isNaN(d.getTime())) return fecha;

  return d.toLocaleString();
}