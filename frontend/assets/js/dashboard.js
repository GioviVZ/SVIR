requireAuth();

const ESTADO_BADGE = {
  PENDIENTE:   'badge-estado-pendiente',
  PREPARACION: 'badge-estado-preparacion',
  LISTO:       'badge-estado-listo',
  ENTREGADO:   'badge-estado-entregado',
  CANCELADO:   'badge-estado-cancelado',
  PARCIAL:     'badge-estado-parcial',
};

const ESTADO_LABEL = {
  PENDIENTE:   'Pendiente',
  PREPARACION: 'Preparación',
  LISTO:       'Listo',
  ENTREGADO:   'Entregado',
  CANCELADO:   'Cancelado',
  PARCIAL:     'Parcial',
};

const ORIGEN_LABEL = {
  PRESENCIAL: 'Presencial',
  WHATSAPP:   'WhatsApp',
  WEB:        'Web',
  TIENDA:     'Tienda',
};

const ORIGEN_ICON = {
  PRESENCIAL: 'bi-shop',
  WHATSAPP:   'bi-whatsapp',
  WEB:        'bi-globe',
  TIENDA:     'bi-bag-fill',
};

function calcularSaludo() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function animarMonto(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  const dur = 900, t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = `S/ ${(valor * ease).toFixed(2)}`;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function animarEntero(id, valor) {
  const el = document.getElementById(id);
  if (!el) return;
  const dur = 700, t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(valor * ease);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

document.addEventListener("DOMContentLoaded", async () => {
  const hoy = new Date();

  const saludoEl = document.getElementById("saludo");
  if (saludoEl) saludoEl.textContent = calcularSaludo();

  document.getElementById("fechaHoy").textContent =
    hoy.toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  try {
    const data = await apiFetch("/api/dashboard");

    const ventasHoy = Number(data.ventasHoy ?? 0);
    const ventasMes = Number(data.ventasMes ?? 0);

    animarMonto("ventasHoy", ventasHoy);
    animarMonto("ventasMes", ventasMes);

    const nPedHoy = data.pedidosHoy ?? 0;
    document.getElementById("pedidosHoy").textContent =
      `${nPedHoy} pedido${nPedHoy === 1 ? '' : 's'} hoy`;

    animarEntero("pedidosPendientes",   data.pedidosPendientes   ?? 0);
    animarEntero("pedidosPreparacion",  data.pedidosPreparacion  ?? 0);
    animarEntero("pedidosListos",       data.pedidosListos       ?? 0);
    animarEntero("totalProductos",      data.totalProductos      ?? 0);
    animarEntero("totalIngredientes",   data.totalIngredientes   ?? 0);
    animarEntero("produccionesActivas", data.produccionesActivas ?? 0);

    const stockBajoP = data.productosStockBajo ?? 0;
    const stockBajoI = data.ingredientesStockBajo ?? 0;
    document.getElementById("productosStockBajo").textContent = stockBajoP;
    document.getElementById("ingredientesStockBajo").textContent = stockBajoI;

    if (stockBajoP > 0) document.getElementById("productosStockBajo").classList.add("text-warning");
    if (stockBajoI > 0) document.getElementById("ingredientesStockBajo").classList.add("text-warning");

    renderPedidosRecientes(data.pedidosRecientes ?? []);

  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
});

function renderPedidosRecientes(lista) {
  const tbody = document.getElementById("tablaPedidosRecientes");
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Sin ventas registradas aún</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map((p, i) => {
    const hora = p.createdAt
      ? new Date(p.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
      : "—";
    const badgeClass = ESTADO_BADGE[p.estado] ?? 'badge-estado-pendiente';
    const origenIcon = ORIGEN_ICON[p.tipoOrigen] ?? 'bi-question-circle';
    const origenLabel = ORIGEN_LABEL[p.tipoOrigen] ?? p.tipoOrigen;

    return `
      <tr style="animation: fadeSlideUp 0.35s ease both; animation-delay: ${i * 40}ms">
        <td class="text-muted fw-semibold">#${p.id}</td>
        <td>${p.clienteNombre ?? '<span class="text-muted">—</span>'}</td>
        <td>
          <span class="badge-origen">
            <i class="bi ${origenIcon}"></i> ${origenLabel}
          </span>
        </td>
        <td class="fw-bold">S/ ${Number(p.total ?? 0).toFixed(2)}</td>
        <td><span class="badge-estado ${badgeClass}">${ESTADO_LABEL[p.estado] ?? p.estado}</span></td>
        <td class="text-muted small">${hora}</td>
      </tr>
    `;
  }).join("");
}
