package com.svir.api.service;

import com.svir.api.dto.ingrediente.*;
import com.svir.api.entity.Ingrediente;
import com.svir.api.entity.MovimientoIngrediente;
import com.svir.api.entity.Usuario;
import com.svir.api.enums.MotivoMovimientoIngrediente;
import com.svir.api.enums.TipoMovimiento;
import com.svir.api.repository.IngredienteRepository;
import com.svir.api.repository.MovimientoIngredienteRepository;
import com.svir.api.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IngredienteService {

    private final IngredienteRepository ingredienteRepository;
    private final MovimientoIngredienteRepository movimientoIngredienteRepository;
    private final UsuarioRepository usuarioRepository;

    public List<IngredienteResponse> listar() {
        return ingredienteRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public IngredienteResponse obtener(Long id) {
        Ingrediente ingrediente = ingredienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingrediente no encontrado"));
        return toResponse(ingrediente);
    }

    public IngredienteResponse crear(IngredienteRequest request) {
        Ingrediente ingrediente = Ingrediente.builder()
                .nombre(request.getNombre())
                .unidadMedida(request.getUnidadMedida())
                .stock(request.getStock())
                .stockMinimo(request.getStockMinimo())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return toResponse(ingredienteRepository.save(ingrediente));
    }

    public IngredienteResponse actualizar(Long id, IngredienteRequest request) {
        Ingrediente ingrediente = ingredienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingrediente no encontrado"));

        ingrediente.setNombre(request.getNombre());
        ingrediente.setUnidadMedida(request.getUnidadMedida());
        ingrediente.setStock(request.getStock());
        ingrediente.setStockMinimo(request.getStockMinimo());
        ingrediente.setActivo(request.getActivo() != null ? request.getActivo() : ingrediente.getActivo());
        ingrediente.setUpdatedAt(LocalDateTime.now());

        return toResponse(ingredienteRepository.save(ingrediente));
    }

    public void cambiarActivo(Long id, Boolean activo) {
        Ingrediente ingrediente = ingredienteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ingrediente no encontrado"));

        ingrediente.setActivo(activo);
        ingrediente.setUpdatedAt(LocalDateTime.now());
        ingredienteRepository.save(ingrediente);
    }

    public MovimientoIngredienteResponse registrarMovimiento(Long ingredienteId, MovimientoIngredienteRequest request) {
        Ingrediente ingrediente = ingredienteRepository.findById(ingredienteId)
                .orElseThrow(() -> new RuntimeException("Ingrediente no encontrado"));

        BigDecimal stockAnterior = ingrediente.getStock();
        BigDecimal stockNuevo;

        if (request.getTipo() == TipoMovimiento.ENTRADA) {
            stockNuevo = stockAnterior.add(request.getCantidad());
        } else if (request.getTipo() == TipoMovimiento.SALIDA) {
            stockNuevo = stockAnterior.subtract(request.getCantidad());
            if (stockNuevo.compareTo(BigDecimal.ZERO) < 0) {
                throw new RuntimeException("Stock insuficiente para salida");
            }
        } else {
            stockNuevo = request.getCantidad();
        }

        ingrediente.setStock(stockNuevo);
        ingrediente.setUpdatedAt(LocalDateTime.now());
        ingredienteRepository.save(ingrediente);

        Usuario usuario = getUsuarioAutenticado();

        String referenciaTipo = request.getReferenciaTipo() != null ? request.getReferenciaTipo() : "MANUAL";

        MovimientoIngrediente movimiento = MovimientoIngrediente.builder()
                .ingrediente(ingrediente)
                .tipo(request.getTipo())
                .motivo(request.getMotivo())
                .cantidad(request.getCantidad())
                .stockAnterior(stockAnterior)
                .stockNuevo(stockNuevo)
                .referenciaTipo(referenciaTipo)
                .referenciaId(request.getReferenciaId())
                .usuario(usuario)
                .createdAt(LocalDateTime.now())
                .build();

        return toMovimientoResponse(movimientoIngredienteRepository.save(movimiento));
    }

    public List<MovimientoIngredienteResponse> listarMovimientos(Long ingredienteId) {
        return movimientoIngredienteRepository.findByIngredienteIdOrderByIdDesc(ingredienteId)
                .stream()
                .map(this::toMovimientoResponse)
                .toList();
    }

    @Transactional
    public void consumirPorProduccion(Ingrediente ingrediente,
                                      BigDecimal cantidadConsumida,
                                      String referenciaTipo,
                                      Long referenciaId,
                                      Usuario usuario) {

        BigDecimal stockAnterior = ingrediente.getStock();
        BigDecimal stockNuevo = stockAnterior.subtract(cantidadConsumida);

        if (stockNuevo.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Stock insuficiente del ingrediente: " + ingrediente.getNombre());
        }

        ingrediente.setStock(stockNuevo);
        ingrediente.setUpdatedAt(LocalDateTime.now());
        ingredienteRepository.save(ingrediente);

        MovimientoIngrediente movimiento = MovimientoIngrediente.builder()
                .ingrediente(ingrediente)
                .tipo(TipoMovimiento.SALIDA)
                .motivo(MotivoMovimientoIngrediente.PRODUCCION)
                .cantidad(cantidadConsumida)
                .stockAnterior(stockAnterior)
                .stockNuevo(stockNuevo)
                .referenciaTipo(referenciaTipo)
                .referenciaId(referenciaId)
                .usuario(usuario)
                .createdAt(LocalDateTime.now())
                .build();

        movimientoIngredienteRepository.save(movimiento);
    }

    @Transactional
    public void consumirSiHayStock(Ingrediente ingrediente,
                                   BigDecimal cantidadConsumida,
                                   String referenciaTipo,
                                   Long referenciaId,
                                   Usuario usuario) {

        BigDecimal stockAnterior = ingrediente.getStock();
        BigDecimal stockNuevo = stockAnterior.subtract(cantidadConsumida);

        if (stockNuevo.compareTo(BigDecimal.ZERO) < 0) {
            return; // ingrediente insuficiente — se omite sin lanzar excepción
        }

        ingrediente.setStock(stockNuevo);
        ingrediente.setUpdatedAt(LocalDateTime.now());
        ingredienteRepository.save(ingrediente);

        MovimientoIngrediente movimiento = MovimientoIngrediente.builder()
                .ingrediente(ingrediente)
                .tipo(TipoMovimiento.SALIDA)
                .motivo(MotivoMovimientoIngrediente.PRODUCCION)
                .cantidad(cantidadConsumida)
                .stockAnterior(stockAnterior)
                .stockNuevo(stockNuevo)
                .referenciaTipo(referenciaTipo)
                .referenciaId(referenciaId)
                .usuario(usuario)
                .createdAt(LocalDateTime.now())
                .build();

        movimientoIngredienteRepository.save(movimiento);
    }

    @Transactional
    public void restaurarPorCancelacion(Ingrediente ingrediente,
                                        BigDecimal cantidadRestaurada,
                                        Long referenciaId,
                                        Usuario usuario) {

        BigDecimal stockAnterior = ingrediente.getStock();
        BigDecimal stockNuevo = stockAnterior.add(cantidadRestaurada);

        ingrediente.setStock(stockNuevo);
        ingrediente.setUpdatedAt(LocalDateTime.now());
        ingredienteRepository.save(ingrediente);

        MovimientoIngrediente movimiento = MovimientoIngrediente.builder()
                .ingrediente(ingrediente)
                .tipo(TipoMovimiento.ENTRADA)
                .motivo(MotivoMovimientoIngrediente.CANCELACION)
                .cantidad(cantidadRestaurada)
                .stockAnterior(stockAnterior)
                .stockNuevo(stockNuevo)
                .referenciaTipo("PRODUCCION")
                .referenciaId(referenciaId)
                .usuario(usuario)
                .createdAt(LocalDateTime.now())
                .build();

        movimientoIngredienteRepository.save(movimiento);
    }

    private Usuario getUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));
    }

    private IngredienteResponse toResponse(Ingrediente i) {
        return IngredienteResponse.builder()
                .id(i.getId())
                .nombre(i.getNombre())
                .unidadMedida(i.getUnidadMedida())
                .stock(i.getStock())
                .stockMinimo(i.getStockMinimo())
                .activo(i.getActivo())
                .build();
    }

    private MovimientoIngredienteResponse toMovimientoResponse(MovimientoIngrediente m) {
        return MovimientoIngredienteResponse.builder()
                .id(m.getId())
                .ingredienteId(m.getIngrediente().getId())
                .ingredienteNombre(m.getIngrediente().getNombre())
                .tipo(m.getTipo().name())
                .motivo(m.getMotivo().name())
                .cantidad(m.getCantidad())
                .stockAnterior(m.getStockAnterior())
                .stockNuevo(m.getStockNuevo())
                .referenciaTipo(m.getReferenciaTipo())
                .referenciaId(m.getReferenciaId())
                .usuarioNombre(m.getUsuario() != null ? m.getUsuario().getNombre() : null)
                .build();
    }
}