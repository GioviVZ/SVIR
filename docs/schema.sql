-- SVIR — Esquema de base de datos
-- Motor: MySQL 8  |  Base de datos: reposteria
-- Charset: utf8mb4

CREATE DATABASE IF NOT EXISTS reposteria
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE reposteria;

-- ─── USUARIOS ────────────────────────────────────────────────────────────────
CREATE TABLE `usuarios` (
  `id`            INT            NOT NULL AUTO_INCREMENT,
  `nombre`        VARCHAR(100)   NOT NULL,
  `email`         VARCHAR(120)   NOT NULL,
  `password_hash` VARCHAR(255)   NOT NULL,
  `rol`           ENUM('ADMIN','VENTAS','COCINA','REPARTIDOR') NOT NULL,
  `activo`        TINYINT(1)     NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CLIENTES ────────────────────────────────────────────────────────────────
CREATE TABLE `clientes` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `nombre`        VARCHAR(100) NOT NULL,
  `dni`           VARCHAR(8)   DEFAULT NULL,
  `ruc`           VARCHAR(11)  DEFAULT NULL,
  `telefono`      VARCHAR(20)  DEFAULT NULL,
  `direccion`     VARCHAR(255) DEFAULT NULL,
  `email`         VARCHAR(150) DEFAULT NULL,
  `password_hash` VARCHAR(100) DEFAULT NULL,  -- contraseña para tienda web (BCrypt); NULL si no tiene cuenta
  `activo`        TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PRODUCTOS ───────────────────────────────────────────────────────────────
CREATE TABLE `productos` (
  `id`           INT            NOT NULL AUTO_INCREMENT,
  `nombre`       VARCHAR(100)   NOT NULL,
  `descripcion`  TEXT           DEFAULT NULL,
  `precio`       DECIMAL(10,2)  NOT NULL,
  `stock`        INT            NOT NULL DEFAULT 0,
  `stock_minimo` INT            NOT NULL DEFAULT 0,
  `activo`       TINYINT(1)     NOT NULL DEFAULT 1,
  `imagen_url`   VARCHAR(500)   DEFAULT NULL,
  `created_at`   TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── INGREDIENTES ────────────────────────────────────────────────────────────
CREATE TABLE `ingredientes` (
  `id`            INT            NOT NULL AUTO_INCREMENT,
  `nombre`        VARCHAR(100)   NOT NULL,
  `unidad_medida` VARCHAR(20)    NOT NULL,
  `stock`         DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `stock_minimo`  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `activo`        TINYINT(1)     NOT NULL DEFAULT 1,
  `created_at`    TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── RECETAS ─────────────────────────────────────────────────────────────────
CREATE TABLE `recetas` (
  `id`             INT            NOT NULL AUTO_INCREMENT,
  `producto_id`    INT            NOT NULL,
  `ingrediente_id` INT            NOT NULL,
  `cantidad`       DECIMAL(10,2)  NOT NULL,
  `created_at`     TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_receta_producto_ingrediente` (`producto_id`, `ingrediente_id`),
  CONSTRAINT `fk_recetas_producto`    FOREIGN KEY (`producto_id`)    REFERENCES `productos`    (`id`),
  CONSTRAINT `fk_recetas_ingrediente` FOREIGN KEY (`ingrediente_id`) REFERENCES `ingredientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PEDIDOS ─────────────────────────────────────────────────────────────────
CREATE TABLE `pedidos` (
  `id`          INT            NOT NULL AUTO_INCREMENT,
  `cliente_id`  INT            DEFAULT NULL,
  `usuario_id`  BIGINT         DEFAULT NULL,
  `total`       DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  `estado`      ENUM('PENDIENTE','PARCIAL','PREPARACION','LISTO','EN_CAMINO','ENTREGADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  `tipo_origen` ENUM('TIENDA','PRESENCIAL','WHATSAPP','WEB','DELIVERY') NOT NULL DEFAULT 'PRESENCIAL',
  `observacion` TEXT           DEFAULT NULL,
  `created_at`  DATETIME       DEFAULT NULL,
  `fecha`       TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pedidos_cliente`  (`cliente_id`),
  KEY `fk_pedidos_usuario`  (`usuario_id`),
  CONSTRAINT `fk_pedidos_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── DETALLE PEDIDO ──────────────────────────────────────────────────────────
CREATE TABLE `detalle_pedido` (
  `id`                INT            NOT NULL AUTO_INCREMENT,
  `pedido_id`         INT            NOT NULL,
  `producto_id`       INT            NOT NULL,
  `cantidad`          INT            NOT NULL,
  `cantidad_atendida` INT            NOT NULL DEFAULT 0,
  `precio_unitario`   DECIMAL(10,2)  NOT NULL,
  `subtotal`          DECIMAL(10,2)  NOT NULL,
  `estado`            ENUM('PENDIENTE','PARCIAL','ATENDIDO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  `created_at`        TIMESTAMP      NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_detalle_pedido_pedido`   FOREIGN KEY (`pedido_id`)   REFERENCES `pedidos`   (`id`),
  CONSTRAINT `fk_detalle_pedido_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PRODUCCIONES ────────────────────────────────────────────────────────────
CREATE TABLE `producciones` (
  `id`          INT       NOT NULL AUTO_INCREMENT,
  `tipo`        ENUM('PEDIDO','STOCK') NOT NULL,
  `pedido_id`   INT       DEFAULT NULL,
  `usuario_id`  INT       NOT NULL,
  `estado`      ENUM('PENDIENTE','EN_PROCESO','TERMINADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  `observacion` TEXT      DEFAULT NULL,
  `fecha_inicio` TIMESTAMP NULL DEFAULT NULL,
  `fecha_fin`   TIMESTAMP NULL DEFAULT NULL,
  `created_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_producciones_pedido`  FOREIGN KEY (`pedido_id`)  REFERENCES `pedidos`   (`id`),
  CONSTRAINT `fk_producciones_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── PRODUCCION DETALLE ──────────────────────────────────────────────────────
CREATE TABLE `produccion_detalle` (
  `id`                   INT NOT NULL AUTO_INCREMENT,
  `produccion_id`        INT NOT NULL,
  `producto_id`          INT NOT NULL,
  `cantidad_planificada` INT NOT NULL,
  `cantidad_producida`   INT NOT NULL DEFAULT 0,
  `created_at`           TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_produccion_detalle_produccion` FOREIGN KEY (`produccion_id`) REFERENCES `producciones` (`id`),
  CONSTRAINT `fk_produccion_detalle_producto`   FOREIGN KEY (`producto_id`)   REFERENCES `productos`    (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── MOVIMIENTOS PRODUCTO ────────────────────────────────────────────────────
CREATE TABLE `movimientos_producto` (
  `id`              INT NOT NULL AUTO_INCREMENT,
  `producto_id`     INT NOT NULL,
  `tipo`            ENUM('ENTRADA','SALIDA','AJUSTE') NOT NULL,
  `motivo`          ENUM('PRODUCCION','VENTA','CANCELACION','MERMA','AJUSTE_MANUAL') NOT NULL,
  `cantidad`        INT NOT NULL,
  `stock_anterior`  INT NOT NULL,
  `stock_nuevo`     INT NOT NULL,
  `referencia_tipo` ENUM('PEDIDO','PRODUCCION','MANUAL') NOT NULL,
  `referencia_id`   INT DEFAULT NULL,
  `usuario_id`      INT DEFAULT NULL,
  `created_at`      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mov_prod_producto` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`),
  CONSTRAINT `fk_mov_prod_usuario`  FOREIGN KEY (`usuario_id`)  REFERENCES `usuarios`  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── MOVIMIENTOS INGREDIENTE ─────────────────────────────────────────────────
CREATE TABLE `movimientos_ingrediente` (
  `id`              INT            NOT NULL AUTO_INCREMENT,
  `ingrediente_id`  INT            NOT NULL,
  `tipo`            ENUM('ENTRADA','SALIDA','AJUSTE') NOT NULL,
  `motivo`          ENUM('COMPRA','PRODUCCION','CANCELACION','MERMA','AJUSTE_MANUAL') NOT NULL,
  `cantidad`        DECIMAL(10,2)  NOT NULL,
  `stock_anterior`  DECIMAL(10,2)  NOT NULL,
  `stock_nuevo`     DECIMAL(10,2)  NOT NULL,
  `referencia_tipo` ENUM('PRODUCCION','MANUAL','COMPRA') NOT NULL,
  `referencia_id`   INT DEFAULT NULL,
  `usuario_id`      INT DEFAULT NULL,
  `created_at`      TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mov_ing_ingrediente` FOREIGN KEY (`ingrediente_id`) REFERENCES `ingredientes` (`id`),
  CONSTRAINT `fk_mov_ing_usuario`     FOREIGN KEY (`usuario_id`)     REFERENCES `usuarios`     (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
