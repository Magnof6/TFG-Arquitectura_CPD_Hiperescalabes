#MOTOR DE SIMULACIÓN

# engine.py

from __future__ import annotations

import heapq
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from models import (
    Evento,
    SnapshotSistema,
    RegistroEvento,
)
from events import ProcesadorEventos


@dataclass(order=True)
class EventoProgramado:
    """
    Wrapper para mantener los eventos ordenados por tiempo y prioridad
    dentro de una cola heap.
    """
    tiempo_s: float
    prioridad: int
    secuencia: int
    evento: Evento = field(compare=False)


@dataclass
class EstadoSimulacion:
    """
    Estado vivo de la simulación.
    """
    tiempo_actual_s: float
    estado_global: str

    componentes: Dict[str, object]
    salas_it: Dict[str, object]
    zonas_it: Dict[str, object]
    cargas_it: Dict[str, object]

    topologia: object
    grupos_redundancia: Dict[str, object]

    snapshots: List[SnapshotSistema] = field(default_factory=list)
    registro_eventos: List[RegistroEvento] = field(default_factory=list)

