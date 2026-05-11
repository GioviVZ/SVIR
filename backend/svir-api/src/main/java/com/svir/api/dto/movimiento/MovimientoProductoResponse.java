package com.svir.api.dto.movimiento;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MovimientoProductoResponse {
    private Long id;
    private Long productoId;
    private String productoNombre;
    private String tipo;
    private String motivo;
    private Integer cantidad;
    private Integer stockAnterior;
    private Integer stockNuevo;
    private String referenciaTipo;
    private Long referenciaId;
    private String usuarioNombre;
}