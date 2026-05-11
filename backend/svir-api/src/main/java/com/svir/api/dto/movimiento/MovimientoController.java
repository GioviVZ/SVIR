package com.svir.api.controller;

import com.svir.api.dto.ingrediente.MovimientoIngredienteResponse;
import com.svir.api.dto.movimiento.MovimientoProductoResponse;
import com.svir.api.service.MovimientoConsultaService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movimientos")
@RequiredArgsConstructor
public class MovimientoController {

    private final MovimientoConsultaService movimientoConsultaService;

    @GetMapping("/productos")
    public List<MovimientoProductoResponse> listarProductos() {
        return movimientoConsultaService.listarMovimientosProducto();
    }

    @GetMapping("/productos/{productoId}")
    public List<MovimientoProductoResponse> listarProductosPorProducto(@PathVariable Long productoId) {
        return movimientoConsultaService.listarMovimientosProductoPorProducto(productoId);
    }

    @GetMapping("/ingredientes")
    public List<MovimientoIngredienteResponse> listarIngredientes() {
        return movimientoConsultaService.listarMovimientosIngrediente();
    }

    @GetMapping("/ingredientes/{ingredienteId}")
    public List<MovimientoIngredienteResponse> listarIngredientesPorIngrediente(@PathVariable Long ingredienteId) {
        return movimientoConsultaService.listarMovimientosIngredientePorIngrediente(ingredienteId);
    }
}