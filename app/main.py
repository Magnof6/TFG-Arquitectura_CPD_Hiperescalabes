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

from topology import TopologiaSistema
from rules import MotorReglas
from engine import EstadoSimulacion, MotorSimulacion


def construir_sistema():
    # -----------------------------------------------------------------
    # 1. COMPONENTES
    # -----------------------------------------------------------------

    red = RedElectrica(
        id="red",
        nombre="Red",
        tipo="RedElectrica",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=300,
        potencia_disponible_mw=100,
        tension_kv=400,
        numero_lineas=2,
        nodo_origen="grid",
        es_reserva=False
    )

    sub = Subestacion(
        id="sub",
        nombre="Subestación",
        tipo="Subestacion",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=300,
        potencia_nominal_mva=100,
        tension_entrada_kv=400,
        tension_salida_kv=11,
        lineas_entrantes=2,
        lineas_salientes=2,
        num_transformadores=2,
        esquema_barras="simple",
        es_reserva=False
    )

    trafo = Transformador(
        id="trafo",
        nombre="Transformador",
        tipo="Transformador",
        estado="activo",
        criticidad=4,
        tiempo_recuperacion_s=200,
        subtipo="IT",
        potencia_nominal_kva=2000,
        tension_entrada_kv=11,
        tension_salida_kv=0.415,
        impedancia_pct=6,
        grupo_vectorial="Dyn11",
        refrigeracion="ONAN",
        es_reserva=False
    )

    ups = UPS(
        id="ups_1",
        nombre="UPS 1",
        tipo="UPS",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=100,
        subtipo="IT",
        tecnologia="VFI",
        potencia_nominal_kva=1000,
        potencia_nominal_kw=900,
        eficiencia_pct=95,
        autonomia_min_eol=5,
        vida_util_anios=10,
        tiempo_conmutacion_ms=10,
        bateria_tipo="Li-ion",
        bms_monitorizado=True,
        es_reserva=False
    )

    sts = STS(
        id="sts_1",
        nombre="STS",
        tipo="STS",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=50,
        corriente_nominal_a=2000,
        tiempo_transferencia_ms=10,
        fuente_preferida="red",
        fuente_respaldo="ups_1",
        es_reserva=False
    )

    bus = Busbar(
        id="bus_1",
        nombre="Busbar",
        tipo="Busbar",
        estado="activo",
        criticidad=4,
        tiempo_recuperacion_s=50,
        tension_v=415,
        corriente_nominal_a=2000,
        capacidad_kw=800,
        es_reserva=False
    )

    # -----------------------------------------------------------------
    # 2. SALA Y ZONA
    # -----------------------------------------------------------------

    sala = SalaIT(
        id="sala_1",
        nombre="Sala IT",
        estado="alimentada",
        potencia_objetivo_kw=500,
        potencia_actual_kw=500,
        numero_zonas=1,
        bloque_electrico_principal="bloque_1",
        bloque_electrico_respaldo="bloque_2",
        criticidad=5,
    )

    zona = ZonaIT(
        id="zona_1",
        nombre="Zona IT",
        tipo="critica",
        estado="alimentado",
        demanda_kw=500,
        prioridad=5,
        sala_it_id="sala_1",
        alimentacion_preferida="red",
        alimentacion_respaldo="ups_1",
    )

    # -----------------------------------------------------------------
    # 3. TOPOLOGÍA
    # -----------------------------------------------------------------

    nodos = {
        red.id: red,
        sub.id: sub,
        trafo.id: trafo,
        ups.id: ups,
        sts.id: sts,
        bus.id: bus,
        sala.id: sala,
        zona.id: zona,
    }

    conexiones = [
        ConexionElectrica("red", "sub"),
        ConexionElectrica("sub", "trafo"),
        ConexionElectrica("trafo", "ups_1"),
        ConexionElectrica("ups_1", "sts_1"),
        ConexionElectrica("sts_1", "bus_1"),
        ConexionElectrica("bus_1", "sala_1"),
        ConexionElectrica("sala_1", "zona_1"),
    ]

    topologia = TopologiaSistema(nodos=nodos, conexiones=conexiones)

    # -----------------------------------------------------------------
    # 4. GRUPOS N+1 (mínimo ejemplo)
    # -----------------------------------------------------------------

    grupos = {
        "ups_group": GrupoRedundancia(
            id="ups_group",
            nombre="Grupo UPS",
            tipo_componente="ups",
            componentes_ids=["ups_1"],
            capacidad_necesaria_kw=500,
            n_requerido=1,
        )
    }

    # -----------------------------------------------------------------
    # 5. ESTADO INICIAL
    # -----------------------------------------------------------------

    estado = EstadoSimulacion(
        tiempo_actual_s=0,
        estado_global="operativo",
        componentes={
            red.id: red,
            sub.id: sub,
            trafo.id: trafo,
            ups.id: ups,
            sts.id: sts,
            bus.id: bus,
        },
        salas_it={sala.id: sala},
        zonas_it={zona.id: zona},
        cargas_it={},  # puedes añadir más adelante
        topologia=topologia,
        grupos_redundancia=grupos,
    )

    return estado


def construir_eventos():
    return [
        FalloComponente(
            id="fallo_red",
            tipo="FalloComponente",
            tiempo_s=10,
            duracion_s=0,
            objetivo_id="red",
            objetivo_tipo="RedElectrica",
            descripcion="Caída de red eléctrica",
            severidad=5,
            causa="Fallo externo",
            nuevo_estado="fallado",
        )
    ]


def main():
    estado = construir_sistema()

    motor_reglas = MotorReglas(estado.topologia)
    simulador = MotorSimulacion(estado, motor_reglas)

    eventos = construir_eventos()
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