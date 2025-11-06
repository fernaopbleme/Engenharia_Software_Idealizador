"""Rotas relacionadas a inscrições de colaboradores em projetos"""
from fastapi import APIRouter, HTTPException
from ..database import (
    get_colaborador_by_id,
    get_colaboradores_by_ids,
    get_colaboradores_inscritos_em_projeto,
    inscrever_colaborador_em_projeto,
    desinscrever_colaborador_de_projeto,
    get_all_colaboradores
)
from ..client import get_project
from ..utils.matching import extract_skills_from_tags, match_colaboradores_com_projeto

router = APIRouter(tags=["inscricoes"])


@router.get("/colaboradores/inscritos/{project_id}")
async def get_colaboradores_inscritos(project_id: int):
    """Retorna colaboradores inscritos no projeto pelo ID"""
    # Verificar se o projeto existe na API de projetos
    projeto = await get_project(project_id)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    # Buscar IDs dos colaboradores inscritos no banco local
    colaboradores_inscritos_ids = get_colaboradores_inscritos_em_projeto(project_id)
    colaboradores_inscritos = get_colaboradores_by_ids(colaboradores_inscritos_ids)
    
    return {
        "projeto": {
            "id": projeto["id"],
            "title": projeto.get("title", "")
        },
        "colaboradores": colaboradores_inscritos
    }


@router.post("/colaboradores/{colab_id}/projetos/{project_id}", status_code=201)
async def inscrever_colaborador(colab_id: int, project_id: int):
    """Inscreve um colaborador em um projeto"""
    # Verificar se o colaborador existe
    colaborador = get_colaborador_by_id(colab_id)
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    
    # Verificar se o projeto existe
    projeto = await get_project(project_id)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    # Inscrever
    sucesso = inscrever_colaborador_em_projeto(colab_id, project_id)
    if not sucesso:
        raise HTTPException(status_code=400, detail="Erro ao inscrever colaborador no projeto")
    
    return {
        "message": "Colaborador inscrito com sucesso",
        "colaborador_id": colab_id,
        "project_id": project_id
    }


@router.delete("/colaboradores/{colab_id}/projetos/{project_id}", status_code=204)
async def desinscrever_colaborador(colab_id: int, project_id: int):
    """Remove a inscrição de um colaborador de um projeto"""
    sucesso = desinscrever_colaborador_de_projeto(colab_id, project_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Inscrição não encontrada")


@router.get("/colaboradores/por-projeto/{project_id}")
async def get_colaboradores_por_projeto(project_id: int):
    """Retorna colaboradores que se encaixam no projeto pelo ID"""
    # Buscar projeto na API de projetos
    projeto = await get_project(project_id)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    # Buscar tags do projeto
    tags = projeto.get("tags", [])
    
    # Extrair skills necessárias das tags
    skills_necessarias = extract_skills_from_tags(tags)
    
    # Buscar todos os colaboradores do banco
    todos_colaboradores = get_all_colaboradores()
    
    # Filtrar colaboradores que têm as skills necessárias
    colaboradores_compatíveis = match_colaboradores_com_projeto(
        todos_colaboradores, 
        skills_necessarias
    )
    
    return {
        "projeto": {
            "id": projeto["id"],
            "title": projeto.get("title", ""),
            "description": projeto.get("description", "")
        },
        "colaboradores": colaboradores_compatíveis
    }

