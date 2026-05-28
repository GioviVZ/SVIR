package com.svir.api.dto.pedido;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PedidoResponse {

    private Long id;
    private Long clienteId;
    private String clienteNombre;
    private Long usuarioId;
    private String usuarioNombre;
    private BigDecimal total;
    private String estado;
    private String tipoOrigen;
    private String observacion;
    private Boolean produccionRequerida;
    private Long produccionId;
    private LocalDateTime createdAt;
    private List<PedidoDetalleResponse> detalles;
}