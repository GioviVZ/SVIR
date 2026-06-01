function authHeaders() {
  return { "Content-Type": "application/json", "Authorization": "Bearer " + localStorage.getItem("token") };
}

document.addEventListener("DOMContentLoaded", () => {
  requireAuth();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.rol && user.rol !== "REPARTIDOR" && user.rol !== "ADMIN") {
    window.location.href = "dashboard.html";
    return;
  }
  document.getElementById("repNombre").textContent = user.nombre || "Repartidor";
  cargarPedidos();
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
  const entregados = pedidos.filter(p => p.estado === "ENTREGADO");

  document.getElementById("listaPendientes").innerHTML  = listos.length     ? listos.map(cardDelivery).join("")     : emptyState("No hay pedidos listos para recoger");
  document.getElementById("listaEnCamino").innerHTML    = enCamino.length   ? enCamino.map(cardDelivery).join("")   : emptyState("Ningún pedido en camino");
  document.getElementById("listaEntregados").innerHTML  = entregados.length ? entregados.map(cardDelivery).join("") : emptyState("Sin entregas aún hoy");
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

  const mapsBtn = gps
    ? `<a href="https://maps.google.com/?q=${gps}" target="_blank" class="maps-link"><i class="bi bi-geo-alt-fill me-1"></i>Ver en mapa</a>`
    : "";

  const telBtn = tel
    ? `<a href="tel:${tel}" class="tel-link"><i class="bi bi-telephone-fill me-1"></i>${tel}</a>`
    : "";

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
        <span class="cliente-nombre">${clienteNombre}</span>
        <span class="badge-estado-${estadoKey}">${estadoLabel}</span>
      </div>
      <div class="delivery-dir"><i class="bi bi-house me-1"></i>${dir}</div>
      ${ref ? `<div class="delivery-meta"><i class="bi bi-signpost me-1"></i>${ref}</div>` : ""}
      <div class="d-flex gap-3 align-items-center mt-2 flex-wrap">
        ${telBtn}
        ${mapsBtn}
        <span class="total-badge ms-auto">S/ ${Number(p.total ?? 0).toFixed(2)}</span>
      </div>
      ${acciones ? `<div class="mt-3 d-grid">${acciones}</div>` : ""}
    </div>`;
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
