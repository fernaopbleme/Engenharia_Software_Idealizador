"use strict";

import {
  capitalizarNome,
  extrairNomeDoEmail,
  formatSkillLevel,
  stringValida,
} from "./utils.js";

export function buildCollaboratorModel(membro, detalhes) {
  const email =
    stringValida(detalhes?.email) ||
    stringValida(membro?.collaborator_email) ||
    stringValida(membro?.email) ||
    "";

  const nome = capitalizarNome(
    detalhes?.nome ||
      detalhes?.name ||
      membro?.collaborator_name ||
      extrairNomeDoEmail(email) ||
      "Colaborador"
  );

  const skillName =
    stringValida(membro?.contributed_skill_name) ||
    stringValida(detalhes?.skill_name) ||
    "Habilidade";

  const skillNivelRaw =
    membro?.contributed_skill_level ??
    detalhes?.skill_level ??
    membro?.nivel ??
    detalhes?.nivel ??
    "";

  return {
    id:
      membro?.collaborator_id ||
      membro?.colaborador_id ||
      membro?.id ||
      detalhes?.id,
    nome,
    email: email || "E-mail não informado",
    skillName,
    skillLevel: skillNivelRaw,
    skillLevelLabel: formatSkillLevel(skillNivelRaw),
    estaNoProjeto: true,
  };
}

