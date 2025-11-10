"use strict";

import {
  getProjectById,
  getProjectMembers,
  getColaboradorById,
  getColaboradoresLista,
} from "../../home/js/api.js";
import { buildCollaboratorModel } from "./models.js";
import { stringValida } from "./utils.js";

const MICROSERVICE_URL =
  "https://iaidealizador.azurewebsites.net/api/v1/projetos/sugestoes";

export async function fetchProjeto(projetoId) {
  return getProjectById(projetoId);
}

export async function fetchColaboradoresDoProjeto(projectId) {
  const membrosResponse = await getProjectMembers(projectId);
  const membros = Array.isArray(membrosResponse)
    ? membrosResponse
    : membrosResponse?.members || membrosResponse?.results || [];

  if (!membros.length) return [];

  const colaboradores = await Promise.all(
    membros.map(async (membro) => {
      const colaboradorId =
        membro?.collaborator_id ||
        membro?.collaboratorId ||
        membro?.colaborador_id ||
        membro?.colaboradorId ||
        membro?.collaborator?.id ||
        membro?.colaborador?.id ||
        membro?.id;

      let detalhes = null;
      if (colaboradorId) {
        try {
          detalhes = await getColaboradorById(colaboradorId);
        } catch (error) {
          console.warn("Falha ao buscar detalhes do colaborador:", error);
        }
      }

      return buildCollaboratorModel(membro, detalhes);
    })
  );

  return colaboradores;
}

function extrairListaColaboradores(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;

  console.warn("Formato inesperado da resposta de colaboradores:", resposta);
  return [];
}

export async function fetchTodosColaboradores() {
  const resposta = await getColaboradoresLista();
  return extrairListaColaboradores(resposta);
}

export async function enviarProjetoParaIa(projeto, colaboradores) {
  const payload = {
    id_projeto: projeto?.id || 0,
    descricao_projeto:
      stringValida(projeto?.description) ||
      `Projeto ${stringValida(projeto?.title) || projeto?.id || ""}`,
    categoria_projeto: stringValida(projeto?.category) || "",
    participantes: (colaboradores || [])
      .filter((colab) => colab.email)
      .map((colab) => ({
        collaborator_email: colab.email,
        contributed_skill_name: colab.skillName,
        contributed_skill_level: Number(colab.skillLevel) || 0,
      })),
  };

  const response = await fetch(MICROSERVICE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    // resposta vazia
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      (typeof data === "string" && data) ||
      `Erro ${response.status}`;
    throw new Error(message);
  }

  return data?.sugestoes || [];
}

const API_COLABORADORES = "http://localhost:8002/colaboradores";

export async function adicionarColaboradorAoProjeto(colaboradorId, projetoId) {
  if (!colaboradorId || !projetoId) {
    throw new Error("Dados inválidos para adicionar colaborador");
  }

  const response = await fetch(
    `${API_COLABORADORES}/${colaboradorId}/projetos/${projetoId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    let detalhe = `Erro ${response.status}`;
    try {
      const erroJson = await response.json();
      if (erroJson?.detail) detalhe = erroJson.detail;
    } catch {
      // resposta não era JSON
    }
    throw new Error(detalhe);
  }

  return true;
}

