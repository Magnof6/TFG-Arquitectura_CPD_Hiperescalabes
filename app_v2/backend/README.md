```txt
Motor de simulación eléctrica para CPDs hiperescalables

Backend encargado de ejecutar simulaciones eléctricas sobre infraestructuras de CPDs hiperescalables.

Expone una API REST mediante FastAPI para:

- ejecutar simulaciones,
- consultar topologías eléctricas,
- obtener resultados estructurados,
- analizar eventos y estados del sistema.


========================================================
ARQUITECTURA
========================================================

app/
├── api/          → Endpoints FastAPI
├── domain/       → Modelos y lógica de dominio
├── simulation/   → Motor de simulación
├── scenarios/    → Escenarios predefinidos
├── schemas/      → Modelos de respuesta de la API
├── services/     → Capa intermedia backend/API
└── main.py       → Punto de entrada FastAPI


========================================================
¿QUÉ HACE EL BACKEND?
========================================================

El backend se encarga de:

- modelar la infraestructura eléctrica del CPD,
- ejecutar simulaciones de eventos y fallos,
- calcular el estado operativo del sistema,
- evaluar redundancias y capacidad,
- generar snapshots del sistema,
- exponer los resultados mediante una API REST consumible por frontend.


========================================================
CÓMO ARRANCAR EL PROYECTO
========================================================

Instalar dependencias:

pip install -r requirements.txt

Ejecutar el servidor:

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

o simplemente:

uvicorn app.main:app --reload
Uvicorn indicará en qué puerto está corriendo el servidor.


========================================================
ACCESO DESDE GITHUB CODESPACES / VSCODE
========================================================

En VSCode, ir al apartado "Ports" y hacer Ctrl + Click sobre el puerto expuesto.

Se abrirá una URL pública similar a:

https://ubiquitous-carnival-qrqr6qq9xjhqpg-8000.app.github.dev/

Para acceder a la documentación Swagger de FastAPI, añadir /docs:

https://ubiquitous-carnival-qrqr6qq9xjhqpg-8000.app.github.dev/docs


========================================================
ENDPOINTS DISPONIBLES
========================================================

Actualmente la API expone 5 endpoints principales.


--------------------------------------------------------
GET /api/scenarios
--------------------------------------------------------

Devuelve la lista de escenarios predefinidos disponibles.

Ejemplo de respuesta:

[
  {
    "scenario_id": "escenario_dc1_fallo_emf"
  }
]

En Swagger ("Try it out") se podrá visualizar:

- el comando curl,
- la Request URL,
- el body de la respuesta,
- los headers de la respuesta.


--------------------------------------------------------
POST /api/simulations/run
--------------------------------------------------------

Ejecuta una simulación.

Request body:

{
  "scenario_id": "escenario_dc1_fallo_emf"
}

Se debe sustituir "string" por el identificador del escenario deseado.

La respuesta incluye:

- KPIs,
- eventos,
- snapshots,
- componentes,
- topología (nodes y edges).

Además de:

- curl,
- Request URL,
- headers de respuesta.


--------------------------------------------------------
GET /api/topology/{scenario_id}
--------------------------------------------------------

Devuelve únicamente la topología eléctrica del escenario.

Ejemplo:

escenario_dc1_fallo_emf

IMPORTANTE:
El scenario_id debe introducirse sin comillas.

La respuesta contiene:

topology
├── nodes
└── edges

Además de:

- curl,
- Request URL,
- headers de respuesta.


--------------------------------------------------------
GET /
--------------------------------------------------------

Endpoint básico de healthcheck.

Respuesta:

{
  "status": "ok"
}


========================================================
SCHEMAS DISPONIBLES
========================================================

La documentación Swagger también expone los siguientes modelos:

- ComponentResponse
- EventResponse
- HTTPValidationError
- SimulationKpiResponse
- SimulationResultResponse
- SimulationRunRequest
- SnapshotResponse
- TopologyNodeResponse
- TopologyResponse
- ValidationError


========================================================
FLUJO GENERAL DEL BACKEND
========================================================

Escenario
   ↓
Motor de simulación
   ↓
Eventos y propagación de estados
   ↓
Cálculo de capacidad y redundancia
   ↓
Snapshots y KPIs
   ↓
Serialización API
   ↓
Frontend (React Flow)
```
