import { useEffect, useState } from "react";

import {
    getScenarios,
    runSimulation,
} from "../../services/api/client";

import type {
    ScenarioResponse,
    SimulationResultResponse,
} from "../../types/api";

import type { CustomScenarioDraft } from "../../features/events/types"
import { runCustomSimulation } from "../../services/api/client"

import { compareSimulationResults } from "../../utils/compareSimulationResults";
import KpisComparison from "../../components/comparison/KpisComparison"
import RootCauseComparison from "../../components/comparison/RootCauseComparison"
import EventsComparison from "../../components/comparison/EventsComparison"
import SnapshotsComparison from "../../components/comparison/SnapshotsComparison"
import TopologyComparison from "../../components/comparison/TopologyComparison"


export default function ComparisonPage() {
    const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
    const [customScenarios, setCustomScenarios] = useState<CustomScenarioDraft[]>([])

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

    function isCustomScenario(id: string) {
        return customScenarios.some(
            (scenario) => scenario.id === id
        )
    }

    async function handleCompare() {
        if (!scenarioA || !scenarioB) return;

        try {
            setRunningComparison(true);

            const simA = isCustomScenario(scenarioA)
                ? await runCustomSimulation({
                    scenario_name:
                        customScenarios.find(s => s.id === scenarioA)!.name,
                    description:
                        customScenarios.find(s => s.id === scenarioA)!.description,
                    severity:
                        customScenarios.find(s => s.id === scenarioA)!.severity,
                    base_scenario_id:
                        customScenarios.find(s => s.id === scenarioA)!.base_scenario_id,
                    events:
                        customScenarios.find(s => s.id === scenarioA)!.events,
                })
                : await runSimulation(scenarioA)

            const simB = isCustomScenario(scenarioB)
                ? await runCustomSimulation({
                    scenario_name:
                        customScenarios.find(s => s.id === scenarioB)!.name,
                    description:
                        customScenarios.find(s => s.id === scenarioB)!.description,
                    severity:
                        customScenarios.find(s => s.id === scenarioB)!.severity,
                    base_scenario_id:
                        customScenarios.find(s => s.id === scenarioB)!.base_scenario_id,
                    events:
                        customScenarios.find(s => s.id === scenarioB)!.events,
                })
                : await runSimulation(scenarioB)

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

    if (loadingScenarios) {
        return <div>Cargando escenarios...</div>;
    }

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
                        <optgroup label="Escenarios default">
                            {scenarios.map((scenario) => (
                                <option key={scenario.id} value={scenario.id}>
                                    {scenario.name}
                                </option>
                            ))}
                        </optgroup>

                        <optgroup label="Escenarios custom">
                            {customScenarios.map((scenario) => (
                                <option key={scenario.id} value={scenario.id}>
                                    {scenario.name}
                                </option>
                            ))}
                        </optgroup>
                    </select>

                    <select
                        className="form-select"
                        value={scenarioB}
                        onChange={(e) => setScenarioB(e.target.value)}
                    >
                        <optgroup label="Escenarios default">
                            {scenarios.map((scenario) => (
                                <option key={scenario.id} value={scenario.id}>
                                    {scenario.name}
                                </option>
                            ))}
                        </optgroup>

                        <optgroup label="Escenarios custom">
                            {customScenarios.map((scenario) => (
                                <option key={scenario.id} value={scenario.id}>
                                    {scenario.name}
                                </option>
                            ))}
                        </optgroup>
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
                    <KpisComparison resultA={resultA} resultB={resultB} />

                    <RootCauseComparison resultA={resultA} resultB={resultB} />

                    <EventsComparison resultA={resultA} resultB={resultB} />

                    <SnapshotsComparison resultA={resultA} resultB={resultB} />

                    <TopologyComparison resultA={resultA} resultB={resultB} />
                </>
            )}
        </div>
    );
}