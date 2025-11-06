"""Módulo de acesso ao banco de dados"""
from .colaboradores_db import (
    init_database,
    get_all_colaboradores,
    get_colaborador_by_email,
    get_colaborador_by_id,
    get_colaboradores_by_ids,
    create_colaborador,
    update_colaborador,
    delete_colaborador,
    inscrever_colaborador_em_projeto,
    desinscrever_colaborador_de_projeto,
    get_colaboradores_inscritos_em_projeto
)

__all__ = [
    "init_database",
    "get_all_colaboradores",
    "get_colaborador_by_email",
    "get_colaborador_by_id",
    "get_colaboradores_by_ids",
    "create_colaborador",
    "update_colaborador",
    "delete_colaborador",
    "inscrever_colaborador_em_projeto",
    "desinscrever_colaborador_de_projeto",
    "get_colaboradores_inscritos_em_projeto"
]

