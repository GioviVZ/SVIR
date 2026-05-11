package com.svir.api.dto.receta;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class RecetaItemResponse {

    private Long recetaId;
    private Long ingredienteId;
    private String ingredienteNombre;
    private String unidadMedida;
    private BigDecimal cantidad;
}