package com.svir.api.controller;

import com.svir.api.dto.receta.RecetaResponse;
import com.svir.api.dto.receta.RecetaUpdateRequest;
import com.svir.api.service.RecetaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recetas")
@RequiredArgsConstructor
public class RecetaController {

    private final RecetaService recetaService;

    @GetMapping("/producto/{productoId}")
    public RecetaResponse obtenerPorProducto(@PathVariable Long productoId) {
        return recetaService.obtenerPorProducto(productoId);
    }

    @PutMapping("/producto/{productoId}")
    public RecetaResponse reemplazarReceta(@PathVariable Long productoId,
                                           @Valid @RequestBody RecetaUpdateRequest request) {
        return recetaService.reemplazarReceta(productoId, request);
    }
}