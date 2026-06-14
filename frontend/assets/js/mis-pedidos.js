const STEPS_RECOJO = [
  { key: "PENDIENTE",   label: "Recibido",           icon: "bi-receipt" },
  { key: "PREPARACION", label: "En preparación",     icon: "bi-egg-fried" },
  { key: "LISTO",       label: "Listo para recoger", icon: "bi-bag-check" },
  { key: "ENTREGADO",   label: "Entregado",          icon: "bi-check2-circle" },
];

const STEPS_DELIVERY = [
  { key: "PENDIENTE",   label: "Recibido",         icon: "bi-receipt" },
  { key: "PREPARACION", label: "En preparación",   icon: "bi-egg-fried" },
  { key: "LISTO",       label: "Listo para enviar",icon: "bi-bag-check" },
  { key: "EN_CAMINO",   label: "En camino",        icon: "bi-scooter" },
  { key: "ENTREGADO",   label: "Entregado",        icon: "bi-check2-circle" },
];

let _misPedidosRefreshTimer = null;

function iniciarMisPedidos() {
  const cliente = obtenerClienteWeb();
  const buscarBox = document.getElementById("buscarPedidoBox");

  if (cliente && cliente.clienteId) {
    cargarPedidosCliente(cliente.clienteId);
  } else {
    if (buscarBox) buscarBox.classList.remove("d-none");
    cargarPedidosInvitado();
  }

  _misPedidosRefreshTimer = setInterval(() => {
    if (cliente && cliente.clienteId) {
      cargarPedidosCliente(cliente.clienteId);
    } else {
      cargarPedidosInvitado();
    }
  }, 30000);
}

async function cargarPedidosCliente(clienteId) {
  try {
    const pedidos = await apiFetch(`/api/pedidos/cliente/${clienteId}`);
    renderPedidos(pedidos);
  } catch (e) {
    mostrarErrorPedidos();
  }
}

async function cargarPedidosInvitado() {
  const ids = obtenerHistorialPedidosWeb();
  if (ids.length === 0) {
    renderPedidos([]);
    return;
  }

  try {
    const pedidos = await Promise.all(
      ids.map(id => apiFetch(`/api/pedidos/seguimiento/${id}`).catch(() => null))
    );
    renderPedidos(pedidos.filter(p => p !== null));
  } catch (e) {
    mostrarErrorPedidos();
  }
}

async function buscarPedidoPorId() {
  const input = document.getElementById("inputBuscarPedido");
  const msg = document.getElementById("buscarPedidoMsg");
  const id = parseInt(input?.value);

  if (!id || id <= 0) {
    msg.className = "small mt-2 text-danger";
    msg.textContent = "Ingresa un número de pedido válido.";
    return;
  }

  msg.className = "small mt-2 text-muted";
  msg.textContent = "Buscando...";

  try {
    await apiFetch(`/api/pedidos/seguimiento/${id}`);
    agregarPedidoAlHistorial(id);
    msg.textContent = "";
    cargarPedidosInvitado();
  } catch (e) {
    msg.className = "small mt-2 text-danger";
    msg.textContent = "No encontramos un pedido con ese número.";
  }
}

function renderPedidos(pedidos) {
  const cont = document.getElementById("listaPedidos");
  if (!cont) return;

  if (!pedidos || pedidos.length === 0) {
    cont.innerHTML = `
      <div class="empty-pedidos">
        <i class="bi bi-receipt" style="font-size:2.5rem;"></i>
        <p class="mt-3 mb-0">Todavía no tienes pedidos registrados.</p>
        <a href="catalogo.html" class="btn btn-outline-brand btn-sm mt-3">Ver catálogo</a>
      </div>`;
    return;
  }

  const ordenados = [...pedidos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  cont.innerHTML = ordenados.map(cardPedido).join("");
}

function mostrarErrorPedidos() {
  const cont = document.getElementById("listaPedidos");
  if (!cont) return;
  cont.innerHTML = `
    <div class="empty-pedidos text-danger">
      <i class="bi bi-exclamation-circle"></i>
      <p class="mt-3 mb-0">No se pudieron cargar tus pedidos.</p>
    </div>`;
}

function formatearFecha(fecha) {
  if (!fecha) return "";
  return new Date(fecha).toLocaleString("es-PE", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
}

function estadoBadge(estado) {
  if (estado === "CANCELADO") return `<span class="badge-pedido badge-cancelado">Cancelado</span>`;
  if (estado === "ENTREGADO") return `<span class="badge-pedido badge-entregado">Entregado</span>`;
  return `<span class="badge-pedido badge-en-progreso">En progreso</span>`;
}

function indiceActual(estado, steps) {
  if (estado === "ENTREGADO") return steps.length - 1;
  const mapa = { PENDIENTE: 0, PARCIAL: 1, PREPARACION: 1, LISTO: 2, EN_CAMINO: 3 };
  const idx = mapa[estado] ?? 0;
  return Math.min(idx, steps.length - 1);
}

function renderTimeline(p) {
  const steps = p.tipoOrigen === "DELIVERY" ? STEPS_DELIVERY : STEPS_RECOJO;
  const idx = indiceActual(p.estado, steps);

  return `<div class="pedido-timeline">
    ${steps.map((s, i) => {
      const cls = i < idx ? "completed" : (i === idx ? "active" : "");
      return `<div class="timeline-step ${cls}">
        <div class="ts-line"></div>
        <div class="ts-circle"><i class="bi ${s.icon}"></i></div>
        ${s.label}
      </div>`;
    }).join("")}
  </div>`;
}

function cardPedido(p) {
  const estadoKey = (p.estado || "").toLowerCase();
  const items = (p.detalles || [])
    .map(d => `<li><span>${d.cantidad}x ${d.productoNombre}</span><span>S/ ${Number(d.subtotal ?? 0).toFixed(2)}</span></li>`)
    .join("");

  let dirHTML = "";
  if (p.tipoOrigen === "DELIVERY") {
    const obs = p.observacion || "";
    const partes = obs.split("|").map(s => s.trim());
    const dir = partes.find(s => s.startsWith("Dir:"))?.replace("Dir:", "").trim() || null;
    const gps = partes.find(s => s.startsWith("GPS:"))?.replace("GPS:", "").trim() || null;

    if (dir) {
      const mapsUrl = gps
        ? `https://maps.google.com/?q=${gps}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`;

      dirHTML = `<div class="pedido-dir">
        <i class="bi bi-house me-1"></i>${dir}
        &nbsp;·&nbsp;
        <a href="${mapsUrl}" target="_blank" class="maps-link-pedido"><i class="bi bi-geo-alt-fill me-1"></i>Ver en mapa</a>
      </div>`;
    }
  }

  const timelineHTML = p.estado === "CANCELADO" ? "" : renderTimeline(p);

  return `
    <div class="pedido-card estado-${estadoKey}">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div>
          <div class="pedido-id">Pedido #${p.id}</div>
          <div class="pedido-fecha">${formatearFecha(p.createdAt)}</div>
        </div>
        ${estadoBadge(p.estado)}
      </div>
      ${timelineHTML}
      ${items ? `<ul class="pedido-items">${items}</ul>` : ""}
      ${dirHTML}
      <div class="d-flex justify-content-end mt-3">
        <span class="pedido-total">Total: S/ ${Number(p.total ?? 0).toFixed(2)}</span>
      </div>
    </div>`;
}
