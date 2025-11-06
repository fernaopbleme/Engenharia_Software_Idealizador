"""Rotas relacionadas a projetos"""
from fastapi import APIRouter, HTTPException
from ..client import get_project, list_projects

router = APIRouter(prefix="/projects", tags=["projetos"])


@router.get("")
async def listar_projetos_route():
    """Lista todos os projetos da API de projetos"""
    projetos = await list_projects()
    return projetos


@router.get("/{project_id}")
async def get_projeto_route(project_id: int):
    """Busca um projeto pelo ID na API de projetos"""
    projeto = await get_project(project_id)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto

