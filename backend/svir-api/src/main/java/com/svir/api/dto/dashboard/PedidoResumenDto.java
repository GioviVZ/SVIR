package com.svir.api.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PedidoResumenDto {
    private Long id;
    private String clienteNombre;
    private BigDecimal total;
    private String estado;
    private String tipoOrigen;
    private LocalDateTime createdAt;
}
