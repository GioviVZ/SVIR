package com.svir.api.service;

import com.svir.api.dto.cliente.*;

import java.security.SecureRandom;
import java.util.Map;
import com.svir.api.entity.Cliente;
import com.svir.api.exception.BusinessException;
import com.svir.api.exception.ResourceNotFoundException;
import com.svir.api.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final PasswordEncoder passwordEncoder;

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
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));

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
            throw new BusinessException("Ya existe una cuenta con ese DNI. Ingresa con tu DNI y contraseña.");
        }
        String respuestaHash = (request.getRespuestaSeguridad() != null && !request.getRespuestaSeguridad().isBlank())
                ? passwordEncoder.encode(request.getRespuestaSeguridad().toLowerCase().trim()) : null;

        Cliente cliente = Cliente.builder()
                .nombre(request.getNombre())
                .dni(request.getDni())
                .ruc(request.getRuc())
                .telefono(request.getTelefono())
                .direccion(request.getDireccion())
                .email(request.getEmail())
                .preguntaSeguridad(request.getPreguntaSeguridad())
                .respuestaSeguridad(respuestaHash)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .activo(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return toResponse(clienteRepository.save(cliente));
    }

    public ClienteResponse loginCliente(ClienteLoginRequest request) {
        Cliente cliente = clienteRepository.findByDni(request.getDni())
                .orElseThrow(() -> new BusinessException("No encontramos una cuenta con ese DNI."));
        if (cliente.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), cliente.getPasswordHash())) {
            throw new BusinessException("DNI o contraseña incorrectos.");
        }
        return toResponse(cliente);
    }

    public Map<String, String> obtenerPreguntaCliente(String dni) {
        Cliente cliente = clienteRepository.findByDni(dni.trim())
                .orElseThrow(() -> new BusinessException("No encontramos una cuenta con ese DNI."));
        if (cliente.getPreguntaSeguridad() == null || cliente.getPreguntaSeguridad().isBlank()) {
            throw new BusinessException("Esta cuenta no tiene pregunta de seguridad configurada.");
        }
        return Map.of("pregunta", cliente.getPreguntaSeguridad(), "nombre", cliente.getNombre());
    }

    public Map<String, String> verificarRespuestaClienteYResetear(String dni, String respuesta) {
        Cliente cliente = clienteRepository.findByDni(dni.trim())
                .orElseThrow(() -> new BusinessException("No encontramos una cuenta con ese DNI."));
        if (cliente.getRespuestaSeguridad() == null) {
            throw new BusinessException("Esta cuenta no tiene pregunta de seguridad configurada.");
        }
        if (!passwordEncoder.matches(respuesta.toLowerCase().trim(), cliente.getRespuestaSeguridad())) {
            throw new BusinessException("Respuesta incorrecta.");
        }
        String tempPassword = generarPasswordTemporal();
        cliente.setPasswordHash(passwordEncoder.encode(tempPassword));
        cliente.setUpdatedAt(LocalDateTime.now());
        clienteRepository.save(cliente);
        return Map.of("tempPassword", tempPassword, "nombre", cliente.getNombre(),
                "telefono", cliente.getTelefono() != null ? cliente.getTelefono() : "");
    }

    public Map<String, String> generarClaveTemporalById(Long id) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        String tempPassword = generarPasswordTemporal();
        cliente.setPasswordHash(passwordEncoder.encode(tempPassword));
        cliente.setUpdatedAt(LocalDateTime.now());
        clienteRepository.save(cliente);
        return Map.of("tempPassword", tempPassword, "nombre", cliente.getNombre(),
                "telefono", cliente.getTelefono() != null ? cliente.getTelefono() : "");
    }

    private String generarPasswordTemporal() {
        String upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        String lower = "abcdefghjkmnpqrstuvwxyz";
        String digits = "23456789";
        String special = "#@$!";
        String all = upper + lower + digits + special;
        SecureRandom rnd = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        sb.append(upper.charAt(rnd.nextInt(upper.length())));
        sb.append(lower.charAt(rnd.nextInt(lower.length())));
        sb.append(digits.charAt(rnd.nextInt(digits.length())));
        sb.append(special.charAt(rnd.nextInt(special.length())));
        for (int i = 4; i < 8; i++) sb.append(all.charAt(rnd.nextInt(all.length())));
        return sb.toString();
    }

    public void resetearClave(Long id, ClienteResetPasswordRequest request) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
        cliente.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        cliente.setUpdatedAt(LocalDateTime.now());
        clienteRepository.save(cliente);
    }

    public ClienteResponse buscarPorDni(String dni) {
        return clienteRepository.findByDni(dni)
                .map(this::toResponse)
                .orElseThrow(() -> new BusinessException("No encontramos una cuenta con ese DNI."));
    }

    public void cambiarActivo(Long id, Boolean activo) {
        Cliente cliente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
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
