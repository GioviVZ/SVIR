package com.svir.api.dto.pedido;

import com.svir.api.enums.TipoOrigenPedido;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class PedidoCreateRequest {

    private Long clienteId;

    @NotNull
    private TipoOrigenPedido tipoOrigen;

    private String observacion;

    @Valid
    @NotEmpty
    private List<PedidoDetalleRequest> detalles;
}