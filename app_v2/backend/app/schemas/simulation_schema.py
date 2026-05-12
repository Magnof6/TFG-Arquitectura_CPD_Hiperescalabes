from pydantic import BaseModel
from typing import List

from app.schemas.snapshot_schema import SnapshotResponse
from app.schemas.event_schema import EventResponse
from app.schemas.component_schema import ComponentResponse
from app.schemas.topology_schema import TopologyResponse


class SimulationRunRequest(BaseModel):
    scenario_id: str


class SimulationKpiResponse(BaseModel):
    estado_global_final: str
    tiempo_final_s: float
    carga_total_kw: float
    carga_servida_kw: float
    carga_perdida_kw: float
    porcentaje_carga_servida: float
    capacidad_entregable_kw: float
    capacidad_total_activa_kw: float
    num_componentes_fallados: int
    num_reservas_en_uso: int
    num_eventos_procesados: int
    num_snapshots: int
    tiempo_operativo_s: float
    tiempo_degradado_s: float
    tiempo_fallado_s: float


class SimulationResultResponse(BaseModel):
    scenario_id: str
    kpis: SimulationKpiResponse
    events: List[EventResponse]
    snapshots: List[SnapshotResponse]
    components: List[ComponentResponse]
    topology: TopologyResponse