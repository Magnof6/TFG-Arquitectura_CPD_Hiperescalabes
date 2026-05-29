import { useEffect, useMemo, useState } from 'react'

import {
    getComponentCatalog,
    runCustomSimulation,
} from '../../services/api/client'

import type {
    ComponentCatalogItem,
    CustomEventInput,
    CustomEventType,
    CustomScenarioDraft,
} from '../../features/events/types'

import type { SimulationResultResponse } from '../../types/api'


const DEFAULT_SCENARIO_ID = 'escenario_dc1_sin_eventos'


export function ScenarioEditorPage() {
    const [components, setComponents] = useState<ComponentCatalogItem[]>([])

    const [customScenarios, setCustomScenarios] = useState<CustomScenarioDraft[]>(() => {
        const stored = localStorage.getItem('customScenarios')

        if (!stored) {
            return []
        }

        try {
            return JSON.parse(stored)
        } catch {
            return []
        }
    })    
    const [selectedScenarioId, setSelectedScenarioId] = useState<string>('')

    const [scenarioName, setScenarioName] = useState('')
    const [scenarioDescription, setScenarioDescription] = useState('')

    const [isEventModalOpen, setIsEventModalOpen] = useState(false)

    const [eventType, setEventType] = useState<CustomEventType>('FalloComponente')
    const [selectedComponentId, setSelectedComponentId] = useState('')
    const [time, setTime] = useState(10)
    const [duration, setDuration] = useState(0)
    const [description, setDescription] = useState('')
    const [severity, setSeverity] = useState(3)

    const [cause, setCause] = useState('')
    const [loadKw, setLoadKw] = useState(0)
    const [availableCapacityKw, setAvailableCapacityKw] = useState(0)
    const [sourceOrigin, setSourceOrigin] = useState('')
    const [sourceDestination, setSourceDestination] = useState('')
    const [generatorId, setGeneratorId] = useState('')
    const [reason, setReason] = useState('')
    const [reserveComponentId, setReserveComponentId] = useState('')

    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [simulationResult, setSimulationResult] = useState<SimulationResultResponse | null>(null)

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

    const selectedScenario = useMemo(
        () =>
            customScenarios.find(
                (scenario) => scenario.id === selectedScenarioId,
            ),
        [customScenarios, selectedScenarioId],
    )

    const filteredComponents = useMemo(() => {
        return components.filter((component) => {
            if (eventType === 'ParadaGenerador') {
                return component.type === 'Generador'
            }

            if (eventType === 'ConmutacionFuente') {
                return component.type === 'UPS' || component.type === 'STS'
            }

            if (eventType === 'SalidaReserva') {
                return component.is_reserve
            }

            return true
        })
    }, [components, eventType])

    useEffect(() => {
        if (filteredComponents.length === 0) {
            setSelectedComponentId('')
            return
        }

        const exists = filteredComponents.some(
            (component) => component.id === selectedComponentId,
        )

        if (!exists) {
            setSelectedComponentId(filteredComponents[0].id)
        }
    }, [filteredComponents, selectedComponentId])

    useEffect(() => {
        localStorage.setItem(
            'customScenarios',
            JSON.stringify(customScenarios),
        )
    }, [customScenarios])

    function createScenario() {
        setError(null)
        setMessage(null)

        if (!scenarioName.trim()) {
            setError('El nombre del escenario es obligatorio')
            return
        }

        const alreadyExists = customScenarios.some(
            (scenario) => scenario.id === scenarioName.trim(),
        )

        if (alreadyExists) {
            setError('Ya existe un escenario custom con ese nombre')
            return
        }

        const newScenario: CustomScenarioDraft = {
            id: scenarioName.trim(),
            name: scenarioName.trim(),
            description: scenarioDescription,
            severity: 'medium',
            base_scenario_id: DEFAULT_SCENARIO_ID,
            events: [],
            source: 'custom',
        }

        setCustomScenarios((prev) => [...prev, newScenario])
        setSelectedScenarioId(newScenario.id)

        setScenarioName('')
        setScenarioDescription('')

        setMessage('Escenario custom creado correctamente')
    }

    function validateEvent(): string | null {
        if (!selectedScenario) {
            return 'Debe seleccionar un escenario custom'
        }

        if (!selectedComponentId) {
            return 'Debe seleccionar un componente'
        }

        if (time < 0) {
            return 'El tiempo no puede ser negativo'
        }

        if (duration < 0) {
            return 'La duración no puede ser negativa'
        }

        if (!description.trim()) {
            return 'La descripción es obligatoria'
        }

        if (severity < 1 || severity > 5) {
            return 'La severidad debe estar entre 1 y 5'
        }

        if (
            (eventType === 'FalloComponente' ||
                eventType === 'RecuperacionComponente') &&
            !cause.trim()
        ) {
            return 'La causa es obligatoria'
        }

        if (eventType === 'Sobrecarga') {
            if (loadKw <= 0) {
                return 'La carga kW debe ser mayor que 0'
            }

            if (availableCapacityKw <= 0) {
                return 'La capacidad disponible debe ser mayor que 0'
            }
        }

        if (eventType === 'ConmutacionFuente') {
            if (!sourceOrigin.trim()) {
                return 'La fuente origen es obligatoria'
            }

            if (!sourceDestination.trim()) {
                return 'La fuente destino es obligatoria'
            }
        }

        if (eventType === 'ParadaGenerador') {
            if (!generatorId.trim()) {
                return 'El generador_id es obligatorio'
            }

            if (!reason.trim()) {
                return 'El motivo es obligatorio'
            }
        }

        if (eventType === 'SalidaReserva') {
            if (!reserveComponentId.trim()) {
                return 'El componente_reserva_id es obligatorio'
            }

            if (!reason.trim()) {
                return 'El motivo es obligatorio'
            }
        }

        return null
    }

    function buildEvent(): CustomEventInput {
        const baseEvent: CustomEventInput = {
            tipo: eventType,
            tiempo_s: time,
            duracion_s: duration,
            objetivo_id: selectedComponentId,
            descripcion: description,
            severidad: severity,
        }

        if (
            eventType === 'FalloComponente' ||
            eventType === 'RecuperacionComponente'
        ) {
            baseEvent.causa = cause
        }

        if (eventType === 'Sobrecarga') {
            baseEvent.carga_kw = loadKw
            baseEvent.capacidad_disponible_kw = availableCapacityKw
        }

        if (eventType === 'ConmutacionFuente') {
            baseEvent.fuente_origen = sourceOrigin
            baseEvent.fuente_destino = sourceDestination
        }

        if (eventType === 'ParadaGenerador') {
            baseEvent.generador_id = generatorId
            baseEvent.motivo = reason
        }

        if (eventType === 'SalidaReserva') {
            baseEvent.componente_reserva_id = reserveComponentId
            baseEvent.motivo = reason
        }

        return baseEvent
    }

    function resetEventForm() {
        setEventType('FalloComponente')
        setTime(10)
        setDuration(0)
        setDescription('')
        setSeverity(3)
        setCause('')
        setLoadKw(0)
        setAvailableCapacityKw(0)
        setSourceOrigin('')
        setSourceDestination('')
        setGeneratorId('')
        setReason('')
        setReserveComponentId('')
    }

    function addEventToScenario() {
        setError(null)
        setMessage(null)

        const validationError = validateEvent()

        if (validationError) {
            setError(validationError)
            return
        }

        const event = buildEvent()

        setCustomScenarios((prev) =>
            prev.map((scenario) =>
                scenario.id === selectedScenarioId
                    ? {
                        ...scenario,
                        events: [...scenario.events, event],
                    }
                    : scenario,
            ),
        )

        setIsEventModalOpen(false)
        resetEventForm()
        setMessage('Se ha añadido correctamente el evento al escenario custom')
    }

    async function executeSelectedScenario() {
        setError(null)
        setMessage(null)

        console.log('Ejecutando escenario:', selectedScenario)

        if (!selectedScenario) {
            setError('Debe seleccionar un escenario custom')
            return
        }

        if (selectedScenario.events.length === 0) {
            setError('El escenario custom debe tener al menos un evento')
            return
        }

        setLoading(true)

        try {
            const result = await runCustomSimulation({
                scenario_name: selectedScenario.name,
                description: selectedScenario.description,
                severity: selectedScenario.severity,
                base_scenario_id: selectedScenario.base_scenario_id,
                events: selectedScenario.events,
            })

            console.log('Resultado simulación custom:', result)
            setSimulationResult(result)

            setMessage(
                `Simulación ejecutada correctamente. Estado final: ${result.kpis.estado_global_final}`,
            )
        } catch (err: any) {
            console.error('Error ejecutando escenario custom:', err)

            setError(
                err.response?.data?.detail ??
                err.message ??
                'Error desconocido ejecutando la simulación',
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="page">
            <section className="card">
                <h1>Editor de escenarios</h1>

                {message && <p className="success">{message}</p>}
                {error && <p className="error">{error}</p>}

                <div className="form-grid">
                    <label>
                        ID / nombre del escenario
                        <input
                            value={scenarioName}
                            onChange={(event) =>
                                setScenarioName(event.target.value)
                            }
                        />
                    </label>

                    <label>
                        Descripción del escenario
                        <input
                            value={scenarioDescription}
                            onChange={(event) =>
                                setScenarioDescription(event.target.value)
                            }
                        />
                    </label>
                </div>

                <button type="button" onClick={createScenario}>
                    Crear escenario custom
                </button>
            </section>

            <section className="card">
                <h2>Escenarios custom</h2>

                {customScenarios.length === 0 && (
                    <p>No hay escenarios custom todavía.</p>
                )}

                {customScenarios.map((scenario) => (
                    <button
                        key={scenario.id}
                        type="button"
                        onClick={() => setSelectedScenarioId(scenario.id)}
                        className={
                            scenario.id === selectedScenarioId ? 'active' : ''
                        }
                    >
                        {scenario.name} ({scenario.events.length} eventos)
                    </button>
                ))}
            </section>

            {selectedScenario && (
                <section className="card">
                    <h2>{selectedScenario.name}</h2>

                    <p>{selectedScenario.description}</p>

                    <button
                        type="button"
                        onClick={() => setIsEventModalOpen(true)}
                    >
                        Añadir evento
                    </button>

                    <button
                        type="button"
                        onClick={executeSelectedScenario}
                        disabled={loading}
                    >
                        {loading
                            ? 'Ejecutando...'
                            : 'Ejecutar escenario custom'}
                    </button>

                    <h3>Eventos</h3>

                    {selectedScenario.events.length === 0 && (
                        <p>Este escenario todavía no tiene eventos.</p>
                    )}

                    <ul>
                        {selectedScenario.events.map((event, index) => (
                            <li key={`${event.tipo}-${event.objetivo_id}-${index}`}>
                                <strong>{event.tipo}</strong> ·{' '}
                                {event.objetivo_id} · t={event.tiempo_s}s ·{' '}
                                {event.descripcion}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {simulationResult && (
                <section className="card">
                    <h2>Resultado de la simulación</h2>

                    <p>
                        <strong>Estado final:</strong>{' '}
                        {simulationResult.kpis.estado_global_final}
                    </p>

                    <p>
                        <strong>Carga servida:</strong>{' '}
                        {simulationResult.kpis.carga_servida_kw} kW
                    </p>

                    <p>
                        <strong>Carga perdida:</strong>{' '}
                        {simulationResult.kpis.carga_perdida_kw} kW
                    </p>

                    <p>
                        <strong>Eventos procesados:</strong>{' '}
                        {simulationResult.kpis.num_eventos_procesados}
                    </p>
                </section>
            )}

            {isEventModalOpen && (
                <div className="modal-backdrop">
                    <div className="card modal">
                        <h2>Añadir evento</h2>

                        <div className="form-grid">
                            <label>
                                Tipo de evento
                                <select
                                    value={eventType}
                                    onChange={(event) =>
                                        setEventType(
                                            event.target
                                                .value as CustomEventType,
                                        )
                                    }
                                >
                                    <option value="FalloComponente">
                                        Fallo componente
                                    </option>
                                    <option value="RecuperacionComponente">
                                        Recuperación componente
                                    </option>
                                    <option value="Sobrecarga">
                                        Sobrecarga
                                    </option>
                                    <option value="ConmutacionFuente">
                                        Conmutación fuente
                                    </option>
                                    <option value="ParadaGenerador">
                                        Parada generador
                                    </option>
                                    <option value="SalidaReserva">
                                        Salida reserva
                                    </option>
                                </select>
                            </label>

                            <label>
                                Componente
                                <select
                                    value={selectedComponentId}
                                    onChange={(event) =>
                                        setSelectedComponentId(
                                            event.target.value,
                                        )
                                    }
                                >
                                    {filteredComponents.map((component) => (
                                        <option
                                            key={component.id}
                                            value={component.id}
                                        >
                                            {component.label} ({component.id})
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Tiempo, s
                                <input
                                    type="number"
                                    min={0}
                                    value={time}
                                    onChange={(event) =>
                                        setTime(Number(event.target.value))
                                    }
                                />
                            </label>

                            <label>
                                Duración, s
                                <input
                                    type="number"
                                    min={0}
                                    value={duration}
                                    onChange={(event) =>
                                        setDuration(Number(event.target.value))
                                    }
                                />
                            </label>

                            <label>
                                Severidad
                                <input
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={severity}
                                    onChange={(event) =>
                                        setSeverity(Number(event.target.value))
                                    }
                                />
                            </label>

                            <label>
                                Descripción
                                <input
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(event.target.value)
                                    }
                                />
                            </label>

                            {(eventType === 'FalloComponente' ||
                                eventType ===
                                'RecuperacionComponente') && (
                                    <label>
                                        Causa
                                        <input
                                            value={cause}
                                            onChange={(event) =>
                                                setCause(event.target.value)
                                            }
                                        />
                                    </label>
                                )}

                            {eventType === 'Sobrecarga' && (
                                <>
                                    <label>
                                        Carga kW
                                        <input
                                            type="number"
                                            value={loadKw}
                                            onChange={(event) =>
                                                setLoadKw(
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Capacidad disponible kW
                                        <input
                                            type="number"
                                            value={availableCapacityKw}
                                            onChange={(event) =>
                                                setAvailableCapacityKw(
                                                    Number(event.target.value),
                                                )
                                            }
                                        />
                                    </label>
                                </>
                            )}

                            {eventType === 'ConmutacionFuente' && (
                                <>
                                    <label>
                                        Fuente origen
                                        <input
                                            value={sourceOrigin}
                                            onChange={(event) =>
                                                setSourceOrigin(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Fuente destino
                                        <input
                                            value={sourceDestination}
                                            onChange={(event) =>
                                                setSourceDestination(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </label>
                                </>
                            )}

                            {eventType === 'ParadaGenerador' && (
                                <>
                                    <label>
                                        Generador ID
                                        <input
                                            value={generatorId}
                                            onChange={(event) =>
                                                setGeneratorId(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Motivo
                                        <input
                                            value={reason}
                                            onChange={(event) =>
                                                setReason(event.target.value)
                                            }
                                        />
                                    </label>
                                </>
                            )}

                            {eventType === 'SalidaReserva' && (
                                <>
                                    <label>
                                        Componente reserva ID
                                        <input
                                            value={reserveComponentId}
                                            onChange={(event) =>
                                                setReserveComponentId(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </label>

                                    <label>
                                        Motivo
                                        <input
                                            value={reason}
                                            onChange={(event) =>
                                                setReason(event.target.value)
                                            }
                                        />
                                    </label>
                                </>
                            )}
                        </div>

                        <button type="button" onClick={addEventToScenario}>
                            Añadir evento al escenario
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsEventModalOpen(false)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </main>
    )
}