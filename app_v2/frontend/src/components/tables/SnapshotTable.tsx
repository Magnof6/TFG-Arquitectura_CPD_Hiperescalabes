import type { SnapshotResponse } from "../../types/api"

import SectionCard from "../layout/SectionCard"
import StatusBadge from "../ui/StatusBadge"

interface Props {
    snapshots: SnapshotResponse[]
}

export default function SnapshotsTable({ snapshots }: Props) {
    return (
        <SectionCard title="Snapshots">
            <table className="table-container">
                <thead>
                    <tr>
                        <th className="table-header">Tiempo</th>
                        <th className="table-header">Estado global</th>
                        <th className="table-header">Carga servida</th>
                        <th className="table-header">Carga perdida</th>
                        <th className="table-header">Componentes fallados</th>
                        <th className="table-header">Reservas activas</th>
                        <th className="table-header">Salas degradadas</th>
                        <th className="table-header">Salas sin servicio</th>
                    </tr>
                </thead>

                <tbody>
                    {snapshots.map((snapshot, index) => (
                        <tr key={index}>
                            <td className="table-cell">{snapshot.tiempo_s} s</td>
                            <td className="table-cell">
                                <StatusBadge status={snapshot.estado_global} />
                            </td>
                            <td className="table-cell">{snapshot.carga_servida_kw} kW</td>
                            <td className="table-cell">{snapshot.carga_perdida_kw} kW</td>
                            <td className="table-cell">
                                {snapshot.num_componentes_fallados}
                            </td>
                            <td className="table-cell">
                                {snapshot.num_componentes_reserva_en_uso}
                            </td>
                            <td className="table-cell">{snapshot.num_salas_degradadas}</td>
                            <td className="table-cell">{snapshot.num_salas_sin_servicio}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SectionCard>
    )
}