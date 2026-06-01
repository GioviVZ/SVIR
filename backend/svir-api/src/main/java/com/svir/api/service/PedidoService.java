package com.svir.api.service;

import com.svir.api.dto.pedido.*;
import com.svir.api.entity.*;
import com.svir.api.enums.EstadoDetallePedido;
import com.svir.api.enums.EstadoPedido;
import com.svir.api.enums.TipoOrigenPedido;
import com.svir.api.repository.*;
import com.svir.api.dto.pedido.PedidoEstadoUpdateRequest;
import com.svir.api.exception.BusinessException;
import com.svir.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoProductoService movimientoProductoService;

    @Transactional
    public PedidoResponse crearPedido(PedidoCreateRequest request) {
        Usuario usuario = getUsuarioAutenticadoOpcional();

        Cliente cliente = null;
        if (request.getClienteId() != null) {
            cliente = clienteRepository.findById(request.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        }

        Pedido pedido = Pedido.builder()
                .cliente(cliente)
                .usuario(usuario)
                .total(BigDecimal.ZERO)
                .estado(EstadoPedido.PENDIENTE)
                .tipoOrigen(request.getTipoOrigen())
                .observacion(request.getObservacion())
                .createdAt(LocalDateTime.now())
                .build();

        pedido = pedidoRepository.save(pedido);

        List<DetallePedido> detallesGuardados = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        boolean requiereProduccion = false;
        boolean todosAtendidos = true;

        for (PedidoDetalleRequest item : request.getDetalles()) {
            Producto producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado con id: " + item.getProductoId()));

            int cantidadSolicitada = item.getCantidad();
            int stockDisponible = producto.getStock() != null ? producto.getStock() : 0;
            int cantidadAtendida = Math.min(cantidadSolicitada, stockDisponible);

            EstadoDetallePedido estadoDetalle;
            if (cantidadAtendida == 0) {
                estadoDetalle = EstadoDetallePedido.PENDIENTE;
                todosAtendidos = false;
                requiereProduccion = true;
            } else if (cantidadAtendida < cantidadSolicitada) {
                estadoDetalle = EstadoDetallePedido.PARCIAL;
                todosAtendidos = false;
                requiereProduccion = true;
            } else {
                estadoDetalle = EstadoDetallePedido.ATENDIDO;
            }

            BigDecimal precioUnitario = producto.getPrecio();
            BigDecimal subtotal = precioUnitario.multiply(BigDecimal.valueOf(cantidadSolicitada));
            total = total.add(subtotal);

            if (cantidadAtendida > 0) {
                int stockAnterior = producto.getStock();
                int stockNuevo = stockAnterior - cantidadAtendida;

                producto.setStock(stockNuevo);
                productoRepository.save(producto);

                movimientoProductoService.registrarVenta(
                        producto,
                        cantidadAtendida,
                        stockAnterior,
                        stockNuevo,
                        pedido.getId(),
                        usuario
                );
            }

            DetallePedido detalle = DetallePedido.builder()
                    .pedido(pedido)
                    .producto(producto)
                    .cantidad(cantidadSolicitada)
                    .cantidadAtendida(cantidadAtendida)
                    .precioUnitario(precioUnitario)
                    .subtotal(subtotal)
                    .estado(estadoDetalle)
                    .createdAt(LocalDateTime.now())
                    .build();

            detallesGuardados.add(detallePedidoRepository.save(detalle));
        }

        if (todosAtendidos) {
            pedido.setEstado(EstadoPedido.LISTO);
        } else {
            pedido.setEstado(EstadoPedido.PREPARACION);
        }

        pedido.setTotal(total);
        pedidoRepository.save(pedido);

        return toResponse(pedido, detallesGuardados, requiereProduccion);
    }

    public PedidoResponse obtener(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdOrderByIdAsc(id);
        boolean requiereProduccion = detalles.stream().anyMatch(d -> d.getCantidadAtendida() < d.getCantidad());

        return toResponse(pedido, detalles, requiereProduccion);
    }

    public List<PedidoResponse> listar() {
        return pedidoRepository.findAll().stream().map(pedido -> {
            List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdOrderByIdAsc(pedido.getId());
            boolean requiereProduccion = detalles.stream().anyMatch(d -> d.getCantidadAtendida() < d.getCantidad());
            return toResponse(pedido, detalles, requiereProduccion);
        }).toList();
    }

    public List<PedidoResponse> listarDeliveryActivos() {
        List<Pedido> activos = pedidoRepository.findActivosByTipoOrigen(TipoOrigenPedido.DELIVERY);
        List<Pedido> entregadosHoy = pedidoRepository.findByTipoOrigenAndEstadoAndCreatedAtAfter(
                TipoOrigenPedido.DELIVERY, EstadoPedido.ENTREGADO,
                LocalDateTime.now().toLocalDate().atStartOfDay());
        List<Pedido> todos = new ArrayList<>(activos);
        todos.addAll(entregadosHoy);
        return todos.stream().map(pedido -> {
            List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdOrderByIdAsc(pedido.getId());
            return toResponse(pedido, detalles, false);
        }).toList();
    }

    private Usuario getUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));
    }

    private Usuario getUsuarioAutenticadoOpcional() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return usuarioRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private PedidoResponse toResponse(Pedido pedido, List<DetallePedido> detalles, boolean requiereProduccion) {
        return PedidoResponse.builder()
                .id(pedido.getId())
                .clienteId(pedido.getCliente() != null ? pedido.getCliente().getId() : null)
                .clienteNombre(pedido.getCliente() != null ? pedido.getCliente().getNombre() : null)
                .usuarioId(pedido.getUsuario() != null ? pedido.getUsuario().getId() : null)
                .usuarioNombre(pedido.getUsuario() != null ? pedido.getUsuario().getNombre() : "Web")
                .total(pedido.getTotal())
                .estado(pedido.getEstado().name())
                .tipoOrigen(pedido.getTipoOrigen().name())
                .observacion(pedido.getObservacion())
                .produccionRequerida(requiereProduccion)
                .createdAt(pedido.getCreatedAt())
                .detalles(detalles.stream().map(this::toDetalleResponse).toList())
                .build();
    }

    private PedidoDetalleResponse toDetalleResponse(DetallePedido detalle) {
        int pendiente = detalle.getCantidad() - detalle.getCantidadAtendida();

        return PedidoDetalleResponse.builder()
                .id(detalle.getId())
                .productoId(detalle.getProducto().getId())
                .productoNombre(detalle.getProducto().getNombre())
                .cantidad(detalle.getCantidad())
                .cantidadAtendida(detalle.getCantidadAtendida())
                .cantidadPendiente(pendiente)
                .precioUnitario(detalle.getPrecioUnitario())
                .subtotal(detalle.getSubtotal())
                .estado(detalle.getEstado().name())
                .build();
    }
    public PedidoResponse cambiarEstado(Long id, PedidoEstadoUpdateRequest request) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        pedido.setEstado(request.getEstado());
        pedidoRepository.save(pedido);

        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdOrderByIdAsc(id);
        boolean requiereProduccion = detalles.stream().anyMatch(d -> d.getCantidadAtendida() < d.getCantidad());

        return toResponse(pedido, detalles, requiereProduccion);
    }
    public PedidoResponse cancelarPedido(Long id) {
        Pedido pedido = pedidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Pedido no encontrado"));

        if (pedido.getEstado() == EstadoPedido.CANCELADO) {
            throw new BusinessException("El pedido ya está cancelado");
        }

        if (pedido.getEstado() == EstadoPedido.ENTREGADO) {
            throw new BusinessException("No se puede cancelar un pedido entregado");
        }

        Usuario usuario = getUsuarioAutenticado();
        List<DetallePedido> detalles = detallePedidoRepository.findByPedidoIdOrderByIdAsc(id);

        for (DetallePedido detalle : detalles) {
            int cantidadDevuelta = detalle.getCantidadAtendida();

            if (cantidadDevuelta > 0) {
                Producto producto = detalle.getProducto();
                int stockAnterior = producto.getStock();
                int stockNuevo = stockAnterior + cantidadDevuelta;

                producto.setStock(stockNuevo);
                productoRepository.save(producto);

                movimientoProductoService.registrarCancelacion(
                        producto,
                        cantidadDevuelta,
                        stockAnterior,
                        stockNuevo,
                        pedido.getId(),
                        usuario
                );
            }

            detalle.setCantidadAtendida(0);
            detalle.setEstado(EstadoDetallePedido.CANCELADO);
            detallePedidoRepository.save(detalle);
        }

        pedido.setEstado(EstadoPedido.CANCELADO);
        pedidoRepository.save(pedido);

        return toResponse(pedido, detalles, false);
    }
}