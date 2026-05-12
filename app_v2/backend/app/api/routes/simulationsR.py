from fastapi import APIRouter, HTTPException

from app.schemas.simulation_schema import (
    SimulationRunRequest,
    SimulationResultResponse,
)

from app.services.simulation_service import run_simulation

router = APIRouter(
    prefix="/api/simulations",
    tags=["Simulations"],
)


@router.post(
    "/run",
    response_model=SimulationResultResponse,
)
def run_simulation_endpoint(request: SimulationRunRequest):

    try:
        return run_simulation(request.scenario_id)

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )

#Se encarga de ejecutar las simulaciones
#Ejemplo del flujo:
#Front-end --> POST /api/simulations/run --> simulationsR.py --> simulation_service.py --> MotorSimulación -> resultados --> json

#el front-end envia
#{
#  "scenario_id": "escenario_dc1_fallo_emf"
#}

#Y recibirá KPIs, eventos, snapshots y estado final de la topología para mostrar en el dashboard