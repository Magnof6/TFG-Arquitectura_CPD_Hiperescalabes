import { useEffect, useState } from "react"

import {
    getScenarios,
    runSimulation,
} from "../../services/api/client"

import type {
    ScenarioResponse,
    SimulationResultResponse,

} from "../../types/api"
import SimulationRunPanel from "../../components/ui/SimulationRunPanel" //Panel para seleccionar escenario y ejecutar simulación
import KpiPanel from "../../components/ui/KpiPanel" //KPIs
import EventsTable from "../../components/tables/EventsTable" //Eventos Cronológicos
import SnapshotsTable from "../../components/tables/SnapshotTable" //Snapshots
import ComponentsAccordion from "../../components/tables/ComponentsAccordion" //Componentes (con acordeón para cada tipo)

export default function ScenariosPage() {
    const [scenarios, setScenarios] = useState<ScenarioResponse[]>([])
    const [selectedScenarioId, setSelectedScenarioId] = useState("")
    const [simulationResult, setSimulationResult] = useState<SimulationResultResponse | null>(null)

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
        } catch (error) {
            console.error(error)
        } finally {
            setRunningSimulation(false)
        }
    }

    if (loadingScenarios) {
        return <div>Cargando escenarios...</div>
    }

    return (
        <div style={{ padding: "2rem" }}>
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
                    <KpiPanel kpis={simulationResult.kpis} /> {/* KPIs */}

                    <EventsTable events={simulationResult.events} />  {/* eventos Cronológicos */}

                    <SnapshotsTable snapshots={simulationResult.snapshots} /> {/* Snapshots */}

                    <ComponentsAccordion components={simulationResult.components} /> {/* Componentes (con acordeón para cada tipo) */}
                </>
            )}
        </div>
    )
}