import EventList from "./EventList"

import type {
    CustomEventInput,
    CustomScenarioDraft,
} from "../../features/events/types"

interface Props {
    scenario: CustomScenarioDraft
    onAddEvent: () => void
    onEditEvent: (event: CustomEventInput, index: number) => void
    onDeleteEvent: (index: number) => void
}

export default function SelectedScenarioDetail({
    scenario,
    onAddEvent,
    onEditEvent,
    onDeleteEvent,
}: Props) {
    return (
        <section className="card">
            <h2>{scenario.name}</h2>

            <p>{scenario.description}</p>

            <button type="button" onClick={onAddEvent}>
                Añadir evento
            </button>

            <EventList
                events={scenario.events}
                onEditEvent={onEditEvent}
                onDeleteEvent={onDeleteEvent}
            />
        </section>
    )
}