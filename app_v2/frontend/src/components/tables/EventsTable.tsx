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
        return Array.from(new Set(events.map((event) => event.tipo_evento))).sort()
    }, [events])

    const finalStates = useMemo(() => {
        return Array.from(
            new Set(events.map((event) => event.estado_global_despues))
        ).sort()
    }, [events])

    const filteredEvents = useMemo(() => {
        return events.filter((event) => {
            const matchesType =
                selectedEventType === "all" || event.tipo_evento === selectedEventType

            const matchesFinalState =
                selectedFinalState === "all" ||
                event.estado_global_despues === selectedFinalState

            return matchesType && matchesFinalState
        })
    }, [events, selectedEventType, selectedFinalState])

    return (
        <SectionCard title="Eventos cronológicos">
            <div className="filters-container">
                <label>
                    Tipo de evento:{" "}
                    <select
                        className="form-select"
                        value={selectedEventType}
                        onChange={(event) => setSelectedEventType(event.target.value)}
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
                        className="form-select"
                        value={selectedFinalState}
                        onChange={(event) => setSelectedFinalState(event.target.value)}
                    >
                        <option value="all">Todos</option>

                        {finalStates.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                </label>

                <span className="filters-counter">
                    Mostrando {filteredEvents.length} de {events.length} eventos
                </span>
            </div>

            <table className="table-container">
                <thead>
                    <tr>
                        <th className="table-header">Tiempo (s)</th>
                        <th className="table-header">Tipo de evento</th>
                        <th className="table-header">Componente objetivo</th>
                        <th className="table-header">Estado global antes</th>
                        <th className="table-header">Estado global después</th>
                        <th className="table-header">Descripción</th>
                    </tr>
                </thead>

                <tbody>
                    {filteredEvents.map((event, index) => (
                        <tr key={`${event.tiempo_s}-${event.objetivo_id}-${index}`}>
                            <td className="table-cell">{event.tiempo_s}</td>
                            <td className="table-cell">{event.tipo_evento}</td>
                            <td className="table-cell">{event.objetivo_id}</td>
                            <td className="table-cell">
                                <StatusBadge status={event.estado_global_antes} />
                            </td>
                            <td className="table-cell">
                                <StatusBadge status={event.estado_global_despues} />
                            </td>
                            <td className="table-cell">{event.descripcion}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SectionCard>
    )
}