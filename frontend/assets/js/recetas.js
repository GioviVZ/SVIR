requireAuth();

let productosData = [];
let ingredientesData = [];
let recetaActualItems = [];

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("recetaForm").addEventListener("submit", guardarItemReceta);
  document.getElementById("productoFiltro").addEventListener("change", cargarRecetaPorProducto);
  document.getElementById("productoSelect").addEventListener("change", sincronizarFiltroProducto);

  await cargarCombos();
});

async function cargarCombos() {
  try {
    const [productos, ingredientes] = await Promise.all([
      apiFetch("/api/productos"),
      apiFetch("/api/ingredientes")
    ]);

    productosData = productos || [];
    ingredientesData = ingredientes || [];

    llenarSelectProductos("productoSelect", productosData);
    llenarSelectProductos("productoFiltro", productosData);
    llenarSelectIngredientes("ingredienteSelect", ingredientesData);
  } catch (error) {
    console.error("Error cargando combos:", error);
    alert("No se pudieron cargar productos e ingredientes");
  }
}

function llenarSelectProductos(idSelect, productos) {
  const select = document.getElementById(idSelect);
  select.innerHTML = `<option value="">Seleccione un producto</option>`;

  productos.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
  });
}

function llenarSelectIngredientes(idSelect, ingredientes) {
  const select = document.getElementById(idSelect);
  select.innerHTML = `<option value="">Seleccione un ingrediente</option>`;

  ingredientes.forEach(i => {
    select.innerHTML += `
      <option value="${i.id}">
        ${i.nombre} (${i.unidadMedida ?? "-"})
      </option>
    `;
  });
}

async function sincronizarFiltroProducto() {
  const productoId = document.getElementById("productoSelect").value;
  document.getElementById("productoFiltro").value = productoId;

  if (productoId) {
    await cargarRecetaPorProducto();
  }
}

async function guardarItemReceta(e) {
  e.preventDefault();

  const productoId = parseInt(document.getElementById("productoSelect").value, 10);
  const ingredienteId = parseInt(document.getElementById("ingredienteSelect").value, 10);
  const cantidad = parseFloat(document.getElementById("cantidadReceta").value);

  if (!productoId || !ingredienteId || isNaN(cantidad)) {
    alert("Completa producto, ingrediente y cantidad.");
    return;
  }

  if (cantidad <= 0) {
    alert("La cantidad debe ser mayor a 0.");
    return;
  }

  const existe = recetaActualItems.find(item => item.ingredienteId === ingredienteId);

  let nuevosItems;

  if (existe) {
    nuevosItems = recetaActualItems.map(item =>
      item.ingredienteId === ingredienteId
        ? { ingredienteId, cantidad }
        : { ingredienteId: item.ingredienteId, cantidad: item.cantidad }
    );
  } else {
    nuevosItems = [
      ...recetaActualItems.map(item => ({
        ingredienteId: item.ingredienteId,
        cantidad: item.cantidad
      })),
      { ingredienteId, cantidad }
    ];
  }

  const payload = {
    items: nuevosItems
  };

  try {
    await apiFetch(`/api/recetas/producto/${productoId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });

    alert("Receta actualizada correctamente");

    document.getElementById("ingredienteSelect").value = "";
    document.getElementById("cantidadReceta").value = "";

    document.getElementById("productoFiltro").value = productoId;
    await cargarRecetaPorProducto();
  } catch (error) {
    console.error("Error guardando receta:", error);
    alert(error.message || "No se pudo guardar la receta");
  }
}

async function cargarRecetaPorProducto() {
  const productoId = document.getElementById("productoFiltro").value;
  const tbody = document.getElementById("tablaRecetas");

  recetaActualItems = [];

  if (!productoId) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted">
          Selecciona un producto para visualizar su receta
        </td>
      </tr>
    `;
    return;
  }

  document.getElementById("productoSelect").value = productoId;

  tbody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center text-muted">Cargando receta...</td>
    </tr>
  `;

  try {
    const receta = await apiFetch(`/api/recetas/producto/${productoId}`);

    const items = receta.items || [];
    recetaActualItems = items;

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted">
            Este producto aún no tiene receta registrada
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map((r, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${r.ingredienteNombre ?? obtenerNombreIngrediente(r)}</td>
        <td>${Number(r.cantidad ?? 0).toFixed(2)}</td>
        <td>${r.unidadMedida ?? obtenerUnidadIngrediente(r)}</td>
      </tr>
    `).join("");
  } catch (error) {
    console.error("Error cargando receta del producto:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-danger">
          Error al cargar la receta
        </td>
      </tr>
    `;
  }
}

function obtenerNombreIngrediente(receta) {
  const encontrado = ingredientesData.find(i => i.id === receta.ingredienteId);
  return encontrado ? encontrado.nombre : "Ingrediente";
}

function obtenerUnidadIngrediente(receta) {
  const encontrado = ingredientesData.find(i => i.id === receta.ingredienteId);
  return encontrado ? (encontrado.unidadMedida ?? "-") : "-";
}