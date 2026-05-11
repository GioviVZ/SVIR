package com.svir.api.controller;

import com.svir.api.dto.cliente.ClienteRegistroRequest;
import com.svir.api.dto.cliente.ClienteRequest;
import com.svir.api.dto.cliente.ClienteResponse;
import com.svir.api.service.ClienteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // Endpoint público — login por DNI desde la tienda web
    @GetMapping("/buscar")
    public ClienteResponse buscarPorDni(@RequestParam String dni) {
        return clienteService.buscarPorDni(dni);
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
}
