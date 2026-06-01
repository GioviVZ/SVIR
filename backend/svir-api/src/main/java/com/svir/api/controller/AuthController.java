package com.svir.api.controller;

import com.svir.api.dto.auth.*;
import com.svir.api.service.AuthService;
import com.svir.api.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UsuarioService usuarioService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserProfileResponse me() {
        return authService.me();
    }

    @GetMapping("/admin-contacto")
    public ResponseEntity<Map<String, String>> adminContacto() {
        return ResponseEntity.ok(usuarioService.adminContacto());
    }

    @PostMapping("/forgot-password/pregunta")
    public ResponseEntity<Map<String, String>> obtenerPregunta(@Valid @RequestBody ForgotPreguntaRequest request) {
        return ResponseEntity.ok(usuarioService.obtenerPregunta(request.getEmail()));
    }

    @PostMapping("/forgot-password/verificar")
    public ResponseEntity<Map<String, String>> verificarRespuesta(@Valid @RequestBody ForgotVerificarRequest request) {
        return ResponseEntity.ok(usuarioService.verificarRespuestaYResetear(request.getEmail(), request.getRespuesta()));
    }

    @PatchMapping("/cambiar-password")
    public ResponseEntity<Void> cambiarPassword(@Valid @RequestBody CambiarPasswordRequest request) {
        usuarioService.cambiarPassword(request.getPasswordActual(), request.getPasswordNueva());
        return ResponseEntity.noContent().build();
    }
}