package com.svir.api.dto.pedido;

import com.svir.api.enums.EstadoPedido;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PedidoEstadoUpdateRequest {

    @NotNull
    private EstadoPedido estado;
}