package com.svir.api.repository;

import com.svir.api.entity.Pedido;
import com.svir.api.enums.EstadoPedido;
import com.svir.api.enums.TipoOrigenPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    long countByEstado(EstadoPedido estado);

    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.createdAt BETWEEN :inicio AND :fin AND p.estado != com.svir.api.enums.EstadoPedido.CANCELADO")
    long countByCreatedAtBetween(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.createdAt BETWEEN :inicio AND :fin AND p.estado != com.svir.api.enums.EstadoPedido.CANCELADO")
    BigDecimal sumTotalByPeriod(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    List<Pedido> findTop5ByOrderByCreatedAtDesc();

    @Query("SELECT p FROM Pedido p WHERE p.tipoOrigen = :origen AND p.estado NOT IN (com.svir.api.enums.EstadoPedido.CANCELADO, com.svir.api.enums.EstadoPedido.ENTREGADO) ORDER BY p.createdAt DESC")
    List<Pedido> findActivosByTipoOrigen(@Param("origen") TipoOrigenPedido origen);

    @Query("SELECT p FROM Pedido p WHERE p.tipoOrigen = :origen AND p.estado = :estado AND p.createdAt >= :desde ORDER BY p.createdAt DESC")
    List<Pedido> findByTipoOrigenAndEstadoAndCreatedAtAfter(@Param("origen") TipoOrigenPedido origen, @Param("estado") EstadoPedido estado, @Param("desde") LocalDateTime desde);
}
