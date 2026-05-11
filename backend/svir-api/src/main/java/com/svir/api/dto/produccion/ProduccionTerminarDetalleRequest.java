package com.svir.api.dto.produccion;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProduccionTerminarDetalleRequest {

    @NotNull
    private Long produccionDetalleId;

    @NotNull
    @Min(0)
    private Integer cantidadProducida;
}