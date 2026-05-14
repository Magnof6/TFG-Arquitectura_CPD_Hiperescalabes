//Definimos los tipode de script básicos
export interface ScenarioResponse {
    id: string
    name: string
}

export interface SimulationRunRequest {
    scenario_id: string
}

export interface SimulationKpiResponse {
    estado_global_final: string
    tiempo_final_s: number
    carga_total_kw: number
    carga_servida_kw: number
    carga_perdida_kw: number
    porcentaje_carga_servida: number
    capacidad_entregable_kw: number
    capacidad_total_activa_kw: number
    num_componentes_fallados: number
    num_reservas_en_uso: number
    num_eventos_procesados: number
    num_snapshots: number
    tiempo_operativo_s: number
    tiempo_degradado_s: number
    tiempo_fallado_s: number
}

export interface EventResponse {
    tiempo_s: number
    tipo_evento: string
    objetivo_id: string
    descripcion: string
    estado_global_antes: string
    estado_global_despues: string
}

export interface SnapshotResponse {
    tiempo_s: number
    estado_global: string
    carga_total_kw: number
    carga_servida_kw: number
    carga_perdida_kw: number
    capacidad_entregable_kw: number
    capacidad_total_activa_kw: number
    num_componentes_fallados: number
    num_componentes_reserva_en_uso: number
    num_salas_degradadas: number
    num_salas_sin_servicio: number
}

export interface ComponentResponse {
    id: string
    nombre: string
    tipo: string
    estado: string
    criticidad: number | null
    es_reserva: boolean | null
    capacidad_kw: number | null
    en_bateria: boolean | null
    alimentando_zona: boolean | null
    bateria_agotada: boolean | null
}

export interface TopologyNode {
    id: string
    label: string
    type: string
    status: string
    criticality: number | null
    is_reserve: boolean | null
}

export interface TopologyEdge {
    id: string
    source: string
    target: string
    type: string
    status: string
    capacity_kw: number
}

export interface TopologyResponse {
    nodes: TopologyNode[]
    edges: TopologyEdge[]
}

export interface SimulationResultResponse {
    scenario_id: string
    kpis: SimulationKpiResponse
    events: EventResponse[]
    snapshots: SnapshotResponse[]
    components: ComponentResponse[]
    topology: TopologyResponse
}