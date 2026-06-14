# SVIR — Sistema de Ventas e Inventario para Repostería

Sistema de gestión integral para la pastelería **Dulce Momento**. Cubre el ciclo completo: producción en cocina, inventario de ingredientes y productos, punto de venta presencial con emisión de comprobantes, pedidos multicanal y tienda web con autenticación de clientes.

---

## Módulos del sistema

| Módulo | Descripción |
|---|---|
| **Dashboard** | Resumen de ventas del día, pedidos pendientes y productos con stock bajo |
| **Productos** | Catálogo con precio, stock, stock mínimo y foto; alerta visual de stock crítico |
| **Ingredientes** | Control de insumos con unidad de medida (kg, litros, unidades…); alerta de stock mínimo |
| **Recetas** | Vincula cada producto con sus ingredientes y cantidades exactas |
| **Pedidos** | Gestión multicanal (PRESENCIAL, TIENDA, WHATSAPP, WEB); cambio de estado, cancelación con devolución de stock |
| **Producción** | Órdenes de cocina: por pedido o para reponer stock; descuenta ingredientes automáticamente al finalizar |
| **Punto de Venta** | POS interno: selección de productos, carrito, elección de comprobante (Boleta simple / Boleta con DNI / Factura con RUC) e impresión del ticket |
| **Movimientos** | Historial de entradas y salidas de productos e ingredientes con trazabilidad completa |
| **Clientes** | Registro con DNI / RUC, teléfono y dirección; login con contraseña desde la tienda web; recuperación con pregunta de seguridad; restablecimiento de contraseña desde el panel |
| **Usuarios** | Alta y baja de personal con roles (Admin, Ventas, Cocina, Repartidor); contraseña con BCrypt; pregunta de seguridad para recuperación de clave |
| **Tienda web** | Catálogo público, carrito y checkout con recojo en tienda o delivery (dirección + GPS); modos de acceso: invitado, registro con contraseña, login con DNI + contraseña |
| **Mis pedidos** | Seguimiento del estado del pedido para el cliente (timeline visual); historial automático para clientes registrados e invitados |
| **Panel Repartidor** | Vista mobile-first para personal con rol Repartidor: pedidos listos para recoger, en camino y entregados hoy, con dirección, GPS, WhatsApp y resumen del día |

---

## Stack tecnológico

**Backend**
- Java 21 + Spring Boot 3.5.6
- Spring Security + JWT (jjwt 0.12.6) — filtro tolerante a tokens expirados en rutas públicas
- Spring Data JPA + Hibernate
- MySQL 8
- Lombok · SpringDoc OpenAPI (Swagger UI en `/swagger-ui/index.html`)

**Frontend**
- HTML5 + CSS3 + JavaScript vanilla
- Bootstrap 5.3.3 + Bootstrap Icons 1.11.3
- Sin framework de frontend — páginas HTML independientes, un `.js` por módulo

---

## Roles y acceso

| Rol | Home por defecto | Páginas disponibles |
|---|---|---|
| `ADMIN` | dashboard.html | Todas: dashboard, productos, ingredientes, recetas, pedidos, producción, POS, movimientos, usuarios, clientes, repartidor |
| `VENTAS` | pos.html | POS, productos, pedidos, clientes |
| `COCINA` | produccion.html | Producción, ingredientes, recetas |
| `REPARTIDOR` | repartidor.html | Solo el panel de repartidor (acceso de delivery) |

`movimientos.html` (historial de inventario) es exclusivo de `ADMIN`.

Las rutas públicas (catálogo, registro/login/recuperación de clientes, pedidos y seguimiento desde la tienda web) no requieren autenticación de personal.

---

## Estructura del proyecto

```
SVIR/
├── docs/
│   └── schema.sql                   # DDL completo de la base de datos
│
├── backend/
│   └── svir-api/
│       ├── pom.xml
│       └── src/main/java/com/svir/api/
│           ├── controller/          # 10 controladores REST
│           ├── service/             # Lógica de negocio
│           ├── entity/              # 11 entidades JPA
│           ├── dto/                 # Request / Response DTOs
│           ├── repository/          # Spring Data repositories
│           ├── security/            # JwtService, JwtAuthFilter, CustomUserDetailsService
│           ├── config/              # CORS, WebMvc, SecurityConfig
│           ├── enums/               # EstadoPedido, TipoOrigen, RolUsuario, motivos…
│           └── exception/           # GlobalExceptionHandler, BusinessException, ResourceNotFoundException
│
└── frontend/
    ├── index.html                   # Redirige automáticamente a home.html
    ├── login.html                   # Login del personal interno (con recuperación de clave)
    ├── home.html                    # Landing pública + modal de auth de clientes
    ├── catalogo.html                # Catálogo público de productos
    ├── carrito.html                 # Carrito de compras (tienda web), recojo o delivery + GPS
    ├── checkout.html                # Checkout (tienda web)
    ├── mis-pedidos.html             # Seguimiento e historial de pedidos del cliente
    ├── dashboard.html               # Panel de control (ADMIN)
    ├── productos.html               # CRUD de productos
    ├── ingredientes.html            # CRUD de ingredientes (incl. +Stock / -Merma)
    ├── recetas.html                 # Recetas por producto
    ├── pedidos.html                 # Gestión de pedidos (incl. pin GPS de delivery)
    ├── produccion.html              # Órdenes de cocina
    ├── pos.html                     # Punto de venta presencial
    ├── movimientos.html             # Historial de movimientos (solo ADMIN)
    ├── clientes.html                # Gestión de clientes
    ├── usuarios.html                # Gestión de personal (incl. rol Repartidor)
    ├── repartidor.html              # Panel mobile-first del repartidor
    └── assets/
        ├── css/styles.css
        ├── js/
        │   ├── api.js              # API_BASE dinámico + apiFetch() con JWT automático
        │   ├── auth.js             # Login / logout del personal (redirige por rol)
        │   ├── ui.js               # requireAuth(), control de acceso por rol (ROL_ACCESO)
        │   ├── dashboard.js
        │   ├── productos.js
        │   ├── ingredientes.js
        │   ├── recetas.js
        │   ├── pedidos.js
        │   ├── produccion.js
        │   ├── pos.js              # Carrito POS + modal de comprobante
        │   ├── movimientos.js
        │   ├── clientes.js         # CRUD + reseteo de contraseña
        │   ├── usuarios.js
        │   ├── carrito.js          # Carrito web + checkout (recojo / delivery)
        │   ├── tienda.js            # Catálogo, auth de clientes, carrito web, historial de pedidos
        │   ├── mis-pedidos.js      # Seguimiento de pedidos del cliente
        │   └── repartidor.js       # Panel de delivery (auto-refresh, GPS, WhatsApp)
        └── img/
```

> **Importante:** todos los HTML deben cargar `api.js` **antes** de `auth.js`/`tienda.js`, ya que estos dependen de `API_BASE`.

---

## Instalación y configuración

### Requisitos previos

- Java 21
- Maven 3.9+
- MySQL 8

### 1. Base de datos

```sql
CREATE DATABASE reposteria CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
```

Importa el esquema completo:

```bash
mysql -u root -p reposteria < docs/schema.sql
```

### 2. Configuración del backend

Edita `backend/svir-api/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/reposteria?useSSL=false&serverTimezone=America/Lima&allowPublicKeyRetrieval=true
spring.datasource.username=TU_USUARIO
spring.datasource.password=TU_CONTRASEÑA

app.jwt.secret=TU_SECRETO_BASE64_LARGO
app.jwt.expiration-ms=86400000

app.upload.dir=uploads
```

### 3. Iniciar el backend

```bash
cd backend/svir-api
mvn spring-boot:run
```

API disponible en `http://localhost:8080`.  
Swagger UI: `http://localhost:8080/swagger-ui/index.html`

Para acceder desde un celular en la misma red WiFi, `application.properties` debe tener `server.address=0.0.0.0` y conviene arrancar con:

```bash
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Djava.net.preferIPv4Stack=true"
```

Sin ese flag, Spring Boot puede quedar escuchando solo en IPv6 y los dispositivos móviles no logran conectarse.

### 4. Abrir el frontend

Sirve la carpeta `frontend` con un servidor estático y abre `index.html` (redirige a `home.html`):

```bash
cd frontend
php -S 0.0.0.0:5500
```

> En macOS evita `python3 -m http.server` para esto — hay versiones con un bug (`OSError: [Errno 57] Socket is not connected`) al servir por IPv4. `php -S` no tiene ese problema.

`frontend/assets/js/api.js` detecta automáticamente la URL del backend (`API_BASE`) según el host:

- **Localhost:** `http://localhost:8080`
- **Red local / celular:** `http://<IP-del-host>:8080` (usa `window.location.hostname`)
- **Dev Tunnels de VS Code** (`*.devtunnels.ms`): reemplaza el puerto del túnel de frontend por el del backend automáticamente

Nunca hardcodear `http://localhost:8080` en el JS — usar siempre `API_BASE`.

---

## API — Endpoints completos

### Autenticación (`/api/auth`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Login personal: `{email, password}` → `{token, rol, nombre}` |
| GET | `/api/auth/me` | JWT | Perfil del usuario autenticado |
| GET | `/api/auth/admin-contacto` | Público | Devuelve nombre/teléfono de un ADMIN activo para contacto de soporte |
| POST | `/api/auth/forgot-password/pregunta` | Público | `{email}` → devuelve la pregunta de seguridad configurada |
| POST | `/api/auth/forgot-password/verificar` | Público | `{email, respuesta}` → si coincide, genera y devuelve una contraseña temporal |
| PATCH | `/api/auth/cambiar-password` | JWT | `{passwordActual, passwordNueva}` — cambia la propia contraseña |

### Productos (`/api/productos`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/productos` | Público | Listar todos los productos activos |
| GET | `/api/productos/{id}` | Público | Obtener producto por ID |
| POST | `/api/productos` | ADMIN, VENTAS | Crear producto: `{nombre, descripcion, precio, stock, stockMinimo}` |
| PUT | `/api/productos/{id}` | ADMIN, VENTAS | Actualizar producto |
| PATCH | `/api/productos/{id}/activo` | ADMIN, VENTAS | Activar / desactivar: `?activo=true` |
| POST | `/api/productos/{id}/imagen` | ADMIN, VENTAS | Subir imagen: `multipart/form-data` |

### Ingredientes (`/api/ingredientes`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/ingredientes` | ADMIN, COCINA | Listar ingredientes |
| GET | `/api/ingredientes/{id}` | ADMIN, COCINA | Obtener ingrediente |
| POST | `/api/ingredientes` | ADMIN, COCINA | Crear: `{nombre, unidadMedida, stock, stockMinimo}` |
| PUT | `/api/ingredientes/{id}` | ADMIN, COCINA | Actualizar |
| PATCH | `/api/ingredientes/{id}/activo` | ADMIN, COCINA | Activar / desactivar |
| POST | `/api/ingredientes/{id}/movimientos` | ADMIN, COCINA | Registrar movimiento: `{tipo, motivo, cantidad}` |
| GET | `/api/ingredientes/{id}/movimientos` | ADMIN, COCINA | Historial de movimientos del ingrediente |

### Recetas (`/api/recetas`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/recetas/producto/{productoId}` | ADMIN, COCINA | Obtener receta de un producto |
| PUT | `/api/recetas/producto/{productoId}` | ADMIN, COCINA | Reemplazar receta: `{ingredientes: [{id, cantidad}]}` |

### Pedidos (`/api/pedidos`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/pedidos` | ADMIN, VENTAS | Listar todos los pedidos |
| GET | `/api/pedidos/delivery` | ADMIN, VENTAS, REPARTIDOR | Pedidos `DELIVERY` activos (LISTO/EN_CAMINO) + entregados hoy |
| GET | `/api/pedidos/cliente/{clienteId}` | Público | Historial de pedidos de un cliente registrado, más reciente primero |
| GET | `/api/pedidos/seguimiento/{id}` | Público | Detalle de un pedido por ID (para seguimiento de invitados) |
| GET | `/api/pedidos/{id}` | ADMIN, VENTAS | Obtener pedido por ID |
| POST | `/api/pedidos` | Público* | Crear pedido: `{clienteId?, tipoOrigen, observacion?, detalles: [{productoId, cantidad}]}` |
| PATCH | `/api/pedidos/{id}/estado` | ADMIN, VENTAS, REPARTIDOR | Cambiar estado: `{estado: "EN_CAMINO"}` |
| PATCH | `/api/pedidos/{id}/cancelar` | ADMIN, VENTAS | Cancelar y restaurar stock |

*Público para pedidos de tienda web (`tipoOrigen: "TIENDA"` o `"WEB"`/`"DELIVERY"` desde el carrito); el POS envía `"PRESENCIAL"`.

La respuesta incluye `produccionId` (nullable): cuando el pedido se crea desde el POS con stock insuficiente, el sistema auto-genera una orden de producción y devuelve su ID en este campo.

Para pedidos `DELIVERY`, la dirección, teléfono, referencia y coordenadas GPS se guardan codificados en `observacion` (ver [Flujo de delivery](#tienda-web--delivery-con-gps-y-panel-de-repartidor)).

### Producciones (`/api/producciones`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/producciones` | ADMIN, COCINA | Listar órdenes de producción |
| GET | `/api/producciones/{id}` | ADMIN, COCINA | Obtener orden por ID |
| POST | `/api/producciones/por-pedido/{pedidoId}` | ADMIN, COCINA | Crear orden desde un pedido |
| POST | `/api/producciones` | ADMIN, COCINA | Crear orden para stock: `{detalles: [{productoId, cantidad}]}` |
| PATCH | `/api/producciones/{id}/terminar` | ADMIN, COCINA | Finalizar y registrar producción: `{detalles: [{id, cantidadProducida}]}` |
| PATCH | `/api/producciones/{id}/cancelar` | ADMIN, COCINA | Cancelar orden |

### Clientes (`/api/clientes`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/clientes` | ADMIN, VENTAS | Listar clientes |
| POST | `/api/clientes/registro` | Público | Registro tienda web: `{nombre, dni, ruc?, telefono?, email?, direccion?, password, preguntaSeguridad?, respuestaSeguridad?}` |
| POST | `/api/clientes/login` | Público | Login tienda web: `{dni, password}` → datos del cliente |
| GET | `/api/clientes/buscar` | Público | Buscar por DNI: `?dni=12345678` |
| POST | `/api/clientes/forgot-password/pregunta` | Público | `{dni}` → devuelve la pregunta de seguridad configurada |
| POST | `/api/clientes/forgot-password/verificar` | Público | `{dni, respuesta}` → si coincide, genera y devuelve una contraseña temporal |
| POST | `/api/clientes` | ADMIN, VENTAS | Crear cliente manualmente |
| PUT | `/api/clientes/{id}` | ADMIN, VENTAS | Actualizar cliente |
| PATCH | `/api/clientes/{id}/activo` | ADMIN, VENTAS | Activar / desactivar |
| PATCH | `/api/clientes/{id}/resetear-clave` | ADMIN, VENTAS | Restablecer contraseña: `{password}` |
| POST | `/api/clientes/{id}/generar-clave-temporal` | ADMIN, VENTAS | Genera y devuelve una contraseña temporal aleatoria |

### Usuarios (`/api/usuarios`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/usuarios` | ADMIN | Listar personal |
| POST | `/api/usuarios` | ADMIN | Crear usuario: `{nombre, email, password, rol, telefono?, preguntaSeguridad?, respuestaSeguridad?}` |
| PUT | `/api/usuarios/{id}` | ADMIN | Actualizar usuario |
| PATCH | `/api/usuarios/{id}/activo` | ADMIN | Activar / desactivar |
| POST | `/api/usuarios/{id}/generar-clave-temporal` | ADMIN | Genera y devuelve una contraseña temporal aleatoria |

`rol` admite `ADMIN`, `VENTAS`, `COCINA` o `REPARTIDOR`.

### Dashboard y Salud

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/dashboard` | ADMIN, VENTAS, COCINA | Resumen: ventas, stock bajo, pedidos recientes |
| GET | `/api/health` | Público | Health check: `{"status": "ok"}` |

---

## Flujos clave

### Tienda web — Autenticación de clientes

Los clientes del sitio público tienen tres modos de acceso en el modal de `home.html` y `catalogo.html`:

1. **Sin cuenta (invitado):** ingresa solo nombre y teléfono; el pedido queda sin `clienteId`.
2. **Registro:** crea cuenta con DNI obligatorio, contraseña (mínimo 6 caracteres) y, opcionalmente, una pregunta de seguridad para recuperación; la contraseña se almacena hasheada con BCrypt.
3. **Login:** ingresa DNI + contraseña; el backend valida con `POST /api/clientes/login`.

El personal puede restablecer la contraseña de cualquier cliente desde `clientes.html` con el botón 🔑 de cada fila, o generar una clave temporal aleatoria.

### Recuperación de contraseña con pregunta de seguridad

Tanto el personal interno (`login.html`) como los clientes de la tienda web (`home.html` / `catalogo.html`) pueden recuperar su acceso sin intervención del administrador:

1. El usuario ingresa su **email** (personal) o **DNI** (cliente).
2. Si la cuenta tiene `pregunta_seguridad` configurada, el backend la devuelve (`POST .../forgot-password/pregunta`).
3. El usuario responde; si la respuesta coincide (hasheada con BCrypt) con `respuesta_seguridad`, el backend genera y devuelve una **contraseña temporal aleatoria** (`POST .../forgot-password/verificar`) que el usuario debe cambiar después.
4. Si la cuenta **no** tiene pregunta de seguridad configurada, la pantalla muestra los datos de contacto de un ADMIN (`GET /api/auth/admin-contacto`) para que el usuario solicite el restablecimiento manualmente.
5. El personal puede cambiar su propia contraseña en cualquier momento desde su sesión con `PATCH /api/auth/cambiar-password` (requiere la contraseña actual).

### Tienda web — Delivery con GPS y panel de repartidor

En `carrito.html`, al confirmar el pedido el cliente elige entre **"Recojo en tienda"** o **"Delivery"**:

- **Recojo:** `tipoOrigen: "TIENDA"`, sin datos adicionales.
- **Delivery:** `tipoOrigen: "DELIVERY"`, requiere dirección y teléfono (referencia opcional). El teléfono se auto-rellena desde la sesión del cliente si existe.
  - Botón **"Marcar mi ubicación actual"** usa la Geolocation API del navegador (sin API key) para capturar `lat,lng`.
  - Todo se codifica en el campo `observacion` con el formato:
    ```
    Dir: {dirección} | Tel: {teléfono} | Ref: {referencia} | GPS: {lat},{lng} | {info del cliente}
    ```

En `pedidos.html` (panel admin), los pedidos delivery muestran un pin de ubicación (`bi-geo-alt-fill`) con link directo a Google Maps cuando hay coordenadas GPS.

El **panel de repartidor** (`repartidor.html`, rol `REPARTIDOR`) consume `GET /api/pedidos/delivery` y organiza los pedidos en tres columnas:

| Sección | Estado | Acción disponible |
|---|---|---|
| Para recoger | `LISTO` | "Salir a entregar" → `EN_CAMINO` |
| En camino | `EN_CAMINO` | "Marcar entregado" → `ENTREGADO` |
| Entregados hoy | `ENTREGADO` (hoy) | — |

Cada tarjeta muestra: tiempo transcurrido desde la creación, dirección (con botón de copiar), referencia, lista de productos, botones de llamada/WhatsApp y link a Google Maps (por GPS o, si no hay coordenadas, por búsqueda de la dirección). Un resumen superior muestra contadores por estado y el total cobrado en entregas del día. La lista se auto-refresca cada 30 segundos.

### Mis pedidos — Seguimiento e historial

`mis-pedidos.html` permite a cualquier cliente ver el estado de sus pedidos:

- **Clientes registrados** (con `clienteId` en sesión): carga automática vía `GET /api/pedidos/cliente/{clienteId}`.
- **Invitados:** pueden buscar un pedido por número (`GET /api/pedidos/seguimiento/{id}`); los pedidos consultados se guardan en `localStorage` (`misPedidosWeb`, máx. 20) para mostrarlos automáticamente en visitas posteriores.

Cada pedido se muestra con una línea de tiempo visual (4 pasos para recojo, 5 para delivery, incluyendo "En camino"); los pedidos `CANCELADO` ocultan la línea de tiempo y muestran un badge rojo. Los pedidos delivery muestran la dirección y un link "Ver en mapa". La página se auto-refresca cada 30 segundos. Tras crear un pedido desde `carrito.html`, el cliente recibe un link directo "Ver seguimiento" hacia esta página.

### POS — Flujo de venta completo

Al presionar **Cobrar** en el POS se abre un modal de selección de comprobante:

| Opción | Datos requeridos | Comportamiento |
|---|---|---|
| **Boleta simple** | Ninguno | Emite a *Consumidor Final* directamente |
| **Boleta con DNI** | DNI (8 dígitos) | Busca el cliente en BD; si existe auto-rellena nombre (editable); si no, permite ingreso manual |
| **Factura** | RUC (11 dígitos) | Busca el cliente por RUC; si existe auto-rellena razón social y dirección (editables); si no, permite ingreso manual |

El ticket imprimible muestra el tipo de documento (`BOLETA DE VENTA` / `FACTURA`), los datos del receptor y el detalle de productos atendidos.

#### Estados resultantes al cobrar

| Situación | Estado del pedido | Acción automática |
|---|---|---|
| Todo el stock disponible | `LISTO` | Se marca `ENTREGADO` de inmediato |
| Stock parcial o sin stock | `PREPARACION` | Se crea una orden de producción en cocina automáticamente |

Cuando hay stock insuficiente, el POS muestra el número de la orden de producción generada (p. ej. *"Orden de producción #12 enviada a cocina"*) para que el cajero confirme que cocina ya tiene la tarea.

#### Auto-creación de orden de producción

El sistema crea la orden automáticamente siguiendo estas reglas:

- Solo se incluyen los productos con cantidad faltante (los que ya se atendieron con stock no entran).
- Si un producto no tiene receta configurada, igual se incluye en la orden (cocina lo gestiona manualmente), pero no se descuentan ingredientes.
- Los ingredientes se descuentan en ese momento si hay stock suficiente; si faltan ingredientes, se omite ese descuento y la cocina verá la alerta de stock bajo al revisar.
- Los pedidos de la tienda web (anónimos) **no** generan producción automática; cocina los gestiona manualmente.

### Producción — Ciclo de vida de una orden

#### Creación

Una orden de producción puede originarse de dos formas:

| Origen | Método | Descripción |
|---|---|---|
| **Automático** | Desde el POS al crear un pedido con faltantes | La orden se crea con observación *"Generado automáticamente desde venta"* |
| **Manual** | `POST /api/producciones/por-pedido/{pedidoId}` | El personal de cocina crea la orden para un pedido con faltantes |
| **Para reponer stock** | `POST /api/producciones` | Sin pedido origen; solo para aumentar el inventario de un producto |

#### Terminación

Al terminar una orden (`PATCH /api/producciones/{id}/terminar`), el sistema:

1. Actualiza `cantidadProducida` en cada detalle.
2. Suma `cantidadProducida` al stock del producto correspondiente.
3. Registra un `MovimientoProducto` (ENTRADA / PRODUCCION) por cada ítem producido.
4. Si la orden estaba vinculada a un pedido, actualiza `cantidadAtendida` en los detalles del pedido y recalcula su estado (`PREPARACION` → `LISTO` si ya todo fue atendido).

#### Cancelación

Al cancelar una orden (`PATCH /api/producciones/{id}/cancelar`), el sistema devuelve al inventario todos los ingredientes que se descontaron al crear la orden:

1. Recalcula por receta la cantidad consumida de cada ingrediente (`cantidad_receta × cantidad_planificada`).
2. Suma esa cantidad de vuelta al stock del ingrediente.
3. Registra un `MovimientoIngrediente` (ENTRADA / CANCELACION) por cada ingrediente devuelto.

---

## Base de datos

Esquema completo en [`docs/schema.sql`](docs/schema.sql).

### Diagrama de tablas

```
usuarios ──────────────────────────────────────────────┐
clientes ──────────────────────────────────────────┐   │
                                                   │   │
productos ──┬── recetas ── ingredientes            │   │
            │                                      │   │
            └── detalle_pedido ── pedidos ──────────┘   │
                                      │                 │
                              producciones ─────────────┘
                                      │
                              produccion_detalle ── productos
```

### Tabla `usuarios`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `nombre` | VARCHAR(100) NOT NULL | Nombre del empleado |
| `email` | VARCHAR(120) UNIQUE NOT NULL | Correo (usado para login) |
| `password_hash` | VARCHAR(255) NOT NULL | Contraseña hasheada con BCrypt |
| `rol` | ENUM('ADMIN','VENTAS','COCINA','REPARTIDOR') | Rol del sistema |
| `activo` | TINYINT(1) DEFAULT 1 | Estado activo/inactivo |
| `telefono` | VARCHAR(20) | Teléfono de contacto (usado en recuperación de clave / `admin-contacto`) |
| `pregunta_seguridad` | VARCHAR(255) | Pregunta de seguridad para recuperar contraseña |
| `respuesta_seguridad` | VARCHAR(255) | Respuesta hasheada con BCrypt |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

### Tabla `clientes`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `nombre` | VARCHAR(100) NOT NULL | Nombre completo |
| `dni` | VARCHAR(8) | DNI (8 dígitos) |
| `ruc` | VARCHAR(11) | RUC (11 dígitos) |
| `telefono` | VARCHAR(20) | Teléfono de contacto |
| `direccion` | VARCHAR(255) | Dirección fiscal / envío |
| `email` | VARCHAR(150) | Correo electrónico |
| `pregunta_seguridad` | VARCHAR(255) | Pregunta de seguridad para recuperar contraseña |
| `respuesta_seguridad` | VARCHAR(255) | Respuesta hasheada con BCrypt |
| `password_hash` | VARCHAR(100) | Contraseña para tienda web (BCrypt); NULL si no tiene cuenta |
| `activo` | TINYINT(1) DEFAULT 1 | Estado activo/inactivo |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

### Tabla `productos`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `nombre` | VARCHAR(100) NOT NULL | Nombre del producto |
| `descripcion` | TEXT | Descripción detallada |
| `precio` | DECIMAL(10,2) NOT NULL | Precio de venta |
| `stock` | INT NOT NULL DEFAULT 0 | Stock disponible |
| `stock_minimo` | INT NOT NULL DEFAULT 0 | Umbral de alerta de stock bajo |
| `activo` | TINYINT(1) DEFAULT 1 | Visible en catálogo y POS |
| `imagen_url` | VARCHAR(500) | Ruta de la imagen subida (`/uploads/productos/…`) |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

### Tabla `ingredientes`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `nombre` | VARCHAR(100) NOT NULL | Nombre del ingrediente |
| `unidad_medida` | VARCHAR(20) NOT NULL | Unidad: kg, litro, gramo, unidad… |
| `stock` | DECIMAL(10,2) NOT NULL DEFAULT 0 | Stock actual (admite decimales: 0.5 kg, 250 g…) |
| `stock_minimo` | DECIMAL(10,2) NOT NULL DEFAULT 0 | Umbral de alerta |
| `activo` | TINYINT(1) DEFAULT 1 | Estado |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

> **Nota:** `stock` y `stock_minimo` se mapean como `BigDecimal` en Java para preservar la precisión decimal. Los valores enviados por la API y los mostrados en el frontend también son decimales.

### Tabla `recetas`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `producto_id` | INT FK → productos | Producto al que pertenece la receta |
| `ingrediente_id` | INT FK → ingredientes | Ingrediente requerido |
| `cantidad` | DECIMAL(10,2) NOT NULL | Cantidad del ingrediente por unidad de producto |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

Restricción única: `(producto_id, ingrediente_id)`.

### Tabla `pedidos`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `cliente_id` | INT FK → clientes (nullable) | Cliente asociado (null si invitado) |
| `usuario_id` | BIGINT FK → usuarios (nullable) | Empleado que registró el pedido |
| `total` | DECIMAL(10,2) NOT NULL | Total calculado de la venta |
| `estado` | ENUM | PENDIENTE · PARCIAL · PREPARACION · LISTO · **EN_CAMINO** · ENTREGADO · CANCELADO |
| `tipo_origen` | ENUM | PRESENCIAL · TIENDA · WHATSAPP · WEB · **DELIVERY** |
| `observacion` | TEXT | Nota libre (en POS se guarda el tipo de comprobante y datos del receptor; en delivery se guarda dirección/teléfono/referencia/GPS) |
| `created_at` | DATETIME | Fecha/hora de creación |
| `fecha` | TIMESTAMP | Timestamp automático |
| `updated_at` | TIMESTAMP | Última modificación |

### Tabla `detalle_pedido`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `pedido_id` | INT FK → pedidos | Pedido al que pertenece |
| `producto_id` | INT FK → productos | Producto solicitado |
| `cantidad` | INT NOT NULL | Cantidad pedida |
| `cantidad_atendida` | INT NOT NULL DEFAULT 0 | Cantidad efectivamente entregada |
| `precio_unitario` | DECIMAL(10,2) NOT NULL | Precio al momento de la venta |
| `subtotal` | DECIMAL(10,2) NOT NULL | `precio_unitario × cantidad_atendida` |
| `estado` | ENUM | PENDIENTE · PARCIAL · ATENDIDO · CANCELADO |
| `created_at` | TIMESTAMP | Fecha de creación |

### Tabla `producciones`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `tipo` | ENUM('PEDIDO','STOCK') | Si es para atender un pedido o reponer stock |
| `pedido_id` | INT FK → pedidos (nullable) | Pedido origen (solo si tipo = PEDIDO) |
| `usuario_id` | INT FK → usuarios NOT NULL | Empleado responsable |
| `estado` | ENUM | PENDIENTE · EN_PROCESO · TERMINADO · CANCELADO |
| `observacion` | TEXT | Nota de cocina |
| `fecha_inicio` | TIMESTAMP | Inicio de preparación |
| `fecha_fin` | TIMESTAMP | Fin de producción |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

### Tabla `produccion_detalle`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `produccion_id` | INT FK → producciones | Orden de producción |
| `producto_id` | INT FK → productos | Producto a producir |
| `cantidad_planificada` | INT NOT NULL | Unidades planificadas |
| `cantidad_producida` | INT NOT NULL DEFAULT 0 | Unidades realmente producidas |
| `created_at` | TIMESTAMP | Fecha de creación |

### Tabla `movimientos_producto`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `producto_id` | INT FK → productos | Producto afectado |
| `tipo` | ENUM('ENTRADA','SALIDA','AJUSTE') | Dirección del movimiento |
| `motivo` | ENUM | PRODUCCION · VENTA · CANCELACION · MERMA · AJUSTE_MANUAL |
| `cantidad` | INT NOT NULL | Unidades movidas |
| `stock_anterior` | INT NOT NULL | Stock antes del movimiento |
| `stock_nuevo` | INT NOT NULL | Stock después del movimiento |
| `referencia_tipo` | ENUM('PEDIDO','PRODUCCION','MANUAL') | Tipo del documento origen |
| `referencia_id` | INT | ID del pedido o producción origen |
| `usuario_id` | INT FK → usuarios | Empleado responsable |
| `created_at` | TIMESTAMP | Fecha del movimiento |

### Tabla `movimientos_ingrediente`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INT PK AI | Identificador |
| `ingrediente_id` | INT FK → ingredientes | Ingrediente afectado |
| `tipo` | ENUM('ENTRADA','SALIDA','AJUSTE') | Dirección del movimiento |
| `motivo` | ENUM | COMPRA · PRODUCCION · **CANCELACION** · MERMA · AJUSTE_MANUAL |
| `cantidad` | DECIMAL(10,2) NOT NULL | Cantidad movida |
| `stock_anterior` | DECIMAL(10,2) NOT NULL | Stock antes del movimiento |
| `stock_nuevo` | DECIMAL(10,2) NOT NULL | Stock después del movimiento |
| `referencia_tipo` | ENUM('PRODUCCION','MANUAL','COMPRA') | Tipo del documento origen |
| `referencia_id` | INT | ID de la producción origen |
| `usuario_id` | INT FK → usuarios | Empleado responsable |
| `created_at` | TIMESTAMP | Fecha del movimiento |

El motivo `CANCELACION` (ENTRADA) se registra cuando una orden de producción es cancelada y los ingredientes son devueltos al stock.

> **Migración requerida** si ya existe la tabla en producción:
> ```sql
> ALTER TABLE movimientos_ingrediente
>   MODIFY COLUMN motivo ENUM('COMPRA','PRODUCCION','CANCELACION','MERMA','AJUSTE_MANUAL') NOT NULL;
> ```

> **Migraciones requeridas** para el rol Repartidor, delivery con GPS y recuperación de contraseña — ver el bloque completo al final de [`docs/schema.sql`](docs/schema.sql):
> ```sql
> ALTER TABLE usuarios MODIFY COLUMN rol ENUM('ADMIN','VENTAS','COCINA','REPARTIDOR') NOT NULL;
> ALTER TABLE pedidos
>   MODIFY COLUMN estado ENUM('PENDIENTE','PARCIAL','PREPARACION','LISTO','EN_CAMINO','ENTREGADO','CANCELADO'),
>   MODIFY COLUMN tipo_origen ENUM('TIENDA','PRESENCIAL','WHATSAPP','WEB','DELIVERY');
> ALTER TABLE usuarios
>   ADD COLUMN telefono VARCHAR(20) DEFAULT NULL,
>   ADD COLUMN pregunta_seguridad VARCHAR(255) DEFAULT NULL,
>   ADD COLUMN respuesta_seguridad VARCHAR(255) DEFAULT NULL;
> ALTER TABLE clientes
>   ADD COLUMN pregunta_seguridad VARCHAR(255) DEFAULT NULL,
>   ADD COLUMN respuesta_seguridad VARCHAR(255) DEFAULT NULL;
> ```

---

## Seguridad

- **Personal interno:** autenticación JWT con expiración de 24 h. El token se envía en `Authorization: Bearer <token>`.
- **Filtro JWT tolerante:** si el token está expirado o malformado, el filtro lo descarta silenciosamente y la petición continúa sin autenticación. Las rutas `permitAll()` funcionan aunque el cliente tenga un token vencido en localStorage.
- **Contraseñas:** hasheadas con BCrypt tanto para usuarios del personal como para clientes de tienda web.
- **Roles:** aplicados con `hasAnyRole` en `SecurityConfig`. El frontend oculta secciones según el rol del JWT almacenado.
- **CORS:** habilitado para todos los orígenes (`allowedOriginPatterns: "*"`) durante desarrollo. Restringir a los dominios reales antes de pasar a producción.
- **Auto-producción:** solo se activa cuando hay un usuario interno autenticado. Los pedidos anónimos de la tienda web no generan órdenes de producción automáticas.

---

## Historial de cambios relevantes

### Rediseño del login del personal (`login.html`)

La pantalla de login del personal se movió de `index.html` (que ahora solo redirige a `home.html`) a `login.html`, y pasó de un formulario centrado simple a un layout de dos columnas:

- **Columna izquierda:** panel de marca con degradado ámbar, logo con efecto glassmorphism y pills descriptivos de las funciones clave del sistema.
- **Columna derecha:** formulario blanco con inputs con icono, toggle de visibilidad de contraseña y spinner de carga durante el login.

### Rediseño tienda web — estilo Instagram (`home.html`, `catalogo.html`)

La tienda pública recibió un rediseño visual completo:

- **Botones pill:** todos los botones dentro de `.store-body` usan `border-radius: 999px`.
- **Iconos de categoría al estilo story ring de Instagram:** gradiente ámbar-naranja-rosa con sombra cálida y efecto `scale(1.1)` al hover.
- **Cards de producto en formato retrato:** relación `4:5` igual que el grid de Instagram. Imágenes reales con `object-fit: cover`; placeholders con gradientes cálidos e inicial del producto.
- **Grid 2 columnas en mobile:** `col-6 col-md-4 col-xl-3` — misma densidad que la app de Instagram.
- **Selector de cantidad integrado en la card:** fila pill con botones `+/−` y badge de stock flotante sobre la imagen.
- **Barra de búsqueda pill** en el catálogo con filtrado en tiempo real por nombre y descripción.

### Corrección: pedidos no generaban orden de producción (`ProduccionService`)

`crearProduccionDesdeVenta` tenía dos bugs que impedían que los pedidos del POS con stock insuficiente llegaran a cocina:

1. **`continue` al no encontrar receta:** si un producto no tenía receta configurada, se saltaba la creación del `ProduccionDetalle`, por lo que ese producto nunca aparecía en la orden de cocina.
2. **`return null` cuando `detalles` estaba vacío:** si ningún producto tenía receta, `detalles` quedaba vacío y el método retornaba `null` aunque ya había guardado un registro `Produccion` huérfano en la base de datos.

**Fix:** se eliminó el `continue` y el `return null`; ahora se crea siempre el `ProduccionDetalle` para cada producto faltante (el descuento de ingredientes ocurre solo si hay receta configurada).

Adicionalmente, el `catch (RuntimeException ignored) {}` en `PedidoController.crear()` que ocultaba silenciosamente cualquier error se reemplazó por `log.error(...)` para que los errores queden visibles en los logs del backend.

### Flujo de producción automática desde Ventas

Antes el POS creaba el pedido y dejaba la producción para que cocina la iniciara manualmente. Ahora, cuando un pedido queda en estado `PREPARACION` (stock insuficiente), el sistema crea automáticamente una orden de producción y devuelve su `produccionId` en la respuesta del pedido.

### Cancelación de producción restaura ingredientes

Antes, cancelar una orden de producción solo cambiaba su estado sin devolver los ingredientes descontados. Ahora el sistema recalcula por receta los ingredientes consumidos y los restaura al stock, registrando un movimiento `ENTRADA / CANCELACION`.

### Stock de ingredientes en `BigDecimal`

El campo `stock` y `stock_minimo` de ingredientes se mapeaban como `Integer` en Java, truncando valores decimales (ej. 0.5 kg). Ahora se usan como `BigDecimal` en toda la cadena: entidades, DTOs, servicios y respuestas de la API.

### Movimientos de stock de ingredientes desde el panel (`ingredientes.html`)

Cada fila de `ingredientes.html` ahora tiene dos botones de acción rápida:

- **"+ Stock"** (verde): registra una entrada con motivo `COMPRA`.
- **"− Merma"** (ámbar): registra una salida con motivo `MERMA` o `AJUSTE_MANUAL`, con checkbox de confirmación obligatorio.

Ambos abren el mismo modal `movimientoStockModal`, que cambia título/color según el tipo. En el backend, `IngredienteService.registrarMovimiento` ahora asigna `referenciaTipo = "MANUAL"` por defecto si no se especifica.

### Nuevo rol `REPARTIDOR` y panel de delivery

Se agregó un cuarto rol de personal dedicado a la gestión de entregas:

- **Backend:** `RolUsuario.REPARTIDOR`; `SecurityConfig` permite a `REPARTIDOR` consultar `GET /api/pedidos/delivery` y cambiar estado con `PATCH /api/pedidos/{id}/estado`.
- **Frontend:** nuevo `repartidor.html` + `repartidor.js` (panel mobile-first, auto-refresh cada 30s, resumen del día, WhatsApp/llamada/mapa por pedido). El rol se agregó a `ROL_ACCESO`, `rolLabel` y al selector de `usuarios.html` (con ícono de scooter y color verde). Todas las páginas admin tienen un link "Panel Repartidores" en el sidebar.

### Delivery con dirección + GPS desde la tienda web

`carrito.html` ahora ofrece un modal de selección de entrega: **"Recojo en tienda"** vs **"Delivery"**. El modo delivery agrega `tipoOrigen: "DELIVERY"`, un nuevo estado `EN_CAMINO` en el ciclo de vida del pedido, y captura dirección/teléfono/referencia/GPS (vía Geolocation API del navegador, sin API key), todo codificado en `observacion`. El panel admin (`pedidos.html`) y el panel de repartidor muestran un pin con link a Google Maps cuando hay coordenadas.

### "Mis pedidos" — seguimiento e historial para clientes

Nueva página `mis-pedidos.html` + `mis-pedidos.js`: los clientes registrados ven su historial automáticamente (`GET /api/pedidos/cliente/{clienteId}`); los invitados pueden buscar por número de pedido (`GET /api/pedidos/seguimiento/{id}`), guardado en `localStorage` para futuras visitas. Incluye línea de tiempo visual del estado y, para delivery, link a la dirección en el mapa. Tras crear un pedido, `carrito.js` muestra un link directo "Ver seguimiento".

### Recuperación de contraseña con pregunta de seguridad

Tanto el personal (`login.html`, nuevo — separado del antiguo `index.html`, que ahora solo redirige a `home.html`) como los clientes de la tienda web pueden recuperar su contraseña respondiendo una pregunta de seguridad configurada al registrarse. Si no la tienen configurada, se les muestra el contacto de un ADMIN (`GET /api/auth/admin-contacto`). Nuevos campos `pregunta_seguridad` / `respuesta_seguridad` (hasheada con BCrypt) en `usuarios` y `clientes`, y un nuevo campo `telefono` en `usuarios`.

### `API_BASE` dinámico (`frontend/assets/js/api.js`)

Antes `API_BASE` era un valor fijo (`http://localhost:8080`). Ahora se detecta automáticamente según `window.location.hostname`: red local/celular (`http://<IP>:8080`), Dev Tunnels de VS Code (reemplaza el puerto del túnel de frontend por el de backend), o `localhost`. Todos los HTML deben cargar `api.js` antes que cualquier otro script que use `API_BASE`.

### Sidebar — "Movimientos" solo visible para `ADMIN`

El link a `movimientos.html` ahora vive en el grupo del sidebar con `data-roles="ADMIN"`. Se agregó la regla CSS `.sidebar-group[data-roles] { display: none; }` para evitar un flash de contenido antes de que `filtrarNavPorRol()` aplique `display: 'block'` (explícito, no `''`) al grupo correspondiente al rol del usuario.
