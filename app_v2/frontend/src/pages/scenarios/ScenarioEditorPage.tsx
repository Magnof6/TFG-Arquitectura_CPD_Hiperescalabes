import { useEffect, useState } from 'react'

import {
    getComponentCatalog,
    runCustomSimulation,
} from '../../services/api/client'

import type {
    ComponentCatalogItem,
    CustomEventType,
} from '../../features/events/types'


const DEFAULT_SCENARIO_ID = 'escenario_dc1_sin_eventos'


export function ScenarioEditorPage() {
    const [components, setComponents] = useState<ComponentCatalogItem[]>([])
    const [selectedComponentId, setSelectedComponentId] = useState('')
    const [eventType, setEventType] = useState<CustomEventType>('FalloComponente')
    const [time, setTime] = useState(10)
    const [description, setDescription] = useState('')
    const [severity, setSeverity] = useState(4)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        getComponentCatalog()
            .then((data) => {
                setComponents(data)

                if (data.length > 0) {
                    setSelectedComponentId(data[0].id)
                }
            })
            .catch((err) => {
                setError(err.message)
            })
    }, [])

    async function handleRunCustomSimulation() {
        setLoading(true)
        setError(null)
        setSuccess(null)

        try {
            const result = await runCustomSimulation({
                scenario_name: 'Escenario creado desde editor',
                description: 'Prueba inicial del editor de escenarios',
                severity: 'high',
                base_scenario_id: DEFAULT_SCENARIO_ID,
                events: [
                    {
                        tipo: eventType,
                        tiempo_s: time,
                        objetivo_id: selectedComponentId,
                        descripcion: description || undefined,
                        severidad: severity,
                        causa: 'Evento creado desde frontend',
                    },
                ],
            })

            setSuccess(
                `Simulación ejecutada. Estado final: ${result.kpis.estado_global_final}`,
            )
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('Error desconocido ejecutando simulación')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="page">
            <section className="card">
                <h1>Editor de escenarios</h1>

                <div className="form-grid">
                    <label>
                        Tipo de evento
                        <select
                            value={eventType}
                            onChange={(event) =>
                                setEventType(event.target.value as CustomEventType)
                            }
                        >
                            <option value="FalloComponente">Fallo componente</option>
                            <option value="RecuperacionComponente">Recuperación componente</option>
                            <option value="Sobrecarga">Sobrecarga</option>
                            <option value="ConmutacionFuente">Conmutación fuente</option>
                            <option value="ParadaGenerador">Parada generador</option>
                            <option value="SalidaReserva">Salida reserva</option>
                        </select>
                    </label>

                    <label>
                        Componente
                        <select
                            value={selectedComponentId}
                            onChange={(event) => setSelectedComponentId(event.target.value)}
                        >
                            {components.map((component) => (
                                <option key={component.id} value={component.id}>
                                    {component.label} ({component.id})
                                </option>
                            ))}
                        </select>
                    </label>

                    <label>
                        Tiempo simulación, s
                        <input
                            type="number"
                            value={time}
                            min={0}
                            onChange={(event) => setTime(Number(event.target.value))}
                        />
                    </label>

                    <label>
                        Severidad
                        <input
                            type="number"
                            value={severity}
                            min={1}
                            max={5}
                            onChange={(event) => setSeverity(Number(event.target.value))}
                        />
                    </label>

                    <label>
                        Descripción
                        <input
                            type="text"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </label>
                </div>

                <button
                    type="button"
                    onClick={handleRunCustomSimulation}
                    disabled={loading || !selectedComponentId}
                >
                    {loading ? 'Ejecutando...' : 'Ejecutar simulación custom'}
                </button>

                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
            </section>
        </main>
    )
}