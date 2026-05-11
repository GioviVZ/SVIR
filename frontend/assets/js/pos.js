requireAuth();

let productosData = [];
let carritoPOS = [];
let clientesData = [];
let clienteSeleccionado = null;

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("buscarPOS").addEventListener("input", filtrarProductos);
  document.getElementById("posClienteBuscar").addEventListener("input", filtrarClientes);
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".pos-cliente-wrap")) {
      document.getElementById("posClienteSugerencias").classList.add("d-none");
    }
  });

  await Promise.all([cargarProductos(), cargarClientes()]);
});

async function cargarProductos() {
  const grid = document.getElementById("posProductosGrid");
  grid.innerHTML = `<div class="col-12 text-center text-muted py-4">Cargando productos...</div>`;
  try {
    const todos = await apiFetch("/api/productos");
    productosData = (todos || []).filter(p => p.activo !== false);
    renderProductos(productosData);
  } catch (error) {
    grid.innerHTML = `<div class="col-12 text-center text-danger py-4">Error al cargar productos</div>`;
  }
}

async function cargarClientes() {
  try {
    const todos = await apiFetch("/api/clientes");
    clientesData = (todos || []).filter(c => c.activo !== false);
  } catch (_) {
    clientesData = [];
  }
}

function filtrarProductos() {
  const texto = document.getElementById("buscarPOS").value.trim().toLowerCase();
  const filtrados = texto
    ? productosData.filter(p => (p.nombre ?? "").toLowerCase().includes(texto))
    : productosData;
  renderProductos(filtrados);
}

function filtrarClientes() {
  const texto = document.getElementById("posClienteBuscar").value.trim().toLowerCase();
  const sugerenciasEl = document.getElementById("posClienteSugerencias");

  clienteSeleccionado = null;
  document.getElementById("posClienteId").value = "";

  if (texto.length < 2) {
    sugerenciasEl.classList.add("d-none");
    return;
  }

  const filtrados = clientesData.filter(c =>
    c.nombre.toLowerCase().includes(texto) ||
    (c.dni ?? "").includes(texto) ||
    (c.ruc ?? "").includes(texto)
  ).slice(0, 8);

  if (!filtrados.length) {
    sugerenciasEl.innerHTML = `<div class="pos-sugerencia-item text-muted">Sin resultados</div>`;
    sugerenciasEl.classList.remove("d-none");
    return;
  }

  sugerenciasEl.innerHTML = filtrados.map(c => `
    <div class="pos-sugerencia-item" onclick="seleccionarCliente(${c.id})">
      <strong>${c.nombre}</strong>
      ${c.dni ? `<span class="text-muted ms-2" style="font-size:0.8rem">DNI: ${c.dni}</span>` : ""}
      ${c.telefono ? `<span class="text-muted ms-2" style="font-size:0.8rem">${c.telefono}</span>` : ""}
    </div>
  `).join("");
  sugerenciasEl.classList.remove("d-none");
}

function seleccionarCliente(id) {
  const c = clientesData.find(x => x.id === id);
  if (!c) return;

  clienteSeleccionado = c;
  document.getElementById("posClienteId").value = c.id;
  document.getElementById("posClienteBuscar").value = "";
  document.getElementById("posClienteSugerencias").classList.add("d-none");

  const tag = document.getElementById("posClienteSeleccionado");
  document.getElementById("posClienteNombre").textContent =
    `${c.nombre}${c.dni ? " — DNI " + c.dni : ""}`;
  tag.classList.remove("d-none");
}

function limpiarCliente() {
  clienteSeleccionado = null;
  document.getElementById("posClienteId").value = "";
  document.getElementById("posClienteBuscar").value = "";
  document.getElementById("posClienteSeleccionado").classList.add("d-none");
  document.getElementById("posClienteSugerencias").classList.add("d-none");
}

function renderProductos(lista) {
  const grid = document.getElementById("posProductosGrid");
  if (!lista || lista.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-4">No hay productos disponibles</div>`;
    return;
  }

  grid.innerHTML = lista.map(p => {
    const enCarrito = carritoPOS.find(c => c.id === p.id);
    const sinStock = (p.stock ?? 0) <= 0;
    const clases = [
      "pos-product-card h-100",
      sinStock ? "sin-stock" : "",
      enCarrito ? "en-carrito" : ""
    ].filter(Boolean).join(" ");

    return `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="${clases}" onclick="agregarAlCarrito(${p.id})">
          ${enCarrito ? `<div class="pos-qty-bubble">${enCarrito.cantidad}</div>` : ""}
          <div class="pos-product-icon">${(p.nombre ?? "?").charAt(0).toUpperCase()}</div>
          <div class="pos-product-nombre">${p.nombre ?? ""}</div>
          <div class="pos-product-precio">S/ ${Number(p.precio ?? 0).toFixed(2)}</div>
          <div class="mt-1">
            ${sinStock
              ? `<span class="badge badge-soft-danger" style="font-size:0.7rem">Sin stock</span>`
              : `<span class="badge badge-soft-success" style="font-size:0.7rem">Stock: ${p.stock}</span>`
            }
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function agregarAlCarrito(productoId) {
  const producto = productosData.find(p => p.id === productoId);
  if (!producto || (producto.stock ?? 0) <= 0) return;

  const existente = carritoPOS.find(c => c.id === productoId);
  if (existente) {
    if (existente.cantidad < (producto.stock ?? 0)) existente.cantidad++;
  } else {
    carritoPOS.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio ?? 0),
      cantidad: 1,
      stock: producto.stock ?? 0
    });
  }

  renderCarrito();
  filtrarProductos();
}

function cambiarCantidad(id, delta) {
  const item = carritoPOS.find(c => c.id === id);
  if (!item) return;
  item.cantidad += delta;
  if (item.cantidad <= 0) carritoPOS = carritoPOS.filter(c => c.id !== id);
  renderCarrito();
  filtrarProductos();
}

function renderCarrito() {
  const body = document.getElementById("posCartBody");
  const totalEl = document.getElementById("posTotal");
  const btnCobrar = document.getElementById("btnCobrar");

  if (carritoPOS.length === 0) {
    body.innerHTML = `<div class="pos-empty-cart">El carrito está vacío.<br>Haz clic en un producto para agregar.</div>`;
    totalEl.textContent = "S/ 0.00";
    btnCobrar.disabled = true;
    return;
  }

  body.innerHTML = carritoPOS.map(item => `
    <div class="pos-cart-item">
      <div class="pos-cart-item-nombre">${item.nombre}</div>
      <div class="pos-qty-controls">
        <button onclick="cambiarCantidad(${item.id}, -1)">−</button>
        <span style="min-width:20px;text-align:center;font-weight:600">${item.cantidad}</span>
        <button onclick="cambiarCantidad(${item.id}, 1)">+</button>
      </div>
      <div style="min-width:64px;text-align:right;font-size:0.88rem;font-weight:600">
        S/ ${(item.precio * item.cantidad).toFixed(2)}
      </div>
    </div>
  `).join("");

  const total = carritoPOS.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
  totalEl.textContent = `S/ ${total.toFixed(2)}`;
  btnCobrar.disabled = false;
}

async function cobrar() {
  if (carritoPOS.length === 0) return;

  const btnCobrar = document.getElementById("btnCobrar");
  btnCobrar.disabled = true;
  btnCobrar.textContent = "Procesando...";
  ocultarResultado();

  const clienteId = document.getElementById("posClienteId").value;
  const observacion = clienteSeleccionado
    ? clienteSeleccionado.nombre
    : document.getElementById("posClienteBuscar").value.trim() || null;

  const payload = {
    tipoOrigen: "PRESENCIAL",
    clienteId: clienteId ? parseInt(clienteId) : null,
    observacion: observacion || null,
    detalles: carritoPOS.map(item => ({
      productoId: item.id,
      cantidad: item.cantidad
    }))
  };

  // Capturamos el carrito actual antes de limpiar para usarlo en la boleta
  const carritoParaBoleta = [...carritoPOS];
  const clienteParaBoleta = clienteSeleccionado;

  try {
    const response = await apiFetch("/api/pedidos", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    mostrarResultado(response);
    mostrarBoleta(response, carritoParaBoleta, clienteParaBoleta);
    limpiarVenta();
  } catch (error) {
    mostrarError(error.message || "No se pudo procesar la venta");
    btnCobrar.disabled = false;
    btnCobrar.textContent = "Cobrar";
  }
}

function mostrarResultado(pedido) {
  const box = document.getElementById("posResultado");
  const detalles = pedido.detalles || [];
  const todosAtendidos = detalles.every(d => d.cantidadAtendida >= d.cantidad);

  let clase, titulo, cuerpo;

  if (todosAtendidos) {
    clase = "completado";
    titulo = "✓ Venta completada";
    cuerpo = detalles.map(d =>
      `<div>${d.productoNombre}: ${d.cantidadAtendida} entregado(s)</div>`
    ).join("");
  } else {
    clase = "parcial";
    titulo = "⚠ Venta con stock parcial";
    cuerpo = detalles.map(d => {
      if (d.cantidadAtendida >= d.cantidad) {
        return `<div>${d.productoNombre}: ${d.cantidadAtendida} entregado(s) ✓</div>`;
      } else if (d.cantidadAtendida > 0) {
        return `<div>${d.productoNombre}: ${d.cantidadAtendida} de ${d.cantidad} — ${d.cantidadPendiente} pendiente(s)</div>`;
      } else {
        return `<div>${d.productoNombre}: sin stock — ${d.cantidad} pendiente(s)</div>`;
      }
    }).join("");
  }

  box.className = `pos-result-box ${clase} mt-3`;
  box.innerHTML = `<strong>${titulo}</strong><div class="mt-1">${cuerpo}</div>`;
  box.classList.remove("d-none");

  setTimeout(() => cargarProductos(), 500);
}

function mostrarError(mensaje) {
  const box = document.getElementById("posResultado");
  box.className = "pos-result-box error mt-3";
  box.innerHTML = `<strong>✗ Error</strong><div class="mt-1">${mensaje}</div>`;
  box.classList.remove("d-none");
}

function ocultarResultado() {
  const box = document.getElementById("posResultado");
  box.className = "pos-result-box d-none";
  box.innerHTML = "";
}

function mostrarBoleta(pedido, carrito, cliente) {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora  = ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  document.getElementById("boletaFecha").textContent = `${fecha}  ${hora}`;

  const clienteEl = document.getElementById("boletaCliente");
  if (cliente) {
    clienteEl.innerHTML =
      `<span>Cliente: <strong>${cliente.nombre}</strong></span>` +
      (cliente.dni ? `<br><span>DNI: ${cliente.dni}</span>` : "");
    clienteEl.style.display = "block";
  } else {
    clienteEl.style.display = "none";
  }

  const detallesResp = pedido.detalles || [];
  const tabla = document.getElementById("boletaItems");
  tabla.innerHTML = `
    <tr class="boleta-tabla-header">
      <th>Producto</th><th>Cant.</th><th>P.U.</th><th>Subtotal</th>
    </tr>
  ` + carrito.map(item => {
    const det = detallesResp.find(d => d.productoId === item.id);
    const atendido = det ? det.cantidadAtendida : item.cantidad;
    const subtotal = item.precio * atendido;
    return `
      <tr>
        <td>${item.nombre}</td>
        <td>${atendido}</td>
        <td>S/${item.precio.toFixed(2)}</td>
        <td>S/${subtotal.toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  const total = carrito.reduce((acc, item) => {
    const det = detallesResp.find(d => d.productoId === item.id);
    const atendido = det ? det.cantidadAtendida : item.cantidad;
    return acc + item.precio * atendido;
  }, 0);

  document.getElementById("boletaTotal").textContent = `S/ ${total.toFixed(2)}`;

  new bootstrap.Modal(document.getElementById("boletaModal")).show();
}

function imprimirBoleta() {
  window.print();
}

function limpiarVenta() {
  carritoPOS = [];
  limpiarCliente();
  document.getElementById("btnCobrar").textContent = "Cobrar";
  renderCarrito();
  filtrarProductos();
}
