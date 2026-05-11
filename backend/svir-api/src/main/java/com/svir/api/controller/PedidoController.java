package com.svir.api.controller;

import com.svir.api.dto.pedido.PedidoCreateRequest;
import com.svir.api.dto.pedido.PedidoResponse;
import com.svir.api.service.PedidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import com.svir.api.dto.pedido.PedidoEstadoUpdateRequest;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;

    @GetMapping
    public List<PedidoResponse> listar() {
        return pedidoService.listar();
    }

    @GetMapping("/{id}")
    public PedidoResponse obtener(@PathVariable Long id) {
        return pedidoService.obtener(id);
    }

    @PostMapping
    public PedidoResponse crear(@Valid @RequestBody PedidoCreateRequest request) {
        return pedidoService.crearPedido(request);
    }
    @PatchMapping("/{id}/estado")
    public PedidoResponse cambiarEstado(@PathVariable Long id,
                                        @Valid @RequestBody PedidoEstadoUpdateRequest request) {
        return pedidoService.cambiarEstado(id, request);
    }
    @PatchMapping("/{id}/cancelar")
    public PedidoResponse cancelar(@PathVariable Long id) {
        return pedidoService.cancelarPedido(id);
    }
}