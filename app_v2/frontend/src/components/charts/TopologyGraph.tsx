import {
    Background,
    Controls,
    MarkerType,
    MiniMap,
    ReactFlow,
    Position
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
    es_reserva?: boolean | null
    alimentando_zona?: boolean | null
    en_bateria?: boolean | null
    bateria_agotada?: boolean | null
}

type TopologyEdge = {
    id: string
    source: string
    target: string
}

type SnapshotComponent = {
    id: string
    nombre?: string
    label?: string
    tipo?: string
    type?: string
    estado?: string
    status?: string
    es_reserva?: boolean | null
    alimentando_zona?: boolean | null
    en_bateria?: boolean | null
    bateria_agotada?: boolean | null
}
type SnapshotTopology = {
    tiempo_s: number
    estado_global: string
    components?: SnapshotComponent[]
}

type TopologyProps = {
    topology: {
        nodes: TopologyNode[]
        edges: TopologyEdge[]
    }
    snapshot?: SnapshotTopology | null
}

function normalize(value?: string): string {
    return value?.toLowerCase().trim() || ""
}

function getStatusLabel(node: TopologyNode): string {
    const status = normalize(node.status)
    if (isReserveBlock(node)) return "Reserva"

    if (node.id.startsWith("sala_")) {
        if (status === "alimentado" || status === "alimentada") return "Recibiendo energía"
        if (status === "degradada") return "Alimentación degradada"
        if (status === "sin_alimentacion") return "Sin alimentación"
    }

    if (node.id.startsWith("zona_")) {
        if (status === "alimentado") return "Recibiendo energía"
        if (status === "degradada") return "Zona degradada"
        if (status === "sin_alimentacion") return "Sin alimentación"
    }

    if (node.id.startsWith("ups_") && node.id.endsWith("_b")) {
        if (status === "activo" || status === "operativo") {
            return "Respaldo disponible"
        }
    }

    switch (status) {
        case "activo":
        case "operativo":
            return "Operativo"
        case "reserva":
        case "reserva_en_uso":
            return "Reserva"
        case "degradado":
        case "degradada":
            return "Degradado"
        case "fallado":
        case "fallo":
            return "Fallado"
        case "mantenimiento":
            return "Mantenimiento"
        case "desconectado":
            return "Desconectado"
        default:
            return node.status || "Desconocido"
    }
}

function isReserveBlock(node: TopologyNode): boolean {
    return getBlockNumber(node) === 7
}

function getNodeColor(node: TopologyNode): string {
    const status = normalize(node.status)

    if (status === "fallado" || status === "fallo" || status === "sin_alimentacion") {
        return "#ef4444"
    }

    if (node.bateria_agotada) {
        return "#ef4444"
    }

    if (node.alimentando_zona) {
        return "#22c55e"
    }

    if (node.es_reserva || isReserveBlock(node)) {
        return "#3b82f6"
    }

    if (
        node.id.startsWith("ups_") &&
        node.id.endsWith("_b") &&
        (status === "activo" || status === "operativo")
    ) {
        return "#3b82f6"
    }

    if (
        status === "activo" ||
        status === "operativo" ||
        status === "alimentado" ||
        status === "alimentada"
    ) {
        return "#22c55e"
    }

    if (status === "degradado" || status === "degradada") {
        return "#f59e0b"
    }

    if (status === "reserva" || status === "reserva_en_uso") {
        return "#3b82f6"
    }

    return "#6b7280"
}

function getNodeLabel(node: TopologyNode): string {
    return `${node.label || node.id}\n${getStatusLabel(node)}`
}

function getModuleNumber(node: TopologyNode): number {
    const text = normalize(`${node.id} ${node.label}`)

    const match =
        text.match(/rmu_modulo_(\d+)/) ||
        text.match(/m[oó]dulo\s*(\d+)/) ||
        text.match(/\bm(\d+)_\d+/)

    return match ? Number(match[1]) : 1
}

function getBlockNumber(node: TopologyNode): number {
    const text = normalize(`${node.id} ${node.label}`)

    const match =
        text.match(/\bm\d+_(\d+)/) ||
        text.match(/bloque\s*(\d+)/)

    return match ? Number(match[1]) : 1
}

function getGeneratorNumber(node: TopologyNode): number {
    const text = normalize(`${node.id} ${node.label}`)
    const match = text.match(/gen_dc1_(\d+)/) || text.match(/generador dc1\s*(\d+)/)

    return match ? Number(match[1]) : 1
}

function getPosition(node: TopologyNode): { x: number; y: number } {
    const id = normalize(node.id)
    const text = normalize(`${node.id} ${node.label} ${node.type}`)

    const centerX = 900
    const blockSpacing = 260
    const moduleSpacing = 1900

    if (id === "red") return { x: centerX, y: 0 }
    if (id === "emf_1") return { x: centerX, y: 110 }
    if (id === "set_cpd_400_66") return { x: centerX, y: 220 }

    if (id === "trafo_400_66_1") return { x: centerX - 220, y: 340 }
    if (id === "trafo_400_66_2") return { x: centerX, y: 340 }
    if (id === "trafo_400_66_3") return { x: centerX + 220, y: 340 }

    if (id === "set_dc1_66_11") return { x: centerX, y: 460 }
    if (id === "barra_11kv_dc1") return { x: centerX, y: 580 }

    if (text.includes("generador")) {
        const generatorNumber = getGeneratorNumber(node)
        const col = (generatorNumber - 1) % 7
        const row = Math.floor((generatorNumber - 1) / 7)

        return {
            x: -500 + col * 150,
            y: 500 + row * 105,
        }
    }
    if (id.startsWith("rmu_modulo_")) {
        const moduleNumber = getModuleNumber(node)

        return {
            x: centerX + (moduleNumber - 2) * moduleSpacing,
            y: 900,
        }
    }

    const moduleNumber = getModuleNumber(node)
    const blockNumber = getBlockNumber(node)
    const moduleCenterOffset = 3 * blockSpacing

    const moduleStartX =
        centerX +
        (moduleNumber - 2) * moduleSpacing -
        moduleCenterOffset

    const blockX = moduleStartX + (blockNumber - 1) * blockSpacing
    const blockTopY = 1050

    if (id.startsWith("rmu_m")) return { x: blockX, y: blockTopY }
    if (id.startsWith("trafo_m")) return { x: blockX, y: blockTopY + 120 }
    if (id.includes("_a") && id.startsWith("ups_m")) return { x: blockX - 70, y: blockTopY + 250 }
    if (id.includes("_b") && id.startsWith("ups_m")) return { x: blockX + 70, y: blockTopY + 250 }
    if (id.startsWith("sts_m")) return { x: blockX, y: blockTopY + 390 }
    if (id.startsWith("bus_m")) return { x: blockX, y: blockTopY + 620 }
    if (id.startsWith("sala_m")) return { x: blockX, y: blockTopY + 740 }
    if (id.startsWith("zona_m")) return { x: blockX, y: blockTopY + 860 }

    return { x: centerX + 700, y: 0 }
}

function mergeSnapshotState(
    topologyNodes: TopologyNode[],
    snapshot?: SnapshotTopology | null
): TopologyNode[] {
    if (!snapshot?.components) {
        return topologyNodes
    }

    const snapshotById = new Map(
        snapshot.components.map((component) => [
            component.id,
            component,
        ])
    )

    return topologyNodes.map((node) => {
        const snapshotComponent = snapshotById.get(node.id)

        if (!snapshotComponent) {
            return node
        }

        return {
            ...node,
            label:
                node.label ||
                snapshotComponent.label ||
                snapshotComponent.nombre ||
                node.id,
            type:
                node.type ||
                snapshotComponent.type ||
                snapshotComponent.tipo,
            status:
                snapshotComponent.status ||
                snapshotComponent.estado ||
                node.status,
            es_reserva:
                snapshotComponent.es_reserva ?? node.es_reserva,

            alimentando_zona:
                snapshotComponent.alimentando_zona ?? node.alimentando_zona,

            en_bateria:
                snapshotComponent.en_bateria ?? node.en_bateria,

            bateria_agotada:
                snapshotComponent.bateria_agotada ?? node.bateria_agotada,
        }
    })
}

function buildFlowNodes(topologyNodes: TopologyNode[]): Node[] {
    return topologyNodes.map((node) => {
        const isGenerator = node.id.startsWith("gen_dc1_")
        const generatorNumber = getGeneratorNumber(node)
        const generatorRow = Math.floor((generatorNumber - 1) / 7)

        return {
            id: node.id,
            position: getPosition(node),

            sourcePosition:
                isGenerator && generatorRow === 1
                    ? Position.Top
                    : Position.Bottom,

            targetPosition:
                isGenerator && generatorRow === 1
                    ? Position.Bottom
                    : Position.Top,

            data: {
                label: getNodeLabel(node),
            },

            style: {
                backgroundColor: getNodeColor(node),
                color: "#ffffff",
                border: "2px solid rgba(255, 255, 255, 0.35)",
                borderRadius: "10px",
                padding: "8px",
                width: 120,
                minHeight: 46,
                fontSize: "10px",
                fontWeight: 600,
                textAlign: "center",
                whiteSpace: "pre-line",
            },
        }
    })
}

function buildFlowEdges(topologyEdges: TopologyEdge[]): Edge[] {
    return topologyEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#9ca3af",
        },
        style: {
            stroke: "#9ca3af",
            strokeWidth: 1.4,
        },
    }))
}

export default function TopologyGraph({ topology, snapshot }: TopologyProps) {
    const topologyNodesForSnapshot = mergeSnapshotState(
        topology.nodes,
        snapshot
    )
    const nodes = buildFlowNodes(topologyNodesForSnapshot)
    const edges = buildFlowEdges(topology.edges)

    return (
        <SectionCard title="Topología eléctrica">
            <div className="topology-wrapper">
                <div className="topology-legend">
                    <span><i className="legend-dot legend-green" /> Operativo / recibiendo energía</span>
                    <span><i className="legend-dot legend-amber" /> Degradado</span>
                    <span><i className="legend-dot legend-red" /> Fallado / sin alimentación</span>
                    <span><i className="legend-dot legend-blue" /> Reserva</span>
                    <span><i className="legend-dot legend-gray" /> Desconectado / desconocido</span>
                </div>

                <div className="topology-container">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        fitView
                        fitViewOptions={{
                            padding: 0.15,
                            maxZoom: 0.85,
                        }}
                    >
                        <Background />
                        <Controls position="bottom-left" />
                        <MiniMap pannable zoomable position="bottom-right" />
                    </ReactFlow>
                </div>
            </div>
        </SectionCard>
    )
}