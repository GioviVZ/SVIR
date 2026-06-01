package com.svir.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPreguntaRequest {

    @NotBlank @Email
    private String email;
}
