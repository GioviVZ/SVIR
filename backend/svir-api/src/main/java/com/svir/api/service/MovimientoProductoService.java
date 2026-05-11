package com.svir.api.service;

import com.svir.api.entity.MovimientoProducto;
import com.svir.api.entity.Producto;
import com.svir.api.entity.Usuario;
import com.svir.api.enums.MotivoMovimientoProducto;
import com.svir.api.enums.TipoMovimiento;
import com.svir.api.repository.MovimientoProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MovimientoProductoService {

    private final MovimientoProductoRepository movimientoProductoRepository;

    public void registrarVenta(Producto producto,
                               int cantidad,
                               int stockAnterior,
                               int stockNuevo,
                               Long referenciaId,
                               Usuario usuario) {

        MovimientoProducto movimiento = MovimientoProducto.builder()
                .producto(producto)
                .tipo(TipoMovimiento.SALIDA)
                .motivo(MotivoMovimientoProducto.VENTA)
                .cantidad(cantidad)
                .stockAnterior(stockAnterior)
                .stockNuevo(stockNuevo)
                .referenciaTipo("PEDIDO")
                .referenciaId(referenciaId)
                .usuario(usuario)
                .createdAt(LocalDateTime.now())
                .build();

        movimientoProductoRepository.save(movimiento);
    }

    public void registrarProduccion(Producto producto,
                                    int cantidad,
                                    int stockAnterior,
                                    int stockNuevo,
                                    Long referenciaId,
                                    Usuario usuario) {

        MovimientoProducto movimiento = MovimientoProducto.builder()
                .producto(producto)
                .tipo(TipoMovimiento.ENTRADA)
                .motivo(MotivoMovimientoProducto.PRODUCCION)
                .cantidad(cantidad)
                .stockAnterior(stockAnterior)
                .stockNuevo(stockNuevo)
                .referenciaTipo("PRODUCCION")
                .referenciaId(referenciaId)
                .usuario(usuario)
                .createdAt(LocalDateTime.now())
                .build();

        movimientoProductoRepository.save(movimiento);
    }
    public void registrarCancelacion(Producto producto,
                                 int cantidad,
                                 int stockAnterior,
                                 int stockNuevo,
                                 Long referenciaId,
                                 Usuario usuario) {

        MovimientoProducto movimiento = MovimientoProducto.builder()
                .producto(producto)
                .tipo(TipoMovimiento.ENTRADA)
                .motivo(MotivoMovimientoProducto.CANCELACION)
                .cantidad(cantidad)
                .stockAnterior(stockAnterior)
                .stockNuevo(stockNuevo)
                .referenciaTipo("PEDIDO")
                .referenciaId(referenciaId)
                .usuario(usuario)
                .createdAt(LocalDateTime.now())
                .build();

        movimientoProductoRepository.save(movimiento);
    }
}