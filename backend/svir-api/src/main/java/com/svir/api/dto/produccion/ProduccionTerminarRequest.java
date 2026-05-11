package com.svir.api.dto.produccion;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ProduccionTerminarRequest {

    @Valid
    @NotEmpty
    private List<ProduccionTerminarDetalleRequest> detalles;
}