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
import KpisComparison from "../../components/comparison/KpisComparison"
import RootCauseComparison from "../../components/comparison/RootCauseComparison"
import EventsComparison from "../../components/comparison/EventsComparison"
import SnapshotsComparison from "../../components/comparison/SnapshotsComparison"


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
                    <KpisComparison resultA={resultA} resultB={resultB} />

                    <RootCauseComparison resultA={resultA} resultB={resultB} />

                    <EventsComparison resultA={resultA} resultB={resultB} />

                    <SnapshotsComparison resultA={resultA} resultB={resultB} />
                </>
            )}
        </div>
    );
}