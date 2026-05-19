import { useEffect, useState } from "react"

import {
    getScenarios,
    runSimulation,
} from "../../services/api/client"

import type {
    ScenarioResponse,
    SimulationResultResponse,

} from "../../types/api"
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

            <section style={{ marginBottom: "2rem" }}>
                <h2>Escenario</h2>

                <select
                    value={selectedScenarioId}
                    onChange={(event) =>
                        setSelectedScenarioId(event.target.value)
                    }
                >
                    {scenarios.map((scenario) => (
                        <option key={scenario.id} value={scenario.id}>
                            {scenario.name}
                        </option>
                    ))}
                </select>

                <button
                    onClick={handleRunSimulation}
                    disabled={runningSimulation}
                    style={{ marginLeft: "1rem" }}
                >
                    {runningSimulation
                        ? "Ejecutando..."
                        : "Ejecutar simulación"}
                </button>
            </section>

            {simulationResult && (
                <>
                    <section> // KPIs
                        <h2>KPIs</h2>

                        <ul>
                            <li>Estado final: {simulationResult.kpis.estado_global_final}</li>
                            <li>Tiempo final: {simulationResult.kpis.tiempo_final_s} s</li>
                            <li>Carga total: {simulationResult.kpis.carga_total_kw} kW</li>
                            <li>Carga servida: {simulationResult.kpis.carga_servida_kw} kW</li>
                            <li>Carga perdida: {simulationResult.kpis.carga_perdida_kw} kW</li>
                            <li>Porcentaje servido:{" "}{simulationResult.kpis.porcentaje_carga_servida.toFixed(2)}%</li>
                            <li>Capacidad entregable:{" "}{simulationResult.kpis.capacidad_entregable_kw} kW</li>
                            <li>Capacidad total activa:{" "}{simulationResult.kpis.capacidad_total_activa_kw} kW</li>
                            <li>Componentes fallados:{" "}{simulationResult.kpis.num_componentes_fallados}</li>
                            <li>Reservas en uso:{" "}{simulationResult.kpis.num_reservas_en_uso}</li>
                            <li>Eventos procesados:{" "}{simulationResult.kpis.num_eventos_procesados}</li>
                            <li>Snapshots: {simulationResult.kpis.num_snapshots}</li>
                            <li>Tiempo operativo:{" "}{simulationResult.kpis.tiempo_operativo_s} s</li>
                            <li>Tiempo degradado:{" "}{simulationResult.kpis.tiempo_degradado_s} s</li>
                            <li>Tiempo fallado:{" "}{simulationResult.kpis.tiempo_fallado_s} s</li>
                        </ul>
                    </section>

                    <EventsTable events={simulationResult.events} />  {/* eventos Cronológicos */} 

                    <SnapshotsTable snapshots={simulationResult.snapshots} /> {/* Snapshots */}

                    <ComponentsAccordion components={simulationResult.components} />
                </>
            )}
        </div>
    )
}