import type { SimulationKpiResponse } from "../../types/api"

interface Props {
    kpis: SimulationKpiResponse
}

export default function KpiPanel({ kpis }: Props) {
    return (
        <section>
            <h2>KPIs</h2>

            <ul>
                <li>Estado final: {kpis.estado_global_final}</li>
                <li>Tiempo final: {kpis.tiempo_final_s} s</li>
                <li>Carga total: {kpis.carga_total_kw} kW</li>
                <li>Carga servida: {kpis.carga_servida_kw} kW</li>
                <li>Carga perdida: {kpis.carga_perdida_kw} kW</li>
                <li>Porcentaje servido: {kpis.porcentaje_carga_servida.toFixed(2)}%</li>
                <li>Capacidad entregable: {kpis.capacidad_entregable_kw} kW</li>
                <li>Capacidad total activa: {kpis.capacidad_total_activa_kw} kW</li>
                <li>Componentes fallados: {kpis.num_componentes_fallados}</li>
                <li>Reservas en uso: {kpis.num_reservas_en_uso}</li>
                <li>Eventos procesados: {kpis.num_eventos_procesados}</li>
                <li>Snapshots: {kpis.num_snapshots}</li>
                <li>Tiempo operativo: {kpis.tiempo_operativo_s} s</li>
                <li>Tiempo degradado: {kpis.tiempo_degradado_s} s</li>
                <li>Tiempo fallado: {kpis.tiempo_fallado_s} s</li>
            </ul>
        </section>
    )
}