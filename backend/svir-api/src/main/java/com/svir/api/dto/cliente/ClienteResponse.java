package com.svir.api.dto.cliente;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ClienteResponse {

    private Long id;
    private String nombre;
    private String dni;
    private String ruc;
    private String telefono;
    private String direccion;
    private String email;
    private Boolean activo;
    private LocalDateTime createdAt;
}
