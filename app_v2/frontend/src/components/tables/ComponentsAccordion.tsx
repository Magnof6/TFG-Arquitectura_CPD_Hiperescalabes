import { useMemo, useState } from "react"

import type { ComponentResponse } from "../../types/api"

import SectionCard from "../layout/SectionCard"
import StatusBadge from "../ui/StatusBadge"

interface Props {
    components: ComponentResponse[]
}

export default function ComponentsAccordion({ components }: Props) {
    const [selectedComponent, setSelectedComponent] =
        useState<ComponentResponse | null>(null)

    const [expandedComponentTypes, setExpandedComponentTypes] = useState<
        string[]
    >([])

    const [selectedStatus, setSelectedStatus] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")

    const componentStatuses = useMemo(() => {
        return Array.from(
            new Set(components.map((component) => component.estado))
        ).sort()
    }, [components])

    const filteredComponents = useMemo(() => {
        return components.filter((component) => {
            const matchesStatus =
                selectedStatus === "all" || component.estado === selectedStatus

            const normalizedSearch = searchTerm.toLowerCase()

            const matchesSearch =
                component.id.toLowerCase().includes(normalizedSearch) ||
                component.nombre.toLowerCase().includes(normalizedSearch)

            return matchesStatus && matchesSearch
        })
    }, [components, selectedStatus, searchTerm])

    const groupedComponents = useMemo(() => {
        return filteredComponents.reduce<Record<string, ComponentResponse[]>>(
            (groups, component) => {
                const type = component.tipo || "Desconocido"

                if (!groups[type]) {
                    groups[type] = []
                }

                groups[type].push(component)

                return groups
            },
            {}
        )
    }, [filteredComponents])

    return (
        <SectionCard title="Componentes">
            <div className="filters-container">
                <label>
                    Buscar:{" "}
                    <input
                        className ="form-input"
                        type="text"
                        value={searchTerm}
                        placeholder="nombre o id"
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </label>

                <label>
                    Estado:{" "}
                    <select
                        className="form-select"
                        value={selectedStatus}
                        onChange={(event) => setSelectedStatus(event.target.value)}
                    >
                        <option value="all">Todos</option>

                        {componentStatuses.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </label>

                <span className="filters-counter">
                    Mostrando {filteredComponents.length} de {components.length}{" "}
                    componentes
                </span>
            </div>

            {Object.entries(groupedComponents).map(([type, components]) => (
                <div key={type} className="accordion-group">
                    <button
                        className="accordion-button"
                        onClick={() =>
                            setExpandedComponentTypes((current) =>
                                current.includes(type)
                                    ? current.filter((item) => item !== type)
                                    : [...current, type]
                            )
                        }
                    >
                        {expandedComponentTypes.includes(type) ? "▼" : "▶"} {type} (
                        {components.length})
                    </button>

                    {expandedComponentTypes.includes(type) && (
                        <table className="table-container">
                            <thead>
                                <tr>
                                    <th className="table-header">Nombre</th>
                                    <th className="table-header">Estado</th>
                                    <th className="table-header">Criticidad</th>
                                    <th className="table-header">Reserva</th>
                                </tr>
                            </thead>

                            <tbody>
                                {components.map((component) => (
                                    <>
                                        <tr
                                            key={component.id}
                                            onClick={() =>
                                                setSelectedComponent((current) =>
                                                    current?.id === component.id ? null : component
                                                )
                                            }
                                            className={
                                                selectedComponent?.id === component.id
                                                    ? "table-row-clickable table-row-selected"
                                                    : "table-row-clickable"
                                            }
                                        >
                                            <td className="table-cell">{component.nombre}</td>

                                            <td className="table-cell">
                                                <StatusBadge status={component.estado} />
                                            </td>

                                            <td className="table-cell">
                                                {component.criticidad ?? "-"}
                                            </td>

                                            <td className="table-cell">
                                                {component.es_reserva ? "Sí" : "No"}
                                            </td>
                                        </tr>

                                        {selectedComponent?.id === component.id && (
                                            <tr>
                                                <td colSpan={4} className="component-detail">
                                                    <h4>Detalle componente</h4>

                                                    <p>
                                                        <strong>ID:</strong> {component.id}
                                                    </p>

                                                    <p>
                                                        <strong>Nombre:</strong> {component.nombre}
                                                    </p>

                                                    <p>
                                                        <strong>Tipo:</strong> {component.tipo}
                                                    </p>

                                                    <p>
                                                        <strong>Estado:</strong>{" "}
                                                        <StatusBadge status={component.estado} />
                                                    </p>

                                                    <h5>Campos específicos</h5>

                                                    <table className="table-container">
                                                        <tbody>
                                                            {Object.entries(component.specific).map(
                                                                ([key, value]) => (
                                                                    <tr key={key}>
                                                                        <td className="table-cell">
                                                                            <strong>{key}</strong>
                                                                        </td>

                                                                        <td className="table-cell">
                                                                            {String(value)}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ))}
        </SectionCard>
    )
}