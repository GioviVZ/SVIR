package com.svir.api.dto.receta;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class RecetaUpdateRequest {

    @Valid
    @NotEmpty
    private List<RecetaItemRequest> items;
}