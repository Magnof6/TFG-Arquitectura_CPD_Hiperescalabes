import type { SnapshotResponse } from "../../types/api"

import SectionCard from "../layout/SectionCard"
import StatusBadge from "../ui/StatusBadge"

interface Props {
    snapshots: SnapshotResponse[]
}

export default function SnapshotsTable({ snapshots }: Props) {
    return (
        <SectionCard title="Snapshots">
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    backgroundColor: "#1f2937",
                }}
            >
                <thead>
                    <tr>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Tiempo</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Estado global</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Carga servida</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Carga perdida</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Componentes fallados</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Reservas activas</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Salas degradadas</th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>Salas sin servicio</th>
                    </tr>
                </thead>

                <tbody>
                    {snapshots.map((snapshot, index) => (
                        <tr key={index}>
                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {snapshot.tiempo_s} s
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                <StatusBadge status={snapshot.estado_global} />
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {snapshot.carga_servida_kw} kW
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {snapshot.carga_perdida_kw} kW
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {snapshot.num_componentes_fallados}
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {snapshot.num_componentes_reserva_en_uso}
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {snapshot.num_salas_degradadas}
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {snapshot.num_salas_sin_servicio}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SectionCard>
    )
}