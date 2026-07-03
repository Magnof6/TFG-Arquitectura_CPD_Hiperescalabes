from __future__ import annotations

from app.domain.models import (
    RedElectrica,
    EMF,
    Subestacion,
    Transformador,
    RMU,
    UPS,
    STS,
    Busbar,
    SalaIT,
    ZonaIT,
    ConexionElectrica,
    FalloComponente,
    GrupoRedundancia,
    Generador,
    RecuperacionComponente,
    ParadaGenerador,
    Sobrecarga,
    ConmutacionFuente,
    SalidaReserva,
)
from app.domain.topology import TopologiaSistema
from app.simulation.engine import EstadoSimulacion
from typing import NamedTuple

# =========================================================
# HELPERS
# =========================================================

class BloqueITCreado(NamedTuple):
    rmu: RMU
    trafo: Transformador
    ups_a: UPS
    ups_b: UPS
    sts: STS
    bus: Busbar
    sala: SalaIT
    zona: ZonaIT
    conexiones: list


def _crear_bloque_it(modulo: int, bloque: int, es_reserva: bool, subestacion_id: str) -> BloqueITCreado:
    """
    Crea todos los componentes de un bloque IT (RMU, Transformador, UPS A/B,
    STS, Busbar, Sala y Zona) junto con sus conexiones internas.
    No incluye la conexión desde la RMU del módulo (esa la añade el caller).
    """
    m, b = modulo, bloque
    estado_bloque = "reserva" if es_reserva else "activo"
    demanda_kw = 1800 if not es_reserva else 0

    rmu = RMU(
        id=f"rmu_m{m}_{b}",
        nombre=f"RMU módulo {m} bloque {b}",
        tipo="RMU",
        estado=estado_bloque,
        criticidad=5,
        tiempo_recuperacion_s=180,
        es_reserva=es_reserva,
        tension_kv=11,
        corriente_nominal_a=630,
        bloque_asociado=f"bloque_m{m}_{b}",
        anillo_id=f"anillo_11kv_modulo_{m}",
        modulo_id=f"modulo_it_{m}",
    )

    trafo = Transformador(
        id=f"trafo_m{m}_{b}",
        nombre=f"Trafo 11/0.415 módulo {m} bloque {b}",
        tipo="Transformador",
        estado=estado_bloque,
        criticidad=5,
        tiempo_recuperacion_s=300,
        es_reserva=es_reserva,
        subtipo="IT",
        potencia_nominal_kva=4500,
        tension_entrada_kv=11,
        tension_salida_kv=0.415,
        tecnologia="seco",
        subestacion_id=subestacion_id,
        bloque_id=f"bloque_m{m}_{b}",
        modulo_id=f"modulo_it_{m}",
        impedancia_pct=8,
        grupo_vectorial="Dyn11",
        refrigeracion="ANAN",
    )

    def _crear_ups(sufijo: str) -> UPS:
        return UPS(
            id=f"ups_m{m}_{b}_{sufijo}",
            nombre=f"UPS {sufijo.upper()} módulo {m} bloque {b}",
            tipo="UPS",
            estado=estado_bloque,
            criticidad=5,
            tiempo_recuperacion_s=100,
            es_reserva=es_reserva,
            subtipo="IT",
            tecnologia="VFI",
            potencia_nominal_kva=2100,
            potencia_nominal_kw=1890,
            eficiencia_pct=95,
            autonomia_min_eol=7.5,
            vida_util_anios=10,
            tiempo_conmutacion_ms=10,
            bateria_tipo="Li-ion",
            bms_monitorizado=True,
        )

    ups_a = _crear_ups("a")
    ups_b = _crear_ups("b")

    sts = STS(
        id=f"sts_m{m}_{b}",
        nombre=f"STS módulo {m} bloque {b}",
        tipo="STS",
        estado=estado_bloque,
        criticidad=5,
        tiempo_recuperacion_s=60,
        es_reserva=es_reserva,
        corriente_nominal_a=1600,
        tiempo_transferencia_ms=10,
        fuente_preferida=ups_a.id,
        fuente_respaldo=ups_b.id,
    )

    bus = Busbar(
        id=f"bus_m{m}_{b}",
        nombre=f"Busbar módulo {m} bloque {b}",
        tipo="Busbar",
        estado="activo",
        criticidad=4,
        tiempo_recuperacion_s=60,
        es_reserva=False,
        tension_v=415,
        corriente_nominal_a=6300,
        capacidad_kw=4000,  # bloque ~4 MW
    )

    sala = SalaIT(
        id=f"sala_m{m}_{b}",
        nombre=f"Sala módulo {m} bloque {b}",
        estado="alimentado" if not es_reserva else "degradada",
        potencia_objetivo_kw=demanda_kw,
        potencia_actual_kw=demanda_kw,
        numero_zonas=1,
        bloque_electrico_principal=f"bloque_m{m}_{b}",
        bloque_electrico_respaldo=f"bloque_m{m}_7" if b != 7 else "",
        criticidad=5,
    )

    zona = ZonaIT(
        id=f"zona_m{m}_{b}",
        nombre=f"Zona módulo {m} bloque {b}",
        tipo="critica",
        estado="alimentado" if not es_reserva else "sin_alimentacion",
        demanda_kw=demanda_kw,
        prioridad=5,
        alimentacion_preferida=ups_a.id,
        alimentacion_respaldo=ups_b.id,
        sala_it_id=sala.id,
    )

    conexiones = [
        ConexionElectrica(rmu.id, trafo.id),
        ConexionElectrica(trafo.id, ups_a.id),
        ConexionElectrica(trafo.id, ups_b.id),
        ConexionElectrica(ups_a.id, sts.id),
        ConexionElectrica(ups_b.id, sts.id, tipo="respaldo"),
        ConexionElectrica(sts.id, bus.id),
        ConexionElectrica(bus.id, sala.id),
        ConexionElectrica(sala.id, zona.id),
    ]

    return BloqueITCreado(rmu, trafo, ups_a, ups_b, sts, bus, sala, zona, conexiones)

def _crear_escenario_tillion_dc1():
    """
    DC_1 simplificado pero fiel:

    Campus:
        red -> emf -> set_cpd_400_66 -> anillos_66kv -> set_dc1_66_11

    Edificio DC_1:
        3 módulos IT
        cada módulo: 7 bloques (6 activos + 1 reserva)
        cada bloque:
            rmu 11 kV -> trafo 11/0.415 -> UPS A/B -> STS -> bus -> sala -> zona

    Generación:
        14 generadores a nivel edificio, conectados al 11 kV del edificio
    """

    # =====================================================
    # 1) UPSTREAM CAMPUS
    # =====================================================

    red = RedElectrica(
        id="red",
        nombre="Red Eléctrica Principal",
        tipo="RedElectrica",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=300,
        es_reserva=False,
        potencia_disponible_mw=300,
        tension_kv=400,
        numero_lineas=1,   # la documentación subida habla de 1 circuito actual y previsión de 2º futuro
        nodo_origen="SET_PENIAFLOR_400KV",
    )

    emf = EMF(
        id="emf_1",
        nombre="EMF 400 kV",
        tipo="EMF",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=300,
        es_reserva=False,
        potencia_nominal_mva=300,
        tension_kv=400,
        lineas_entrantes=1,
        lineas_salientes=2,   # 2 salidas hacia SET CPD Tillion
        posiciones_linea=3,
        doble_circuito=True,
        proteccion_87L=True,
    )

    set_cpd = Subestacion(
        id="set_cpd_400_66",
        nombre="SET CPD Tillion 400/66 kV",
        tipo="Subestacion",
        subtipo="primaria",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=500,
        es_reserva=False,
        potencia_nominal_mva=300,
        tension_entrada_kv=400,
        tension_salida_kv=66,
        lineas_entrantes=2,
        lineas_salientes=3,
        num_transformadores=3,
        esquema_barras="doble",
        transformadores_ids=[
            "trafo_400_66_1",
            "trafo_400_66_2",
            "trafo_400_66_3",
        ],
    )

    trafo_400_66_1 = Transformador(
        id="trafo_400_66_1",
        nombre="Trafo 400/66 kV 1",
        tipo="Transformador",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=600,
        es_reserva=False,
        subtipo="primario",
        potencia_nominal_kva=100000,
        tension_entrada_kv=400,
        tension_salida_kv=66,
        subestacion_id=set_cpd.id,
        impedancia_pct=10,
        grupo_vectorial="YNd11",
        refrigeracion="ONAF",
    )
    trafo_400_66_2 = Transformador(
        id="trafo_400_66_2",
        nombre="Trafo 400/66 kV 2",
        tipo="Transformador",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=600,
        es_reserva=False,
        subtipo="primario",
        potencia_nominal_kva=100000,
        tension_entrada_kv=400,
        tension_salida_kv=66,
        subestacion_id=set_cpd.id,
        impedancia_pct=10,
        grupo_vectorial="YNd11",
        refrigeracion="ONAF",
    )
    trafo_400_66_3 = Transformador(
        id="trafo_400_66_3",
        nombre="Trafo 400/66 kV 3",
        tipo="Transformador",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=600,
        es_reserva=False,
        subtipo="primario",
        potencia_nominal_kva=100000,
        tension_entrada_kv=400,
        tension_salida_kv=66,
        subestacion_id=set_cpd.id,
        impedancia_pct=10,
        grupo_vectorial="YNd11",
        refrigeracion="ONAF",
    )

    set_dc1 = Subestacion(
        id="set_dc1_66_11",
        nombre="SET DC_1 66/11 kV",
        tipo="Subestacion",
        subtipo="secundaria",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=500,
        es_reserva=False,
        potencia_nominal_mva=120,
        tension_entrada_kv=66,
        tension_salida_kv=11,
        lineas_entrantes=3,
        lineas_salientes=3,   # una por módulo IT
        num_transformadores=3,
        esquema_barras="doble",
    )
    
    barra_11kv = Busbar(
        id="barra_11kv_dc1",
        nombre="Barra 11 kV DC_1",
        tipo="Busbar",
        estado="activo",
        criticidad=5,
        tiempo_recuperacion_s=60,
        es_reserva=False,
        tension_v=11000,
        corriente_nominal_a=6300,
        capacidad_kw=12000,
    )
    # =====================================================
    # 2) NODOS BASE
    # =====================================================

    nodos = {
        red.id: red,
        emf.id: emf,
        set_cpd.id: set_cpd,
        trafo_400_66_1.id: trafo_400_66_1,
        trafo_400_66_2.id: trafo_400_66_2,
        trafo_400_66_3.id: trafo_400_66_3,
        set_dc1.id: set_dc1,
        barra_11kv.id: barra_11kv,
    }

    conexiones = [
        ConexionElectrica("red", "emf_1"),
        ConexionElectrica("emf_1", "set_cpd_400_66"),
        ConexionElectrica("set_cpd_400_66", "trafo_400_66_1"),
        ConexionElectrica("set_cpd_400_66", "trafo_400_66_2"),
        ConexionElectrica("set_cpd_400_66", "trafo_400_66_3"),
        ConexionElectrica("trafo_400_66_1", "set_dc1_66_11"),
        ConexionElectrica("trafo_400_66_2", "set_dc1_66_11"),
        ConexionElectrica("trafo_400_66_3", "set_dc1_66_11"),
        ConexionElectrica("set_dc1_66_11", "barra_11kv_dc1"),
    ]

    grupos = {}

    salas_it = {}
    zonas_it = {}

    # =====================================================
    # 3) 3 MÓDULOS IT x 7 BLOQUES
    # =====================================================

    for m in range(1, 4):
        # una RMU/alimentación de módulo desde SET DC_1
        rmu_modulo = RMU(
            id=f"rmu_modulo_{m}",
            nombre=f"RMU módulo IT {m}",
            tipo="RMU",
            estado="activo",
            criticidad=5,
            tiempo_recuperacion_s=200,
            es_reserva=False,
            tension_kv=11,
            corriente_nominal_a=630,
            bloque_asociado=f"modulo_it_{m}",
            anillo_id=f"anillo_11kv_modulo_{m}",
            modulo_id=f"modulo_it_{m}",
        )
        nodos[rmu_modulo.id] = rmu_modulo
        conexiones.append(ConexionElectrica("barra_11kv_dc1", rmu_modulo.id))

        # 7 bloques por módulo: 6 activos + 1 reserva
        trafos_modulo = []
        rmus_modulo = []
        sts_modulo = []

        for b in range(1, 8):
            es_reserva = (b == 7)

            bloque = _crear_bloque_it(
                modulo=m,
                bloque=b,
                es_reserva=es_reserva,
                subestacion_id=set_dc1.id,
            )

            for obj in [bloque.rmu, bloque.trafo, bloque.ups_a, bloque.ups_b, bloque.sts, bloque.bus]:
                nodos[obj.id] = obj

            nodos[bloque.sala.id] = bloque.sala
            nodos[bloque.zona.id] = bloque.zona
            salas_it[bloque.sala.id] = bloque.sala
            zonas_it[bloque.zona.id] = bloque.zona

            trafos_modulo.append(bloque.trafo.id)
            rmus_modulo.append(bloque.rmu.id)
            sts_modulo.append(bloque.sts.id)

            conexiones.append(ConexionElectrica(rmu_modulo.id, bloque.rmu.id))
            conexiones.extend(bloque.conexiones)

        grupos[f"grupo_trafos_modulo_{m}"] = GrupoRedundancia(
            id=f"grupo_trafos_modulo_{m}",
            nombre=f"Transformadores IT módulo {m}",
            tipo_componente="transformador",
            componentes_ids=trafos_modulo,
            capacidad_necesaria_kw=24000,
            n_requerido=6,
        )

        grupos[f"grupo_rmus_modulo_{m}"] = GrupoRedundancia(
            id=f"grupo_rmus_modulo_{m}",
            nombre=f"RMUs IT módulo {m}",
            tipo_componente="rmu",
            componentes_ids=rmus_modulo,
            capacidad_necesaria_kw=0,
            n_requerido=6,
        )

        grupos[f"grupo_sts_modulo_{m}"] = GrupoRedundancia(
            id=f"grupo_sts_modulo_{m}",
            nombre=f"STS IT módulo {m}",
            tipo_componente="sts",
            componentes_ids=sts_modulo,
            capacidad_necesaria_kw=0,
            n_requerido=6,
        )

    # =====================================================
    # 4) 14 GENERADORES A NIVEL EDIFICIO
    # =====================================================

    for g in range(1, 15):
        gen = Generador(
            id=f"gen_dc1_{g}",
            nombre=f"Generador DC1 {g}",
            tipo="Generador",
            estado="reserva",
            criticidad=5,
            tiempo_recuperacion_s=180,
            es_reserva=True,
            subtipo="IT",
            potencia_nominal_kva=2500,
            potencia_nominal_kwe=2000,
            tension_salida_kv=11,
            frecuencia_hz=50,
            tiempo_arranque_s=15,
            consumo_l_h=400,
            autonomia_h=48,
            combustible_tipo="diesel",
        )
        nodos[gen.id] = gen

        # Simplificación: los generadores alimentan la  barra 11 kV del edificio directamente
        conexiones.append(ConexionElectrica(gen.id, "barra_11kv_dc1", tipo="respaldo"))

    # =====================================================
    # 5) TOPOLOGÍA Y ESTADO
    # =====================================================

    topologia = TopologiaSistema(nodos=nodos, conexiones=conexiones)

    componentes = {
        k: v for k, v in nodos.items()
        if hasattr(v, "tipo")
    }

    estado = EstadoSimulacion(
        tiempo_actual_s=0,
        estado_global="operativo",
        componentes=componentes,
        salas_it=salas_it,
        zonas_it=zonas_it,
        cargas_it={},
        topologia=topologia,
        grupos_redundancia=grupos,
    )

    return estado

# =========================================================
# FACTORIES DE EVENTOS
# =========================================================

def _fallo(id, objetivo_id, objetivo_tipo, descripcion, causa, tiempo_s, duracion_s, severidad):
    return FalloComponente(
        id=id,
        tipo="FalloComponente",
        tiempo_s=tiempo_s,
        duracion_s=duracion_s,
        objetivo_id=objetivo_id,
        objetivo_tipo=objetivo_tipo,
        descripcion=descripcion,
        severidad=severidad,
        causa=causa,
        nuevo_estado="fallado",
    )


def _recuperacion(id, objetivo_id, objetivo_tipo, descripcion, causa, tiempo_s, duracion_s, severidad):
    return RecuperacionComponente(
        id=id,
        tipo="RecuperacionComponente",
        tiempo_s=tiempo_s,
        duracion_s=duracion_s,
        objetivo_id=objetivo_id,
        objetivo_tipo=objetivo_tipo,
        descripcion=descripcion,
        severidad=severidad,
        causa=causa,
        nuevo_estado="activo",
    )


def _parada_generador(id, generador_id, descripcion, motivo, tiempo_s, duracion_s, severidad):
    return ParadaGenerador(
        id=id,
        tipo="ParadaGenerador",
        tiempo_s=tiempo_s,
        duracion_s=duracion_s,
        objetivo_id=generador_id,
        objetivo_tipo="Generador",
        descripcion=descripcion,
        severidad=severidad,
        generador_id=generador_id,
        motivo=motivo,
    )


def _sobrecarga(id, descripcion, tiempo_s, duracion_s, severidad, carga_kw, capacidad_disponible_kw):
    porcentaje_sobrecarga = ((carga_kw - capacidad_disponible_kw) / capacidad_disponible_kw) * 100.0
    return Sobrecarga(
        id=id,
        tipo="Sobrecarga",
        tiempo_s=tiempo_s,
        duracion_s=duracion_s,
        objetivo_id="dc1",
        objetivo_tipo="Sistema",
        descripcion=descripcion,
        severidad=severidad,
        carga_kw=carga_kw,
        capacidad_disponible_kw=capacidad_disponible_kw,
        porcentaje_sobrecarga=porcentaje_sobrecarga,
    )


def _conmutacion_fallida(id, objetivo_id, fuente_origen, fuente_destino, descripcion, tiempo_s, duracion_s, severidad, tiempo_transferencia_ms=10.0):
    return ConmutacionFuente(
        id=id,
        tipo="ConmutacionFuente",
        tiempo_s=tiempo_s,
        duracion_s=duracion_s,
        objetivo_id=objetivo_id,
        objetivo_tipo="ups",
        descripcion=descripcion,
        severidad=severidad,
        fuente_origen=fuente_origen,
        fuente_destino=fuente_destino,
        tiempo_transferencia_ms=tiempo_transferencia_ms,
        exito=False,
    )


def _salida_reserva(id, objetivo_id, componente_reserva_id, descripcion, motivo, tiempo_s, duracion_s, severidad, objetivo_tipo="transformador"):
    return SalidaReserva(
        id=id,
        tipo="SalidaReserva",
        tiempo_s=tiempo_s,
        duracion_s=duracion_s,
        objetivo_id=objetivo_id,
        objetivo_tipo=objetivo_tipo,
        descripcion=descripcion,
        severidad=severidad,
        componente_reserva_id=componente_reserva_id,
        motivo=motivo,
    )

# =========================================================
# ESCENARIOS
# =========================================================

def escenario_dc1_sin_eventos():
    return _crear_escenario_tillion_dc1(), []


def escenario_dc1_fallo_emf():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_emf", "emf_1", "EMF", "Fallo del EMF", causa="Fallo en infraestructura AT", tiempo_s=10, duracion_s=0, severidad=5),
    ]
    return estado, eventos


def escenario_dc1_fallo_set_dc1():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_set_dc1", "set_dc1_66_11", "Subestacion", "Fallo de la SET DC_1 66/11 kV", causa="Fallo interno", tiempo_s=10, duracion_s=0, severidad=5),
    ]
    return estado, eventos

def escenario_dc1_fallo_barra_11kv():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_barra_11Kv_dc1", "barra_11kv_dc1", "Busbar", "Fallo de la barra 11 kV del edificio DC_1", causa="Fallo interno en distribución 11 kV", tiempo_s=10, duracion_s=0, severidad=5),
    ]
    return estado, eventos


def escenario_dc1_fallo_trafo_bloque():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_trafo_m1_1", "trafo_m1_1", "Transformador", "Fallo del trafo del bloque m1_1", causa="Fallo interno", tiempo_s=10, duracion_s=0, severidad=5),
    ]
    return estado, eventos

def escenario_dc1_fallo_y_recuperacion_emf():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_emf", "emf_1", "EMF", "Fallo del EMF", causa="Fallo en infraestructura AT", tiempo_s=10, duracion_s=0, severidad=5),
        _recuperacion("recuperacion_emf", "emf_1", "EMF", "Recuperación del EMF", causa="Restablecimiento de infraestructura AT", tiempo_s=100, duracion_s=0, severidad=2),
    ]
    return estado, eventos

def escenario_dc1_fallo_emf_y_parada_generador():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_emf", "emf_1", "EMF", "Fallo del EMF", causa="Fallo en infraestructura AT", tiempo_s=10, duracion_s=0, severidad=5),
        _parada_generador("parada_gen_dc1_1", "gen_dc1_1", "Parada del generador gen_dc1_1", motivo="fallo al suministrar diesel al equipo", tiempo_s=60, duracion_s=0, severidad=3),
    ]
    return estado, eventos

def escenario_dc1_sobrecarga_simple():
    estado = _crear_escenario_tillion_dc1()

    carga_kw = 40000.0
    capacidad_disponible_kw = 30000.0

    eventos = [
        _sobrecarga("sobrecarga_dc1_simple", "Sobrecarga simple del sistema DC_1", tiempo_s=10, duracion_s=0, severidad=4, carga_kw=carga_kw, capacidad_disponible_kw=capacidad_disponible_kw)
    ]
    return estado, eventos

def escenario_dc1_sobrecarga_sin_respaldo_local():
    estado = _crear_escenario_tillion_dc1()

    carga_kw = 40000.0
    capacidad_disponible_kw = 30000.0

    eventos = [
        _fallo("fallo_ups_m3_5_b", "ups_m3_5_b", "UPS", "Fallo de UPS B del bloque m3_5", causa="Fallo previo en respaldo local", tiempo_s=5, duracion_s=0, severidad=4),
        _fallo("fallo_ups_m3_6_b", "ups_m3_6_b", "UPS", "Fallo de UPS B del bloque m3_6", causa="Fallo previo en respaldo local", tiempo_s=5, duracion_s=0, severidad=4),
        _sobrecarga("sobrecarga_dc1_sin_respaldo_local", "Sobrecarga del sistema DC_1 sin respaldo local en algunos bloques", tiempo_s=10, duracion_s=0, severidad=4, carga_kw=carga_kw, capacidad_disponible_kw=capacidad_disponible_kw)
    ]
    return estado, eventos

def escenario_dc1_fallo_emf_y_sobrecarga():
    estado = _crear_escenario_tillion_dc1()

    carga_kw = 40000.0
    capacidad_disponible_kw = 28000.0

    eventos = [
        _fallo("fallo_emf_sobrecarga", "emf_1", "EMF", "Fallo del EMF previo a sobrecarga", causa="Fallo en infraestructura AT", tiempo_s=10, duracion_s=0, severidad=5),
        _sobrecarga("sobrecarga_dc1_post_emf", "Déficit de capacidad de generación de emergencia tras fallo del EMF (sobrecarga del sistema DC_1)", tiempo_s=30, duracion_s=0, severidad=5, carga_kw=carga_kw, capacidad_disponible_kw=capacidad_disponible_kw)
    ]
    return estado, eventos

def escenario_dc1_fallo_emf_parada_generadores_y_sobrecarga():
    estado = _crear_escenario_tillion_dc1()

    carga_kw = 40000.0
    capacidad_disponible_kw = 22000.0

    eventos = [
        _fallo("fallo_emf_generadores_sobrecarga", "emf_1", "EMF", "Fallo del EMF previo a sobrecarga severa", causa="Fallo en infraestructura AT", tiempo_s=10, duracion_s=0, severidad=5),
        _parada_generador("parada_gen_dc1_1_sobrecarga", "gen_dc1_1", "Parada del generador gen_dc1_1", motivo="Fallo durante operación en respaldo", tiempo_s=40, duracion_s=0, severidad=4),
        _parada_generador("parada_gen_dc1_2_sobrecarga", "gen_dc1_2", "Parada del generador gen_dc1_2", motivo="Fallo durante operación en respaldo", tiempo_s=40, duracion_s=0, severidad=4),
        _parada_generador("parada_gen_dc1_3_sobrecarga", "gen_dc1_3", "Parada del generador gen_dc1_3", motivo="Fallo durante operación en respaldo", tiempo_s=40, duracion_s=0, severidad=4),
        _sobrecarga("sobrecarga_dc1_severa", "Sobrecarga severa del sistema DC_1 con menos generadores disponibles", tiempo_s=50, duracion_s=0, severidad=5, carga_kw=carga_kw, capacidad_disponible_kw=capacidad_disponible_kw)
    ]
    return estado, eventos

def escenario_dc1_fallo_conmutacion_ups():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _conmutacion_fallida("fallo_conmutacion_ups_m1_1_a", "ups_m1_1_a", "red", "ups_m1_1_a", "Fallo de conmutación a UPS ups_m1_1_a", tiempo_s=10, duracion_s=0, severidad=5, tiempo_transferencia_ms=10.0),
    ]
    return estado, eventos

def escenario_dc1_salida_reserva_trafo():
    estado = _crear_escenario_tillion_dc1()

    # activar manualmente la reserva para que tenga sentido sacarla
    estado.componentes["trafo_m1_7"].estado = "activo"

    eventos = [
        _salida_reserva("salida_reserva_trafo_m1_7", "grupo_trafos_modulo_1", "trafo_m1_7", "Salida de reserva del trafo m1_7", motivo="Trafo anterior se ha reestablecido y ya no es necesario mantener la reserva activa", tiempo_s=10, duracion_s=0, severidad=2),
    ]
    return estado, eventos


def escenario_dc1_fallo_emf_y_fallo_conmutacion_ups_a_bloque():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_emf", "emf_1", "EMF", "Fallo del EMF", causa="Fallo en infraestructura AT", tiempo_s=10, duracion_s=0, severidad=5),
        _conmutacion_fallida("fallo_conmutacion_ups_m1_1_a", "ups_m1_1_a", "red", "ups_m1_1_a", "Fallo de conmutación a UPS ups_m1_1_a del bloque m1_1", tiempo_s=10, duracion_s=0, severidad=5, tiempo_transferencia_ms=10.0),
    ]
    return estado, eventos

def escenario_dc1_fallo_emf_y_fallo_conmutacion_ups_a_y_ups_b_bloque():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_emf", "emf_1", "EMF", "Fallo del EMF", causa="Fallo en infraestructura AT", tiempo_s=10, duracion_s=0, severidad=5),
        _conmutacion_fallida("fallo_conmutacion_ups_m1_1_a", "ups_m1_1_a", "red", "ups_m1_1_a", "Fallo de conmutación a UPS ups_m1_1_a del bloque m1_1", tiempo_s=10, duracion_s=0, severidad=5, tiempo_transferencia_ms=10.0),
        _fallo("fallo_ups_m1_1_b", "ups_m1_1_b", "UPS", "Fallo de UPS B del bloque m1_1", causa="Fallo interno UPS de respaldo", tiempo_s=10, duracion_s=0, severidad=5),
    ]
    return estado, eventos

def escenario_dc1_fallo_sts_bloque():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_sts_m1_1", "sts_m1_1", "STS", "Fallo del STS del bloque m1_1", causa="Fallo interno STS", tiempo_s=10, duracion_s=0, severidad=5),
    ]
    return estado, eventos

def escenario_dc1_fallo_doble_sts_modulo():
    estado= _crear_escenario_tillion_dc1()
    eventos=[
        _fallo("fallo_sts_m1_1", "sts_m1_1", "STS", "Fallo del STS del bloque m1_1", causa="Fallo interno STS", tiempo_s=10, duracion_s=0, severidad=5),
        _fallo("fallo_sts_m1_2", "sts_m1_2", "STS", "Fallo del STS del bloque m1_2", causa="Fallo interno STS", tiempo_s=10, duracion_s=0, severidad=5),
    ]
    return estado, eventos

def escenario_dc1_fallo_doble_sts_y_emf():
    estado = _crear_escenario_tillion_dc1()
    eventos=[
        _fallo("fallo_sts_m1_1", "sts_m1_1", "STS", "Fallo del STS del bloque m1_1", causa="Fallo interno STS", tiempo_s=5, duracion_s=0, severidad=5),
        _fallo("fallo_sts_m1_2", "sts_m1_2", "STS", "Fallo del STS del bloque m1_2", causa="Fallo interno STS", tiempo_s=5, duracion_s=0, severidad=5),
        _fallo("fallo_emf", "emf_1", "EMF", "Fallo del EMF tras fallo doble de STS", causa="Fallo en infraestructura AT", tiempo_s=10, duracion_s=0, severidad=5)
    ]
    return estado, eventos


def escenario_dc1_fallo_rmu_modulo():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_rmu_modulo_1", "rmu_modulo_1", "RMU", "Fallo de la RMU del módulo 1", causa="Fallo en distribución 11 kV del módulo 1", tiempo_s=10, duracion_s=0, severidad=5)
    ]
    return estado, eventos

def escenario_dc1_fallo_rmu_bloque():
    estado = _crear_escenario_tillion_dc1()
    eventos = [
        _fallo("fallo_rmu_m1_1", "rmu_m1_1", "RMU", "Fallo de la RMU del bloque m1_1", causa="Fallo en distribución 11 kV del bloque m1_1", tiempo_s=10, duracion_s=0, severidad=5)
    ]
    return estado, eventos

ESCENARIOS_DC1 = {
    "escenario_dc1_sin_eventos": escenario_dc1_sin_eventos,
    "escenario_dc1_fallo_emf": escenario_dc1_fallo_emf,
    "escenario_dc1_fallo_set_dc1": escenario_dc1_fallo_set_dc1,
    "escenario_dc1_fallo_barra_11kv": escenario_dc1_fallo_barra_11kv,
    "escenario_dc1_fallo_trafo_bloque": escenario_dc1_fallo_trafo_bloque,
    "escenario_dc1_fallo_y_recuperacion_emf": escenario_dc1_fallo_y_recuperacion_emf,
    "escenario_dc1_fallo_emf_y_parada_generador": escenario_dc1_fallo_emf_y_parada_generador,
    "escenario_dc1_fallo_conmutacion_ups": escenario_dc1_fallo_conmutacion_ups,
    "escenario_dc1_salida_reserva_trafo": escenario_dc1_salida_reserva_trafo,
    "escenario_dc1_fallo_emf_y_fallo_conmutacion_ups_a_bloque": escenario_dc1_fallo_emf_y_fallo_conmutacion_ups_a_bloque,
    "escenario_dc1_fallo_emf_y_fallo_conmutacion_ups_a_y_ups_b_bloque": escenario_dc1_fallo_emf_y_fallo_conmutacion_ups_a_y_ups_b_bloque,
    "escenario_dc1_fallo_sts_bloque": escenario_dc1_fallo_sts_bloque,
    "escenario_dc1_fallo_doble_sts_modulo": escenario_dc1_fallo_doble_sts_modulo,
    "escenario_dc1_fallo_doble_sts_y_emf": escenario_dc1_fallo_doble_sts_y_emf,
    "escenario_dc1_fallo_rmu_modulo": escenario_dc1_fallo_rmu_modulo,
    "escenario_dc1_fallo_rmu_bloque": escenario_dc1_fallo_rmu_bloque,
}

ESCENARIOS_SOBRECARGA = {
    "escenario_dc1_sobrecarga_simple": escenario_dc1_sobrecarga_simple,
    "escenario_dc1_sobrecarga_sin_respaldo_local": escenario_dc1_sobrecarga_sin_respaldo_local,
    "escenario_dc1_fallo_emf_y_sobrecarga": escenario_dc1_fallo_emf_y_sobrecarga,
    "escenario_dc1_fallo_emf_parada_generadores_y_sobrecarga": escenario_dc1_fallo_emf_parada_generadores_y_sobrecarga,
}