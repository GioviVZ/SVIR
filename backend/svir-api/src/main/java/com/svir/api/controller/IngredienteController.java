package com.svir.api.controller;

import com.svir.api.dto.ingrediente.*;
import com.svir.api.service.IngredienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ingredientes")
@RequiredArgsConstructor
public class IngredienteController {

    private final IngredienteService ingredienteService;

    @GetMapping
    public List<IngredienteResponse> listar() {
        return ingredienteService.listar();
    }

    @GetMapping("/{id}")
    public IngredienteResponse obtener(@PathVariable Long id) {
        return ingredienteService.obtener(id);
    }

    @PostMapping
    public IngredienteResponse crear(@Valid @RequestBody IngredienteRequest request) {
        return ingredienteService.crear(request);
    }

    @PutMapping("/{id}")
    public IngredienteResponse actualizar(@PathVariable Long id,
                                          @Valid @RequestBody IngredienteRequest request) {
        return ingredienteService.actualizar(id, request);
    }

    @PatchMapping("/{id}/activo")
    public void cambiarActivo(@PathVariable Long id,
                              @RequestParam Boolean activo) {
        ingredienteService.cambiarActivo(id, activo);
    }

    @PostMapping("/{id}/movimientos")
    public MovimientoIngredienteResponse registrarMovimiento(@PathVariable Long id,
                                                             @Valid @RequestBody MovimientoIngredienteRequest request) {
        return ingredienteService.registrarMovimiento(id, request);
    }

    @GetMapping("/{id}/movimientos")
    public List<MovimientoIngredienteResponse> listarMovimientos(@PathVariable Long id) {
        return ingredienteService.listarMovimientos(id);
    }
}