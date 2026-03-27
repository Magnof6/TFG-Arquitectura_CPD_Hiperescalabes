#PROCESADOR DE EVENTOS
from __future__ import annotations
from typing import Optional, List, Dict

import models 

class ProcesadorEventos:
    """
        Aplica eventos sobre el estado actual del sistema y devuelve
        los eventos derivados que deban programarse posteriormente.
    """
    def __init__(self, motor_reglas):
        self.motor_reglas = motor_reglas
    
    def aplicar(self, evento: models.Evento, estado) -> List[models.Evento]:
        """
            Aplica un evento al estado actual y devuelve una lista de eventos derivados.
        """
        if isinstance(evento, models.FalloComponente):
            return self._procesar_fallo_componente(evento, estado)

        if isinstance(evento, models.RecuperacionComponente):
            return self._procesar_recuperacion_componente(evento, estado)

        if isinstance(evento, models.CambioEstado):
            return self._procesar_cambio_estado(evento, estado)

        if isinstance(evento, models.ConmutacionFuente):
            return self._procesar_conmutacion_fuente(evento, estado)

        if isinstance(evento, models.Sobrecarga):
            return self._procesar_sobrecarga(evento, estado)

        if isinstance(evento, models.PerdidaSuministro):
            return self._procesar_perdida_suministro(evento, estado)

        if isinstance(evento, models.RestablecimientoSuministro):
            return self._procesar_restablecimiento_suministro(evento, estado)

        if isinstance(evento, models.EntradaReserva):
            return self._procesar_entrada_reserva(evento, estado)

        if isinstance(evento, models.SalidaReserva):
            return self._procesar_salida_reserva(evento, estado)

        if isinstance(evento, models.AgotamientoBateria):
            return self._procesar_agotamiento_bateria(evento, estado)

        if isinstance(evento, models.ArranqueGenerador):
            return self._procesar_arranque_generador(evento, estado)

        if isinstance(evento, models.ParadaGenerador):
            return self._procesar_parada_generador(evento, estado)

        if isinstance(evento, models.DegradacionSalaIT):
            return self._procesar_degradacion_sala(evento, estado)

        if isinstance(evento, models.PerdidaSalaIT):
            return self._procesar_perdida_sala(evento, estado)

        if isinstance(evento, models.RestablecimientoSalaIT):
            return self._procesar_restablecimiento_sala(evento, estado)

        if isinstance(evento, models.PerdidaZonaIT):
            return self._procesar_perdida_zona(evento, estado)

        if isinstance(evento, models.RestablecimientoZonaIT):
            return self._procesar_restablecimiento_zona(evento, estado)

        raise ValueError(f"Tipo de evento no soportado: {type(evento).__name__}")


    # -------------------------------------------------------------------------
    # Eventos de componente
    # -------------------------------------------------------------------------

    def _procesar_fallo_componente(self, evento: models.FalloComponente, estado) -> List[models.Evento]:
        derivados: List[models.Evento] = []

        componente = estado.componentes.get(evento.objetivo_id)
        if componente is None:
            return derivados 
        estado_anterior = componente.estado
        componente.estado = evento.nuevo_estado

        derivados.append(
            models.CambioEstado(
                id = f"chg_{evento.id}",
                tipo = "CambioEstado",
                tiempo_s = evento.tiempo_s,
                duracion_s=0,
                objetivo_id= componente.id,
                objetivo_tipo= componente.tipo,
                descripcion= f"Cambio de estado de {estado_anterior} a {componente.estado}",
                severidad= evento.severidad,
                estado_anterior= estado_anterior,
                estado_nuevo= componente.estado
            )
        )

        #Si el componente pertenece a un grupo N +1, comprobar si entra reserva
        grupo = self.motor_reglas.buscar_grupo_componente(componente.id, estado)
        if grupo is not None:
            evento_reserva = self.motor_reglas.generar_evento__entrada_reserva(
                grupo=grupo,
                componente_fallido_id= componente.id,
                tiempo_s= evento.tiempo_s,
            )
            if evento_reserva is not None:
                derivados.append(evento_reserva)
        
        #Si falla la red, se debe forzar la transición a respaldo y arranque de generadores
        if componente.tipo.lower() =="redelectrica":
            derivados.extend(
                self.motor_reglas.generar_eventos_caida_red(
                    tiempo_s= evento.tiempo_s,
                    estado= estado
                 )
                )
        # Si falla una UPS, puede producirse conmutación o pérdida de suministro
        if componente.tipo.lower() =="ups":
            derivados.extend(
                self.motor_reglas.generar_eventos_fallo_ups(
                    ups_id= componente.id,
                    tiempo_s= evento.tiempo_s,
                    estado= estado 
                )
            )
        
        #Si falla un generador, reevaluar cobertura
        if componente.tipo.lower() =="generador":
            derivados.extend(
                self.motor_reglas.generar_eventos_fallo_generador(
                    generador_id= componente.id,
                    tiempo_s= evento.tiempo_s,
                    estado= estado
                )
            )
        return derivados
    
    def _procesar_recuperacion_componente(self, evento: models.RecuperacionComponente, estado) -> List[models.Evento]:
        derivados: List[models.Evento] = []

        componente = estado.componentes.get(evento.objetivo_id)
        if componente is None:
            return derivados

        estado_anterior = componente.estado
        componente.estado = evento.estado_final

        derivados.append(
            models.CambioEstado(
                id=f"chg_{evento.id}",
                tipo="CambioEstado",
                tiempo_s=evento.tiempo_s,
                duracion_s=0,
                objetivo_id=componente.id,
                objetivo_tipo=componente.tipo,
                descripcion=f"Recuperación: {estado_anterior} -> {componente.estado}",
                severidad=evento.severidad,
                estado_anterior=estado_anterior,
                estado_nuevo=componente.estado,
            )
        )

        # Si vuelve la red, puede intentarse retorno a fuente preferida
        if componente.tipo.lower() == "redelectrica":
            derivados.extend(
                self.motor_reglas.generar_eventos_retorno_red(
                    tiempo_s=evento.tiempo_s,
                    estado=estado,
                )
            )

        return derivados

    def _procesar_cambio_estado(self, evento: models.CambioEstado, estado) -> List[models.Evento]:
        componente = estado.componentes.get(evento.objetivo_id)
        if componente is not None:
            componente.estado = evento.estado_nuevo
        return []


    # -------------------------------------------------------------------------
    # Eventos de fuente / suministro
    # -------------------------------------------------------------------------

    def _procesar_conmutation_fuente(self, evento: models.ConmutacionFuente, estado) -> List[models.Evento]:
        derivados: List[models.Evento] = []

        if not evento.exito:
            derivados.extend(
                self.motor_reglas.generar_eventos_fallo_conmutación(
                    evento= evento,
                    estado= estado
                )
            )
        return derivados

    def _procesar_sobrecarga(self, evento: models.Sobrecarga, estado) -> List[models.Evento]:
        return self.motor_reglas.generar_eventos_por_sobrecarga(
            evento= evento,
            estado= estado
        )
    
    def _procesar_perdida_suministro(self, evento: models.PerdidaSuministro, estado) -> List[models.Evento]:
        return []
    
    def _procesar_restablecimiento_suministro(self, evento: models.RestablecimientoSuministro, estado) -> List[models.Evento]:
        return []
    
    