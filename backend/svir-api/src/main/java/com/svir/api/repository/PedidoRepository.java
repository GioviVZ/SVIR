package com.svir.api.repository;

import com.svir.api.entity.Pedido;
import com.svir.api.enums.EstadoPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    long countByEstado(EstadoPedido estado);

    long countByCreatedAtBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.createdAt BETWEEN :inicio AND :fin")
    BigDecimal sumTotalByPeriod(@Param("inicio") LocalDateTime inicio, @Param("fin") LocalDateTime fin);

    List<Pedido> findTop5ByOrderByCreatedAtDesc();
}
