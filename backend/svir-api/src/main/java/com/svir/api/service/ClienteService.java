package com.svir.api.service;

import com.svir.api.dto.cliente.ClienteRegistroRequest;
import com.svir.api.dto.cliente.ClienteRequest;
import com.svir.api.dto.cliente.ClienteResponse;
import com.svir.api.entity.Cliente;
import com.svir.api.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public List<ClienteResponse> listar() {
        return clienteRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public ClienteResponse crear(ClienteRequest request) {
        Cliente cliente = Cliente.builder()
                .nombre(request.getNombre())
                .dni(request.getDni())
                .ruc(request.getRuc())
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .email(request.getEmail())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(clienteRepository.save(cliente));
    }

    public ClienteResponse actualizar(Long id, ClienteRequest request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        cliente.setNombre(request.getNombre());
        cliente.setDni(request.getDni());
        cliente.setRuc(request.getRuc());
        cliente.setTelefono(request.getTelefono());
        cliente.setDireccion(request.getDireccion());
        cliente.setEmail(request.getEmail());
        cliente.setActivo(request.getActivo() != null ? request.getActivo() : cliente.getActivo());
        cliente.setUpdatedAt(LocalDateTime.now());

        return toResponse(clienteRepository.save(cliente));
    }

    public ClienteResponse registrarPublico(ClienteRegistroRequest request) {
        if (clienteRepository.existsByDni(request.getDni())) {
            throw new RuntimeException("Ya existe una cuenta con ese DNI. Ingresa con tu DNI.");
        }
        Cliente cliente = Cliente.builder()
                .nombre(request.getNombre())
                .dni(request.getDni())
                .ruc(request.getRuc())
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .email(request.getEmail())
                .activo(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return toResponse(clienteRepository.save(cliente));
    }

    public ClienteResponse buscarPorDni(String dni) {
        return clienteRepository.findByDni(dni)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("No encontramos una cuenta con ese DNI."));
    }

    public void cambiarActivo(Long id, Boolean activo) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        cliente.setActivo(activo);
        cliente.setUpdatedAt(LocalDateTime.now());
        clienteRepository.save(cliente);
    }

    private ClienteResponse toResponse(Cliente c) {
        return ClienteResponse.builder()
                .id(c.getId())
                .nombre(c.getNombre())
                .dni(c.getDni())
                .ruc(c.getRuc())
                .telefono(c.getTelefono())
                .direccion(c.getDireccion())
                .email(c.getEmail())
                .activo(c.getActivo())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
