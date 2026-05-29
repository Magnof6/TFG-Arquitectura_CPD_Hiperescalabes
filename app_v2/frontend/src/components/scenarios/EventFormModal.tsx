import type {
    ComponentCatalogItem,
    CustomEventType,
} from "../../features/events/types"

interface Props {
    eventType: CustomEventType
    setEventType: (value: CustomEventType) => void

    filteredComponents: ComponentCatalogItem[]
    selectedComponentId: string
    setSelectedComponentId: (value: string) => void

    time: number
    setTime: (value: number) => void

    duration: number
    setDuration: (value: number) => void

    severity: number
    setSeverity: (value: number) => void

    description: string
    setDescription: (value: string) => void

    cause: string
    setCause: (value: string) => void

    loadKw: number
    setLoadKw: (value: number) => void

    availableCapacityKw: number
    setAvailableCapacityKw: (value: number) => void

    sourceOrigin: string
    setSourceOrigin: (value: string) => void

    sourceDestination: string
    setSourceDestination: (value: string) => void

    generatorId: string
    setGeneratorId: (value: string) => void

    reason: string
    setReason: (value: string) => void

    reserveComponentId: string
    setReserveComponentId: (value: string) => void

    editingEventIndex: number | null

    onSave: () => void
    onCancel: () => void
}

export default function EventFormModal({
    eventType,
    setEventType,
    filteredComponents,
    selectedComponentId,
    setSelectedComponentId,
    time,
    setTime,
    duration,
    setDuration,
    severity,
    setSeverity,
    description,
    setDescription,
    cause,
    setCause,
    loadKw,
    setLoadKw,
    availableCapacityKw,
    setAvailableCapacityKw,
    sourceOrigin,
    setSourceOrigin,
    sourceDestination,
    setSourceDestination,
    generatorId,
    setGeneratorId,
    reason,
    setReason,
    reserveComponentId,
    setReserveComponentId,
    editingEventIndex,
    onSave,
    onCancel,
}: Props) {
    return (
        <div className="modal-backdrop">
            <div className="card modal">
                <h2>
                    {editingEventIndex !== null
                        ? "Editar evento"
                        : "Añadir evento"}
                </h2>

                <div className="form-grid">
                    <label>
                        Tipo de evento
                        <select
                            value={eventType}
                            onChange={(event) =>
                                setEventType(
                                    event.target.value as CustomEventType,
                                )
                            }
                        >
                            <option value="FalloComponente">
                                Fallo componente
                            </option>
                            <option value="RecuperacionComponente">
                                Recuperación componente
                            </option>
                            <option value="Sobrecarga">Sobrecarga</option>
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
                                setSelectedComponentId(event.target.value)
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

                    {(eventType === "FalloComponente" ||
                        eventType === "RecuperacionComponente") && (
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

                    {eventType === "Sobrecarga" && (
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

                    {eventType === "ConmutacionFuente" && (
                        <>
                            <label>
                                Fuente origen
                                <input
                                    value={sourceOrigin}
                                    onChange={(event) =>
                                        setSourceOrigin(event.target.value)
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

                    {eventType === "ParadaGenerador" && (
                        <>
                            <label>
                                Generador ID
                                <input
                                    value={generatorId}
                                    onChange={(event) =>
                                        setGeneratorId(event.target.value)
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

                    {eventType === "SalidaReserva" && (
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

                <button type="button" onClick={onSave}>
                    {editingEventIndex !== null
                        ? "Guardar cambios"
                        : "Añadir evento al escenario"}
                </button>

                <button type="button" onClick={onCancel}>
                    Cancelar
                </button>
            </div>
        </div>
    )
}