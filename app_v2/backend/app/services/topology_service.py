from app.schemas.topology_schema import (
    TopologyNodeResponse,
    TopologyEdgeResponse,
    TopologyResponse,
)


def build_topology_response(topologia):

    nodes = []
    edges = []

    for nodo in topologia.nodos.values():

        nodes.append(
            TopologyNodeResponse(
                id=nodo.id,
                label=getattr(nodo, "nombre", nodo.id),
                type=getattr(nodo, "tipo", "unknown"),
                status=getattr(nodo, "estado", None),
                criticality=getattr(nodo, "criticidad", None),
                is_reserve=getattr(nodo, "es_reserva", None),
            )
        )

    for conexion in topologia.conexiones:

        edges.append(
            TopologyEdgeResponse(
                id=f"{conexion.origen_id}__{conexion.destino_id}",
                source=conexion.origen_id,
                target=conexion.destino_id,
                type=conexion.tipo,
                status=conexion.estado,
                capacity_kw=conexion.capacidad_kw,
            )
        )

    return TopologyResponse(
        nodes=nodes,
        edges=edges,
    )

#Transforma la topología para el front-end
