package com.svir.api.dto.ingrediente;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MovimientoIngredienteResponse {

    private Long id;
    private Long ingredienteId;
    private String ingredienteNombre;
    private String tipo;
    private String motivo;
    private Integer cantidad;
    private Integer stockAnterior;
    private Integer stockNuevo;
    private String referenciaTipo;
    private Long referenciaId;
    private String usuarioNombre;
}