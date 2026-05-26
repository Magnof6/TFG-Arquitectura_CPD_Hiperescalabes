import { useEffect, useState } from "react";

import {
    getScenarios,
    runSimulation,
} from "../../services/api/client";

import type {
    ScenarioResponse,
    SimulationResultResponse,
} from "../../types/api";

import { compareSimulationResults } from "../../utils/compareSimulationResults";
import { analyzeRootCause } from "../../utils/analyzeRootCause";

export default function ComparisonPage() {
    const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);

    const [scenarioA, setScenarioA] = useState("");
    const [scenarioB, setScenarioB] = useState("");

    const [resultA, setResultA] =
        useState<SimulationResultResponse | null>(null);

    const [resultB, setResultB] =
        useState<SimulationResultResponse | null>(null);

    const [loadingScenarios, setLoadingScenarios] =
        useState(true);

    const [runningComparison, setRunningComparison] =
        useState(false);

    useEffect(() => {
        loadScenarios();
    }, []);

    async function loadScenarios() {
        try {
            const data = await getScenarios();

            setScenarios(data);

            if (data.length > 0) {
                setScenarioA(data[0].id);
            }

            if (data.length > 1) {
                setScenarioB(data[1].id);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingScenarios(false);
        }
    }

    async function handleCompare() {
        if (!scenarioA || !scenarioB) return;

        try {
            setRunningComparison(true);

            const [simA, simB] = await Promise.all([
                runSimulation(scenarioA),
                runSimulation(scenarioB),
            ]);

            setResultA(simA);
            setResultB(simB);
        } catch (error) {
            console.error(error);
        } finally {
            setRunningComparison(false);
        }
    }

    const comparison =
        resultA && resultB
            ? compareSimulationResults(resultA, resultB)
            : null;

    const rootCauseA =
        resultA ? analyzeRootCause(resultA) : null;

    const rootCauseB =
        resultB ? analyzeRootCause(resultB) : null;

    if (loadingScenarios) {
        return <div>Cargando escenarios...</div>;
    }

    function formatPercent(value: number) {
        return `${value.toFixed(2)}`
    }

    function formatNumber(value: number) {
        return value.toLocaleString("es-ES")
    }

    const kpiRows =
        resultA && resultB
            ? [
                {
                    label: "Estado final",
                    a: resultA.kpis.estado_global_final,
                    b: resultB.kpis.estado_global_final,
                    diff: resultA.kpis.estado_global_final === resultB.kpis.estado_global_final
                        ? "Igual"
                        : "Distinto",
                },
                {
                    label: "Tiempo final",
                    a: `${resultA.kpis.tiempo_final_s}s`,
                    b: `${resultB.kpis.tiempo_final_s}s`,
                    diff: `${formatNumber(Math.abs(resultB.kpis.tiempo_final_s - resultA.kpis.tiempo_final_s))}s`,
                },
                {
                    label: "Carga total",
                    a: `${formatNumber(resultA.kpis.carga_total_kw)} kW`,
                    b: `${formatNumber(resultB.kpis.carga_total_kw)} kW`,
                    diff: `${formatNumber(Math.abs(resultB.kpis.carga_total_kw - resultA.kpis.carga_total_kw))} kW`,
                },
                {
                    label: "Carga servida",
                    a: `${formatNumber(resultA.kpis.carga_servida_kw)} kW`,
                    b: `${formatNumber(resultB.kpis.carga_servida_kw)} kW`,
                    diff: `${formatNumber(Math.abs(resultB.kpis.carga_servida_kw - resultA.kpis.carga_servida_kw))} kW`,
                },
                {
                    label: "Carga perdida",
                    a: `${formatNumber(resultA.kpis.carga_perdida_kw)} kW`,
                    b: `${formatNumber(resultB.kpis.carga_perdida_kw)} kW`,
                    diff: `${formatNumber(Math.abs(resultB.kpis.carga_perdida_kw - resultA.kpis.carga_perdida_kw))} kW`,
                },
                {
                    label: "% carga servida",
                    a: formatPercent(resultA.kpis.porcentaje_carga_servida),
                    b: formatPercent(resultB.kpis.porcentaje_carga_servida),
                    diff: formatPercent(
                        Math.abs(resultB.kpis.porcentaje_carga_servida - resultA.kpis.porcentaje_carga_servida)
                    ),
                },
                {
                    label: "Capacidad entregable",
                    a: `${formatNumber(resultA.kpis.capacidad_entregable_kw)} kW`,
                    b: `${formatNumber(resultB.kpis.capacidad_entregable_kw)} kW`,
                    diff: `${formatNumber(Math.abs(resultB.kpis.capacidad_entregable_kw - resultA.kpis.capacidad_entregable_kw))} kW`,
                },
                {
                    label: "Capacidad total activa",
                    a: `${formatNumber(resultA.kpis.capacidad_total_activa_kw)} kW`,
                    b: `${formatNumber(resultB.kpis.capacidad_total_activa_kw)} kW`,
                    diff: `${formatNumber(Math.abs(resultB.kpis.capacidad_total_activa_kw - resultA.kpis.capacidad_total_activa_kw))} kW`,
                },
                {
                    label: "Componentes fallados",
                    a: resultA.kpis.num_componentes_fallados,
                    b: resultB.kpis.num_componentes_fallados,
                    diff: Math.abs(
                        resultB.kpis.num_componentes_fallados -
                        resultA.kpis.num_componentes_fallados
                    ),
                },
                {
                    label: "Reservas en uso",
                    a: resultA.kpis.num_reservas_en_uso,
                    b: resultB.kpis.num_reservas_en_uso,
                    diff: Math.abs(
                        resultB.kpis.num_reservas_en_uso -
                        resultA.kpis.num_reservas_en_uso
                    ),
                },
                {
                    label: "Eventos procesados",
                    a: resultA.kpis.num_eventos_procesados,
                    b: resultB.kpis.num_eventos_procesados,
                    diff: Math.abs(
                        resultB.kpis.num_eventos_procesados -
                        resultA.kpis.num_eventos_procesados
                    ),
                },
                {
                    label: "Snapshots",
                    a: resultA.kpis.num_snapshots,
                    b: resultB.kpis.num_snapshots,
                    diff: Math.abs(
                        resultB.kpis.num_snapshots -
                        resultA.kpis.num_snapshots
                    ),
                },
                {
                    label: "Tiempo operativo",
                    a: `${resultA.kpis.tiempo_operativo_s}s`,
                    b: `${resultB.kpis.tiempo_operativo_s}s`,
                    diff: `${formatNumber(Math.abs(resultB.kpis.tiempo_operativo_s - resultA.kpis.tiempo_operativo_s))}s`,
                },
                {
                    label: "Tiempo degradado",
                    a: `${resultA.kpis.tiempo_degradado_s}s`,
                    b: `${resultB.kpis.tiempo_degradado_s}s`,
                    diff: `${formatNumber(Math.abs(resultB.kpis.tiempo_degradado_s - resultA.kpis.tiempo_degradado_s))}s`,
                },
                {
                    label: "Tiempo fallado",
                    a: `${resultA.kpis.tiempo_fallado_s}s`,
                    b: `${resultB.kpis.tiempo_fallado_s}s`,
                    diff: `${formatNumber(Math.abs(resultB.kpis.tiempo_fallado_s - resultA.kpis.tiempo_fallado_s))}s`,
                },
            ]
            : [];

    return (
        <div className="page-container">
            <h1>Comparador de escenarios</h1>

            <div className="form-panel">
                <div className="form-control">
                    <select
                        className="form-select"
                        value={scenarioA}
                        onChange={(e) => setScenarioA(e.target.value)}
                    >
                        {scenarios.map((scenario) => (
                            <option key={scenario.id} value={scenario.id}>
                                {scenario.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="form-select"
                        value={scenarioB}
                        onChange={(e) => setScenarioB(e.target.value)}
                    >
                        {scenarios.map((scenario) => (
                            <option key={scenario.id} value={scenario.id}>
                                {scenario.name}
                            </option>
                        ))}
                    </select>

                    <button
                        className="button"
                        onClick={handleCompare}
                        disabled={runningComparison || !scenarioA || !scenarioB}
                    >
                        {runningComparison ? "Comparando..." : "Comparar escenarios"}
                    </button>
                </div>
            </div>

            {comparison && resultA && resultB && (
                <>
                    <div className="section-card">
                        <h2 className="section-card-title">KPIs comparados</h2>

                        <table className="table-container">
                            <thead>
                                <tr>
                                    <th className="table-header">Métrica</th>
                                    <th className="table-header">Escenario A</th>
                                    <th className="table-header">Escenario B</th>
                                    <th className="table-header">Diferencia</th>
                                </tr>
                            </thead>

                            <tbody>
                                {kpiRows.map((row) => (
                                    <tr key={row.label}>
                                        <td className="table-cell">{row.label}</td>
                                        <td className="table-cell">{row.a}</td>
                                        <td className="table-cell">{row.b}</td>
                                        <td className="table-cell">{row.diff}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="section-card">
                        <h2 className="section-card-title">Causa raíz</h2>

                        <div className="kpi-grid">
                            <div className="kpi-card">
                                <p className="kpi-card-title">Escenario A</p>
                                <p>{rootCauseA?.summary}</p>
                                <p>
                                    Primera degradación:{" "}
                                    {rootCauseA?.firstDegradationEvent?.descripcion ?? "No detectada"}
                                </p>
                            </div>

                            <div className="kpi-card">
                                <p className="kpi-card-title">Escenario B</p>
                                <p>{rootCauseB?.summary}</p>
                                <p>
                                    Primera degradación:{" "}
                                    {rootCauseB?.firstDegradationEvent?.descripcion ?? "No detectada"}
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}