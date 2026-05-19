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
        <section style={{ marginBottom: "2rem" }}>
            <h2>Escenario</h2>

            <select
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
                onClick={onRunSimulation}
                disabled={runningSimulation}
                style={{ marginLeft: "1rem" }}
            >
                {runningSimulation ? "Ejecutando..." : "Ejecutar simulación"}
            </button>
        </section>
    )
}