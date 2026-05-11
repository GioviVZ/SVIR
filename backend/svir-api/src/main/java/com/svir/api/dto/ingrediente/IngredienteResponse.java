package com.svir.api.dto.ingrediente;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class IngredienteResponse {

    private Long id;
    private String nombre;
    private String unidadMedida;
    private Integer stock;
    private Integer stockMinimo;
    private Boolean activo;
}