package com.svir.api.controller;

import com.svir.api.dto.produccion.*;
import com.svir.api.service.ProduccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/producciones")
@RequiredArgsConstructor
public class ProduccionController {

    private final ProduccionService produccionService;

    @GetMapping
    public List<ProduccionResponse> listar() {
        return produccionService.listar();
    }

    @GetMapping("/{id}")
    public ProduccionResponse obtener(@PathVariable Long id) {
        return produccionService.obtener(id);
    }

    @PostMapping("/por-pedido/{pedidoId}")
    public ProduccionResponse crearPorPedido(@PathVariable Long pedidoId,
                                             @RequestBody(required = false) Map<String, String> body) {
        String observacion = body != null ? body.get("observacion") : null;
        return produccionService.crearProduccionPorPedido(pedidoId, observacion);
    }

    @PostMapping
    public ProduccionResponse crearStock(@Valid @RequestBody ProduccionCreateRequest request) {
        return produccionService.crearProduccionStock(request);
    }

    @PatchMapping("/{id}/terminar")
    public ProduccionResponse terminar(@PathVariable Long id,
                                       @Valid @RequestBody ProduccionTerminarRequest request) {
        return produccionService.terminarProduccion(id, request);
    }

    @PatchMapping("/{id}/cancelar")
    public ProduccionResponse cancelar(@PathVariable Long id) {
        return produccionService.cancelarProduccion(id);
    }
}