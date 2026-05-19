import { useMemo, useState } from "react"

import type { EventResponse } from "../../types/api"

import SectionCard from "../layout/SectionCard"
import StatusBadge from "../ui/StatusBadge"

interface Props {
    events: EventResponse[]
}

export default function EventsTable({ events }: Props) {
    const [selectedEventType, setSelectedEventType] = useState("all")
    const [selectedFinalState, setSelectedFinalState] = useState("all")

    const eventTypes = useMemo(() => {
        return Array.from(
            new Set(events.map((event) => event.tipo_evento))
        ).sort()
    }, [events])

    const finalStates = useMemo(() => {
        return Array.from(
            new Set(events.map((event) => event.estado_global_despues))
        ).sort()
    }, [events])

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const matchesType =
                selectedEventType === "all" ||
                event.tipo_evento === selectedEventType

            const matchesFinalState =
                selectedFinalState === "all" ||
                event.estado_global_despues === selectedFinalState

            return matchesType && matchesFinalState
        })
    }, [events, selectedEventType, selectedFinalState])

    return (
        <SectionCard title="Eventos cronológicos">
            <div
                style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "1rem",
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <label>
                    Tipo de evento:{" "}
                    <select
                        value={selectedEventType}
                        onChange={(event) =>
                            setSelectedEventType(event.target.value)
                        }
                    >
                        <option value="all">Todos</option>

                        {eventTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Estado global después:{" "}
                    <select
                        value={selectedFinalState}
                        onChange={(event) =>
                            setSelectedFinalState(event.target.value)
                        }
                    >
                        <option value="all">Todos</option>

                        {finalStates.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                </label>

                <span style={{ color: "#9ca3af" }}>
                    Mostrando {filteredEvents.length} de {events.length} eventos
                </span>
            </div>

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
                    {filteredEvents.map((event, index) => (
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
                                <StatusBadge status={event.estado_global_antes} />
                            </td>

                            <td
                                style={{
                                    padding: "0.5rem",
                                    borderTop: "1px solid #374151",
                                }}
                            >
                                <StatusBadge status={event.estado_global_despues} />
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
        </SectionCard>
    )
}