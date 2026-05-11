requireAuth();

let productoModal;
let productosData = [];
let _imagenPendiente = null;

document.addEventListener("DOMContentLoaded", async () => {
  productoModal = new bootstrap.Modal(document.getElementById("productoModal"));
  document.getElementById("productoForm").addEventListener("submit", guardarProducto);
  await cargarProductos();
});

async function cargarProductos() {
  const tbody = document.getElementById("tablaProductos");
  tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Cargando productos...</td></tr>`;

  try {
    productosData = await apiFetch("/api/productos") || [];
    renderTablaProductos(productosData);
  } catch (error) {
    console.error("Error cargando productos:", error);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger">Error al cargar productos</td></tr>`;
  }
}

function renderTablaProductos(lista) {
  const tbody = document.getElementById("tablaProductos");

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No hay productos registrados</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(p => {
    const thumb = p.imagenUrl
      ? `<img src="${API_BASE}${p.imagenUrl}" class="producto-thumb" alt="${p.nombre}">`
      : `<div class="producto-thumb-placeholder"><i class="bi bi-image"></i></div>`;

    return `
      <tr>
        <td>${thumb}</td>
        <td>${p.id}</td>
        <td class="fw-semibold">${p.nombre ?? ""}</td>
        <td class="text-muted small" style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.descripcion ?? ""}</td>
        <td>S/ ${Number(p.precio ?? 0).toFixed(2)}</td>
        <td>${p.stock ?? 0}</td>
        <td>${p.stockMinimo ?? 0}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary me-1"
            onclick='editarProducto(${JSON.stringify(p)})'>Editar</button>
          <button class="btn btn-sm btn-outline-${p.activo ? 'danger' : 'success'}"
            onclick="toggleActivo(${p.id}, ${p.activo})">
            ${p.activo ? 'Desactivar' : 'Activar'}
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

function prepararNuevo() {
  document.getElementById("productoModalTitle").textContent = "Nuevo Producto";
  document.getElementById("productoForm").reset();
  document.getElementById("productoId").value = "";
  document.getElementById("imagenFile").value = "";
  _imagenPendiente = null;
  resetearPreviewImagen(null);
}

function editarProducto(producto) {
  document.getElementById("productoModalTitle").textContent = "Editar Producto";
  document.getElementById("productoId").value = producto.id || "";
  document.getElementById("nombre").value = producto.nombre || "";
  document.getElementById("descripcion").value = producto.descripcion || "";
  document.getElementById("precio").value = producto.precio || "";
  document.getElementById("stockMinimo").value = producto.stockMinimo ?? 0;
  document.getElementById("imagenFile").value = "";
  _imagenPendiente = null;
  resetearPreviewImagen(producto.imagenUrl);
  productoModal.show();
}

function resetearPreviewImagen(imagenUrl) {
  const preview = document.getElementById("imagenPreview");
  if (imagenUrl) {
    preview.innerHTML = `<img src="${API_BASE}${imagenUrl}" class="img-fluid rounded-3"
      style="max-height:140px; object-fit:cover; width:100%;" alt="Imagen actual">`;
  } else {
    preview.innerHTML = `
      <i class="bi bi-image text-muted" style="font-size:2rem;"></i>
      <span class="text-muted small mt-2">Sin imagen</span>`;
  }
}

function previsualizarImagen(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    alert("La imagen no debe superar 5 MB.");
    event.target.value = "";
    return;
  }

  _imagenPendiente = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("imagenPreview").innerHTML = `
      <img src="${e.target.result}" class="img-fluid rounded-3"
        style="max-height:140px; object-fit:cover; width:100%;" alt="Vista previa">
      <span class="text-success small mt-1"><i class="bi bi-check-circle me-1"></i>Lista para subir</span>`;
  };
  reader.readAsDataURL(file);
}

async function guardarProducto(e) {
  e.preventDefault();

  const id = document.getElementById("productoId").value;
  const existente = productosData.find(p => String(p.id) === String(id));

  const nombre = document.getElementById("nombre").value.trim();
  const precio = parseFloat(document.getElementById("precio").value);
  const stockMinimo = parseInt(document.getElementById("stockMinimo").value, 10);

  if (nombre.length < 2) { alert("El nombre debe tener al menos 2 caracteres."); return; }
  if (isNaN(precio) || precio <= 0) { alert("El precio debe ser mayor a 0."); return; }
  if (isNaN(stockMinimo) || stockMinimo < 0) { alert("El stock mínimo no puede ser negativo."); return; }

  const payload = {
    nombre,
    descripcion: document.getElementById("descripcion").value.trim(),
    precio,
    stock: existente ? (existente.stock ?? 0) : 0,
    stockMinimo,
    activo: existente ? (existente.activo ?? true) : true
  };

  try {
    let productoGuardado;
    if (id) {
      productoGuardado = await apiFetch(`/api/productos/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
    } else {
      productoGuardado = await apiFetch("/api/productos", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    }

    // Subir imagen si el admin seleccionó una
    if (_imagenPendiente && productoGuardado?.id) {
      const formData = new FormData();
      formData.append("file", _imagenPendiente);
      const resp = await fetch(`${API_BASE}/api/productos/${productoGuardado.id}/imagen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: formData
      });
      if (!resp.ok) {
        const err = await resp.text();
        console.error("Error subiendo imagen:", err);
      }
      _imagenPendiente = null;
    }

    productoModal.hide();
    await cargarProductos();
  } catch (error) {
    console.error("Error guardando producto:", error);
    alert(error.message || "No se pudo guardar el producto");
  }
}

async function toggleActivo(id, activo) {
  const texto = activo ? "desactivar" : "activar";
  if (!confirm(`¿Deseas ${texto} este producto?`)) return;

  try {
    await apiFetch(`/api/productos/${id}/activo?activo=${!activo}`, { method: "PATCH" });
    await cargarProductos();
  } catch (error) {
    console.error("Error cambiando estado:", error);
    alert(error.message || "No se pudo cambiar el estado del producto");
  }
}
