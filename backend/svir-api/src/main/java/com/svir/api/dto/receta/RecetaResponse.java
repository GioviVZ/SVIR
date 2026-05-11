package com.svir.api.dto.receta;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RecetaResponse {

    private Long productoId;
    private String productoNombre;
    private List<RecetaItemResponse> items;
}