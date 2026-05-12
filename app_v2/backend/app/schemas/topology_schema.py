from pydantic import BaseModel
from typing import List, Optional


class TopologyNodeResponse(BaseModel):
    id: str
    label: str
    type: str
    status: Optional[str] = None
    criticality: Optional[int] = None
    is_reserve: Optional[bool] = None


class TopologyEdgeResponse(BaseModel):
    id: str
    source: str
    target: str
    type: str
    status: str
    capacity_kw: float


class TopologyResponse(BaseModel):
    nodes: List[TopologyNodeResponse]
    edges: List[TopologyEdgeResponse]