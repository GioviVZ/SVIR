package com.svir.api.dto.receta;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RecetaItemRequest {

    @NotNull
    private Long ingredienteId;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal cantidad;
}