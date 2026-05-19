import type { ScenarioResponse } from "../../types/api"

interface Props {
    scenarios: ScenarioResponse[]
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
    return (
        <section className="form-panel">
            <h2>Escenario</h2>

            <div className="form-control">
                <select
                    className="form-select"
                    value={selectedScenarioId}
                    onChange={(event) => onScenarioChange(event.target.value)}
                >
                    {scenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                            {scenario.name}
                        </option>
                    ))}
                </select>

                <button
                    className="button"
                    onClick={onRunSimulation}
                    disabled={runningSimulation}
                >
                    {runningSimulation ? "Ejecutando..." : "Ejecutar simulación"}
                </button>
            </div>
        </section>
    )
}