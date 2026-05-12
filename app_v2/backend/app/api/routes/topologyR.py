from fastapi import APIRouter, HTTPException

from app.services.topology_service import build_topology_response

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