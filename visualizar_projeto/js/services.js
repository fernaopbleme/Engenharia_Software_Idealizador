"use strict";

import {
  getProjectById,
  getProjectMembers,
  // REMOVER estes dois se ainda estiverem aqui:
  // getColaboradorById,
  // getColaboradoresLista,
} from "../../home/js/api.js";
import { buildCollaboratorModel } from "./models.js";
import { stringValida } from "./utils.js";

// === NOVO: base e helpers do microserviço de colaboradores ===
const COLABS_BASE = "https://colaboradores-projects.azurewebsites.net";

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.results || payload?.items || payload?.data || [];
}

async function fetchJson(url, options = {}) {
  const resp = await fetch(url, { method: "GET", mode: "cors", ...options });
  if (!resp.ok) {
    let msg = `Erro ${resp.status}`;
    try {
      const data = await resp.json();
      if (data?.detail) msg = data.detail;
    } catch {}
    throw new Error(msg);
  }
  try {
    return await resp.json();
  } catch {
    return null;
  }
}

/**
 * Lista colaboradores globais (paginado).
 */
export async function fetchTodosColaboradores(page = 1, page_size = 50) {
  const url = `${COLABS_BASE}/collaborators?page=${page}&page_size=${page_size}`;
  const data = await fetchJson(url);
  return normalizeList(data);
}

/**
 * Busca colaborador específico priorizando email; fallback para user_id.
 * Pode retornar objeto único, array com 1 item ou null.
 */
async function searchCollaborator({ email, user_id } = {}) {
  const qs = new URLSearchParams();
  if (email) qs.set("email", email);
  else if (user_id) qs.set("user_id", user_id);
  else return null;

  const url = `${COLABS_BASE}/collaborators/search?${qs.toString()}`;
  const data = await fetchJson(url);
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  return data?.result || data?.data || data || null;
}

// === IA sugestões (inalterado) ===
const MICROSERVICE_URL =
  "https://iaidealizador.azurewebsites.net/api/v1/projetos/sugestoes";

export async function fetchProjeto(projetoId) {
  return getProjectById(projetoId);
}

/**
 * Lê membros do projeto no serviço de projetos e tenta enriquecer
 * cada membro usando o microserviço de colaboradores via /search?email=... (ou user_id).
 */
export async function fetchColaboradoresDoProjeto(projectId) {
  const membrosResponse = await getProjectMembers(projectId);
  const membros = Array.isArray(membrosResponse)
    ? membrosResponse
    : membrosResponse?.members || membrosResponse?.results || [];

  if (!membros.length) return [];

  const colaboradores = await Promise.all(
    membros.map(async (membro) => {
      // tenta por email primeiro
      const email =
        membro?.collaborator_email ||
        membro?.email ||
        membro?.usuario?.email ||
        null;

      // fallback por user_id (se existir no payload do membro)
      const userId =
        membro?.user_id ||
        membro?.collaborator_user_id ||
        membro?.usuario?.id ||
        null;

      let detalhes = null;
      try {
        if (email || userId) {
          detalhes = await searchCollaborator({ email, user_id: userId });
        }
      } catch (error) {
        console.warn("Falha ao buscar detalhes do colaborador via search:", error);
      }

      return buildCollaboratorModel(membro, detalhes);
    })
  );

  return colaboradores;
}

// (opcional) mantém para log amigável se um dia trocar payload:
function extrairListaColaboradores(resposta) {
  return normalizeList(resposta);
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {}

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

// Mantém seu endpoint de associação ao projeto como já está
const API_COLABORADORES_LEGADO =
  "https://colaboradoresidealizador.azurewebsites.net/colaboradores";

export async function adicionarColaboradorAoProjeto(colaboradorId, projetoId) {
  if (!colaboradorId || !projetoId) {
    throw new Error("Dados inválidos para adicionar colaborador");
  }

  const response = await fetch(
    `${API_COLABORADORES_LEGADO}/${colaboradorId}/projetos/${projetoId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }
  );

  if (!response.ok) {
    let detalhe = `Erro ${response.status}`;
    try {
      const erroJson = await response.json();
      if (erroJson?.detail) detalhe = erroJson.detail;
    } catch {}
    throw new Error(detalhe);
  }

  return true;
}
