package com.svir.api.dto.produccion;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProduccionResponse {

    private Long id;
    private String tipo;
    private Long pedidoId;
    private String estado;
    private String observacion;
    private String usuarioNombre;
    private List<ProduccionDetalleResponse> detalles;
}