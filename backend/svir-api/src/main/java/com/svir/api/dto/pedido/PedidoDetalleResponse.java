package com.svir.api.dto.pedido;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class PedidoDetalleResponse {

    private Long id;
    private Long productoId;
    private String productoNombre;
    private Integer cantidad;
    private Integer cantidadAtendida;
    private Integer cantidadPendiente;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private String estado;
}