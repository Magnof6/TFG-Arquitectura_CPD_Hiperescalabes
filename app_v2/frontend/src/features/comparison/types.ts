import type { SimulationResultResponse } from "../../types/api";

export type ComparisonResult = {
    scenarioA: SimulationResultResponse;
    scenarioB: SimulationResultResponse;

    differences: {
        loadLostDiff: number;
        servedPercentDiff: number;
        failedComponentsDiff: number;
        reservesUsedDiff: number;
    };
};