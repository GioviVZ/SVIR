package com.svir.api.controller;

import com.svir.api.dto.pedido.PedidoCreateRequest;
import com.svir.api.dto.pedido.PedidoResponse;
import com.svir.api.dto.produccion.ProduccionResponse;
import com.svir.api.service.PedidoService;
import com.svir.api.service.ProduccionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.svir.api.dto.pedido.PedidoEstadoUpdateRequest;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/pedidos")
@RequiredArgsConstructor
public class PedidoController {

    private final PedidoService pedidoService;
    private final ProduccionService produccionService;

    @GetMapping
    public List<PedidoResponse> listar() {
        return pedidoService.listar();
    }

    @GetMapping("/delivery")
    public List<PedidoResponse> listarDelivery() {
        return pedidoService.listarDeliveryActivos();
    }

    @GetMapping("/{id}")
    public PedidoResponse obtener(@PathVariable Long id) {
        return pedidoService.obtener(id);
    }

    @PostMapping
    public PedidoResponse crear(@Valid @RequestBody PedidoCreateRequest request, Authentication auth) {
        PedidoResponse pedido = pedidoService.crearPedido(request);

        boolean usuarioInterno = auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getName());

        if (Boolean.TRUE.equals(pedido.getProduccionRequerida()) && usuarioInterno) {
            try {
                ProduccionResponse prod = produccionService.crearProduccionDesdeVenta(pedido.getId());
                if (prod != null) pedido.setProduccionId(prod.getId());
            } catch (RuntimeException e) {
                log.error("Error al crear producción desde venta para pedido {}: {}", pedido.getId(), e.getMessage(), e);
            }
        }

        return pedido;
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