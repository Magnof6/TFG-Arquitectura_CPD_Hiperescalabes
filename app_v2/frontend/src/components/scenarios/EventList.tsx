import type { CustomEventInput } from "../../features/events/types"

interface Props {
    events: CustomEventInput[]
    onEditEvent: (
        event: CustomEventInput,
        index: number,
    ) => void
    onDeleteEvent: (index: number) => void
}

export default function EventList({
    events,
    onEditEvent,
    onDeleteEvent,
}: Props) {
    return (
        <>
            <h3>Eventos</h3>

            {events.length === 0 && (
                <p>Este escenario todavía no tiene eventos.</p>
            )}

            <ul className="event-list">
                {events.map((event, index) => (
                    <li
                        key={`${event.tipo}-${event.objetivo_id}-${index}`}
                        className="event-list-item"
                    >
                        <div>
                            <strong>{event.tipo}</strong> ·{" "}
                            {event.objetivo_id} · t={event.tiempo_s}s ·{" "}
                            {event.descripcion}
                        </div>

                        <div className="event-list-actions">
                            <button
                                type="button"
                                className="button button-secondary"
                                onClick={() => onEditEvent(event, index)}
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                className="button-danger"
                                onClick={() => onDeleteEvent(index)}
                            >
                                Eliminar
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </>
    )
}