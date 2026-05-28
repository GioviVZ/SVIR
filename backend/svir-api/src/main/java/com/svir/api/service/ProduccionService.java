package com.svir.api.service;

import com.svir.api.dto.produccion.*;
import com.svir.api.entity.*;
import com.svir.api.enums.EstadoDetallePedido;
import com.svir.api.enums.EstadoPedido;
import com.svir.api.enums.EstadoProduccion;
import com.svir.api.enums.TipoProduccion;
import com.svir.api.repository.*;
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
public class ProduccionService {

    private final ProduccionRepository produccionRepository;
    private final ProduccionDetalleRepository produccionDetalleRepository;
    private final PedidoRepository pedidoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final ProductoRepository productoRepository;
    private final RecetaRepository recetaRepository;
    private final IngredienteService ingredienteService;
    private final UsuarioRepository usuarioRepository;
    private final MovimientoProductoService movimientoProductoService;

    @Transactional
    public ProduccionResponse crearProduccionPorPedido(Long pedidoId, String observacion) {
        Usuario usuario = getUsuarioAutenticado();

        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        List<DetallePedido> detallesPedido = detallePedidoRepository.findByPedidoIdOrderByIdAsc(pedidoId);

        List<DetallePedido> faltantes = detallesPedido.stream()
                .filter(d -> d.getCantidadAtendida() < d.getCantidad())
                .toList();

        if (faltantes.isEmpty()) {
            throw new RuntimeException("El pedido no tiene faltantes para producción");
        }

        Produccion produccion = Produccion.builder()
                .tipo(TipoProduccion.PEDIDO)
                .pedido(pedido)
                .usuario(usuario)
                .estado(EstadoProduccion.EN_PROCESO)
                .observacion(observacion)
                .fechaInicio(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        produccion = produccionRepository.save(produccion);

        List<ProduccionDetalle> detallesProduccion = new ArrayList<>();

        for (DetallePedido detallePedido : faltantes) {
            Producto producto = detallePedido.getProducto();
            int faltante = detallePedido.getCantidad() - detallePedido.getCantidadAtendida();

            List<Receta> recetaItems = recetaRepository.findByProductoIdOrderByIdAsc(producto.getId());
            if (recetaItems.isEmpty()) {
                throw new RuntimeException("El producto no tiene receta configurada: " + producto.getNombre());
            }

            for (Receta receta : recetaItems) {
                BigDecimal cantidadConsumir = receta.getCantidad()
                        .multiply(BigDecimal.valueOf(faltante));

                ingredienteService.consumirPorProduccion(
                        receta.getIngrediente(),
                        cantidadConsumir,
                        "PRODUCCION",
                        produccion.getId(),
                        usuario
                );
            }

            ProduccionDetalle produccionDetalle = ProduccionDetalle.builder()
                    .produccion(produccion)
                    .producto(producto)
                    .cantidadPlanificada(faltante)
                    .cantidadProducida(0)
                    .createdAt(LocalDateTime.now())
                    .build();

            detallesProduccion.add(produccionDetalleRepository.save(produccionDetalle));
        }

        return toResponse(produccion, detallesProduccion);
    }

    @Transactional
    public ProduccionResponse crearProduccionStock(ProduccionCreateRequest request) {
        Usuario usuario = getUsuarioAutenticado();

        Produccion produccion = Produccion.builder()
                .tipo(TipoProduccion.STOCK)
                .pedido(null)
                .usuario(usuario)
                .estado(EstadoProduccion.EN_PROCESO)
                .observacion(request.getObservacion())
                .fechaInicio(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        produccion = produccionRepository.save(produccion);

        List<ProduccionDetalle> detallesGuardados = new ArrayList<>();

        for (ProduccionDetalleRequest item : request.getDetalles()) {
            Producto producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

            List<Receta> recetaItems = recetaRepository.findByProductoIdOrderByIdAsc(producto.getId());
            if (recetaItems.isEmpty()) {
                throw new RuntimeException("El producto no tiene receta configurada: " + producto.getNombre());
            }

            for (Receta receta : recetaItems) {
                BigDecimal cantidadConsumir = receta.getCantidad()
                        .multiply(BigDecimal.valueOf(item.getCantidadPlanificada()));

                ingredienteService.consumirPorProduccion(
                        receta.getIngrediente(),
                        cantidadConsumir,
                        "PRODUCCION",
                        produccion.getId(),
                        usuario
                );
            }

            ProduccionDetalle detalle = ProduccionDetalle.builder()
                    .produccion(produccion)
                    .producto(producto)
                    .cantidadPlanificada(item.getCantidadPlanificada())
                    .cantidadProducida(0)
                    .createdAt(LocalDateTime.now())
                    .build();

            detallesGuardados.add(produccionDetalleRepository.save(detalle));
        }

        return toResponse(produccion, detallesGuardados);
    }

    @Transactional
    public ProduccionResponse terminarProduccion(Long produccionId, ProduccionTerminarRequest request) {
        Usuario usuario = getUsuarioAutenticado();

        Produccion produccion = produccionRepository.findById(produccionId)
                .orElseThrow(() -> new RuntimeException("Producción no encontrada"));

        if (produccion.getEstado() == EstadoProduccion.TERMINADO) {
            throw new RuntimeException("La producción ya fue terminada");
        }

        List<ProduccionDetalle> detalles = produccionDetalleRepository.findByProduccionIdOrderByIdAsc(produccionId);

        for (ProduccionDetalle detalle : detalles) {
            ProduccionTerminarDetalleRequest reqDetalle = request.getDetalles().stream()
                    .filter(d -> d.getProduccionDetalleId().equals(detalle.getId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Falta cantidad producida para el detalle " + detalle.getId()));

            detalle.setCantidadProducida(reqDetalle.getCantidadProducida());
            produccionDetalleRepository.save(detalle);

            if (reqDetalle.getCantidadProducida() > 0) {
                Producto producto = detalle.getProducto();
                int stockAnterior = producto.getStock();
                int stockNuevo = stockAnterior + reqDetalle.getCantidadProducida();

                producto.setStock(stockNuevo);
                productoRepository.save(producto);

                movimientoProductoService.registrarProduccion(
                        producto,
                        reqDetalle.getCantidadProducida(),
                        stockAnterior,
                        stockNuevo,
                        produccion.getId(),
                        usuario
                );
            }
        }

        produccion.setEstado(EstadoProduccion.TERMINADO);
        produccion.setFechaFin(LocalDateTime.now());
        produccionRepository.save(produccion);

        if (produccion.getTipo() == TipoProduccion.PEDIDO && produccion.getPedido() != null) {
            actualizarPedidoDespuesDeProduccion(produccion.getPedido().getId(), detalles);
        }

        List<ProduccionDetalle> detallesActualizados = produccionDetalleRepository.findByProduccionIdOrderByIdAsc(produccionId);
        return toResponse(produccion, detallesActualizados);
    }

    public ProduccionResponse obtener(Long id) {
        Produccion produccion = produccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producción no encontrada"));

        List<ProduccionDetalle> detalles = produccionDetalleRepository.findByProduccionIdOrderByIdAsc(id);
        return toResponse(produccion, detalles);
    }

    public List<ProduccionResponse> listar() {
        return produccionRepository.findAll().stream()
                .map(p -> toResponse(p, produccionDetalleRepository.findByProduccionIdOrderByIdAsc(p.getId())))
                .toList();
    }

    @Transactional
    public ProduccionResponse crearProduccionDesdeVenta(Long pedidoId) {
        Usuario usuario = getUsuarioAutenticado();

        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        List<DetallePedido> faltantes = detallePedidoRepository.findByPedidoIdOrderByIdAsc(pedidoId)
                .stream()
                .filter(d -> d.getCantidadAtendida() < d.getCantidad())
                .toList();

        if (faltantes.isEmpty()) return null;

        Produccion produccion = Produccion.builder()
                .tipo(TipoProduccion.PEDIDO)
                .pedido(pedido)
                .usuario(usuario)
                .estado(EstadoProduccion.EN_PROCESO)
                .observacion("Generado automáticamente desde venta")
                .fechaInicio(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();

        produccion = produccionRepository.save(produccion);

        List<ProduccionDetalle> detalles = new ArrayList<>();

        for (DetallePedido detallePedido : faltantes) {
            Producto producto = detallePedido.getProducto();
            int faltante = detallePedido.getCantidad() - detallePedido.getCantidadAtendida();

            // Descontar ingredientes si el producto tiene receta configurada
            List<Receta> recetaItems = recetaRepository.findByProductoIdOrderByIdAsc(producto.getId());
            for (Receta receta : recetaItems) {
                BigDecimal cantidadConsumir = receta.getCantidad()
                        .multiply(BigDecimal.valueOf(faltante));

                ingredienteService.consumirSiHayStock(
                        receta.getIngrediente(),
                        cantidadConsumir,
                        "PRODUCCION",
                        produccion.getId(),
                        usuario
                );
            }

            // Siempre crear el detalle de producción, con o sin receta
            ProduccionDetalle detalle = ProduccionDetalle.builder()
                    .produccion(produccion)
                    .producto(producto)
                    .cantidadPlanificada(faltante)
                    .cantidadProducida(0)
                    .createdAt(LocalDateTime.now())
                    .build();

            detalles.add(produccionDetalleRepository.save(detalle));
        }

        return toResponse(produccion, detalles);
    }

    @Transactional
    public ProduccionResponse cancelarProduccion(Long id) {
        Produccion produccion = produccionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producción no encontrada"));

        if (produccion.getEstado() == EstadoProduccion.TERMINADO) {
            throw new RuntimeException("No se puede cancelar una producción ya terminada");
        }
        if (produccion.getEstado() == EstadoProduccion.CANCELADO) {
            throw new RuntimeException("La producción ya está cancelada");
        }

        Usuario usuario = getUsuarioAutenticado();
        List<ProduccionDetalle> detalles = produccionDetalleRepository.findByProduccionIdOrderByIdAsc(id);

        for (ProduccionDetalle detalle : detalles) {
            List<Receta> recetaItems = recetaRepository.findByProductoIdOrderByIdAsc(detalle.getProducto().getId());
            for (Receta receta : recetaItems) {
                BigDecimal cantidadRestaurar = receta.getCantidad()
                        .multiply(BigDecimal.valueOf(detalle.getCantidadPlanificada()));

                ingredienteService.restaurarPorCancelacion(
                        receta.getIngrediente(),
                        cantidadRestaurar,
                        produccion.getId(),
                        usuario
                );
            }
        }

        produccion.setEstado(EstadoProduccion.CANCELADO);
        produccion.setFechaFin(LocalDateTime.now());
        produccionRepository.save(produccion);

        return toResponse(produccion, detalles);
    }

    private void actualizarPedidoDespuesDeProduccion(Long pedidoId, List<ProduccionDetalle> detallesProduccion) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));

        List<DetallePedido> detallesPedido = detallePedidoRepository.findByPedidoIdOrderByIdAsc(pedidoId);

        for (DetallePedido detallePedido : detallesPedido) {
            for (ProduccionDetalle detalleProduccion : detallesProduccion) {
                if (detallePedido.getProducto().getId().equals(detalleProduccion.getProducto().getId())) {
                    int nuevaCantidadAtendida = detallePedido.getCantidadAtendida() + detalleProduccion.getCantidadProducida();

                    if (nuevaCantidadAtendida > detallePedido.getCantidad()) {
                        nuevaCantidadAtendida = detallePedido.getCantidad();
                    }

                    detallePedido.setCantidadAtendida(nuevaCantidadAtendida);

                    if (nuevaCantidadAtendida == 0) {
                        detallePedido.setEstado(EstadoDetallePedido.PENDIENTE);
                    } else if (nuevaCantidadAtendida < detallePedido.getCantidad()) {
                        detallePedido.setEstado(EstadoDetallePedido.PARCIAL);
                    } else {
                        detallePedido.setEstado(EstadoDetallePedido.ATENDIDO);
                    }

                    detallePedidoRepository.save(detallePedido);
                }
            }
        }

        boolean todosAtendidos = detallePedidoRepository.findByPedidoIdOrderByIdAsc(pedidoId)
                .stream()
                .allMatch(d -> d.getCantidadAtendida() >= d.getCantidad());

        pedido.setEstado(todosAtendidos ? EstadoPedido.LISTO : EstadoPedido.PREPARACION);
        pedidoRepository.save(pedido);
    }

    private Usuario getUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario autenticado no encontrado"));
    }

    private ProduccionResponse toResponse(Produccion produccion, List<ProduccionDetalle> detalles) {
        return ProduccionResponse.builder()
                .id(produccion.getId())
                .tipo(produccion.getTipo().name())
                .pedidoId(produccion.getPedido() != null ? produccion.getPedido().getId() : null)
                .estado(produccion.getEstado().name())
                .observacion(produccion.getObservacion())
                .usuarioNombre(produccion.getUsuario().getNombre())
                .detalles(detalles.stream().map(this::toDetalleResponse).toList())
                .build();
    }

    private ProduccionDetalleResponse toDetalleResponse(ProduccionDetalle detalle) {
        return ProduccionDetalleResponse.builder()
                .id(detalle.getId())
                .productoId(detalle.getProducto().getId())
                .productoNombre(detalle.getProducto().getNombre())
                .cantidadPlanificada(detalle.getCantidadPlanificada())
                .cantidadProducida(detalle.getCantidadProducida())
                .build();
    }
}