package com.svir.api.dto.dashboard;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardResponse {
    private long totalProductos;
    private long totalIngredientes;
    private long pedidosPendientes;
    private long pedidosPreparacion;
    private long pedidosListos;
    private long produccionesActivas;
    private long productosStockBajo;
    private long ingredientesStockBajo;

    private long pedidosHoy;
    private BigDecimal ventasHoy;
    private BigDecimal ventasMes;

    private List<PedidoResumenDto> pedidosRecientes;
}