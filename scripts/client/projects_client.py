import httpx
from typing import Dict, List, Optional
import os

# URL base da API de projetos (pode ser configurada via variável de ambiente)
PROJECTS_API_BASE_URL = os.getenv("PROJECTS_API_URL", "http://localhost:8001")

async def get_project(project_id: int) -> Optional[Dict]:
    """Busca um projeto pelo ID na API de projetos"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{PROJECTS_API_BASE_URL}/projects/{project_id}")
            if response.status_code == 404:
                return None
            response.raise_for_status()
            return response.json()
    except httpx.RequestError:
        return None
    except httpx.HTTPStatusError:
        return None

async def list_projects() -> List[Dict]:
    """Lista todos os projetos da API de projetos"""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{PROJECTS_API_BASE_URL}/projects")
            response.raise_for_status()
            return response.json()
    except (httpx.RequestError, httpx.HTTPStatusError):
        return []

async def get_project_tags(project_id: int) -> List[Dict]:
    """Busca as tags de um projeto"""
    projeto = await get_project(project_id)
    if not projeto:
        return []
    return projeto.get("tags", [])

