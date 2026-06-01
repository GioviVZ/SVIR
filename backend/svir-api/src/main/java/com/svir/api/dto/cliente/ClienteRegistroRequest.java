package com.svir.api.dto.cliente;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClienteRegistroRequest {

    @NotBlank
    @Size(min = 2, max = 120)
    private String nombre;

    @NotBlank
    @Size(min = 8, max = 8)
    @Pattern(regexp = "\\d{8}", message = "El DNI debe tener 8 dígitos numéricos")
    private String dni;

    @Size(min = 11, max = 11, message = "El RUC debe tener 11 dígitos")
    @Pattern(regexp = "\\d{11}", message = "El RUC debe tener 11 dígitos numéricos")
    private String ruc;

    @Size(max = 15)
    private String telefono;

    @Size(max = 255)
    private String direccion;

    @Email(message = "Formato de email inválido")
    @Size(max = 150)
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, max = 100, message = "La contraseña debe tener al menos 6 caracteres")
    private String password;

    private String preguntaSeguridad;

    private String respuestaSeguridad;
}
