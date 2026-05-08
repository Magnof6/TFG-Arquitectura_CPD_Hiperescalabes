#EJECUCIÓN
# main.py

from rules import MotorReglas
from engine import MotorSimulacion
#import scenarios2
#import scenarioTillion
import scenario3


def ejecutar_escenario(nombre, funcion):
    print(f"\n==============================")
    print(f"ESCENARIO: {nombre}")
    print(f"==============================")

    estado, eventos = funcion()

    motor_reglas = MotorReglas(estado.topologia)
    simulador = MotorSimulacion(estado, motor_reglas)

    simulador.cargar_eventos(eventos)
    resultados = simulador.ejecutar()

    # --- RESULTADOS ---
    print("\n===== RESULTADOS =====")
    for k, v in resultados.items():
        if k not in {"snapshots", "registro_eventos"}:
            print(f"{k}: {v}")

    # --- EVENTOS ---
    print("\n===== EVENTOS =====")
    for e in resultados["registro_eventos"]:
        print(f"{e.tiempo_s}s - {e.tipo_evento} - {e.descripcion}")

    # --- SNAPSHOTS ---
    print("\n===== SNAPSHOTS =====")
    for s in resultados["snapshots"]:
        print(
            f"{s.tiempo_s}s | estado={s.estado_global} | "
            f"servida={s.carga_servida_kw}kW | perdida={s.carga_perdida_kw}kW"
        )


def main():
    for nombre, funcion in scenario3.ESCENARIOS_DC1.items():
        try:
            ejecutar_escenario(nombre, funcion)
        except NotImplementedError:
            print(f"\n[SKIPPED] {nombre} (no implementado)")
        except Exception as e:
            print(f"\n[ERROR] {nombre}: {e}")
    


if __name__ == "__main__":
    main()