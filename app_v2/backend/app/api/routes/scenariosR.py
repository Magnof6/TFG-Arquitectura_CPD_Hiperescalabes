from fastapi import APIRouter

from app.services.scenario_service import get_available_scenarios

router = APIRouter(
    prefix="/api/scenarios",
    tags=["Scenarios"],
)


@router.get("/")
def list_scenarios():
    return get_available_scenarios()

#exponemos los escnarios disponibles para la simulación
#Ejemplo del flujo:
#Front-end --> GET /api/scenarios --> scenaiosR.py --> scenario_service.py --> devuelve la lista de escenarios disponibles para la simulación

#devuelve:
#[
#  {
#    "id": "escenario_dc1_fallo_emf",
#    "name": "escenario_dc1_fallo_emf"
#  }
#]