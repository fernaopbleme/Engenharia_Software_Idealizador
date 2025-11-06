"""Rotas da API"""
from .colaboradores import router as colaboradores_router
from .projetos import router as projetos_router
from .inscricoes import router as inscricoes_router

__all__ = ["colaboradores_router", "projetos_router", "inscricoes_router"]

