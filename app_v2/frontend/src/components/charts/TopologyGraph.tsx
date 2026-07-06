import {
    Background,
    Controls,
    MarkerType,
    MiniMap,
    ReactFlow,
    Position,
} from "@xyflow/react"
import { useMemo, useState, useRef } from "react"

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
    fuente_actual?: string | null
    fuente_preferida?: string | null
    fuente_respaldo?: string | null
    transferencia_bloqueada?: boolean | null
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
    fuente_actual?: string | null
    fuente_preferida?: string | null
    fuente_respaldo?: string | null
    transferencia_bloqueada?: boolean | null
}

type SnapshotTopology = {
    tiempo_s: number
    estado_global: string
    components?: SnapshotComponent[]
    active_edges?: string[]
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
    if (isReserveBlock(node) && (node.id.startsWith("sala_") || node.id.startsWith("zona_"))) {
        return "Reserva disponible"
    }
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

    if (node.id.startsWith("ups_")) {
        if (node.transferencia_bloqueada) return "Transferencia bloqueada"
        if (node.en_bateria) return "Alimentando (batería)"
        if (node.alimentando_zona) return "Alimentando"
        if (node.id.endsWith("_b")) {
            if (status === "activo" || status === "operativo") return "Respaldo disponible"
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

    if (isReserveBlock(node) && (node.id.startsWith("sala_") || node.id.startsWith("zona_"))) {
        return "#3b82f6"
    }

    if (status === "fallado" || status === "fallo" || status === "sin_alimentacion") {
        return "#ef4444"
    }

    if (node.bateria_agotada) {
        return "#ef4444"
    }
    if (node.id.startsWith("gen_dc1_")) {
        if (status === "fallado" || status === "fallo") {
            return "#ef4444"
        }

        if (status === "desconectado") {
            return "#6b7280"
        }

        if (status === "activo" || status === "operativo") {
            return "#22c55e"
        }

        if (status === "reserva") {
            return "#3b82f6"
        }
    }
    if (node.alimentando_zona) {
        return "#22c55e"
    }

    if (node.es_reserva || isReserveBlock(node)) {
        return "#3b82f6"
    }

    if (node.id.startsWith("ups_") && node.transferencia_bloqueada) {
    return "#f59e0b" // naranja: no ha podido asumir la transferencia
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
            fuente_actual:
                snapshotComponent.fuente_actual ?? node.fuente_actual,

            fuente_preferida:
                snapshotComponent.fuente_preferida ?? node.fuente_preferida,

            fuente_respaldo:
                snapshotComponent.fuente_respaldo ?? node.fuente_respaldo,
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

function getConnectedActiveEdges(
    startNodeId: string,
    topologyEdges: TopologyEdge[],
    activeEdges: Set<string>
): Set<string> {
    const highlighted = new Set<string>()

    const outgoing = new Map<string, TopologyEdge[]>()
    const incoming = new Map<string, TopologyEdge[]>()

    for (const edge of topologyEdges) {
        if (!activeEdges.has(edge.id)) continue

        if (!outgoing.has(edge.source)) outgoing.set(edge.source, [])
        outgoing.get(edge.source)!.push(edge)

        if (!incoming.has(edge.target)) incoming.set(edge.target, [])
        incoming.get(edge.target)!.push(edge)
    }

    const visitUpstream = (nodeId: string) => {
        for (const edge of incoming.get(nodeId) ?? []) {
            if (highlighted.has(edge.id)) continue
            highlighted.add(edge.id)
            visitUpstream(edge.source)
        }
    }

    const visitDownstream = (nodeId: string) => {
        for (const edge of outgoing.get(nodeId) ?? []) {
            if (highlighted.has(edge.id)) continue
            highlighted.add(edge.id)
            visitDownstream(edge.target)
        }
    }

    visitUpstream(startNodeId)
    visitDownstream(startNodeId)

    return highlighted
}

function buildFlowEdges(
    topologyEdges: TopologyEdge[],
    activeEdges: Set<string>,
    highlightedEdges: Set<string>
): Edge[] {
    return topologyEdges.map((edge) => {
        const isHighlighted = highlightedEdges.has(edge.id)
        const isActiveEdge = activeEdges.has(edge.id)

        return {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "smoothstep",
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: isHighlighted
                    ? "#facc15"
                    : isActiveEdge
                        ? "#22c55e"
                        : "#9ca3af",
            },
            style: {
                stroke: isHighlighted
                    ? "#facc15"
                    : isActiveEdge
                        ? "#22c55e"
                        : "#9ca3af",
                strokeWidth: isHighlighted ? 3.5 : isActiveEdge ? 3 : 1.4,
            },
            zIndex: isActiveEdge ? 10 : 1,
        }
    })
}
function exportGraphAsSvg(nodes: Node[], edges: Edge[], snapshotTime: number) {
    const padding = 300
    const NODE_WIDTH = 120
    const NODE_HEIGHT = 46
    const minX = Math.min(...nodes.map((n) => n.position.x)) - padding
    const minY = Math.min(...nodes.map((n) => n.position.y)) - padding
    const maxX = Math.max(...nodes.map((n) => n.position.x + NODE_WIDTH)) + padding
    const maxY = Math.max(...nodes.map((n) => n.position.y + NODE_HEIGHT)) + padding

    const width = maxX - minX
    const height = maxY - minY

    const nodeById = new Map(nodes.map((node) => [node.id, node]))

    const svgEdges = edges.map((edge) => {
        const source = nodeById.get(edge.source)
        const target = nodeById.get(edge.target)

        if (!source || !target) return ""

        const x1 = source.position.x + 60 - minX
        const y1 = source.position.y + 46 - minY
        const x2 = target.position.x + 60 - minX
        const y2 = target.position.y - minY

        const stroke =
            typeof edge.style?.stroke === "string"
                ? edge.style.stroke
                : "#9ca3af"

        const strokeWidth =
            typeof edge.style?.strokeWidth === "number"
                ? edge.style.strokeWidth
                : 1.4

        return `
            <path
                d="M ${x1} ${y1} L ${x1} ${(y1 + y2) / 2} L ${x2} ${(y1 + y2) / 2} L ${x2} ${y2}"
                fill="none"
                stroke="${stroke}"
                stroke-width="${strokeWidth}"
                marker-end="url(#arrow)"
            />
        `
    }).join("")

    const svgNodes = nodes.map((node) => {
        const label = String(node.data?.label ?? node.id)
        const lines = label.split("\n")

        const background =
            typeof node.style?.backgroundColor === "string"
                ? node.style.backgroundColor
                : "#6b7280"

        const x = node.position.x - minX
        const y = node.position.y - minY

        const NODE_WIDTH = 120
        const NODE_HEIGHT = 46

        return `
        <g>

            <clipPath id="clip-${node.id}">
                <rect
                    x="${x}"
                    y="${y}"
                    width="${NODE_WIDTH}"
                    height="${NODE_HEIGHT}"
                    rx="10"
                />
            </clipPath>

            <rect
                x="${x}"
                y="${y}"
                width="${NODE_WIDTH}"
                height="${NODE_HEIGHT}"
                rx="10"
                fill="${background}"
                stroke="rgba(255,255,255,0.45)"
                stroke-width="2"
            />

            ${lines.map((line, index) => `
                <text
                    x="${x + NODE_WIDTH / 2}"
                    y="${y + 18 + index * 12}"
                    text-anchor="middle"
                    font-family="Arial, sans-serif"
                    font-size="9"
                    font-weight="700"
                    fill="white"
                    clip-path="url(#clip-${node.id})"
                >
                    ${line}
                </text>
            `).join("")}

        </g>
    `
    }).join("")

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="${width}"
            height="${height}"
            viewBox="0 0 ${width} ${height}"
        >
            <defs>
                <marker
                    id="arrow"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                >
                    <path d="M0,0 L0,6 L9,3 z" fill="#22c55e" />
                </marker>
            </defs>

            <rect width="100%" height="100%" fill="#0f172a" />
            ${svgEdges}
            ${svgNodes}
        </svg>
    `

    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `topologia_snapshot_${snapshotTime}s.svg`
    link.click()

    URL.revokeObjectURL(url)
}

export default function TopologyGraph({ topology, snapshot }: TopologyProps) {
    const topologyNodesForSnapshot = mergeSnapshotState(
        topology.nodes,
        snapshot
    )
    const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)

    const nodes = buildFlowNodes(topologyNodesForSnapshot)

    const activeEdges = useMemo(
        () => new Set(snapshot?.active_edges ?? []),
        [snapshot?.active_edges]
    )

    const highlightedEdges = useMemo(() => {
        if (!hoveredEdgeId) {
            return new Set<string>()
        }

        const edge = topology.edges.find((e) => e.id === hoveredEdgeId)
        if (!edge) {
            return new Set<string>()
        }

        return getConnectedActiveEdges(
            edge.target,
            topology.edges,
            activeEdges
        )
    }, [hoveredEdgeId, topology.edges, activeEdges])

    const edges = buildFlowEdges(topology.edges, activeEdges, highlightedEdges)
    const topologyRef = useRef<HTMLDivElement | null>(null)
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
                <button type="button" onClick={() => exportGraphAsSvg(nodes, edges, snapshot?.tiempo_s ?? 0)}>
                    Exportar snapshot {snapshot?.tiempo_s ?? 0}s
                </button>
                <div className="topology-container" ref={topologyRef}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        fitView
                        fitViewOptions={{
                            padding: 0.15,
                            maxZoom: 0.85,
                        }}
                        onEdgeMouseEnter={(_, edge) => {
                            setHoveredEdgeId(edge.id)
                        }}
                        onEdgeMouseLeave={() => {
                            setHoveredEdgeId(null)
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