import type { SimulationResultResponse } from "../types/api";
import type { ComparisonResult } from "../features/comparison/types";

export function compareSimulationResults(
    a: SimulationResultResponse,
    b: SimulationResultResponse
): ComparisonResult {
    return {
        scenarioA: a,
        scenarioB: b,
        differences: {
            loadLostDiff: b.kpis.carga_perdida_kw - a.kpis.carga_perdida_kw,
            servedPercentDiff:
                b.kpis.porcentaje_carga_servida - a.kpis.porcentaje_carga_servida,
            failedComponentsDiff:
                b.kpis.num_componentes_fallados - a.kpis.num_componentes_fallados,
            reservesUsedDiff:
                b.kpis.num_reservas_en_uso - a.kpis.num_reservas_en_uso,
        },
    };
}