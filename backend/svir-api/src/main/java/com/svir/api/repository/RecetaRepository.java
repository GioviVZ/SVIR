package com.svir.api.repository;

import com.svir.api.entity.Receta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RecetaRepository extends JpaRepository<Receta, Long> {
    List<Receta> findByProductoIdOrderByIdAsc(Long productoId);
    void deleteByProductoId(Long productoId);
    boolean existsByProductoId(Long productoId);
}