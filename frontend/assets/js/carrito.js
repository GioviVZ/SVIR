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

async function confirmarPedidoWeb() {
  const carrito = obtenerCarrito();
  const mensaje = document.getElementById("mensajeCarrito");

  mensaje.className = "mt-3 small";
  mensaje.textContent = "";

  const clienteWeb = obtenerClienteWeb();
  if (!clienteWeb) {
    window.location.href = "home.html?auth=login";
    return;
  }

  if (carrito.length === 0) {
    mensaje.className = "mt-3 small text-danger";
    mensaje.textContent = "Tu carrito está vacío.";
    return;
  }

  const observacion = clienteWeb.esInvitado
    ? `Invitado: ${clienteWeb.nombre}${clienteWeb.telefono ? " · " + clienteWeb.telefono : ""}`
    : `${clienteWeb.nombre} (DNI: ${clienteWeb.dni})`;

  const payload = {
    tipoOrigen: "WEB",
    observacion,
    clienteId: clienteWeb.clienteId || null,
    detalles: carrito.map(item => ({
      productoId: item.id,
      cantidad: item.cantidad
    }))
  };

  const btn = document.getElementById("btnConfirmar");
  if (btn) { btn.disabled = true; btn.textContent = "Procesando..."; }

  try {
    await apiFetch("/api/pedidos", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    guardarCarrito([]);
    renderCarrito();
    actualizarContadorCarrito();

    mensaje.className = "mt-3 small checkout-result exito";
    mensaje.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i>
      ¡Pedido registrado! En breve nos comunicamos contigo.`;
  } catch (error) {
    mensaje.className = "mt-3 small checkout-result error";
    mensaje.innerHTML = `<i class="bi bi-exclamation-circle-fill me-1"></i>
      ${error.message || "No se pudo registrar el pedido."}`;
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Confirmar pedido"; }
  }
}
