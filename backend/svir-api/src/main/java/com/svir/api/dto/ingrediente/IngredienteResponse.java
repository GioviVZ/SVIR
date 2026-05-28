package com.svir.api.dto.ingrediente;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class IngredienteResponse {

    private Long id;
    private String nombre;
    private String unidadMedida;
    private BigDecimal stock;
    private BigDecimal stockMinimo;
    private Boolean activo;
}