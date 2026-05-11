package com.svir.api.dto.ingrediente;

import com.svir.api.enums.MotivoMovimientoIngrediente;
import com.svir.api.enums.TipoMovimiento;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MovimientoIngredienteRequest {

    @NotNull
    private TipoMovimiento tipo;

    @NotNull
    private MotivoMovimientoIngrediente motivo;

    @NotNull
    @Min(1)
    private Integer cantidad;

    private String referenciaTipo;
    private Long referenciaId;
}