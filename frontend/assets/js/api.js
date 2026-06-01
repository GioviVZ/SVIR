const API_BASE = (() => {
  const h = window.location.hostname;
  if (h.includes('devtunnels.ms')) {
    return `${window.location.protocol}//${h.replace(/-\d+\.brs\./, '-8080.brs.')}`;
  }
  return `http://${h}:8080`;
})();

function getToken() {
  return localStorage.getItem("token");
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401 || response.status === 403) {
    // Solo redirigir al login si es personal del sistema (tiene token de staff)
    const esPersonal = !!localStorage.getItem("user");
    if (esPersonal) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "index.html";
    }
    throw new Error("No tienes permiso para realizar esta acción.");
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const mensaje = typeof data === "object"
      ? (data?.message || data?.error || JSON.stringify(data))
      : (data || "Error en la petición");
    throw new Error(mensaje);
  }

  return data;
}