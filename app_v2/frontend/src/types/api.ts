//Definimos los tipode de script básicos

export interface ScenarioResponse {
    id: string
    name: string
}

export interface SimulationRunRequest {
    scenario_id: string
}

export interface TopologyNode {
    id: string
    label: string
    type: string
    status: string
    criticality: number
    is_reserve: boolean
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