from pydantic import BaseModel


class EventResponse(BaseModel):
    tiempo_s: float
    tipo_evento: str
    objetivo_id: str
    descripcion: str
    estado_global_antes: str
    estado_global_despues: str