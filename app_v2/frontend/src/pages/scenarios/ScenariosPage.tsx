import { useEffect, useState } from "react"

import {
    getScenarios,
    runSimulation,
} from "../../services/api/client"

import type {
    ScenarioResponse,
    SimulationResultResponse,
} from "../../types/api"

export default function ScenariosPage() {
    const [scenarios, setScenarios] = useState<ScenarioResponse[]>([])
    const [selectedScenarioId, setSelectedScenarioId] = useState("")
    const [simulationResult, setSimulationResult] =
        useState<SimulationResultResponse | null>(null)

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
                    <section>
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

                    <section style={{ marginTop: "2rem" }}>
                        <h2>Eventos cronológicos</h2>

                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                backgroundColor: "#1f2937",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Tiempo (s)
                                    </th>
                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Tipo
                                    </th>
                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Objetivo
                                    </th>
                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Estado
                                    </th>
                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Descripción
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {simulationResult.events.map((event, index) => (
                                    <tr key={`${event.tiempo_s}-${event.objetivo_id}-${index}`}>
                                        <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                            {event.tiempo_s}
                                        </td>
                                        <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                            {event.tipo_evento}
                                        </td>
                                        <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                            {event.objetivo_id}
                                        </td>
                                        <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                            {event.estado_global_antes} →{" "}
                                            {event.estado_global_despues}
                                        </td>
                                        <td style={{ padding: "0.5rem", borderTop: "1px solid #374151" }}>
                                            {event.descripcion}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section style={{ marginTop: "2rem" }}>
                        <h2>Snapshots</h2>

                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                backgroundColor: "#1f2937",
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Tiempo
                                    </th>

                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Estado global
                                    </th>

                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Carga servida
                                    </th>

                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Carga perdida
                                    </th>

                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Componentes fallados
                                    </th>

                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Reservas activas
                                    </th>

                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Salas degradadas
                                    </th>

                                    <th style={{ textAlign: "left", padding: "0.5rem" }}>
                                        Salas sin servicio
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {simulationResult.snapshots.map(
                                    (snapshot, index) => (
                                        <tr key={index}>
                                            <td
                                                style={{
                                                    padding: "0.5rem",
                                                    borderTop: "1px solid #374151",
                                                }}
                                            >
                                                {snapshot.tiempo_s} s
                                            </td>

                                            <td
                                                style={{
                                                    padding: "0.5rem",
                                                    borderTop: "1px solid #374151",
                                                }}
                                            >
                                                {snapshot.estado_global}
                                            </td>

                                            <td
                                                style={{
                                                    padding: "0.5rem",
                                                    borderTop: "1px solid #374151",
                                                }}
                                            >
                                                {snapshot.carga_servida_kw} kW
                                            </td>

                                            <td
                                                style={{
                                                    padding: "0.5rem",
                                                    borderTop: "1px solid #374151",
                                                }}
                                            >
                                                {snapshot.carga_perdida_kw} kW
                                            </td>

                                            <td
                                                style={{
                                                    padding: "0.5rem",
                                                    borderTop: "1px solid #374151",
                                                }}
                                            >
                                                {snapshot.num_componentes_fallados}
                                            </td>

                                            <td
                                                style={{
                                                    padding: "0.5rem",
                                                    borderTop: "1px solid #374151",
                                                }}
                                            >
                                                {snapshot.num_componentes_reserva_en_uso}
                                            </td>

                                            <td
                                                style={{
                                                    padding: "0.5rem",
                                                    borderTop: "1px solid #374151",
                                                }}
                                            >
                                                {snapshot.num_salas_degradadas}
                                            </td>

                                            <td
                                                style={{
                                                    padding: "0.5rem",
                                                    borderTop: "1px solid #374151",
                                                }}
                                            >
                                                {snapshot.num_salas_sin_servicio}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </section>
                </>
            )}
        </div>
    )
}