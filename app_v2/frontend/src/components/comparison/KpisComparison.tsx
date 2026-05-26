import type { SimulationResultResponse } from "../../types/api"

import SectionCard from "../layout/SectionCard"
import StatusBadge from "../ui/StatusBadge"

interface Props {
    resultA: SimulationResultResponse
    resultB: SimulationResultResponse
}

function formatPercent(value: number) {
    return `${value.toFixed(2)}%`
}

function formatNumber(value: number) {
    return value.toLocaleString("es-ES")
}

export default function KpisComparison({ resultA, resultB }: Props) {
    const kpiRows = [
        {
            label: "Estado final",
            a: <StatusBadge status={resultA.kpis.estado_global_final} />,
            b: <StatusBadge status={resultB.kpis.estado_global_final} />,
            diff:
                resultA.kpis.estado_global_final === resultB.kpis.estado_global_final
                    ? "Igual"
                    : "Distinto",
        },
        {
            label: "Tiempo final",
            a: `${resultA.kpis.tiempo_final_s}s`,
            b: `${resultB.kpis.tiempo_final_s}s`,
            diff: `${Math.abs(resultB.kpis.tiempo_final_s - resultA.kpis.tiempo_final_s)}s`,
        },
        {
            label: "Carga total",
            a: `${formatNumber(resultA.kpis.carga_total_kw)} kW`,
            b: `${formatNumber(resultB.kpis.carga_total_kw)} kW`,
            diff: `${formatNumber(Math.abs(resultB.kpis.carga_total_kw - resultA.kpis.carga_total_kw))} kW`,
        },
        {
            label: "Carga servida",
            a: `${formatNumber(resultA.kpis.carga_servida_kw)} kW`,
            b: `${formatNumber(resultB.kpis.carga_servida_kw)} kW`,
            diff: `${formatNumber(Math.abs(resultB.kpis.carga_servida_kw - resultA.kpis.carga_servida_kw))} kW`,
        },
        {
            label: "Carga perdida",
            a: `${formatNumber(resultA.kpis.carga_perdida_kw)} kW`,
            b: `${formatNumber(resultB.kpis.carga_perdida_kw)} kW`,
            diff: `${formatNumber(Math.abs(resultB.kpis.carga_perdida_kw - resultA.kpis.carga_perdida_kw))} kW`,
        },
        {
            label: "% carga servida",
            a: formatPercent(resultA.kpis.porcentaje_carga_servida),
            b: formatPercent(resultB.kpis.porcentaje_carga_servida),
            diff: formatPercent(
                Math.abs(
                    resultB.kpis.porcentaje_carga_servida -
                        resultA.kpis.porcentaje_carga_servida
                )
            ),
        },
        {
            label: "Capacidad entregable",
            a: `${formatNumber(resultA.kpis.capacidad_entregable_kw)} kW`,
            b: `${formatNumber(resultB.kpis.capacidad_entregable_kw)} kW`,
            diff: `${formatNumber(Math.abs(resultB.kpis.capacidad_entregable_kw - resultA.kpis.capacidad_entregable_kw))} kW`,
        },
        {
            label: "Capacidad total activa",
            a: `${formatNumber(resultA.kpis.capacidad_total_activa_kw)} kW`,
            b: `${formatNumber(resultB.kpis.capacidad_total_activa_kw)} kW`,
            diff: `${formatNumber(Math.abs(resultB.kpis.capacidad_total_activa_kw - resultA.kpis.capacidad_total_activa_kw))} kW`,
        },
        {
            label: "Componentes fallados",
            a: resultA.kpis.num_componentes_fallados,
            b: resultB.kpis.num_componentes_fallados,
            diff: Math.abs(
                resultB.kpis.num_componentes_fallados -
                    resultA.kpis.num_componentes_fallados
            ),
        },
        {
            label: "Reservas en uso",
            a: resultA.kpis.num_reservas_en_uso,
            b: resultB.kpis.num_reservas_en_uso,
            diff: Math.abs(
                resultB.kpis.num_reservas_en_uso -
                    resultA.kpis.num_reservas_en_uso
            ),
        },
        {
            label: "Eventos procesados",
            a: resultA.kpis.num_eventos_procesados,
            b: resultB.kpis.num_eventos_procesados,
            diff: Math.abs(
                resultB.kpis.num_eventos_procesados -
                    resultA.kpis.num_eventos_procesados
            ),
        },
        {
            label: "Snapshots",
            a: resultA.kpis.num_snapshots,
            b: resultB.kpis.num_snapshots,
            diff: Math.abs(resultB.kpis.num_snapshots - resultA.kpis.num_snapshots),
        },
        {
            label: "Tiempo operativo",
            a: `${resultA.kpis.tiempo_operativo_s}s`,
            b: `${resultB.kpis.tiempo_operativo_s}s`,
            diff: `${Math.abs(resultB.kpis.tiempo_operativo_s - resultA.kpis.tiempo_operativo_s)}s`,
        },
        {
            label: "Tiempo degradado",
            a: `${resultA.kpis.tiempo_degradado_s}s`,
            b: `${resultB.kpis.tiempo_degradado_s}s`,
            diff: `${Math.abs(resultB.kpis.tiempo_degradado_s - resultA.kpis.tiempo_degradado_s)}s`,
        },
        {
            label: "Tiempo fallado",
            a: `${resultA.kpis.tiempo_fallado_s}s`,
            b: `${resultB.kpis.tiempo_fallado_s}s`,
            diff: `${Math.abs(resultB.kpis.tiempo_fallado_s - resultA.kpis.tiempo_fallado_s)}s`,
        },
    ]

    return (
        <SectionCard title="KPIs comparados">
            <table className="table-container">
                <thead>
                    <tr>
                        <th className="table-header">Métrica</th>
                        <th className="table-header">Escenario A</th>
                        <th className="table-header">Escenario B</th>
                        <th className="table-header">Diferencia</th>
                    </tr>
                </thead>

                <tbody>
                    {kpiRows.map((row) => (
                        <tr key={row.label}>
                            <td className="table-cell">{row.label}</td>
                            <td className="table-cell">{row.a}</td>
                            <td className="table-cell">{row.b}</td>
                            <td className="table-cell">{row.diff}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </SectionCard>
    )
}