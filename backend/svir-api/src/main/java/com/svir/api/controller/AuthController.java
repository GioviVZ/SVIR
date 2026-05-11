package com.svir.api.controller;

import com.svir.api.dto.auth.LoginRequest;
import com.svir.api.dto.auth.LoginResponse;
import com.svir.api.dto.auth.UserProfileResponse;
import com.svir.api.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserProfileResponse me() {
        return authService.me();
    }
}