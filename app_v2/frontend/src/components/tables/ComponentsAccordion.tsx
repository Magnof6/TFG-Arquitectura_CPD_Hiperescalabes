import { useState } from "react"

import type { ComponentResponse } from "../../types/api"
import StatusBadge from "../ui/StatusBadge"

interface Props {
    components: ComponentResponse[]
}

export default function ComponentsAccordion({
    components,
}: Props) {
    const [selectedComponent, setSelectedComponent] =
        useState<ComponentResponse | null>(null)

    const [expandedComponentTypes, setExpandedComponentTypes] =
        useState<string[]>([])

    const groupedComponents =
        components.reduce<Record<string, ComponentResponse[]>>(
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

    return (
        <section style={{ marginTop: "2rem" }}>
            <h2>Componentes</h2>

            {Object.entries(groupedComponents).map(
                ([type, components]) => (
                    <div
                        key={type}
                        style={{
                            marginBottom: "1rem",
                            backgroundColor: "#1f2937",
                            border: "1px solid #374151",
                        }}
                    >
                        <button
                            onClick={() =>
                                setExpandedComponentTypes((current) =>
                                    current.includes(type)
                                        ? current.filter((item) => item !== type)
                                        : [...current, type]
                                )
                            }
                            style={{
                                width: "100%",
                                padding: "0.75rem",
                                textAlign: "left",
                                backgroundColor: "#111827",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                fontWeight: "bold",
                            }}
                        >
                            {expandedComponentTypes.includes(type)
                                ? "▼"
                                : "▶"}{" "}
                            {type} ({components.length})
                        </button>

                        {expandedComponentTypes.includes(type) && (
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                }}
                            >
                                <thead>
                                    <tr>
                                        <th
                                            style={{
                                                textAlign: "left",
                                                padding: "0.5rem",
                                            }}
                                        >
                                            Nombre
                                        </th>

                                        <th
                                            style={{
                                                textAlign: "left",
                                                padding: "0.5rem",
                                            }}
                                        >
                                            Estado
                                        </th>

                                        <th
                                            style={{
                                                textAlign: "left",
                                                padding: "0.5rem",
                                            }}
                                        >
                                            Criticidad
                                        </th>

                                        <th
                                            style={{
                                                textAlign: "left",
                                                padding: "0.5rem",
                                            }}
                                        >
                                            Reserva
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {components.map((component) => (
                                        <>
                                            <tr
                                                key={component.id}
                                                onClick={() =>
                                                    setSelectedComponent((current) =>
                                                        current?.id === component.id
                                                            ? null
                                                            : component
                                                    )
                                                }
                                                style={{
                                                    cursor: "pointer",
                                                    backgroundColor:
                                                        selectedComponent?.id ===
                                                            component.id
                                                            ? "#374151"
                                                            : "transparent",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding: "0.5rem",
                                                        borderTop:
                                                            "1px solid #374151",
                                                    }}
                                                >
                                                    {component.nombre}
                                                </td>

                                                <td
                                                    style={{
                                                        padding: "0.5rem",
                                                        borderTop:
                                                            "1px solid #374151",
                                                    }}
                                                >
                                                    <StatusBadge status={component.estado} />
                                                </td>

                                                <td
                                                    style={{
                                                        padding: "0.5rem",
                                                        borderTop:
                                                            "1px solid #374151",
                                                    }}
                                                >
                                                    {component.criticidad ?? "-"}
                                                </td>

                                                <td
                                                    style={{
                                                        padding: "0.5rem",
                                                        borderTop:
                                                            "1px solid #374151",
                                                    }}
                                                >
                                                    {component.es_reserva
                                                        ? "Sí"
                                                        : "No"}
                                                </td>
                                            </tr>

                                            {selectedComponent?.id ===
                                                component.id && (
                                                    <tr>
                                                        <td
                                                            colSpan={4}
                                                            style={{
                                                                padding: "1rem",
                                                                backgroundColor:
                                                                    "#111827",
                                                            }}
                                                        >
                                                            <h4>
                                                                Detalle componente
                                                            </h4>

                                                            <p>
                                                                <strong>ID:</strong>{" "}
                                                                {component.id}
                                                            </p>

                                                            <p>
                                                                <strong>Nombre:</strong>{" "}
                                                                {component.nombre}
                                                            </p>

                                                            <p>
                                                                <strong>Tipo:</strong>{" "}
                                                                {component.tipo}
                                                            </p>

                                                            <p>
                                                                <strong>Estado:</strong>{" "}
                                                                <StatusBadge status={component.estado} />
                                                            </p>

                                                            <h5>
                                                                Campos específicos
                                                            </h5>

                                                            <table
                                                                style={{
                                                                    width: "100%",
                                                                    borderCollapse:
                                                                        "collapse",
                                                                }}
                                                            >
                                                                <tbody>
                                                                    {Object.entries(
                                                                        component.specific
                                                                    ).map(
                                                                        ([key, value]) => (
                                                                            <tr key={key}>
                                                                                <td
                                                                                    style={{
                                                                                        padding:
                                                                                            "0.5rem",
                                                                                        fontWeight:
                                                                                            "bold",
                                                                                    }}
                                                                                >
                                                                                    {key}
                                                                                </td>

                                                                                <td
                                                                                    style={{
                                                                                        padding:
                                                                                            "0.5rem",
                                                                                    }}
                                                                                >
                                                                                    {String(
                                                                                        value
                                                                                    )}
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
                )
            )}
        </section>
    )
}