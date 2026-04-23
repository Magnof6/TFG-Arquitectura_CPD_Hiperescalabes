#OBJETOS, CARGAS, SALAS, EVENTOS, CONEXIONES

from dataclasses import dataclass,field
from typing import Optional, List, Dict

##########COMPONENTES ELÉCTRICOS########

@dataclass
class ObjetoElectrico:
    id: str
    nombre: str
    tipo: str
    estado: str     #activo, reserva, fallado, mantenimiento, desconectado
    criticidad: int #1-5, 1 es menos crítico, 5 es más crítico
    tiempo_recuperacion_s: float #SEGUNDOS
    es_reserva: bool

    def es_operativo(self) -> bool:
        return self.estado in {"activo", "reserva"} #Utilizamos un conjunto porque no importa el orden y evita duplicados
    
    def aporta_capacidad(self) -> bool:
        return self.estado == "activo"
    
@dataclass
class RedElectrica(ObjetoElectrico):
    potencia_disponible_mw: float
    tension_kv: float
    numero_lineas: int
    nodo_origen: str

@dataclass
class EMF(ObjetoElectrico): #Equipo de Media Falla, es un punto de conexión entre la red eléctrica y la infraestructura del CPD
    potencia_nominal_mva: float
    tension_kv: float
    lineas_entrantes: int
    lineas_salientes: int
    posiciones_linea: int #Número total de posiciones para líneas, incluyendo las ocupadas por líneas entrantes y salientes
    doble_circuito: bool
    proteccion_87L: bool

@dataclass
class Subestacion(ObjetoElectrico):
    potencia_nominal_mva: float
    tension_entrada_kv: float
    tension_salida_kv: float
    lineas_entrantes: int
    lineas_salientes: int
    num_transformadores: int
    esquema_barras: str
    
    #nuevos campos
    subtipo: str = "general" #primaria, secundaria, cpd, distribucion
    transformadores_ids: List[str] = field(default_factory=list)
    rmu_ids: List[str] = field(default_factory=list) #RMU: Ring Main Unit, unidad de maniobra y protección que se instala en las líneas de distribución para mejorar la confiabilidad y facilitar el mantenimiento. Permite aislar secciones de la red sin interrumpir el suministro a otras áreas, lo que es especialmente útil en entornos críticos como los CPD.
    cuadros_ids: List[str] = field(default_factory=list) #Cuadro eléctrico, es un punto de distribución que recibe la energía desde la subestación y la distribuye a los diferentes circuitos del CPD. Puede incluir protecciones, interruptores y dispositivos de control para gestionar el suministro eléctrico de manera segura y eficiente.
    bloques_asociados_ids: List[str] = field(default_factory=list) #Bloque eléctrico, es un conjunto de componentes eléctricos que alimentan una zona o sala específica del CPD. Puede incluir transformadores, cuadros eléctricos, RMU y otros dispositivos
    

@dataclass
class LineaElectrica(ObjetoElectrico):
    tension_kv: float
    capacidad_mva: float
    num_circuitos: int
    origen: str
    destino: str
    longitud_m: float

@dataclass
class Transformador(ObjetoElectrico):
    subtipo: str                 # IT, mecánico, landlord, entrante, saliente
    potencia_nominal_kva: float
    tension_entrada_kv: float
    tension_salida_kv: float
    impedancia_pct: float
    grupo_vectorial: str
    refrigeracion: str
    
    #Nuevos Campos
    tecnologia: str = "general" # seco, aceite, inmerso en líquido
    subestacion_id: Optional[str] = None
    bloque_id: Optional[str] = None
    modulo_id: Optional[str] = None

@dataclass
class Generador(ObjetoElectrico):
    subtipo: str                 # IT, mecánico
    potencia_nominal_kva: float
    potencia_nominal_kwe: float
    tension_salida_kv: float
    frecuencia_hz: float
    tiempo_arranque_s: float
    consumo_l_h: float
    autonomia_h: float
    combustible_tipo: str

@dataclass
class UPS(ObjetoElectrico):
    subtipo: str                 # IT, mecánico, landlord
    tecnologia: str              # doble conversión, VFI...
    potencia_nominal_kva: float
    potencia_nominal_kw: float
    eficiencia_pct: float
    autonomia_min_eol: float
    vida_util_anios: float
    tiempo_conmutacion_ms: float
    bateria_tipo: str
    bms_monitorizado: bool
    en_bateria: bool = False
    alimentando_zona: bool = False
    bateria_agotada: bool = False
    tiempo_inicio_bateria_s: Optional[float] = None
    transferencia_bloqueada: bool = False

@dataclass
class BateriaUPS(ObjetoElectrico):
    tecnologia: str              # ion-litio
    autonomia_min_eol: float
    vida_util_anios: float
    temperatura_operacion_c: float
    bms_activo: bool

@dataclass
class RMU(ObjetoElectrico):
    tension_kv: float
    corriente_nominal_a: float
    bloque_asociado: str
    
    #nuevos Campos
    anillo_id: Optional[str] = None
    modulo_id: Optional[str] = None
    

@dataclass
class STS(ObjetoElectrico): #Static Transfer Switch, es un dispositivo que permite conmutar automáticamente la alimentación eléctrica entre dos fuentes (por ejemplo, entre el suministro principal y una fuente de respaldo) sin interrupciones perceptibles para las cargas conectas.
    corriente_nominal_a: float
    tiempo_transferencia_ms: float
    fuente_preferida: str
    fuente_respaldo: str

@dataclass
class CuadroElectrico(ObjetoElectrico):
    subtipo: str                 # MT, BT, input switchboard
    tension_kv: float
    corriente_nominal_a: float
    corriente_cortocircuito_ka: float
    forma_segregacion: str

@dataclass
class Busbar(ObjetoElectrico):
    tension_v: float
    corriente_nominal_a: float
    capacidad_kw: float

############ CARGAS, SALAS, ZONAS ############
@dataclass
class BloqueElectrico:
    id: str
    nombre: str
    subtipo: str                 # IT, mecánico, landlord
    estado: str
    capacidad_kw: float
    es_reserva: bool
    criticidad: int
    componentes: list[str]
    cargas_asociadas: list[str]
    
    modulo_id: Optional[str] = None
    rmu_id: Optional[str] = None
    transformador_id: Optional[str] = None
    ups_ids: List[str] = field(default_factory=list)
    sts_ids: List[str] = field(default_factory=list)

@dataclass
class SalaIT:
    id: str
    nombre: str
    estado: str #alimentado, degradado, sin_alimentacion
    potencia_objetivo_kw: float
    potencia_actual_kw: float
    numero_zonas: int
    bloque_electrico_principal: str
    bloque_electrico_respaldo: str
    criticidad: int

@dataclass
class ZonaIT:
    id: str
    nombre: str
    tipo: str                    # fila, bloque IT, carga crítica
    estado: str                  # alimentado, degradado, sin_alimentacion
    demanda_kw: float
    prioridad: int
    alimentacion_preferida: str
    alimentacion_respaldo: str
    sala_it_id: str

############ CONEXIONES ############

@dataclass
class ConexionElectrica:
    origen_id: str
    destino_id: str
    estado: str = "activa"       # activa, fallada, desconectada
    tipo: str = "principal"      # principal, respaldo
    capacidad_kw: float = 0.0

    def esta_disponible(self) -> bool:
        return self.estado == "activa"
    
############ EVENTOS ############

@dataclass
class Evento:
    id: str
    tipo: str
    tiempo_s: float
    duracion_s: float
    objetivo_id: str
    objetivo_tipo: str # generador, ups, bloque, sala_it, zona_it
    descripcion: str
    severidad: int

@dataclass
class FalloComponente(Evento):
    causa: str
    nuevo_estado: str = "fallado"

@dataclass
class RecuperacionComponente(Evento):
    causa: str
    nuevo_estado: str = "activo"

@dataclass
class CambioEstado(Evento):
    estado_anterior: str
    estado_nuevo: str

@dataclass
class ConmutacionFuente(Evento):
    fuente_origen: str
    fuente_destino: str
    tiempo_transferencia_ms: float
    exito: bool

@dataclass
class Sobrecarga(Evento):
    carga_kw: float
    capacidad_disponible_kw: float
    porcentaje_sobrecarga: float

@dataclass
class PerdidaSuministro(Evento):
    nivel: str
    carga_afectada_kw: float

@dataclass
class RestablecimientoSuministro(Evento):
    nivel: str
    carga_recuperada_kw: float

@dataclass
class EntradaReserva(Evento):
    componente_reserva_id: str
    componente_sustituido_id: str

@dataclass
class SalidaReserva(Evento):
    componente_reserva_id: str
    motivo: str

@dataclass
class AgotamientoBateria(Evento):
    ups_id: str
    autonomia_restante_min: float

@dataclass
class ArranqueGenerador(Evento):
    generador_id: str
    tiempo_arranque_s: float
    arranque_exitoso: bool

@dataclass
class ParadaGenerador(Evento):
    generador_id: str
    motivo: str

@dataclass
class DegradacionSalaIT(Evento):
    sala_it_id: str
    carga_perdida_kw: float
    causa: str

@dataclass
class PerdidaSalaIT(Evento):
    sala_it_id: str
    carga_afectada_kw: float
    causa: str

@dataclass
class RestablecimientoSalaIT(Evento):
    sala_it_id: str
    carga_recuperada_kw: float

@dataclass
class PerdidaZonaIT(Evento):
    carga_it_id: str
    demanda_afectada_kw: float
    causa: str

@dataclass
class RestablecimientoZonaIT(Evento):
    carga_it_id: str
    demanda_recuperada_kw: float


####GRUPO DE REDUNDANCIA N+1######
@dataclass
class GrupoRedundancia:
    id: str
    nombre: str
    tipo_componente: str
    componentes_ids: List[str]
    capacidad_necesaria_kw: float
    n_requerido: int

######ESTADO GLOBAL Y SNAPSHOT######
@dataclass
class SnapshotSistema:
    tiempo_s: float
    estado_global: str
    carga_total_kw: float
    carga_servida_kw: float
    carga_perdida_kw: float
    capacidad_disponible_kw: float
    num_componentes_fallados: int
    num_componentes_reserva_en_uso: int
    num_salas_degradadas: int
    num_salas_sin_servicio: int

@dataclass
class RegistroEvento:
    tiempo_s: float
    tipo_evento: str
    objetivo_id: str
    descripcion: str
    estado_global_antes: str
    estado_global_despues: str