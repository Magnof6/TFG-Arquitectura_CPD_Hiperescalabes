import { useEffect, useState } from "react";

import { api } from "../../services/api/client";
import type { ScenarioResponse } from "../../types/api";

export default function ScenariosPage() {
    const [scenarios, setScenarios] = useState<ScenarioResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadScenarios()}, []);

    async function loadScenarios() {
        try {
            const response = await api.get<ScenarioResponse[]>("/scenarios/");
            setScenarios(response.data);
        }catch (error){
            console.error(error);
        }finally {
            setLoading(false);
        }
    }

    if (loading){
        return <div> cargando escenarios...</div>
    }
    return (
        <div style={{ padding: "2rem" }}>
            <h1>Escenarios disponibles</h1>

            <ul>
                {scenarios.map((scenario) => (
                    <li key={scenario.id}>
                        {scenario.name}
                    </li>
                ))}
            </ul>
        </div>
    )
}