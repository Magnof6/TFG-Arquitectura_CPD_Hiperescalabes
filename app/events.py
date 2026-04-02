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
        grupo = self.motor_reglas.buscar_grupo_de_componente(componente.id, estado)
        if grupo is not None:
            evento_reserva = self.motor_reglas.generar_evento_entrada_reserva_desde_estado(
                grupo=grupo,
                componente_fallado_id= componente.id,
                tiempo_s= evento.tiempo_s,
                estado= estado
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
        componente.estado = evento.nuevo_estado

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

    def _procesar_conmutacion_fuente(self, evento: models.ConmutacionFuente, estado) -> List[models.Evento]:
        derivados: List[models.Evento] = []

        if not evento.exito:
            derivados.extend(
                self.motor_reglas.generar_eventos_fallo_conmutacion(
                    evento= evento,
                    estado= estado
                )
            )
        # Si la red cae y conmutamos a una UPS, esa UPS entra en batería
        if evento.objetivo_tipo.lower() == "ups":
            ups = estado.componentes.get(evento.objetivo_id)
            if ups is not None:
                ups.en_bateria = True
                ups.alimentando_zona = True
                ups.tiempo_inicio_bateria_s = evento.tiempo_s

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
    
    # -------------------------------------------------------------------------
    # Eventos de redundancia
    # -------------------------------------------------------------------------

    def _procesar_entrada_reserva(self, evento: models.EntradaReserva, estado) -> List[models.Evento]:
        derivados= []
        
        comp_reserva = estado.componentes.get(evento.componente_reserva_id)
        comp_sustituido = estado.componentes.get(evento.componente_sustituido_id)
        if comp_reserva is not None:
            comp_reserva.estado = "activo"
            
            if comp_reserva.tipo.lower() == "ups":
                comp_reserva.en_bateria = True
                comp_reserva.alimentando_zona = True
                comp_reserva.tiempo_inicio_bateria_s = evento.tiempo_s
                
                derivados.append(
                    models.AgotamientoBateria(
                        id=f"agotamiento_{comp_reserva.id}_{int(evento.tiempo_s)}",
                        tipo="AgotamientoBateria",
                        tiempo_s=evento.tiempo_s + comp_reserva.autonomia_min_eol * 60.0,
                        duracion_s=0.0,
                        objetivo_id=comp_reserva.id,
                        objetivo_tipo="ups",
                        descripcion=f"Agotamiento previsto de batería en {comp_reserva.id}",
                        severidad=4,
                        ups_id=comp_reserva.id,
                        autonomia_restante_min=0.0,
                    )
                )
        if comp_sustituido is not None and comp_sustituido.tipo.lower() =="ups":
            comp_sustituido.alimentando_zona = False
            comp_sustituido.en_bateria = True
        return derivados
    
    def _procesar_salida_reserva(self, evento: models.SalidaReserva, estado) -> List[models.Evento]:
        comp_reserva = estado.componentes.get(evento.componente_reserva_id)
        if comp_reserva is not None:
            comp_reserva.estado = "reserva"
        return []
    
    # -------------------------------------------------------------------------
    # Eventos UPS / bateria
    # -------------------------------------------------------------------------

    def _procesar_agotamiento_bateria(self, evento: models.AgotamientoBateria, estado) -> List[models.Evento]:
        derivados = []

        ups = estado.componentes.get(evento.ups_id)
        if ups is None:
            return derivados
        #Si ya no está en batería, ignorar evento programado(puede ser que haya vuelto la red o haya entrado los generadores)
        if not getattr(ups, "en_bateria", False):
            return derivados

        ups.en_bateria = False
        ups.bateria_agotada = True
        ups.alimentando_zona = False
        ups.estado = "fallado"

        derivados.extend(
            self.motor_reglas.generar_eventos_agotamiento_bateria(
                evento=evento,
                estado=estado
            )
        )

        return derivados
    
    # -------------------------------------------------------------------------
    # Eventos generadores
    # -------------------------------------------------------------------------

    def _procesar_arranque_generador(self, evento: models.ArranqueGenerador, estado) -> List[models.Evento]:
        derivados: List[models.Evento] = []

        generador = estado.componentes.get(evento.generador_id)
        if generador is None:
            return derivados
        
        if evento.arranque_exitoso:
            generador.estado = "activo"
            if hasattr(generador, "arrancado"):
                generador.arrancado = True
            for comp in estado.componentes.values():
                if comp.tipo.lower() =="ups":
                    comp.en_bateria = False
                    comp.alimentando_zona = False
            
            derivados.extend(
                self.motor_reglas.generar_eventos_entrada_generador(
                    generador_id= generador.id,
                    tiempo_s= evento.tiempo_s,
                    estado= estado
                )
            )
        else:
            generador.estado = "fallado"
        
        return derivados
    
    def _procesar_parada_generador(self, evento: models.ParadaGenerador, estado) -> List[models.Evento]:
        generador = estado.componentes.get(evento.generador_id)
        if generador is not None:
            generador.estado = "desconectado"
            if hasattr(generador, "arrancado"):
                generador.arrancado = False
        return []
    
    # -------------------------------------------------------------------------
    # Eventos sala IT
    # -------------------------------------------------------------------------

    def _procesar_degradacion_sala(self, evento: models.DegradacionSalaIT, estado) -> List[models.Evento]:
        sala = estado.salas_it.get(evento.sala_it_id)
        if sala is not None:
            sala.estado = "degradada"
            sala.potencia_actual_kw = max(0.0, sala.potencia_actual_kw - evento.carga_perdida_kw)
        return []
    
    def _procesar_perdida_sala(self, evento: models.PerdidaSalaIT, estado) -> List[models.Evento]:
        sala = estado.salas_it.get(evento.sala_it_id)
        if sala is not None:
            sala.estado = "sin_alimentacion"
            sala.potencia_actual_kw = max(0.0, sala.potencia_actual_kw - evento.carga_afectada_kw)
        return []
    
    def _procesar_restablecimiento_sala(self, evento: models.RestablecimientoSalaIT, estado) -> List[models.Evento]:
        sala = estado.salas_it.get(evento.sala_it_id)
        if sala is not None:
            sala.estado = "alimentada"
            sala.potencia_actual_kw += evento.carga_recuperada_kw
        return []
    
    
    # -------------------------------------------------------------------------
    # Eventos zona IT
    # -------------------------------------------------------------------------

    def _procesar_perdida_zona(self, evento: models.PerdidaZonaIT, estado) -> List[models.Evento]:
        zona =  estado.zonas_it.get(evento.carga_it_id)
        if zona is not None:
            zona.estado = "sin_alimentacion"
        return []
    
    def _procesar_restablecimiento_zona(self, evento: models.RestablecimientoZonaIT, estado) -> List[models.Evento]:
        zona =  estado.zonas_it.get(evento.carga_it_id)
        if zona is not None:
            zona.estado = "alimentado"
        return []
    
                