from app.schemas.custom_scenario_schema import CustomEventInput
from app.domain.models import (
    FalloComponente,
    RecuperacionComponente,
    Sobrecarga,
    ConmutacionFuente,
    ParadaGenerador,
    SalidaReserva,
)


def build_simulation_event(event: CustomEventInput):
    if event.tipo == "FalloComponente":
        return FalloComponente(
            id=f"custom_fallo_{event.objetivo_id}_{int(event.tiempo_s)}",
            tipo="FalloComponente",
            tiempo_s=event.tiempo_s,
            duracion_s=0,
            objetivo_id=event.objetivo_id,
            objetivo_tipo="Componente",
            descripcion=event.descripcion or f"Fallo manual de {event.objetivo_id}",
            severidad=event.severidad,
            causa=event.causa or "Evento creado desde editor",
            nuevo_estado="fallado",
        )

    if event.tipo == "RecuperacionComponente":
        return RecuperacionComponente(
            id=f"custom_recuperacion_{event.objetivo_id}_{int(event.tiempo_s)}",
            tipo="RecuperacionComponente",
            tiempo_s=event.tiempo_s,
            duracion_s=0,
            objetivo_id=event.objetivo_id,
            objetivo_tipo="Componente",
            descripcion=event.descripcion or f"Recuperación manual de {event.objetivo_id}",
            severidad=event.severidad,
            causa=event.causa or "Evento creado desde editor",
            nuevo_estado="activo",
        )

    if event.tipo == "Sobrecarga":
        carga_kw = event.carga_kw or 0.0
        capacidad_disponible_kw = event.capacidad_disponible_kw or 1.0
        porcentaje_sobrecarga = (
            event.porcentaje_sobrecarga
            if event.porcentaje_sobrecarga is not None
            else ((carga_kw - capacidad_disponible_kw) / capacidad_disponible_kw) * 100.0
        )

        return Sobrecarga(
            id=f"custom_sobrecarga_{event.objetivo_id}_{int(event.tiempo_s)}",
            tipo="Sobrecarga",
            tiempo_s=event.tiempo_s,
            duracion_s=event.duracion_s or 0,
            objetivo_id=event.objetivo_id,
            objetivo_tipo="Sistema",
            descripcion=event.descripcion or f"Sobrecarga manual en {event.objetivo_id}",
            severidad=event.severidad,
            carga_kw=carga_kw,
            capacidad_disponible_kw=capacidad_disponible_kw,
            porcentaje_sobrecarga=porcentaje_sobrecarga,
        )

    if event.tipo == "ConmutacionFuente":
        return ConmutacionFuente(
            id=f"custom_conmutacion_{event.objetivo_id}_{int(event.tiempo_s)}",
            tipo="ConmutacionFuente",
            tiempo_s=event.tiempo_s,
            duracion_s=0,
            objetivo_id=event.objetivo_id,
            objetivo_tipo="ups",
            descripcion=event.descripcion or f"Conmutación manual de {event.objetivo_id}",
            severidad=event.severidad,
            fuente_origen=event.objetivo_id,
            fuente_destino=event.fuente_destino_id or event.objetivo_id,
            tiempo_transferencia_ms=10.0,
            exito=True,
        )

    if event.tipo == "ParadaGenerador":
        return ParadaGenerador(
            id=f"custom_parada_{event.objetivo_id}_{int(event.tiempo_s)}",
            tipo="ParadaGenerador",
            tiempo_s=event.tiempo_s,
            duracion_s=0,
            objetivo_id=event.objetivo_id,
            objetivo_tipo="Generador",
            descripcion=event.descripcion or f"Parada manual de generador {event.objetivo_id}",
            severidad=event.severidad,
            generador_id=event.objetivo_id,
            motivo=event.motivo or "Evento creado desde editor",
        )

    if event.tipo == "SalidaReserva":
        return SalidaReserva(
            id=f"custom_salida_{event.objetivo_id}_{int(event.tiempo_s)}",
            tipo="SalidaReserva",
            tiempo_s=event.tiempo_s,
            duracion_s=0,
            objetivo_id=event.objetivo_id,
            objetivo_tipo="Reserva",
            descripcion=event.descripcion or f"Salida manual de reserva {event.objetivo_id}",
            severidad=event.severidad,
            componente_reserva_id=event.objetivo_id,
            motivo=event.motivo or "Evento creado desde editor",
        )

    raise ValueError(f"Tipo de evento custom no soportado: {event.tipo}")


def build_simulation_events(events: list[CustomEventInput]):
    return sorted(
        [build_simulation_event(event) for event in events],
        key=lambda event: event.tiempo_s,
    )