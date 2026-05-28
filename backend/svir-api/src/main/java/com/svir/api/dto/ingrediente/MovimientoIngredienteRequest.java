package com.svir.api.dto.ingrediente;

import com.svir.api.enums.MotivoMovimientoIngrediente;
import com.svir.api.enums.TipoMovimiento;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MovimientoIngredienteRequest {

    @NotNull
    private TipoMovimiento tipo;

    @NotNull
    private MotivoMovimientoIngrediente motivo;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal cantidad;

    private String referenciaTipo;
    private Long referenciaId;
}