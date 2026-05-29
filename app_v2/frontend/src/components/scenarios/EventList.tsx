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

            <ul>
                {events.map((event, index) => (
                    <li
                        key={`${event.tipo}-${event.objetivo_id}-${index}`}
                    >
                        <strong>{event.tipo}</strong> ·{" "}
                        {event.objetivo_id} · t={event.tiempo_s}s ·{" "}
                        {event.descripcion}

                        <button
                            type="button"
                            onClick={() =>
                                onEditEvent(event, index)
                            }
                        >
                            Editar
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onDeleteEvent(index)
                            }
                        >
                            Eliminar
                        </button>
                    </li>
                ))}
            </ul>
        </>
    )
}