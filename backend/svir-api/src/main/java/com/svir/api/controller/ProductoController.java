package com.svir.api.controller;

import com.svir.api.dto.producto.*;
import com.svir.api.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public List<ProductoResponse> listar() {
        return productoService.listar();
    }

    @GetMapping("/{id}")
    public ProductoResponse obtener(@PathVariable Long id) {
        return productoService.obtener(id);
    }

    @PostMapping
    public ProductoResponse crear(@Valid @RequestBody ProductoRequest request) {
        return productoService.crear(request);
    }

    @PutMapping("/{id}")
    public ProductoResponse actualizar(@PathVariable Long id,
                                       @Valid @RequestBody ProductoRequest request) {
        return productoService.actualizar(id, request);
    }

    @PatchMapping("/{id}/activo")
    public void cambiarActivo(@PathVariable Long id,
                              @RequestParam Boolean activo) {
        productoService.cambiarActivo(id, activo);
    }

    @PostMapping("/{id}/imagen")
    public ProductoResponse subirImagen(@PathVariable Long id,
                                        @RequestParam("file") MultipartFile file) throws Exception {
        return productoService.subirImagen(id, file);
    }
}