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

escenarios = {
        **ESCENARIOS_DC1,
        **ESCENARIOS_SOBRECARGA,
    }



def run_simulation(scenario_id: str):

    if scenario_id not in escenarios:
        raise ValueError(f"Escenario no encontrado: {scenario_id}")

    estado, eventos = escenarios[scenario_id]()

    motor_reglas = MotorReglas(estado.topologia)

    simulador = MotorSimulacion(
        estado=estado,
        motor_reglas=motor_reglas,
    )

    simulador.cargar_eventos(eventos)

    resultados = simulador.ejecutar()

    kpis = SimulationKpiResponse(
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

    events = [
        EventResponse(
            tiempo_s=e.tiempo_s,
            tipo_evento=e.tipo_evento,
            objetivo_id=e.objetivo_id,
            descripcion=e.descripcion,
            estado_global_antes=e.estado_global_antes,
            estado_global_despues=e.estado_global_despues,
        )
        for e in resultados["registro_eventos"]
    ]

    snapshots = [
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
            components=[
                ComponentResponse(**component)
                for component in s.components
            ],
        )
        for s in resultados["snapshots"]
    ]

    components = [
        ComponentResponse(**build_component_response(component))
        for component in estado.componentes.values()
]

    topology = build_topology_response(estado.topologia)

    return SimulationResultResponse(
        scenario_id=scenario_id,
        kpis=kpis,
        events=events,
        snapshots=snapshots,
        components=components,
        topology=topology,
    )

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

#Ejecuta simulaciones
#internamente hace
#Frontend
#↓
#POST /api/simulations/run
#↓
#simulation_service.py
#↓
#MotorSimulacion
#↓
#resultados
#↓
#schemas
#↓
#JSON