package com.svir.api.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class UserProfileResponse {
    private Long id;
    private String nombre;
    private String email;
    private String rol;
    private Boolean activo;
}