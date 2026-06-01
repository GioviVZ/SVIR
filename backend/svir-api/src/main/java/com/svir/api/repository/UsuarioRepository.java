package com.svir.api.repository;

import com.svir.api.entity.Usuario;
import com.svir.api.enums.RolUsuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    List<Usuario> findByRolAndActivoTrue(RolUsuario rol);
}