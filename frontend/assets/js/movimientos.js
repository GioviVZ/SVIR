requireAuth();

let movimientosData = [];

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("buscarMovimiento").addEventListener("input", filtrarMovimientos);
  await cargarMovimientos();
});

async function cargarMovimientos() {
  const tbody = document.getElementById("tablaMovimientos");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Cargando movimientos...</td></tr>`;

  try {
    const [productos, ingredientes] = await Promise.all([
      apiFetch("/api/movimientos/productos"),
      apiFetch("/api/movimientos/ingredientes")
    ]);

    movimientosData = [
      ...(productos || []).map(m => ({ ...m, _fuente: "producto" })),
      ...(ingredientes || []).map(m => ({ ...m, _fuente: "ingrediente" }))
    ];

    renderTablaMovimientos(movimientosData);
  } catch (error) {
    console.error("Error cargando movimientos:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar movimientos</td></tr>`;
  }
}

function renderTablaMovimientos(lista) {
  const tbody = document.getElementById("tablaMovimientos");

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No hay movimientos registrados</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = lista.map(m => `
    <tr>
      <td>${m.id ?? "-"}</td>
      <td>${renderTipoMovimiento(m.tipo)}</td>
      <td>${obtenerReferenciaMovimiento(m)}</td>
      <td>${m.cantidad ?? 0}</td>
      <td>${m.motivo ?? "-"}</td>
      <td>${m.usuarioNombre ?? "-"}</td>
    </tr>
  `).join("");
}

function filtrarMovimientos() {
  const texto = document.getElementById("buscarMovimiento").value.trim().toLowerCase();

  const filtrados = movimientosData.filter(m =>
    String(m.id ?? "").toLowerCase().includes(texto) ||
    String(m.tipo ?? "").toLowerCase().includes(texto) ||
    String(m.cantidad ?? "").toLowerCase().includes(texto) ||
    String(m.detalle ?? "").toLowerCase().includes(texto) ||
    String(obtenerReferenciaMovimiento(m) ?? "").toLowerCase().includes(texto)
  );

  if (filtrados.length === 0) {
    document.getElementById("tablaMovimientos").innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted">No se encontraron movimientos</td>
      </tr>
    `;
    return;
  }

  renderTablaMovimientos(filtrados);
}

function renderTipoMovimiento(tipo) {
  if (tipo === "ENTRADA") {
    return `<span class="badge bg-success">Entrada</span>`;
  }

  if (tipo === "SALIDA") {
    return `<span class="badge bg-danger">Salida</span>`;
  }

  if (tipo === "PRODUCCION") {
    return `<span class="badge bg-primary">Producción</span>`;
  }

  if (tipo === "AJUSTE") {
    return `<span class="badge bg-warning text-dark">Ajuste</span>`;
  }

  return `<span class="badge bg-secondary">${tipo ?? "Sin tipo"}</span>`;
}

function obtenerReferenciaMovimiento(movimiento) {
  if (movimiento.producto?.nombre) return movimiento.producto.nombre;
  if (movimiento.ingrediente?.nombre) return movimiento.ingrediente.nombre;
  if (movimiento.productoNombre) return movimiento.productoNombre;
  if (movimiento.ingredienteNombre) return movimiento.ingredienteNombre;
  if (movimiento.referencia) return movimiento.referencia;

  return "-";
}

function formatearFechaMovimiento(fecha) {
  if (!fecha) return "-";

  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;

  return d.toLocaleString();
}