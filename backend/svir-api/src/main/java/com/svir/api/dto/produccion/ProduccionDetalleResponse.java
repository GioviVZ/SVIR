package com.svir.api.dto.produccion;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProduccionDetalleResponse {

    private Long id;
    private Long productoId;
    private String productoNombre;
    private Integer cantidadPlanificada;
    private Integer cantidadProducida;
}