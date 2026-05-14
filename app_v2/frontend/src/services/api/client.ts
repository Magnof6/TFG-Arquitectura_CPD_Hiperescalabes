//Cliente Axios para conectar con FastApi
import axios from 'axios';

import type {
    ScenarioResponse,
    SimulationResultResponse,
} from "../../types/api"

export const api = axios.create({
    baseURL: 'https://ubiquitous-carnival-qrqr6qq9xjhqpg-8000.app.github.dev/api', // Cambiar esto por mi URL del backend FastAPI

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