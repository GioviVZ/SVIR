package com.svir.api.service;

import com.svir.api.dto.receta.RecetaItemRequest;
import com.svir.api.dto.receta.RecetaItemResponse;
import com.svir.api.dto.receta.RecetaResponse;
import com.svir.api.dto.receta.RecetaUpdateRequest;
import com.svir.api.entity.Ingrediente;
import com.svir.api.entity.Producto;
import com.svir.api.entity.Receta;
import com.svir.api.repository.IngredienteRepository;
import com.svir.api.repository.ProductoRepository;
import com.svir.api.repository.RecetaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RecetaService {

    private final RecetaRepository recetaRepository;
    private final ProductoRepository productoRepository;
    private final IngredienteRepository ingredienteRepository;

    public RecetaResponse obtenerPorProducto(Long productoId) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        List<Receta> recetas = recetaRepository.findByProductoIdOrderByIdAsc(productoId);

        return RecetaResponse.builder()
                .productoId(producto.getId())
                .productoNombre(producto.getNombre())
                .items(recetas.stream().map(this::toItemResponse).toList())
                .build();
    }

    @Transactional
    public RecetaResponse reemplazarReceta(Long productoId, RecetaUpdateRequest request) {
        Producto producto = productoRepository.findById(productoId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        validarItemsDuplicados(request.getItems());

        recetaRepository.deleteByProductoId(productoId);
        recetaRepository.flush();

        LocalDateTime now = LocalDateTime.now();

        for (RecetaItemRequest item : request.getItems()) {
            Ingrediente ingrediente = ingredienteRepository.findById(item.getIngredienteId())
                    .orElseThrow(() -> new RuntimeException("Ingrediente no encontrado con id: " + item.getIngredienteId()));

            Receta receta = Receta.builder()
                    .producto(producto)
                    .ingrediente(ingrediente)
                    .cantidad(item.getCantidad())
                    .createdAt(now)
                    .updatedAt(now)
                    .build();

            recetaRepository.save(receta);
        }

        return obtenerPorProducto(productoId);
    }

    public boolean productoTieneReceta(Long productoId) {
        return recetaRepository.existsByProductoId(productoId);
    }

    private void validarItemsDuplicados(List<RecetaItemRequest> items) {
        Set<Long> ingredienteIds = new HashSet<>();

        for (RecetaItemRequest item : items) {
            if (!ingredienteIds.add(item.getIngredienteId())) {
                throw new RuntimeException("La receta no puede repetir ingredientes");
            }
        }
    }

    private RecetaItemResponse toItemResponse(Receta receta) {
        return RecetaItemResponse.builder()
                .recetaId(receta.getId())
                .ingredienteId(receta.getIngrediente().getId())
                .ingredienteNombre(receta.getIngrediente().getNombre())
                .unidadMedida(receta.getIngrediente().getUnidadMedida())
                .cantidad(receta.getCantidad())
                .build();
    }
}