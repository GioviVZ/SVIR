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

// ── Historial local de pedidos (para invitados) ────────────────────
function obtenerHistorialPedidosWeb() {
  return JSON.parse(localStorage.getItem("misPedidosWeb") || "[]");
}

function agregarPedidoAlHistorial(id) {
  let historial = obtenerHistorialPedidosWeb().filter(x => x !== id);
  historial.unshift(id);
  if (historial.length > 20) historial = historial.slice(0, 20);
  localStorage.setItem("misPedidosWeb", JSON.stringify(historial));
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
  const modos = ["invitado", "registro", "login", "forgot"];
  const formIds = { invitado: "invitadoClienteForm", registro: "registroClienteForm", login: "loginClienteForm", forgot: "forgotClienteForm" };
  const btnIds = { invitado: "btnModoInvitado", registro: "btnModoRegistro", login: "btnModoLogin" };

  modos.forEach(m => {
    const form = document.getElementById(formIds[m]);
    const btn = document.getElementById(btnIds[m]);
    if (form) form.classList.toggle("d-none", m !== modo);
    if (btn) btn.className = `btn ${m === modo ? "btn-brand" : "btn-outline-secondary"} flex-fill`;
  });

  if (modo === "forgot") fcReset();

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
    const pregunta  = (document.getElementById("regPregunta")?.value || "") || null;
    const respuesta = (document.getElementById("regRespuesta")?.value || "").trim() || null;

    const cliente = await apiFetch("/api/clientes/registro", {
      method: "POST",
      body: JSON.stringify({ nombre, dni, ruc: ruc || null, telefono: telefono || null, email: email || null, direccion: direccion || null, password, preguntaSeguridad: pregunta, respuestaSeguridad: respuesta })
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

// ── Card de producto (home + catálogo) — estilo Instagram ─────────

const _igGradients = [
  'linear-gradient(145deg, #fbbf24, #ef4444)',
  'linear-gradient(145deg, #f97316, #ec4899)',
  'linear-gradient(145deg, #fcd34d, #92400e)',
  'linear-gradient(145deg, #a78bfa, #ec4899)',
  'linear-gradient(145deg, #f59e0b, #84cc16)',
  'linear-gradient(145deg, #fb7185, #f97316)',
];

function renderProductoCard(producto, idx = 0) {
  _productosMap[producto.id] = producto;

  const nombre     = producto.nombre      ?? "Producto";
  const descripcion= producto.descripcion ?? "Delicioso producto artesanal.";
  const precio     = Number(producto.precio ?? 0).toFixed(2);
  const stock      = Number(producto.stock  ?? 0);
  const inicial    = nombre.charAt(0).toUpperCase();
  const sinStock   = stock <= 0;
  const delay      = Math.min(idx, 11) * 55;
  const grad       = _igGradients[idx % _igGradients.length];

  const badge = sinStock
    ? `<span class="ig-img-badge no-stock"><i class="bi bi-x-circle me-1"></i>Sin stock</span>`
    : stock <= 5
      ? `<span class="ig-img-badge low-stock">Últimos ${stock}</span>`
      : `<span class="ig-img-badge in-stock"><i class="bi bi-check2 me-1"></i>Disponible</span>`;

  const imgHTML = producto.imagenUrl
    ? `<img src="${API_BASE}${producto.imagenUrl}" alt="${nombre}"
            class="ig-img-real${sinStock ? ' sin-stock-image' : ''}">`
    : `<div class="ig-img-placeholder" style="background:${grad}${sinStock ? ';filter:grayscale(55%) opacity(.7)' : ''}">
         <span>${inicial}</span>
       </div>`;

  const maxQty = sinStock ? 1 : Math.min(stock, 99);

  const qtyRow = sinStock
    ? `<div class="ig-qty-row opacity-50">
         <button class="ig-qty-btn" disabled>−</button>
         <input type="number" class="ig-qty-input" value="1" disabled>
         <button class="ig-qty-btn" disabled>+</button>
       </div>`
    : `<div class="ig-qty-row">
         <button class="ig-qty-btn" onclick="cambiarCantidadCard(${producto.id},-1,${stock})">−</button>
         <input type="number" id="qty_${producto.id}" class="ig-qty-input" value="1" min="1" max="${maxQty}">
         <button class="ig-qty-btn" onclick="cambiarCantidadCard(${producto.id},1,${stock})">+</button>
       </div>`;

  const addBtn = sinStock
    ? `<button class="btn-ig-add sin-stock" disabled>
         <i class="bi bi-x-circle"></i> Sin stock
       </button>`
    : `<button class="btn-ig-add"
            onclick="agregarAlCarrito(_productosMap[${producto.id}],parseInt(document.getElementById('qty_${producto.id}').value))">
         <i class="bi bi-cart-plus"></i> Agregar
       </button>`;

  return `
    <div class="col-6 col-md-4 col-xl-3 store-card-animate" style="animation-delay:${delay}ms">
      <div class="ig-product-card">
        <div class="ig-img-wrap">
          ${imgHTML}
          ${badge}
        </div>
        <div class="ig-card-body">
          <div class="ig-product-name">${nombre}</div>
          <div class="ig-product-desc">${descripcion}</div>
          <div class="ig-product-price">S/ ${precio}</div>
          ${qtyRow}
          ${addBtn}
        </div>
      </div>
    </div>`;
}

// --- Recuperar cuenta cliente ---
let _fcTempPass = '', _fcNombre = '', _fcDni = '';

function fcReset() {
  ['fcStep2','fcStep3','fcStep4'].forEach(id => document.getElementById(id)?.classList.add('d-none'));
  document.getElementById('fcStep1')?.classList.remove('d-none');
  ['fcError1','fcError2'].forEach(id => document.getElementById(id)?.classList.add('d-none'));
  const bca = document.getElementById('fcBtnContactAdmin2'); if (bca) bca.classList.add('d-none');
  const f1 = document.getElementById('fcDni'); if (f1) f1.value = '';
  const f2 = document.getElementById('fcRespuesta'); if (f2) f2.value = '';
}

function fcIrContactAdmin() {
  ['fcStep1','fcStep2','fcStep3'].forEach(id => document.getElementById(id)?.classList.add('d-none'));
  document.getElementById('fcStep4')?.classList.remove('d-none');
}

async function fcBuscarPregunta() {
  const dni = (document.getElementById('fcDni')?.value || '').trim();
  const errEl = document.getElementById('fcError1');
  const btnEl = document.getElementById('fcBtn1');
  errEl.classList.add('d-none');
  if (!/^\d{8}$/.test(dni)) { errEl.textContent = 'Ingresa un DNI válido de 8 dígitos.'; errEl.classList.remove('d-none'); return; }
  if (btnEl) btnEl.textContent = 'Buscando...';
  try {
    const data = await apiFetch('/api/clientes/forgot-password/pregunta', { method: 'POST', body: JSON.stringify({ dni }) });
    _fcDni = dni;
    _fcNombre = data.nombre;
    document.getElementById('fcPreguntaText').textContent = data.pregunta;
    document.getElementById('fcStep1').classList.add('d-none');
    document.getElementById('fcStep2').classList.remove('d-none');
  } catch (e) {
    fcIrContactAdmin();
  } finally { if (btnEl) btnEl.textContent = 'Continuar'; }
}

async function fcVerificar() {
  const respuesta = (document.getElementById('fcRespuesta')?.value || '').trim();
  const errEl = document.getElementById('fcError2');
  const btnEl = document.getElementById('fcBtn2');
  errEl.classList.add('d-none');
  if (!respuesta) { errEl.textContent = 'Escribe tu respuesta.'; errEl.classList.remove('d-none'); return; }
  if (btnEl) btnEl.textContent = 'Verificando...';
  try {
    const data = await apiFetch('/api/clientes/forgot-password/verificar', { method: 'POST', body: JSON.stringify({ dni: _fcDni, respuesta }) });
    _fcTempPass = data.tempPassword;
    document.getElementById('fcTempPass').textContent = data.tempPassword;
    document.getElementById('fcNombre').textContent = data.nombre;
    document.getElementById('fcTelefono').value = data.telefono || '';
    document.getElementById('fcStep2').classList.add('d-none');
    document.getElementById('fcStep3').classList.remove('d-none');
  } catch (e) {
    errEl.textContent = e.message;
    errEl.classList.remove('d-none');
    document.getElementById('fcBtnContactAdmin2')?.classList.remove('d-none');
  } finally { if (btnEl) btnEl.textContent = 'Verificar'; }
}

function fcCopiar() { navigator.clipboard.writeText(_fcTempPass); }

function fcEnviarWsp() {
  const tel = (document.getElementById('fcTelefono')?.value || '').replace(/\D/g, '');
  if (!tel) { alert('Ingresa tu número de WhatsApp.'); return; }
  const msg = encodeURIComponent(`Hola ${_fcNombre}, tu nueva contraseña temporal de Dulce Momento es: *${_fcTempPass}*\nCámbiala después de ingresar.`);
  window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
}

async function fcContactarAdmin() {
  const btn = document.getElementById('fcBtnContactAdmin');
  if (btn) { btn.textContent = 'Buscando contacto...'; btn.disabled = true; }
  try {
    const admin = await apiFetch('/api/auth/admin-contacto');
    const tel = (admin.telefono || '').replace(/\D/g, '');
    const nombre = _fcNombre || 'un cliente';
    const msg = encodeURIComponent(`Hola ${admin.nombre}, soy ${nombre} y necesito recuperar mi contraseña de Dulce Momento. ¿Puedes ayudarme?`);
    if (tel) {
      window.open(`https://wa.me/${tel}?text=${msg}`, '_blank');
    } else {
      alert('El administrador no tiene número registrado. Contáctalo directamente.');
    }
  } catch (e) {
    alert('No se pudo obtener el contacto del administrador.');
  } finally {
    if (btn) { btn.innerHTML = '<i class="bi bi-whatsapp me-1"></i> Notificar al administrador'; btn.disabled = false; }
  }
}
