#MOTOR DE SIMULACIÓN

# engine.py

from __future__ import annotations

import heapq
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from app.domain.models import (
    Evento,
    SnapshotSistema,
    RegistroEvento,
)
from app.simulation.events import ProcesadorEventos


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

class MotorSimulacion:
    """
    Orquesta la simulación discreta dirigida por eventos.
    """

    def __init__(self, estado: EstadoSimulacion, motor_reglas):
        self.estado = estado
        self.motor_reglas = motor_reglas
        self.procesador_eventos = ProcesadorEventos(motor_reglas)

        self._cola_eventos: List[EventoProgramado] = []
        self._secuencia_eventos: int = 0

    # -----------------------------------------------------------------
    # 1. GESTIÓN DE COLA DE EVENTOS
    # -----------------------------------------------------------------

    def cargar_eventos(self, eventos: List[Evento]) -> None:
        for evento in eventos:
            self.insertar_evento(evento)

    def insertar_evento(self, evento: Evento, prioridad: Optional[int] = None) -> None:
        prioridad_evento = prioridad if prioridad is not None else self._prioridad_evento(evento)

        programado = EventoProgramado(
            tiempo_s=evento.tiempo_s,
            prioridad=prioridad_evento,
            secuencia=self._secuencia_eventos,
            evento=evento,
        )

        heapq.heappush(self._cola_eventos, programado)
        self._secuencia_eventos += 1

    def hay_eventos_pendientes(self) -> bool:
        return len(self._cola_eventos) > 0

    def extraer_siguiente_evento(self) -> EventoProgramado:
        return heapq.heappop(self._cola_eventos)

    def _prioridad_evento(self, evento: Evento) -> int:
        """
        Menor número = mayor prioridad.
        """
        prioridades = {
            "FalloComponente": 1,
            "CambioEstado": 2,
            "EntradaReserva": 3,
            "ConmutacionFuente": 4,
            "ArranqueGenerador": 5,
            "AgotamientoBateria": 6,
            "Sobrecarga": 7,
            "PerdidaSuministro": 8,
            "RestablecimientoSuministro": 9,
        }
        return prioridades.get(evento.tipo, 50)
    def _limpiar_transferencias_bloqueadas(self) -> None:
        for comp in self.estado.componentes.values():
            if getattr(comp, "tipo","").lower()== "ups":
                if hasattr(comp, "transferencia_bloqueada"):
                    comp.transferencia_bloqueada = False

    # -----------------------------------------------------------------
    # 2. EJECUCIÓN PRINCIPAL
    # -----------------------------------------------------------------

    def ejecutar(self, tiempo_fin_s: Optional[float] = None) -> dict:
        """
        Ejecuta la simulación completa o hasta un tiempo máximo.
        Procesa en bloque todos los eventos del mismo instante temporal
        para evitar estados transitorios incoherentes en snapshots.
        """
        self._limpiar_transferencias_bloqueadas()

        self.recalcular_estado_completo()
        self.registrar_snapshot(motivo="inicio")

        while self.hay_eventos_pendientes():
            siguiente = self.extraer_siguiente_evento()

            if tiempo_fin_s is not None and siguiente.tiempo_s > tiempo_fin_s:
                break

            tiempo_lote = siguiente.tiempo_s
            estado_global_antes = self.estado.estado_global
            tiempo_visible_anterior = self.estado.tiempo_actual_s
            self.estado.tiempo_actual_s = tiempo_lote
            firma_antes = self._firma_snapshot_relevante()

            eventos_lote = [siguiente.evento]

            # sacar del heap todos los eventos ya programados para ese mismo instante
            while self.hay_eventos_pendientes() and self._cola_eventos[0].tiempo_s == tiempo_lote:
                eventos_lote.append(self.extraer_siguiente_evento().evento)

            registros_pendientes = []

            i = 0
            while i < len(eventos_lote):
                evento = eventos_lote[i]
                eventos_derivados = self.procesador_eventos.aplicar(evento, self.estado)
                if not getattr(evento, "_ignorar_registro", False):
                    registros_pendientes.append(evento)

                for evento_derivado in eventos_derivados:
                    if evento_derivado.tiempo_s == tiempo_lote:
                        eventos_lote.append(evento_derivado)
                    else:
                        self.insertar_evento(evento_derivado)

                i += 1

            eventos_redundancia = self.motor_reglas.reevaluar_grupos_redundancia(self.estado)
            for evento_redundancia in eventos_redundancia:
                if evento_redundancia.tiempo_s == tiempo_lote:
                    eventos_lote.append(evento_redundancia)
                else:
                    self.insertar_evento(evento_redundancia)

            # si la reevaluación de redundancia añadió eventos en el mismo instante, procesarlos también
            while i < len(eventos_lote):
                evento = eventos_lote[i]
                eventos_derivados = self.procesador_eventos.aplicar(evento, self.estado)
                if not getattr(evento, "_ignorar_registro", False):
                    registros_pendientes.append(evento)

                for evento_derivado in eventos_derivados:
                    if evento_derivado.tiempo_s == tiempo_lote:
                        eventos_lote.append(evento_derivado)
                    else:
                        self.insertar_evento(evento_derivado)

                i += 1

            self.recalcular_estado_completo()
            estado_global_despues = self.estado.estado_global

            for evento in registros_pendientes:
                self.registrar_evento(
                    evento=evento,
                    estado_global_antes=estado_global_antes,
                    estado_global_despues=estado_global_despues,
                )

            firma_despues = self._firma_snapshot_relevante()
            hubo_eventos_registrados = bool(registros_pendientes)
            hubo_cambio_relevante = firma_despues != firma_antes

            if hubo_cambio_relevante:
                self.registrar_snapshot(motivo=f"lote_{int(tiempo_lote)}s")
            elif not hubo_eventos_registrados:
                # Lote fantasma: solo eventos ignorados, no debe mover el tiempo visible
                self.estado.tiempo_actual_s = tiempo_visible_anterior
        return self.obtener_resultados()
    # -----------------------------------------------------------------
    # 3. RECÁLCULO DEL SISTEMA
    # -----------------------------------------------------------------

    def recalcular_estado_completo(self) -> None:
        """
        Recalcula el estado lógico completo del sistema tras un evento.
        """
        self.motor_reglas.reevaluar_todas_las_cargas(self.estado)
        self.motor_reglas.reevaluar_todas_las_salas(self.estado)
        self.estado.estado_global = self.motor_reglas.determinar_estado_global(self.estado)

    # -----------------------------------------------------------------
    # 4. REGISTRO Y SNAPSHOTS
    # -----------------------------------------------------------------

    def registrar_snapshot(self, motivo: str = "") -> None:
        snapshot = SnapshotSistema(
            tiempo_s=self.estado.tiempo_actual_s,
            estado_global=self.estado.estado_global,
            carga_total_kw=self.motor_reglas.demanda_total_kw(self.estado),
            carga_servida_kw=self.motor_reglas.carga_servida_kw(self.estado),
            carga_perdida_kw=self.motor_reglas.carga_perdida_kw(self.estado),
            capacidad_entregable_kw=self.motor_reglas.capacidad_entregable_kw(self.estado),
            capacidad_total_activa_kw=self.motor_reglas.capacidad_total_activa_kw(self.estado),
            num_componentes_fallados=self._num_componentes_fallados(),
            num_componentes_reserva_en_uso=self._num_reservas_en_uso(),
            num_salas_degradadas=self._num_salas_degradadas(),
            num_salas_sin_servicio=self._num_salas_sin_servicio(),
            components=[
                {
                    "id": getattr(component, "id", ""),
                    "nombre": getattr(component, "nombre", ""),
                    "tipo": getattr(component, "tipo", component.__class__.__name__),
                    "estado": getattr(component, "estado", ""),
                    "criticidad": getattr(component, "criticidad", None),
                    "es_reserva": getattr(component, "es_reserva", None),
                    "capacidad_kw": getattr(component, "capacidad_kw", None),
                    "en_bateria": getattr(component, "en_bateria", None),
                    "alimentando_zona": getattr(component, "alimentando_zona", None),
                    "bateria_agotada": getattr(component, "bateria_agotada", None),
                    "specific": {},
                }
                for component in (
                    list(self.estado.componentes.values())
                    + list(self.estado.salas_it.values())
                    + list(self.estado.zonas_it.values())
                )
            ],
        )
        self.estado.snapshots.append(snapshot)

    def registrar_evento(
        self,
        evento: Evento,
        estado_global_antes: str,
        estado_global_despues: str,
    ) -> None:
        registro = RegistroEvento(
            tiempo_s=evento.tiempo_s,
            tipo_evento=evento.tipo,
            objetivo_id=evento.objetivo_id,
            descripcion=evento.descripcion,
            estado_global_antes=estado_global_antes,
            estado_global_despues=estado_global_despues,
        )
        self.estado.registro_eventos.append(registro)

    def _firma_snapshot_relevante(self):
        return (
            self.estado.estado_global,
            self.motor_reglas.carga_servida_kw(self.estado),
            self.motor_reglas.carga_perdida_kw(self.estado),
            self.motor_reglas.capacidad_entregable_kw(self.estado),
            tuple(sorted(
                (
                    comp.id,
                    getattr(comp, "estado", None),
                    getattr(comp, "en_bateria", None),
                    getattr(comp, "alimentando_zona", None),
                    getattr(comp, "bateria_agotada", None),
                )
                for comp in self.estado.componentes.values()
                if getattr(comp, "tipo", "").lower() in {"ups", "generador", "redelectrica", "emf", "subestacion", "busbar"}
            )),
            tuple(sorted(
                (
                    zona.id,
                    zona.estado,
                    getattr(zona, "deslastrada", False),
                    getattr(zona, "alimentacion_actual", None),
                )
                for zona in self.estado.zonas_it.values()
            )),
            tuple(sorted(
                (
                    sala.id,
                    sala.estado,
                    getattr(sala, "potencia_actual_kw", None),
                )
                for sala in self.estado.salas_it.values()
            )),
        )

    # -----------------------------------------------------------------
    # 5. MÉTRICAS AUXILIARES
    # -----------------------------------------------------------------

    def _num_componentes_fallados(self) -> int:
        return sum(
            1 for comp in self.estado.componentes.values()
            if getattr(comp, "estado", None) == "fallado"
        )

    def _num_reservas_en_uso(self) -> int:
        return sum(
            1 for comp in self.estado.componentes.values()
            if getattr(comp, "es_reserva", False) and getattr(comp, "estado", None) == "activo"
        )

    def _num_salas_degradadas(self) -> int:
        return sum(
            1 for sala in self.estado.salas_it.values()
            if getattr(sala, "estado", None) == "degradada"
        )

    def _num_salas_sin_servicio(self) -> int:
        return sum(
            1 for sala in self.estado.salas_it.values()
            if getattr(sala, "estado", None) == "sin_alimentacion"
        )

    def _tiempo_total_en_estado(self, estado_objetivo: str) -> float:
        """
        Estima el tiempo acumulado en un estado global a partir de snapshots consecutivos.
        """
        if len(self.estado.snapshots) < 2:
            return 0.0

        total = 0.0
        snapshots = self.estado.snapshots

        for i in range(len(snapshots) - 1):
            actual = snapshots[i]
            siguiente = snapshots[i + 1]

            if actual.estado_global == estado_objetivo:
                total += max(0.0, siguiente.tiempo_s - actual.tiempo_s)

        return total

    # -----------------------------------------------------------------
    # 6. RESULTADO FINAL
    # -----------------------------------------------------------------

    def obtener_resultados(self) -> dict:
        carga_total_kw = self.motor_reglas.demanda_total_kw(self.estado)
        carga_servida_kw = self.motor_reglas.carga_servida_kw(self.estado)
        carga_perdida_kw = self.motor_reglas.carga_perdida_kw(self.estado)

        porcentaje_servido = 0.0
        if carga_total_kw > 0:
            porcentaje_servido = (carga_servida_kw / carga_total_kw) * 100.0

        return {
            "estado_global_final": self.estado.estado_global,
            "tiempo_final_s": self.estado.tiempo_actual_s,
            "carga_total_kw": carga_total_kw,
            "carga_servida_kw": carga_servida_kw,
            "carga_perdida_kw": carga_perdida_kw,
            "porcentaje_carga_servida": porcentaje_servido,
            "capacidad_entregable_kw":self.motor_reglas.capacidad_entregable_kw(self.estado),
            "capacidad_total_activa_kw":self.motor_reglas.capacidad_total_activa_kw(self.estado),
            "num_componentes_fallados": self._num_componentes_fallados(),
            "num_reservas_en_uso": self._num_reservas_en_uso(),
            "num_eventos_procesados": len(self.estado.registro_eventos),
            "num_snapshots": len(self.estado.snapshots),
            "tiempo_operativo_s": self._tiempo_total_en_estado("operativo"),
            "tiempo_degradado_s": self._tiempo_total_en_estado("degradado"),
            "tiempo_fallado_s": self._tiempo_total_en_estado("fallado"),
            "snapshots": self.estado.snapshots,
            "registro_eventos": self.estado.registro_eventos,
        }