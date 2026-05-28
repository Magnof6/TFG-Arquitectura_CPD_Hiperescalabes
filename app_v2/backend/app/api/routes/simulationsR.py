from fastapi import APIRouter, HTTPException

from app.schemas.simulation_schema import (
    SimulationRunRequest,
    SimulationResultResponse,
)

from app.schemas.custom_scenario_schema import CustomSimulationRunRequest

from app.services.simulation_service import (
    run_simulation,
    run_custom_simulation,
)

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


@router.post(
    "/run-custom",
    response_model=SimulationResultResponse,
)
def run_custom_simulation_endpoint(request: CustomSimulationRunRequest):

    try:
        return run_custom_simulation(request)

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e),
        )