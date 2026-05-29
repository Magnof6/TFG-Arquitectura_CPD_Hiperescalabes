interface ScenarioSummary {
    id: string
    name: string
    events: unknown[]
}

interface Props {
    scenarios: ScenarioSummary[]
    selectedScenarioId: string
    onSelectScenario: (scenarioId: string) => void
    onDeleteScenario: (scenarioId: string) => void
}

export default function CustomScenarioList({
    scenarios,
    selectedScenarioId,
    onSelectScenario,
    onDeleteScenario,
}: Props) {
    return (
        <section className="section-card">
            <h2>Escenarios custom</h2>

            {scenarios.length === 0 && (
                <p>No hay escenarios custom todavía.</p>
            )}

            {scenarios.map((scenario) => (
                <div
                    key={scenario.id}
                    style={{
                        display: "flex",
                        gap: "8px",
                        alignItems: "center",
                        marginBottom: "8px",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => onSelectScenario(scenario.id)}
                        className={
                            scenario.id === selectedScenarioId
                                ? "button scenario-list-button active"
                                : "button button-secondary scenario-list-button"
                        }
                    >
                        {scenario.name} ({scenario.events.length} eventos)
                    </button>

                    <button
                        type="button"
                        className="button-danger"
                        onClick={() => onDeleteScenario(scenario.id)}
                    >
                        Eliminar
                    </button>
                </div>
            ))}
        </section>
    )
}