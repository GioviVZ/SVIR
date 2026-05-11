# SVIR — Sistema de Ventas e Inventario para Repostería

Sistema de gestión integral para la pastelería **Dulce Momento**. Cubre el ciclo completo: producción en cocina, inventario de ingredientes y productos, punto de venta presencial, pedidos multicanal y tienda web para clientes.

---

## Características principales

| Módulo | Descripción |
|---|---|
| **Dashboard** | Resumen de ventas, stock bajo y pedidos recientes |
| **Productos** | Catálogo con precio, stock y foto; alerta de stock mínimo |
| **Ingredientes** | Stock en unidad de medida; alerta de stock mínimo |
| **Recetas** | Relación producto → ingredientes con cantidades |
| **Pedidos** | Gestión de pedidos (PRESENCIAL, TIENDA, WHATSAPP, WEB) con estados |
| **Producción** | Órdenes de cocina por pedido o para stock; descuento automático de ingredientes |
| **Punto de Venta** | POS interno para cobros presenciales |
| **Movimientos** | Historial de entradas/salidas de ingredientes y productos |
| **Clientes** | Registro con DNI/RUC, teléfono y dirección |
| **Usuarios** | Alta/baja de personal con roles (Admin, Ventas, Cocina) |
| **Tienda web** | Catálogo público, carrito y checkout para clientes |

---

## Stack tecnológico

**Backend**
- Java 21 + Spring Boot 3.5.6
- Spring Security + JWT (jjwt 0.12.6)
- Spring Data JPA + Hibernate
- MySQL 8
- Lombok · SpringDoc OpenAPI (Swagger UI)

**Frontend**
- HTML5 + CSS3 + JavaScript (vanilla)
- Bootstrap 5.3.3 + Bootstrap Icons 1.11.3
- Sin framework de frontend — páginas HTML independientes

---

## Roles y acceso

| Rol | Páginas disponibles |
|---|---|
| `ADMIN` | Todas (dashboard, productos, ingredientes, recetas, pedidos, producción, POS, movimientos, usuarios, clientes) |
| `VENTAS` | POS, productos, pedidos, movimientos, clientes |
| `COCINA` | Producción, ingredientes, recetas, movimientos |

---

## Estructura del proyecto

```
SVIR/
├── backend/
│   └── svir-api/
│       ├── POM.XML
│       └── src/main/java/com/svir/api/
│           ├── controller/     # REST endpoints
│           ├── service/        # Lógica de negocio
│           ├── entity/         # Entidades JPA
│           ├── dto/            # Request / Response DTOs
│           ├── repository/     # Spring Data repositories
│           ├── security/       # JWT + Spring Security
│           ├── config/         # CORS, WebMvc
│           ├── enums/          # Estados, roles, motivos
│           └── exception/      # Manejo global de errores
└── frontend/
    ├── index.html              # Login (personal interno)
    ├── home.html               # Landing pública
    ├── catalogo.html           # Tienda web
    ├── carrito.html            # Carrito de compras
    ├── dashboard.html
    ├── productos.html
    ├── ingredientes.html
    ├── recetas.html
    ├── pedidos.html
    ├── produccion.html
    ├── pos.html
    ├── movimientos.html
    ├── usuarios.html
    ├── clientes.html
    └── assets/
        ├── css/styles.css
        ├── js/                 # Un .js por módulo
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

Luego importa el esquema:

```bash
mysql -u root -p reposteria < docs/schema.sql
```

### 2. Configuración del backend

Copia el archivo de ejemplo y ajusta tus credenciales:

```bash
cp backend/svir-api/src/main/resources/application.properties.example \
   backend/svir-api/src/main/resources/application.properties
```

Edita `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/reposteria?useSSL=false&serverTimezone=America/Lima&allowPublicKeyRetrieval=true
spring.datasource.username=TU_USUARIO
spring.datasource.password=TU_CONTRASEÑA

app.jwt.secret=TU_SECRETO_BASE64_LARGO
```

### 3. Iniciar el backend

```bash
cd backend/svir-api
mvn spring-boot:run
```

El API queda disponible en `http://localhost:8080`.  
Swagger UI: `http://localhost:8080/swagger-ui/index.html`

### 4. Abrir el frontend

Abre `frontend/index.html` directamente en el navegador o sirve la carpeta con cualquier servidor estático:

```bash
# Con Python
cd frontend
python3 -m http.server 5500
```

---

## Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login → retorna JWT |
| GET/POST/PUT/DELETE | `/api/productos` | CRUD de productos |
| GET/POST/PUT | `/api/ingredientes` | CRUD de ingredientes |
| GET/POST/PUT | `/api/recetas/{productoId}` | Receta por producto |
| GET/POST | `/api/pedidos` | Listar / crear pedidos |
| POST | `/api/pedidos/{id}/estado` | Cambiar estado |
| GET/POST | `/api/producciones` | Órdenes de producción |
| POST | `/api/producciones/{id}/terminar` | Finalizar producción |
| GET | `/api/movimientos` | Historial de movimientos |
| GET/POST/PUT | `/api/clientes` | CRUD de clientes |
| GET/POST/PUT | `/api/usuarios` | CRUD de usuarios |
| GET | `/api/dashboard` | Datos del dashboard |

---

## Base de datos

El esquema completo está en [`docs/schema.sql`](docs/schema.sql).

**Tablas:**
`usuarios` · `clientes` · `productos` · `ingredientes` · `recetas` · `pedidos` · `detalle_pedido` · `producciones` · `produccion_detalle` · `movimientos_producto` · `movimientos_ingrediente`
