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
    duracion_s?: number
    objetivo_id: string
    descripcion: string
    severidad: number

    causa?: string

    carga_kw?: number
    capacidad_disponible_kw?: number

    fuente_origen?: string
    fuente_destino?: string

    generador_id?: string
    motivo?: string

    componente_reserva_id?: string
}
//Payload que se envía al backend para ejecutar una simulación personalizada
export interface CustomSimulationRunRequest {
    scenario_name: string
    description?: string
    severity: string
    base_scenario_id: string
    events: CustomEventInput[]
}

//Escenario acumulado en el frontend, antes de ser enviado al backend para su ejecución
export interface CustomScenarioDraft { 
    id: string
    name: string
    description?: string
    severity: string
    base_scenario_id: string
    events: CustomEventInput[]
    source: 'custom'
}