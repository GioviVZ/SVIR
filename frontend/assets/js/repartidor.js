function authHeaders() {
  return { "Content-Type": "application/json", "Authorization": "Bearer " + localStorage.getItem("token") };
}

let autoRefreshTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.rol && user.rol !== "REPARTIDOR" && user.rol !== "ADMIN") {
    window.location.href = "dashboard.html";
    return;
  }
  document.getElementById("repNombre").textContent = user.nombre || "Repartidor";
  cargarPedidos();

  autoRefreshTimer = setInterval(cargarPedidos, 30000);
});

async function cargarPedidos() {
  document.getElementById("spinnerCarga").classList.remove("d-none");
  document.getElementById("contenidoRep").classList.add("d-none");

  try {
    const res = await fetch(`${API_BASE}/api/pedidos/delivery`, { headers: authHeaders() });
    if (!res.ok) throw new Error("Error al cargar pedidos");
    const pedidos = await res.json();
    renderPedidos(pedidos);
  } catch (e) {
    document.getElementById("spinnerCarga").innerHTML =
      `<div class="text-danger text-center p-4"><i class="bi bi-exclamation-circle me-1"></i>${e.message}</div>`;
    return;
  }

  document.getElementById("spinnerCarga").classList.add("d-none");
  document.getElementById("contenidoRep").classList.remove("d-none");
}

function renderPedidos(pedidos) {
  const listos     = pedidos.filter(p => p.estado === "LISTO");
  const enCamino   = pedidos.filter(p => p.estado === "EN_CAMINO");
  const entregados = pedidos.filter(p => p.estado === "ENTREGADO")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  document.getElementById("contadorListo").textContent     = listos.length;
  document.getElementById("contadorEnCamino").textContent  = enCamino.length;
  document.getElementById("contadorEntregados").textContent = entregados.length;

  document.getElementById("badgeListo").textContent      = listos.length;
  document.getElementById("badgeEnCamino").textContent   = enCamino.length;
  document.getElementById("badgeEntregados").textContent = entregados.length;

  const totalEntregado = entregados.reduce((sum, p) => sum + Number(p.total ?? 0), 0);
  document.getElementById("totalEntregadoHoy").textContent = `S/ ${totalEntregado.toFixed(2)}`;

  document.getElementById("listaPendientes").innerHTML  = listos.length     ? listos.map(cardDelivery).join("")     : emptyState("No hay pedidos listos para recoger");
  document.getElementById("listaEnCamino").innerHTML    = enCamino.length   ? enCamino.map(cardDelivery).join("")   : emptyState("Ningún pedido en camino");
  document.getElementById("listaEntregados").innerHTML  = entregados.length ? entregados.map(cardDelivery).join("") : emptyState("Sin entregas aún hoy");
}

function timeAgo(fecha) {
  if (!fecha) return "";
  const diffMs = Date.now() - new Date(fecha).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "Justo ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.floor(min / 60);
  return `Hace ${h} h ${min % 60} min`;
}

function cardDelivery(p) {
  const obs = p.observacion || "";
  const partes = obs.split("|").map(s => s.trim());
  const dir    = partes.find(s => s.startsWith("Dir:"))?.replace("Dir:", "").trim() || "—";
  const tel    = partes.find(s => s.startsWith("Tel:"))?.replace("Tel:", "").trim() || null;
  const ref    = partes.find(s => s.startsWith("Ref:"))?.replace("Ref:", "").trim() || null;
  const gps    = partes.find(s => s.startsWith("GPS:"))?.replace("GPS:", "").trim() || null;

  const clienteRaw = partes[partes.length - 1] || "";
  const clienteNombre = p.clienteNombre || clienteRaw.replace(/\(.*\)/, "").trim() || "Cliente";

  const estadoKey  = (p.estado || "").toLowerCase();
  const estadoLabel = { listo: "Listo para recoger", en_camino: "En camino", entregado: "Entregado" }[estadoKey] || p.estado;

  const mapsUrl = gps
    ? `https://maps.google.com/?q=${gps}`
    : (dir !== "—" ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}` : null);

  const mapsBtn = mapsUrl
    ? `<a href="${mapsUrl}" target="_blank" class="maps-link"><i class="bi bi-geo-alt-fill me-1"></i>Ver en mapa</a>`
    : "";

  const telBtn = tel
    ? `<a href="tel:${tel}" class="tel-link"><i class="bi bi-telephone-fill me-1"></i>${tel}</a>`
    : "";

  const telDigits = (tel || "").replace(/\D/g, "");
  const waBtn = telDigits
    ? `<a href="https://wa.me/${telDigits}" target="_blank" class="wa-link"><i class="bi bi-whatsapp me-1"></i>WhatsApp</a>`
    : "";

  const items = (p.detalles || [])
    .map(d => `<li>${d.cantidad}x ${d.productoNombre}</li>`)
    .join("");

  const acciones = (() => {
    if (p.estado === "LISTO")
      return `<button class="btn-rep-primary" onclick="cambiarEstado(${p.id},'EN_CAMINO')"><i class="bi bi-scooter me-1"></i>Salir a entregar</button>`;
    if (p.estado === "EN_CAMINO")
      return `<button class="btn-rep-success" onclick="cambiarEstado(${p.id},'ENTREGADO')"><i class="bi bi-check2 me-1"></i>Marcar entregado</button>`;
    return "";
  })();

  return `
    <div class="delivery-card estado-${estadoKey}" id="card-${p.id}">
      <div class="d-flex justify-content-between align-items-start mb-1">
        <span class="cliente-nombre">#${p.id} · ${clienteNombre}</span>
        <span class="badge-estado-${estadoKey}">${estadoLabel}</span>
      </div>
      <div class="delivery-meta mb-1"><i class="bi bi-clock-history me-1"></i>${timeAgo(p.createdAt)}</div>
      <div class="delivery-dir d-flex align-items-start gap-2">
        <span class="flex-grow-1"><i class="bi bi-house me-1"></i>${dir}</span>
        ${dir !== "—" ? `<button class="copy-btn" title="Copiar dirección" onclick="copiarDireccion(this,'${dir.replace(/'/g, "\\'")}')"><i class="bi bi-clipboard"></i></button>` : ""}
      </div>
      ${ref ? `<div class="delivery-meta"><i class="bi bi-signpost me-1"></i>${ref}</div>` : ""}
      ${items ? `<ul class="items-list">${items}</ul>` : ""}
      <div class="d-flex gap-3 align-items-center mt-2 flex-wrap">
        ${telBtn}
        ${waBtn}
        ${mapsBtn}
        <span class="total-badge ms-auto">S/ ${Number(p.total ?? 0).toFixed(2)}</span>
      </div>
      ${acciones ? `<div class="mt-3 d-grid">${acciones}</div>` : ""}
    </div>`;
}

function copiarDireccion(btn, dir) {
  navigator.clipboard.writeText(dir).then(() => {
    const icon = btn.querySelector("i");
    icon.className = "bi bi-check2";
    setTimeout(() => { icon.className = "bi bi-clipboard"; }, 1500);
  });
}

async function cambiarEstado(id, nuevoEstado) {
  try {
    const res = await fetch(`${API_BASE}/api/pedidos/${id}/estado`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error("No se pudo actualizar");
    cargarPedidos();
  } catch (e) {
    alert("Error: " + e.message);
  }
}

function emptyState(msg) {
  return `<div class="empty-state"><i class="bi bi-inbox me-1"></i>${msg}</div>`;
}
