export interface ScenarioOption {
    id: string
    name: string
    source: "default" | "custom"
    eventsCount?: number
}

interface Props {
    scenarios: ScenarioOption[]
    selectedScenarioId: string
    runningSimulation: boolean
    onScenarioChange: (scenarioId: string) => void
    onRunSimulation: () => void
}

export default function SimulationRunPanel({
    scenarios,
    selectedScenarioId,
    runningSimulation,
    onScenarioChange,
    onRunSimulation,
}: Props) {
    const defaultScenarios = scenarios.filter(
        (scenario) => scenario.source === "default"
    )

    const customScenarios = scenarios.filter(
        (scenario) => scenario.source === "custom"
    )

    return (
        <section className="form-panel">
            <h2>Escenario</h2>

            <div className="form-control">
                <select
                    className="form-select"
                    value={selectedScenarioId}
                    onChange={(event) => onScenarioChange(event.target.value)}
                >
                    <optgroup label="Escenarios default">
                        {defaultScenarios.map((scenario) => (
                            <option key={scenario.id} value={scenario.id}>
                                {scenario.name}
                            </option>
                        ))}
                    </optgroup>

                    <optgroup label="Escenarios custom">
                        {customScenarios.map((scenario) => (
                            <option key={scenario.id} value={scenario.id}>
                                {scenario.name}
                                {scenario.eventsCount !== undefined
                                    ? ` (${scenario.eventsCount} eventos)`
                                    : ""}
                            </option>
                        ))}
                    </optgroup>
                </select>

                <button
                    className="button"
                    onClick={onRunSimulation}
                    disabled={runningSimulation || !selectedScenarioId}
                >
                    {runningSimulation ? "Ejecutando..." : "Ejecutar simulación"}
                </button>
            </div>
        </section>
    )
}