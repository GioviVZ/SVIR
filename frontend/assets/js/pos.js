requireAuth();

let productosData = [];
let carritoPOS    = [];
let clientesData  = [];

// Estado del comprobante seleccionado
let docTipo      = "simple";   // "simple" | "boleta" | "factura"
let docClienteId = null;       // id del cliente encontrado en BD (puede ser null)
let docDatos     = {};         // { nombre, dni, razonSocial, ruc, direccion }

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("buscarPOS").addEventListener("input", filtrarProductos);
  await Promise.all([cargarProductos(), cargarClientes()]);
});

// ── Carga inicial ──────────────────────────────────────────────────────────

async function cargarProductos() {
  const grid = document.getElementById("posProductosGrid");
  grid.innerHTML = `<div class="col-12 text-center text-muted py-4">Cargando productos...</div>`;
  try {
    const todos = await apiFetch("/api/productos");
    productosData = (todos || []).filter(p => p.activo !== false);
    renderProductos(productosData);
  } catch {
    grid.innerHTML = `<div class="col-12 text-center text-danger py-4">Error al cargar productos</div>`;
  }
}

async function cargarClientes() {
  try {
    const todos = await apiFetch("/api/clientes");
    clientesData = (todos || []).filter(c => c.activo !== false);
  } catch {
    clientesData = [];
  }
}

// ── Productos ──────────────────────────────────────────────────────────────

function filtrarProductos() {
  const texto = document.getElementById("buscarPOS").value.trim().toLowerCase();
  renderProductos(texto
    ? productosData.filter(p => (p.nombre ?? "").toLowerCase().includes(texto))
    : productosData
  );
}

function renderProductos(lista) {
  const grid = document.getElementById("posProductosGrid");
  if (!lista || lista.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-4">No hay productos disponibles</div>`;
    return;
  }

  grid.innerHTML = lista.map(p => {
    const enCarrito = carritoPOS.find(c => c.id === p.id);
    const sinStock  = (p.stock ?? 0) <= 0;
    const clases = [
      "pos-product-card pos-card-enter h-100",
      sinStock   ? "sin-stock"  : "",
      enCarrito  ? "en-carrito" : ""
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

  grid.querySelectorAll(".pos-card-enter").forEach((card, i) => {
    card.style.animationDelay = `${Math.min(i, 10) * 35}ms`;
  });
}

// ── Carrito ────────────────────────────────────────────────────────────────

function agregarAlCarrito(productoId) {
  const producto = productosData.find(p => p.id === productoId);
  if (!producto || (producto.stock ?? 0) <= 0) return;

  const existente = carritoPOS.find(c => c.id === productoId);
  if (existente) {
    if (existente.cantidad < (producto.stock ?? 0)) existente.cantidad++;
  } else {
    carritoPOS.push({
      id:       producto.id,
      nombre:   producto.nombre,
      precio:   Number(producto.precio ?? 0),
      cantidad: 1,
      stock:    producto.stock ?? 0
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
  const body      = document.getElementById("posCartBody");
  const totalEl   = document.getElementById("posTotal");
  const btnCobrar = document.getElementById("btnCobrar");

  if (carritoPOS.length === 0) {
    body.innerHTML = `<div class="pos-empty-cart">El carrito está vacío.<br>Haz clic en un producto para agregar.</div>`;
    totalEl.textContent = "S/ 0.00";
    btnCobrar.disabled  = true;
    btnCobrar.classList.remove("btn-cobrar-active");
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
  btnCobrar.disabled  = false;
  btnCobrar.classList.add("btn-cobrar-active");
}

// ── Modal de comprobante ───────────────────────────────────────────────────

function cobrar() {
  if (carritoPOS.length === 0) return;
  abrirModalDocumento();
}

function abrirModalDocumento() {
  // Resetear formularios del modal
  ["docDniInput", "docNombre", "docRucInput", "docRazonSocial", "docDireccion"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  ["docDniMensaje", "docRucMensaje"].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ""; el.className = "small mb-2"; }
  });

  // Restaurar el tipo ya seleccionado sin perder elección previa
  switchDocTipo(docTipo, false);
  new bootstrap.Modal(document.getElementById("docModal")).show();
}

function switchDocTipo(tipo, resetDatos = true) {
  docTipo = tipo;
  if (resetDatos) {
    docClienteId = null;
    docDatos     = {};
  }

  const paneles = { simple: "docPanelSimple", boleta: "docPanelDni", factura: "docPanelRuc" };
  const botones = { simple: "docBtnSimple",   boleta: "docBtnDni",   factura: "docBtnRuc"   };

  Object.keys(paneles).forEach(t => {
    document.getElementById(paneles[t]).classList.toggle("d-none", t !== tipo);
    const btn = document.getElementById(botones[t]);
    btn.className = t === tipo
      ? "btn btn-brand flex-fill"
      : "btn btn-outline-secondary flex-fill";
  });
}

// Buscar cliente por DNI en la lista ya cargada (primero local, luego API)
async function buscarPorDocDni() {
  const dni    = (document.getElementById("docDniInput").value || "").trim();
  const msgEl  = document.getElementById("docDniMensaje");

  msgEl.className = "small mb-2";
  msgEl.textContent = "";

  if (!/^\d{8}$/.test(dni)) {
    msgEl.className = "small mb-2 text-danger";
    msgEl.textContent = "Ingresa un DNI válido de 8 dígitos.";
    return;
  }

  // Buscar primero en los clientes ya cargados
  let cliente = clientesData.find(c => c.dni === dni);

  // Si no está en cache, intentar con la API
  if (!cliente) {
    try {
      cliente = await apiFetch(`/api/clientes/buscar?dni=${dni}`);
    } catch {
      cliente = null;
    }
  }

  if (cliente) {
    docClienteId = cliente.id;
    document.getElementById("docNombre").value = cliente.nombre ?? "";
    msgEl.className = "small mb-2 text-success";
    msgEl.textContent = `✓ Cliente encontrado${cliente.telefono ? " · " + cliente.telefono : ""}`;
  } else {
    docClienteId = null;
    document.getElementById("docNombre").value = "";
    msgEl.className = "small mb-2 text-warning";
    msgEl.textContent = "No encontrado. Puedes ingresar el nombre manualmente.";
  }
}

// Buscar cliente por RUC
async function buscarPorDocRuc() {
  const ruc   = (document.getElementById("docRucInput").value || "").trim();
  const msgEl = document.getElementById("docRucMensaje");

  msgEl.className = "small mb-2";
  msgEl.textContent = "";

  if (!/^\d{11}$/.test(ruc)) {
    msgEl.className = "small mb-2 text-danger";
    msgEl.textContent = "Ingresa un RUC válido de 11 dígitos.";
    return;
  }

  const cliente = clientesData.find(c => c.ruc === ruc);

  if (cliente) {
    docClienteId = cliente.id;
    document.getElementById("docRazonSocial").value = cliente.nombre ?? "";
    document.getElementById("docDireccion").value   = cliente.direccion ?? "";
    msgEl.className = "small mb-2 text-success";
    msgEl.textContent = `✓ Cliente encontrado${cliente.telefono ? " · " + cliente.telefono : ""}`;
  } else {
    docClienteId = null;
    document.getElementById("docRazonSocial").value = "";
    document.getElementById("docDireccion").value   = "";
    msgEl.className = "small mb-2 text-warning";
    msgEl.textContent = "No encontrado. Puedes ingresar los datos manualmente.";
  }
}

// Confirmar cobro desde el modal
async function confirmarCobro() {
  // Validar y recoger datos según el tipo de documento
  if (docTipo === "boleta") {
    docDatos.nombre = (document.getElementById("docNombre").value || "").trim();
    docDatos.dni    = (document.getElementById("docDniInput").value || "").trim();
    if (!docDatos.nombre) {
      mostrarMensajeDoc("Ingresa el nombre del cliente.", "docDniMensaje");
      return;
    }
  } else if (docTipo === "factura") {
    docDatos.razonSocial = (document.getElementById("docRazonSocial").value || "").trim();
    docDatos.ruc         = (document.getElementById("docRucInput").value || "").trim();
    docDatos.direccion   = (document.getElementById("docDireccion").value || "").trim();
    if (!docDatos.razonSocial) {
      mostrarMensajeDoc("Ingresa la razón social.", "docRucMensaje");
      return;
    }
    if (!/^\d{11}$/.test(docDatos.ruc)) {
      mostrarMensajeDoc("Ingresa el RUC (11 dígitos).", "docRucMensaje");
      return;
    }
  }

  // Actualizar el indicador del carrito
  actualizarDocIndicador();

  bootstrap.Modal.getInstance(document.getElementById("docModal")).hide();

  // Ejecutar el cobro
  await procesarCobro();
}

function mostrarMensajeDoc(texto, elId) {
  const el = document.getElementById(elId);
  el.className = "small mb-2 text-danger";
  el.textContent = texto;
}

function actualizarDocIndicador() {
  const labelEl = document.getElementById("posDocLabel");
  if (docTipo === "simple") {
    labelEl.textContent = "Boleta simple — Consumidor Final";
  } else if (docTipo === "boleta") {
    labelEl.textContent = `Boleta — ${docDatos.nombre}${docDatos.dni ? " (DNI " + docDatos.dni + ")" : ""}`;
  } else {
    labelEl.textContent = `Factura — ${docDatos.razonSocial} (RUC ${docDatos.ruc})`;
  }
}

// ── Procesamiento del cobro ────────────────────────────────────────────────

async function procesarCobro() {
  const btnCobrar = document.getElementById("btnCobrar");
  btnCobrar.disabled = true;
  btnCobrar.classList.remove("btn-cobrar-active");
  btnCobrar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Procesando...';
  ocultarResultado();

  let observacion = null;
  if (docTipo === "boleta")  observacion = `Boleta — ${docDatos.nombre}${docDatos.dni ? " DNI:" + docDatos.dni : ""}`;
  if (docTipo === "factura") observacion = `Factura — ${docDatos.razonSocial} RUC:${docDatos.ruc}${docDatos.direccion ? " Dir:" + docDatos.direccion : ""}`;

  const payload = {
    tipoOrigen: "PRESENCIAL",
    clienteId:  docClienteId || null,
    observacion: observacion,
    detalles: carritoPOS.map(item => ({ productoId: item.id, cantidad: item.cantidad }))
  };

  const carritoSnapshot = [...carritoPOS];

  try {
    const response = await apiFetch("/api/pedidos", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (response.estado === "LISTO") {
      try {
        await apiFetch(`/api/pedidos/${response.id}/estado`, {
          method: "PATCH",
          body: JSON.stringify({ estado: "ENTREGADO" })
        });
        response.estado = "ENTREGADO";
      } catch { /* no bloquear */ }
    }

    mostrarResultado(response);
    mostrarComprobante(response, carritoSnapshot);
    limpiarVenta();
  } catch (error) {
    mostrarError(error.message || "No se pudo procesar la venta");
    btnCobrar.disabled = false;
    btnCobrar.innerHTML = '<i class="bi bi-cash-coin me-2"></i>Cobrar';
  }
}

// ── Resultado y comprobante ────────────────────────────────────────────────

function mostrarResultado(pedido) {
  const box      = document.getElementById("posResultado");
  const detalles = pedido.detalles || [];
  const todosOk  = detalles.every(d => d.cantidadAtendida >= d.cantidad);

  let clase, titulo, cuerpo;
  if (pedido.estado === "ENTREGADO" || todosOk) {
    clase  = "completado";
    titulo = pedido.estado === "ENTREGADO" ? "✓ Venta completada y entregada" : "✓ Venta completada";
    cuerpo = detalles.map(d => `<div>${d.productoNombre}: ${d.cantidadAtendida} entregado(s)</div>`).join("");
  } else {
    clase  = "parcial";
    titulo = "⚠ Stock parcial — pendiente de producción";
    cuerpo = detalles.map(d => {
      if (d.cantidadAtendida >= d.cantidad)
        return `<div>${d.productoNombre}: ${d.cantidadAtendida} entregado(s) ✓</div>`;
      if (d.cantidadAtendida > 0)
        return `<div>${d.productoNombre}: ${d.cantidadAtendida} de ${d.cantidad} — ${d.cantidadPendiente} pendiente(s)</div>`;
      return `<div>${d.productoNombre}: sin stock — ${d.cantidad} pendiente(s)</div>`;
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

function mostrarComprobante(pedido, carrito) {
  const ahora = new Date();
  const fecha = ahora.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora  = ahora.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("boletaFecha").textContent = `${fecha}  ${hora}`;

  // Tipo de documento en el encabezado
  const tipoDocEl = document.getElementById("boletaTipoDoc");
  tipoDocEl.textContent = docTipo === "factura" ? "FACTURA" : "BOLETA DE VENTA";

  // Datos del emisor/receptor
  const clienteEl = document.getElementById("boletaCliente");
  if (docTipo === "simple") {
    clienteEl.innerHTML = `<span class="text-muted" style="font-size:0.78rem">Consumidor Final</span>`;
  } else if (docTipo === "boleta") {
    clienteEl.innerHTML =
      `<strong>${docDatos.nombre}</strong>` +
      (docDatos.dni ? `<br><span>DNI: ${docDatos.dni}</span>` : "");
  } else {
    clienteEl.innerHTML =
      `<strong>${docDatos.razonSocial}</strong>` +
      `<br><span>RUC: ${docDatos.ruc}</span>` +
      (docDatos.direccion ? `<br><span style="font-size:0.78rem">${docDatos.direccion}</span>` : "");
  }

  // Items
  const detallesResp = pedido.detalles || [];
  const tabla = document.getElementById("boletaItems");
  tabla.innerHTML = `
    <tr class="boleta-tabla-header">
      <th>Producto</th><th>Cant.</th><th>P.U.</th><th>Subtotal</th>
    </tr>
  ` + carrito.map(item => {
    const det      = detallesResp.find(d => d.productoId === item.id);
    const atendido = det ? det.cantidadAtendida : item.cantidad;
    return `
      <tr>
        <td>${item.nombre}</td>
        <td>${atendido}</td>
        <td>S/${item.precio.toFixed(2)}</td>
        <td>S/${(item.precio * atendido).toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  const total = carrito.reduce((acc, item) => {
    const det = detallesResp.find(d => d.productoId === item.id);
    return acc + item.precio * (det ? det.cantidadAtendida : item.cantidad);
  }, 0);
  document.getElementById("boletaTotal").textContent = `S/ ${total.toFixed(2)}`;

  new bootstrap.Modal(document.getElementById("boletaModal")).show();
}

function imprimirBoleta() {
  window.print();
}

// ── Reset ──────────────────────────────────────────────────────────────────

function limpiarVenta() {
  carritoPOS   = [];
  docClienteId = null;
  docDatos     = {};
  docTipo      = "simple";
  document.getElementById("posDocLabel").textContent = "Boleta simple";
  document.getElementById("btnCobrar").innerHTML = '<i class="bi bi-cash-coin me-2"></i>Cobrar';
  renderCarrito();
  filtrarProductos();
}
