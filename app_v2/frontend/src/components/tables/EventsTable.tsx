import type { EventResponse } from "../../types/api"

interface Props {
    events: EventResponse[]
}

export default function EventsTable({ events }: Props) {
    return (
        <section style={{ marginTop: "2rem" }}>
            <h2>Eventos cronológicos</h2>

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
                            Tipo
                        </th>

                        <th style={{ textAlign: "left", padding: "0.5rem" }}>
                            Objetivo
                        </th>

                        <th style={{ textAlign: "left", padding: "0.5rem" }}>
                            Estado
                        </th>

                        <th style={{ textAlign: "left", padding: "0.5rem" }}>
                            Descripción
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {events.map((event, index) => (
                        <tr
                            key={`${event.tiempo_s}-${event.objetivo_id}-${index}`}
                        >
                            <td
                                style={{
                                    padding: "0.5rem",
                                    borderTop: "1px solid #374151",
                                }}
                            >
                                {event.tiempo_s}
                            </td>

                            <td
                                style={{
                                    padding: "0.5rem",
                                    borderTop: "1px solid #374151",
                                }}
                            >
                                {event.tipo_evento}
                            </td>

                            <td
                                style={{
                                    padding: "0.5rem",
                                    borderTop: "1px solid #374151",
                                }}
                            >
                                {event.objetivo_id}
                            </td>

                            <td
                                style={{
                                    padding: "0.5rem",
                                    borderTop: "1px solid #374151",
                                }}
                            >
                                {event.estado_global_antes} →{" "}
                                {event.estado_global_despues}
                            </td>

                            <td
                                style={{
                                    padding: "0.5rem",
                                    borderTop: "1px solid #374151",
                                }}
                            >
                                {event.descripcion}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    )
}