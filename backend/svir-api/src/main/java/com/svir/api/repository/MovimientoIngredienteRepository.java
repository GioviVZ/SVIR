package com.svir.api.repository;

import com.svir.api.entity.MovimientoIngrediente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimientoIngredienteRepository extends JpaRepository<MovimientoIngrediente, Long> {
    List<MovimientoIngrediente> findByIngredienteIdOrderByIdDesc(Long ingredienteId);
}