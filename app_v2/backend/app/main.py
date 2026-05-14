#EJECUCIÓN
# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.scenariosR import router as scenarios_router
from app.api.routes.simulationsR import router as simulations_router
from app.api.routes.topologyR import router as topology_router


app = FastAPI(
    title="Electrical Simulation API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://ubiquitous-carnival-qrqr6qq9xjhqpg-5173.app.github.dev",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],  # luego lo restringimos al frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scenarios_router)
app.include_router(simulations_router)
app.include_router(topology_router)


@app.get("/")
def health_check():
    return {"status": "ok"}

#Main.py se encarga de crear la aplicación FastAPI, configurar CORS y registrar las rutas de los endpoints para escenarios, simulaciones y topología. 
# También incluye un endpoint de salud para verificar que la API está funcionando correctamente.

#Para arrancar el servidor, ejecutar: 
#uvicorn app.main:app --reload
