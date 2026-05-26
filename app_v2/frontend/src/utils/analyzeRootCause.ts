import type { SimulationResultResponse } from "../types/api";
import type { RootCauseAnalysis } from "../features/analysis/types";

export function analyzeRootCause(
    result: SimulationResultResponse
): RootCauseAnalysis {
    const firstDegradationEvent = result.events.find(
        (event) => event.estado_global_despues === "degradado"
    );

    const firstLoadLossSnapshot = result.snapshots.find(
        (snapshot) => snapshot.carga_perdida_kw > 0
    );

    return {
        firstDegradationEvent,
        firstLoadLossSnapshot: firstLoadLossSnapshot?.tiempo_s,

        summary: firstLoadLossSnapshot
            ? `La primera pérdida de carga aparece en t=${firstLoadLossSnapshot.tiempo_s}s.`
            : "No se detectó pérdida de carga en la simulación.",
    };
}