import type { SimulationResultResponse } from "../../types/api"

import SectionCard from "../layout/SectionCard"
import StatusBadge from "../ui/StatusBadge"

interface Props {
    resultA: SimulationResultResponse
    resultB: SimulationResultResponse
}

function findFirstDegradation(result: SimulationResultResponse) {
    return result.events.find(
        (event) => event.estado_global_despues === "degradado"
    )
}

function findFirstFailure(result: SimulationResultResponse) {
    return result.events.find(
        (event) => event.estado_global_despues === "fallado"
    )
}

function isReserveRelatedText(text: string) {
    const normalized = text.toLowerCase()

    return (
        normalized.includes("reserva") ||
        normalized.includes("generador") ||
        normalized.includes("gen_") ||
        normalized.includes("ups") ||
        normalized.includes("_b") ||
        normalized.includes("bloque 7") ||
        normalized.includes("m1_7") ||
        normalized.includes("m2_7") ||
        normalized.includes("m3_7") ||
        normalized.includes("m4_7")
    )
}

function findFirstReserveEvent(result: SimulationResultResponse) {
    return result.events.find((event) =>
        isReserveRelatedText(
            `${event.tipo_evento} ${event.objetivo_id} ${event.descripcion}`
        )
    )
}

export default function EventsComparison({
    resultA,
    resultB,
}: Props) {
    const rows = [
        {
            label: "Primer evento",
            a: resultA.events[0],
            b: resultB.events[0],
        },
        {
            label: "Primera degradación",
            a: findFirstDegradation(resultA),
            b: findFirstDegradation(resultB),
        },
        {
            label: "Primer fallo global",
            a: findFirstFailure(resultA),
            b: findFirstFailure(resultB),
        },
        {
            label: "Primer uso de reserva",
            a: findFirstReserveEvent(resultA),
            b: findFirstReserveEvent(resultB),
        },
    ]

    return (
        <SectionCard title="Eventos comparados">
            <table className="table-container">
                <thead>
                    <tr>
                        <th className="table-header">Evento</th>
                        <th className="table-header">Escenario A</th>
                        <th className="table-header">Escenario B</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row) => (
                        <tr key={row.label}>
                            <td className="table-cell">{row.label}</td>

                            <td className="table-cell">
                                {row.a ? (
                                    <>
                                        <strong>t={row.a.tiempo_s}s</strong>
                                        <br />
                                        {row.a.descripcion}
                                        <br />
                                        <StatusBadge
                                            status={
                                                row.a.estado_global_despues
                                            }
                                        />
                                    </>
                                ) : (
                                    "No detectado"
                                )}
                            </td>

                            <td className="table-cell">
                                {row.b ? (
                                    <>
                                        <strong>t={row.b.tiempo_s}s</strong>
                                        <br />
                                        {row.b.descripcion}
                                        <br />
                                        <StatusBadge
                                            status={
                                                row.b.estado_global_despues
                                            }
                                        />
                                    </>
                                ) : (
                                    "No detectado"
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SectionCard>
    )
}