package com.svir.api.service;

import com.svir.api.dto.dashboard.DashboardResponse;
import com.svir.api.dto.dashboard.PedidoResumenDto;
import com.svir.api.entity.Ingrediente;
import com.svir.api.entity.Pedido;
import com.svir.api.entity.Producto;
import com.svir.api.enums.EstadoPedido;
import com.svir.api.enums.EstadoProduccion;
import com.svir.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductoRepository productoRepository;
    private final IngredienteRepository ingredienteRepository;
    private final PedidoRepository pedidoRepository;
    private final ProduccionRepository produccionRepository;

    public DashboardResponse resumen() {
        long productosStockBajo = productoRepository.findAll().stream()
                .filter(Producto::getActivo)
                .filter(p -> p.getStockMinimo() != null && p.getStock() <= p.getStockMinimo())
                .count();

        long ingredientesStockBajo = ingredienteRepository.findAll().stream()
                .filter(Ingrediente::getActivo)
                .filter(i -> i.getStockMinimo() != null && i.getStock() <= i.getStockMinimo())
                .count();

        LocalDateTime inicioHoy = LocalDate.now().atStartOfDay();
        LocalDateTime finHoy = inicioHoy.plusDays(1).minusNanos(1);

        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime finMes = inicioHoy.plusDays(1).minusNanos(1);

        BigDecimal ventasHoy = pedidoRepository.sumTotalByPeriod(inicioHoy, finHoy);
        BigDecimal ventasMes = pedidoRepository.sumTotalByPeriod(inicioMes, finMes);
        long pedidosHoy = pedidoRepository.countByCreatedAtBetween(inicioHoy, finHoy);

        List<PedidoResumenDto> pedidosRecientes = pedidoRepository.findTop5ByOrderByCreatedAtDesc()
                .stream()
                .map(this::toPedidoResumen)
                .toList();

        return DashboardResponse.builder()
                .totalProductos(productoRepository.count())
                .totalIngredientes(ingredienteRepository.count())
                .pedidosPendientes(pedidoRepository.countByEstado(EstadoPedido.PENDIENTE))
                .pedidosPreparacion(pedidoRepository.countByEstado(EstadoPedido.PREPARACION))
                .pedidosListos(pedidoRepository.countByEstado(EstadoPedido.LISTO))
                .produccionesActivas(produccionRepository.countByEstado(EstadoProduccion.EN_PROCESO))
                .productosStockBajo(productosStockBajo)
                .ingredientesStockBajo(ingredientesStockBajo)
                .pedidosHoy(pedidosHoy)
                .ventasHoy(ventasHoy)
                .ventasMes(ventasMes)
                .pedidosRecientes(pedidosRecientes)
                .build();
    }

    private PedidoResumenDto toPedidoResumen(Pedido p) {
        String clienteNombre = null;
        if (p.getCliente() != null) {
            clienteNombre = p.getCliente().getNombre();
        } else if (p.getObservacion() != null && !p.getObservacion().isBlank()) {
            clienteNombre = p.getObservacion();
        } else {
            clienteNombre = "Cliente general";
        }

        return PedidoResumenDto.builder()
                .id(p.getId())
                .clienteNombre(clienteNombre)
                .total(p.getTotal())
                .estado(p.getEstado().name())
                .tipoOrigen(p.getTipoOrigen().name())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
