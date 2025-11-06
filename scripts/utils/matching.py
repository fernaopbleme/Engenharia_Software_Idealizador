"""Utilitários para matching de colaboradores com projetos"""
from typing import List, Dict


def extract_skills_from_tags(tags: List[Dict]) -> List[Dict]:
    """
    Extrai skills necessárias das tags do projeto
    
    Args:
        tags: Lista de tags do projeto
        
    Returns:
        Lista de dicionários com nome e nível mínimo da skill
    """
    skills_necessarias = []
    for tag in tags:
        # Tentar obter nome da skill de diferentes formatos
        skill_name = None
        if "nome" in tag:
            skill_name = tag["nome"]
        elif "tag_id" in tag:
            # Se tiver tag_id, assumir que pode ter um campo "skill_name" ou similar
            skill_name = tag.get("skill_name") or tag.get("name")
        
        if skill_name:
            skill_level = tag.get("skill_level") or tag.get("level", "intermediate")
            skills_necessarias.append({"nome": skill_name, "nivel_minimo": skill_level})
    
    return skills_necessarias


def match_colaboradores_com_projeto(
    colaboradores: List[Dict], 
    skills_necessarias: List[Dict]
) -> List[Dict]:
    """
    Encontra colaboradores que se encaixam no projeto baseado nas skills necessárias
    
    Args:
        colaboradores: Lista de todos os colaboradores
        skills_necessarias: Lista de skills necessárias com nível mínimo
        
    Returns:
        Lista de colaboradores compatíveis ordenados por score
    """
    # Nível hierárquico para comparação
    nivel_hierarchy = {"beginner": 1, "intermediate": 2, "advanced": 3}
    
    colaboradores_compatíveis = []
    
    for colab in colaboradores:
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
    
    return colaboradores_compatíveis

