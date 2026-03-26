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
