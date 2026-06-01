async function login(username, password) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email: username, password })
  });

  if (!response.ok) {
    let message = "Credenciales inválidas";
    try {
      const error = await response.json();
      message = error.message || message;
    } catch (_) {}
    throw new Error(message);
  }

  const data = await response.json();

  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data));

  const homeByRol = { ADMIN: 'dashboard.html', VENTAS: 'pos.html', COCINA: 'produccion.html', REPARTIDOR: 'repartidor.html' };
  window.location.href = homeByRol[data.rol] || 'dashboard.html';
}

function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}