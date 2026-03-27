#OPERATIVIDAD, CAPACIDAD, N+1, PRIORIDAD DE FUENTES, ESTADO GLOBAL

from __future__ import annotations
from typing import List, Optional

import models

class MotorReglas:
    """
    Encapsula las reglas funcionales del simulador:
    - operatividad
    - conectividad
    - capacidad
    - redundancia N+1
    - selección de fuentes
    - estado global
    - generación de eventos derivados
    """
    PRIORIDAD_FUENTES = {
        "red": 1,
        "ups": 2,
        "generador": 3
    }

    def __init__(self, topologia):
        self.topologia = topologia

    #---------------------------------------------------------
    # Reglas Básicas
    #---------------------------------------------------------

    def componente_es_operativo(self, componente) -> bool:
        return componente is not None and componente.estado in {"activo", "reserva"}
    
    def componente_aporta_capacidad(self, componente) -> bool:
        return componente is not None and componente.estado == "activo"
    
    def conexión_esta_disponible (self, conexion) -> bool:
        return conexion.estado == "activa"
    
    def obtener_capacidad_componente_kw(self, componente) -> float:
        """Devuelve la capacidad útil en kW del componente"""
        
        if not self.componente_aporta_capacidad(componente):
            return 0.0
        
        for attr in ("capacidad_kw","potencia_nominal_kw","potencia_nominal_kwe"):
            if hasattr(componente, attr):
                return float(getattr(componente, attr) or 0.0)
        
        if hasattr(componente, "potencia_disponible_mw"):
            return float(componente.potencia_disponible_mw) * 1000.0
        
        if hasattr(componente, "potencia_nominal_kva"):
            # simplificación V1: se aproxima kVA ~= kW
            return float(componente.potencia_nominal_kva)

        return 0.0
        