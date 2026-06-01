requireAuth();

let ingredienteModal;
let movimientoStockModal;
let ingredientesData = [];

document.addEventListener("DOMContentLoaded", async () => {
  ingredienteModal    = new bootstrap.Modal(document.getElementById("ingredienteModal"));
  movimientoStockModal = new bootstrap.Modal(document.getElementById("movimientoStockModal"));

  document.getElementById("ingredienteForm").addEventListener("submit", guardarIngrediente);
  document.getElementById("buscarIngrediente").addEventListener("input", filtrarIngredientes);

  await cargarIngredientes();
});

async function cargarIngredientes() {
  const tbody = document.getElementById("tablaIngredientes");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Cargando ingredientes...</td></tr>`;

  try {
    const ingredientes = await apiFetch("/api/ingredientes");
    ingredientesData = ingredientes || [];
    renderTablaIngredientes(ingredientesData);
  } catch (error) {
    console.error("Error cargando ingredientes:", error);
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar ingredientes</td></tr>`;
  }
}

function renderTablaIngredientes(lista) {
  const tbody = document.getElementById("tablaIngredientes");

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No hay ingredientes registrados</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(i => {
    const stock = Number(i.stock ?? 0);
    const estado = stock <= 5
      ? `<span class="badge badge-soft-danger">Stock bajo</span>`
      : `<span class="badge badge-soft-success">Disponible</span>`;

    return `
      <tr>
        <td>${i.id}</td>
        <td>${i.nombre ?? ""}</td>
        <td>${stock}</td>
        <td>${i.unidadMedida ?? ""}</td>
        <td>${estado}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success me-1" title="Agregar stock"
            onclick="abrirMovimientoStock(${i.id}, '${(i.nombre??'').replace(/'/g,"\\'")}', '${i.unidadMedida??''}', 'ENTRADA')">
            <i class="bi bi-plus-lg"></i> Stock
          </button>
          <button class="btn btn-sm btn-outline-warning me-1" title="Reducir / merma"
            onclick="abrirMovimientoStock(${i.id}, '${(i.nombre??'').replace(/'/g,"\\'")}', '${i.unidadMedida??''}', 'SALIDA')">
            <i class="bi bi-dash-lg"></i> Merma
          </button>
          <button class="btn btn-sm btn-outline-primary me-1" onclick='editarIngrediente(${JSON.stringify(i)})'>Editar</button>
          <button class="btn btn-sm btn-outline-danger" onclick="eliminarIngrediente(${i.id})">Eliminar</button>
        </td>
      </tr>
    `;
  }).join("");
}

function filtrarIngredientes() {
  const texto = document.getElementById("buscarIngrediente").value.trim().toLowerCase();

  const filtrados = ingredientesData.filter(i =>
    (i.nombre ?? "").toLowerCase().includes(texto) ||
    String(i.id ?? "").includes(texto) ||
    (i.unidadMedida ?? "").toLowerCase().includes(texto)
  );

  renderTablaIngredientes(filtrados);
}

function editarIngrediente(ingrediente) {
  document.getElementById("ingredienteId").value = ingrediente.id || "";
  document.getElementById("nombreIngrediente").value = ingrediente.nombre || "";
  document.getElementById("stockIngrediente").value = ingrediente.stock || "";
  document.getElementById("unidadIngrediente").value = ingrediente.unidadMedida || "";

  ingredienteModal.show();
}

async function guardarIngrediente(e) {
  e.preventDefault();

  const id = document.getElementById("ingredienteId").value;

  const existente = ingredientesData.find(i => String(i.id) === String(id));

  const nombre = document.getElementById("nombreIngrediente").value.trim();
  const stock = parseInt(document.getElementById("stockIngrediente").value, 10);
  const unidadMedida = document.getElementById("unidadIngrediente").value;

  if (nombre.length < 2) { alert("El nombre debe tener al menos 2 caracteres."); return; }
  if (isNaN(stock) || stock < 0) { alert("El stock no puede ser negativo."); return; }
  if (!unidadMedida) { alert("Selecciona una unidad de medida."); return; }

  const payload = {
    nombre,
    stock,
    unidadMedida,
    stockMinimo: existente?.stockMinimo ?? 0,
    activo: existente?.activo ?? true
  };

  try {
    if (id) {
      await apiFetch(`/api/ingredientes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      await apiFetch("/api/ingredientes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    limpiarFormularioIngrediente();
    ingredienteModal.hide();
    await cargarIngredientes();
  } catch (error) {
    console.error("Error guardando ingrediente:", error);
    alert(error.message || "No se pudo guardar el ingrediente");
  }
}

async function eliminarIngrediente(id) {
  if (!confirm("¿Deseas eliminar este ingrediente?")) return;

  try {
    await apiFetch(`/api/ingredientes/${id}`, {
      method: "DELETE"
    });

    await cargarIngredientes();
  } catch (error) {
    console.error("Error eliminando ingrediente:", error);
    alert(error.message || "No se pudo eliminar el ingrediente");
  }
}

function limpiarFormularioIngrediente() {
  document.getElementById("ingredienteForm").reset();
  document.getElementById("ingredienteId").value = "";
}

// ── Movimientos de stock (agregar / merma) ─────────────────────────

function abrirMovimientoStock(id, nombre, unidad, tipo) {
  const esEntrada = tipo === "ENTRADA";

  document.getElementById("movimientoIngredienteId").value = id;
  document.getElementById("movimientoTipo").value          = tipo;
  document.getElementById("movimientoNombre").textContent  = nombre;
  document.getElementById("movimientoUnidad").textContent  = unidad;
  document.getElementById("movimientoCantidad").value      = "";
  document.getElementById("movimientoMensaje").textContent = "";
  document.getElementById("movimientoMensaje").className   = "small mb-2";

  document.getElementById("movimientoTitulo").textContent = esEntrada ? "Agregar stock" : "Reducir stock / Merma";
  document.getElementById("movimientoHeader").style.background = esEntrada ? "#f0fdf4" : "#fff7ed";
  document.getElementById("motivoWrap").classList.toggle("d-none", esEntrada);
  document.getElementById("confirmacionReduccion").classList.toggle("d-none", esEntrada);

  const btn = document.getElementById("btnEjecutarMovimiento");
  btn.className = `btn ${esEntrada ? "btn-success" : "btn-warning"}`;
  btn.textContent = esEntrada ? "Agregar" : "Reducir";

  if (!esEntrada) {
    document.getElementById("movimientoMotivo").value          = "MERMA";
    document.getElementById("checkConfirmarReduccion").checked = false;
  }

  movimientoStockModal.show();
}

async function ejecutarMovimientoStock() {
  const id      = document.getElementById("movimientoIngredienteId").value;
  const tipo    = document.getElementById("movimientoTipo").value;
  const cantidad = parseFloat(document.getElementById("movimientoCantidad").value);
  const msg     = document.getElementById("movimientoMensaje");

  if (!cantidad || cantidad <= 0) {
    msg.className = "small mb-2 text-danger";
    msg.textContent = "Ingresa una cantidad válida mayor a 0.";
    return;
  }

  const esEntrada = tipo === "ENTRADA";
  const motivo    = esEntrada ? "COMPRA" : document.getElementById("movimientoMotivo").value;

  if (!esEntrada) {
    const confirmado = document.getElementById("checkConfirmarReduccion").checked;
    if (!confirmado) {
      msg.className = "small mb-2 text-danger";
      msg.textContent = "Debes marcar la confirmación para continuar.";
      return;
    }
  }

  const btn = document.getElementById("btnEjecutarMovimiento");
  btn.disabled = true;
  btn.textContent = "Guardando...";

  try {
    await apiFetch(`/api/ingredientes/${id}/movimientos`, {
      method: "POST",
      body: JSON.stringify({ tipo, motivo, cantidad })
    });

    movimientoStockModal.hide();
    await cargarIngredientes();
  } catch (error) {
    msg.className = "small mb-2 text-danger";
    msg.textContent = error.message || "No se pudo registrar el movimiento.";
  } finally {
    btn.disabled = false;
    btn.textContent = esEntrada ? "Agregar" : "Reducir";
  }
}