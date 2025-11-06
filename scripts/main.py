"""API principal de Colaboradores"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from database import init_database
from routes import colaboradores_router, projetos_router, inscricoes_router

app = FastAPI(title="Colaboradores API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rotas
app.include_router(colaboradores_router)
app.include_router(projetos_router)
app.include_router(inscricoes_router)

# Inicializar banco de dados na startup
@app.on_event("startup")
async def startup_event():
    init_database()


@app.get("/healthz")
async def healthz():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
