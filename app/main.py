#EJECUCIÓN
# main.py

from models import (
    RedElectrica,
    Subestacion,
    Transformador,
    UPS,
    STS,
    Busbar,
    SalaIT,
    ZonaIT,
    ConexionElectrica,
    FalloComponente,
    GrupoRedundancia,
)
from scenarios import escenario_base_ups
from rules import MotorReglas
from engine import MotorSimulacion





def main():
    estado, eventos = escenario_base_ups()

    motor_reglas = MotorReglas(estado.topologia)
    simulador = MotorSimulacion(estado, motor_reglas)

    simulador.cargar_eventos(eventos)

    resultados = simulador.ejecutar()

    # -----------------------------------------------------------------
    # RESULTADOS
    # -----------------------------------------------------------------

    print("\n===== RESULTADOS =====")
    for k, v in resultados.items():
        if k not in {"snapshots", "registro_eventos"}:
            print(f"{k}: {v}")

    print("\n===== EVENTOS =====")
    for e in resultados["registro_eventos"]:
        print(f"{e.tiempo_s}s - {e.tipo_evento} - {e.descripcion}")

    print("\n===== SNAPSHOTS =====")
    for s in resultados["snapshots"]:
        print(
            f"{s.tiempo_s}s | estado={s.estado_global} | "
            f"servida={s.carga_servida_kw}kW | perdida={s.carga_perdida_kw}kW"
        )


if __name__ == "__main__":
    main()