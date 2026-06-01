package com.svir.api.dto.usuario;

import com.svir.api.enums.RolUsuario;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UsuarioResponse {

    private Long id;
    private String nombre;
    private String email;
    private RolUsuario rol;
    private Boolean activo;
    private String telefono;
    private String preguntaSeguridad;
    private LocalDateTime createdAt;
}
