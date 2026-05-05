#OPERATIVIDAD, CAPACIDAD, N+1, PRIORIDAD DE FUENTES, ESTADO GLOBAL

from __future__ import annotations
from typing import List, Optional

import models

class MotorReglas:
    """
    Encapsula las reglas funcionales del simulador:
    - operatividad
    - conectividad
    - capacidad
    - redundancia N+1
    - selección de fuentes
    - estado global
    - generación de eventos derivados
    """
    PRIORIDAD_FUENTES = {
        "red": 1,
        "ups": 2,
        "generador": 3
    }

    def __init__(self, topologia):
        self.topologia = topologia

    #---------------------------------------------------------
    # Reglas Básicas
    #---------------------------------------------------------

    def componente_es_operativo(self, componente) -> bool:
        return componente is not None and componente.estado in {"activo", "reserva"}
    
    def componente_aporta_capacidad(self, componente) -> bool:
        return componente is not None and componente.estado == "activo"
    
    def componente_puede_suministrar(self, componente) -> bool: # para fuentes, se considera que solo las activas pueden suministrar; las reservas no aportan capacidad pero sí pueden ser consideradas para conmutación.
        if componente is None:
            return False
        if componente.tipo.lower() == "redelectrica":
            return componente.estado == "activo"
        if componente.tipo.lower() == "generador":
            return componente.estado == "activo"
        
        if componente.tipo.lower() == "ups":
            return componente.estado == "activo" and (
                getattr(componente, "en_bateria", False) or #getattr compprueba si está en modo bateria, si no devuelve False
                getattr(componente, "alimentando_zona", False)
            )
        return False
    
    def conexion_esta_disponible (self, conexion) -> bool:
        return conexion.estado == "activa"
    
    def obtener_capacidad_componente_kw(self, componente) -> float:
        """Devuelve la capacidad útil en kW del componente"""
        
        if not self.componente_aporta_capacidad(componente):
            return 0.0
        
        for attr in ("capacidad_kw","potencia_nominal_kw","potencia_nominal_kwe"):
            if hasattr(componente, attr):
                return float(getattr(componente, attr) or 0.0)
        
        if hasattr(componente, "potencia_disponible_mw"):
            return float(componente.potencia_disponible_mw) * 1000.0
        
        if hasattr(componente, "potencia_nominal_kva"):
            # simplificación V1: se aproxima kVA ~= kW
            return float(componente.potencia_nominal_kva)

        return 0.0
    
    #---------------------------------------------------------
    # Busqueda de fuentes y rutas
    #---------------------------------------------------------

    def obtener_fuentes_disponibles(self, estado) -> List[object]:
        """
        Devuelve todas las fuentes actualmente operativas

        """
        fuentes= []
        for componente in estado.componentes.values():
            if self.componente_puede_suministrar(componente):
                fuentes.append(componente)
            #tipo =  componente.tipo.lower()
            #if tipo in {"redelectrica", "ups", "generador"} and self.componente_es_operativo(componente):
            #    fuentes.append(componente)
        return fuentes

    def tipo_fuente(self, componente) -> str:
            tipo = componente.tipo.lower()
            if tipo == "redelectrica":
                return "red"
            if tipo == "ups":
                return "ups"
            if tipo == "generador":
                return "generador"
            return "otra"

    def seleccionar_mejor_fuente(self, fuentes: List[object]) -> Optional[object]:
        fuentes_validas = [f for f in fuentes if self.tipo_fuente(f) in self.PRIORIDAD_FUENTES]
        if not fuentes_validas:
            return None
        return min(fuentes_validas, key=lambda f: self.PRIORIDAD_FUENTES[self.tipo_fuente(f)])

    def ruta_es_operativa(self, ruta: List[str], estado) -> bool:
        """
        Comprueba que todos los nodos y conexiones de una ruta estén disponibles.
        """
        if not ruta:
            return False

        for nodo_id in ruta:
            nodo = self._buscar_nodo(nodo_id, estado)
            if nodo is None:
                return False

            # Las cargas y salas no usan la misma semántica que los componentes eléctricos
            if hasattr(nodo, "estado") and nodo.__class__.__name__ not in {"SalaIT", "ZonaIT"}:
                if getattr(nodo, "estado", None) in {"fallado", "mantenimiento", "desconectado"}:
                    return False

        for i in range(len(ruta) - 1):
            conexion = self.topologia.obtener_conexion(ruta[i], ruta[i + 1])
            if conexion is None or not self.conexion_esta_disponible(conexion):
                return False

        return True

    def capacidad_ruta_kw(self, ruta: List[str], estado) -> float:
        """
        La capacidad de la ruta se modela como el mínimo cuello de botella.
        """
        if not ruta:
            return 0.0

        capacidades = []

        for nodo_id in ruta:
            nodo = self._buscar_nodo(nodo_id, estado)
            if nodo is None:
                continue

            if hasattr(nodo, "tipo") and nodo.__class__.__name__ not in {"SalaIT", "ZonaIT"}:
                cap = self.obtener_capacidad_componente_kw(nodo)
                if cap > 0:
                    capacidades.append(cap)

        for i in range(len(ruta) - 1):
            conexion = self.topologia.obtener_conexion(ruta[i], ruta[i + 1])
            if conexion and conexion.capacidad_kw > 0:
                capacidades.append(conexion.capacidad_kw)

        if not capacidades:
            return 0.0

        return min(capacidades)

    def buscar_rutas_validas_a_destino(self, destino_id: str, demanda_kw: float, estado) -> List[List[str]]:
        """
        Busca rutas válidas desde las fuentes disponibles hasta un destino.
        """
        rutas_validas = []
        fuentes = self.obtener_fuentes_disponibles(estado)

        for fuente in fuentes:
            rutas = self.topologia.buscar_rutas(fuente.id, destino_id)
            for ruta in rutas:
                if self.ruta_es_operativa(ruta, estado):
                    if self.capacidad_ruta_kw(ruta, estado) >= demanda_kw:
                        rutas_validas.append(ruta)

        rutas_validas.sort(
            key=lambda ruta: self.PRIORIDAD_FUENTES.get(
                self.tipo_fuente(self._buscar_nodo(ruta[0], estado)),
                999
            )
        )
        return rutas_validas
    
    def buscar_fuente_valida_para_zona(self, zona, estado):
        fuente_actual_id = getattr(zona, "alimentacion_actual", None)
        fuente_pref_id = getattr(zona, "alimentacion_preferida", None)
        fuente_resp_id = getattr(zona, "alimentacion_respaldo", None)
        
        candidatos = [fuente_actual_id,fuente_pref_id, fuente_resp_id]
        candidatos = list(dict.fromkeys(c for c in candidatos if c is not None))  # Eliminar duplicados y Nones, manteniendo el orden

        for fuente_id in candidatos:
            fuente = estado.componentes.get(fuente_id)
            if fuente is None:
                continue

            if getattr(fuente, "estado", None) != "activo":
                continue

            if getattr(fuente, "transferencia_bloqueada", False):
                continue

            if getattr(fuente, "bateria_agotada", False):
                continue

            rutas = self.topologia.buscar_rutas(fuente_id, zona.id)

            for ruta in rutas:
                if (
                    self.ruta_es_operativa(ruta, estado)
                    and self.capacidad_ruta_kw(ruta, estado) >= zona.demanda_kw
                ):
                    return fuente_id

        return None
    #---------------------------------------------------------
    # Alimentación de Cargas y Salas
    #---------------------------------------------------------

    def carga_esta_alimentada(self, carga, estado) -> bool:
        rutas= self.buscar_rutas_validas_a_destino(
            destino_id=carga.id,
            demanda_kw=carga.demanda_kw,
            estado=estado
        )
        return len(rutas) > 0
    
    def carga_tiene_redundancia(self, carga, estado) -> bool:
        rutas = self.buscar_rutas_validas_a_destino(
            destino_id=carga.id,
            demanda_kw=carga.demanda_kw,
            estado=estado
        )
        return len(rutas) >= 2
#Evaluar si me lo puedo cargar
    def reevaluar_carga(self, carga, estado) -> None:
        if self.carga_esta_alimentada(carga, estado):
            if self.carga_tiene_redundancia(carga, estado):
                carga.estado = "alimentado"
            else:
                carga.estado = "degradado"
        else:
            carga.estado = "sin_alimentacion"

    def reevaluar_todas_las_cargas(self, estado) -> None:
        if hasattr(estado, "zonas_it"):
            for zona in estado.zonas_it.values():
                self.reevaluar_zona(zona, estado)
#--------------------------------------------------------

    def reevaluar_zona(self, zona, estado) -> None:
        if getattr(zona, "deslastrada", False):
            zona.estado="sin_alimentacion"
            return
        
        rutas = self.buscar_rutas_validas_a_destino(
            destino_id=zona.id,
            demanda_kw=zona.demanda_kw,
            estado=estado,
        )
        if not rutas:
            zona.estado = "sin_alimentacion"
        elif len(rutas) == 1:
            zona.estado = "degradado"
        else:
            zona.estado = "alimentado"

    def reevaluar_sala(self, sala, estado) -> None:
        zonas = [
            z for z in estado.zonas_it.values()
            if z.sala_it_id == sala.id
        ] if hasattr(estado, "zonas_it") else []

        if not zonas:
            sala.estado = "sin_alimentacion"
            sala.potencia_actual_kw = 0.0
            return

        potencia_servida = sum(
            z.demanda_kw for z in zonas if z.estado in {"alimentado", "degradado"}
        )
        sala.potencia_actual_kw = potencia_servida

        estados = {z.estado for z in zonas}
        if estados == {"alimentado"}:
            sala.estado = "alimentada"
        elif "alimentado" in estados or "degradado" in estados:
            sala.estado = "degradada"
        else:
            sala.estado = "sin_alimentacion"

    def reevaluar_todas_las_salas(self, estado) -> None:
        for sala in estado.salas_it.values():
            self.reevaluar_sala(sala, estado)

    # ---------------------------------------------------------------------
    # 4. REDUNDANCIA N+1
    # ---------------------------------------------------------------------

    def buscar_grupo_de_componente(self, componente_id: str, estado):
        for grupo in estado.grupos_redundancia.values():
            if componente_id in grupo.componentes_ids:
                return grupo
        return None

    def obtener_componentes_grupo(self, grupo, estado) -> List[object]:
        return [
            estado.componentes[cid]
            for cid in grupo.componentes_ids
            if cid in estado.componentes
        ]

    def grupo_capacidad_activa_kw(self, grupo, estado) -> float:
        total = 0.0
        for comp in self.obtener_componentes_grupo(grupo, estado):
            if comp.estado == "activo":
                total += self.obtener_capacidad_componente_kw(comp)
        return total

    def grupo_tiene_reserva_disponible(self, grupo, estado) -> bool:
        for comp in self.obtener_componentes_grupo(grupo, estado):
            if comp.estado == "reserva":
                return True
        return False

    def grupo_esta_degradado(self, grupo, estado) -> bool:
        componentes = self.obtener_componentes_grupo(grupo, estado)
        activos = [c for c in componentes if c.estado == "activo"]
        reservas_activadas = [
            c for c in componentes
            if getattr(c, "es_reserva", False) and c.estado == "activo"
        ]
        capacidad_activa = sum(self.obtener_capacidad_componente_kw(c) for c in activos)
        reserva_disponible = self.grupo_tiene_reserva_disponible(grupo, estado)

        # Degradado si:
        # - ya entró una reserva en servicio,
        # - la capacidad activa no cubre la demanda del grupo, o
        # - se perdió la redundancia N+1 (ya no queda reserva disponible).
        return (
            bool(reservas_activadas)
            or capacidad_activa < grupo.capacidad_necesaria_kw
            or (len(componentes) > grupo.n_requerido and not reserva_disponible)
        )

    def generar_evento_entrada_reserva(self, grupo, componente_fallado_id: str, tiempo_s: float):
        """
        Si un grupo N+1 pierde un activo y existe reserva, genera el evento de entrada.
        """
        reserva = None
        componentes = getattr(grupo, "_componentes_cache", None)

        # Este método se invoca desde events.py, así que el estado no está aquí;
        # la reserva se buscará externamente si se quiere mayor precisión.
        # En V1 lo resolvemos desde el propio grupo si ya se conoce.
        if componentes:
            for comp in componentes:
                if comp.estado == "reserva":
                    reserva = comp
                    break

        return None  # esta versión se resolverá con el método extendido de abajo

    def generar_evento_entrada_reserva_desde_estado(self, grupo, componente_fallado_id: str, tiempo_s: float, estado):
        for comp in self.obtener_componentes_grupo(grupo, estado):
            if comp.estado == "reserva":
                return models.EntradaReserva(
                    id=f"entrada_reserva_{grupo.id}_{comp.id}_{int(tiempo_s)}",
                    tipo="EntradaReserva",
                    tiempo_s=tiempo_s,
                    duracion_s=0.0,
                    objetivo_id=grupo.id,
                    objetivo_tipo=grupo.tipo_componente,
                    descripcion=f"Entrada de reserva {comp.id} por fallo de {componente_fallado_id}",
                    severidad=2,
                    componente_reserva_id=comp.id,
                    componente_sustituido_id=componente_fallado_id,
                )
        return None

    def reevaluar_grupos_redundancia(self, estado):
        eventos = []
        for grupo in estado.grupos_redundancia.values():
            componentes = self.obtener_componentes_grupo(grupo, estado)
            
            reservas_activadas = [
                c for c in componentes
                if getattr(c, "es_reserva", False) and c.estado == "activo"
            ]
            
            if reservas_activadas:
                continue  # ya se activó una reserva, no se generan eventos adicionales
            
            capacidad = self.grupo_capacidad_activa_kw(grupo, estado)
            
            if capacidad < grupo.capacidad_necesaria_kw and self.grupo_tiene_reserva_disponible(grupo, estado):
                
                fallados = [comp for comp in componentes if comp.estado in {"fallado", "mantenimiento", "desconectado"}] #detectamos el componente que ha dejado de estar operativo
                componente_fallado_id = fallados[0].id if fallados else "desconocido"
                evento = self.generar_evento_entrada_reserva_desde_estado(
                    grupo=grupo,
                    componente_fallado_id=componente_fallado_id,
                    tiempo_s=estado.tiempo_actual_s,
                    estado=estado,
                )
                if evento:
                    eventos.append(evento)
        return eventos

    # ---------------------------------------------------------------------
    # 5. SOBRECARGA Y PRIORIZACIÓN DE CARGA
    # ---------------------------------------------------------------------

    def detectar_sobrecarga(self, demanda_kw: float, capacidad_kw: float) -> bool:
        return demanda_kw > capacidad_kw

    def calcular_porcentaje_sobrecarga(self, demanda_kw: float, capacidad_kw: float) -> float:
        if capacidad_kw <= 0:
            return 100.0
        exceso = max(0.0, demanda_kw - capacidad_kw)
        return (exceso / capacidad_kw) * 100.0

    def aplicar_prioridad_cargas(self, cargas: List[object], capacidad_disponible_kw: float) -> List[object]:
        """
        Devuelve las cargas servidas por prioridad.
        Prioridad más alta = número mayor.
        """
        cargas_ordenadas = sorted(cargas, key=lambda c: c.prioridad, reverse=True)
        servidas = []
        restante = capacidad_disponible_kw

        for carga in cargas_ordenadas:
            if carga.demanda_kw <= restante:
                servidas.append(carga)
                restante -= carga.demanda_kw

        return servidas

    def generar_eventos_por_sobrecarga(self, evento: models.Sobrecarga, estado):
        eventos = []
        cargas = [
            z for z in getattr(estado, "zonas_it", {}).values()
            if getattr(z, "demanda_kw", 0.0) > 0
        ]

        capacidad_evento = evento.capacidad_disponible_kw

        if capacidad_evento >= evento.carga_kw:
            return []

        servidas = self.aplicar_prioridad_cargas(cargas, capacidad_evento)
        servidas_ids = {c.id for c in servidas}

        generadores_programados = False #evita duplicidad de eventos si hay varias cargas afectadas por la misma sobrecarga y no hay UPS disponibles
        for carga in cargas:
            if carga.id in servidas_ids:
                continue

            # 1. Intentar UPS A/B como apoyo
            evento_ups = self.generar_evento_apoyo_ups_por_sobrecarga(
                zona=carga,
                evento=evento,
                estado=estado,
            )

            if evento_ups is not None:
                eventos.append(evento_ups)

                if not generadores_programados:
                    eventos.extend(
                        self.generar_eventos_arranque_generadores_por_sobrecarga(
                            tiempo_s=evento.tiempo_s,
                            estado=estado,
                            capacidad_objetivo_kw=evento.carga_kw,
                            capacidad_inicial_kw=evento.capacidad_disponible_kw,
                        )
                    )
                    generadores_programados = True

                continue
            # 2. Si no hay UPS disponible, usar la redistribución antigua
            eventos_alt = self.generar_eventos_redistribucion_por_sobrecarga(
                zona=carga,
                evento=evento,
                estado=estado,
            )

            if eventos_alt:
                eventos.extend(eventos_alt)
                continue

            # 3. Si no hay alternativa, deslastre
            eventos.append(
                self.crear_evento_deslastre_por_sobrecarga(
                    zona=carga,
                    evento=evento,
                    motivo="sin fuente alternativa disponible",
                )
            )

        return eventos


    # ---------------------------------------------------------------------
    # 6. GENERACIÓN DE EVENTOS DERIVADOS
    # ---------------------------------------------------------------------

    def generar_eventos_caida_red(self, tiempo_s: float, estado):
        eventos = []

        # 1. Conmutación a la UPS preferida de cada zona
        ups_ya_programadas = set()

        for zona in estado.zonas_it.values():
            ups_id = zona.alimentacion_preferida
            ups = estado.componentes.get(ups_id)

            if ups is None:
                continue
            if ups.estado != "activo":
                continue
            if ups.id in ups_ya_programadas:
                continue

            eventos.append(
                models.ConmutacionFuente(
                    id=f"conm_ups_{ups.id}_{int(tiempo_s)}",
                    tipo="ConmutacionFuente",
                    tiempo_s=tiempo_s,
                    duracion_s=0.0,
                    objetivo_id=ups.id,
                    objetivo_tipo="ups",
                    descripcion=f"Conmutación temporal a UPS {ups.id}",
                    severidad=2,
                    fuente_origen="red",
                    fuente_destino=ups.id,
                    tiempo_transferencia_ms=getattr(ups, "tiempo_conmutacion_ms", 0.0),
                    exito=True,
                )
            )

            eventos.append(
                models.AgotamientoBateria(
                    id=f"agotamiento_{ups.id}_{int(tiempo_s)}",
                    tipo="AgotamientoBateria",
                    tiempo_s=tiempo_s + getattr(ups, "autonomia_min_eol", 0.0) * 60.0,
                    duracion_s=0.0,
                    objetivo_id=ups.id,
                    objetivo_tipo="ups",
                    descripcion=f"Agotamiento previsto de batería en {ups.id}",
                    severidad=4,
                    ups_id=ups.id,
                    autonomia_restante_min=0.0,
                )
            )
            ups_ya_programadas.add(ups.id)

        # 2. Arranque de generadores
        for componente in estado.componentes.values():
            if componente.tipo.lower() == "generador" and componente.estado in {"activo", "reserva"}:
                eventos.append(
                    models.ArranqueGenerador(
                        id=f"arranque_{componente.id}_{int(tiempo_s)}",
                        tipo="ArranqueGenerador",
                        tiempo_s=tiempo_s + getattr(componente, "tiempo_arranque_s", 0.0),
                        duracion_s=0.0,
                        objetivo_id=componente.id,
                        objetivo_tipo="generador",
                        descripcion=f"Arranque automático de generador {componente.id}",
                        severidad=3,
                        generador_id=componente.id,
                        tiempo_arranque_s=getattr(componente, "tiempo_arranque_s", 0.0),
                        arranque_exitoso=True,
                    )
                )
        return eventos

    def generar_eventos_retorno_red(self, tiempo_s: float, estado):
        eventos = []
        for componente in estado.componentes.values():
            if componente.tipo.lower() == "ups":
                if componente.estado == "activo" and (
                    getattr(componente, "en_bateria", False) or
                    getattr(componente, "alimentando_zona", False)
                ):
                    eventos.append(
                        models.RestablecimientoSuministro(
                            id=f"restore_{componente.id}_{int(tiempo_s)}",
                            tipo="RestablecimientoSuministro",
                            tiempo_s=tiempo_s,
                            duracion_s=0.0,
                            objetivo_id=componente.id,
                            objetivo_tipo=componente.tipo,
                            descripcion=f"Retorno a fuente preferida; salida de servicio de {componente.id}",
                            severidad=1,
                            nivel="retorno_red",
                            carga_recuperada_kw=self.obtener_capacidad_componente_kw(componente),
                        )
                    )
        
            elif componente.tipo.lower() == "generador" and componente.estado == "activo":
                eventos.append(
                    models.RestablecimientoSuministro(
                        id=f"restore_{componente.id}_{int(tiempo_s)}",
                        tipo="RestablecimientoSuministro",
                        tiempo_s=tiempo_s,
                        duracion_s=0.0,
                        objetivo_id=componente.id,
                        objetivo_tipo=componente.tipo,
                        descripcion=f"Retorno a fuente preferida; salida de servicio de {componente.id}",
                        severidad=1,
                        nivel="retorno_red",
                        carga_recuperada_kw=0.0,
                    )
                )

        return eventos

    def generar_eventos_fallo_ups(self, ups_id: str, tiempo_s: float, estado, estado_anterior: str = "activo"):
        eventos = []
        ups = estado.componentes.get(ups_id)
        if ups is None:
            return eventos

        #Si la UPS estaba en reserva y no estaba alimentando, no hay perdida directa.
        if estado_anterior != "activo":
            return eventos

        grupo = self.buscar_grupo_de_componente(ups_id, estado)
        if grupo is not None and self.grupo_tiene_reserva_disponible(grupo, estado):
            return eventos
        # Buscar respaldo por generador o pérdida de suministro
        generadores_activos = [
            c for c in estado.componentes.values()
            if c.tipo.lower() == "generador" and c.estado == "activo"
        ]

        if generadores_activos:
            gen = generadores_activos[0]
            eventos.append(
                models.ConmutacionFuente(
                    id=f"conm_{ups_id}_{gen.id}_{int(tiempo_s)}",
                    tipo="ConmutacionFuente",
                    tiempo_s=tiempo_s,
                    duracion_s=0.0,
                    objetivo_id=ups_id,
                    objetivo_tipo="ups",
                    descripcion=f"Conmutación desde UPS {ups_id} hacia generador {gen.id}",
                    severidad=3,
                    fuente_origen=ups_id,
                    fuente_destino=gen.id,
                    tiempo_transferencia_ms=50.0,
                    exito=True,
                )
            )
        else:
            eventos.append(
                models.PerdidaSuministro(
                    id=f"loss_ups_{ups_id}_{int(tiempo_s)}",
                    tipo="PerdidaSuministro",
                    tiempo_s=tiempo_s,
                    duracion_s=0.0,
                    objetivo_id=ups_id,
                    objetivo_tipo="ups",
                    descripcion=f"Pérdida de suministro por fallo de UPS {ups_id}",
                    severidad=4,
                    nivel="bloque",
                    carga_afectada_kw=self.obtener_capacidad_componente_kw(ups),
                )
            )

        return eventos

    def generar_eventos_fallo_generador(self, generador_id: str, tiempo_s: float, estado):
        eventos = []

        generadores_activos = [
            c for c in estado.componentes.values()
            if c.tipo.lower() == "generador" and c.estado == "activo"
        ]

        if not generadores_activos:
            eventos.append(
                models.PerdidaSuministro(
                    id=f"loss_gen_{generador_id}_{int(tiempo_s)}",
                    tipo="PerdidaSuministro",
                    tiempo_s=tiempo_s,
                    duracion_s=0.0,
                    objetivo_id=generador_id,
                    objetivo_tipo="generador",
                    descripcion=f"Pérdida potencial de suministro por fallo de generador {generador_id}",
                    severidad=5,
                    nivel="sistema",
                    carga_afectada_kw=0.0,
                )
            )

        return eventos

    def generar_eventos_agotamiento_bateria(self, evento: models.AgotamientoBateria, estado):
        #¿Hay alguna zona que dependa de la UPS?
        zonas_afectadas = [
            z for z in estado.zonas_it.values()
            if z.alimentacion_preferida == evento.ups_id or z.alimentacion_respaldo == evento.ups_id
        ]

        #1. intentar UPS de respaldo
        eventos = []
        ups_respaldo_programadas = set()

        for zona in zonas_afectadas:
            ups_respaldo_id = zona.alimentacion_respaldo
            if ups_respaldo_id == evento.ups_id: #Si la UPS de respaldo es la misma que la que se ha agotado, no sirve como respaldo
                continue 
            ups_respaldo = estado.componentes.get(ups_respaldo_id)
            if ups_respaldo is None:
                continue
            if ups_respaldo.estado != "activo":
                continue
            if ups_respaldo.id in ups_respaldo_programadas:
                continue

            eventos.append(
                models.ConmutacionFuente(
                    id=f"conm_respaldo_{ups_respaldo.id}_{int(evento.tiempo_s)}",
                    tipo="ConmutacionFuente",
                    tiempo_s=evento.tiempo_s,
                    duracion_s=0.0,
                    objetivo_id=ups_respaldo.id,
                    objetivo_tipo="ups",
                    descripcion=f"Conmutación a UPS de respaldo {ups_respaldo.id} por agotamiento de batería en {evento.ups_id}",
                    severidad=3,
                    fuente_origen=evento.ups_id,
                    fuente_destino=ups_respaldo.id,
                    tiempo_transferencia_ms=getattr(ups_respaldo, "tiempo_conmutacion_ms", 0.0),
                    exito=True,
                )
            )
            eventos.append(
                models.AgotamientoBateria(
                    id=f"agotamiento_respaldo_{ups_respaldo.id}_{int(evento.tiempo_s)}",
                    tipo="AgotamientoBateria",
                    tiempo_s=evento.tiempo_s + getattr(ups_respaldo, "autonomia_min_eol", 0.0) * 60.0,
                    duracion_s=0.0,
                    objetivo_id=ups_respaldo.id,
                    objetivo_tipo="ups",
                    descripcion=f"Agotamiento previsto de batería en UPS  {ups_respaldo.id}",
                    severidad=4,
                    ups_id=ups_respaldo.id,
                    autonomia_restante_min=0.0,
                )
            )
            ups_respaldo_programadas.add(ups_respaldo.id)
        if eventos:
            return eventos
        #2. ¿Existe un generador activo con ruta válida de esas zonas?
        for comp in estado.componentes.values():
            if comp.tipo.lower() != "generador" or comp.estado != "activo":
                continue
            for zona in zonas_afectadas:
                rutas =  self.topologia.buscar_rutas(comp.id, zona.id)
                for ruta in rutas:
                    if self.ruta_es_operativa(ruta, estado) and self.capacidad_ruta_kw(ruta, estado) >= zona.demanda_kw:
                        return []
        #3. Si no hay respaldo posible, se genera la pérdida de suministro
        return [
            models.PerdidaSuministro(
                id=f"loss_bat_{evento.ups_id}_{int(evento.tiempo_s)}",
                tipo="PerdidaSuministro",
                tiempo_s=evento.tiempo_s,
                duracion_s=0.0,
                objetivo_id=evento.ups_id,
                objetivo_tipo="ups",
                descripcion=f"Pérdida de suministro por agotamiento de batería en {evento.ups_id}",
                severidad=5,
                nivel="ups",
                carga_afectada_kw=0.0,
            )
        ]

    def generar_eventos_fallo_conmutacion(self, evento: models.ConmutacionFuente, estado):
        eventos = []

        # Caso especial: fallo al transferir a una UPS preferida.
        if evento.objetivo_tipo.lower() == "ups":
            ups_fallida_id = evento.fuente_destino

            zonas_afectadas = [
                z for z in estado.zonas_it.values()
                if z.alimentacion_preferida == ups_fallida_id
            ]

            for zona in zonas_afectadas:
                ups_respaldo_id = zona.alimentacion_respaldo
                ups_respaldo = estado.componentes.get(ups_respaldo_id)

                if (
                    ups_respaldo is not None
                    and ups_respaldo.estado == "activo"
                    and ups_respaldo.id != ups_fallida_id
                ):
                    eventos.append(
                        models.ConmutacionFuente(
                            id=f"fallback_{ups_fallida_id}_{ups_respaldo.id}_{int(evento.tiempo_s)}",
                            tipo="ConmutacionFuente",
                            tiempo_s=evento.tiempo_s,
                            duracion_s=0.0,
                            objetivo_id=ups_respaldo.id,
                            objetivo_tipo="ups",
                            descripcion=(
                                f"Conmutación a UPS de respaldo {ups_respaldo.id} "
                                f"tras fallo de transferencia a {ups_fallida_id}"
                            ),
                            severidad=3,
                            fuente_origen=evento.fuente_origen,
                            fuente_destino=ups_respaldo.id,
                            tiempo_transferencia_ms=getattr(ups_respaldo, "tiempo_conmutacion_ms", 0.0),
                            exito=True,
                        )
                    )

            if eventos:
                return eventos

        # Si no hay respaldo posible, se registra pérdida
        return [
            models.PerdidaSuministro(
                id=f"loss_transfer_{evento.objetivo_id}_{int(evento.tiempo_s)}",
                tipo="PerdidaSuministro",
                tiempo_s=evento.tiempo_s,
                duracion_s=0.0,
                objetivo_id=evento.objetivo_id,
                objetivo_tipo=evento.objetivo_tipo,
                descripcion=f"Fallo de conmutación {evento.fuente_origen} -> {evento.fuente_destino}",
                severidad=5,
                nivel="transferencia",
                carga_afectada_kw=0.0,
            )
        ]
    
    def generar_eventos_entrada_generador(self, generador_id: str, tiempo_s: float, estado):
        generador = estado.componentes.get(generador_id)
        if generador is None or generador.estado != "activo":
            return []
        
        for zona in estado.zonas_it.values():
            rutas = self.topologia.buscar_rutas(generador_id, zona.id)
            for ruta in rutas:
                if self.ruta_es_operativa(ruta, estado) and self.capacidad_ruta_kw(ruta, estado) >= zona.demanda_kw:
                    return [
                        models.RestablecimientoSuministro(
                            id=f"restore_gen_{generador_id}_{int(tiempo_s)}",
                            tipo="RestablecimientoSuministro",
                            tiempo_s=tiempo_s,
                            duracion_s=0.0,
                            objetivo_id=generador_id,
                            objetivo_tipo="generador",
                            descripcion=f"Entrada en servicio del generador {generador_id}",
                            severidad=2,
                            nivel="entrada_generador", #El generador se queda activo
                            carga_recuperada_kw=0.0,
                        )
                    ]
        return []

    def generar_evento_conmutacion_bloque(self, trafo_id: str, estado):
        trafo = estado.componentes.get(trafo_id)
        if trafo is None:
            return
        modulo = trafo.modulo_id.split("_")[-1] 
        bloque = trafo.bloque_id.split("_")[-1]

        #Si el bloque ya es de reserva, no hace falta hacer nada
        if bloque == "7":
            return

        trafo_reserva_id = f"trafo_m{modulo}_7"
        rmu_id = f"rmu_m{modulo}_{bloque}"

        # 1. RMU → TRAFO
        self.topologia.reemplazar_conexion(rmu_id, trafo_id, trafo_reserva_id)

        # 2. TRAFO → UPS
        self.topologia.agregar_conexion(
            models.ConexionElectrica(
                origen_id=trafo_reserva_id,
                destino_id=f"ups_m{modulo}_{bloque}_a",
                tipo="respaldo",
            )
        )
        self.topologia.agregar_conexion(
            models.ConexionElectrica(
                origen_id=trafo_reserva_id,
                destino_id=f"ups_m{modulo}_{bloque}_b",
                tipo="respaldo",
            )
        )

        # 3) eliminar las conexiones antiguas del trafo fallado a esas UPS
        self.topologia.eliminar_conexion(trafo_id, f"ups_m{modulo}_{bloque}_a")
        self.topologia.eliminar_conexion(trafo_id, f"ups_m{modulo}_{bloque}_b")
    
    def generar_eventos_redistribucion_por_sobrecarga(self, zona, evento, estado):
        eventos = []
        tiempo_s = evento.tiempo_s
        es_sobrecarga_global = evento.objetivo_tipo.lower() == "sistema"
        
        fuente_pref_id = zona.alimentacion_preferida
        fuente_actual_id = getattr(zona, "alimentacion_actual", fuente_pref_id)

        fuente_destino_id = self.buscar_fuente_valida_para_zona(zona, estado)

        if fuente_destino_id is not None and fuente_destino_id != fuente_pref_id:
            fuente_destino = estado.componentes.get(fuente_destino_id)

            eventos.append(
                models.ConmutacionFuente(
                    id=f"sobrecarga_conm_{zona.id}_{fuente_destino_id}_{int(tiempo_s)}",
                    tipo="ConmutacionFuente",
                    tiempo_s=tiempo_s,
                    duracion_s=0.0,
                    objetivo_id=zona.id,
                    objetivo_tipo="zona_it",
                    descripcion=f"Conmutación a fuente alternativa {fuente_destino_id} por sobrecarga en {zona.id}",
                    severidad=3,
                    fuente_origen=fuente_actual_id,
                    fuente_destino=fuente_destino_id,
                    tiempo_transferencia_ms=getattr(fuente_destino, "tiempo_conmutacion_ms", 0.0),
                    exito=True,
                )
            )
            return eventos

        # 2) En global o local, intentar generadores activos
        for comp in estado.componentes.values():
            if comp.tipo.lower() != "generador":
                continue
            if comp.estado != "activo":
                continue

            rutas = self.topologia.buscar_rutas(comp.id, zona.id)
            for ruta in rutas:
                if self.ruta_es_operativa(ruta, estado):
                    eventos.append(
                        models.ConmutacionFuente(
                            id=f"sobrecarga_gen_{zona.id}_{comp.id}_{int(evento.tiempo_s)}",
                            tipo="ConmutacionFuente",
                            tiempo_s=evento.tiempo_s,
                            duracion_s=0.0,
                            objetivo_id=zona.id,
                            objetivo_tipo="zona_it",
                            descripcion=f"Reconfiguración a generador {comp.id} por sobrecarga en {zona.id}",
                            severidad=3,
                            fuente_origen=getattr(zona, "alimentacion_actual", fuente_pref_id),
                            fuente_destino=comp.id,
                            tiempo_transferencia_ms=50.0,
                            exito=True,
                        )
                    )
                    return eventos

        return eventos

    # ---------------------------------------------------------------------
    # 7. ESTADO GLOBAL
    # ---------------------------------------------------------------------

    def hay_perdida_carga_critica(self, estado) -> bool:
        cargas = list(getattr(estado, "zonas_it", {}).values())
        for carga in cargas:
            if (
                getattr(carga, "demanda_kw", 0.0) > 0.0
                and getattr(carga, "prioridad", 0) >= 4
                and carga.estado == "sin_alimentacion"
            ):
                return True
        return False

    def hay_perdida_redundancia(self, estado) -> bool:
        for grupo in estado.grupos_redundancia.values():
            if self.grupo_esta_degradado(grupo, estado):
                return True
        return False

    def hay_capacidad_comprometida(self, estado) -> bool:
        demanda_total = self.demanda_total_kw(estado)
        capacidad_total = self.capacidad_total_activa_kw(estado)
        return capacidad_total < demanda_total
    
    def hay_contingencia_fuente_principal(self, estado) -> bool:
        for componente in estado.componentes.values():
            tipo = componente.tipo.lower()
            
            if tipo in {"redelectrica", "emf", "subestacion"} and componente.estado in {"fallado", "mantenimiento", "desconectado"}:
                return True
            if tipo == "ups" and getattr(componente, "en_bateria", False):
                return True
            if tipo == "generador" and componente.estado == "activo":
                return True
        return False

    def determinar_estado_global(self, estado) -> str:
        if self.carga_servida_kw(estado) <= 0.0:
            return "fallado"
        
        if self.hay_perdida_carga_critica(estado):
            return "fallado"
        
        if self.carga_servida_kw(estado) < self.demanda_total_kw(estado):
            return "degradado"
        
        if self.hay_contingencia_fuente_principal(estado):
            return "degradado"
        
        if self.hay_perdida_redundancia(estado) or self.hay_capacidad_comprometida(estado):
            return "degradado"
        return "operativo"
    # ---------------------------------------------------------------------
    # 8. MÉTRICAS BÁSICAS DEL ESTADO
    # ---------------------------------------------------------------------

    def demanda_total_kw(self, estado) -> float:
        total = 0.0
        for zona in getattr(estado, "zonas_it", {}).values():
            total += getattr(zona, "demanda_kw", 0.0)
        return total

    def carga_servida_kw(self, estado) -> float:
        total = 0.0
        for zona in getattr(estado, "zonas_it", {}).values():
            if zona.estado in {"alimentado", "degradado"}:
                total += getattr(zona, "demanda_kw", 0.0)
        return total

    def carga_perdida_kw(self, estado) -> float:
        return max(0.0, self.demanda_total_kw(estado) - self.carga_servida_kw(estado))

    def capacidad_total_activa_kw(self, estado) -> float:
        total = 0.0
        zonas = list(getattr(estado, "zonas_it", {}).values())
        
        for comp in estado.componentes.values():
            if self.tipo_fuente(comp) not in {"red", "ups", "generador"}:
                continue
            if comp.estado != "activo":
                continue
            
            tiene_ruta_valida = False
            for zona in zonas:
                rutas = self.topologia.buscar_rutas(comp.id, zona.id)
                for ruta in rutas:
                    if self.ruta_es_operativa(ruta, estado) and self.capacidad_ruta_kw(ruta, estado) >= zona.demanda_kw:
                        tiene_ruta_valida = True
                        break
                if tiene_ruta_valida:
                    break
                
            if tiene_ruta_valida:
                total += self.obtener_capacidad_componente_kw(comp)
                
        return total

    # ---------------------------------------------------------------------
    # 9. HELPERS INTERNOS
    # ---------------------------------------------------------------------

    def _buscar_nodo(self, nodo_id: str, estado):
        if nodo_id in estado.componentes:
            return estado.componentes[nodo_id]
        if hasattr(estado, "zonas_it") and nodo_id in estado.zonas_it:
            return estado.zonas_it[nodo_id]
        if hasattr(estado, "salas_it") and nodo_id in estado.salas_it:
            return estado.salas_it[nodo_id]
        return None
    
    def generar_evento_apoyo_ups_por_sobrecarga(self, zona, evento, estado):
        for ups_id in [zona.alimentacion_preferida, zona.alimentacion_respaldo]:
            ups = estado.componentes.get(ups_id)

            if ups is None:
                continue

            if ups.estado != "activo":
                continue

            if getattr(ups, "bateria_agotada", False):
                continue

            if getattr(ups, "transferencia_bloqueada", False):
                continue

            return models.ConmutacionFuente(
                id=f"sobrecarga_apoyo_ups_{zona.id}_{ups.id}_{int(evento.tiempo_s)}",
                tipo="ConmutacionFuente",
                tiempo_s=evento.tiempo_s,
                duracion_s=0.0,
                objetivo_id=zona.id,
                objetivo_tipo="zona_it",
                descripcion=f"Apoyo mediante UPS {ups.id} por sobrecarga en {zona.id}",
                severidad=3,
                fuente_origen=getattr(zona, "alimentacion_actual", zona.alimentacion_preferida),
                fuente_destino=ups.id,
                tiempo_transferencia_ms=getattr(ups, "tiempo_conmutacion_ms", 0.0),
                exito=True,
            )

        return None
    
    def crear_evento_deslastre_por_sobrecarga(self, zona, evento, motivo: str):
        return models.PerdidaSuministro(
            id=f"deslastre_sobrecarga_{zona.id}_{int(evento.tiempo_s)}",
            tipo="PerdidaSuministro",
            tiempo_s=evento.tiempo_s,
            duracion_s=evento.duracion_s,
            objetivo_id=zona.id,
            objetivo_tipo=getattr(zona, "tipo", "zona_it"),
            descripcion=f"Deslastre de {zona.id} por sobrecarga: {motivo}",
            severidad=evento.severidad,
            nivel="carga",
            carga_afectada_kw=zona.demanda_kw,
        )

    def generar_eventos_arranque_generadores_por_sobrecarga(self,tiempo_s: float,estado,capacidad_objetivo_kw: float,capacidad_inicial_kw: float,):
        eventos = []

        capacidad_actual = capacidad_inicial_kw

        for componente in estado.componentes.values():
            if componente.tipo.lower() != "generador":
                continue

            if componente.estado != "reserva":
                continue

            if capacidad_actual >= capacidad_objetivo_kw:
                break

            capacidad_actual += getattr(componente, "potencia_nominal_kwe", 0.0)

            eventos.append(
                models.ArranqueGenerador(
                    id=f"arranque_sobrecarga_{componente.id}_{int(tiempo_s)}",
                    tipo="ArranqueGenerador",
                    tiempo_s=tiempo_s + getattr(componente, "tiempo_arranque_s", 0.0),
                    duracion_s=0.0,
                    objetivo_id=componente.id,
                    objetivo_tipo="generador",
                    descripcion=f"Arranque de {componente.id} por apoyo a sobrecarga",
                    severidad=3,
                    generador_id=componente.id,
                    tiempo_arranque_s=getattr(componente, "tiempo_arranque_s", 0.0),
                    arranque_exitoso=True,
                )
            )

        return eventos