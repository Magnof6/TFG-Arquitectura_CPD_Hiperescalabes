from fastapi import APIRouter, HTTPException
from typing import List

from app.services.topology_service import build_topology_response
from app.schemas.topology_schema import TopologyNodeResponse

from app.scenarios.scenario3 import (
    ESCENARIOS_DC1,
    ESCENARIOS_SOBRECARGA,
)

router = APIRouter(
    prefix="/api/topology",
    tags=["Topology"],
)

escenarios = {
    **ESCENARIOS_DC1,
    **ESCENARIOS_SOBRECARGA,
}

DEFAULT_SCENARIO_ID = "escenario_dc1_sin_eventos"


@router.get(
    "/components",
    response_model=List[TopologyNodeResponse],
)
def get_default_topology_components():

    estado, _ = escenarios[DEFAULT_SCENARIO_ID]()

    topology = build_topology_response(estado.topologia)

    return topology.nodes

@router.get("/{scenario_id}")
def get_topology(scenario_id: str):

    if scenario_id not in escenarios:
        raise HTTPException(
            status_code=404,
            detail=f"Escenario no encontrado: {scenario_id}",
        )

    estado, _ = escenarios[scenario_id]()

    return build_topology_response(estado.topologia)

#Devuelve la topología eléctrica preparada para React
#Ejemplo del flujo:
#Front-end --> GET /api/topology/{scenario_id} --> topologyR.py --> topology_service.py --> TopologyResponse
#Devuelve
#{
#  "nodes": [],
#  "edges": []
#}