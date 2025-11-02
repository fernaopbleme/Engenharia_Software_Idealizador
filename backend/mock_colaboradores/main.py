from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Literal
import uvicorn

app = FastAPI(title="Mock Colaboradores API", version="1.0.0")

# Tipo para LEVEL
LEVEL = Literal["beginner", "intermediative", "advanced"]

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Base fictícia de colaboradores ---
COLABS = [
    {
        "id": 1,
        "email": "ana@example.com",
        "nome": "Ana Souza",
        "skills": [
            {"nome": "Python", "nivel": "advanced"},
            {"nome": "SQL", "nivel": "intermediate"}
        ],
        "cargo": "Desenvolvedora Backend",
        "level": "advanced"
    },
    {
        "id": 2,
        "email": "joao@example.com",
        "nome": "João Lima",
        "skills": [
            {"nome": "HTML", "nivel": "beginner"},
            {"nome": "CSS", "nivel": "beginner"}
        ],
        "cargo": "Desenvolvedor Frontend",
        "level": "beginner"
    },
    {
        "id": 3,
        "email": "bia@example.com",
        "nome": "Beatriz Costa",
        "skills": [
            {"nome": "JavaScript", "nivel": "intermediate"},
            {"nome": "React", "nivel": "intermediate"}
        ],
        "cargo": "Engenheira de Software",
        "level": "intermediative"
    },
    {
        "id": 4,
        "email": "carlos@example.com",
        "nome": "Carlos Silva",
        "skills": [
            {"nome": "DevOps", "nivel": "advanced"},
            {"nome": "Docker", "nivel": "intermediate"}
        ],
        "cargo": "DevOps Engineer",
        "level": "advanced"
    },
    {
        "id": 5,
        "email": "lucia@example.com",
        "nome": "Lúcia Santos",
        "skills": [
            {"nome": "Design UI", "nivel": "advanced"},
            {"nome": "Figma", "nivel": "intermediate"}
        ],
        "cargo": "Designer UX/UI",
        "level": "intermediative"
    }
]

# --- Mock de projetos ---
PROJECTS = [
    {
        "id": 1,
        "title": "App de Música Colaborativa",
        "description": "Plataforma web para músicos criarem juntos em tempo real. Permite gravação, mixagem e colaboração remota.",
        "category": "engenharia e música",
        "tags": [
            {"tag_id": 1, "skill_level": "intermediate"},
            {"tag_id": 2, "skill_level": "intermediate"}
        ],
        "colaboradores_inscritos": [3, 4]  # IDs dos colaboradores inscritos
    },
    {
        "id": 2,
        "title": "Sistema de Gestão DevOps",
        "description": "Dashboard para monitoramento e automação de pipelines CI/CD com análise de métricas em tempo real.",
        "category": "infraestrutura",
        "tags": [
            {"tag_id": 3, "skill_level": "advanced"},
            {"tag_id": 4, "skill_level": "intermediate"}
        ],
        "colaboradores_inscritos": [1, 4]  # IDs dos colaboradores inscritos
    },
    {
        "id": 3,
        "title": "E-commerce com Design Moderno",
        "description": "Plataforma de vendas online com foco em experiência do usuário e interface intuitiva.",
        "category": "comércio digital",
        "tags": [
            {"tag_id": 5, "skill_level": "advanced"},
            {"tag_id": 6, "skill_level": "intermediate"}
        ],
        "colaboradores_inscritos": [5]  # IDs dos colaboradores inscritos
    }
]

# Mapeamento de tag_id para nomes de skills
TAG_MAP = {
    1: "JavaScript",
    2: "React",
    3: "DevOps",
    4: "Docker",
    5: "Design UI",
    6: "Figma"
}

# === Rotas de Colaboradores ===
@app.get("/colaboradores")
def listar_colaboradores():
    """Retorna todos os colaboradores mockados"""
    return COLABS


@app.get("/colaboradores/{email}")
def get_colaborador(email: str):
    """Busca um colaborador pelo e-mail"""
    for c in COLABS:
        if c["email"].lower() == email.lower():
            return c
    raise HTTPException(status_code=404, detail="Colaborador não encontrado")


@app.get("/colaboradores/inscritos/{project_id}")
def get_colaboradores_inscritos(project_id: int):
    """Retorna colaboradores inscritos no projeto pelo ID"""
    projeto = next((p for p in PROJECTS if p["id"] == project_id), None)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    colaboradores_inscritos_ids = projeto.get("colaboradores_inscritos", [])
    colaboradores_inscritos = []
    
    for colab in COLABS:
        if colab["id"] in colaboradores_inscritos_ids:
            colaboradores_inscritos.append({
                "id": colab["id"],
                "nome": colab["nome"],
                "email": colab["email"],
                "cargo": colab["cargo"],
                "level": colab.get("level", "beginner"),
                "skills": colab["skills"]
            })
    
    return {
        "projeto": {
            "id": projeto["id"],
            "title": projeto["title"]
        },
        "colaboradores": colaboradores_inscritos
    }


@app.get("/colaboradores/por-projeto/{project_id}")
def get_colaboradores_por_projeto(project_id: int):
    """Retorna colaboradores que se encaixam no projeto pelo ID"""
    projeto = next((p for p in PROJECTS if p["id"] == project_id), None)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    
    # Extrair skills necessárias do projeto
    skills_necessarias = []
    for tag in projeto["tags"]:
        skill_name = TAG_MAP.get(tag["tag_id"])
        skill_level = tag["skill_level"]
        if skill_name:
            skills_necessarias.append({"nome": skill_name, "nivel_minimo": skill_level})
    
    # Nível hierárquico
    nivel_hierarchy = {"beginner": 1, "intermediate": 2, "advanced": 3}
    
    # Filtrar colaboradores que têm as skills necessárias
    colaboradores_compatíveis = []
    for colab in COLABS:
        score = 0
        skills_match = []
        
        for skill_nec in skills_necessarias:
            for skill_colab in colab["skills"]:
                if skill_colab["nome"].lower() == skill_nec["nome"].lower():
                    # Verificar se o nível do colaborador atende ao mínimo
                    colab_level = nivel_hierarchy.get(skill_colab["nivel"], 1)
                    nec_level = nivel_hierarchy.get(skill_nec["nivel_minimo"], 1)
                    
                    if colab_level >= nec_level:
                        score += colab_level
                        skills_match.append({
                            "nome": skill_colab["nome"],
                            "nivel": skill_colab["nivel"],
                            "nivel_necessario": skill_nec["nivel_minimo"]
                        })
        
        # Se tiver pelo menos uma skill compatível, incluir
        if skills_match:
            colaborador_result = {
                "id": colab["id"],
                "nome": colab["nome"],
                "email": colab["email"],
                "cargo": colab["cargo"],
                "skills_match": skills_match,
                "score_match": score
            }
            colaboradores_compatíveis.append(colaborador_result)
    
    # Ordenar por score (maior primeiro)
    colaboradores_compatíveis.sort(key=lambda x: x["score_match"], reverse=True)
    
    return {
        "projeto": {
            "id": projeto["id"],
            "title": projeto["title"],
            "description": projeto["description"]
        },
        "colaboradores": colaboradores_compatíveis
    }


# === Rotas de Projetos ===
@app.get("/projects")
def listar_projetos():
    """Retorna todos os projetos mockados"""
    return PROJECTS


@app.get("/projects/{project_id}")
def get_projeto(project_id: int):
    """Busca um projeto pelo ID"""
    projeto = next((p for p in PROJECTS if p["id"] == project_id), None)
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


if __name__ == '__main__':
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)