from app.scenarios.scenario3 import ESCENARIOS_DC1, ESCENARIOS_SOBRECARGA


def get_available_scenarios():
    escenarios = {
        **ESCENARIOS_DC1,
        **ESCENARIOS_SOBRECARGA,
    }
    return [
        {
            "id": scenario_id,
            "name": scenario_id,
        }
        for scenario_id in escenarios.keys()
    ]

#Lista los escenarios disponibles para la simulación
