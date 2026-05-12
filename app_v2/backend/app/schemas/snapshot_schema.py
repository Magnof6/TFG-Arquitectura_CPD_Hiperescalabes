from pydantic import BaseModel


class SnapshotResponse(BaseModel):
    tiempo_s: float
    estado_global: str
    carga_total_kw: float
    carga_servida_kw: float
    carga_perdida_kw: float
    capacidad_entregable_kw: float
    capacidad_total_activa_kw: float
    num_componentes_fallados: int
    num_componentes_reserva_en_uso: int
    num_salas_degradadas: int
    num_salas_sin_servicio: int