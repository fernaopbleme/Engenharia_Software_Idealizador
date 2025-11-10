"use strict";

import {
  levelNames,
  stringValida as baseStringValida,
  capitalizarNome as baseCapitalizarNome,
} from "../../home/js/utils.js";

export { levelNames };

export const AUTH_KEY = "auth.user";

export function stringValida(value) {
  return baseStringValida(value);
}

export function capitalizarNome(value) {
  return baseCapitalizarNome(value);
}

export function getProjetoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

export function showElement(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("hidden");
}

export function hideElement(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("hidden");
}

export function extrairNomeDoEmail(email) {
  if (!email || typeof email !== "string") return "";
  const [parte] = email.split("@");
  if (!parte) return "";
  return parte.replace(/[._-]+/g, " ").trim();
}

export function formatSkillLevel(level) {
  if (level === null || level === undefined || level === "") return "";
  const texto = String(level).toLowerCase();
  return levelNames[texto] || level;
}

export function setSuggestionsLoading(container) {
  if (!container) return;
  container.innerHTML =
    '<p class="text-sm text-gray-500">Gerando sugestões...</p>';
}

export function renderSuggestions(container, suggestions) {
  if (!container) return;

  if (!suggestions || !suggestions.length) {
    container.innerHTML =
      '<p class="text-sm text-gray-500">Nenhuma sugestão retornada.</p>';
    return;
  }

  container.innerHTML = suggestions
    .map(
      (sugestao) => `
        <div class="border border-gray-100 bg-gray-50 p-4 rounded-lg">
          <h4 class="text-md font-semibold text-gray-900 mb-1">${
            sugestao.perfil_sugerido || "Perfil sugerido"
          }</h4>
          <p class="text-sm text-gray-600">${
            sugestao.justificativa || "Sem justificativa informada."
          }</p>
        </div>
      `
    )
    .join("");
}

export function renderSuggestionError(container, message) {
  if (!container) return;
  container.innerHTML = `
    <div class="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-4">
      Não foi possível gerar sugestões no momento.
      ${
        message
          ? `<br/><span class="text-xs text-red-700">${message}</span>`
          : ""
      }
    </div>
  `;
}

export function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
  } catch {
    return null;
  }
}

