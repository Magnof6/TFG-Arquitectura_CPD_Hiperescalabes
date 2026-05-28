from typing import Literal, Optional

from pydantic import BaseModel, Field


TipoEventoCustom = Literal[
    "FalloComponente",
    "RecuperacionComponente",
    "Sobrecarga",
    "ConmutacionFuente",
    "ParadaGenerador",
    "SalidaReserva",
]


class CustomEventInput(BaseModel):
    tipo: TipoEventoCustom
    tiempo_s: float = Field(ge=0)
    objetivo_id: str
    descripcion: Optional[str] = None
    severidad: int = Field(default=3, ge=1, le=5)

    causa: Optional[str] = None
    porcentaje_sobrecarga: Optional[float] = None
    duracion_s: Optional[float] = None
    fuente_destino_id: Optional[str] = None
    motivo: Optional[str] = None
    carga_kw: Optional[float] = None
    capacidad_disponible_kw: Optional[float] = None


class CustomSimulationRunRequest(BaseModel):
    scenario_name: str
    description: Optional[str] = None
    severity: str = "medium"
    base_scenario_id: str = "escenario_dc1_sin_eventos"
    events: list[CustomEventInput]