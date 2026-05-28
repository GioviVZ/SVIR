package com.svir.api.dto.ingrediente;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class MovimientoIngredienteResponse {

    private Long id;
    private Long ingredienteId;
    private String ingredienteNombre;
    private String tipo;
    private String motivo;
    private BigDecimal cantidad;
    private BigDecimal stockAnterior;
    private BigDecimal stockNuevo;
    private String referenciaTipo;
    private Long referenciaId;
    private String usuarioNombre;
}