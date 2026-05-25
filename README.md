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
| **Clientes** | Registro con DNI / RUC, teléfono y dirección; login con contraseña desde la tienda web; restablecimiento de contraseña desde el panel |
| **Usuarios** | Alta y baja de personal con roles (Admin, Ventas, Cocina); contraseña con BCrypt |
| **Tienda web** | Catálogo público, carrito y checkout; modos de acceso: invitado, registro con contraseña, login con DNI + contraseña |

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

| Rol | Páginas disponibles |
|---|---|
| `ADMIN` | Todas: dashboard, productos, ingredientes, recetas, pedidos, producción, POS, movimientos, usuarios, clientes |
| `VENTAS` | POS, productos, pedidos, movimientos, clientes |
| `COCINA` | Producción, ingredientes, recetas, movimientos |

Las rutas públicas (catálogo, registro y login de clientes, pedidos desde tienda web) no requieren autenticación de personal.

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
    ├── index.html                   # Login del personal interno
    ├── home.html                    # Landing pública
    ├── catalogo.html                # Catálogo público de productos
    ├── carrito.html                 # Carrito de compras (tienda web)
    ├── checkout.html                # Checkout (tienda web)
    ├── dashboard.html               # Panel de control (ADMIN)
    ├── productos.html               # CRUD de productos
    ├── ingredientes.html            # CRUD de ingredientes
    ├── recetas.html                 # Recetas por producto
    ├── pedidos.html                 # Gestión de pedidos
    ├── produccion.html              # Órdenes de cocina
    ├── pos.html                     # Punto de venta presencial
    ├── movimientos.html             # Historial de movimientos
    ├── clientes.html                # Gestión de clientes
    ├── usuarios.html                # Gestión de personal
    └── assets/
        ├── css/styles.css
        ├── js/
        │   ├── api.js              # apiFetch() — fetch con JWT automático
        │   ├── auth.js             # Login / logout del personal
        │   ├── ui.js               # requireAuth(), control de acceso por rol
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
        │   ├── carrito.js
        │   └── tienda.js           # Catálogo, auth de clientes, carrito web
        └── img/
```

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

### 4. Abrir el frontend

Abre `frontend/index.html` en el navegador o sirve la carpeta con un servidor estático:

```bash
cd frontend
python3 -m http.server 5500
```

---

## API — Endpoints completos

### Autenticación (`/api/auth`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Login personal: `{email, password}` → `{token, rol, nombre}` |
| GET | `/api/auth/me` | JWT | Perfil del usuario autenticado |

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
| GET | `/api/pedidos/{id}` | ADMIN, VENTAS | Obtener pedido por ID |
| POST | `/api/pedidos` | Público* | Crear pedido: `{clienteId?, tipoOrigen, observacion?, detalles: [{productoId, cantidad}]}` |
| PATCH | `/api/pedidos/{id}/estado` | ADMIN, VENTAS | Cambiar estado: `{estado: "ENTREGADO"}` |
| PATCH | `/api/pedidos/{id}/cancelar` | ADMIN, VENTAS | Cancelar y restaurar stock |

*Público para pedidos de tienda web (`tipoOrigen: "TIENDA"`); el POS envía `"PRESENCIAL"`.

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
| POST | `/api/clientes/registro` | Público | Registro tienda web: `{nombre, dni, ruc?, telefono?, email?, direccion?, password}` |
| POST | `/api/clientes/login` | Público | Login tienda web: `{dni, password}` → datos del cliente |
| GET | `/api/clientes/buscar` | Público | Buscar por DNI: `?dni=12345678` |
| POST | `/api/clientes` | ADMIN, VENTAS | Crear cliente manualmente |
| PUT | `/api/clientes/{id}` | ADMIN, VENTAS | Actualizar cliente |
| PATCH | `/api/clientes/{id}/activo` | ADMIN, VENTAS | Activar / desactivar |
| PATCH | `/api/clientes/{id}/resetear-clave` | ADMIN, VENTAS | Restablecer contraseña: `{password}` |

### Usuarios (`/api/usuarios`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/usuarios` | ADMIN | Listar personal |
| POST | `/api/usuarios` | ADMIN | Crear usuario: `{nombre, email, password, rol}` |
| PUT | `/api/usuarios/{id}` | ADMIN | Actualizar usuario |
| PATCH | `/api/usuarios/{id}/activo` | ADMIN | Activar / desactivar |

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
2. **Registro:** crea cuenta con DNI obligatorio y contraseña (mínimo 6 caracteres); la contraseña se almacena hasheada con BCrypt.
3. **Login:** ingresa DNI + contraseña; el backend valida con `POST /api/clientes/login`.

El personal puede restablecer la contraseña de cualquier cliente desde `clientes.html` con el botón 🔑 de cada fila.

### POS — Emisión de comprobante

Al presionar **Cobrar** en el POS se abre un modal de selección de comprobante:

| Opción | Datos requeridos | Comportamiento |
|---|---|---|
| **Boleta simple** | Ninguno | Emite a *Consumidor Final* directamente |
| **Boleta con DNI** | DNI (8 dígitos) | Busca el cliente en BD; si existe auto-rellena nombre (editable); si no, permite ingreso manual |
| **Factura** | RUC (11 dígitos) | Busca el cliente por RUC; si existe auto-rellena razón social y dirección (editables); si no, permite ingreso manual |

El ticket imprimible muestra el tipo de documento (`BOLETA DE VENTA` / `FACTURA`), los datos del receptor y el detalle de productos atendidos.

Si el pedido queda en estado `LISTO` (stock suficiente), el POS lo marca automáticamente como `ENTREGADO`.

### Producción — Descuento de ingredientes

Al terminar una orden de cocina (`PATCH /api/producciones/{id}/terminar`), el sistema:

1. Suma `cantidadProducida` al stock de cada producto.
2. Descuenta los ingredientes según la receta de cada producto producido.
3. Registra un `MovimientoProducto` (ENTRADA / PRODUCCION) y un `MovimientoIngrediente` (SALIDA / PRODUCCION) por cada ítem.

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
| `rol` | ENUM('ADMIN','VENTAS','COCINA') | Rol del sistema |
| `activo` | TINYINT(1) DEFAULT 1 | Estado activo/inactivo |
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
| `stock` | DECIMAL(10,2) NOT NULL DEFAULT 0 | Stock actual |
| `stock_minimo` | DECIMAL(10,2) NOT NULL DEFAULT 0 | Umbral de alerta |
| `activo` | TINYINT(1) DEFAULT 1 | Estado |
| `created_at` | TIMESTAMP | Fecha de creación |
| `updated_at` | TIMESTAMP | Última modificación |

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
| `estado` | ENUM | PENDIENTE · PARCIAL · PREPARACION · LISTO · ENTREGADO · CANCELADO |
| `tipo_origen` | ENUM | PRESENCIAL · TIENDA · WHATSAPP · WEB |
| `observacion` | TEXT | Nota libre (en POS se guarda el tipo de comprobante y datos del receptor) |
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
| `motivo` | ENUM | COMPRA · PRODUCCION · MERMA · AJUSTE_MANUAL |
| `cantidad` | DECIMAL(10,2) NOT NULL | Cantidad movida |
| `stock_anterior` | DECIMAL(10,2) NOT NULL | Stock antes del movimiento |
| `stock_nuevo` | DECIMAL(10,2) NOT NULL | Stock después del movimiento |
| `referencia_tipo` | ENUM('PRODUCCION','MANUAL','COMPRA') | Tipo del documento origen |
| `referencia_id` | INT | ID de la producción origen |
| `usuario_id` | INT FK → usuarios | Empleado responsable |
| `created_at` | TIMESTAMP | Fecha del movimiento |

---

## Seguridad

- **Personal interno:** autenticación JWT con expiración de 24 h. El token se envía en `Authorization: Bearer <token>`.
- **Filtro JWT tolerante:** si el token está expirado o malformado, el filtro lo descarta silenciosamente y la petición continúa sin autenticación. Las rutas `permitAll()` funcionan aunque el cliente tenga un token vencido en localStorage.
- **Contraseñas:** hasheadas con BCrypt tanto para usuarios del personal como para clientes de tienda web.
- **Roles:** aplicados con `@PreAuthorize` / `hasAnyRole` en `SecurityConfig`. El frontend oculta secciones según el rol del JWT almacenado.
- **CORS:** habilitado para todos los orígenes (`allowedOriginPatterns: "*"`) durante desarrollo.
