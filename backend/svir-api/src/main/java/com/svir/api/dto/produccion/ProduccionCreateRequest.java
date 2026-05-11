package com.svir.api.dto.produccion;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ProduccionCreateRequest {

    private String observacion;

    @Valid
    @NotEmpty
    private List<ProduccionDetalleRequest> detalles;
}