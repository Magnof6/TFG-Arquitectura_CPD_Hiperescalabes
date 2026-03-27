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
    
    #---------------------------------------------------------
    # Busqueda de fuentes y rutas
    #---------------------------------------------------------

    def obtener_fuentes_disponibles(self, estado) -> List[object]:
        """
        Devuelve todas las fuentes actualmente operativas

        """
        fuentes= []
        for componente in estado.componentes.values():
            tipo =  componente.tipo.lower()
            if tipo in {"redelectrica", "ups", "generador"} and self.componente_es_operativo(componente):
                fuentes.append(componente)
        return fuentes

    def tipo_fuente(self, componente) -> str:
            tipo = componente.tipo.lower()
            if tipo == "redelectrica":
                return "red"
            if tipo == "ups":
                return "ups"
            if tipo == "generador":
                return "generador"
            return "otra"

    def seleccionar_mejor_fuente(self, fuentes: List[object]) -> Optional[object]:
        fuentes_validas = [f for f in fuentes if self.tipo_fuente(f) in self.PRIORIDAD_FUENTES]
        if not fuentes_validas:
            return None
        return min(fuentes_validas, key=lambda f: self.PRIORIDAD_FUENTES[self.tipo_fuente(f)])

    def ruta_es_operativa(self, ruta: List[str], estado) -> bool:
        """
        Comprueba que todos los nodos y conexiones de una ruta estén disponibles.
        """
        if not ruta:
            return False

        for nodo_id in ruta:
            nodo = self._buscar_nodo(nodo_id, estado)
            if nodo is None:
                return False

            # Las cargas y salas no usan la misma semántica que los componentes eléctricos
            if hasattr(nodo, "estado") and nodo.__class__.__name__ not in {"SalaIT", "ZonaIT", "CargaIT"}:
                if getattr(nodo, "estado", None) in {"fallado", "mantenimiento", "desconectado"}:
                    return False

        for i in range(len(ruta) - 1):
            conexion = self.topologia.obtener_conexion(ruta[i], ruta[i + 1])
            if conexion is None or not self.conexion_esta_disponible(conexion):
                return False

        return True

    def capacidad_ruta_kw(self, ruta: List[str], estado) -> float:
        """
        La capacidad de la ruta se modela como el mínimo cuello de botella.
        """
        if not ruta:
            return 0.0

        capacidades = []

        for nodo_id in ruta:
            nodo = self._buscar_nodo(nodo_id, estado)
            if nodo is None:
                continue

            if hasattr(nodo, "tipo") and nodo.__class__.__name__ not in {"SalaIT", "ZonaIT", "CargaIT"}:
                cap = self.obtener_capacidad_componente_kw(nodo)
                if cap > 0:
                    capacidades.append(cap)

        for i in range(len(ruta) - 1):
            conexion = self.topologia.obtener_conexion(ruta[i], ruta[i + 1])
            if conexion and conexion.capacidad_kw > 0:
                capacidades.append(conexion.capacidad_kw)

        if not capacidades:
            return 0.0

        return min(capacidades)

    def buscar_rutas_validas_a_destino(self, destino_id: str, demanda_kw: float, estado) -> List[List[str]]:
        """
        Busca rutas válidas desde las fuentes disponibles hasta un destino.
        """
        rutas_validas = []
        fuentes = self.obtener_fuentes_disponibles(estado)

        for fuente in fuentes:
            rutas = self.topologia.buscar_rutas(fuente.id, destino_id)
            for ruta in rutas:
                if self.ruta_es_operativa(ruta, estado):
                    if self.capacidad_ruta_kw(ruta, estado) >= demanda_kw:
                        rutas_validas.append(ruta)

        rutas_validas.sort(
            key=lambda ruta: self.PRIORIDAD_FUENTES.get(
                self.tipo_fuente(self._buscar_nodo(ruta[0], estado)),
                999
            )
        )
        return rutas_validas   
    
    #---------------------------------------------------------
    # Alimentación de Cargas y Salas
    #---------------------------------------------------------

    def carga_esta_alimentada(self, carga, estado) -> bool:
        rutas= self.buscar_rutas_validas_a_destino(
            destino_id=carga.id,
            demanda_kw=carga.demanda_kw,
            estado=estado
        )
        return len(rutas) > 0
    
    def carga_tiene_redundancia(self, carga, estado) -> bool:
        rutas = self.buscar_rutas_validas_a_destino(
            destino_id=carga.id,
            demanda_kw=carga.demanda_kw,
            estado=estado
        )
        return len(rutas) > 2

    def reevaluar_carga(self, carga, estado) -> None:
        if self.carga_esta_alimentada(carga, estado):
            if self.carga_tiene_redundancia(carga, estado):
                carga.estado = "alimentado"
            else:
                carga.estado = "degradado"
        else:
            carga.estado = "sin_alimentacion"

    def reevaluar_todas_las_cargas(self, estado) -> None:
        if hasattr(estado, "cargas_it"):
            for carga in estado.cargas_it.values():
                self.reevaluar_carga(carga, estado)

        if hasattr(estado, "zonas_it"):
            for zona in estado.zonas_it.values():
                self.reevaluar_zona(zona, estado)

    def reevaluar_zona(self, zona, estado) -> None:
        rutas = self.buscar_rutas_validas_a_destino(
            destino_id=zona.id,
            demanda_kw=zona.demanda_kw,
            estado=estado,
        )
        if not rutas:
            zona.estado = "sin_alimentacion"
        elif len(rutas) == 1:
            zona.estado = "degradado"
        else:
            zona.estado = "alimentado"

    def reevaluar_sala(self, sala, estado) -> None:
        zonas = [
            z for z in estado.zonas_it.values()
            if z.sala_it_id == sala.id
        ] if hasattr(estado, "zonas_it") else []

        if not zonas:
            sala.estado = "sin_alimentacion"
            sala.potencia_actual_kw = 0.0
            return

        potencia_servida = sum(
            z.demanda_kw for z in zonas if z.estado in {"alimentado", "degradado"}
        )
        sala.potencia_actual_kw = potencia_servida

        estados = {z.estado for z in zonas}
        if estados == {"alimentado"}:
            sala.estado = "alimentada"
        elif "alimentado" in estados or "degradado" in estados:
            sala.estado = "degradada"
        else:
            sala.estado = "sin_alimentacion"

    def reevaluar_todas_las_salas(self, estado) -> None:
        for sala in estado.salas_it.values():
            self.reevaluar_sala(sala, estado)