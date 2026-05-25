// ── Mapa de productos cargados (para onclick seguros) ──────────────
const _productosMap = {};

// ── Carrito en localStorage ────────────────────────────────────────
function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carritoWeb") || "[]");
}

function guardarCarrito(carrito) {
  localStorage.setItem("carritoWeb", JSON.stringify(carrito));
}

// ── Sesión de cliente web ──────────────────────────────────────────
function obtenerClienteWeb() {
  return JSON.parse(localStorage.getItem("clienteWeb") || "null");
}

function guardarClienteWeb(cliente) {
  localStorage.setItem("clienteWeb", JSON.stringify(cliente));
}

function cerrarSesionCliente() {
  localStorage.removeItem("clienteWeb");
  actualizarNavCliente();
  actualizarContadorCarrito();
  window.location.reload();
}

// ── Navbar: actualiza según estado de sesión ───────────────────────
function actualizarNavCliente() {
  const cliente = obtenerClienteWeb();
  const authNav = document.getElementById("authNav");
  const clienteNav = document.getElementById("clienteNav");
  const clienteNombreNav = document.getElementById("clienteNombreNav");

  if (!authNav) return;

  if (cliente) {
    authNav.classList.add("d-none");
    clienteNav.classList.remove("d-none");
    if (clienteNombreNav) {
      clienteNombreNav.textContent = cliente.nombre.split(" ")[0];
    }
  } else {
    authNav.classList.remove("d-none");
    clienteNav.classList.add("d-none");
  }
}

// ── Contador de carrito en navbar ──────────────────────────────────
function actualizarContadorCarrito() {
  const counter = document.getElementById("cartCounter");
  if (!counter) return;
  const total = obtenerCarrito().reduce((acc, item) => acc + item.cantidad, 0);
  if (total > 0) {
    counter.textContent = total > 99 ? "99+" : total;
    counter.classList.remove("d-none");
  } else {
    counter.classList.add("d-none");
  }
}

// ── Agregar producto al carrito ────────────────────────────────────
function agregarAlCarrito(producto, cantidad) {
  const cliente = obtenerClienteWeb();
  if (!cliente) {
    mostrarModalAuth("registro");
    return;
  }

  const stock = Number(producto.stock ?? 0);
  if (stock <= 0) return;

  const qty = Math.max(1, Math.min(parseInt(cantidad) || 1, stock));

  const carrito = obtenerCarrito();
  const existente = carrito.find(item => item.id === producto.id);

  if (existente) {
    existente.cantidad += qty;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad: qty
    });
  }

  guardarCarrito(carrito);
  actualizarContadorCarrito();
  mostrarToastCarrito(producto.nombre, qty);

  // Resetear el selector de cantidad de esa card
  const input = document.getElementById(`qty_${producto.id}`);
  if (input) input.value = "1";
}

function mostrarToastCarrito(nombre, cantidad) {
  const toast = document.getElementById("toastCarrito");
  const toastNombre = document.getElementById("toastNombre");
  if (!toast) return;
  if (toastNombre) toastNombre.textContent = cantidad > 1 ? `${cantidad} × ${nombre}` : nombre;
  toast.classList.remove("d-none");
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.add("d-none"), 2500);
}

// Botones +/− en cada card
function cambiarCantidadCard(productoId, delta, stockMax) {
  const input = document.getElementById(`qty_${productoId}`);
  if (!input) return;
  const val = Math.max(1, Math.min(parseInt(input.value || "1") + delta, stockMax || 99));
  input.value = val;
}

// ── Modal auth (home.html y catalogo.html) ─────────────────────────
let _authModal = null;

function mostrarModalAuth(modo) {
  const el = document.getElementById("authModal");
  if (!el) {
    // Si no hay modal en esta página, redirigir al home
    window.location.href = `home.html?auth=${modo || "registro"}`;
    return;
  }
  _authModal = bootstrap.Modal.getOrCreateInstance(el);
  switchTab("cliente");
  switchAuth(modo || "registro");
  _authModal.show();
}

function switchTab(tab) {
  const panelCliente = document.getElementById("panel-cliente");
  const panelPersonal = document.getElementById("panel-personal");
  const tabCliente = document.getElementById("tab-cliente");
  const tabPersonal = document.getElementById("tab-personal");

  if (!panelCliente) return;
  panelCliente.classList.toggle("d-none", tab !== "cliente");
  panelPersonal.classList.toggle("d-none", tab !== "personal");
  tabCliente.classList.toggle("active", tab === "cliente");
  tabPersonal.classList.toggle("active", tab === "personal");
}

function switchAuth(modo) {
  const modos = ["invitado", "registro", "login"];
  const formIds = { invitado: "invitadoClienteForm", registro: "registroClienteForm", login: "loginClienteForm" };
  const btnIds = { invitado: "btnModoInvitado", registro: "btnModoRegistro", login: "btnModoLogin" };

  modos.forEach(m => {
    const form = document.getElementById(formIds[m]);
    const btn = document.getElementById(btnIds[m]);
    if (form) form.classList.toggle("d-none", m !== modo);
    if (btn) btn.className = `btn ${m === modo ? "btn-brand" : "btn-outline-secondary"} flex-fill`;
  });

  const mensaje = document.getElementById("authMensaje");
  if (mensaje) { mensaje.textContent = ""; mensaje.className = "mt-3 small"; }
}

// Modo 1: Invitado — solo nombre, sin cuenta en el sistema
function entrarComoInvitado() {
  const nombre = (document.getElementById("invNombre")?.value || "").trim();
  const telefono = (document.getElementById("invTelefono")?.value || "").trim();

  if (nombre.length < 2) {
    mostrarAuthMensaje("Por favor ingresa tu nombre (al menos 2 caracteres).", "error");
    return;
  }

  guardarClienteWeb({ nombre, telefono, clienteId: null, esInvitado: true });

  if (_authModal) _authModal.hide();
  actualizarNavCliente();
  actualizarContadorCarrito();

  if (!window.location.href.includes("catalogo")) {
    window.location.href = "catalogo.html";
  }
}

// Modo 2: Registro — crea cuenta en el backend
async function registrarCliente() {
  const nombre = (document.getElementById("regNombre")?.value || "").trim();
  const dni = (document.getElementById("regDni")?.value || "").trim();
  const ruc = (document.getElementById("regRuc")?.value || "").trim();
  const telefono = (document.getElementById("regTelefono")?.value || "").trim();
  const email = (document.getElementById("regEmail")?.value || "").trim();
  const direccion = (document.getElementById("regDireccion")?.value || "").trim();
  const password = (document.getElementById("regPassword")?.value || "").trim();
  const passwordConfirm = (document.getElementById("regPasswordConfirm")?.value || "").trim();

  if (nombre.length < 2) { mostrarAuthMensaje("El nombre debe tener al menos 2 caracteres.", "error"); return; }
  if (!/^\d{8}$/.test(dni)) { mostrarAuthMensaje("El DNI debe tener exactamente 8 dígitos numéricos.", "error"); return; }
  if (ruc && !/^\d{11}$/.test(ruc)) { mostrarAuthMensaje("El RUC debe tener exactamente 11 dígitos.", "error"); return; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { mostrarAuthMensaje("Ingresa un email válido.", "error"); return; }
  if (password.length < 6) { mostrarAuthMensaje("La contraseña debe tener al menos 6 caracteres.", "error"); return; }
  if (password !== passwordConfirm) { mostrarAuthMensaje("Las contraseñas no coinciden.", "error"); return; }

  const btn = document.getElementById("btnRegistrar");
  if (btn) { btn.disabled = true; btn.textContent = "Registrando..."; }

  try {
    const cliente = await apiFetch("/api/clientes/registro", {
      method: "POST",
      body: JSON.stringify({ nombre, dni, ruc: ruc || null, telefono: telefono || null, email: email || null, direccion: direccion || null, password })
    });

    guardarClienteWeb({ nombre: cliente.nombre, dni: cliente.dni, telefono: cliente.telefono, clienteId: cliente.id, esInvitado: false });

    if (_authModal) _authModal.hide();
    actualizarNavCliente();
    actualizarContadorCarrito();
    window.location.href = "catalogo.html";
  } catch (error) {
    mostrarAuthMensaje(error.message || "No se pudo crear la cuenta.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Crear mi cuenta"; }
  }
}

// Modo 3: Login — DNI + contraseña
async function loginCliente() {
  const dni = (document.getElementById("loginDni")?.value || "").trim();
  const password = (document.getElementById("loginPassword")?.value || "").trim();

  if (!/^\d{8}$/.test(dni)) { mostrarAuthMensaje("Ingresa un DNI válido de 8 dígitos.", "error"); return; }
  if (password.length < 6) { mostrarAuthMensaje("Ingresa tu contraseña (mínimo 6 caracteres).", "error"); return; }

  const btn = document.getElementById("btnLogin");
  if (btn) { btn.disabled = true; btn.textContent = "Ingresando..."; }

  try {
    const cliente = await apiFetch("/api/clientes/login", {
      method: "POST",
      body: JSON.stringify({ dni, password })
    });
    guardarClienteWeb({ nombre: cliente.nombre, dni: cliente.dni, telefono: cliente.telefono, clienteId: cliente.id, esInvitado: false });

    if (_authModal) _authModal.hide();
    actualizarNavCliente();
    actualizarContadorCarrito();
  } catch (error) {
    mostrarAuthMensaje(error.message || "DNI o contraseña incorrectos.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Ingresar"; }
  }
}

function mostrarAuthMensaje(msg, tipo) {
  const el = document.getElementById("authMensaje");
  if (!el) return;
  el.className = `mt-3 small ${tipo === "error" ? "text-danger" : "text-success"}`;
  el.textContent = msg;
}

// ── Cargar productos destacados (home.html) ────────────────────────
async function cargarDestacadosHome() {
  const container = document.getElementById("productosDestacados");
  if (!container) return;

  try {
    const productos = await apiFetch("/api/productos");
    const activos = (productos || []).filter(p => p.activo !== false);

    if (activos.length === 0) {
      container.innerHTML = `<div class="col-12 text-center text-muted py-4">Sin productos disponibles por ahora.</div>`;
      return;
    }

    container.innerHTML = activos.slice(0, 8).map((p, i) => renderProductoCard(p, i)).join("");
  } catch {
    container.innerHTML = `<div class="col-12 text-center text-muted py-4">No se pudieron cargar los productos.</div>`;
  }
}

// ── Cargar catálogo completo (catalogo.html) ───────────────────────
let _productosCache = [];

async function cargarCatalogo() {
  const container = document.getElementById("catalogoProductos");
  if (!container) return;

  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-warning" role="status"></div>
      <p class="mt-3 text-muted">Cargando catálogo...</p>
    </div>`;

  try {
    const productos = await apiFetch("/api/productos");
    _productosCache = (productos || []).filter(p => p.activo !== false);
    renderCatalogo(_productosCache);

    const buscar = document.getElementById("buscarCatalogo");
    if (buscar) {
      buscar.addEventListener("input", () => {
        const q = buscar.value.toLowerCase().trim();
        const filtrados = _productosCache.filter(p =>
          (p.nombre ?? "").toLowerCase().includes(q) ||
          (p.descripcion ?? "").toLowerCase().includes(q)
        );
        renderCatalogo(filtrados);
      });
    }
  } catch {
    container.innerHTML = `<div class="col-12 text-center text-danger py-4">No se pudo cargar el catálogo.</div>`;
  }
}

function renderCatalogo(lista) {
  const container = document.getElementById("catalogoProductos");
  if (!container) return;

  const countEl = document.getElementById("catalogResultsText");

  if (!lista || lista.length === 0) {
    container.innerHTML = `<div class="col-12 text-center text-muted py-5">No se encontraron productos.</div>`;
    if (countEl) countEl.textContent = "0";
    return;
  }

  if (countEl) countEl.textContent = lista.length;
  container.innerHTML = lista.map((p, i) => renderProductoCard(p, i)).join("");
}

// ── Card de producto (home + catálogo) ────────────────────────────

function renderProductoCard(producto, idx = 0) {
  _productosMap[producto.id] = producto;

  const nombre = producto.nombre ?? "Producto";
  const descripcion = producto.descripcion ?? "Delicioso producto artesanal.";
  const precio = Number(producto.precio ?? 0).toFixed(2);
  const stock = Number(producto.stock ?? 0);
  const inicial = nombre.charAt(0).toUpperCase();
  const sinStock = stock <= 0;
  const delay = Math.min(idx, 11) * 55;

  const badgeStock = sinStock
    ? `<span class="product-badge-stock low-stock">Sin stock</span>`
    : stock <= 5
      ? `<span class="product-badge-stock low-stock">Últimos ${stock}</span>`
      : `<span class="product-badge-stock in-stock">Disponible</span>`;

  const imagenHTML = producto.imagenUrl
    ? `<img src="${API_BASE}${producto.imagenUrl}" alt="${nombre}"
          class="store-product-img-real${sinStock ? " sin-stock-image" : ""}">`
    : `<div class="store-product-image premium-product-image${sinStock ? " sin-stock-image" : ""}">
         <span>${inicial}</span>
       </div>`;

  const maxQty = sinStock ? 1 : Math.min(stock, 99);
  const qtyRowClass = sinStock ? "card-qty-row opacity-50" : "card-qty-row";
  const btnDecr = sinStock
    ? '<button class="card-qty-btn" disabled>−</button>'
    : '<button class="card-qty-btn" onclick="cambiarCantidadCard(' + producto.id + ', -1, ' + stock + ')">−</button>';
  const btnIncr = sinStock
    ? '<button class="card-qty-btn" disabled>+</button>'
    : '<button class="card-qty-btn" onclick="cambiarCantidadCard(' + producto.id + ', 1, ' + stock + ')">+</button>';
  const btnAdd = sinStock
    ? '<button class="btn-cart-add sin-stock" disabled><i class="bi bi-x-circle"></i> Sin stock</button>'
    : '<button class="btn-cart-add" onclick="agregarAlCarrito(_productosMap[' + producto.id + '], parseInt(document.getElementById(\'qty_' + producto.id + '\').value))"><i class="bi bi-cart-plus"></i> Agregar al carrito</button>';

  const compraHTML =
    '<div class="' + qtyRowClass + '">' +
      btnDecr +
      '<input type="number" id="qty_' + producto.id + '" class="card-qty-input" value="1" min="1" max="' + maxQty + '"' + (sinStock ? ' disabled' : '') + '>' +
      btnIncr +
    '</div>' + btnAdd;

  return `
    <div class="col-md-6 col-lg-4 col-xl-3 store-card-animate" style="animation-delay:${delay}ms">
      <div class="store-product-card premium-product-card h-100">
        <div class="store-product-image-wrap position-relative">
          ${imagenHTML}
          <div class="product-floating-badge">${badgeStock}</div>
        </div>
        <div class="p-3 d-flex flex-column flex-fill">
          <h6 class="fw-bold mb-1">${nombre}</h6>
          <p class="text-muted flex-grow-1 small mb-2" style="font-size:0.8rem;">${descripcion}</p>
          <strong class="store-price mb-2">S/ ${precio}</strong>
          ${compraHTML}
        </div>
      </div>
    </div>
  `;
}
