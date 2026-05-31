function renderCarrito() {
  const lista = document.getElementById("carritoLista");
  const totalEl = document.getElementById("carritoTotal");
  const carrito = obtenerCarrito();

  if (!lista || !totalEl) return;

  if (carrito.length === 0) {
    lista.innerHTML = `
      <div class="text-center py-5">
        <i class="bi bi-cart-x text-muted" style="font-size:2.5rem;"></i>
        <p class="text-muted mt-3 mb-0">Tu carrito está vacío</p>
        <a href="catalogo.html" class="btn btn-outline-brand btn-sm mt-3">Ver catálogo</a>
      </div>`;
    totalEl.textContent = "S/ 0.00";
    return;
  }

  lista.innerHTML = carrito.map(item => `
    <div class="cart-item">
      <div class="flex-grow-1">
        <h6 class="fw-bold mb-1">${item.nombre}</h6>
        <p class="text-muted mb-2 small">Precio: S/ ${Number(item.precio).toFixed(2)}</p>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-secondary" onclick="cambiarCantidad(${item.id}, -1)">
            <i class="bi bi-dash"></i>
          </button>
          <span class="fw-semibold px-1">${item.cantidad}</span>
          <button class="btn btn-sm btn-outline-secondary" onclick="cambiarCantidad(${item.id}, 1)">
            <i class="bi bi-plus"></i>
          </button>
        </div>
      </div>
      <div class="text-end">
        <strong>S/ ${(item.precio * item.cantidad).toFixed(2)}</strong><br>
        <button class="btn btn-sm btn-link text-danger px-0" onclick="eliminarDelCarrito(${item.id})">
          <i class="bi bi-trash3 me-1"></i>Quitar
        </button>
      </div>
    </div>
  `).join("");

  const total = carrito.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  totalEl.textContent = `S/ ${total.toFixed(2)}`;
}

function cambiarCantidad(id, cambio) {
  const carrito = obtenerCarrito();
  const item = carrito.find(p => p.id === id);
  if (!item) return;

  item.cantidad += cambio;

  if (item.cantidad <= 0) {
    guardarCarrito(carrito.filter(p => p.id !== id));
  } else {
    guardarCarrito(carrito);
  }

  renderCarrito();
  actualizarContadorCarrito();
}

function eliminarDelCarrito(id) {
  guardarCarrito(obtenerCarrito().filter(item => item.id !== id));
  renderCarrito();
  actualizarContadorCarrito();
}

function vaciarCarrito() {
  guardarCarrito([]);
  renderCarrito();
  actualizarContadorCarrito();
}

let _tipoEntrega = "recojo";
let _entregaModal = null;

function abrirModalEntrega() {
  _tipoEntrega = "recojo";

  const btnRecojo   = document.getElementById("btnOpcionRecojo");
  const btnDelivery = document.getElementById("btnOpcionDelivery");
  const campos      = document.getElementById("camposDelivery");
  const msgModal    = document.getElementById("entregaMensaje");

  if (btnRecojo)   btnRecojo.classList.add("active");
  if (btnDelivery) btnDelivery.classList.remove("active");
  if (campos)      campos.classList.add("d-none");
  if (msgModal)    { msgModal.textContent = ""; msgModal.className = "small mb-3"; }

  const el = document.getElementById("entregaModal");
  if (!el) { console.error("Modal entregaModal no encontrado"); return; }

  _entregaModal = new bootstrap.Modal(el);
  _entregaModal.show();
}

function seleccionarEntrega(tipo) {
  _tipoEntrega = tipo;
  document.getElementById("btnOpcionRecojo").classList.toggle("active", tipo === "recojo");
  document.getElementById("btnOpcionDelivery").classList.toggle("active", tipo === "delivery");
  document.getElementById("camposDelivery").classList.toggle("d-none", tipo !== "delivery");
  const m = document.getElementById("entregaMensaje");
  if (m) { m.textContent = ""; m.className = "small mb-3"; }
}

async function procesarPedidoConEntrega() {
  const clienteWeb = obtenerClienteWeb();
  const carrito    = obtenerCarrito();
  const msgModal   = document.getElementById("entregaMensaje");
  const msgPage    = document.getElementById("mensajeCarrito");

  if (carrito.length === 0) {
    msgModal.className = "small mb-3 text-danger";
    msgModal.textContent = "Tu carrito está vacío.";
    return;
  }

  if (!clienteWeb) {
    msgModal.className = "small mb-3 text-danger";
    msgModal.innerHTML = `Debes <a href="home.html?auth=login" class="fw-semibold text-danger">iniciar sesión</a> para confirmar tu pedido.`;
    return;
  }

  let observacion = clienteWeb.esInvitado
    ? `Invitado: ${clienteWeb.nombre}${clienteWeb.telefono ? " · " + clienteWeb.telefono : ""}`
    : `${clienteWeb.nombre} (DNI: ${clienteWeb.dni})`;

  let tipoOrigen = "WEB";

  if (_tipoEntrega === "delivery") {
    const dir = (document.getElementById("deliveryDireccion")?.value || "").trim();
    const tel = (document.getElementById("deliveryTelefono")?.value  || "").trim();
    const ref = (document.getElementById("deliveryReferencia")?.value || "").trim();

    if (!dir) {
      msgModal.className = "small mb-3 text-danger";
      msgModal.textContent = "Ingresa la dirección de entrega.";
      return;
    }
    if (!tel) {
      msgModal.className = "small mb-3 text-danger";
      msgModal.textContent = "Ingresa un teléfono de contacto.";
      return;
    }

    tipoOrigen  = "DELIVERY";
    observacion = `Dir: ${dir} | Tel: ${tel}${ref ? " | Ref: " + ref : ""} | ${observacion}`;
  }

  const payload = {
    tipoOrigen,
    observacion,
    clienteId: clienteWeb.clienteId || null,
    detalles: carrito.map(item => ({ productoId: item.id, cantidad: item.cantidad }))
  };

  const btn = document.getElementById("btnConfirmarEntrega");
  if (btn) { btn.disabled = true; btn.textContent = "Procesando..."; }

  try {
    await apiFetch("/api/pedidos", { method: "POST", body: JSON.stringify(payload) });

    if (_entregaModal) _entregaModal.hide();

    guardarCarrito([]);
    renderCarrito();
    actualizarContadorCarrito();

    const esDelivery = _tipoEntrega === "delivery";
    msgPage.className = "mt-3 small checkout-result exito";
    msgPage.innerHTML = esDelivery
      ? `<i class="bi bi-scooter me-1"></i>¡Pedido registrado! Te enviaremos tu pedido a domicilio.`
      : `<i class="bi bi-check-circle-fill me-1"></i>¡Pedido registrado! Pasa a recogerlo cuando esté listo.`;

  } catch (error) {
    if (_entregaModal) _entregaModal.hide();
    msgPage.className = "mt-3 small checkout-result error";
    msgPage.innerHTML = `<i class="bi bi-exclamation-circle-fill me-1"></i>
      ${error.message || "No se pudo registrar el pedido."}`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Confirmar pedido"; }
  }
}
