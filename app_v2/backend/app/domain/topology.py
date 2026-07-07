#GRAFO Y BUSQUEDA DE RUTAS
# topology.py

from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Optional, Set

from app.domain.models import ConexionElectrica


class TopologiaSistema:
    """
    Representa la topología eléctrica del sistema como un grafo dirigido.

    Responsabilidades:
    - almacenar nodos y conexiones
    - consultar conexiones directas
    - obtener vecinos entrantes/salientes
    - buscar rutas entre dos nodos
    """

    def __init__(self, nodos: Optional[Dict[str, object]] = None, conexiones: Optional[List[ConexionElectrica]] = None):
        self.nodos: Dict[str, object] = nodos or {}
        self.conexiones: List[ConexionElectrica] = conexiones or []

        self._adyacencia_salida: Dict[str, List[ConexionElectrica]] = defaultdict(list)
        self._adyacencia_entrada: Dict[str, List[ConexionElectrica]] = defaultdict(list)

        self._reconstruir_indices()

    # ---------------------------------------------------------------------
    # 1. CONSTRUCCIÓN Y MANTENIMIENTO
    # ---------------------------------------------------------------------

    def _reconstruir_indices(self) -> None:
        self._adyacencia_salida.clear()
        self._adyacencia_entrada.clear()

        for conexion in self.conexiones:
            self._adyacencia_salida[conexion.origen_id].append(conexion)
            self._adyacencia_entrada[conexion.destino_id].append(conexion)


    def agregar_conexion(self, conexion: ConexionElectrica) -> None:
        self.conexiones.append(conexion)
        self._adyacencia_salida[conexion.origen_id].append(conexion)
        self._adyacencia_entrada[conexion.destino_id].append(conexion)

    def eliminar_conexion(self, origen_id: str, destino_id: str) -> bool:
        encontrada = False
        nuevas = []

        for conexion in self.conexiones:
            if conexion.origen_id == origen_id and conexion.destino_id == destino_id and not encontrada:
                encontrada = True
                continue
            nuevas.append(conexion)

        if encontrada:
            self.conexiones = nuevas
            self._reconstruir_indices()

        return encontrada
    
    def reemplazar_conexion(self, origen_id: str, destino_antiguo: str, destino_nuevo: str):
        for conexion in self.conexiones:
            if conexion.origen_id == origen_id and conexion.destino_id == destino_antiguo:
                conexion.destino_id = destino_nuevo
                return True
        return False
    # ---------------------------------------------------------------------
    # 2. CONSULTAS BÁSICAS
    # ---------------------------------------------------------------------


    def obtener_conexion(self, origen_id: str, destino_id: str) -> Optional[ConexionElectrica]:
        """
        Devuelve la primera conexión directa entre origen y destino.
        """
        for conexion in self._adyacencia_salida.get(origen_id, []):
            if conexion.destino_id == destino_id:
                return conexion
        return None


    # ---------------------------------------------------------------------
    # 3. BÚSQUEDA DE RUTAS
    # ---------------------------------------------------------------------

    def buscar_rutas(
        self,
        origen_id: str,
        destino_id: str,
        max_rutas: int = 20,
        max_profundidad: int = 25,
        solo_conexiones_activas: bool = False,
    ) -> List[List[str]]:
        """
        Busca rutas simples (sin ciclos) entre origen y destino.

        Devuelve una lista de rutas, donde cada ruta es una lista de IDs de nodos:
        ejemplo: ["red", "subestacion_1", "ups_1", "sala_1"]

        Parámetros:
        - max_rutas: limita el número de rutas devueltas
        - max_profundidad: evita exploraciones excesivas
        - solo_conexiones_activas: si True, ignora conexiones no activas
        """
        if origen_id not in self.nodos or destino_id not in self.nodos:
            return []

        rutas: List[List[str]] = []

        def dfs(actual: str, destino: str, camino: List[str], visitados: Set[str]) -> None:
            if len(rutas) >= max_rutas:
                return

            if len(camino) > max_profundidad:
                return

            if actual == destino:
                rutas.append(camino.copy())
                return

            for conexion in self._adyacencia_salida.get(actual, []):
                if solo_conexiones_activas and conexion.estado != "activa":
                    continue

                siguiente = conexion.destino_id

                if siguiente in visitados:
                    continue

                visitados.add(siguiente)
                camino.append(siguiente)

                dfs(siguiente, destino, camino, visitados)

                camino.pop()
                visitados.remove(siguiente)

        dfs(
            actual=origen_id,
            destino=destino_id,
            camino=[origen_id],
            visitados={origen_id},
        )

        return rutas
