//Cliente Axios para conectar con FastApi
import axios from 'axios';

import type {
    ScenarioResponse,
    SimulationResultResponse,
} from "../../types/api"

import type {
    ComponentCatalogItem,
    CustomSimulationRunRequest,
} from "../../features/events/types"

const isCodespaces = window.location.hostname.includes("app.github.dev");

export const api = axios.create({
    baseURL: isCodespaces
        ? "https://ubiquitous-carnival-qrqr6qq9xjhqpg-8000.app.github.dev/api"
        : "http://localhost:8000/api",
});

export async function getScenarios() {
    const response = await api.get<ScenarioResponse[]>("/scenarios/")
    return response.data
}

export async function runSimulation(scenarioId: string) {
    const response = await api.post<SimulationResultResponse>(
        "/simulations/run",
        {
            scenario_id: scenarioId,
        }
    )

    return response.data
}

export async function getComponentCatalog() {
    const response = await api.get<ComponentCatalogItem[]>(
        "/topology/components"
    )

    return response.data
}


export async function runCustomSimulation(
    payload: CustomSimulationRunRequest
) {
    const response = await api.post<SimulationResultResponse>(
        "/simulations/run-custom",
        payload
    )

    return response.data
}