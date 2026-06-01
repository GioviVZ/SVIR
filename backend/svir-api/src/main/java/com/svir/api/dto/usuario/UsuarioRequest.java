package com.svir.api.dto.usuario;

import com.svir.api.enums.RolUsuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UsuarioRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    @Email
    private String email;

    private String password;

    @NotNull
    private RolUsuario rol;

    private Boolean activo;

    private String telefono;

    private String preguntaSeguridad;

    private String respuestaSeguridad;
}
