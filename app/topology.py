#GRAFO Y BUSQUEDA DE RUTAS
# topology.py

from __future__ import annotations

from collections import defaultdict
from typing import Dict, List, Optional, Set

from models import ConexionElectrica


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

    def agregar_nodo(self, nodo: object) -> None:
        if not hasattr(nodo, "id"):
            raise ValueError("El nodo debe tener atributo 'id'")
        self.nodos[nodo.id] = nodo

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

    def existe_nodo(self, nodo_id: str) -> bool:
        return nodo_id in self.nodos

    def obtener_nodo(self, nodo_id: str) -> Optional[object]:
        return self.nodos.get(nodo_id)

    def obtener_conexion(self, origen_id: str, destino_id: str) -> Optional[ConexionElectrica]:
        """
        Devuelve la primera conexión directa entre origen y destino.
        """
        for conexion in self._adyacencia_salida.get(origen_id, []):
            if conexion.destino_id == destino_id:
                return conexion
        return None

    def obtener_conexiones_desde(self, nodo_id: str) -> List[ConexionElectrica]:
        return list(self._adyacencia_salida.get(nodo_id, []))

    def obtener_conexiones_hacia(self, nodo_id: str) -> List[ConexionElectrica]:
        return list(self._adyacencia_entrada.get(nodo_id, []))

    def obtener_vecinos_salida(self, nodo_id: str) -> List[str]:
        return [c.destino_id for c in self._adyacencia_salida.get(nodo_id, [])]

    def obtener_vecinos_entrada(self, nodo_id: str) -> List[str]:
        return [c.origen_id for c in self._adyacencia_entrada.get(nodo_id, [])]

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

    def buscar_primera_ruta(
        self,
        origen_id: str,
        destino_id: str,
        max_profundidad: int = 25,
        solo_conexiones_activas: bool = False,
    ) -> Optional[List[str]]:
        rutas = self.buscar_rutas(
            origen_id=origen_id,
            destino_id=destino_id,
            max_rutas=1,
            max_profundidad=max_profundidad,
            solo_conexiones_activas=solo_conexiones_activas,
        )
        return rutas[0] if rutas else None

    # ---------------------------------------------------------------------
    # 4. VALIDACIÓN BÁSICA
    # ---------------------------------------------------------------------

    def validar_conexiones(self) -> List[str]:
        """
        Comprueba que todas las conexiones referencian nodos existentes.
        """
        errores = []

        for conexion in self.conexiones:
            if conexion.origen_id not in self.nodos:
                errores.append(
                    f"Conexión inválida: origen '{conexion.origen_id}' no existe"
                )
            if conexion.destino_id not in self.nodos:
                errores.append(
                    f"Conexión inválida: destino '{conexion.destino_id}' no existe"
                )

        return errores

    def nodos_sin_salidas(self) -> List[str]:
        """
        Útil para depuración: nodos sin conexiones salientes.
        """
        resultado = []
        for nodo_id in self.nodos:
            if len(self._adyacencia_salida.get(nodo_id, [])) == 0:
                resultado.append(nodo_id)
        return resultado

    def nodos_sin_entradas(self) -> List[str]:
        """
        Útil para detectar fuentes o nodos aislados.
        """
        resultado = []
        for nodo_id in self.nodos:
            if len(self._adyacencia_entrada.get(nodo_id, [])) == 0:
                resultado.append(nodo_id)
        return resultado

    def detectar_nodos_aislados(self) -> List[str]:
        """
        Devuelve nodos sin entradas ni salidas.
        """
        aislados = []
        for nodo_id in self.nodos:
            sin_entradas = len(self._adyacencia_entrada.get(nodo_id, [])) == 0
            sin_salidas = len(self._adyacencia_salida.get(nodo_id, [])) == 0
            if sin_entradas and sin_salidas:
                aislados.append(nodo_id)
        return aislados

    # ---------------------------------------------------------------------
    # 5. REPRESENTACIÓN
    # ---------------------------------------------------------------------

    def resumen(self) -> dict:
        return {
            "num_nodos": len(self.nodos),
            "num_conexiones": len(self.conexiones),
            "nodos_sin_entradas": len(self.nodos_sin_entradas()),
            "nodos_sin_salidas": len(self.nodos_sin_salidas()),
            "nodos_aislados": len(self.detectar_nodos_aislados()),
        }