import { useEffect, useMemo, useState } from "react"

import {
    getScenarios,
    runSimulation,
    runCustomSimulation,
} from "../../services/api/client"

import type {
    ScenarioResponse,
    SimulationResultResponse,
} from "../../types/api"

import SimulationRunPanel from "../../components/ui/SimulationRunPanel"
import type { ScenarioOption } from "../../components/ui/SimulationRunPanel"

import KpiPanel from "../../components/ui/KpiPanel"
import EventsTable from "../../components/tables/EventsTable"
import SnapshotsTable from "../../components/tables/SnapshotTable"
import ComponentsAccordion from "../../components/tables/ComponentsAccordion"
import ExportMenu from "../../components/ui/ExportMenu"
import TopologyGraph from "../../components/charts/TopologyGraph"

import type { CustomScenarioDraft } from "../../features/events/types"

export default function ScenariosPage() {
    const [scenarios, setScenarios] = useState<ScenarioResponse[]>([])
    const [customScenarios, setCustomScenarios] = useState<CustomScenarioDraft[]>([])
    const [selectedScenarioId, setSelectedScenarioId] = useState("")
    const [simulationResult, setSimulationResult] =
        useState<SimulationResultResponse | null>(null)

    const [selectedSnapshotIndex, setSelectedSnapshotIndex] =
        useState<number | null>(null)

    const [loadingScenarios, setLoadingScenarios] = useState(true)
    const [runningSimulation, setRunningSimulation] = useState(false)

    useEffect(() => {
        loadScenarios()

        const stored = localStorage.getItem("customScenarios")

        if (stored) {
            try {
                setCustomScenarios(JSON.parse(stored))
            } catch {
                console.error("Error cargando escenarios custom")
            }
        }
    }, [])

    const scenarioOptions = useMemo<ScenarioOption[]>(() => {
        return [
            ...scenarios.map((scenario) => ({
                id: scenario.id,
                name: scenario.name,
                source: "default" as const,
            })),
            ...customScenarios.map((scenario) => ({
                id: scenario.id,
                name: scenario.name,
                source: "custom" as const,
                eventsCount: scenario.events.length,
            })),
        ]
    }, [scenarios, customScenarios])

    async function loadScenarios() {
        try {
            const data = await getScenarios()
            setScenarios(data)

            if (data.length > 0) {
                setSelectedScenarioId(data[0].id)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingScenarios(false)
        }
    }

    async function handleRunSimulation() {
        if (!selectedScenarioId) return

        try {
            setRunningSimulation(true)

            let result: SimulationResultResponse

            const customScenario = customScenarios.find(
                (scenario) => scenario.id === selectedScenarioId
            )

            if (customScenario) {
                result = await runCustomSimulation({
                    scenario_name: customScenario.name,
                    description: customScenario.description,
                    severity: customScenario.severity,
                    base_scenario_id: customScenario.base_scenario_id,
                    events: customScenario.events,
                })
            } else {
                result = await runSimulation(selectedScenarioId)
            }

            setSimulationResult(result)

            setSelectedSnapshotIndex(
                result.snapshots.length > 0
                    ? result.snapshots.length - 1
                    : null
            )
        } catch (error) {
            console.error(error)
        } finally {
            setRunningSimulation(false)
        }
    }

    const selectedSnapshot =
        simulationResult && selectedSnapshotIndex !== null
            ? simulationResult.snapshots[selectedSnapshotIndex]
            : null

    if (loadingScenarios) {
        return <div>Cargando escenarios...</div>
    }

    return (
        <div className="page-container">
            <h1>Simulación eléctrica CPD</h1>

            <SimulationRunPanel
                scenarios={scenarioOptions}
                selectedScenarioId={selectedScenarioId}
                runningSimulation={runningSimulation}
                onScenarioChange={setSelectedScenarioId}
                onRunSimulation={handleRunSimulation}
            />

            {simulationResult && (
                <>
                    <ExportMenu result={simulationResult} />

                    <KpiPanel kpis={simulationResult.kpis} />

                    <EventsTable events={simulationResult.events} />

                    <SnapshotsTable snapshots={simulationResult.snapshots} />

                    {simulationResult.snapshots.length > 0 && (
                        <div className="form-group">
                            <label>Snapshot de topología</label>

                            <input
                                type="range"
                                min={0}
                                max={simulationResult.snapshots.length - 1}
                                value={
                                    selectedSnapshotIndex ??
                                    simulationResult.snapshots.length - 1
                                }
                                onChange={(event) =>
                                    setSelectedSnapshotIndex(
                                        Number(event.target.value)
                                    )
                                }
                            />

                            {selectedSnapshot && (
                                <p>
                                    t = {selectedSnapshot.tiempo_s}s · Estado:{" "}
                                    {selectedSnapshot.estado_global}
                                </p>
                            )}
                        </div>
                    )}

                    <TopologyGraph
                        topology={simulationResult.topology}
                        snapshot={selectedSnapshot}
                    />

                    <ComponentsAccordion
                        components={simulationResult.components}
                    />
                </>
            )}
        </div>
    )
}