package com.svir.api.service;

import com.svir.api.dto.ingrediente.MovimientoIngredienteResponse;
import com.svir.api.dto.movimiento.MovimientoProductoResponse;
import com.svir.api.entity.MovimientoIngrediente;
import com.svir.api.entity.MovimientoProducto;
import com.svir.api.repository.MovimientoIngredienteRepository;
import com.svir.api.repository.MovimientoProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MovimientoConsultaService {

    private final MovimientoProductoRepository movimientoProductoRepository;
    private final MovimientoIngredienteRepository movimientoIngredienteRepository;

    public List<MovimientoProductoResponse> listarMovimientosProducto() {
        return movimientoProductoRepository.findAll().stream()
                .map(this::toProductoResponse)
                .toList();
    }

    public List<MovimientoProductoResponse> listarMovimientosProductoPorProducto(Long productoId) {
        return movimientoProductoRepository.findByProductoIdOrderByIdDesc(productoId)
                .stream()
                .map(this::toProductoResponse)
                .toList();
    }

    public List<MovimientoIngredienteResponse> listarMovimientosIngredientePorIngrediente(Long ingredienteId) {
        return movimientoIngredienteRepository.findByIngredienteIdOrderByIdDesc(ingredienteId)
                .stream()
                .map(this::toIngredienteResponse)
                .toList();
    }

    public List<MovimientoIngredienteResponse> listarMovimientosIngrediente() {
        return movimientoIngredienteRepository.findAll().stream()
                .map(this::toIngredienteResponse)
                .toList();
    }

    private MovimientoProductoResponse toProductoResponse(MovimientoProducto m) {
        return MovimientoProductoResponse.builder()
                .id(m.getId())
                .productoId(m.getProducto().getId())
                .productoNombre(m.getProducto().getNombre())
                .tipo(m.getTipo().name())
                .motivo(m.getMotivo().name())
                .cantidad(m.getCantidad())
                .stockAnterior(m.getStockAnterior())
                .stockNuevo(m.getStockNuevo())
                .referenciaTipo(m.getReferenciaTipo())
                .referenciaId(m.getReferenciaId())
                .usuarioNombre(m.getUsuario() != null ? m.getUsuario().getNombre() : null)
                .build();
    }

    private MovimientoIngredienteResponse toIngredienteResponse(MovimientoIngrediente m) {
        return MovimientoIngredienteResponse.builder()
                .id(m.getId())
                .ingredienteId(m.getIngrediente().getId())
                .ingredienteNombre(m.getIngrediente().getNombre())
                .tipo(m.getTipo().name())
                .motivo(m.getMotivo().name())
                .cantidad(m.getCantidad())
                .stockAnterior(m.getStockAnterior())
                .stockNuevo(m.getStockNuevo())
                .referenciaTipo(m.getReferenciaTipo())
                .referenciaId(m.getReferenciaId())
                .usuarioNombre(m.getUsuario() != null ? m.getUsuario().getNombre() : null)
                .build();
    }
}