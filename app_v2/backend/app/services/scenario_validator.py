def validate_custom_events(estado, events):
    errors = []

    for index, event in enumerate(events):
        label = f"Evento #{index + 1} ({event.tipo})"

        _validate_time(label, event, errors)
        _validate_component_exists(label, estado, event, errors)
        _validate_event_type(label, estado, event, errors)
        _validate_power_fields(label, event, errors)

    if errors:
        raise ValueError("; ".join(errors))


def _validate_time(label, event, errors):
    if event.tiempo_s < 0:
        errors.append(f"{label}: tiempo_s no puede ser negativo")

    if event.duracion_s is not None and event.duracion_s < 0:
        errors.append(f"{label}: duracion_s no puede ser negativa")


def _validate_component_exists(label, estado, event, errors):
    if event.objetivo_id not in estado.componentes:
        errors.append(f"{label}: objetivo_id '{event.objetivo_id}' no existe")


def _validate_event_type(label, estado, event, errors):
    component = estado.componentes.get(event.objetivo_id)

    if component is None:
        return

    tipo = getattr(component, "tipo", "")

    if event.tipo == "ParadaGenerador" and tipo != "Generador":
        errors.append(
            f"{label}: ParadaGenerador requiere un Generador, pero '{event.objetivo_id}' es {tipo}"
        )

    if event.tipo == "ConmutacionFuente" and tipo not in {"UPS", "STS"}:
        errors.append(
            f"{label}: ConmutacionFuente requiere UPS o STS, pero '{event.objetivo_id}' es {tipo}"
        )

    if event.tipo == "SalidaReserva" and not getattr(component, "es_reserva", False):
        errors.append(
            f"{label}: SalidaReserva requiere un componente de reserva"
        )


def _validate_power_fields(label, event, errors):
    if event.tipo != "Sobrecarga":
        return

    if event.carga_kw is None:
        errors.append(f"{label}: Sobrecarga requiere carga_kw")

    if event.capacidad_disponible_kw is None:
        errors.append(f"{label}: Sobrecarga requiere capacidad_disponible_kw")

    if event.carga_kw is not None and event.carga_kw < 0:
        errors.append(f"{label}: carga_kw no puede ser negativa")

    if (
        event.capacidad_disponible_kw is not None
        and event.capacidad_disponible_kw <= 0
    ):
        errors.append(f"{label}: capacidad_disponible_kw debe ser mayor que 0")