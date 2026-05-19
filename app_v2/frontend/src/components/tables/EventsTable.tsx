import type { EventResponse } from "../../types/api"

import SectionCard from "../layout/SectionCard"
import StatusBadge from "../ui/StatusBadge"

interface Props {
    events: EventResponse[]
}

export default function EventsTable({ events }: Props) {
    return (
        <SectionCard title="Eventos cronológicos">
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    backgroundColor: "#1f2937",
                }}
            >
                <thead>
                    <tr>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>
                            Tiempo (s)
                        </th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>
                            Tipo de evento
                        </th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>
                            Componente objetivo
                        </th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>
                            Estado global antes
                        </th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>
                            Estado global después
                        </th>
                        <th style={{ textAlign: "left", padding: "0.5rem" }}>
                            Descripción
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {events.map((event, index) => (
                        <tr key={`${event.tiempo_s}-${event.objetivo_id}-${index}`}>
                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {event.tiempo_s}
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {event.tipo_evento}
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {event.objetivo_id}
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                <StatusBadge status={event.estado_global_antes} />
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                <StatusBadge status={event.estado_global_despues} />
                            </td>

                            <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                {event.descripcion}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SectionCard>
    )
}