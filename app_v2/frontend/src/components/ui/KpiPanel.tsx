import type { SimulationKpiResponse } from "../../types/api"

import SectionCard from "../layout/SectionCard"
import KpiCard from "./KpiCard"
import StatusBadge from "./StatusBadge"

interface Props {
    kpis: SimulationKpiResponse
}

export default function KpiPanel({ kpis }: Props) {
    return (
        <SectionCard title="KPIs">
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "1rem",
                }}
            >
                <KpiCard title="Estado final" value={<StatusBadge status={kpis.estado_global_final} />} />
                <KpiCard title="Tiempo final" value={kpis.tiempo_final_s} unit="s" />
                <KpiCard title="Carga total" value={kpis.carga_total_kw} unit="kW" />
                <KpiCard title="Carga servida" value={kpis.carga_servida_kw} unit="kW" />
                <KpiCard title="Carga perdida" value={kpis.carga_perdida_kw} unit="kW" />
                <KpiCard title="Porcentaje servido" value={kpis.porcentaje_carga_servida.toFixed(2)} unit="%" />
                <KpiCard title="Capacidad entregable" value={kpis.capacidad_entregable_kw} unit="kW" />
                <KpiCard title="Capacidad total activa" value={kpis.capacidad_total_activa_kw} unit="kW" />
                <KpiCard title="Componentes fallados" value={kpis.num_componentes_fallados} />
                <KpiCard title="Reservas en uso" value={kpis.num_reservas_en_uso} />
                <KpiCard title="Eventos procesados" value={kpis.num_eventos_procesados} />
                <KpiCard title="Snapshots" value={kpis.num_snapshots} />
                <KpiCard title="Tiempo operativo" value={kpis.tiempo_operativo_s} unit="s" />
                <KpiCard title="Tiempo degradado" value={kpis.tiempo_degradado_s} unit="s" />
                <KpiCard title="Tiempo fallado" value={kpis.tiempo_fallado_s} unit="s" />
            </div>
        </SectionCard>
    )
}