import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,

} from "@xyflow/react"

import type { Edge, Node } from "@xyflow/react"

import "@xyflow/react/dist/style.css"

import "../../styles/topology.css"
import SectionCard from "../layout/SectionCard"

type TopologyNode = {
    id: string
    label: string
    type?: string
    status?: string
}

type TopologyEdge = {
    id: string
    source: string
    target: string
}

type TopologyProps = {
    topology: {
        nodes: TopologyNode[]
        edges: TopologyEdge[]
    }
}

const typeColumns: Record<string, number> = {
    emf: 0,
    red: 0,
    grid: 0,

    rmu: 1,

    transformador: 2,
    trafo: 2,
    transformer: 2,

    ups: 3,
    sts: 3,

    busbar: 4,
    barra: 4,
    cuadro: 4,

    sala_it: 5,
    sala: 5,
    it_room: 5,

    zona_it: 6,
    zona: 6,
    zone: 6,
}

function normalizeType(type?: string): string {
    return type?.toLowerCase().trim() || "default"
}

function getNodeColumn(type?: string): number {
    const normalizedType = normalizeType(type)
    return typeColumns[normalizedType] ?? 7
}

function getNodeColor(status?: string): string {
    switch (status?.toLowerCase()) {
        case "operativo":
        case "activo":
            return "#22c55e"

        case "degradado":
            return "#f59e0b"

        case "fallado":
        case "fallo":
            return "#ef4444"

        case "reserva":
        case "reserva_en_uso":
            return "#3b82f6"

        case "desconectado":
        case "mantenimiento":
            return "#6b7280"

        default:
            return "#6b7280"
    }
}

function getNodeBorderColor(status?: string): string {
    switch (status?.toLowerCase()) {
        case "operativo":
        case "activo":
            return "#86efac"

        case "degradado":
            return "#fcd34d"

        case "fallado":
        case "fallo":
            return "#fca5a5"

        case "reserva":
        case "reserva_en_uso":
            return "#93c5fd"

        default:
            return "#9ca3af"
    }
}

function buildFlowNodes(topologyNodes: TopologyNode[]): Node[] {
    const columnCounters: Record<number, number> = {}

    return topologyNodes.map((node) => {
        const column = getNodeColumn(node.type)

        columnCounters[column] = (columnCounters[column] || 0) + 1

        const row = columnCounters[column] - 1

        return {
            id: node.id,

            position: {
                x: column * 220,
                y: row * 90,
            },

            data: {
                label: node.label,
            },

            style: {
                backgroundColor: getNodeColor(node.status),
                color: "#ffffff",
                border: `2px solid ${getNodeBorderColor(node.status)}`,
                borderRadius: "10px",
                padding: "10px",
                width: 150,
                minHeight: 42,
                fontSize: "12px",
                fontWeight: 600,
                textAlign: "center",
            },
        }
    })
}

function buildFlowEdges(topologyEdges: TopologyEdge[]): Edge[] {
    return topologyEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,

        animated: false,

        style: {
            stroke: "#9ca3af",
            strokeWidth: 2,
        },
    }))
}

export default function TopologyGraph({ topology }: TopologyProps) {
    const nodes = buildFlowNodes(topology.nodes)
    const edges = buildFlowEdges(topology.edges)

    return (
        <SectionCard title="Topología eléctrica">
            <div className="topology-container">
                <ReactFlow nodes={nodes} edges={edges} fitView>
                    <Background />
                    <Controls position="bottom-left" />
                    <MiniMap
                        pannable
                        zoomable
                        position="bottom-right"
                    />
                </ReactFlow>
            </div>
        </SectionCard>
    )
}