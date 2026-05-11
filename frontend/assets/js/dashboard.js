requireAuth();

const ESTADO_BADGE = {
  PENDIENTE:   'bg-warning text-dark',
  PREPARACION: 'bg-info text-dark',
  LISTO:       'bg-success',
  ENTREGADO:   'bg-secondary',
  CANCELADO:   'bg-danger'
};

const ORIGEN_LABEL = {
  PRESENCIAL: 'Tienda',
  WHATSAPP:   'WhatsApp',
  WEB:        'Web',
  TIENDA:     'Tienda'
};

document.addEventListener("DOMContentLoaded", async () => {
  const hoy = new Date();
  document.getElementById("fechaHoy").textContent =
    hoy.toLocaleDateString("es-PE", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  try {
    const data = await apiFetch("/api/dashboard");

    // Ingresos
    document.getElementById("ventasHoy").textContent = `S/ ${Number(data.ventasHoy ?? 0).toFixed(2)}`;
    document.getElementById("ventasMes").textContent = `S/ ${Number(data.ventasMes ?? 0).toFixed(2)}`;
    document.getElementById("pedidosHoy").textContent =
      `${data.pedidosHoy ?? 0} pedido${data.pedidosHoy === 1 ? '' : 's'}`;

    // Pedidos en curso
    document.getElementById("pedidosPendientes").textContent = data.pedidosPendientes ?? 0;
    document.getElementById("pedidosPreparacion").textContent = data.pedidosPreparacion ?? 0;
    document.getElementById("pedidosListos").textContent = data.pedidosListos ?? 0;

    // Operaciones
    document.getElementById("totalProductos").textContent = data.totalProductos ?? 0;
    document.getElementById("totalIngredientes").textContent = data.totalIngredientes ?? 0;
    document.getElementById("produccionesActivas").textContent = data.produccionesActivas ?? 0;
    document.getElementById("productosStockBajo").textContent = data.productosStockBajo ?? 0;
    document.getElementById("ingredientesStockBajo").textContent = data.ingredientesStockBajo ?? 0;

    // Pedidos recientes
    renderPedidosRecientes(data.pedidosRecientes ?? []);

  } catch (error) {
    console.error("Error cargando dashboard:", error);
  }
});

function renderPedidosRecientes(lista) {
  const tbody = document.getElementById("tablaPedidosRecientes");
  if (!lista.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Sin ventas registradas aún</td></tr>';
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const hora = p.createdAt
      ? new Date(p.createdAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })
      : "—";
    const badgeClass = ESTADO_BADGE[p.estado] ?? 'bg-secondary';

    return `
      <tr>
        <td class="text-muted">#${p.id}</td>
        <td>${p.clienteNombre ?? '—'}</td>
        <td><span class="badge bg-light text-dark border">${ORIGEN_LABEL[p.tipoOrigen] ?? p.tipoOrigen}</span></td>
        <td class="fw-semibold">S/ ${Number(p.total ?? 0).toFixed(2)}</td>
        <td><span class="badge ${badgeClass}">${p.estado}</span></td>
        <td class="text-muted">${hora}</td>
      </tr>
    `;
  }).join("");
}
