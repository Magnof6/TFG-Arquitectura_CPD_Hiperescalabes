import { useEffect, useState } from "react"

import {
    getScenarios,
    runSimulation,
} from "../../services/api/client"

import type {
    ScenarioResponse,
    SimulationResultResponse,
} from "../../types/api"

import SimulationRunPanel from "../../components/ui/SimulationRunPanel"
import KpiPanel from "../../components/ui/KpiPanel"
import EventsTable from "../../components/tables/EventsTable"
import SnapshotsTable from "../../components/tables/SnapshotTable"
import ComponentsAccordion from "../../components/tables/ComponentsAccordion"
import ExportMenu from "../../components/ui/ExportMenu"
import TopologyGraph from "../../components/charts/TopologyGraph"

export default function ScenariosPage() {
    const [scenarios, setScenarios] = useState<ScenarioResponse[]>([])
    const [selectedScenarioId, setSelectedScenarioId] = useState("")
    const [simulationResult, setSimulationResult] =
        useState<SimulationResultResponse | null>(null)

    const [selectedSnapshotIndex, setSelectedSnapshotIndex] =
        useState<number | null>(null)

    const [loadingScenarios, setLoadingScenarios] = useState(true)
    const [runningSimulation, setRunningSimulation] = useState(false)

    useEffect(() => {
        loadScenarios()
    }, [])

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

            const result = await runSimulation(selectedScenarioId)
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
                scenarios={scenarios}
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