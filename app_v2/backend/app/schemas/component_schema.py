#Es el snapshot que recibirá el front end en formato JSON
from pydantic import BaseModel
from typing import Any, Optional


class ComponentResponse(BaseModel):
    id: str
    nombre: str
    tipo: str
    estado: str
    criticidad: Optional[int] = None
    es_reserva: Optional[bool] = None
    capacidad_kw: Optional[float] = None
    en_bateria: Optional[bool] = None
    alimentando_zona: Optional[bool] = None
    bateria_agotada: Optional[bool] = None
    fuente_actual: Optional[str] = None
    fuente_preferida: Optional[str] = None
    fuente_respaldo: Optional[str] = None
    transferencia_bloqueada: Optional[bool] = None
    specific: dict[str, Any] = {}  # Para campos específicos de cada tipo de componente