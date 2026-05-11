package com.svir.api.dto.producto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ProductoRequest {

    @NotBlank
    private String nombre;

    private String descripcion;

    @NotNull
    @DecimalMin("0.0")
    private BigDecimal precio;

    @NotNull
    @Min(0)
    private Integer stock;

    private Integer stockMinimo;

    private Boolean activo;

    private String imagenUrl;
}