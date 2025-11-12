import { getSession } from "./session.js";

export const API_BASE = "https://bdprojetos.azurewebsites.net";
export const API_COLABORADORES_BASE =
  "https://colaboradoresidealizador.azurewebsites.net/colaboradores";

export function buildAuthHeaders(extra = {}) {
  const headers = { "Content-Type": "application/json", ...extra };
  const session = getSession();
  if (session?.email) headers["X-User-Email"] = session.email;
  if (session?.token) headers["Authorization"] = `Bearer ${session.token}`;
  return headers;
}

async function fetchJson(url, options = {}, parseResponse = true) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = `HTTP ${response.status} ${response.statusText}`;
    if (parseResponse) {
      try {
        const detail = await response.json();
        if (detail?.detail) message = detail.detail;
      } catch {
        // ignore parsing issues
      }
    }
    throw new Error(message);
  }
  return parseResponse ? response.json() : null;
}

export async function apiGet(path) {
  return fetchJson(`${API_BASE}${path}`, {
    method: "GET",
    mode: "cors",
    headers: buildAuthHeaders(),
  });
}

export function getProjectsMine() {
  return apiGet("/projects/mine");
}

export async function getProjectById(id) {
  try {
    return await apiGet(`/projects/${id}`);
  } catch (error) {
    if (error?.message?.includes("405")) {
      try {
        return await apiGet(`/projects/${id}/`);
      } catch {
        // fall through to list lookup
      }
    }
    // as fallback, buscar da lista "mine" e filtrar
    const projetos = await getProjectsMine();
    const encontrado = projetos?.find?.(
      (projeto) => String(projeto?.id) === String(id)
    );
    if (encontrado) return encontrado;
    throw error;
  }
}

export function getProjectMembers(projectId) {
  return apiGet(`/projects/${projectId}/members`);
}

export async function getColaboradoresLista() {
  const response = await fetch(API_COLABORADORES_BASE);
  if (!response.ok) {
    throw new Error(`Erro ao buscar colaboradores: ${response.status}`);
  }
  return response.json();
}

export function getColaboradorById(id) {
  return fetchJson(`${API_COLABORADORES_BASE}/${id}`, {
    method: "GET",
    mode: "cors",
  });
}

