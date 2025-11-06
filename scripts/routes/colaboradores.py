"""Rotas relacionadas a colaboradores"""
from fastapi import APIRouter, HTTPException
from ..models import ColaboradorCreate, ColaboradorUpdate
from ..database import (
    get_all_colaboradores,
    get_colaborador_by_email,
    get_colaborador_by_id,
    create_colaborador,
    update_colaborador,
    delete_colaborador
)

router = APIRouter(prefix="/colaboradores", tags=["colaboradores"])


@router.get("")
async def listar_colaboradores():
    """Retorna todos os colaboradores do banco de dados"""
    return get_all_colaboradores()


@router.get("/email/{email}")
async def get_colaborador_by_email_route(email: str):
    """Busca um colaborador pelo e-mail"""
    colaborador = get_colaborador_by_email(email)
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    return colaborador


@router.get("/{colab_id}")
async def get_colaborador_by_id_route(colab_id: int):
    """Busca um colaborador pelo ID"""
    colaborador = get_colaborador_by_id(colab_id)
    if not colaborador:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    return colaborador


@router.post("", status_code=201)
async def criar_colaborador(colaborador: ColaboradorCreate):
    """Cria um novo colaborador"""
    try:
        skills_dict = [{"nome": s.nome, "nivel": s.nivel} for s in colaborador.skills]
        novo_colab = create_colaborador(
            email=colaborador.email,
            nome=colaborador.nome,
            cargo=colaborador.cargo,
            level=colaborador.level,
            skills=skills_dict
        )
        return novo_colab
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{colab_id}")
async def atualizar_colaborador(colab_id: int, colaborador: ColaboradorUpdate):
    """Atualiza um colaborador"""
    skills_dict = None
    if colaborador.skills is not None:
        skills_dict = [{"nome": s.nome, "nivel": s.nivel} for s in colaborador.skills]
    
    atualizado = update_colaborador(
        colab_id=colab_id,
        email=colaborador.email,
        nome=colaborador.nome,
        cargo=colaborador.cargo,
        level=colaborador.level,
        skills=skills_dict
    )
    
    if not atualizado:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    return atualizado


@router.delete("/{colab_id}", status_code=204)
async def deletar_colaborador(colab_id: int):
    """Deleta um colaborador"""
    sucesso = delete_colaborador(colab_id)
    if not sucesso:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")

