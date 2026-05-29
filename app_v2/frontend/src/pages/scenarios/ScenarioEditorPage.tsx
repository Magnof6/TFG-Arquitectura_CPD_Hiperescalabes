import { useEffect, useMemo, useState } from 'react'

import {
    getComponentCatalog,
} from '../../services/api/client'

import type {
    ComponentCatalogItem,
    CustomEventInput,
    CustomEventType,
    CustomScenarioDraft,
} from '../../features/events/types'

import CustomScenarioList from "../../components/scenarios/CustomScenarioList"
import SelectedScenarioDetail from "../../components/scenarios/SelectedScenarioDetail"
import EventFormModal from "../../components/scenarios/EventFormModal"
import CustomScenarioForm from "../../components/scenarios/CustomScenarioForm"


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
    const [editingEventIndex, setEditingEventIndex] = useState<number | null>(null)

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

    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

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

    function deleteScenario(scenarioId: string) {
        const confirmed = window.confirm(
            '¿Seguro que deseas eliminar este escenario custom?'
        )

        if (!confirmed) {
            return
        }

        setCustomScenarios((prev) =>
            prev.filter((scenario) => scenario.id !== scenarioId)
        )

        if (selectedScenarioId === scenarioId) {
            setSelectedScenarioId('')
        }

        setMessage('Escenario eliminado correctamente')
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

    function deleteEventFromScenario(eventIndex: number) {
        setCustomScenarios((prev) =>
            prev.map((scenario) =>
                scenario.id === selectedScenarioId
                    ? {
                        ...scenario,
                        events: scenario.events.filter(
                            (_, index) => index !== eventIndex,
                        ),
                    }
                    : scenario,
            ),
        )

        setMessage('Evento eliminado correctamente')
    }

    function startEditingEvent(
        event: CustomEventInput,
        index: number,
    ) {
        setEditingEventIndex(index)

        setEventType(event.tipo)
        setSelectedComponentId(event.objetivo_id)
        setTime(event.tiempo_s)
        setDuration(event.duracion_s ?? 0)
        setDescription(event.descripcion)
        setSeverity(event.severidad)

        setCause(event.causa ?? '')
        setLoadKw(event.carga_kw ?? 0)
        setAvailableCapacityKw(
            event.capacidad_disponible_kw ?? 0,
        )

        setSourceOrigin(event.fuente_origen ?? '')
        setSourceDestination(event.fuente_destino ?? '')

        setGeneratorId(event.generador_id ?? '')
        setReason(event.motivo ?? '')

        setReserveComponentId(
            event.componente_reserva_id ?? '',
        )

        setIsEventModalOpen(true)
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

        if (editingEventIndex !== null) {
            setCustomScenarios((prev) =>
                prev.map((scenario) =>
                    scenario.id === selectedScenarioId
                        ? {
                            ...scenario,
                            events: scenario.events.map(
                                (currentEvent, index) =>
                                    index === editingEventIndex
                                        ? event
                                        : currentEvent,
                            ),
                        }
                        : scenario,
                ),
            )

            setEditingEventIndex(null)

            setMessage('Evento editado correctamente')
        } else {
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

            setMessage('Se ha añadido correctamente el evento al escenario custom')
        }

        setIsEventModalOpen(false)
        resetEventForm()
    }


    return (
        <main className="page">
            <CustomScenarioForm
                scenarioName={scenarioName}
                setScenarioName={setScenarioName}
                scenarioDescription={scenarioDescription}
                setScenarioDescription={setScenarioDescription}
                message={message}
                error={error}
                onCreateScenario={createScenario}
            />

            <CustomScenarioList
                scenarios={customScenarios}
                selectedScenarioId={selectedScenarioId}
                onSelectScenario={setSelectedScenarioId}
                onDeleteScenario={deleteScenario}
            />

            {selectedScenario && (
                <SelectedScenarioDetail
                    scenario={selectedScenario}
                    onAddEvent={() => setIsEventModalOpen(true)}
                    onEditEvent={startEditingEvent}
                    onDeleteEvent={deleteEventFromScenario}
                />
            )}


            {isEventModalOpen && (
                <EventFormModal
                    eventType={eventType}
                    setEventType={setEventType}
                    filteredComponents={filteredComponents}
                    selectedComponentId={selectedComponentId}
                    setSelectedComponentId={setSelectedComponentId}
                    time={time}
                    setTime={setTime}
                    duration={duration}
                    setDuration={setDuration}
                    severity={severity}
                    setSeverity={setSeverity}
                    description={description}
                    setDescription={setDescription}
                    cause={cause}
                    setCause={setCause}
                    loadKw={loadKw}
                    setLoadKw={setLoadKw}
                    availableCapacityKw={availableCapacityKw}
                    setAvailableCapacityKw={setAvailableCapacityKw}
                    sourceOrigin={sourceOrigin}
                    setSourceOrigin={setSourceOrigin}
                    sourceDestination={sourceDestination}
                    setSourceDestination={setSourceDestination}
                    generatorId={generatorId}
                    setGeneratorId={setGeneratorId}
                    reason={reason}
                    setReason={setReason}
                    reserveComponentId={reserveComponentId}
                    setReserveComponentId={setReserveComponentId}
                    editingEventIndex={editingEventIndex}
                    onSave={addEventToScenario}
                    onCancel={() => setIsEventModalOpen(false)}
                />
            )}
        </main>
    )
}