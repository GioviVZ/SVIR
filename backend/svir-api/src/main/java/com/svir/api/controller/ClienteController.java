package com.svir.api.controller;

import com.svir.api.dto.cliente.*;
import com.svir.api.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;

    @GetMapping
    public List<ClienteResponse> listar() {
        return clienteService.listar();
    }

    // Endpoint público — registro desde la tienda web
    @PostMapping("/registro")
    public ClienteResponse registrar(@Valid @RequestBody ClienteRegistroRequest request) {
        return clienteService.registrarPublico(request);
    }

    // Endpoint público — login con DNI + contraseña desde la tienda web
    @PostMapping("/login")
    public ClienteResponse login(@Valid @RequestBody ClienteLoginRequest request) {
        return clienteService.loginCliente(request);
    }

    // Endpoint público — login por DNI desde la tienda web (legacy, solo interno)
    @GetMapping("/buscar")
    public ClienteResponse buscarPorDni(@RequestParam String dni) {
        return clienteService.buscarPorDni(dni);
    }

    @PostMapping("/{id}/generar-clave-temporal")
    public ResponseEntity<Map<String, String>> generarClaveTemporal(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.generarClaveTemporalById(id));
    }

    @PostMapping("/forgot-password/pregunta")
    public ResponseEntity<Map<String, String>> obtenerPregunta(@Valid @RequestBody ClienteForgotPreguntaRequest request) {
        return ResponseEntity.ok(clienteService.obtenerPreguntaCliente(request.getDni()));
    }

    @PostMapping("/forgot-password/verificar")
    public ResponseEntity<Map<String, String>> verificarRespuesta(@Valid @RequestBody ClienteForgotVerificarRequest request) {
        return ResponseEntity.ok(clienteService.verificarRespuestaClienteYResetear(request.getDni(), request.getRespuesta()));
    }

    @PostMapping
    public ClienteResponse crear(@Valid @RequestBody ClienteRequest request) {
        return clienteService.crear(request);
    }

    @PutMapping("/{id}")
    public ClienteResponse actualizar(@PathVariable Long id,
                                      @Valid @RequestBody ClienteRequest request) {
        return clienteService.actualizar(id, request);
    }

    @PatchMapping("/{id}/activo")
    public void cambiarActivo(@PathVariable Long id,
                              @RequestParam Boolean activo) {
        clienteService.cambiarActivo(id, activo);
    }

    @PatchMapping("/{id}/resetear-clave")
    public void resetearClave(@PathVariable Long id,
                              @Valid @RequestBody ClienteResetPasswordRequest request) {
        clienteService.resetearClave(id, request);
    }
}
