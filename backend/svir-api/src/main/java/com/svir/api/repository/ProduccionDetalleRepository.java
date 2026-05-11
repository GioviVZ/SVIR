package com.svir.api.repository;

import com.svir.api.entity.ProduccionDetalle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProduccionDetalleRepository extends JpaRepository<ProduccionDetalle, Long> {
    List<ProduccionDetalle> findByProduccionIdOrderByIdAsc(Long produccionId);
}