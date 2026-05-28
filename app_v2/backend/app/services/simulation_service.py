from app.domain.rules import MotorReglas
from app.simulation.engine import MotorSimulacion

from app.schemas.simulation_schema import (
    SimulationResultResponse,
    SimulationKpiResponse,
)

from app.schemas.event_schema import EventResponse
from app.schemas.snapshot_schema import SnapshotResponse
from app.schemas.component_schema import ComponentResponse

from app.services.topology_service import build_topology_response

from app.scenarios.scenario3 import ESCENARIOS_DC1, ESCENARIOS_SOBRECARGA
from app.schemas.custom_scenario_schema import CustomSimulationRunRequest
from app.services.event_factory import build_simulation_events

escenarios = {
    **ESCENARIOS_DC1,
    **ESCENARIOS_SOBRECARGA,
}


def _get_scenario(scenario_id: str):
    if scenario_id not in escenarios:
        raise ValueError(f"Escenario no encontrado: {scenario_id}")

    return escenarios[scenario_id]()


def _create_simulator(estado):
    return MotorSimulacion(
        estado=estado,
        motor_reglas=MotorReglas(estado.topologia),
    )


def _execute_simulation(estado, eventos):
    simulador = _create_simulator(estado)
    simulador.cargar_eventos(eventos)
    return simulador.ejecutar()


def _build_kpis(resultados):
    return SimulationKpiResponse(
        estado_global_final=resultados["estado_global_final"],
        tiempo_final_s=resultados["tiempo_final_s"],
        carga_total_kw=resultados["carga_total_kw"],
        carga_servida_kw=resultados["carga_servida_kw"],
        carga_perdida_kw=resultados["carga_perdida_kw"],
        porcentaje_carga_servida=resultados["porcentaje_carga_servida"],
        capacidad_entregable_kw=resultados["capacidad_entregable_kw"],
        capacidad_total_activa_kw=resultados["capacidad_total_activa_kw"],
        num_componentes_fallados=resultados["num_componentes_fallados"],
        num_reservas_en_uso=resultados["num_reservas_en_uso"],
        num_eventos_procesados=resultados["num_eventos_procesados"],
        num_snapshots=resultados["num_snapshots"],
        tiempo_operativo_s=resultados["tiempo_operativo_s"],
        tiempo_degradado_s=resultados["tiempo_degradado_s"],
        tiempo_fallado_s=resultados["tiempo_fallado_s"],
    )


def _build_events(registro_eventos):
    return [
        EventResponse(
            tiempo_s=e.tiempo_s,
            tipo_evento=e.tipo_evento,
            objetivo_id=e.objetivo_id,
            descripcion=e.descripcion,
            estado_global_antes=e.estado_global_antes,
            estado_global_despues=e.estado_global_despues,
        )
        for e in registro_eventos
    ]


def _build_snapshots(snapshot_list):
    return [
        SnapshotResponse(
            tiempo_s=s.tiempo_s,
            estado_global=s.estado_global,
            carga_total_kw=s.carga_total_kw,
            carga_servida_kw=s.carga_servida_kw,
            carga_perdida_kw=s.carga_perdida_kw,
            capacidad_entregable_kw=s.capacidad_entregable_kw,
            capacidad_total_activa_kw=s.capacidad_total_activa_kw,
            num_componentes_fallados=s.num_componentes_fallados,
            num_componentes_reserva_en_uso=s.num_componentes_reserva_en_uso,
            num_salas_degradadas=s.num_salas_degradadas,
            num_salas_sin_servicio=s.num_salas_sin_servicio,
            active_edges=s.active_edges,
            components=[ComponentResponse(**component) for component in s.components],
        )
        for s in snapshot_list
    ]


def build_component_response(component):
    common_fields = {
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
        "fuente_actual": getattr(component, "fuente_actual", None),
        "fuente_preferida": getattr(component, "fuente_preferida", None),
        "fuente_respaldo": getattr(component, "fuente_respaldo", None),
    }

    excluded = set(common_fields.keys())

    specific = {
        key: value
        for key, value in vars(component).items()
        if key not in excluded
    }

    return {
        **common_fields,
        "specific": specific,
    }


def _build_components(estado):
    return [
        ComponentResponse(**build_component_response(component))
        for component in estado.componentes.values()
    ]


def _build_simulation_response(scenario_id: str, estado, resultados):
    return SimulationResultResponse(
        scenario_id=scenario_id,
        kpis=_build_kpis(resultados),
        events=_build_events(resultados["registro_eventos"]),
        snapshots=_build_snapshots(resultados["snapshots"]),
        components=_build_components(estado),
        topology=build_topology_response(estado.topologia),
    )


def run_simulation(scenario_id: str):
    estado, eventos = _get_scenario(scenario_id)
    resultados = _execute_simulation(estado, eventos)
    return _build_simulation_response(scenario_id, estado, resultados)


def run_simulation_with_custom_events(
    scenario_id: str,
    custom_events: list,
    scenario_name: str,
):
    estado, eventos_base = _get_scenario(scenario_id)
    eventos_finales = sorted([*eventos_base, *custom_events], key=lambda e: e.tiempo_s)
    resultados = _execute_simulation(estado, eventos_finales)
    return _build_simulation_response(scenario_name, estado, resultados)

def run_custom_simulation(request: CustomSimulationRunRequest):
    eventos = build_simulation_events(request.events)

    return run_simulation_with_custom_events(
        scenario_id=request.base_scenario_id,
        custom_events=eventos,
        scenario_name=request.scenario_name,
    )

# =========================================================
# FLUJO DE EJECUCIÓN DE SIMULACIONES
# =========================================================
#
# Frontend
#    ↓
# POST /api/simulations/run
# o
# POST /api/simulations/run-custom
#    ↓
# simulation_service.py
#    ↓
# MotorSimulacion
#    ↓
# resultados internos
#    ↓
# schemas response
#    ↓
# JSON para frontend
#
# Ambos flujos reutilizan:
# - el mismo motor
# - snapshots
# - KPIs
# - timeline
# - topología
#
# La diferencia es únicamente el origen de los eventos:
#
# run:
#   escenarios predefinidos
#
# run-custom:
#   eventos creados desde el editor
#