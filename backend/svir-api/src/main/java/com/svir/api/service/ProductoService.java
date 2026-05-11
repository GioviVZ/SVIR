package com.svir.api.service;

import com.svir.api.dto.producto.*;
import com.svir.api.entity.Producto;
import com.svir.api.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public List<ProductoResponse> listar() {
        return productoRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductoResponse obtener(Long id) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        return toResponse(producto);
    }

    public ProductoResponse crear(ProductoRequest request) {
        Producto producto = Producto.builder()
                .nombre(request.getNombre())
                .descripcion(request.getDescripcion())
                .precio(request.getPrecio())
                .stock(request.getStock())
                .stockMinimo(request.getStockMinimo())
                .activo(request.getActivo() != null ? request.getActivo() : true)
                .imagenUrl(request.getImagenUrl())
                .build();
        return toResponse(productoRepository.save(producto));
    }

    public ProductoResponse actualizar(Long id, ProductoRequest request) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        producto.setNombre(request.getNombre());
        producto.setDescripcion(request.getDescripcion());
        producto.setPrecio(request.getPrecio());
        producto.setStock(request.getStock());
        producto.setStockMinimo(request.getStockMinimo());
        producto.setActivo(request.getActivo());
        if (request.getImagenUrl() != null) {
            producto.setImagenUrl(request.getImagenUrl());
        }
        return toResponse(productoRepository.save(producto));
    }

    public void cambiarActivo(Long id, Boolean activo) {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        producto.setActivo(activo);
        productoRepository.save(producto);
    }

    public ProductoResponse subirImagen(Long id, MultipartFile file) throws IOException {
        Producto producto = productoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        if (file.isEmpty()) throw new RuntimeException("El archivo está vacío");

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Solo se permiten archivos de imagen");
        }

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "imagen";
        String extension = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf("."))
                : ".jpg";
        String filename = "prod_" + id + "_" + UUID.randomUUID().toString().substring(0, 8) + extension;

        // Usar path absoluto basado en app.upload.dir
        Path productoDir = Paths.get(new File(uploadDir).getAbsolutePath(), "productos");
        Files.createDirectories(productoDir);
        file.transferTo(productoDir.resolve(filename).toFile());

        // Eliminar imagen anterior si existe y es un archivo local
        if (producto.getImagenUrl() != null && producto.getImagenUrl().startsWith("/uploads/")) {
            try {
                String oldFilename = producto.getImagenUrl().replace("/uploads/productos/", "");
                Files.deleteIfExists(productoDir.resolve(oldFilename));
            } catch (IOException ignored) {}
        }

        producto.setImagenUrl("/uploads/productos/" + filename);
        productoRepository.save(producto);

        return toResponse(producto);
    }

    private ProductoResponse toResponse(Producto p) {
        return ProductoResponse.builder()
                .id(p.getId())
                .nombre(p.getNombre())
                .descripcion(p.getDescripcion())
                .precio(p.getPrecio())
                .stock(p.getStock())
                .stockMinimo(p.getStockMinimo())
                .activo(p.getActivo())
                .imagenUrl(p.getImagenUrl())
                .build();
    }
}
