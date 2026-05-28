package com.svir.api.dto.ingrediente;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class IngredienteRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    private String unidadMedida;

    @NotNull
    @DecimalMin("0.00")
    private BigDecimal stock;

    @DecimalMin("0.00")
    private BigDecimal stockMinimo;

    private Boolean activo;
}