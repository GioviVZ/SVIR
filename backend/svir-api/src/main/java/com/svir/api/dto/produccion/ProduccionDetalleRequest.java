package com.svir.api.dto.produccion;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProduccionDetalleRequest {

    @NotNull
    private Long productoId;

    @NotNull
    @Min(1)
    private Integer cantidadPlanificada;
}