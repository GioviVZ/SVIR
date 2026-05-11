package com.svir.api.dto.cliente;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ClienteRequest {

    @NotBlank
    private String nombre;

    @NotBlank
    @Size(min = 8, max = 8, message = "El DNI debe tener 8 dígitos")
    @Pattern(regexp = "\\d{8}", message = "El DNI debe tener 8 dígitos numéricos")
    private String dni;

    @Size(min = 11, max = 11, message = "El RUC debe tener 11 dígitos")
    @Pattern(regexp = "\\d{11}", message = "El RUC debe tener 11 dígitos numéricos")
    private String ruc;

    private String telefono;

    private String direccion;

    @Email(message = "Formato de email inválido")
    @Size(max = 150)
    private String email;

    private Boolean activo;
}
