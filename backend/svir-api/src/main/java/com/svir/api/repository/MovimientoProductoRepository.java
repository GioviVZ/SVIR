package com.svir.api.repository;

import com.svir.api.entity.MovimientoProducto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoProductoRepository extends JpaRepository<MovimientoProducto, Long> {
    List<MovimientoProducto> findByProductoIdOrderByIdDesc(Long productoId);
}