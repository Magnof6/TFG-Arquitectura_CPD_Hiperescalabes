export interface ComponentCatalogItem {
    id: string
    label: string
    type: string
    status?: string
    criticality?: number
    is_reserve?: boolean
}

export type CustomEventType =
    | 'FalloComponente'
    | 'RecuperacionComponente'
    | 'Sobrecarga'
    | 'ConmutacionFuente'
    | 'ParadaGenerador'
    | 'SalidaReserva'

export interface CustomEventInput {
    tipo: CustomEventType
    tiempo_s: number
    objetivo_id: string

    descripcion?: string
    severidad: number

    causa?: string
    motivo?: string

    duracion_s?: number

    porcentaje_sobrecarga?: number
    carga_kw?: number
    capacidad_disponible_kw?: number

    fuente_destino_id?: string
}

export interface CustomSimulationRunRequest {
    scenario_name: string
    description?: string
    severity: string
    base_scenario_id: string
    events: CustomEventInput[]
}