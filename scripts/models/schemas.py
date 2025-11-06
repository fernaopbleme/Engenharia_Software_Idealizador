"""Modelos Pydantic para validação de dados"""
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from ..utils.constants import LEVEL, SKILL_LEVEL


class Skill(BaseModel):
    """Modelo para uma habilidade"""
    nome: str
    nivel: SKILL_LEVEL


class ColaboradorCreate(BaseModel):
    """Modelo para criação de colaborador"""
    email: EmailStr
    nome: str
    cargo: str
    level: LEVEL
    skills: List[Skill]


class ColaboradorUpdate(BaseModel):
    """Modelo para atualização de colaborador"""
    email: Optional[EmailStr] = None
    nome: Optional[str] = None
    cargo: Optional[str] = None
    level: Optional[LEVEL] = None
    skills: Optional[List[Skill]] = None

