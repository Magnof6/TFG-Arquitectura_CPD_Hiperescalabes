import type {
    SimulationResultResponse,
    SnapshotResponse,
} from "../../types/api"

import SectionCard from "../layout/SectionCard"
import StatusBadge from "../ui/StatusBadge"

interface Props {
    resultA: SimulationResultResponse
    resultB: SimulationResultResponse
}

function getComparableSnapshots(
    snapshotsA: SnapshotResponse[],
    snapshotsB: SnapshotResponse[]
) {
    const times = Array.from(
        new Set([
            ...snapshotsA.map((snapshot) => snapshot.tiempo_s),
            ...snapshotsB.map((snapshot) => snapshot.tiempo_s),
        ])
    ).sort((a, b) => a - b)

    return times.map((time) => ({
        time,
        a: snapshotsA.find((snapshot) => snapshot.tiempo_s === time),
        b: snapshotsB.find((snapshot) => snapshot.tiempo_s === time),
    }))
}

export default function SnapshotsComparison({
    resultA,
    resultB,
}: Props) {
    const rows = getComparableSnapshots(
        resultA.snapshots,
        resultB.snapshots
    )

    return (
        <SectionCard title="Snapshots comparados">
            <table className="table-container">
                <thead>
                    <tr>
                        <th className="table-header">Tiempo</th>
                        <th className="table-header">Estado A</th>
                        <th className="table-header">Estado B</th>
                        <th className="table-header">Carga servida A</th>
                        <th className="table-header">Carga servida B</th>
                        <th className="table-header">Carga perdida A</th>
                        <th className="table-header">Carga perdida B</th>
                        <th className="table-header">Fallados A</th>
                        <th className="table-header">Fallados B</th>
                        <th className="table-header">Reservas A</th>
                        <th className="table-header">Reservas B</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.map((row) => (
                        <tr key={row.time}>
                            <td className="table-cell">{row.time}s</td>

                            <td className="table-cell">
                                {row.a ? (
                                    <StatusBadge
                                        status={row.a.estado_global}
                                    />
                                ) : (
                                    "-"
                                )}
                            </td>

                            <td className="table-cell">
                                {row.b ? (
                                    <StatusBadge
                                        status={row.b.estado_global}
                                    />
                                ) : (
                                    "-"
                                )}
                            </td>

                            <td className="table-cell">
                                {row.a?.carga_servida_kw ?? "-"} kW
                            </td>

                            <td className="table-cell">
                                {row.b?.carga_servida_kw ?? "-"} kW
                            </td>

                            <td className="table-cell">
                                {row.a?.carga_perdida_kw ?? "-"} kW
                            </td>

                            <td className="table-cell">
                                {row.b?.carga_perdida_kw ?? "-"} kW
                            </td>

                            <td className="table-cell">
                                {row.a?.num_componentes_fallados ?? "-"}
                            </td>

                            <td className="table-cell">
                                {row.b?.num_componentes_fallados ?? "-"}
                            </td>

                            <td className="table-cell">
                                {row.a?.num_componentes_reserva_en_uso ?? "-"}
                            </td>

                            <td className="table-cell">
                                {row.b?.num_componentes_reserva_en_uso ?? "-"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SectionCard>
    )
}