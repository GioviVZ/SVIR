package com.svir.api.dto.ingrediente;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IngredienteRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    private String unidadMedida;

    @NotNull
    @Min(0)
    private Integer stock;

    @Min(0)
    private Integer stockMinimo;

    private Boolean activo;
}