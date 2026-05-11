package com.svir.api.repository;

import com.svir.api.entity.Produccion;
import com.svir.api.enums.EstadoProduccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProduccionRepository extends JpaRepository<Produccion, Long> {
    List<Produccion> findByPedidoIdOrderByIdDesc(Long pedidoId);
    long countByEstado(EstadoProduccion estado);
}