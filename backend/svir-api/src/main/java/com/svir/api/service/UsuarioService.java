package com.svir.api.service;

import com.svir.api.dto.usuario.UsuarioRequest;
import com.svir.api.dto.usuario.UsuarioResponse;
import com.svir.api.entity.Usuario;
import com.svir.api.enums.RolUsuario;
import com.svir.api.exception.BusinessException;
import com.svir.api.repository.UsuarioRepository;
import com.svir.api.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public UsuarioResponse crear(UsuarioRequest request) {
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new BusinessException("Ya existe un usuario con ese email");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BusinessException("La contraseña es obligatoria al crear un usuario");
        }

        String respuestaHash = (request.getRespuestaSeguridad() != null && !request.getRespuestaSeguridad().isBlank())
                ? passwordEncoder.encode(request.getRespuestaSeguridad().toLowerCase().trim()) : null;

        Usuario usuario = Usuario.builder()
                .nombre(request.getNombre())
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .rol(request.getRol())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .telefono(request.getTelefono())
                .preguntaSeguridad(request.getPreguntaSeguridad())
                .respuestaSeguridad(respuestaHash)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(usuarioRepository.save(usuario));
    }

    public UsuarioResponse actualizar(Long id, UsuarioRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        usuarioRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new BusinessException("Ya existe otro usuario con ese email");
            }
        });

        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail().toLowerCase().trim());
        usuario.setRol(request.getRol());
        usuario.setActivo(request.getActivo() != null ? request.getActivo() : usuario.getActivo());
        usuario.setTelefono(request.getTelefono());
        if (request.getPreguntaSeguridad() != null) usuario.setPreguntaSeguridad(request.getPreguntaSeguridad());
        if (request.getRespuestaSeguridad() != null && !request.getRespuestaSeguridad().isBlank()) {
            usuario.setRespuestaSeguridad(passwordEncoder.encode(request.getRespuestaSeguridad().toLowerCase().trim()));
        }

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }

        usuario.setUpdatedAt(LocalDateTime.now());

        return toResponse(usuarioRepository.save(usuario));
    }

    public Map<String, String> obtenerPregunta(String email) {
        Usuario usuario = usuarioRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new BusinessException("No existe un usuario con ese email"));
        if (usuario.getPreguntaSeguridad() == null || usuario.getPreguntaSeguridad().isBlank()) {
            throw new BusinessException("Este usuario no tiene pregunta de seguridad configurada");
        }
        return Map.of("pregunta", usuario.getPreguntaSeguridad(), "nombre", usuario.getNombre());
    }

    public Map<String, String> verificarRespuestaYResetear(String email, String respuesta) {
        Usuario usuario = usuarioRepository.findByEmail(email.toLowerCase().trim())
                .orElseThrow(() -> new BusinessException("No existe un usuario con ese email"));
        if (usuario.getRespuestaSeguridad() == null) {
            throw new BusinessException("Este usuario no tiene pregunta de seguridad configurada");
        }
        if (!passwordEncoder.matches(respuesta.toLowerCase().trim(), usuario.getRespuestaSeguridad())) {
            throw new BusinessException("Respuesta incorrecta");
        }
        String tempPassword = generarPasswordTemporal();
        usuario.setPasswordHash(passwordEncoder.encode(tempPassword));
        usuario.setUpdatedAt(LocalDateTime.now());
        usuarioRepository.save(usuario);
        return Map.of("tempPassword", tempPassword, "nombre", usuario.getNombre(),
                "telefono", usuario.getTelefono() != null ? usuario.getTelefono() : "");
    }

    public void cambiarPassword(String passwordActual, String passwordNueva) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new BusinessException("No autenticado");
        }
        CustomUserDetails userDetails = (CustomUserDetails) auth.getPrincipal();
        Usuario usuario = userDetails.getUsuario();
        // Reload from DB to get fresh data
        usuario = usuarioRepository.findById(usuario.getId())
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));
        if (!passwordEncoder.matches(passwordActual, usuario.getPasswordHash())) {
            throw new BusinessException("La contraseña actual es incorrecta");
        }
        usuario.setPasswordHash(passwordEncoder.encode(passwordNueva));
        usuario.setUpdatedAt(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    public Map<String, String> adminContacto() {
        return usuarioRepository.findByRolAndActivoTrue(RolUsuario.ADMIN).stream()
                .filter(u -> u.getTelefono() != null && !u.getTelefono().isBlank())
                .findFirst()
                .map(u -> Map.of("nombre", u.getNombre(), "telefono", u.getTelefono()))
                .orElse(Map.of("nombre", "Administrador", "telefono", ""));
    }

    public Map<String, String> generarClaveTemporalById(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));
        String tempPassword = generarPasswordTemporal();
        usuario.setPasswordHash(passwordEncoder.encode(tempPassword));
        usuario.setUpdatedAt(LocalDateTime.now());
        usuarioRepository.save(usuario);
        return Map.of("tempPassword", tempPassword, "nombre", usuario.getNombre(),
                "telefono", usuario.getTelefono() != null ? usuario.getTelefono() : "");
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

    public void cambiarActivo(Long id, Boolean activo) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setActivo(activo);
        usuario.setUpdatedAt(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    private UsuarioResponse toResponse(Usuario u) {
        return UsuarioResponse.builder()
                .id(u.getId())
                .nombre(u.getNombre())
                .email(u.getEmail())
                .rol(u.getRol())
                .activo(u.getActivo())
                .telefono(u.getTelefono())
                .preguntaSeguridad(u.getPreguntaSeguridad())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
