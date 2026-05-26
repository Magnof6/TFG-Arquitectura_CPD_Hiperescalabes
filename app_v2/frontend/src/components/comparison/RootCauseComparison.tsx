import type { SimulationResultResponse } from "../../types/api"

import { analyzeRootCause } from "../../utils/analyzeRootCause"

import SectionCard from "../layout/SectionCard"

interface Props {
    resultA: SimulationResultResponse
    resultB: SimulationResultResponse
}

export default function RootCauseComparison({ resultA, resultB }: Props) {
    const rootCauseA = analyzeRootCause(resultA)
    const rootCauseB = analyzeRootCause(resultB)

    return (
        <SectionCard title="Causa raíz">
            <div className="kpi-grid">
                <div className="kpi-card">
                    <p className="kpi-card-title">Escenario A</p>

                    <p>{rootCauseA.summary}</p>

                    <p>
                        Primera degradación:{" "}
                        {rootCauseA.firstDegradationEvent?.descripcion ??
                            "No detectada"}
                    </p>
                </div>

                <div className="kpi-card">
                    <p className="kpi-card-title">Escenario B</p>

                    <p>{rootCauseB.summary}</p>

                    <p>
                        Primera degradación:{" "}
                        {rootCauseB.firstDegradationEvent?.descripcion ??
                            "No detectada"}
                    </p>
                </div>
            </div>
        </SectionCard>
    )
}